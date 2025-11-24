/**
 * Retry function with exponential backoff
 * Based on best practices from Supabase docs and exponential-backoff patterns
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  shouldRetry: (error: unknown) => {
    // Retry on network errors or 5xx server errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
        return true;
      }
    }
    return true; // Default to retry
  }
};

/**
 * Execute a function with exponential backoff retry logic
 * @param fn The async function to retry
 * @param options Retry configuration options
 * @returns The result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or shouldn't retry this error
      if (attempt === opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s...
      const delay = Math.min(
        opts.initialDelay * Math.pow(2, attempt),
        opts.maxDelay
      );

      // Add jitter (±25%) to avoid thundering herd
      const jitter = delay * 0.25 * (Math.random() - 0.5);
      const finalDelay = delay + jitter;

      console.warn(
        `Retry attempt ${attempt + 1}/${opts.maxRetries} after ${Math.round(finalDelay)}ms`,
        error instanceof Error ? error.message : error
      );

      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError;
}

/**
 * Wrapper for Supabase function invocations with retry logic
 */
export async function invokeWithRetry<T>(
  invokeFunction: () => Promise<{ data: T | null; error: Error | null }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  const opts: RetryOptions = {
    ...options,
    shouldRetry: (error: unknown) => {
      // Don't retry on rate limit errors (429)
      if (error instanceof Error && error.message.includes('429')) {
        return false;
      }
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return options.shouldRetry?.(error) ?? true;
    }
  };

  return withRetry(async () => {
    const result = await invokeFunction();

    // If there's an error from Supabase, throw it to trigger retry
    if (result.error) {
      throw result.error;
    }

    return result;
  }, opts);
}
