import { useCallback, useRef } from 'react';
import { ResumeContext } from '@/types/spec';
import { useToast } from '@/hooks/use-toast';
import { scopedLogger } from '@/lib/logger';
import { DialogueEntry } from './use-dialogue';

interface UsePauseResumeProps {
  isPaused: boolean;
  pendingResume: ResumeContext | null;
  setPaused: (paused: boolean) => void;
  setSessionState: (state: any) => void;
  addHistory: (type: string, data: any) => void;
  addDialogue: (entry: DialogueEntry) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  setCurrentStage: (stage: string) => void;
  runRound: (input: string, roundNumber: number, userComment?: string) => Promise<void>;
  parseError: (error: unknown) => { title: string; message: string };
  setError: (error: string) => void;
}

export function usePauseResume({
  isPaused,
  pendingResume,
  setPaused,
  setSessionState,
  addHistory,
  addDialogue,
  isProcessing,
  setIsProcessing,
  setCurrentStage,
  runRound,
  parseError,
  setError
}: UsePauseResumeProps) {
  const logger = scopedLogger('usePauseResume');
  const { toast } = useToast();
  const pendingResumeRef = useRef<ResumeContext | null>(null);

  const setPendingResume = useCallback((context: ResumeContext | null) => {
    pendingResumeRef.current = context;
    setSessionState({ pendingResume: context });
  }, [setSessionState]);

  const pause = useCallback(() => {
    setPaused(true);
    toast({ title: 'Paused', description: 'Session paused. Add your comments.' });
  }, [setPaused, toast]);

  const resume = useCallback(async (comment?: string) => {
    if (comment) {
      addHistory('user-comment', { comment });
      addDialogue({
        agent: 'user',
        message: comment,
        timestamp: new Date().toISOString(),
        type: 'user'
      });
    }
    setPaused(false);
    toast({ title: 'Resuming', description: 'Continuing with your guidance...' });

    // Use ONLY the ref value to avoid stale closure issues
    const currentPendingResume = pendingResumeRef.current;
    if (!currentPendingResume || isProcessing) {
      return;
    }

    setPendingResume(null);
    setIsProcessing(true);
    setCurrentStage('questions');

    try {
      await runRound(
        currentPendingResume.input,
        currentPendingResume.nextRound,
        comment ?? currentPendingResume.userComment
      );
    } catch (error) {
      logger.error('Resume failed', error instanceof Error ? error : new Error(String(error)), { action: 'resume' });
      const { title, message } = parseError(error);
      toast({ title, description: message, variant: 'destructive' });
      setError(message);
      setIsProcessing(false);
      setCurrentStage('error');
    }
  }, [
    setPaused,
    toast,
    addHistory,
    addDialogue,
    isProcessing,
    setPendingResume,
    runRound,
    parseError,
    setIsProcessing,
    setCurrentStage,
    setError
  ]);

  return {
    pause,
    resume,
    setPendingResume,
    pendingResumeRef
  };
}
