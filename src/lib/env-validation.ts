/**
 * Environment Variable Validation
 * Validates required environment variables at app startup
 */

import { z } from 'zod';
import { logger } from './logger';

/**
 * Schema for required environment variables
 */
const envSchema = z.object({
  // Supabase (required)
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL must be a valid URL')
    .refine(
      (url) => url.includes('supabase.co'),
      'VITE_SUPABASE_URL must be a Supabase URL'
    ),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'VITE_SUPABASE_ANON_KEY is required'),

  // Sentry (optional)
  VITE_SENTRY_DSN: z.string().optional(),

  // Debug mode (optional)
  VITE_DEBUG: z
    .enum(['true', 'false', ''])
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * Type for validated environment variables
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validation result
 */
export interface EnvValidationResult {
  success: boolean;
  config: EnvConfig | null;
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment variables
 * @returns Validation result with config or errors
 */
export function validateEnv(): EnvValidationResult {
  const warnings: string[] = [];

  // Get environment variables
  const env = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_DEBUG: import.meta.env.VITE_DEBUG,
  };

  // Validate with Zod
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `${path}: ${issue.message}`;
    });

    return {
      success: false,
      config: null,
      errors,
      warnings,
    };
  }

  // Add warnings for optional but recommended configs
  if (!result.data.VITE_SENTRY_DSN) {
    warnings.push(
      'VITE_SENTRY_DSN is not set. Error tracking is disabled.'
    );
  }

  return {
    success: true,
    config: result.data,
    errors: [],
    warnings,
  };
}

/**
 * Get a single environment variable with type safety
 */
export function getEnvVar<K extends keyof EnvConfig>(
  key: K
): EnvConfig[K] | undefined {
  const result = validateEnv();
  if (!result.success || !result.config) {
    return undefined;
  }
  return result.config[key];
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return import.meta.env.VITE_DEBUG === 'true';
}

/**
 * Log validation result (only in development)
 */
export function logEnvValidation(): void {
  if (isProduction()) return;

  const result = validateEnv();

  if (result.success) {
    logger.info('Environment variables validated successfully', { component: 'env-validation' });
    result.warnings.forEach((warning) => {
      logger.warn(warning, { component: 'env-validation' });
    });
  } else {
    logger.error('Environment validation failed', new Error(result.errors.join(', ')), {
      component: 'env-validation',
      errors: result.errors
    });
  }
}

/**
 * Assert environment is valid (throws if not)
 */
export function assertEnvValid(): EnvConfig {
  const result = validateEnv();

  if (!result.success) {
    const errorMsg = `Environment validation failed:\n${result.errors.join('\n')}`;
    throw new Error(errorMsg);
  }

  return result.config!;
}
