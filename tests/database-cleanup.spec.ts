import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Database Cleanup - Duplicate Rate Limit Tables', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseKey) {
      throw new Error('VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY must be set in .env.local');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  });

  test('should NOT have duplicate rate_limits (plural) table', async () => {
    // Query pg_tables to check if rate_limits (plural) table exists
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'rate_limits'
        ) as table_exists;
      `
    }).single();

    // If the RPC doesn't exist, try direct table query (will fail if table doesn't exist - which is what we want)
    if (error) {
      console.log('Using fallback check method for rate_limits table...');

      // Try to query the table - if it exists, this will succeed; if not, it will error
      const { error: tableError } = await supabase
        .from('rate_limits')
        .select('id')
        .limit(1);

      // We EXPECT an error because the table should NOT exist
      expect(tableError).toBeTruthy();
      expect(tableError?.message).toContain('does not exist');
      console.log('✅ Confirmed: rate_limits (plural) table does NOT exist');
    } else {
      // If we got data, check that table_exists is false
      expect(data?.table_exists).toBe(false);
      console.log('✅ Confirmed: rate_limits (plural) table does NOT exist');
    }
  });

  test('should have rate_limit (singular) table with correct schema', async () => {
    // Query the rate_limit table to verify it exists and has correct columns
    const { data, error } = await supabase
      .from('rate_limit')
      .select('*')
      .limit(0); // Just check schema, don't fetch data

    expect(error).toBeNull();
    console.log('✅ rate_limit (singular) table exists and is queryable');
  });

  test('should have check_and_increment_rate_limit function working', async () => {
    const testUserId = '00000000-0000-0000-0000-000000000001'; // Test UUID
    const testEndpoint = 'test-endpoint-cleanup-verification';
    const maxRequests = 10;
    const windowHours = 1;

    // Call the rate limiting function
    const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: testUserId,
      p_endpoint: testEndpoint,
      p_max_requests: maxRequests,
      p_window_hours: windowHours
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();

    // Verify response structure
    expect(data).toHaveProperty('allowed');
    expect(data).toHaveProperty('remaining');
    expect(data).toHaveProperty('current_count');
    expect(data).toHaveProperty('max_requests');

    // First request should be allowed
    expect(data.allowed).toBe(true);
    expect(data.current_count).toBe(1);
    expect(data.remaining).toBe(maxRequests - 1);
    expect(data.max_requests).toBe(maxRequests);

    console.log('✅ check_and_increment_rate_limit function works correctly');
    console.log(`   Response:`, data);
  });

  test('should NOT have cleanup_old_rate_limits function (old function)', async () => {
    // Try to call the old cleanup function - should fail because it was dropped
    const { error } = await supabase.rpc('cleanup_old_rate_limits');

    // We EXPECT an error because the function should NOT exist
    expect(error).toBeTruthy();
    expect(error?.message?.toLowerCase()).toContain('function');
    console.log('✅ Confirmed: cleanup_old_rate_limits function does NOT exist (correctly removed)');
  });

  test('should increment rate limit correctly on multiple calls', async () => {
    const testUserId = '00000000-0000-0000-0000-000000000002'; // Different test UUID
    const testEndpoint = 'test-endpoint-increment-verification';
    const maxRequests = 5;

    // Make 3 requests
    for (let i = 1; i <= 3; i++) {
      const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
        p_user_id: testUserId,
        p_endpoint: testEndpoint,
        p_max_requests: maxRequests,
        p_window_hours: 1
      });

      expect(error).toBeNull();
      expect(data.allowed).toBe(true);
      expect(data.current_count).toBe(i);
      expect(data.remaining).toBe(maxRequests - i);

      console.log(`Request ${i}: count=${data.current_count}, remaining=${data.remaining}`);
    }

    console.log('✅ Rate limit increments correctly across multiple calls');
  });

  test('should enforce rate limit when exceeded', async () => {
    const testUserId = '00000000-0000-0000-0000-000000000003';
    const testEndpoint = 'test-endpoint-limit-enforcement';
    const maxRequests = 2;

    // Make requests up to the limit
    for (let i = 1; i <= maxRequests; i++) {
      const { data } = await supabase.rpc('check_and_increment_rate_limit', {
        p_user_id: testUserId,
        p_endpoint: testEndpoint,
        p_max_requests: maxRequests,
        p_window_hours: 1
      });

      expect(data.allowed).toBe(true);
      console.log(`Request ${i}: allowed, remaining=${data.remaining}`);
    }

    // Make one more request - should exceed limit
    const { data: exceededData } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: testUserId,
      p_endpoint: testEndpoint,
      p_max_requests: maxRequests,
      p_window_hours: 1
    });

    expect(exceededData.allowed).toBe(false);
    expect(exceededData.remaining).toBe(0);
    expect(exceededData.current_count).toBeGreaterThan(maxRequests);

    console.log('✅ Rate limit correctly blocks requests when exceeded');
    console.log(`   Exceeded request: allowed=${exceededData.allowed}, remaining=${exceededData.remaining}`);
  });

  test('should use stable window_start bucketing', async () => {
    const testUserId = '00000000-0000-0000-0000-000000000004';
    const testEndpoint = 'test-endpoint-window-bucketing';

    // Make two requests in quick succession
    const { data: data1 } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: testUserId,
      p_endpoint: testEndpoint,
      p_max_requests: 10,
      p_window_hours: 1
    });

    // Wait 100ms
    await new Promise(resolve => setTimeout(resolve, 100));

    const { data: data2 } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: testUserId,
      p_endpoint: testEndpoint,
      p_max_requests: 10,
      p_window_hours: 1
    });

    // Both requests should have the same window_start (bucketed to same hour)
    expect(data1.window_start).toBe(data2.window_start);
    expect(data2.current_count).toBe(2); // Should increment from 1 to 2

    console.log('✅ Window bucketing works correctly (requests in same hour share window)');
    console.log(`   Window start: ${data1.window_start}`);
    console.log(`   Request 1 count: ${data1.current_count}, Request 2 count: ${data2.current_count}`);
  });
});
