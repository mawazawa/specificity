-- Create atomic rate limiting function to prevent race conditions
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
  v_count integer;
  v_remaining integer;
  v_window_start timestamptz;
BEGIN
  -- Atomic upsert - eliminates race condition
  INSERT INTO rate_limits (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, NOW())
  ON CONFLICT (user_id, endpoint) DO UPDATE
  SET 
    request_count = CASE
      WHEN rate_limits.window_start < p_window_start_cutoff THEN 1
      ELSE rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < p_window_start_cutoff THEN NOW()
      ELSE rate_limits.window_start
    END
  RETURNING request_count, window_start INTO v_count, v_window_start;
  
  v_remaining := GREATEST(0, p_max_requests - v_count);
  
  RETURN json_build_object(
    'allowed', v_count <= p_max_requests,
    'remaining', v_remaining,
    'count', v_count,
    'window_start', v_window_start
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer, timestamptz) TO service_role;