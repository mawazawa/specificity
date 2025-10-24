-- Fix for P1 Bug: Rate limiting was not working due to unstable window_start
--
-- Problem: window_start = now() meant every request got a unique timestamp,
-- so ON CONFLICT never matched existing rows and request_count stayed at 1.
--
-- Solution: Use date_trunc('hour', now()) to bucket all requests in the same
-- hour to the same window_start value.

-- Drop and recreate the function with the fix
DROP FUNCTION IF EXISTS public.check_and_increment_rate_limit(uuid, text, integer, timestamptz);

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer,
  p_window_hours integer DEFAULT 1  -- New parameter: window size in hours
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
  v_window_start timestamptz;
  v_cutoff_time timestamptz;
BEGIN
  -- Calculate stable window start (rounded to hour boundary)
  v_window_start := date_trunc('hour', now());

  -- Calculate cutoff time for old windows
  v_cutoff_time := v_window_start - (p_window_hours || ' hours')::interval;

  -- Clean up old rate limit entries (outside current window)
  DELETE FROM public.rate_limit
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start < v_cutoff_time;

  -- Get or create current window entry (atomic operation)
  -- Now uses stable v_window_start instead of now()
  INSERT INTO public.rate_limit (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, v_window_start)
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
    'max_requests', p_max_requests,
    'window_start', v_window_start,
    'window_end', v_window_start + (p_window_hours || ' hours')::interval
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer) TO authenticated, service_role;
