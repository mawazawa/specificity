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
  isEmailVerified: boolean;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
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

  // Check if user's email is verified
  const isEmailVerified = Boolean(user?.email_confirmed_at);

  // Memoized sign out function
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.'
    });
  }, [navigate, toast]);

  // Resend verification email
  const resendVerificationEmail = useCallback(async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'No email address found',
        variant: 'destructive'
      });
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Email Sent',
        description: 'Verification email has been resent. Please check your inbox.',
        variant: 'success'
      });
    }
  }, [user?.email, toast]);

  return {
    user,
    session,
    isLoading,
    isEmailVerified,
    signOut,
    resendVerificationEmail
  };
};
