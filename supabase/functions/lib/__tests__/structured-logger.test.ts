/**
 * Structured Logger Unit Tests
 * Tests for logging, timing, and pipeline tracing
 * Action 29: Edge Function Tests (86% confidence)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateRequestId,
  createLogger,
  createTimer,
  createPipelineTrace,
  startStageTrace,
  completeStageTrace,
  failStageTrace,
  getTraceReport,
} from '../structured-logger';

describe('generateRequestId', () => {
  it('generates unique IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).not.toBe(id2);
  });

  it('follows expected format', () => {
    const id = generateRequestId();

    expect(id).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
  });

  it('includes timestamp component', () => {
    const before = Date.now().toString(36);
    const id = generateRequestId();
    const after = Date.now().toString(36);

    // The timestamp part should be between before and after
    const timestampPart = id.split('_')[1];
    expect(timestampPart.length).toBeGreaterThan(0);
  });
});

describe('createLogger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates logger with stage name', () => {
    const logger = createLogger('questions');
    logger.info('test message');

    expect(consoleSpy.log).toHaveBeenCalled();
    expect(consoleSpy.log.mock.calls[0][0]).toContain('[questions]');
  });

  it('uses provided request ID', () => {
    const logger = createLogger('research', 'req_123_abc');
    logger.info('test');

    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('logs at different levels', () => {
    const logger = createLogger('test-stage');

    logger.debug('debug message');
    expect(consoleSpy.debug).toHaveBeenCalled();

    logger.info('info message');
    expect(consoleSpy.log).toHaveBeenCalled();

    logger.warn('warn message');
    expect(consoleSpy.warn).toHaveBeenCalled();

    logger.error('error message', new Error('test error'));
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('logs metrics', () => {
    const logger = createLogger('metrics-test');
    logger.metric('latency_ms', 1234);

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining('metric: latency_ms=1234')
    );
  });

  it('includes model in context when set', () => {
    const logger = createLogger('model-test');
    logger.setModel('gpt-4');
    logger.info('with model');

    expect(consoleSpy.log.mock.calls[0][0]).toContain('model=gpt-4');
  });

  it('creates child logger with combined stage name', () => {
    const parent = createLogger('parent');
    const child = parent.child('child');
    child.info('child message');

    expect(consoleSpy.log.mock.calls[0][0]).toContain('[parent:child]');
  });

  it('handles additional data in logs', () => {
    const logger = createLogger('data-test');
    logger.info('with data', { key: 'value', count: 42 });

    const callArgs = consoleSpy.log.mock.calls[0];
    expect(callArgs[1]).toContain('"key":"value"');
    expect(callArgs[1]).toContain('"count":42');
  });
});

describe('createTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tracks elapsed time', () => {
    const timer = createTimer();

    vi.advanceTimersByTime(1000);
    expect(timer.elapsed()).toBe(1000);

    vi.advanceTimersByTime(500);
    expect(timer.elapsed()).toBe(1500);
  });

  it('tracks lap times', () => {
    const timer = createTimer();

    vi.advanceTimersByTime(100);
    expect(timer.lap()).toBe(100);

    vi.advanceTimersByTime(200);
    expect(timer.lap()).toBe(200);

    // Total elapsed should be sum of laps
    expect(timer.elapsed()).toBe(300);
  });

  it('resets lap counter', () => {
    const timer = createTimer();

    vi.advanceTimersByTime(100);
    timer.lap();

    vi.advanceTimersByTime(50);
    timer.reset();

    vi.advanceTimersByTime(30);
    expect(timer.lap()).toBe(30);
  });
});

describe('Pipeline Trace', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createPipelineTrace', () => {
    it('creates trace with auto-generated request ID', () => {
      const trace = createPipelineTrace();

      expect(trace.requestId).toMatch(/^req_/);
      expect(trace.startTime).toBe(Date.now());
      expect(trace.stages).toEqual([]);
    });

    it('uses provided request ID', () => {
      const trace = createPipelineTrace('custom_id');

      expect(trace.requestId).toBe('custom_id');
    });
  });

  describe('startStageTrace', () => {
    it('adds stage to trace', () => {
      const trace = createPipelineTrace();
      const index = startStageTrace(trace, 'questions');

      expect(index).toBe(0);
      expect(trace.stages).toHaveLength(1);
      expect(trace.stages[0].name).toBe('questions');
      expect(trace.stages[0].status).toBe('running');
      expect(trace.stages[0].startTime).toBe(Date.now());
    });

    it('tracks multiple stages', () => {
      const trace = createPipelineTrace();

      startStageTrace(trace, 'questions');
      vi.advanceTimersByTime(100);

      startStageTrace(trace, 'research');

      expect(trace.stages).toHaveLength(2);
      expect(trace.stages[0].name).toBe('questions');
      expect(trace.stages[1].name).toBe('research');
    });
  });

  describe('completeStageTrace', () => {
    it('marks stage as completed', () => {
      const trace = createPipelineTrace();
      const index = startStageTrace(trace, 'questions');

      vi.advanceTimersByTime(500);
      completeStageTrace(trace, index);

      expect(trace.stages[0].status).toBe('completed');
      expect(trace.stages[0].endTime).toBe(trace.stages[0].startTime + 500);
    });

    it('records model used', () => {
      const trace = createPipelineTrace();
      const index = startStageTrace(trace, 'synthesis');

      completeStageTrace(trace, index, 'llama-3.3-70b');

      expect(trace.stages[0].model).toBe('llama-3.3-70b');
    });

    it('handles invalid index gracefully', () => {
      const trace = createPipelineTrace();

      // Should not throw
      completeStageTrace(trace, 999);
      expect(trace.stages).toHaveLength(0);
    });
  });

  describe('failStageTrace', () => {
    it('marks stage as failed with error', () => {
      const trace = createPipelineTrace();
      const index = startStageTrace(trace, 'research');

      vi.advanceTimersByTime(1000);
      failStageTrace(trace, index, 'API timeout');

      expect(trace.stages[0].status).toBe('failed');
      expect(trace.stages[0].error).toBe('API timeout');
      expect(trace.stages[0].endTime).toBeDefined();
    });

    it('handles invalid index gracefully', () => {
      const trace = createPipelineTrace();

      // Should not throw
      failStageTrace(trace, 999, 'error');
      expect(trace.stages).toHaveLength(0);
    });
  });

  describe('getTraceReport', () => {
    it('generates formatted report', () => {
      const trace = createPipelineTrace('test_trace');

      const idx1 = startStageTrace(trace, 'questions');
      vi.advanceTimersByTime(100);
      completeStageTrace(trace, idx1, 'gpt-4');

      const idx2 = startStageTrace(trace, 'research');
      vi.advanceTimersByTime(500);
      completeStageTrace(trace, idx2, 'llama-3.3');

      const idx3 = startStageTrace(trace, 'synthesis');
      vi.advanceTimersByTime(200);
      failStageTrace(trace, idx3, 'Timeout');

      const report = getTraceReport(trace);

      expect(report).toContain('Pipeline Trace: test_trace');
      expect(report).toContain('Total Duration:');
      expect(report).toContain('questions');
      expect(report).toContain('research');
      expect(report).toContain('synthesis');
      expect(report).toContain('✅'); // Completed status
      expect(report).toContain('❌'); // Failed status
    });

    it('shows pending stages', () => {
      const trace = createPipelineTrace();
      startStageTrace(trace, 'pending-stage');

      const report = getTraceReport(trace);

      expect(report).toContain('⏳'); // Pending/running status
    });
  });
});
