import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Search,
  Zap,
  Activity
} from 'lucide-react';

interface AgentProgress {
  agentId: string;
  agentName: string;
  status: 'idle' | 'active' | 'complete' | 'error';
  iteration: number;
  maxIterations: number;
  currentAction: string;
  toolsUsed: string[];
  confidence?: number;
  duration?: number;
  cost?: number;
}

interface StreamEvent {
  type: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  data: Record<string, any>;
}

interface LiveAgentDashboardProps {
  sessionId: string;
  onComplete?: () => void;
}

export function LiveAgentDashboard({ sessionId, onComplete }: LiveAgentDashboardProps) {
  const [agents, setAgents] = useState<Map<string, AgentProgress>>(new Map());
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Determine WebSocket URL based on environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const wsProtocol = supabaseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = supabaseUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${wsHost}/functions/v1/agent-stream?sessionId=${sessionId}`;

    console.log('[LiveAgentDashboard] Connecting to:', wsUrl);

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[LiveAgentDashboard] WebSocket connected');
        setConnected(true);

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        return () => clearInterval(pingInterval);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: StreamEvent = JSON.parse(event.data);
          console.log('[LiveAgentDashboard] Received:', message.type, message.agentName);

          handleEvent(message);
        } catch (error) {
          console.error('[LiveAgentDashboard] Error parsing message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('[LiveAgentDashboard] WebSocket error:', error);
        setConnected(false);
      };

      ws.current.onclose = () => {
        console.log('[LiveAgentDashboard] WebSocket closed');
        setConnected(false);
      };
    } catch (error) {
      console.error('[LiveAgentDashboard] Failed to create WebSocket:', error);
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [sessionId]);

  const handleEvent = (event: StreamEvent) => {
    // Add to events log
    setEvents((prev) => [...prev.slice(-49), event]); // Keep last 50 events

    // Update agent state
    setAgents((prev) => {
      const updated = new Map(prev);
      const agent = updated.get(event.agentId) || {
        agentId: event.agentId,
        agentName: event.agentName,
        status: 'idle' as const,
        iteration: 0,
        maxIterations: 15,
        currentAction: '',
        toolsUsed: []
      };

      switch (event.type) {
        case 'agent_start':
          agent.status = 'active';
          agent.currentAction = 'Starting research...';
          break;

        case 'agent_iteration':
          agent.iteration = event.data.iteration || agent.iteration;
          agent.maxIterations = event.data.maxIterations || agent.maxIterations;
          agent.currentAction = event.data.action || event.data.message;
          agent.status = 'active';
          break;

        case 'agent_tool_use':
          agent.toolsUsed = [...agent.toolsUsed, event.data.tool];
          agent.currentAction = event.data.message;
          agent.status = 'active';
          break;

        case 'agent_reflection':
          agent.confidence = event.data.confidence;
          agent.currentAction = event.data.message;
          agent.status = 'active';
          break;

        case 'agent_complete':
          agent.status = 'complete';
          agent.confidence = event.data.confidence;
          agent.duration = event.data.duration;
          agent.cost = event.data.cost;
          agent.currentAction = 'Complete';
          break;

        case 'agent_error':
          agent.status = 'error';
          agent.currentAction = event.data.error;
          break;
      }

      updated.set(event.agentId, agent);

      // Calculate overall progress
      const totalAgents = updated.size;
      const completeAgents = Array.from(updated.values()).filter(a => a.status === 'complete').length;
      setOverallProgress(totalAgents > 0 ? (completeAgents / totalAgents) * 100 : 0);

      // Check if all complete
      if (completeAgents === totalAgents && totalAgents > 0 && onComplete) {
        setTimeout(() => onComplete(), 1000);
      }

      return updated;
    });
  };

  const agentArray = Array.from(agents.values());
  const completeCount = agentArray.filter(a => a.status === 'complete').length;
  const activeCount = agentArray.filter(a => a.status === 'active').length;
  const errorCount = agentArray.filter(a => a.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Connected</p>
              <p className="text-2xl font-bold">{connected ? '✓' : '✗'}</p>
            </div>
            <Activity className={`h-8 w-8 ${connected ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Complete</p>
              <p className="text-2xl font-bold">{completeCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold">{errorCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Overall Progress */}
      {agentArray.length > 0 && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {completeCount} / {agentArray.length} agents complete
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </Card>
      )}

      {/* Agent Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agentArray.map((agent) => (
          <Card key={agent.agentId} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{agent.agentName}</h3>
              </div>
              {agent.status === 'active' && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
              {agent.status === 'complete' && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {agent.status === 'error' && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Iteration</span>
                <span className="font-medium">
                  {agent.iteration} / {agent.maxIterations}
                </span>
              </div>
              <Progress
                value={(agent.iteration / agent.maxIterations) * 100}
                className="h-1"
              />
            </div>

            <p className="text-sm text-muted-foreground">{agent.currentAction}</p>

            {agent.toolsUsed.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                {agent.toolsUsed.slice(-3).map((tool, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tool}
                  </Badge>
                ))}
                {agent.toolsUsed.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{agent.toolsUsed.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {agent.confidence !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-medium">{agent.confidence}%</span>
              </div>
            )}

            {agent.cost !== undefined && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Cost: ${agent.cost.toFixed(4)}</span>
                {agent.duration && (
                  <span>Time: {(agent.duration / 1000).toFixed(1)}s</span>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Event Log */}
      {events.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Event Log</h3>
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {events.slice().reverse().map((event, idx) => (
                <div key={idx} className="text-xs font-mono border-l-2 border-muted pl-2 py-1">
                  <span className="text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  {' '}
                  <span className="font-medium">{event.agentName}</span>
                  {' '}
                  <span className="text-muted-foreground">→</span>
                  {' '}
                  {event.data.message || event.type}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
