import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import { logger } from '@/lib/logger';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safe JSON parse with Zod schema validation
 * Prevents corrupted/malicious localStorage data from crashing the app
 *
 * @param jsonString - Raw JSON string to parse
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated data, or null if invalid
 *
 * @example
 * const data = safeJsonParse(localStorage.getItem('key'), mySchema);
 * if (data) {
 *   // Use validated data safely
 * }
 */
export function safeJsonParse<T>(
  jsonString: string | null | undefined,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; error: string } {
  if (!jsonString) {
    return { success: false, error: 'No data to parse' };
  }

  try {
    const parsed = JSON.parse(jsonString);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    }

    // Format Zod errors for debugging
    const errorMessages = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ');

    logger.warn('[safeJsonParse] Validation failed:', errorMessages);
    return { success: false, error: `Validation failed: ${errorMessages}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    logger.error('[safeJsonParse] JSON parse failed:', message);
    return { success: false, error: `Parse failed: ${message}` };
  }
}

/**
 * Generate a simple hash for data integrity verification
 * Uses a fast non-cryptographic hash suitable for tamper detection
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
