/**
 * Agent Stream WebSocket Handler
 * Provides real-time streaming of agent research progress
 *
 * Based on Supabase WebSocket support (Nov 2025)
 * Reference: https://supabase.com/docs/guides/functions/websockets
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentProgressEvent {
  type: 'agent_start' | 'agent_iteration' | 'agent_tool_use' | 'agent_reflection' | 'agent_complete' | 'agent_error' | 'system_message';
  agentId: string;
  agentName: string;
  timestamp: string;
  data: {
    iteration?: number;
    maxIterations?: number;
    tool?: string;
    toolResult?: string;
    confidence?: number;
    status?: string;
    message?: string;
    duration?: number;
    cost?: number;
  };
}

// In-memory store for active WebSocket connections
// Key: sessionId, Value: WebSocket
const activeConnections = new Map<string, WebSocket>();

serve(async (req) => {
  const url = new URL(req.url);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Check if this is a WebSocket upgrade request
  const upgrade = req.headers.get('upgrade') || '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket upgrade', {
      status: 426,
      headers: corsHeaders
    });
  }

  // Get session ID from query params
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) {
    return new Response('Missing sessionId parameter', {
      status: 400,
      headers: corsHeaders
    });
  }

  // Upgrade to WebSocket
  const { socket, response } = Deno.upgradeWebSocket(req);

  // Store the connection
  activeConnections.set(sessionId, socket);

  socket.onopen = () => {
    console.log(`[WebSocket] Client connected: ${sessionId}`);

    // Send initial connection confirmation
    socket.send(JSON.stringify({
      type: 'system_message',
      agentId: 'system',
      agentName: 'System',
      timestamp: new Date().toISOString(),
      data: {
        status: 'connected',
        message: 'WebSocket connection established. Waiting for agent research to begin...'
      }
    }));
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log(`[WebSocket] Received message from ${sessionId}:`, message.type);

      // Handle ping/pong for keepalive
      if (message.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (error) {
      console.error(`[WebSocket] Error parsing message:`, error);
    }
  };

  socket.onclose = () => {
    console.log(`[WebSocket] Client disconnected: ${sessionId}`);
    activeConnections.delete(sessionId);
  };

  socket.onerror = (error) => {
    console.error(`[WebSocket] Error for ${sessionId}:`, error);
    activeConnections.delete(sessionId);
  };

  return response;
});

/**
 * Send progress event to connected client
 * Called from multi-agent-spec function during research
 */
export function sendProgressEvent(sessionId: string, event: AgentProgressEvent) {
  const socket = activeConnections.get(sessionId);

  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(event));
      console.log(`[WebSocket] Sent ${event.type} to ${sessionId}: ${event.agentName}`);
    } catch (error) {
      console.error(`[WebSocket] Error sending event:`, error);
    }
  } else {
    console.warn(`[WebSocket] No active connection for session ${sessionId}`);
  }
}

/**
 * Broadcast event to all connected clients (admin/debug)
 */
export function broadcastEvent(event: AgentProgressEvent) {
  activeConnections.forEach((socket, sessionId) => {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(event));
      } catch (error) {
        console.error(`[WebSocket] Error broadcasting to ${sessionId}:`, error);
      }
    }
  });
}
