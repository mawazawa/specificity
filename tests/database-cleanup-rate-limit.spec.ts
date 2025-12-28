import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Bug Fix: Duplicate Rate Limit Tables Cleanup', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseAnonKey) {
      throw new Error('VITE_SUPABASE_ANON_KEY must be set');
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);
  });

  test('BEFORE FIX: Old rate_limits table should NOT exist', async () => {
    // Try to select from the old rate_limits (plural) table
    // This should FAIL because we cleaned it up
    const { error } = await supabase
      // @ts-expect-error Intentionally accessing non-existent table to verify it was removed
      .from('rate_limits')
      .select('id')
      .limit(1);

    // We EXPECT an error - the table should not exist
    expect(error).toBeTruthy();
    if (error) {
      // Error message should indicate the relation/table doesn't exist
      const errorMsg = error.message.toLowerCase();
      const isRelationError = errorMsg.includes('relation') || errorMsg.includes('does not exist') || errorMsg.includes('not found');
      expect(isRelationError).toBe(true);
      console.log('✅ OLD BUG FIXED: rate_limits (plural) table correctly removed');
    }
  });

  test('AFTER FIX: New rate_limit table should exist and be functional', async () => {
    // Query the current rate_limit (singular) table
    const { data: _data, error } = await supabase
      .from('rate_limit')
      .select('*')
      .limit(1);

    // Should succeed without error
    expect(error).toBeNull();
    console.log('✅ NEW TABLE VERIFIED: rate_limit (singular) exists and is queryable');
  });

  test('AFTER FIX: check_and_increment_rate_limit function should work correctly', async () => {
    const testUserId = '00000000-0000-0000-0000-000000000099';
    const testEndpoint = 'test-cleanup-verification';

    // Call the rate limit function
    const { data: _data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: testUserId,
      p_endpoint: testEndpoint,
      p_max_requests: 10,
      p_window_hours: 1
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();

    // Verify response has required fields
    expect(data).toHaveProperty('allowed');
    expect(data).toHaveProperty('remaining');
    expect(data).toHaveProperty('current_count');

    // First call should be allowed
    expect(data.allowed).toBe(true);
    expect(data.current_count).toBe(1);

    console.log('✅ FUNCTION WORKING: check_and_increment_rate_limit operates correctly');
    console.log(`   First request: allowed=${data.allowed}, count=${data.current_count}, remaining=${data.remaining}`);
  });

  test('AFTER FIX: Old cleanup_old_rate_limits function should NOT exist', async () => {
    // Try to call the old function - should fail
    // @ts-expect-error Intentionally calling non-existent function to verify it was removed
    const { error } = await supabase.rpc('cleanup_old_rate_limits');

    // We EXPECT an error - the function should not exist
    expect(error).toBeTruthy();
    if (error) {
      const errorMsg = error.message.toLowerCase();
      const isFunctionError = errorMsg.includes('function') || errorMsg.includes('does not exist') || errorMsg.includes('not found');
      expect(isFunctionError).toBe(true);
      console.log('✅ OLD FUNCTION REMOVED: cleanup_old_rate_limits no longer exists');
    }
  });

  test('VERIFICATION: Rate limiting works correctly with window bucketing', async () => {
    const testUserId = '00000000-0000-0000-0000-000000000100';
    const testEndpoint = 'test-window-bucketing';
    const maxRequests = 3;

    // Make first request
    const { data: req1 } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: testUserId,
      p_endpoint: testEndpoint,
      p_max_requests: maxRequests,
      p_window_hours: 1
    });

    expect(req1.current_count).toBe(1);
    expect(req1.allowed).toBe(true);

    // Make second request immediately
    const { data: req2 } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: testUserId,
      p_endpoint: testEndpoint,
      p_max_requests: maxRequests,
      p_window_hours: 1
    });

    expect(req2.current_count).toBe(2);
    expect(req2.allowed).toBe(true);

    // Both should have same window_start (bucketed to hour)
    expect(req1.window_start).toBe(req2.window_start);

    console.log('✅ WINDOW BUCKETING VERIFIED: Multiple requests correctly share same hourly window');
    console.log(`   Request 1: count=${req1.current_count}, window=${req1.window_start}`);
    console.log(`   Request 2: count=${req2.current_count}, window=${req2.window_start}`);
  });

  test('REGRESSION TEST: Rate limit enforcement works', async () => {
    const testUserId = '00000000-0000-0000-0000-000000000101';
    const testEndpoint = 'test-limit-enforcement';
    const maxRequests = 2;

    // Use up the limit
    for (let i = 1; i <= maxRequests; i++) {
      const { data } = await supabase.rpc('check_and_increment_rate_limit', {
        p_user_id: testUserId,
        p_endpoint: testEndpoint,
        p_max_requests: maxRequests,
        p_window_hours: 1
      });

      expect(data.allowed).toBe(true);
      expect(data.current_count).toBe(i);
    }

    // Exceed the limit
    const { data: exceededReq } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: testUserId,
      p_endpoint: testEndpoint,
      p_max_requests: maxRequests,
      p_window_hours: 1
    });

    // Should be blocked
    expect(exceededReq.allowed).toBe(false);
    expect(exceededReq.remaining).toBe(0);
    expect(exceededReq.current_count).toBeGreaterThan(maxRequests);

    console.log('✅ RATE LIMITING WORKS: Correctly blocks requests after limit exceeded');
    console.log(`   Final request: allowed=${exceededReq.allowed}, count=${exceededReq.current_count}`);
  });
});
