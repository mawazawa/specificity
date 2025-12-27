/**
 * Stage Performance Monitoring
 * Tracks timing and progress for spec generation stages
 * Action 28: 87% confidence
 */

import * as Sentry from '@sentry/react';

// ============================================
// TYPES
// ============================================

export type StageName =
  | 'questions'
  | 'research'
  | 'challenge'
  | 'synthesis'
  | 'review'
  | 'voting'
  | 'spec'
  | 'chat';

interface StageMetrics {
  stage: StageName;
  startTime: number;
  endTime?: number;
  duration?: number;
  agentTimes: Record<string, number>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

interface PerformanceReport {
  sessionId: string;
  totalDuration: number;
  stages: StageMetrics[];
  averageStageDuration: number;
  slowestStage: StageName | null;
  fastestStage: StageName | null;
}

// ============================================
// STAGE BENCHMARKS
// ============================================

/**
 * Expected duration for each stage (in ms)
 * Based on production data analysis
 */
export const STAGE_BENCHMARKS: Record<StageName, { expected: number; warning: number; critical: number }> = {
  questions: { expected: 15000, warning: 30000, critical: 60000 },
  research: { expected: 120000, warning: 180000, critical: 300000 },
  challenge: { expected: 180000, warning: 300000, critical: 480000 },
  synthesis: { expected: 60000, warning: 120000, critical: 180000 },
  review: { expected: 30000, warning: 60000, critical: 120000 },
  voting: { expected: 20000, warning: 40000, critical: 60000 },
  spec: { expected: 45000, warning: 90000, critical: 150000 },
  chat: { expected: 10000, warning: 30000, critical: 60000 },
};

// ============================================
// PERFORMANCE TRACKER CLASS
// ============================================

export class StagePerformanceTracker {
  private sessionId: string;
  private stages: Map<StageName, StageMetrics> = new Map();
  private currentStage: StageName | null = null;
  private sessionStartTime: number;
  private onSlowStage?: (stage: StageName, duration: number, severity: 'warning' | 'critical') => void;

  constructor(
    sessionId: string,
    options?: {
      onSlowStage?: (stage: StageName, duration: number, severity: 'warning' | 'critical') => void;
    }
  ) {
    this.sessionId = sessionId;
    this.sessionStartTime = Date.now();
    this.onSlowStage = options?.onSlowStage;
  }

  /**
   * Start tracking a stage
   */
  startStage(stage: StageName): void {
    // Complete previous stage if running
    if (this.currentStage && this.currentStage !== stage) {
      this.completeStage(this.currentStage);
    }

    this.currentStage = stage;
    this.stages.set(stage, {
      stage,
      startTime: Date.now(),
      agentTimes: {},
      status: 'running',
    });

    this.addBreadcrumb('stage_start', stage);
    this.markPerformance(`stage:${stage}:start`);
  }

  /**
   * Record agent processing time within a stage
   */
  recordAgentTime(agentName: string, durationMs: number): void {
    if (!this.currentStage) return;

    const metrics = this.stages.get(this.currentStage);
    if (metrics) {
      metrics.agentTimes[agentName] = durationMs;
    }
  }

  /**
   * Complete a stage
   */
  completeStage(stage: StageName, error?: string): void {
    const metrics = this.stages.get(stage);
    if (!metrics) return;

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.status = error ? 'failed' : 'completed';
    metrics.error = error;

    if (stage === this.currentStage) {
      this.currentStage = null;
    }

    this.markPerformance(`stage:${stage}:end`);
    this.measurePerformance(`stage:${stage}`, `stage:${stage}:start`, `stage:${stage}:end`);
    this.addBreadcrumb(error ? 'stage_error' : 'stage_complete', stage, {
      duration: metrics.duration,
      error,
    });

    // Check for slow stage
    this.checkSlowStage(stage, metrics.duration);
  }

  /**
   * Check if stage is slow and trigger callback
   */
  private checkSlowStage(stage: StageName, duration: number): void {
    const benchmark = STAGE_BENCHMARKS[stage];

    if (duration >= benchmark.critical) {
      this.onSlowStage?.(stage, duration, 'critical');
      this.reportToSentry(stage, duration, 'critical');
    } else if (duration >= benchmark.warning) {
      this.onSlowStage?.(stage, duration, 'warning');
      this.reportToSentry(stage, duration, 'warning');
    }
  }

  /**
   * Report slow stage to Sentry
   */
  private reportToSentry(
    stage: StageName,
    duration: number,
    severity: 'warning' | 'critical'
  ): void {
    Sentry.captureMessage(`Slow stage: ${stage}`, {
      level: severity === 'critical' ? 'error' : 'warning',
      tags: {
        stage,
        severity,
        sessionId: this.sessionId,
      },
      extra: {
        duration,
        expected: STAGE_BENCHMARKS[stage].expected,
        threshold: severity === 'critical'
          ? STAGE_BENCHMARKS[stage].critical
          : STAGE_BENCHMARKS[stage].warning,
      },
    });
  }

  /**
   * Get estimated time remaining for current stage
   */
  getEstimatedTimeRemaining(): number | null {
    if (!this.currentStage) return null;

    const metrics = this.stages.get(this.currentStage);
    if (!metrics) return null;

    const elapsed = Date.now() - metrics.startTime;
    const expected = STAGE_BENCHMARKS[this.currentStage].expected;

    return Math.max(0, expected - elapsed);
  }

  /**
   * Get progress percentage for current stage
   */
  getStageProgress(): number {
    if (!this.currentStage) return 0;

    const metrics = this.stages.get(this.currentStage);
    if (!metrics) return 0;

    const elapsed = Date.now() - metrics.startTime;
    const expected = STAGE_BENCHMARKS[this.currentStage].expected;

    return Math.min(100, (elapsed / expected) * 100);
  }

  /**
   * Get overall session progress
   */
  getOverallProgress(): number {
    const stageOrder: StageName[] = [
      'questions',
      'research',
      'challenge',
      'synthesis',
      'review',
      'voting',
      'spec',
    ];

    let completedWeight = 0;
    let totalWeight = 0;

    for (const stage of stageOrder) {
      const weight = STAGE_BENCHMARKS[stage].expected;
      totalWeight += weight;

      const metrics = this.stages.get(stage);
      if (metrics?.status === 'completed') {
        completedWeight += weight;
      } else if (metrics?.status === 'running') {
        const progress = this.getStageProgress() / 100;
        completedWeight += weight * progress;
      }
    }

    return totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const stageMetrics = Array.from(this.stages.values());
    const completedStages = stageMetrics.filter((s) => s.status === 'completed' && s.duration);

    const durations = completedStages.map((s) => s.duration!);
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const averageStageDuration = durations.length > 0 ? totalDuration / durations.length : 0;

    let slowestStage: StageName | null = null;
    let fastestStage: StageName | null = null;
    let maxDuration = 0;
    let minDuration = Infinity;

    for (const stage of completedStages) {
      if (stage.duration! > maxDuration) {
        maxDuration = stage.duration!;
        slowestStage = stage.stage;
      }
      if (stage.duration! < minDuration) {
        minDuration = stage.duration!;
        fastestStage = stage.stage;
      }
    }

    return {
      sessionId: this.sessionId,
      totalDuration,
      stages: stageMetrics,
      averageStageDuration,
      slowestStage,
      fastestStage,
    };
  }

  /**
   * Get current stage info
   */
  getCurrentStage(): { name: StageName; elapsed: number; progress: number } | null {
    if (!this.currentStage) return null;

    const metrics = this.stages.get(this.currentStage);
    if (!metrics) return null;

    return {
      name: this.currentStage,
      elapsed: Date.now() - metrics.startTime,
      progress: this.getStageProgress(),
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private addBreadcrumb(
    event: string,
    stage: StageName,
    data?: Record<string, unknown>
  ): void {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: event,
      level: 'info',
      data: { stage, sessionId: this.sessionId, ...data },
    });
  }

  private markPerformance(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
    }
  }

  private measurePerformance(name: string, startMark: string, endMark: string): void {
    if (typeof performance !== 'undefined') {
      try {
        performance.measure(name, startMark, endMark);
      } catch {
        // Marks may not exist in some environments
      }
    }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format duration in human-readable form
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Get stage status indicator
 */
export function getStageStatus(
  stage: StageName,
  duration: number
): 'fast' | 'normal' | 'slow' | 'critical' {
  const benchmark = STAGE_BENCHMARKS[stage];
  if (duration >= benchmark.critical) return 'critical';
  if (duration >= benchmark.warning) return 'slow';
  if (duration <= benchmark.expected * 0.5) return 'fast';
  return 'normal';
}

/**
 * Create a new performance tracker
 */
export function createPerformanceTracker(
  sessionId: string,
  options?: {
    onSlowStage?: (stage: StageName, duration: number, severity: 'warning' | 'critical') => void;
  }
): StagePerformanceTracker {
  return new StagePerformanceTracker(sessionId, options);
}
