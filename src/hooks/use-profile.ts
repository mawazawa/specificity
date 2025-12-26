import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  credits: number;
  stripe_customer_id: string | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, () => {
        fetchProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
