/// <reference types="vite/client" />

/**
 * Type definitions for Vite environment variables
 * All client-side env vars must be prefixed with VITE_
 */
interface ImportMetaEnv {
  // Required Supabase configuration
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;

  // Optional error tracking
  readonly VITE_SENTRY_DSN?: string;

  // Optional debug mode
  readonly VITE_DEBUG?: string;

  // Built-in Vite variables
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly SSR: boolean;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
