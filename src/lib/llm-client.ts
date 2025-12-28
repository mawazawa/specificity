/**
 * LLM Client with Automatic Failover
 * Provides unified interface for OpenRouter/Groq with intelligent fallback
 * Action 54: OpenRouter Automatic Failover (CRITICAL)
 */

import { withRetry, RetryOptions } from '@/lib/retry';
import { scopedLogger } from '@/lib/logger';

const logger = scopedLogger('LLMClient');

/**
 * Provider types
 */
export type LLMProvider = 'openrouter' | 'groq';

/**
 * Provider health status
 */
export type ProviderHealth = 'healthy' | 'degraded' | 'down';

/**
 * Circuit breaker states
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Provider configuration
 */
export interface ProviderConfig {
  name: LLMProvider;
  priority: number; // Lower = higher priority
  enabled: boolean;
}

/**
 * Failover configuration
 */
export interface FailoverConfig {
  /** Maximum consecutive failures before marking provider as down */
  maxFailures: number;
  /** Time in ms to wait before retrying a down provider */
  cooldownMs: number;
  /** Time window in ms for tracking failures */
  failureWindowMs: number;
  /** Enable automatic failover */
  enabled: boolean;
}

/**
 * Provider health metrics
 */
interface ProviderMetrics {
  consecutiveFailures: number;
  lastFailureTimestamp: number;
  failureCount: number;
  successCount: number;
  lastCheckedTimestamp: number;
  circuitState: CircuitState;
  health: ProviderHealth;
}

/**
 * Default failover configuration
 */
const DEFAULT_FAILOVER_CONFIG: FailoverConfig = {
  maxFailures: 3,
  cooldownMs: 60000, // 1 minute
  failureWindowMs: 300000, // 5 minutes
  enabled: true,
};

/**
 * Provider configurations in priority order
 */
const PROVIDER_CONFIGS: ProviderConfig[] = [
  { name: 'openrouter', priority: 1, enabled: true },
  { name: 'groq', priority: 2, enabled: true },
];

/**
 * LLM Client with automatic failover and circuit breaker
 */
export class LLMClient {
  private providerMetrics: Map<LLMProvider, ProviderMetrics>;
  private config: FailoverConfig;
  private currentProvider: LLMProvider;

  constructor(config?: Partial<FailoverConfig>) {
    this.config = { ...DEFAULT_FAILOVER_CONFIG, ...config };
    this.providerMetrics = new Map();
    this.currentProvider = 'openrouter';

    // Initialize metrics for each provider
    PROVIDER_CONFIGS.forEach((provider) => {
      this.providerMetrics.set(provider.name, {
        consecutiveFailures: 0,
        lastFailureTimestamp: 0,
        failureCount: 0,
        successCount: 0,
        lastCheckedTimestamp: Date.now(),
        circuitState: 'closed',
        health: 'healthy',
      });
    });

    logger.debug('LLM Client initialized', {
      config: this.config,
      providers: PROVIDER_CONFIGS.map((p) => p.name),
    });
  }

  /**
   * Get current provider health
   */
  getProviderHealth(provider: LLMProvider): ProviderHealth {
    const metrics = this.providerMetrics.get(provider);
    return metrics?.health || 'healthy';
  }

  /**
   * Get circuit state for provider
   */
  getCircuitState(provider: LLMProvider): CircuitState {
    const metrics = this.providerMetrics.get(provider);
    return metrics?.circuitState || 'closed';
  }

  /**
   * Get all provider metrics (for debugging/monitoring)
   */
  getAllMetrics(): Record<LLMProvider, ProviderMetrics> {
    const result: Partial<Record<LLMProvider, ProviderMetrics>> = {};
    this.providerMetrics.forEach((metrics, provider) => {
      result[provider] = { ...metrics };
    });
    return result as Record<LLMProvider, ProviderMetrics>;
  }

  /**
   * Reset provider metrics
   */
  resetProvider(provider: LLMProvider): void {
    const metrics = this.providerMetrics.get(provider);
    if (metrics) {
      metrics.consecutiveFailures = 0;
      metrics.failureCount = 0;
      metrics.circuitState = 'closed';
      metrics.health = 'healthy';
      metrics.lastCheckedTimestamp = Date.now();
      logger.info(`Provider ${provider} metrics reset`);
    }
  }

  /**
   * Check if provider is available
   */
  private isProviderAvailable(provider: LLMProvider): boolean {
    const metrics = this.providerMetrics.get(provider);
    if (!metrics) return false;

    const now = Date.now();

    // If circuit is open, check cooldown period
    if (metrics.circuitState === 'open') {
      const cooldownElapsed = now - metrics.lastFailureTimestamp;
      if (cooldownElapsed >= this.config.cooldownMs) {
        // Move to half-open state
        metrics.circuitState = 'half-open';
        logger.info(`Provider ${provider} circuit moved to half-open`, {
          cooldownElapsed,
          cooldownMs: this.config.cooldownMs,
        });
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Record successful call
   */
  private recordSuccess(provider: LLMProvider): void {
    const metrics = this.providerMetrics.get(provider);
    if (!metrics) return;

    metrics.consecutiveFailures = 0;
    metrics.successCount++;
    metrics.lastCheckedTimestamp = Date.now();

    // Close circuit if it was half-open
    if (metrics.circuitState === 'half-open') {
      metrics.circuitState = 'closed';
      metrics.health = 'healthy';
      logger.info(`Provider ${provider} recovered - circuit closed`, {
        successCount: metrics.successCount,
      });
    }
  }

  /**
   * Record failed call
   */
  private recordFailure(provider: LLMProvider, error: unknown): void {
    const metrics = this.providerMetrics.get(provider);
    if (!metrics) return;

    const now = Date.now();
    metrics.consecutiveFailures++;
    metrics.failureCount++;
    metrics.lastFailureTimestamp = now;
    metrics.lastCheckedTimestamp = now;

    // Update health status
    if (metrics.consecutiveFailures >= this.config.maxFailures) {
      metrics.circuitState = 'open';
      metrics.health = 'down';
      logger.warn(`Provider ${provider} circuit opened - marking as down`, {
        consecutiveFailures: metrics.consecutiveFailures,
        maxFailures: this.config.maxFailures,
        error: error instanceof Error ? error.message : String(error),
      });
    } else if (metrics.consecutiveFailures >= this.config.maxFailures / 2) {
      metrics.health = 'degraded';
      logger.warn(`Provider ${provider} degraded`, {
        consecutiveFailures: metrics.consecutiveFailures,
      });
    }
  }

  /**
   * Determine if error is provider-specific
   */
  private isProviderError(error: unknown, provider: LLMProvider): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (provider === 'openrouter') {
      return (
        message.includes('openrouter') ||
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('quota')
      );
    }

    if (provider === 'groq') {
      return message.includes('groq');
    }

    return false;
  }

  /**
   * Get next available provider for failover
   */
  private getNextProvider(currentProvider: LLMProvider): LLMProvider | null {
    // Sort providers by priority (excluding current)
    const availableProviders = PROVIDER_CONFIGS.filter(
      (p) => p.enabled && p.name !== currentProvider && this.isProviderAvailable(p.name)
    ).sort((a, b) => a.priority - b.priority);

    if (availableProviders.length === 0) {
      logger.error('No available providers for failover', {
        currentProvider,
        metrics: this.getAllMetrics(),
      });
      return null;
    }

    return availableProviders[0].name;
  }

  /**
   * Execute function with automatic failover
   */
  async executeWithFailover<T>(
    fn: () => Promise<T>,
    options?: {
      retryOptions?: Partial<RetryOptions>;
      skipFailover?: boolean;
    }
  ): Promise<T> {
    const { retryOptions = {}, skipFailover = false } = options || {};

    // If failover is disabled or skipped, just execute with retry
    if (!this.config.enabled || skipFailover) {
      return withRetry(fn, {
        maxRetries: 2,
        initialDelayMs: 2000,
        maxDelayMs: 15000,
        ...retryOptions,
      });
    }

    let lastError: unknown;
    const attemptedProviders: LLMProvider[] = [];
    let currentAttemptProvider = this.currentProvider;

    // Try current provider first, then failover
    while (currentAttemptProvider) {
      // Skip if provider not available
      if (!this.isProviderAvailable(currentAttemptProvider)) {
        logger.info(`Skipping unavailable provider ${currentAttemptProvider}`);
        currentAttemptProvider = this.getNextProvider(currentAttemptProvider) || null;
        continue;
      }

      attemptedProviders.push(currentAttemptProvider);

      logger.debug(`Attempting request with provider ${currentAttemptProvider}`, {
        health: this.getProviderHealth(currentAttemptProvider),
        circuitState: this.getCircuitState(currentAttemptProvider),
      });

      try {
        // Execute with retry
        const result = await withRetry(fn, {
          maxRetries: 2,
          initialDelayMs: 2000,
          maxDelayMs: 15000,
          ...retryOptions,
          onRetry: (attempt, error, delayMs) => {
            logger.debug(`Retry attempt ${attempt} with ${currentAttemptProvider}`, {
              error: error instanceof Error ? error.message : String(error),
              delayMs,
            });
            retryOptions.onRetry?.(attempt, error, delayMs);
          },
        });

        // Success - record and return
        this.recordSuccess(currentAttemptProvider);
        this.currentProvider = currentAttemptProvider;

        logger.info(`Request succeeded with provider ${currentAttemptProvider}`, {
          attemptedProviders,
        });

        return result;
      } catch (error) {
        lastError = error;

        // Record failure
        this.recordFailure(currentAttemptProvider, error);

        logger.warn(`Request failed with provider ${currentAttemptProvider}`, {
          error: error instanceof Error ? error.message : String(error),
          health: this.getProviderHealth(currentAttemptProvider),
        });

        // Check if this is a provider-specific error that should trigger failover
        const isProviderSpecific = this.isProviderError(error, currentAttemptProvider);

        if (isProviderSpecific) {
          logger.info(`Provider-specific error detected, attempting failover`);

          // Try next provider
          const nextProvider = this.getNextProvider(currentAttemptProvider);

          if (nextProvider) {
            logger.info(`Failing over from ${currentAttemptProvider} to ${nextProvider}`);
            currentAttemptProvider = nextProvider;
            continue;
          }
        }

        // No more providers to try
        break;
      }
    }

    // All providers failed
    logger.error('All providers failed', {
      attemptedProviders,
      lastError: lastError instanceof Error ? lastError.message : String(lastError),
      metrics: this.getAllMetrics(),
    });

    throw lastError;
  }

  /**
   * Get provider statistics (for monitoring/debugging)
   */
  getStats(): {
    currentProvider: LLMProvider;
    providers: Array<{
      name: LLMProvider;
      health: ProviderHealth;
      circuitState: CircuitState;
      successRate: number;
      consecutiveFailures: number;
    }>;
  } {
    const providers = Array.from(this.providerMetrics.entries()).map(([name, metrics]) => {
      const totalCalls = metrics.successCount + metrics.failureCount;
      const successRate = totalCalls > 0 ? metrics.successCount / totalCalls : 0;

      return {
        name,
        health: metrics.health,
        circuitState: metrics.circuitState,
        successRate,
        consecutiveFailures: metrics.consecutiveFailures,
      };
    });

    return {
      currentProvider: this.currentProvider,
      providers,
    };
  }
}

/**
 * Singleton instance for global use
 */
export const llmClient = new LLMClient();

/**
 * Helper to check if error is rate limit
 */
export function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('rate limit') || message.includes('429') || message.includes('quota');
}

/**
 * Helper to check if error is provider failure
 */
export function isProviderFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('openrouter') ||
    message.includes('groq') ||
    message.includes('api error') ||
    message.includes('service unavailable')
  );
}

/**
 * Helper to categorize errors
 */
export function categorizeError(error: unknown): {
  type: 'rate_limit' | 'provider_failure' | 'validation' | 'timeout' | 'network' | 'unknown';
  message: string;
  isRetryable: boolean;
} {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
    return {
      type: 'rate_limit',
      message,
      isRetryable: true,
    };
  }

  if (lowerMessage.includes('validation:')) {
    return {
      type: 'validation',
      message,
      isRetryable: false,
    };
  }

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return {
      type: 'timeout',
      message,
      isRetryable: true,
    };
  }

  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection')
  ) {
    return {
      type: 'network',
      message,
      isRetryable: true,
    };
  }

  if (
    lowerMessage.includes('openrouter') ||
    lowerMessage.includes('groq') ||
    lowerMessage.includes('api error')
  ) {
    return {
      type: 'provider_failure',
      message,
      isRetryable: true,
    };
  }

  return {
    type: 'unknown',
    message,
    isRetryable: false,
  };
}
