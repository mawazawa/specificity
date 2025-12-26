-- SECURITY FIX: Enable RLS on prompts tables
-- These tables were created without RLS, exposing system prompts to all authenticated users
-- This migration adds proper row-level security policies

-- =============================================================================
-- ENABLE RLS ON ALL PROMPTS-RELATED TABLES
-- =============================================================================

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_usage ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROMPTS TABLE POLICIES
-- System prompts should be read-only for authenticated users, write-only for service_role
-- =============================================================================

-- Service role has full access (used by Edge Functions)
CREATE POLICY "Service role has full access to prompts"
  ON public.prompts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can only read active prompts
CREATE POLICY "Authenticated users can read active prompts"
  ON public.prompts
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =============================================================================
-- PROMPT_VERSIONS TABLE POLICIES
-- Version history is internal - no client access needed
-- =============================================================================

-- Service role has full access
CREATE POLICY "Service role has full access to prompt_versions"
  ON public.prompt_versions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No policies for authenticated users - they cannot access version history
-- This prevents version enumeration and rollback attacks

-- =============================================================================
-- PROMPT_USAGE TABLE POLICIES
-- Usage tracking: Edge Functions insert, no client read access
-- =============================================================================

-- Service role has full access
CREATE POLICY "Service role has full access to prompt_usage"
  ON public.prompt_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No policies for authenticated users - usage analytics are internal
-- This prevents business intelligence leakage (cost data, usage patterns)

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY "Service role has full access to prompts" ON public.prompts IS
  'Edge Functions use service_role to manage prompts';

COMMENT ON POLICY "Authenticated users can read active prompts" ON public.prompts IS
  'Users can only read active prompts, cannot modify or see inactive ones';

COMMENT ON POLICY "Service role has full access to prompt_versions" ON public.prompt_versions IS
  'Only Edge Functions can access version history';

COMMENT ON POLICY "Service role has full access to prompt_usage" ON public.prompt_usage IS
  'Only Edge Functions can read/write usage analytics';
