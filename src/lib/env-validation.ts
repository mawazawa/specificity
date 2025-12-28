/**
 * Environment Variable Validation
 * Validates required environment variables at app startup
 *
 * Usage:
 *   import { env } from '@/lib/env-validation';
 *   console.log(env.VITE_SUPABASE_URL);
 */

import { z } from 'zod';

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

  // Built-in Vite variables
  DEV: z.boolean(),
  PROD: z.boolean(),
  MODE: z.string(),
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
  const rawEnv = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_DEBUG: import.meta.env.VITE_DEBUG,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    MODE: import.meta.env.MODE,
  };

  // Validate with Zod
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      // Don't expose sensitive values in error messages
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
 * Cached validated environment config
 * Initialized lazily on first access
 */
let cachedEnv: EnvConfig | null = null;

/**
 * Get validated environment variables
 * Throws if validation fails
 * @returns Typed environment config
 */
function getValidatedEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = validateEnv();

  if (!result.success) {
    const errorMsg = `Environment validation failed:\n${result.errors.join('\n')}`;
    throw new Error(errorMsg);
  }

  cachedEnv = result.config!;
  return cachedEnv;
}

/**
 * Type-safe environment variable object
 * Use this instead of import.meta.env for type safety
 *
 * @example
 * import { env } from '@/lib/env-validation';
 * const url = env.VITE_SUPABASE_URL; // Fully typed!
 */
export const env = new Proxy({} as EnvConfig, {
  get(_target, prop: string) {
    const validatedEnv = getValidatedEnv();
    return validatedEnv[prop as keyof EnvConfig];
  },
});

/**
 * Get a single environment variable with type safety
 * @deprecated Use `env.KEY` instead for better type safety
 */
export function getEnvVar<K extends keyof EnvConfig>(
  key: K
): EnvConfig[K] | undefined {
  try {
    const validatedEnv = getValidatedEnv();
    return validatedEnv[key];
  } catch {
    return undefined;
  }
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return env.DEV;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return env.PROD;
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return env.VITE_DEBUG === true;
}

/**
 * Log validation result (only in development)
 * Uses console directly to avoid circular dependency with logger
 */
export function logEnvValidation(): void {
  if (isProduction()) return;

  const result = validateEnv();

  if (result.success) {

    console.info('[ENV] Environment variables validated successfully');
    result.warnings.forEach((warning) => {

      console.warn(`[ENV] ${warning}`);
    });
  } else {

    console.error('[ENV] Environment validation failed:', result.errors.join(', '));
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
