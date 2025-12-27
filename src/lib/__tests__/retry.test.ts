/**
 * Unit Tests for retry utilities
 * Tests retry logic with exponential backoff in src/lib/retry.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  isTransientError,
  calculateDelay,
  withRetryWrapper,
  RetryError,
} from '../retry';

describe('isTransientError', () => {
  describe('should return true for transient errors', () => {
    it('should detect network errors', () => {
      expect(isTransientError(new Error('network failure'))).toBe(true);
      expect(isTransientError(new Error('fetch failed'))).toBe(true);
      expect(isTransientError(new Error('connection reset'))).toBe(true);
    });

    it('should detect timeout errors', () => {
      expect(isTransientError(new Error('request timeout'))).toBe(true);
      expect(isTransientError(new Error('504 gateway timeout'))).toBe(true);
      expect(isTransientError(new Error('timed out'))).toBe(true);
    });

    it('should detect rate limit errors', () => {
      expect(isTransientError(new Error('rate limit exceeded'))).toBe(true);
      expect(isTransientError(new Error('429 too many requests'))).toBe(true);
    });

    it('should detect server errors', () => {
      expect(isTransientError(new Error('500 internal server error'))).toBe(true);
      expect(isTransientError(new Error('502 bad gateway'))).toBe(true);
      expect(isTransientError(new Error('503 service unavailable'))).toBe(true);
    });

    it('should detect unavailable errors', () => {
      expect(isTransientError(new Error('service temporarily unavailable'))).toBe(true);
    });
  });

  describe('should return false for non-transient errors', () => {
    it('should not detect validation errors', () => {
      expect(isTransientError(new Error('validation failed'))).toBe(false);
      expect(isTransientError(new Error('invalid input'))).toBe(false);
    });

    it('should not detect auth errors', () => {
      expect(isTransientError(new Error('unauthorized'))).toBe(false);
      expect(isTransientError(new Error('401'))).toBe(false);
    });

    it('should not detect not found errors', () => {
      expect(isTransientError(new Error('not found'))).toBe(false);
      expect(isTransientError(new Error('404'))).toBe(false);
    });

    it('should not detect generic errors', () => {
      expect(isTransientError(new Error('something went wrong'))).toBe(false);
      expect(isTransientError(new Error('unexpected error'))).toBe(false);
    });
  });

  it('should handle string errors', () => {
    expect(isTransientError('network error')).toBe(true);
    expect(isTransientError('validation error')).toBe(false);
  });
});

describe('calculateDelay', () => {
  it('should calculate exponential delay', () => {
    // No jitter for predictable testing
    const attempt0 = calculateDelay(0, 1000, 30000, 2, false);
    const attempt1 = calculateDelay(1, 1000, 30000, 2, false);
    const attempt2 = calculateDelay(2, 1000, 30000, 2, false);

    expect(attempt0).toBe(1000); // 1000 * 2^0 = 1000
    expect(attempt1).toBe(2000); // 1000 * 2^1 = 2000
    expect(attempt2).toBe(4000); // 1000 * 2^2 = 4000
  });

  it('should cap at max delay', () => {
    const delay = calculateDelay(10, 1000, 5000, 2, false);
    expect(delay).toBe(5000); // Capped at max
  });

  it('should add jitter when enabled', () => {
    // With jitter, delay should be within ±25% of base
    const baseDelay = 1000;
    const delays = Array.from({ length: 100 }, () =>
      calculateDelay(0, baseDelay, 30000, 2, true)
    );

    // All delays should be within range
    delays.forEach((delay) => {
      expect(delay).toBeGreaterThanOrEqual(baseDelay * 0.75);
      expect(delay).toBeLessThanOrEqual(baseDelay * 1.25);
    });

    // With 100 samples, we should see some variation
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const resultPromise = withRetry(fn, { maxRetries: 3 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on transient failure and succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('success');

    const onRetry = vi.fn();

    const resultPromise = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      jitter: false,
      onRetry,
    });

    // First call fails
    await vi.advanceTimersByTimeAsync(0);

    // Wait for retry delay
    await vi.advanceTimersByTimeAsync(100);

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), 100);
  });

  it('should throw after max retries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network error'));

    const resultPromise = withRetry(fn, {
      maxRetries: 2,
      initialDelayMs: 100,
      jitter: false,
    });

    // Catch the rejection to prevent unhandled rejection warning
    const catchPromise = resultPromise.catch(() => {});

    // Run through all retries
    await vi.runAllTimersAsync();

    // Wait for catch to complete
    await catchPromise;

    // Now verify the rejection
    await expect(resultPromise).rejects.toThrow('network error');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should not retry non-transient errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('validation failed'));

    const resultPromise = withRetry(fn, { maxRetries: 3 });

    await expect(resultPromise).rejects.toThrow('validation failed');
    expect(fn).toHaveBeenCalledTimes(1); // No retries
  });

  it('should use custom isRetryable function', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('custom retryable'))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      jitter: false,
      isRetryable: (error) => {
        const message = error instanceof Error ? error.message : '';
        return message.includes('custom retryable');
      },
    });

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect abort signal', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network error'));
    const controller = new AbortController();

    const resultPromise = withRetry(fn, {
      maxRetries: 5,
      initialDelayMs: 1000,
      jitter: false,
      signal: controller.signal,
    });

    // First attempt fails
    await vi.advanceTimersByTimeAsync(0);

    // Abort during delay
    controller.abort();

    await expect(resultPromise).rejects.toThrow('Aborted');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should abort immediately if signal is already aborted', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const controller = new AbortController();
    controller.abort();

    const resultPromise = withRetry(fn, {
      maxRetries: 3,
      signal: controller.signal,
    });

    await expect(resultPromise).rejects.toThrow('Aborted');
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('withRetryWrapper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a wrapped function with retry logic', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockImplementation((x: number) => Promise.resolve(x * 2));

    const wrappedFn = withRetryWrapper(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      jitter: false,
    });

    const resultPromise = wrappedFn(5);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe(10);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(5);
  });

  it('should pass all arguments to wrapped function', async () => {
    const fn = vi.fn().mockImplementation((a: number, b: string, c: boolean) =>
      Promise.resolve({ a, b, c })
    );

    const wrappedFn = withRetryWrapper(fn);

    const resultPromise = wrappedFn(1, 'test', true);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({ a: 1, b: 'test', c: true });
    expect(fn).toHaveBeenCalledWith(1, 'test', true);
  });
});

describe('RetryError', () => {
  it('should create error with attempt information', () => {
    const originalError = new Error('original');
    const retryError = new RetryError('All retries failed', 3, originalError);

    expect(retryError.name).toBe('RetryError');
    expect(retryError.message).toBe('All retries failed');
    expect(retryError.attempts).toBe(3);
    expect(retryError.lastError).toBe(originalError);
  });
});
