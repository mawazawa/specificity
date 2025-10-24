-- Create rate_limit table for API request tracking
CREATE TABLE IF NOT EXISTS public.rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint
  ON public.rate_limit(user_id, endpoint, window_start);

-- Enable RLS
ALTER TABLE public.rate_limit ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own rate limits"
  ON public.rate_limit FOR SELECT
  USING (auth.uid() = user_id);

-- Atomic rate limit check and increment function
-- This prevents race conditions when checking rate limits
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer,
  p_window_start_cutoff timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count integer;
  v_allowed boolean;
  v_remaining integer;
BEGIN
  -- Clean up old rate limit entries (outside current window)
  DELETE FROM public.rate_limit
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start < p_window_start_cutoff;

  -- Get or create current window entry (atomic operation)
  INSERT INTO public.rate_limit (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, now())
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET
    request_count = rate_limit.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_current_count;

  -- Check if within limit
  v_allowed := v_current_count <= p_max_requests;
  v_remaining := GREATEST(0, p_max_requests - v_current_count);

  RETURN json_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'current_count', v_current_count,
    'max_requests', p_max_requests
  );
END;
$$;

-- Add unique constraint to prevent duplicate windows
-- (Note: this must be added after the function is created to avoid conflicts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rate_limit_user_endpoint_window_unique'
  ) THEN
    ALTER TABLE public.rate_limit
    ADD CONSTRAINT rate_limit_user_endpoint_window_unique
    UNIQUE (user_id, endpoint, window_start);
  END IF;
END $$;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_rate_limit_updated_at
  BEFORE UPDATE ON public.rate_limit
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit TO authenticated, service_role;
