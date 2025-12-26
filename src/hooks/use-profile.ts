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

  const upgradeToPro = async () => {
    // TODO: SECURITY - Move to server-side Edge Function with Stripe verification
    // This client-side update is a placeholder. In production:
    // 1. Call Edge Function that verifies Stripe payment
    // 2. Edge Function updates profile with service_role key
    // 3. RLS policy should DENY direct client writes to plan/credits columns
    console.warn('[Security] upgradeToPro should be server-side. This is a dev placeholder.');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    // In production, this should be: await supabase.functions.invoke('upgrade-to-pro')
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'pro', credits: 999 })
      .eq('id', user.id);

    if (error) throw error;
    await fetchProfile();
  };

  return { profile, isLoading, error, refresh: fetchProfile, upgradeToPro };
}
