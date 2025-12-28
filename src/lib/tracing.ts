/**
 * Distributed Tracing for Spec Generation
 * Correlates events across the multi-agent pipeline
 * Action 26: 89% confidence
 */

import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env-validation';

// ============================================
// TYPES
// ============================================

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sessionId: string;
  startTime: number;
}

export interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  attributes: Record<string, unknown>;
  events: SpanEvent[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, unknown>;
}

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate a unique trace ID (32 hex chars)
 */
export function generateTraceId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a span ID (16 hex chars)
 */
export function generateSpanId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================
// TRACER CLASS
// ============================================

/**
 * Distributed tracer for spec generation pipeline
 */
export class SpecGenerationTracer {
  private traceId: string;
  private sessionId: string;
  private spans: Map<string, Span> = new Map();
  private rootSpanId: string;
  private currentSpanId: string;

  constructor(sessionId: string, existingTraceId?: string) {
    this.traceId = existingTraceId || generateTraceId();
    this.sessionId = sessionId;
    this.rootSpanId = generateSpanId();
    this.currentSpanId = this.rootSpanId;

    // Create root span
    this.spans.set(this.rootSpanId, {
      spanId: this.rootSpanId,
      traceId: this.traceId,
      name: 'spec-generation',
      startTime: Date.now(),
      status: 'pending',
      attributes: { sessionId },
      events: [],
    });

    // Set Sentry trace context
    Sentry.setTag('trace_id', this.traceId);
    Sentry.setTag('session_id', sessionId);
  }

  /**
   * Get current trace context for propagation
   */
  getTraceContext(): TraceContext {
    return {
      traceId: this.traceId,
      spanId: this.currentSpanId,
      parentSpanId: this.rootSpanId,
      sessionId: this.sessionId,
      startTime: Date.now(),
    };
  }

  /**
   * Get trace ID for API headers
   */
  getTraceHeaders(): Record<string, string> {
    return {
      'x-trace-id': this.traceId,
      'x-span-id': this.currentSpanId,
      'x-session-id': this.sessionId,
    };
  }

  /**
   * Start a new span (stage)
   */
  startSpan(
    name: string,
    attributes?: Record<string, unknown>
  ): string {
    const spanId = generateSpanId();
    const parentSpanId = this.currentSpanId;

    this.spans.set(spanId, {
      spanId,
      traceId: this.traceId,
      parentSpanId,
      name,
      startTime: Date.now(),
      status: 'pending',
      attributes: { ...attributes },
      events: [],
    });

    this.currentSpanId = spanId;

    Sentry.addBreadcrumb({
      category: 'trace',
      message: `Started: ${name}`,
      level: 'info',
      data: { spanId, traceId: this.traceId },
    });

    return spanId;
  }

  /**
   * End a span
   */
  endSpan(spanId: string, status: 'success' | 'error' = 'success'): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    // Restore parent as current
    if (span.parentSpanId) {
      this.currentSpanId = span.parentSpanId;
    }

    Sentry.addBreadcrumb({
      category: 'trace',
      message: `Ended: ${span.name}`,
      level: status === 'error' ? 'error' : 'info',
      data: {
        spanId,
        duration: span.duration,
        status,
      },
    });
  }

  /**
   * Add an event to the current span
   */
  addEvent(name: string, attributes?: Record<string, unknown>): void {
    const span = this.spans.get(this.currentSpanId);
    if (!span) return;

    span.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });

    Sentry.addBreadcrumb({
      category: 'trace-event',
      message: name,
      level: 'info',
      data: attributes,
    });
  }

  /**
   * Set attribute on current span
   */
  setAttribute(key: string, value: unknown): void {
    const span = this.spans.get(this.currentSpanId);
    if (span) {
      span.attributes[key] = value;
    }
  }

  /**
   * Record an error on current span
   */
  recordError(error: Error): void {
    const span = this.spans.get(this.currentSpanId);
    if (span) {
      span.status = 'error';
      span.attributes['error.message'] = error.message;
      span.attributes['error.name'] = error.name;
    }

    Sentry.captureException(error, {
      tags: {
        trace_id: this.traceId,
        span_id: this.currentSpanId,
      },
    });
  }

  /**
   * End the trace and return summary
   */
  endTrace(): TraceSummary {
    // End root span
    const rootSpan = this.spans.get(this.rootSpanId);
    if (rootSpan) {
      rootSpan.endTime = Date.now();
      rootSpan.duration = rootSpan.endTime - rootSpan.startTime;
      rootSpan.status = this.hasErrors() ? 'error' : 'success';
    }

    return this.getSummary();
  }

  /**
   * Check if any spans have errors
   */
  private hasErrors(): boolean {
    for (const span of this.spans.values()) {
      if (span.status === 'error') return true;
    }
    return false;
  }

  /**
   * Get trace summary
   */
  getSummary(): TraceSummary {
    const spans = Array.from(this.spans.values());
    const completedSpans = spans.filter((s) => s.endTime);
    const durations = completedSpans.map((s) => s.duration || 0);
    const totalDuration = durations.reduce((a, b) => a + b, 0);

    const stageSpans = spans.filter(
      (s) => s.name !== 'spec-generation' && s.duration
    );
    const slowestStage = stageSpans.reduce(
      (max, s) => ((s.duration || 0) > (max?.duration || 0) ? s : max),
      null as Span | null
    );

    return {
      traceId: this.traceId,
      sessionId: this.sessionId,
      totalDuration,
      spanCount: spans.length,
      errorCount: spans.filter((s) => s.status === 'error').length,
      slowestStage: slowestStage?.name,
      slowestStageDuration: slowestStage?.duration,
      spans: spans.map((s) => ({
        name: s.name,
        duration: s.duration,
        status: s.status,
        eventCount: s.events.length,
      })),
    };
  }

  /**
   * Export trace for debugging
   */
  exportTrace(): ExportedTrace {
    return {
      traceId: this.traceId,
      sessionId: this.sessionId,
      spans: Array.from(this.spans.values()),
      exportedAt: Date.now(),
    };
  }
}

// ============================================
// SUMMARY TYPES
// ============================================

export interface TraceSummary {
  traceId: string;
  sessionId: string;
  totalDuration: number;
  spanCount: number;
  errorCount: number;
  slowestStage?: string;
  slowestStageDuration?: number;
  spans: Array<{
    name: string;
    duration?: number;
    status: string;
    eventCount: number;
  }>;
}

export interface ExportedTrace {
  traceId: string;
  sessionId: string;
  spans: Span[];
  exportedAt: number;
}

// ============================================
// FACTORY & HELPERS
// ============================================

/**
 * Create a new tracer for a spec generation session
 */
export function createTracer(sessionId: string): SpecGenerationTracer {
  return new SpecGenerationTracer(sessionId);
}

/**
 * Parse trace context from API response headers
 */
export function parseTraceHeaders(
  headers: Headers
): Partial<TraceContext> | null {
  const traceId = headers.get('x-trace-id');
  const spanId = headers.get('x-span-id');
  const sessionId = headers.get('x-session-id');

  if (!traceId) return null;

  return {
    traceId,
    spanId: spanId || undefined,
    sessionId: sessionId || undefined,
  };
}

/**
 * Format trace ID for display (shortened)
 */
export function formatTraceId(traceId: string): string {
  return traceId.slice(0, 8);
}

/**
 * Log trace summary to console (dev mode)
 */
export function logTraceSummary(summary: TraceSummary): void {
  if (env.DEV) {
    logger.info(`🔍 Trace: ${formatTraceId(summary.traceId)}`);
    logger.info(`Total Duration: ${(summary.totalDuration / 1000).toFixed(2)}s`);
    logger.info(`Spans: ${summary.spanCount}, Errors: ${summary.errorCount}`);
    if (summary.slowestStage) {
      logger.info(
        `Slowest: ${summary.slowestStage} (${(summary.slowestStageDuration || 0) / 1000}s)`
      );
    }
    logger.info('Trace spans:', summary.spans);
  }
}
