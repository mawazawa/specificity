/**
 * Stream Event Emitter
 * Sends real-time progress events during agent research
 * Integrates with agent-stream WebSocket function
 */

export interface StreamEvent {
  type: 'agent_start' | 'agent_iteration' | 'agent_tool_use' | 'agent_reflection' | 'agent_complete' | 'agent_error' | 'system_message';
  agentId: string;
  agentName: string;
  timestamp: string;
  data: Record<string, any>;
}

export class StreamEmitter {
  private sessionId: string | null = null;
  private enabled: boolean = false;
  private baseUrl: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || null;
    this.enabled = !!sessionId;

    // Get the edge function URL (same origin for now, can be configured)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    this.baseUrl = supabaseUrl ? `${supabaseUrl}/functions/v1` : '';
  }

  /**
   * Send progress event via HTTP POST to WebSocket relay
   * (Alternative to direct WebSocket access from within edge function)
   */
  async emit(event: Omit<StreamEvent, 'timestamp'>): Promise<void> {
    if (!this.enabled || !this.sessionId) {
      return; // Silently skip if streaming not enabled
    }

    const fullEvent: StreamEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    try {
      // For now, just log (WebSocket relay would be separate service)
      console.log(`[StreamEmitter] ${event.type}: ${event.agentName}`, event.data);

      // In production, this would POST to a relay service that forwards to WebSocket
      // For edge functions, we can use Supabase Realtime as alternative
    } catch (error) {
      console.error('[StreamEmitter] Failed to emit event:', error);
      // Don't throw - streaming failures shouldn't break research
    }
  }

  /**
   * Agent started research
   */
  async agentStart(agentId: string, agentName: string, questions: number): Promise<void> {
    await this.emit({
      type: 'agent_start',
      agentId,
      agentName,
      data: {
        status: 'started',
        questionsAssigned: questions,
        message: `${agentName} started research on ${questions} question(s)`
      }
    });
  }

  /**
   * Agent completed an iteration
   */
  async agentIteration(
    agentId: string,
    agentName: string,
    iteration: number,
    maxIterations: number,
    action: string
  ): Promise<void> {
    await this.emit({
      type: 'agent_iteration',
      agentId,
      agentName,
      data: {
        iteration,
        maxIterations,
        action,
        progress: Math.round((iteration / maxIterations) * 100),
        message: `Iteration ${iteration}/${maxIterations}: ${action}`
      }
    });
  }

  /**
   * Agent used a tool
   */
  async agentToolUse(
    agentId: string,
    agentName: string,
    tool: string,
    params: Record<string, any>,
    success: boolean,
    duration: number
  ): Promise<void> {
    await this.emit({
      type: 'agent_tool_use',
      agentId,
      agentName,
      data: {
        tool,
        params,
        success,
        duration,
        message: `Using tool: ${tool}${success ? ' ✓' : ' ✗'}`
      }
    });
  }

  /**
   * Agent self-reflection checkpoint
   */
  async agentReflection(
    agentId: string,
    agentName: string,
    iteration: number,
    confidence?: number
  ): Promise<void> {
    await this.emit({
      type: 'agent_reflection',
      agentId,
      agentName,
      data: {
        iteration,
        confidence,
        message: `Self-reflection checkpoint (iteration ${iteration})${confidence ? ` - Confidence: ${confidence}%` : ''}`
      }
    });
  }

  /**
   * Agent completed research
   */
  async agentComplete(
    agentId: string,
    agentName: string,
    iterations: number,
    confidence: number | undefined,
    toolsUsed: number,
    duration: number,
    cost: number
  ): Promise<void> {
    await this.emit({
      type: 'agent_complete',
      agentId,
      agentName,
      data: {
        status: 'complete',
        iterations,
        confidence,
        toolsUsed,
        duration,
        cost,
        message: `✓ Research complete (${iterations} iterations, ${toolsUsed} tools, $${cost.toFixed(4)})`
      }
    });
  }

  /**
   * Agent encountered error
   */
  async agentError(
    agentId: string,
    agentName: string,
    error: string
  ): Promise<void> {
    await this.emit({
      type: 'agent_error',
      agentId,
      agentName,
      data: {
        status: 'error',
        error,
        message: `Error: ${error}`
      }
    });
  }

  /**
   * System message
   */
  async systemMessage(message: string, data?: Record<string, any>): Promise<void> {
    await this.emit({
      type: 'system_message',
      agentId: 'system',
      agentName: 'System',
      data: {
        message,
        ...data
      }
    });
  }
}

/**
 * Create emitter from request context
 */
export function createEmitter(sessionId?: string): StreamEmitter {
  return new StreamEmitter(sessionId);
}
