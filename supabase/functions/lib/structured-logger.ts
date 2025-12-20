/**
 * Structured Logger for Multi-Agent Pipeline
 * Phase 5.2 - Standardized logs with request IDs, model IDs, and latency
 *
 * Usage:
 *   const logger = createLogger('stage-name', requestId);
 *   logger.info('Starting stage');
 *   logger.metric('latency_ms', 1234);
 *   logger.error('Something failed', error);
 */

export interface LogContext {
  requestId: string;
  stage: string;
  userId?: string;
  model?: string;
  [key: string]: unknown;
}

export interface StructuredLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: LogContext;
  metrics?: Record<string, number>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void;
  metric(name: string, value: number): void;
  setModel(model: string): void;
  setUserId(userId: string): void;
  child(stage: string): Logger;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Create a structured logger for a pipeline stage
 */
export function createLogger(stage: string, requestId?: string): Logger {
  const context: LogContext = {
    requestId: requestId || generateRequestId(),
    stage,
  };

  const metrics: Record<string, number> = {};

  function formatLog(level: StructuredLog['level'], message: string, data?: Record<string, unknown>, error?: Error): void {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...context, ...data },
    };

    if (Object.keys(metrics).length > 0) {
      log.metrics = { ...metrics };
    }

    if (error) {
      log.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Output as JSON for log aggregation
    const prefix = `[${context.stage}]`;
    const contextStr = context.model ? ` model=${context.model}` : '';
    const metricsStr = log.metrics ? ` metrics=${JSON.stringify(log.metrics)}` : '';

    switch (level) {
      case 'debug':
        console.debug(`${prefix}${contextStr} ${message}${metricsStr}`, data ? JSON.stringify(data) : '');
        break;
      case 'info':
        console.log(`${prefix}${contextStr} ${message}${metricsStr}`, data ? JSON.stringify(data) : '');
        break;
      case 'warn':
        console.warn(`${prefix}${contextStr} ${message}${metricsStr}`, data ? JSON.stringify(data) : '');
        break;
      case 'error':
        console.error(`${prefix}${contextStr} ${message}${metricsStr}`, error || '', data ? JSON.stringify(data) : '');
        break;
    }
  }

  const logger: Logger = {
    debug(message: string, data?: Record<string, unknown>) {
      formatLog('debug', message, data);
    },

    info(message: string, data?: Record<string, unknown>) {
      formatLog('info', message, data);
    },

    warn(message: string, data?: Record<string, unknown>) {
      formatLog('warn', message, data);
    },

    error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
      const err = error instanceof Error ? error : new Error(String(error));
      formatLog('error', message, data, err);
    },

    metric(name: string, value: number) {
      metrics[name] = value;
      console.log(`[${context.stage}] metric: ${name}=${value}`);
    },

    setModel(model: string) {
      context.model = model;
    },

    setUserId(userId: string) {
      context.userId = userId;
    },

    child(childStage: string): Logger {
      return createLogger(`${context.stage}:${childStage}`, context.requestId);
    },
  };

  return logger;
}

/**
 * Stage timing helper
 */
export function createTimer() {
  const startTime = Date.now();
  let lastLap = startTime;

  return {
    elapsed(): number {
      return Date.now() - startTime;
    },
    lap(): number {
      const now = Date.now();
      const lapTime = now - lastLap;
      lastLap = now;
      return lapTime;
    },
    reset(): void {
      lastLap = Date.now();
    },
  };
}

/**
 * Pipeline tracing context
 */
export interface PipelineTrace {
  requestId: string;
  startTime: number;
  stages: {
    name: string;
    startTime: number;
    endTime?: number;
    model?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
  }[];
}

export function createPipelineTrace(requestId?: string): PipelineTrace {
  return {
    requestId: requestId || generateRequestId(),
    startTime: Date.now(),
    stages: [],
  };
}

export function startStageTrace(trace: PipelineTrace, stageName: string): number {
  const stageIndex = trace.stages.length;
  trace.stages.push({
    name: stageName,
    startTime: Date.now(),
    status: 'running',
  });
  return stageIndex;
}

export function completeStageTrace(trace: PipelineTrace, stageIndex: number, model?: string): void {
  const stage = trace.stages[stageIndex];
  if (stage) {
    stage.endTime = Date.now();
    stage.status = 'completed';
    if (model) stage.model = model;
  }
}

export function failStageTrace(trace: PipelineTrace, stageIndex: number, error: string): void {
  const stage = trace.stages[stageIndex];
  if (stage) {
    stage.endTime = Date.now();
    stage.status = 'failed';
    stage.error = error;
  }
}

export function getTraceReport(trace: PipelineTrace): string {
  const totalDuration = Date.now() - trace.startTime;
  const lines: string[] = [
    `Pipeline Trace: ${trace.requestId}`,
    `Total Duration: ${totalDuration}ms`,
    '',
    '| Stage | Duration | Model | Status |',
    '|-------|----------|-------|--------|',
  ];

  for (const stage of trace.stages) {
    const duration = stage.endTime ? stage.endTime - stage.startTime : 'N/A';
    const model = stage.model || '-';
    const status = stage.status === 'completed' ? '✅' : stage.status === 'failed' ? '❌' : '⏳';
    lines.push(`| ${stage.name} | ${duration}ms | ${model} | ${status} |`);
  }

  return lines.join('\n');
}
