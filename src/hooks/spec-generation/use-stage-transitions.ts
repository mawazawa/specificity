import { useState, useCallback } from 'react';

export type GenerationStage =
  | 'idle'
  | 'refinement'
  | 'questions'
  | 'research'
  | 'challenge'
  | 'synthesis'
  | 'review'
  | 'voting'
  | 'spec'
  | 'complete'
  | 'error';

interface StageMetadata {
  name: string;
  description: string;
  icon: string;
  order: number;
}

const STAGE_METADATA: Record<GenerationStage, StageMetadata> = {
  idle: { name: 'Idle', description: 'Ready to start', icon: '⏸️', order: 0 },
  refinement: { name: 'Refinement', description: 'Refining idea with questions', icon: '💭', order: 1 },
  questions: { name: 'Questions', description: 'Generating research questions', icon: '🧠', order: 2 },
  research: { name: 'Research', description: 'Deep research phase', icon: '🔬', order: 3 },
  challenge: { name: 'Challenge', description: 'Stress-testing ideas', icon: '⚔️', order: 4 },
  synthesis: { name: 'Synthesis', description: 'Expert synthesis', icon: '💡', order: 5 },
  review: { name: 'Review', description: 'Quality review', icon: '🔍', order: 6 },
  voting: { name: 'Voting', description: 'Consensus vote', icon: '🗳️', order: 7 },
  spec: { name: 'Specification', description: 'Generating spec', icon: '📄', order: 8 },
  complete: { name: 'Complete', description: 'Specification ready', icon: '✅', order: 9 },
  error: { name: 'Error', description: 'An error occurred', icon: '❌', order: -1 }
};

export function useStageTransitions() {
  const [currentStage, setCurrentStage] = useState<GenerationStage>('idle');

  const transitionToStage = useCallback((stage: GenerationStage) => {
    setCurrentStage(stage);
  }, []);

  const resetStage = useCallback(() => {
    setCurrentStage('idle');
  }, []);

  const goToError = useCallback(() => {
    setCurrentStage('error');
  }, []);

  const goToComplete = useCallback(() => {
    setCurrentStage('complete');
  }, []);

  const isStageActive = useCallback((stage: GenerationStage) => {
    return currentStage === stage;
  }, [currentStage]);

  const getStageMetadata = useCallback((stage: GenerationStage): StageMetadata => {
    return STAGE_METADATA[stage];
  }, []);

  const getCurrentStageMetadata = useCallback((): StageMetadata => {
    return STAGE_METADATA[currentStage];
  }, [currentStage]);

  const getStageProgress = useCallback((): number => {
    const currentOrder = STAGE_METADATA[currentStage].order;
    const maxOrder = STAGE_METADATA.complete.order;

    if (currentOrder < 0) return 0; // error state
    if (currentOrder >= maxOrder) return 100;

    return Math.round((currentOrder / maxOrder) * 100);
  }, [currentStage]);

  return {
    currentStage,
    setCurrentStage,
    transitionToStage,
    resetStage,
    goToError,
    goToComplete,
    isStageActive,
    getStageMetadata,
    getCurrentStageMetadata,
    getStageProgress
  };
}
