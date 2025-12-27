/**
 * Retry Utility with Exponential Backoff
 * Handles transient failures with configurable retry logic
 */

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay between retries in ms (default: 30000) */
  maxDelayMs?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Add jitter to prevent thundering herd (default: true) */
  jitter?: boolean;
  /** Function to determine if error is retryable (default: checks for transient errors) */
  isRetryable?: (error: unknown) => boolean;
  /** Optional callback for retry events */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
  /** Optional abort signal to cancel retries */
  signal?: AbortSignal;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'signal'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
  isRetryable: isTransientError,
};

/**
 * Check if an error is transient and worth retrying
 */
export function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return true;
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('504') || message.includes('timed out')) {
    return true;
  }

  // Rate limit (429) - retryable with backoff
  if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
    return true;
  }

  // Server errors (5xx) - may be transient
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return true;
  }

  // Service unavailable
  if (message.includes('unavailable') || message.includes('temporarily')) {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
export function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  jitter: boolean
): number {
  // Exponential backoff: delay = initial * (multiplier ^ attempt)
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt);

  // Cap at max delay
  let delay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter (±25%) to prevent thundering herd
  if (jitter) {
    const jitterFactor = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
    delay = Math.floor(delay * jitterFactor);
  }

  return delay;
}

/**
 * Sleep for specified duration with optional abort signal
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to function result
 * @throws Last error if all retries fail
 *
 * @example
 * const result = await withRetry(
 *   () => api.fetchData(),
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error}`);
 *     }
 *   }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    jitter,
    isRetryable,
  } = { ...DEFAULT_OPTIONS, ...options };

  const { onRetry, signal } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check for abort before each attempt
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryable(error)) {
        throw error;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt,
        initialDelayMs,
        maxDelayMs,
        backoffMultiplier,
        jitter
      );

      // Notify about retry
      onRetry?.(attempt + 1, error, delay);

      // Wait before retry
      await sleep(delay, signal);
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Create a retry-wrapped version of a function
 *
 * @param fn - Function to wrap
 * @param options - Retry configuration options
 * @returns Wrapped function with retry logic
 *
 * @example
 * const fetchWithRetry = withRetryWrapper(
 *   (url: string) => fetch(url).then(r => r.json()),
 *   { maxRetries: 3 }
 * );
 * const data = await fetchWithRetry('https://api.example.com/data');
 */
export function withRetryWrapper<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), options);
}

/**
 * Retry-specific error that includes attempt information
 */
export class RetryError extends Error {
  public readonly attempts: number;
  public readonly lastError: unknown;

  constructor(message: string, attempts: number, lastError: unknown) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}
