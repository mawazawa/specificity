/**
 * useSessionPersistence Hook - Extracted from Index.tsx
 * Handles debounced localStorage persistence with quota management
 *
 * Security improvements:
 * - Zod schema validation on hydration (prevents XSS/corruption)
 * - Safe JSON parsing with error recovery
 *
 * Performance improvements:
 * - Debounced writes (2s delay, 10s maxWait) vs every state change
 * - Quota error handling
 * - Session age validation (24h expiry)
 * - Automatic flush on unmount
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { safeJsonParse } from '@/lib/utils';
import { sessionDataSchema, type SessionData } from '@/types/schemas';
import type { DialogueEntry } from '@/components/DialoguePanel';
import type { SessionState } from '@/types/spec';
import { scopedLogger } from '@/lib/logger';
import {
  getUsagePercentage,
  isNearQuota,
  clearOldestEntries,
  getStorageStats
} from '@/lib/storage-quota';

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
  const logger = scopedLogger('SessionPersistence');
  const { toast } = useToast();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydratedData, setHydratedData] = useState<Partial<SessionData> | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastWriteRef = useRef<number>(0);
  const pendingDataRef = useRef<SessionData | null>(null);
  const isWritingRef = useRef<boolean>(false);

  // Generate storage key
  const getStorageKey = useCallback(() => {
    return userId ? `specificity-session-${userId}` : null;
  }, [userId]);

  // Persist to localStorage with quota management
  const persistSession = useCallback((data: SessionData) => {
    const key = getStorageKey();
    if (!key) return;

    try {
      // Check quota before attempting to save
      const usagePercentage = getUsagePercentage();

      // Warn user when near quota (>80%)
      if (usagePercentage > 80 && usagePercentage < 95) {
        const stats = getStorageStats();
        logger.warn('Storage usage high', {
          action: 'persistSession',
          percentage: usagePercentage,
          usedMB: stats.usedMB.toFixed(2),
          quotaMB: stats.quotaMB
        });

        toast({
          title: 'Storage Nearly Full',
          description: `Using ${usagePercentage.toFixed(0)}% of available space. Old sessions may be cleared automatically.`,
          variant: 'default'
        });
      }

      // Auto-cleanup when at 95%+
      if (isNearQuota(0.95)) {
        logger.info('Storage critical, triggering cleanup', {
          action: 'persistSession',
          percentage: usagePercentage
        });

        const removed = clearOldestEntries('specificity-session-', 0.7, 10);

        if (removed > 0) {
          toast({
            title: 'Storage Cleanup',
            description: `Removed ${removed} old session${removed > 1 ? 's' : ''} to free up space.`,
            variant: 'default'
          });
        }
      }

      let dataToStore = data;
      let serialized = JSON.stringify(dataToStore);

      // Check if individual session data is too large (>4MB)
      if (serialized.length > MAX_STORAGE_SIZE) {
        logger.warn('Session data exceeds 4MB, truncating dialogue history', {
          action: 'persistSession',
          size: serialized.length,
          maxSize: MAX_STORAGE_SIZE
        });

        dataToStore = {
          ...data,
          dialogueEntries: data.dialogueEntries.slice(-20) // Keep last 20 entries
        };
        serialized = JSON.stringify(dataToStore);
      }

      localStorage.setItem(key, serialized);
      lastWriteRef.current = Date.now();

      logger.debug('Session persisted successfully', {
        action: 'persistSession',
        size: serialized.length,
        storageUsage: `${getUsagePercentage().toFixed(1)}%`
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        logger.error('Quota exceeded despite checks, clearing old sessions', error, {
          action: 'persistSession'
        });

        // Emergency cleanup: clear old sessions
        const removed = clearOldestEntries('specificity-session-', 0.5, 20);

        toast({
          title: 'Storage Full',
          description: `Cleared ${removed} old sessions to make room. Please export important specs.`,
          variant: 'destructive'
        });

        // Retry once after aggressive clearing
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (retryError) {
          logger.error('Failed to persist after emergency cleanup', retryError instanceof Error ? retryError : new Error(String(retryError)), {
            action: 'persistSession'
          });

          toast({
            title: 'Storage Error',
            description: 'Unable to save session. Please clear browser storage or export your work.',
            variant: 'destructive'
          });
        }
      } else {
        logger.error('Persistence failed', error instanceof Error ? error : new Error(String(error)), {
          action: 'persistSession'
        });
      }
    }
  }, [getStorageKey, toast]);

  // Debounced persist function
  const debouncedPersist = useCallback((data: SessionData) => {
    pendingDataRef.current = data;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Force write if maxWait exceeded
    const timeSinceLastWrite = Date.now() - lastWriteRef.current;
    if (timeSinceLastWrite >= MAX_WAIT && pendingDataRef.current && !isWritingRef.current) {
      isWritingRef.current = true;
      persistSession(pendingDataRef.current);
      pendingDataRef.current = null;
      isWritingRef.current = false;
      return;
    }

    // Schedule debounced write
    debounceTimerRef.current = setTimeout(() => {
      if (pendingDataRef.current && !isWritingRef.current) {
        isWritingRef.current = true;
        persistSession(pendingDataRef.current);
        pendingDataRef.current = null;
        isWritingRef.current = false;
      }
    }, DEBOUNCE_DELAY);
  }, [persistSession]);

  // Hydrate on mount with schema validation
  useEffect(() => {
    const key = getStorageKey();
    if (!key) {
      setIsHydrated(true);
      return;
    }

    const savedSession = localStorage.getItem(key);
    if (!savedSession) {
      setIsHydrated(true);
      return;
    }

    // Use safe parsing with Zod schema validation
    const parseResult = safeJsonParse(savedSession, sessionDataSchema);

    if (!parseResult.success) {
      logger.error('Session validation failed', parseResult.error instanceof Error ? parseResult.error : new Error(String(parseResult.error)), {
        action: 'hydrateFromStorage'
      });
      // Clear corrupted session
      localStorage.removeItem(key);
      toast({
        title: 'Session Corrupted',
        description: 'Previous session data was invalid and has been cleared',
        variant: 'destructive'
      });
      setIsHydrated(true);
      return;
    }

    const parsed = parseResult.data;
    const sessionAge = Date.now() - new Date(parsed.timestamp).getTime();

    if (sessionAge < MAX_SESSION_AGE_MS) {
      // Use Zod-validated data directly (type is already inferred from schema)
      setHydratedData(parsed);
      toast({
        title: 'Session Restored',
        description: 'Your previous work has been recovered'
      });
    } else {
      // Clear expired session
      localStorage.removeItem(key);
      logger.info('Session expired, cleared', {
        action: 'hydrateFromStorage',
        sessionAge
      });
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
