/**
 * useAuth Hook - Extracted from Index.tsx
 * Handles Supabase authentication state and session verification
 *
 * Performance improvements:
 * - Centralized auth logic (was duplicated across components)
 * - Single subscription cleanup
 * - Memoized signOut function
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Authentication state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        if (!currentSession) {
          navigate('/auth');
        }
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setIsLoading(false);

      if (!existingSession) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Periodic session verification (every minute)
  useEffect(() => {
    const verifySession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        await supabase.auth.signOut();
        navigate('/auth');
      }
    };

    const interval = setInterval(verifySession, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Memoized sign out function
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.'
    });
  }, [navigate, toast]);

  return {
    user,
    session,
    isLoading,
    signOut
  };
};
