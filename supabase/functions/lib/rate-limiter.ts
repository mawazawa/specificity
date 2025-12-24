/**
 * Rate Limiter for External APIs
 *
 * Implements token bucket algorithm with request queuing
 * to prevent 429 rate limit errors on Exa and other APIs.
 *
 * Created: December 23, 2025
 */

interface QueuedRequest {
  id: string;
  execute: () => Promise<Response>;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
  retries: number;
  timestamp: number;
}

interface RateLimiterConfig {
  maxRequestsPerSecond: number;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

// Global request queue for Exa API (shared across all agents)
const exaQueue: QueuedRequest[] = [];
let exaProcessing = false;
let lastExaRequest = 0;

// Default config: 4 QPS (under Exa's 5 QPS limit with safety margin)
const EXA_CONFIG: RateLimiterConfig = {
  maxRequestsPerSecond: 4,
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000
};

/**
 * Calculate delay between requests to maintain rate limit
 */
function getMinDelayMs(config: RateLimiterConfig): number {
  return Math.ceil(1000 / config.maxRequestsPerSecond);
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(retries: number, config: RateLimiterConfig): number {
  const delay = config.baseDelayMs * Math.pow(2, retries);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Process the Exa request queue
 */
async function processExaQueue(): Promise<void> {
  if (exaProcessing || exaQueue.length === 0) {
    return;
  }

  exaProcessing = true;

  while (exaQueue.length > 0) {
    const request = exaQueue.shift()!;
    const minDelay = getMinDelayMs(EXA_CONFIG);
    const timeSinceLastRequest = Date.now() - lastExaRequest;

    // Wait if we're sending requests too fast
    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    try {
      lastExaRequest = Date.now();
      const response = await request.execute();

      if (response.status === 429) {
        // Rate limited - requeue with backoff
        if (request.retries < EXA_CONFIG.maxRetries) {
          const backoffDelay = getBackoffDelay(request.retries, EXA_CONFIG);
          console.log(`[RateLimiter] 429 received, retry ${request.retries + 1}/${EXA_CONFIG.maxRetries} in ${backoffDelay}ms`);

          await new Promise(resolve => setTimeout(resolve, backoffDelay));

          // Re-add to front of queue with incremented retry count
          exaQueue.unshift({
            ...request,
            retries: request.retries + 1
          });
        } else {
          // Max retries exceeded
          request.reject(new Error(`Exa API rate limit exceeded after ${EXA_CONFIG.maxRetries} retries`));
        }
      } else {
        request.resolve(response);
      }
    } catch (error) {
      if (request.retries < EXA_CONFIG.maxRetries) {
        const backoffDelay = getBackoffDelay(request.retries, EXA_CONFIG);
        console.log(`[RateLimiter] Error, retry ${request.retries + 1}/${EXA_CONFIG.maxRetries} in ${backoffDelay}ms:`, error);

        await new Promise(resolve => setTimeout(resolve, backoffDelay));

        exaQueue.unshift({
          ...request,
          retries: request.retries + 1
        });
      } else {
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  exaProcessing = false;
}

/**
 * Queue an Exa API request with rate limiting
 *
 * This ensures all Exa requests across all parallel agents
 * are serialized and rate limited to prevent 429 errors.
 */
export function queueExaRequest(
  execute: () => Promise<Response>
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request: QueuedRequest = {
      id: `exa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      execute,
      resolve,
      reject,
      retries: 0,
      timestamp: Date.now()
    };

    exaQueue.push(request);
    console.log(`[RateLimiter] Queued request ${request.id}, queue size: ${exaQueue.length}`);

    // Start processing if not already running
    processExaQueue().catch(err => {
      console.error('[RateLimiter] Queue processing error:', err);
    });
  });
}

/**
 * Get current queue statistics
 */
export function getExaQueueStats(): {
  queueLength: number;
  isProcessing: boolean;
  lastRequestTime: number;
} {
  return {
    queueLength: exaQueue.length,
    isProcessing: exaProcessing,
    lastRequestTime: lastExaRequest
  };
}
