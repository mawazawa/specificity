/**
 * Stage Performance Monitoring Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  StagePerformanceTracker,
  STAGE_BENCHMARKS,
  formatDuration,
  getStageStatus,
  createPerformanceTracker,
} from '../stage-performance';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('StagePerformanceTracker', () => {
  let tracker: StagePerformanceTracker;

  beforeEach(() => {
    vi.clearAllMocks();
    tracker = new StagePerformanceTracker('test-session');
  });

  describe('startStage', () => {
    it('should start tracking a stage', () => {
      tracker.startStage('questions');
      const current = tracker.getCurrentStage();

      expect(current).not.toBeNull();
      expect(current?.name).toBe('questions');
      expect(current?.elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should complete previous stage when starting new one', () => {
      tracker.startStage('questions');
      tracker.startStage('research');

      const report = tracker.generateReport();
      const questionsStage = report.stages.find((s) => s.stage === 'questions');

      expect(questionsStage?.status).toBe('completed');
    });
  });

  describe('completeStage', () => {
    it('should record duration when completing stage', () => {
      tracker.startStage('questions');
      // Simulate some time passing
      tracker.completeStage('questions');

      const report = tracker.generateReport();
      const questionsStage = report.stages.find((s) => s.stage === 'questions');

      expect(questionsStage?.status).toBe('completed');
      expect(questionsStage?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should record error when stage fails', () => {
      tracker.startStage('research');
      tracker.completeStage('research', 'API timeout');

      const report = tracker.generateReport();
      const researchStage = report.stages.find((s) => s.stage === 'research');

      expect(researchStage?.status).toBe('failed');
      expect(researchStage?.error).toBe('API timeout');
    });
  });

  describe('recordAgentTime', () => {
    it('should record agent processing time', () => {
      tracker.startStage('research');
      tracker.recordAgentTime('elon', 5000);
      tracker.recordAgentTime('steve', 3000);
      tracker.completeStage('research');

      const report = tracker.generateReport();
      const researchStage = report.stages.find((s) => s.stage === 'research');

      expect(researchStage?.agentTimes['elon']).toBe(5000);
      expect(researchStage?.agentTimes['steve']).toBe(3000);
    });
  });

  describe('getStageProgress', () => {
    it('should return 0 when no stage is running', () => {
      expect(tracker.getStageProgress()).toBe(0);
    });

    it('should calculate progress based on expected duration', () => {
      tracker.startStage('questions');
      // Progress should be between 0-100
      expect(tracker.getStageProgress()).toBeGreaterThanOrEqual(0);
      expect(tracker.getStageProgress()).toBeLessThanOrEqual(100);
    });
  });

  describe('getEstimatedTimeRemaining', () => {
    it('should return null when no stage is running', () => {
      expect(tracker.getEstimatedTimeRemaining()).toBeNull();
    });

    it('should return positive value for expected duration', () => {
      tracker.startStage('questions');
      const remaining = tracker.getEstimatedTimeRemaining();

      expect(remaining).not.toBeNull();
      expect(remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getOverallProgress', () => {
    it('should return 0 when no stages completed', () => {
      expect(tracker.getOverallProgress()).toBe(0);
    });

    it('should increase as stages complete', () => {
      tracker.startStage('questions');
      tracker.completeStage('questions');

      expect(tracker.getOverallProgress()).toBeGreaterThan(0);
    });
  });

  describe('generateReport', () => {
    it('should generate comprehensive report', () => {
      tracker.startStage('questions');
      tracker.completeStage('questions');
      tracker.startStage('research');
      tracker.completeStage('research');

      const report = tracker.generateReport();

      expect(report.sessionId).toBe('test-session');
      expect(report.stages.length).toBe(2);
      expect(report.totalDuration).toBeGreaterThanOrEqual(0);
      expect(report.averageStageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should identify slowest and fastest stages', () => {
      vi.useFakeTimers();

      tracker.startStage('questions');
      vi.advanceTimersByTime(100); // Simulate 100ms
      tracker.completeStage('questions');

      tracker.startStage('research');
      vi.advanceTimersByTime(500); // Simulate 500ms (slower)
      tracker.completeStage('research');

      const report = tracker.generateReport();

      expect(report.slowestStage).toBe('research');
      expect(report.fastestStage).toBe('questions');

      vi.useRealTimers();
    });
  });

  describe('slow stage callback', () => {
    it('should call callback for slow stages', () => {
      vi.useFakeTimers();
      const onSlowStage = vi.fn();
      const slowTracker = new StagePerformanceTracker('test', { onSlowStage });

      slowTracker.startStage('questions');
      // Advance past warning threshold
      vi.advanceTimersByTime(STAGE_BENCHMARKS.questions.warning + 1000);
      slowTracker.completeStage('questions');

      expect(onSlowStage).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});

describe('formatDuration', () => {
  it('should format milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('should format seconds', () => {
    expect(formatDuration(5000)).toBe('5.0s');
    expect(formatDuration(15500)).toBe('15.5s');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(180000)).toBe('3m 0s');
  });
});

describe('getStageStatus', () => {
  it('should return fast for quick stages', () => {
    const expected = STAGE_BENCHMARKS.questions.expected;
    expect(getStageStatus('questions', expected * 0.3)).toBe('fast');
  });

  it('should return normal for expected duration', () => {
    const expected = STAGE_BENCHMARKS.questions.expected;
    expect(getStageStatus('questions', expected)).toBe('normal');
  });

  it('should return slow for warning threshold', () => {
    const warning = STAGE_BENCHMARKS.questions.warning;
    expect(getStageStatus('questions', warning + 1000)).toBe('slow');
  });

  it('should return critical for critical threshold', () => {
    const critical = STAGE_BENCHMARKS.questions.critical;
    expect(getStageStatus('questions', critical + 1000)).toBe('critical');
  });
});

describe('createPerformanceTracker', () => {
  it('should create tracker with session ID', () => {
    const tracker = createPerformanceTracker('my-session');
    tracker.startStage('questions');
    tracker.completeStage('questions');

    const report = tracker.generateReport();
    expect(report.sessionId).toBe('my-session');
  });
});

describe('STAGE_BENCHMARKS', () => {
  it('should have all stages defined', () => {
    const stages = [
      'questions',
      'research',
      'challenge',
      'synthesis',
      'review',
      'voting',
      'spec',
      'chat',
    ];

    for (const stage of stages) {
      expect(STAGE_BENCHMARKS[stage as keyof typeof STAGE_BENCHMARKS]).toBeDefined();
    }
  });

  it('should have warning > expected for all stages', () => {
    for (const [, benchmark] of Object.entries(STAGE_BENCHMARKS)) {
      expect(benchmark.warning).toBeGreaterThan(benchmark.expected);
    }
  });

  it('should have critical > warning for all stages', () => {
    for (const [, benchmark] of Object.entries(STAGE_BENCHMARKS)) {
      expect(benchmark.critical).toBeGreaterThan(benchmark.warning);
    }
  });
});
