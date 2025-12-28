/**
 * Query Performance Monitoring
 * Tracks database query performance on the client side
 */

import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

interface QueryMetrics {
  queryName: string;
  duration: number;
  rowCount?: number;
  cached?: boolean;
  timestamp: Date;
}

interface QueryPerformanceConfig {
  slowQueryThreshold: number; // ms
  enableLogging: boolean;
  enableSentry: boolean;
}

const DEFAULT_CONFIG: QueryPerformanceConfig = {
  slowQueryThreshold: 1000, // 1 second
  enableLogging: import.meta.env.DEV,
  enableSentry: import.meta.env.PROD,
};

let config = { ...DEFAULT_CONFIG };

/**
 * Configure query performance monitoring
 */
export function configureQueryPerformance(
  newConfig: Partial<QueryPerformanceConfig>
): void {
  config = { ...config, ...newConfig };
}

/**
 * Wrap a Supabase query with performance monitoring
 */
export async function withQueryMetrics<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  options?: { expectedRows?: number }
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;

    // Extract row count if result has data array
    const rowCount =
      result && typeof result === 'object' && 'data' in result
        ? Array.isArray((result as { data: unknown }).data)
          ? ((result as { data: unknown[] }).data).length
          : undefined
        : undefined;

    const metrics: QueryMetrics = {
      queryName,
      duration,
      rowCount,
      cached: false,
      timestamp: new Date(),
    };

    // Log slow queries
    if (duration > config.slowQueryThreshold) {
      handleSlowQuery(metrics, options?.expectedRows);
    } else if (config.enableLogging) {
      logger.info(
        `[Query] ${queryName}: ${duration.toFixed(1)}ms${rowCount !== undefined ? ` (${rowCount} rows)` : ''}`
      );
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    // Log failed queries
    if (config.enableLogging) {
      logger.error(`[Query] ${queryName} FAILED after ${duration.toFixed(1)}ms:`, error);
    }

    if (config.enableSentry) {
      Sentry.captureException(error, {
        tags: { query: queryName },
        extra: { duration, queryName },
      });
    }

    throw error;
  }
}

/**
 * Handle slow query detection
 */
function handleSlowQuery(
  metrics: QueryMetrics,
  expectedRows?: number
): void {
  const message = `Slow query detected: ${metrics.queryName} took ${metrics.duration.toFixed(1)}ms`;

  if (config.enableLogging) {
    logger.warn(`[Query] ⚠️ ${message}`, {
      ...metrics,
      expectedRows,
    });
  }

  if (config.enableSentry) {
    Sentry.addBreadcrumb({
      category: 'query',
      message,
      level: 'warning',
      data: {
        queryName: metrics.queryName,
        duration: metrics.duration,
        rowCount: metrics.rowCount,
        expectedRows,
      },
    });

    // Report very slow queries (> 3s) as issues
    if (metrics.duration > 3000) {
      Sentry.captureMessage(`Very slow query: ${metrics.queryName}`, {
        level: 'warning',
        tags: { query: metrics.queryName },
        extra: { ...metrics, expectedRows },
      });
    }
  }
}

/**
 * Query timing decorator for class methods
 */
export function trackQuery(queryName: string) {
  return function <T>(
    _target: unknown,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]): Promise<T> {
      return withQueryMetrics(queryName, () => originalMethod?.apply(this, args) as Promise<T>);
    };

    return descriptor;
  };
}

/**
 * Suggested indices based on common query patterns
 * This is informational only - actual index creation should be done via migrations
 */
export const RECOMMENDED_INDICES = {
  specifications: [
    {
      name: 'idx_specifications_user_created',
      columns: ['user_id', 'created_at DESC'],
      reason: 'User spec listing with date ordering',
    },
    {
      name: 'idx_specifications_public',
      columns: ['created_at DESC'],
      where: 'is_public = true',
      reason: 'Public spec browsing',
    },
  ],
  profiles: [
    {
      name: 'idx_profiles_stripe_customer_id',
      columns: ['stripe_customer_id'],
      where: 'stripe_customer_id IS NOT NULL',
      reason: 'Stripe webhook lookups',
    },
  ],
  prompts: [
    {
      name: 'idx_prompts_name_active',
      columns: ['name'],
      where: 'is_active = true',
      reason: 'Active prompt lookups by name',
    },
  ],
} as const;
