/**
 * Structured Logger for Production
 * Replaces console.* with Sentry-integrated logging
 * Action 32: Console Cleanup & Logging (95% confidence)
 */

import * as Sentry from '@sentry/react';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  specId?: string;
  stage?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error | unknown, context?: LogContext): void;
}

/**
 * Check if we're in development mode
 */
const isDev = import.meta.env.DEV;

/**
 * Log to console only in development
 */
function devLog(level: LogLevel, message: string, ...args: unknown[]): void {
  if (!isDev) return;

  switch (level) {
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, ...args);
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${message}`, ...args);
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`, ...args);
      break;
    case 'error':
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, ...args);
      break;
  }
}

/**
 * Add breadcrumb to Sentry for tracing
 */
function addBreadcrumb(
  level: Sentry.SeverityLevel,
  message: string,
  context?: LogContext
): void {
  Sentry.addBreadcrumb({
    category: context?.component || 'app',
    message,
    level,
    data: context,
  });
}

/**
 * Create a logger instance with optional default context
 */
export function createLogger(defaultContext?: LogContext): Logger {
  const mergeContext = (context?: LogContext): LogContext => ({
    ...defaultContext,
    ...context,
    timestamp: new Date().toISOString(),
  });

  return {
    debug(message: string, context?: LogContext): void {
      const ctx = mergeContext(context);
      devLog('debug', message, ctx);
      // Don't send debug to Sentry in production
    },

    info(message: string, context?: LogContext): void {
      const ctx = mergeContext(context);
      devLog('info', message, ctx);
      addBreadcrumb('info', message, ctx);
    },

    warn(message: string, context?: LogContext): void {
      const ctx = mergeContext(context);
      devLog('warn', message, ctx);
      addBreadcrumb('warning', message, ctx);
    },

    error(message: string, error?: Error | unknown, context?: LogContext): void {
      const ctx = mergeContext(context);
      devLog('error', message, error, ctx);

      // Capture exception in Sentry
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: ctx,
          tags: {
            component: ctx.component,
            action: ctx.action,
          },
        });
      } else if (error) {
        Sentry.captureMessage(`${message}: ${String(error)}`, {
          level: 'error',
          extra: { ...ctx, rawError: error },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: ctx,
        });
      }
    },
  };
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create a scoped logger for a specific component
 */
export function scopedLogger(component: string): Logger {
  return createLogger({ component });
}

/**
 * Performance logging utility
 */
export function logPerformance(
  metric: string,
  value: number,
  context?: LogContext
): void {
  const ctx = { ...context, metric, value };
  devLog('info', `Performance: ${metric}=${value}ms`, ctx);
  addBreadcrumb('info', `Performance: ${metric}`, ctx);

  // Send to Sentry as a custom metric
  Sentry.setMeasurement(metric, value, 'millisecond');
}

/**
 * API call logging utility
 */
export function logApiCall(
  endpoint: string,
  method: string,
  status: number,
  durationMs: number,
  context?: LogContext
): void {
  const ctx = { ...context, endpoint, method, status, durationMs };
  const level = status >= 400 ? 'warn' : 'info';
  devLog(level, `API ${method} ${endpoint} -> ${status} (${durationMs}ms)`, ctx);
  addBreadcrumb(level === 'warn' ? 'warning' : 'info', `API ${method} ${endpoint}`, ctx);
}

/**
 * User action logging utility
 */
export function logUserAction(action: string, context?: LogContext): void {
  const ctx = { ...context, action };
  devLog('info', `User action: ${action}`, ctx);
  addBreadcrumb('info', `User: ${action}`, ctx);
}
