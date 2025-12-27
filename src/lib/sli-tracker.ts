/**
 * Service Level Indicators (SLI) Tracking
 * Monitors availability, latency, and error rates
 * Action 40: SLI/SLO & Error Budgets (85% confidence)
 */

import * as Sentry from '@sentry/react';

// Service Level Objectives (SLOs)
export const SLO = {
  // Availability: 99.9% uptime
  availability: {
    target: 0.999,
    errorBudgetMonthly: 0.001, // 43.2 minutes/month
  },
  // Latency: 95th percentile < 2000ms
  latency: {
    p95Target: 2000, // ms
    p99Target: 5000, // ms
  },
  // Error rate: < 0.1%
  errorRate: {
    target: 0.001, // 0.1%
  },
  // Spec generation success rate: > 95%
  specGeneration: {
    successRate: 0.95,
  },
} as const;

export interface SLIMetrics {
  timestamp: number;
  availability: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  specSuccessRate: number;
}

export interface ErrorBudget {
  remainingMinutes: number;
  consumedPercent: number;
  isExhausted: boolean;
  resetDate: Date;
}

interface RequestMetric {
  startTime: number;
  endTime?: number;
  success: boolean;
  endpoint: string;
}

// In-memory metrics store (would be replaced by proper time-series DB in production)
const metrics = {
  requests: [] as RequestMetric[],
  specGenerations: { success: 0, failure: 0 },
  windowSize: 5 * 60 * 1000, // 5-minute sliding window
};

/**
 * Track an API request for SLI calculation
 */
export function trackRequest(endpoint: string): () => void {
  const metric: RequestMetric = {
    startTime: Date.now(),
    success: true,
    endpoint,
  };

  metrics.requests.push(metric);

  // Cleanup old metrics outside window
  const cutoff = Date.now() - metrics.windowSize;
  metrics.requests = metrics.requests.filter((m) => m.startTime > cutoff);

  // Return completion function
  return (success = true) => {
    metric.endTime = Date.now();
    metric.success = success;

    // Track in Sentry
    const duration = metric.endTime - metric.startTime;
    Sentry.setMeasurement(`api.${endpoint}.duration`, duration, 'millisecond');

    if (!success) {
      Sentry.addBreadcrumb({
        category: 'sli',
        message: `Request failed: ${endpoint}`,
        level: 'warning',
        data: { duration },
      });
    }
  };
}

/**
 * Track spec generation outcome
 */
export function trackSpecGeneration(success: boolean): void {
  if (success) {
    metrics.specGenerations.success++;
  } else {
    metrics.specGenerations.failure++;
  }
}

/**
 * Calculate current SLI metrics
 */
export function calculateSLI(): SLIMetrics {
  const now = Date.now();
  const recentRequests = metrics.requests.filter(
    (m) => m.endTime && m.startTime > now - metrics.windowSize
  );

  if (recentRequests.length === 0) {
    return {
      timestamp: now,
      availability: 1,
      latencyP95: 0,
      latencyP99: 0,
      errorRate: 0,
      specSuccessRate: 1,
    };
  }

  // Calculate availability (successful requests / total)
  const successfulRequests = recentRequests.filter((m) => m.success);
  const availability = successfulRequests.length / recentRequests.length;

  // Calculate latency percentiles
  const latencies = recentRequests
    .map((m) => (m.endTime || now) - m.startTime)
    .sort((a, b) => a - b);

  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);

  const latencyP95 = latencies[p95Index] || 0;
  const latencyP99 = latencies[p99Index] || latencies[latencies.length - 1] || 0;

  // Calculate error rate
  const errorRate = 1 - availability;

  // Calculate spec success rate
  const totalSpecs = metrics.specGenerations.success + metrics.specGenerations.failure;
  const specSuccessRate = totalSpecs > 0 ? metrics.specGenerations.success / totalSpecs : 1;

  return {
    timestamp: now,
    availability,
    latencyP95,
    latencyP99,
    errorRate,
    specSuccessRate,
  };
}

/**
 * Calculate remaining error budget for the month
 */
export function calculateErrorBudget(): ErrorBudget {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Calculate monthly minutes
  const totalMinutesInMonth = (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60);

  // Error budget in minutes (0.1% of month)
  const budgetMinutes = totalMinutesInMonth * SLO.availability.errorBudgetMonthly;

  // Calculate consumed error budget based on current availability
  const sli = calculateSLI();
  const elapsedMinutes = (now.getTime() - monthStart.getTime()) / (1000 * 60);
  const expectedUptime = elapsedMinutes * SLO.availability.target;
  const actualUptime = elapsedMinutes * sli.availability;
  const consumedMinutes = expectedUptime - actualUptime;

  const remainingMinutes = Math.max(0, budgetMinutes - consumedMinutes);
  const consumedPercent = (consumedMinutes / budgetMinutes) * 100;

  return {
    remainingMinutes,
    consumedPercent: Math.min(100, consumedPercent),
    isExhausted: remainingMinutes <= 0,
    resetDate: monthEnd,
  };
}

/**
 * Check if SLOs are being met
 */
export function checkSLOCompliance(): {
  compliant: boolean;
  violations: string[];
} {
  const sli = calculateSLI();
  const violations: string[] = [];

  if (sli.availability < SLO.availability.target) {
    violations.push(
      `Availability ${(sli.availability * 100).toFixed(2)}% < ${SLO.availability.target * 100}%`
    );
  }

  if (sli.latencyP95 > SLO.latency.p95Target) {
    violations.push(`P95 Latency ${sli.latencyP95}ms > ${SLO.latency.p95Target}ms`);
  }

  if (sli.errorRate > SLO.errorRate.target) {
    violations.push(
      `Error Rate ${(sli.errorRate * 100).toFixed(2)}% > ${SLO.errorRate.target * 100}%`
    );
  }

  if (sli.specSuccessRate < SLO.specGeneration.successRate) {
    violations.push(
      `Spec Success ${(sli.specSuccessRate * 100).toFixed(2)}% < ${SLO.specGeneration.successRate * 100}%`
    );
  }

  return {
    compliant: violations.length === 0,
    violations,
  };
}

/**
 * Send SLO alert to Sentry if violations detected
 */
export function alertOnSLOViolation(): void {
  const compliance = checkSLOCompliance();

  if (!compliance.compliant) {
    Sentry.captureMessage('SLO Violation Detected', {
      level: 'warning',
      extra: {
        violations: compliance.violations,
        sli: calculateSLI(),
        errorBudget: calculateErrorBudget(),
      },
      tags: {
        type: 'slo_violation',
      },
    });
  }
}

/**
 * Start periodic SLO monitoring
 */
export function startSLOMonitoring(intervalMs = 60000): () => void {
  const intervalId = setInterval(() => {
    alertOnSLOViolation();
  }, intervalMs);

  return () => clearInterval(intervalId);
}
