/**
 * Validation utilities for user input
 * Provides reusable validation functions with error feedback
 */

import { z } from 'zod';
import { userInputSchema, chatMessageSchema, safeUrlSchema } from '@/types/schemas';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate user spec input (25-5000 characters)
 */
export function validateUserInput(input: string): ValidationResult<string> {
  const result = userInputSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const error = result.error.issues[0]?.message || 'Invalid input';
  return { success: false, error };
}

/**
 * Validate chat message (1-2000 characters)
 */
export function validateChatMessage(message: string): ValidationResult<string> {
  const result = chatMessageSchema.safeParse(message);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const error = result.error.issues[0]?.message || 'Invalid message';
  return { success: false, error };
}

/**
 * Validate URL for security
 */
export function validateUrl(url: string): ValidationResult<string> {
  const result = safeUrlSchema.safeParse(url);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const error = result.error.issues[0]?.message || 'Invalid URL';
  return { success: false, error };
}

/**
 * Generic validation wrapper for any Zod schema
 */
export function validate<T>(value: unknown, schema: z.ZodType<T>): ValidationResult<T> {
  const result = schema.safeParse(value);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const error = result.error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  return { success: false, error };
}

/**
 * Create validation error message for toast notification
 */
export function createValidationError(field: string, message: string): {
  title: string;
  description: string;
  variant: 'destructive';
} {
  return {
    title: `Invalid ${field}`,
    description: message,
    variant: 'destructive' as const,
  };
}

/**
 * Character counter with validation state
 */
export function getCharacterCount(
  value: string,
  min: number,
  max: number
): { count: number; remaining: number; isValid: boolean; isWarning: boolean } {
  const count = value.length;
  const remaining = max - count;
  const isValid = count >= min && count <= max;
  const isWarning = count >= min && remaining <= 100; // Warn when close to limit

  return { count, remaining, isValid, isWarning };
}
