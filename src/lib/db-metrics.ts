/**
 * Database Metrics Collection
 * Tracks query performance and database health
 * Action 36: Database Monitoring (84% confidence)
 */

import * as Sentry from '@sentry/react';
import { supabase } from '@/integrations/supabase/client';

export interface QueryMetric {
  query: string;
  table: string;
  duration: number;
  timestamp: number;
  success: boolean;
  rowCount?: number;
}

export interface DatabaseHealth {
  connected: boolean;
  latency: number;
  timestamp: number;
}

// Query performance thresholds (in milliseconds)
export const QUERY_THRESHOLDS = {
  fast: 100,
  normal: 500,
  slow: 1000,
  critical: 3000,
} as const;

// In-memory metrics store
const queryMetrics: QueryMetric[] = [];
const METRICS_RETENTION = 5 * 60 * 1000; // 5 minutes

/**
 * Track a database query execution
 */
export async function trackQuery<T>(
  table: string,
  queryFn: () => Promise<{ data: T | null; error: Error | null; count?: number }>
): Promise<{ data: T | null; error: Error | null; count?: number }> {
  const startTime = performance.now();

  const result = await queryFn();

  const duration = performance.now() - startTime;
  const success = !result.error;

  const metric: QueryMetric = {
    query: `SELECT FROM ${table}`,
    table,
    duration,
    timestamp: Date.now(),
    success,
    rowCount: result.count,
  };

  // Store metric
  queryMetrics.push(metric);

  // Cleanup old metrics
  const cutoff = Date.now() - METRICS_RETENTION;
  while (queryMetrics.length > 0 && queryMetrics[0].timestamp < cutoff) {
    queryMetrics.shift();
  }

  // Track in Sentry
  Sentry.setMeasurement(`db.${table}.duration`, duration, 'millisecond');

  // Alert on slow queries
  if (duration > QUERY_THRESHOLDS.slow) {
    Sentry.addBreadcrumb({
      category: 'database',
      message: `Slow query on ${table}: ${duration.toFixed(0)}ms`,
      level: duration > QUERY_THRESHOLDS.critical ? 'warning' : 'info',
      data: { table, duration, rowCount: result.count },
    });
  }

  if (!success && result.error) {
    Sentry.captureException(result.error, {
      extra: { table, duration },
      tags: { type: 'database_error' },
    });
  }

  return result;
}

/**
 * Get query metrics for a specific table
 */
export function getTableMetrics(table: string): {
  avgDuration: number;
  p95Duration: number;
  successRate: number;
  queryCount: number;
} {
  const tableQueries = queryMetrics.filter((m) => m.table === table);

  if (tableQueries.length === 0) {
    return {
      avgDuration: 0,
      p95Duration: 0,
      successRate: 1,
      queryCount: 0,
    };
  }

  const durations = tableQueries.map((m) => m.duration).sort((a, b) => a - b);
  const successCount = tableQueries.filter((m) => m.success).length;

  return {
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
    successRate: successCount / tableQueries.length,
    queryCount: tableQueries.length,
  };
}

/**
 * Get all database metrics
 */
export function getAllMetrics(): {
  tables: Record<string, ReturnType<typeof getTableMetrics>>;
  totalQueries: number;
  overallSuccessRate: number;
  slowQueryCount: number;
} {
  const tables = new Set(queryMetrics.map((m) => m.table));
  const tableMetrics: Record<string, ReturnType<typeof getTableMetrics>> = {};

  tables.forEach((table) => {
    tableMetrics[table] = getTableMetrics(table);
  });

  const successCount = queryMetrics.filter((m) => m.success).length;
  const slowCount = queryMetrics.filter((m) => m.duration > QUERY_THRESHOLDS.slow).length;

  return {
    tables: tableMetrics,
    totalQueries: queryMetrics.length,
    overallSuccessRate: queryMetrics.length > 0 ? successCount / queryMetrics.length : 1,
    slowQueryCount: slowCount,
  };
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = performance.now();

  try {
    // Simple query to check connection
    const { error } = await supabase.from('profiles').select('id').limit(1).single();

    const latency = performance.now() - startTime;

    return {
      connected: !error || error.code === 'PGRST116', // No rows is ok
      latency,
      timestamp: Date.now(),
    };
  } catch {
    return {
      connected: false,
      latency: performance.now() - startTime,
      timestamp: Date.now(),
    };
  }
}

/**
 * Get query performance classification
 */
export function classifyQueryPerformance(durationMs: number): 'fast' | 'normal' | 'slow' | 'critical' {
  if (durationMs <= QUERY_THRESHOLDS.fast) return 'fast';
  if (durationMs <= QUERY_THRESHOLDS.normal) return 'normal';
  if (durationMs <= QUERY_THRESHOLDS.slow) return 'slow';
  return 'critical';
}

/**
 * Generate database health report
 */
export async function generateHealthReport(): Promise<{
  health: DatabaseHealth;
  metrics: ReturnType<typeof getAllMetrics>;
  recommendations: string[];
}> {
  const health = await checkDatabaseHealth();
  const metrics = getAllMetrics();
  const recommendations: string[] = [];

  // Generate recommendations based on metrics
  if (!health.connected) {
    recommendations.push('Database connection failed. Check Supabase status and credentials.');
  }

  if (health.latency > QUERY_THRESHOLDS.slow) {
    recommendations.push(
      `Database latency is high (${health.latency.toFixed(0)}ms). Consider connection pooling.`
    );
  }

  if (metrics.slowQueryCount > 0) {
    recommendations.push(
      `${metrics.slowQueryCount} slow queries detected. Review query patterns and indices.`
    );
  }

  Object.entries(metrics.tables).forEach(([table, tableMetrics]) => {
    if (tableMetrics.successRate < 0.99) {
      recommendations.push(
        `Table '${table}' has ${((1 - tableMetrics.successRate) * 100).toFixed(1)}% error rate.`
      );
    }
    if (tableMetrics.p95Duration > QUERY_THRESHOLDS.slow) {
      recommendations.push(
        `Table '${table}' P95 latency is ${tableMetrics.p95Duration.toFixed(0)}ms. Consider adding indices.`
      );
    }
  });

  return { health, metrics, recommendations };
}
