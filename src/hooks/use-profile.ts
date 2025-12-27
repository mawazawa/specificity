import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { categorizeError, logError } from '@/lib/errors';

export interface Profile {
  id: string;
  email: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  credits: number;
  stripe_customer_id: string | null;
}

export interface ProfileError {
  message: string;
  isAuthError: boolean;
  isRetryable: boolean;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ProfileError | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        logError('useProfile', authError, { context: 'getUser' });
        const categorized = categorizeError(authError);
        setError({
          message: categorized.message,
          isAuthError: categorized.category === 'auth',
          isRetryable: categorized.retryable,
        });
        setProfile(null);
        return;
      }

      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbError) {
        logError('useProfile', dbError, { context: 'fetchProfile', userId: user.id });
        const categorized = categorizeError(dbError);
        setError({
          message: categorized.message,
          isAuthError: false,
          isRetryable: categorized.retryable,
        });
        return;
      }

      setProfile(data as Profile);
    } catch (err) {
      logError('useProfile', err, { context: 'unexpected' });
      const categorized = categorizeError(err);
      setError({
        message: categorized.message,
        isAuthError: false,
        isRetryable: categorized.retryable,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Use void to explicitly ignore promise (async in useEffect)
    void fetchProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        void fetchProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfile]);

  const upgradeToPro = async (stripeSessionId: string, planType: 'pro' | 'enterprise' = 'pro') => {
    // Server-side upgrade via Edge Function with Stripe verification
    const { data, error } = await supabase.functions.invoke('upgrade-to-pro', {
      body: { stripeSessionId, planType }
    });

    if (error) {
      console.error('[upgradeToPro] Edge function error:', error);
      throw new Error(error.message || 'Failed to upgrade account');
    }

    if (data?.error) {
      // Handle specific error cases (e.g., payment required)
      if (data.checkoutUrl) {
        throw new Error(`PAYMENT_REQUIRED:${data.checkoutUrl}`);
      }
      throw new Error(data.error);
    }

    // Refresh profile to get updated plan/credits
    await fetchProfile();
    return data;
  };

  return { profile, isLoading, error, refresh: fetchProfile, upgradeToPro };
}
