-- Add stripe_customer_id and subscription tracking if not already present
-- Note: 'stripe_customer_id' and 'stripe_subscription_id' were already in the initial creation migration,
-- but we verify index creation here for performance.

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Ensure RLS allows service role updates (webhook usage)
-- This is implicit as service_role bypasses RLS, but good to document.
