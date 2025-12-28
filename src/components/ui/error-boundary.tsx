import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';
import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional tag to identify which boundary caught the error */
  boundaryName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  eventId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report to Sentry with full context
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack || 'No stack available',
        },
      },
      tags: {
        boundary: this.props.boundaryName || 'unknown',
        errorType: error.name,
      },
      extra: {
        errorMessage: error.message,
        componentStack: errorInfo.componentStack,
      },
      // Fingerprint for deduplication
      fingerprint: ['react-error-boundary', error.name, error.message.slice(0, 100)],
    });

    // Store eventId for user feedback
    this.setState({ eventId });

    // Add breadcrumb for future errors
    Sentry.addBreadcrumb({
      category: 'error-boundary',
      message: `Error caught in ${this.props.boundaryName || 'unknown'} boundary`,
      level: 'error',
      data: {
        errorName: error.name,
        errorMessage: error.message,
      },
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, eventId: undefined });

    // Add breadcrumb for recovery
    Sentry.addBreadcrumb({
      category: 'error-boundary',
      message: 'User clicked Try Again',
      level: 'info',
    });
  };

  private handleReportFeedback = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="rounded-lg border border-border bg-card p-8 max-w-md">
            <AlertTriangle className="mx-auto h-12 w-12 text-warning mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.eventId && (
              <p className="text-xs text-muted-foreground mb-4">
                Error ID: {this.state.eventId.slice(0, 8)}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button onClick={this.handleReset} variant="default">
                Try Again
              </Button>
              {this.state.eventId && (
                <Button onClick={this.handleReportFeedback} variant="outline" size="sm">
                  Report Issue
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
