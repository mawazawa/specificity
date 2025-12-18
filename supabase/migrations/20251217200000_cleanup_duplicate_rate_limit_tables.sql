-- Cleanup migration: Remove duplicate rate limiting infrastructure
--
-- BUG: Two rate limiting tables exist due to overlapping migrations:
--   1. public.rate_limits (plural) - old, unused
--   2. public.rate_limit (singular) - current, actively used
--
-- This migration removes the old table and associated database objects
-- to eliminate confusion, reduce bloat, and ensure single source of truth.

-- Drop old RLS policies for rate_limits (plural)
DROP POLICY IF EXISTS "Users can view own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Drop old cleanup function
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits();

-- Drop old indexes
DROP INDEX IF EXISTS public.idx_rate_limits_user_endpoint;
DROP INDEX IF EXISTS public.idx_rate_limits_window_start;

-- Drop the old rate_limits table (plural)
DROP TABLE IF EXISTS public.rate_limits;

-- Verify the current rate_limit table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'rate_limit'
  ) THEN
    RAISE EXCEPTION 'ERROR: rate_limit (singular) table does not exist! Migration aborted for safety.';
  END IF;
END $$;

-- Add comment documenting the cleanup
COMMENT ON TABLE public.rate_limit IS 'Active rate limiting table using hourly window bucketing. Legacy rate_limits (plural) table removed in migration 20251217200000.';
