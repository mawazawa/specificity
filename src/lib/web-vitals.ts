/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals (LCP, FID, CLS) and reports to Sentry
 */

import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

/**
 * Performance metric thresholds (based on Google's recommendations)
 * https://web.dev/metrics/
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 }, // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift (score)
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint (ms)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
};

/**
 * Rating for a metric value
 */
type MetricRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Get rating for a metric value
 */
function getRating(name: string, value: number): MetricRating {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report metric to Sentry
 */
function reportToSentry(metric: Metric): void {
  const { name, value, id, rating } = metric;

  // Send as a custom measurement to Sentry
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${name}: ${value.toFixed(2)}`,
    level: rating === 'poor' ? 'warning' : 'info',
    data: {
      metricId: id,
      value,
      rating,
    },
  });

  // For poor metrics, capture as a performance issue
  if (rating === 'poor') {
    Sentry.captureMessage(`Poor ${name} performance: ${value.toFixed(2)}`, {
      level: 'warning',
      tags: {
        metric: name,
        rating,
      },
      extra: {
        value,
        threshold: THRESHOLDS[name as keyof typeof THRESHOLDS],
        navigationType: metric.navigationType,
      },
    });
  }
}

/**
 * Log metric to console (development only)
 */
function logMetric(metric: Metric): void {
  if (import.meta.env.PROD) return;

  const { name, value, rating } = metric;

  logger.info(`[Web Vitals] ${name}: ${value.toFixed(2)} (${rating})`);
}

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(metric: Metric): Promise<void> {
  // Only send in production
  if (!import.meta.env.PROD) return;

  try {
    // Use sendBeacon for reliability
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
      url: window.location.href,
      timestamp: Date.now(),
    });

    // sendBeacon is non-blocking and survives page unload
    if (navigator.sendBeacon) {
      // In production, this would go to your analytics endpoint
      // navigator.sendBeacon('/api/web-vitals', body);
    }
  } catch {
    // Silently fail - web vitals reporting is not critical
  }
}

/**
 * Handle a web vital metric
 */
function handleMetric(metric: Metric): void {
  // Log in development
  logMetric(metric);

  // Report to Sentry
  reportToSentry(metric);

  // Send to analytics
  sendToAnalytics(metric);
}

/**
 * Initialize Web Vitals monitoring
 * Call this once in your app entry point (main.tsx)
 */
export function initWebVitals(): void {
  try {
    // Core Web Vitals
    onCLS(handleMetric);
    onFID(handleMetric);
    onLCP(handleMetric);

    // Additional metrics
    onFCP(handleMetric);
    onINP(handleMetric);
    onTTFB(handleMetric);

    if (!import.meta.env.PROD) {
      logger.info('[Web Vitals] Monitoring initialized');
    }
  } catch (error) {
    logger.error('[Web Vitals] Failed to initialize:', error);
  }
}

/**
 * Get current performance marks
 */
export function getPerformanceMarks(): PerformanceEntry[] {
  if (typeof performance === 'undefined') return [];
  return performance.getEntriesByType('mark');
}

/**
 * Get navigation timing data
 */
export function getNavigationTiming(): PerformanceNavigationTiming | null {
  if (typeof performance === 'undefined') return null;
  const entries = performance.getEntriesByType('navigation');
  return entries[0] as PerformanceNavigationTiming | null;
}

/**
 * Calculate custom performance metrics
 */
export function getCustomMetrics(): Record<string, number> {
  const timing = getNavigationTiming();
  if (!timing) return {};

  return {
    // DNS lookup time
    dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
    // TCP connection time
    tcpConnect: timing.connectEnd - timing.connectStart,
    // Time to first byte (from request start)
    ttfb: timing.responseStart - timing.requestStart,
    // DOM parsing time
    domParsing: timing.domContentLoadedEventEnd - timing.responseEnd,
    // Total page load time
    pageLoad: timing.loadEventEnd - timing.navigationStart,
    // DOM interactive
    domInteractive: timing.domInteractive - timing.navigationStart,
    // DOM complete
    domComplete: timing.domComplete - timing.navigationStart,
  };
}

/**
 * Mark a custom performance event
 */
export function markPerformance(name: string): void {
  if (typeof performance !== 'undefined') {
    performance.mark(`specificity-${name}`);
  }
}

/**
 * Measure time between two marks
 */
export function measurePerformance(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof performance === 'undefined') return null;

  try {
    performance.measure(
      `specificity-${name}`,
      `specificity-${startMark}`,
      `specificity-${endMark}`
    );
    const measures = performance.getEntriesByName(`specificity-${name}`);
    return measures.length > 0 ? measures[measures.length - 1].duration : null;
  } catch {
    return null;
  }
}
