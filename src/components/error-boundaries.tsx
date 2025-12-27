/**
 * Specialized Error Boundaries
 * Context-aware error handling with recovery options
 * Action 24: Smart Error Boundaries (93% confidence)
 */

import React, { Component, ErrorInfo, ReactNode, createContext, useContext, useCallback, useState } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import * as Sentry from '@sentry/react';

// ============================================
// TYPES
// ============================================

interface ErrorBoundaryContextType {
  resetBoundary: () => void;
  clearSession: () => void;
}

interface BaseErrorBoundaryProps {
  children: ReactNode;
  boundaryName: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  eventId?: string;
}

// ============================================
// CONTEXT
// ============================================

const ErrorBoundaryContext = createContext<ErrorBoundaryContextType | null>(null);

/**
 * Hook to access error boundary controls
 */
export function useErrorBoundary(): ErrorBoundaryContextType {
  const context = useContext(ErrorBoundaryContext);
  if (!context) {
    return {
      resetBoundary: () => console.warn('No error boundary context available'),
      clearSession: () => console.warn('No error boundary context available'),
    };
  }
  return context;
}

// ============================================
// SPEC GENERATION ERROR BOUNDARY
// ============================================

interface SpecGenerationBoundaryProps extends BaseErrorBoundaryProps {
  onClearSession?: () => void;
  sessionId?: string;
}

/**
 * Specialized error boundary for spec generation flow
 * Provides options to retry or clear session
 */
export class SpecGenerationBoundary extends Component<
  SpecGenerationBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: { componentStack: errorInfo.componentStack || '' },
        specGeneration: { sessionId: this.props.sessionId },
      },
      tags: {
        boundary: 'spec-generation',
        errorType: error.name,
      },
      fingerprint: ['spec-generation', error.name],
    });

    this.setState({ eventId });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, eventId: undefined });
    this.props.onReset?.();
    Sentry.addBreadcrumb({
      category: 'error-recovery',
      message: 'User retried spec generation',
      level: 'info',
    });
  };

  handleClearSession = () => {
    this.props.onClearSession?.();
    // Clear localStorage session data
    try {
      localStorage.removeItem('specificity_session');
      localStorage.removeItem('specificity_dialogue');
    } catch {
      // Ignore storage errors
    }
    this.setState({ hasError: false, error: undefined, eventId: undefined });
    Sentry.addBreadcrumb({
      category: 'error-recovery',
      message: 'User cleared session after error',
      level: 'info',
    });
  };

  render() {
    if (this.state.hasError) {
      const isTimeoutError = this.state.error?.message?.includes('timeout');
      const isNetworkError = this.state.error?.message?.includes('network') ||
        this.state.error?.message?.includes('fetch');

      return (
        <Card className="p-8 max-w-lg mx-auto mt-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-warning" />
            <h2 className="text-xl font-semibold">Spec Generation Error</h2>

            <p className="text-muted-foreground">
              {isTimeoutError
                ? 'The operation took too long. This might be due to high demand.'
                : isNetworkError
                  ? 'Network connection lost. Please check your internet connection.'
                  : this.state.error?.message || 'An unexpected error occurred during spec generation.'}
            </p>

            {this.state.eventId && (
              <p className="text-xs text-muted-foreground">
                Error ID: {this.state.eventId.slice(0, 8)}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleClearSession}
                variant="outline"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear & Restart
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Your input has been saved. Click "Try Again" to resume.
            </p>
          </div>
        </Card>
      );
    }

    const contextValue: ErrorBoundaryContextType = {
      resetBoundary: this.handleRetry,
      clearSession: this.handleClearSession,
    };

    return (
      <ErrorBoundaryContext.Provider value={contextValue}>
        {this.props.children}
      </ErrorBoundaryContext.Provider>
    );
  }
}

// ============================================
// CHAT ERROR BOUNDARY
// ============================================

interface ChatBoundaryProps extends BaseErrorBoundaryProps {
  onReturnToSpec?: () => void;
}

/**
 * Specialized error boundary for chat interactions
 */
export class ChatBoundary extends Component<ChatBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      tags: { boundary: 'chat' },
      contexts: { react: { componentStack: errorInfo.componentStack || '' } },
    });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Chat temporarily unavailable
          </p>
          <div className="flex gap-2">
            <Button onClick={this.handleRetry} size="sm" variant="outline">
              Retry
            </Button>
            {this.props.onReturnToSpec && (
              <Button
                onClick={this.props.onReturnToSpec}
                size="sm"
                variant="ghost"
              >
                View Spec
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// EXPORT ERROR BOUNDARY
// ============================================

/**
 * Specialized error boundary for export operations
 */
export class ExportBoundary extends Component<BaseErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      tags: { boundary: 'export' },
    });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
          <p className="text-sm text-destructive mb-2">
            Export failed: {this.state.error?.message || 'Unknown error'}
          </p>
          <Button onClick={this.handleRetry} size="sm" variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// PAGE ERROR BOUNDARY
// ============================================

interface PageBoundaryProps extends BaseErrorBoundaryProps {
  homePath?: string;
}

/**
 * Full-page error boundary with navigation options
 */
export class PageBoundary extends Component<PageBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      tags: { boundary: 'page', page: this.props.boundaryName },
      contexts: { react: { componentStack: errorInfo.componentStack || '' } },
    });
    this.setState({ eventId });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, eventId: undefined });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    window.location.href = this.props.homePath || '/';
  };

  handleReportFeedback = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
          <Card className="p-8 max-w-md text-center">
            <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Page Error</h1>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || 'Something went wrong loading this page.'}
            </p>

            {this.state.eventId && (
              <p className="text-xs text-muted-foreground mb-4">
                Reference: {this.state.eventId.slice(0, 8)}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
              {this.state.eventId && (
                <Button
                  onClick={this.handleReportFeedback}
                  variant="ghost"
                  size="sm"
                >
                  Report Issue
                </Button>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// ERROR BOUNDARY HOOK (for function components)
// ============================================

interface UseErrorHandlerOptions {
  onError?: (error: Error) => void;
  fallback?: ReactNode;
}

/**
 * Hook for handling errors in function components
 * Throws to nearest error boundary
 */
export function useErrorHandler(options?: UseErrorHandlerOptions) {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error) => {
    options?.onError?.(err);
    setError(err);
  }, [options]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // If there's an error, throw it to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}

// ============================================
// ASYNC ERROR WRAPPER
// ============================================

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  onError?: (error: Error) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));

    Sentry.captureException(error, {
      tags: { context },
    });

    onError?.(error);
    return null;
  }
}
