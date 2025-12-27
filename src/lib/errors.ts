/**
 * Error Categorization and Handling Utilities
 * Provides consistent error handling across the application
 */

/**
 * Error categories for user-friendly messaging
 */
export type ErrorCategory =
  | 'validation'
  | 'network'
  | 'timeout'
  | 'rate_limit'
  | 'auth'
  | 'permission'
  | 'not_found'
  | 'server'
  | 'client'
  | 'unknown';

/**
 * Structured error information for UI display
 */
export interface CategorizedError {
  category: ErrorCategory;
  title: string;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  originalError?: Error;
}

/**
 * Categorize an error for user-friendly display
 * @param error - The error to categorize
 * @returns Structured error information
 */
export function categorizeError(error: unknown): CategorizedError {
  const errMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errMessage.toLowerCase();

  // Validation errors
  if (errMessage.startsWith('VALIDATION:') || lowerMessage.includes('validation')) {
    return {
      category: 'validation',
      title: 'Invalid Input',
      message: errMessage.replace('VALIDATION: ', ''),
      recoverable: true,
      retryable: false,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  // Rate limit errors
  if (errMessage.startsWith('RATE_LIMIT:') || lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
    return {
      category: 'rate_limit',
      title: 'Rate Limit Exceeded',
      message: 'You\'ve made too many requests. Please wait a moment and try again.',
      recoverable: true,
      retryable: true,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  // Timeout errors
  if (errMessage.startsWith('TIMEOUT:') || lowerMessage.includes('timeout') || lowerMessage.includes('504')) {
    return {
      category: 'timeout',
      title: 'Request Timed Out',
      message: 'The operation took too long. Please try again.',
      recoverable: true,
      retryable: true,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return {
      category: 'network',
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      recoverable: true,
      retryable: true,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  // Auth errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401') || lowerMessage.includes('auth')) {
    return {
      category: 'auth',
      title: 'Authentication Required',
      message: 'Please sign in to continue.',
      recoverable: true,
      retryable: false,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  // Permission errors
  if (lowerMessage.includes('forbidden') || lowerMessage.includes('403') || lowerMessage.includes('permission')) {
    return {
      category: 'permission',
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      recoverable: false,
      retryable: false,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  // Not found errors
  if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
    return {
      category: 'not_found',
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      recoverable: false,
      retryable: false,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  // Server errors
  if (lowerMessage.includes('500') || lowerMessage.includes('502') || lowerMessage.includes('503') || lowerMessage.includes('server')) {
    return {
      category: 'server',
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      recoverable: true,
      retryable: true,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  // Client errors (file reading, canvas, etc.)
  if (lowerMessage.includes('filereader') || lowerMessage.includes('canvas') || lowerMessage.includes('blob')) {
    return {
      category: 'client',
      title: 'Processing Error',
      message: 'Failed to process the file. Please try a different file or format.',
      recoverable: true,
      retryable: true,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  // Unknown errors
  return {
    category: 'unknown',
    title: 'Something Went Wrong',
    message: errMessage || 'An unexpected error occurred. Please try again.',
    recoverable: true,
    retryable: true,
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * Create a toast-friendly error object
 */
export function toToastError(error: unknown): {
  title: string;
  description: string;
  variant: 'destructive' | 'default';
} {
  const categorized = categorizeError(error);
  return {
    title: categorized.title,
    description: categorized.message,
    variant: 'destructive',
  };
}

/**
 * Log error with context for debugging
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const categorized = categorizeError(error);

  console.error(`[${context}] ${categorized.category}:`, {
    title: categorized.title,
    message: categorized.message,
    recoverable: categorized.recoverable,
    retryable: categorized.retryable,
    ...metadata,
    originalError: error,
  });
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: unknown): boolean {
  return categorizeError(error).retryable;
}

/**
 * Check if an error is recoverable (user can take action)
 */
export function isRecoverable(error: unknown): boolean {
  return categorizeError(error).recoverable;
}

/**
 * Create a user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  return categorizeError(error).message;
}

/**
 * Wrap an async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string,
  onError?: (error: CategorizedError) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const categorized = categorizeError(error);
    logError(context, error);
    onError?.(categorized);
    return null;
  }
}
