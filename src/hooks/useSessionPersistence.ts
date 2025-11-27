/**
 * useSessionPersistence Hook - Extracted from Index.tsx
 * Handles debounced localStorage persistence with quota management
 *
 * Performance improvements:
 * - Debounced writes (2s delay, 10s maxWait) vs every state change
 * - Quota error handling
 * - Session age validation (24h expiry)
 * - Automatic flush on unmount
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { DialogueEntry } from '@/components/DialoguePanel';
import type { SessionState } from '@/types/spec';

interface SessionData {
  generatedSpec: string;
  dialogueEntries: DialogueEntry[];
  sessionState: SessionState;
  timestamp: string;
}

interface UseSessionPersistenceProps {
  userId: string | undefined;
  generatedSpec: string;
  dialogueEntries: DialogueEntry[];
  sessionState: SessionState;
}

interface UseSessionPersistenceReturn {
  hydratedData: Partial<SessionData> | null;
  isHydrated: boolean;
}

// Max session age: 24 hours
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

// Debounce delay: 2 seconds
const DEBOUNCE_DELAY = 2000;

// Max wait before forced write: 10 seconds
const MAX_WAIT = 10000;

// Max storage size: 4MB (leave 1MB buffer for 5MB limit)
const MAX_STORAGE_SIZE = 4 * 1024 * 1024;

export const useSessionPersistence = ({
  userId,
  generatedSpec,
  dialogueEntries,
  sessionState
}: UseSessionPersistenceProps): UseSessionPersistenceReturn => {
  const { toast } = useToast();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydratedData, setHydratedData] = useState<Partial<SessionData> | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastWriteRef = useRef<number>(0);
  const pendingDataRef = useRef<SessionData | null>(null);

  // Generate storage key
  const getStorageKey = useCallback(() => {
    return userId ? `specificity-session-${userId}` : null;
  }, [userId]);

  // Persist to localStorage with error handling
  const persistSession = useCallback((data: SessionData) => {
    const key = getStorageKey();
    if (!key) return;

    try {
      let dataToStore = data;
      let serialized = JSON.stringify(dataToStore);

      // Check quota - truncate dialogue if too large
      if (serialized.length > MAX_STORAGE_SIZE) {
        console.warn('[SessionPersistence] Data exceeds 4MB, truncating dialogue history');
        dataToStore = {
          ...data,
          dialogueEntries: data.dialogueEntries.slice(-20) // Keep last 20 entries
        };
        serialized = JSON.stringify(dataToStore);
      }

      localStorage.setItem(key, serialized);
      lastWriteRef.current = Date.now();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('[SessionPersistence] Quota exceeded, clearing old sessions');
        // Clear only specificity sessions, not all localStorage
        Object.keys(localStorage)
          .filter(k => k.startsWith('specificity-session-'))
          .forEach(k => localStorage.removeItem(k));

        // Retry once after clearing
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch {
          console.error('[SessionPersistence] Failed to persist after clearing');
        }
      } else {
        console.error('[SessionPersistence] Persistence failed:', error);
      }
    }
  }, [getStorageKey]);

  // Debounced persist function
  const debouncedPersist = useCallback((data: SessionData) => {
    pendingDataRef.current = data;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Force write if maxWait exceeded
    const timeSinceLastWrite = Date.now() - lastWriteRef.current;
    if (timeSinceLastWrite >= MAX_WAIT && pendingDataRef.current) {
      persistSession(pendingDataRef.current);
      pendingDataRef.current = null;
      return;
    }

    // Schedule debounced write
    debounceTimerRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        persistSession(pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }, DEBOUNCE_DELAY);
  }, [persistSession]);

  // Hydrate on mount
  useEffect(() => {
    const key = getStorageKey();
    if (!key) {
      setIsHydrated(true);
      return;
    }

    try {
      const savedSession = localStorage.getItem(key);
      if (savedSession) {
        const parsed: SessionData = JSON.parse(savedSession);
        const sessionAge = Date.now() - new Date(parsed.timestamp).getTime();

        if (sessionAge < MAX_SESSION_AGE_MS) {
          setHydratedData(parsed);
          toast({
            title: 'Session Restored',
            description: 'Your previous work has been recovered'
          });
        } else {
          // Clear expired session
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('[SessionPersistence] Hydration failed:', error);
    }

    setIsHydrated(true);
  }, [getStorageKey, toast]);

  // Persist on data changes (debounced)
  useEffect(() => {
    if (!isHydrated || !userId) return;

    const hasData = generatedSpec ||
                    dialogueEntries.length > 0 ||
                    sessionState.rounds.length > 0;

    if (hasData) {
      debouncedPersist({
        generatedSpec,
        dialogueEntries,
        sessionState,
        timestamp: new Date().toISOString()
      });
    }
  }, [
    userId,
    generatedSpec,
    dialogueEntries,
    sessionState,
    isHydrated,
    debouncedPersist
  ]);

  // Flush pending writes on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (pendingDataRef.current) {
        // Synchronous write on unmount
        const key = getStorageKey();
        if (key) {
          try {
            localStorage.setItem(key, JSON.stringify(pendingDataRef.current));
          } catch {
            // Best effort on unmount
          }
        }
      }
    };
  }, [getStorageKey]);

  return {
    hydratedData,
    isHydrated
  };
};
