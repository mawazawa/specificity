-- Performance indices for common query patterns
-- Action 13: Database Query Optimization (92% confidence)

-- ============================================
-- SPECIFICATIONS TABLE INDICES
-- ============================================

-- Composite index for user specs listing (most common query)
-- Query: SELECT * FROM specifications WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_specifications_user_created
  ON public.specifications(user_id, created_at DESC);

-- Partial index for public specs (filtered queries)
-- Query: SELECT * FROM specifications WHERE is_public = true
CREATE INDEX IF NOT EXISTS idx_specifications_public
  ON public.specifications(created_at DESC)
  WHERE is_public = true;

-- ============================================
-- PROFILES TABLE INDICES
-- ============================================

-- Index for Stripe customer lookups (webhook handling)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Index for Stripe subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
  ON public.profiles(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Index for plan-based filtering (admin queries)
CREATE INDEX IF NOT EXISTS idx_profiles_plan
  ON public.profiles(plan);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles(email)
  WHERE email IS NOT NULL;

-- ============================================
-- EVAL_RESULTS TABLE INDICES (if exists)
-- ============================================

-- Check if eval_results table exists and add indices
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'eval_results') THEN
    -- Index for session lookups
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_eval_results_session_id ON public.eval_results(session_id)';
    -- Index for date-based queries
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_eval_results_created_at ON public.eval_results(created_at DESC)';
  END IF;
END $$;

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

-- Update table statistics for query planner optimization
ANALYZE public.specifications;
ANALYZE public.profiles;
ANALYZE public.prompts;
ANALYZE public.prompt_usage;
ANALYZE public.rate_limit;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_specifications_user_created IS 'Optimizes user spec listing queries (user_id + created_at DESC)';
COMMENT ON INDEX idx_specifications_public IS 'Partial index for public specifications only';
COMMENT ON INDEX idx_profiles_stripe_customer_id IS 'Stripe webhook customer lookups';
COMMENT ON INDEX idx_profiles_stripe_subscription_id IS 'Subscription management queries';
COMMENT ON INDEX idx_profiles_plan IS 'Plan-based user filtering';
COMMENT ON INDEX idx_profiles_email IS 'Email lookup queries';
