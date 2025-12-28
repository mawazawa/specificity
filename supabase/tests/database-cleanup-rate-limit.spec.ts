import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Bug Fix: Duplicate Rate Limit Tables Cleanup', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    // Use default local Supabase values
    const supabaseUrl = 'http://127.0.0.1:54321';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

    supabase = createClient(supabaseUrl, supabaseAnonKey);
  });

  test('OLD BUG: rate_limits (plural) table should NOT exist', async () => {
    const { error } = await supabase
      // @ts-expect-error Intentionally accessing non-existent table to verify it was removed
      .from('rate_limits')
      .select('id')
      .limit(1);

    expect(error).toBeTruthy();
    if (error) {
      const errorMsg = error.message.toLowerCase();
      const isRelationError = errorMsg.includes('relation') || errorMsg.includes('does not exist');
      expect(isRelationError).toBe(true);
      console.log('✅ BUG FIXED: rate_limits (plural) table correctly removed');
    }
  });

  test('NEW: rate_limit (singular) table exists and works', async () => {
    const { data: _data, error } = await supabase
      .from('rate_limit')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
    console.log('✅ VERIFIED: rate_limit (singular) exists');
  });

  test('FUNCTION: check_and_increment_rate_limit works', async () => {
    const { data: _data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: '00000000-0000-0000-0000-000000000001',
      p_endpoint: 'test-endpoint',
      p_max_requests: 10,
      p_window_hours: 1
    });

    expect(error).toBeNull();
    expect(data.allowed).toBe(true);
    expect(data).toHaveProperty('current_count');
    console.log('✅ FUNCTION WORKS:', data);
  });
});
