/**
 * LLM Client Configuration
 * Centralized configuration for failover thresholds and provider settings
 * Action 54: OpenRouter Automatic Failover
 */

import { FailoverConfig } from '@/lib/llm-client';

/**
 * Environment-based configuration
 */
const isDev = import.meta.env.DEV;

/**
 * Production failover configuration
 * Conservative thresholds for production stability
 */
export const PRODUCTION_FAILOVER_CONFIG: FailoverConfig = {
  maxFailures: 3, // Mark provider as down after 3 consecutive failures
  cooldownMs: 60000, // Wait 1 minute before retrying down provider
  failureWindowMs: 300000, // Track failures over 5 minute window
  enabled: true,
};

/**
 * Development failover configuration
 * More aggressive for faster feedback
 */
export const DEVELOPMENT_FAILOVER_CONFIG: FailoverConfig = {
  maxFailures: 2, // Fail faster in development
  cooldownMs: 30000, // Shorter cooldown (30 seconds)
  failureWindowMs: 180000, // 3 minute window
  enabled: true,
};

/**
 * Get appropriate failover config based on environment
 */
export function getFailoverConfig(): FailoverConfig {
  return isDev ? DEVELOPMENT_FAILOVER_CONFIG : PRODUCTION_FAILOVER_CONFIG;
}

/**
 * Provider priority weights
 * Used to determine which provider to use first
 */
export const PROVIDER_PRIORITIES = {
  openrouter: 1, // Primary - more models available
  groq: 2, // Fallback - faster but fewer models
} as const;

/**
 * Error retry configuration
 */
export const ERROR_RETRY_CONFIG = {
  // Network errors - aggressive retry
  network: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
  },
  // Rate limit errors - backoff more
  rateLimit: {
    maxRetries: 2,
    initialDelayMs: 5000,
    maxDelayMs: 30000,
  },
  // Timeout errors - moderate retry
  timeout: {
    maxRetries: 2,
    initialDelayMs: 2000,
    maxDelayMs: 15000,
  },
  // Provider failures - moderate retry
  providerFailure: {
    maxRetries: 2,
    initialDelayMs: 2000,
    maxDelayMs: 15000,
  },
  // Default for unknown errors
  default: {
    maxRetries: 1,
    initialDelayMs: 2000,
    maxDelayMs: 10000,
  },
} as const;

/**
 * Circuit breaker thresholds
 */
export const CIRCUIT_BREAKER_CONFIG = {
  // Failure threshold to open circuit
  failureThreshold: 5,
  // Success threshold to close circuit (when half-open)
  successThreshold: 2,
  // Time to wait before attempting recovery (half-open)
  resetTimeoutMs: 60000,
  // Time window for counting failures
  windowMs: 300000,
} as const;

/**
 * Monitoring configuration
 */
export const MONITORING_CONFIG = {
  // Log provider stats every N requests
  logStatsInterval: 10,
  // Enable detailed logging in development
  enableDetailedLogs: isDev,
  // Track provider latency
  trackLatency: true,
  // Track provider costs (if available)
  trackCosts: true,
} as const;

/**
 * Alert thresholds for monitoring
 */
export const ALERT_THRESHOLDS = {
  // Alert if success rate falls below this
  minSuccessRate: 0.8, // 80%
  // Alert if average latency exceeds this (ms)
  maxLatencyMs: 30000, // 30 seconds
  // Alert if consecutive failures exceed this
  maxConsecutiveFailures: 5,
  // Alert if provider is down for longer than this
  maxDowntimeMs: 300000, // 5 minutes
} as const;

/**
 * Feature flags for gradual rollout
 */
export const FEATURE_FLAGS = {
  // Enable automatic failover
  enableFailover: true,
  // Enable circuit breaker
  enableCircuitBreaker: true,
  // Enable provider health tracking
  enableHealthTracking: true,
  // Enable cost tracking
  enableCostTracking: false, // Not implemented yet
  // Enable latency tracking
  enableLatencyTracking: true,
} as const;
