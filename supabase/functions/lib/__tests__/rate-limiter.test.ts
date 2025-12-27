/**
 * Rate Limiter Unit Tests
 * Tests for queue stats and configuration
 * Action 29: Edge Function Tests (86% confidence)
 */

import { describe, it, expect } from 'vitest';
import { getExaQueueStats } from '../rate-limiter';

describe('Rate Limiter', () => {
  describe('getExaQueueStats', () => {
    it('returns queue statistics', () => {
      const stats = getExaQueueStats();

      expect(stats).toHaveProperty('queueLength');
      expect(stats).toHaveProperty('isProcessing');
      expect(stats).toHaveProperty('lastRequestTime');
    });

    it('has correct initial state', () => {
      const stats = getExaQueueStats();

      expect(typeof stats.queueLength).toBe('number');
      expect(typeof stats.isProcessing).toBe('boolean');
      expect(typeof stats.lastRequestTime).toBe('number');
      expect(stats.queueLength).toBeGreaterThanOrEqual(0);
    });
  });

  // Note: queueExaRequest tests would require mocking fetch
  // which is complex in the edge function environment.
  // Integration tests in multi-agent-spec-test.ts cover the full flow.
});
