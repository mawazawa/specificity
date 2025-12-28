import { useState, useCallback } from 'react';
import { useTasks } from './use-tasks';
import { useDialogue, DialogueEntry } from './use-dialogue';
import { useSession } from './use-session';
import { useStageTransitions, GenerationStage } from './use-stage-transitions';
import { usePauseResume } from './use-pause-resume';
import * as stageHandlers from './stage-handlers';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AgentConfig, SessionState, AgentType, Round } from '@/types/spec';
import { scopedLogger } from '@/lib/logger';
import { categorizeError } from '@/lib/llm-client';

export type { GenerationStage };

interface UseSpecFlowProps {
  agentConfigs: AgentConfig[];
}

export function useSpecFlow({ agentConfigs }: UseSpecFlowProps) {
  const logger = scopedLogger('useSpecFlow');
  const { tasks, addTask, updateTask, resetTasks } = useTasks();
  const { entries: dialogueEntries, addEntry: addDialogue, resetDialogue, setDialogue } = useDialogue();
  const {
    sessionState,
    generatedSpec,
    techStack,
    mockupUrl,
    startSession,
    addRound,
    updateCurrentRound,
    addHistory,
    setPaused,
    setGeneratedSpec,
    setTechStack,
    setMockupUrl,
    resetSession,
    setSessionState
  } = useSession();

  const { currentStage, setCurrentStage, resetStage } = useStageTransitions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const parseError = useCallback((error: unknown): { title: string; message: string } => {
    const errorCategory = categorizeError(error);

    switch (errorCategory.type) {
      case 'rate_limit':
        return {
          title: '⚠️ Rate Limit Exceeded',
          message: "You've reached the rate limit. Please wait a few minutes and try again."
        };

      case 'provider_failure':
        return {
          title: '⚠️ Provider Issue Detected',
          message: 'Automatic failover in progress. Your request will be retried with a backup provider.'
        };

      case 'timeout':
        return {
          title: '⚠️ Request Timeout',
          message: 'The request took too long to complete. Please try again or simplify your request.'
        };

      case 'network':
        return {
          title: '⚠️ Network Error',
          message: 'Unable to connect to the service. Please check your internet connection and try again.'
        };

      case 'validation':
        return {
          title: '⚠️ Validation Error',
          message: errorCategory.message.replace('VALIDATION: ', '')
        };

      default:
        return {
          title: 'Error',
          message: errorCategory.message || 'An error occurred during processing'
        };
    }
  }, []);

  const runRound = useCallback(async (
    input: string,
    roundNumber: number,
    userComment?: string
  ) => {
    // Create new round object
    const round: Round = {
      roundNumber,
      stage: 'questions',
      questions: [],
      research: [],
      answers: [],
      votes: [],
      status: 'in-progress',
      userComment
    };

    addRound(round);

    try {
      const deps = { addDialogue, addHistory, addTask, updateTask, toast };

      // ========================================
      // STAGE 1: DYNAMIC QUESTION GENERATION
      // ========================================
      round.stage = 'questions';
      setCurrentStage('questions');
      await stageHandlers.executeQuestionsStage(input, round, deps);

      // ========================================
      // STAGE 2: PARALLEL RESEARCH WITH TOOLS
      // ========================================
      round.stage = 'research';
      setCurrentStage('research');
      await stageHandlers.executeResearchStage(agentConfigs, round, roundNumber, deps);

      // ========================================
      // STAGE 2.5: CHALLENGE/DEBATE
      // ========================================
      round.stage = 'challenge';
      setCurrentStage('challenge');
      await stageHandlers.executeChallengeStage(agentConfigs, round, roundNumber, deps);

      // ========================================
      // STAGE 3: EXPERT SYNTHESIS
      // ========================================
      round.stage = 'answers';
      setCurrentStage('synthesis');
      const synthesisData = await stageHandlers.executeSynthesisStage(agentConfigs, round, roundNumber, userComment, deps);

      // ========================================
      // STAGE 3.5: QUALITY REVIEW
      // ========================================
      round.stage = 'review';
      setCurrentStage('review');
      await stageHandlers.executeReviewStage(round, synthesisData.syntheses, deps);

      // ========================================
      // STAGE 4: CONSENSUS VOTING
      // ========================================
      round.stage = 'voting';
      setCurrentStage('voting');
      await stageHandlers.executeVotingStage(agentConfigs, round, synthesisData.syntheses, deps);

      round.status = 'complete';
      updateCurrentRound(round); // Update the round in state

      // Guard against division by zero when votes array is empty
      const approvalRate = round.votes.length > 0
        ? round.votes.filter((v) => v.approved).length / round.votes.length
        : 0;

      if (approvalRate >= 0.6 || roundNumber >= 3) {
        // ========================================
        // STAGE 5: FINAL SPECIFICATION GENERATION
        // ========================================
        round.stage = 'spec';
        setCurrentStage('spec');
        await stageHandlers.executeSpecStage(round, synthesisData.syntheses, setGeneratedSpec, setTechStack, setMockupUrl, deps);

        setIsProcessing(false);
        setCurrentStage('complete');
      } else {
        toast({
          title: `Round ${roundNumber} Complete`,
          description: `${Math.round(approvalRate * 100)}% approval. Starting next round...`
        });

        if (!sessionState.isPaused) {
          // Recursive call for next round
          await runRound(input, roundNumber + 1, userComment);
        } else {
          // If paused, just stop here
          setPendingResume({ input, nextRound: roundNumber + 1, userComment });
          setIsProcessing(false);
        }
      }

    } catch (error) {
      logger.error('Round error', error instanceof Error ? error : new Error(String(error)), { action: 'runRound', roundNumber });
      const { title, message } = parseError(error);
      toast({ title, description: message, variant: 'destructive', duration: 8000 });
      setError(message);
      setIsProcessing(false);
      setCurrentStage('error');
    }
  }, [
    agentConfigs,
    addTask,
    updateTask,
    addDialogue,
    addHistory,
    setGeneratedSpec,
    setMockupUrl,
    setTechStack,
    addRound,
    updateCurrentRound,
    sessionState.isPaused,
    toast,
    parseError,
    setCurrentStage
  ]);

  // Initialize pause/resume hook after runRound is defined
  const { pause, resume, setPendingResume, pendingResumeRef } = usePauseResume({
    isPaused: sessionState.isPaused,
    pendingResume: sessionState.pendingResume,
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
  });

  const startGeneration = useCallback(async (input: string) => {
    resetSession();
    resetDialogue();
    resetTasks();
    setPendingResume(null);
    setIsProcessing(true);
    setCurrentStage('questions');
    startSession(); // Dispatch start session

    try {
      await runRound(input, 1);
    } catch (error) {
      logger.error('Spec generation failed', error instanceof Error ? error : new Error(String(error)), { action: 'startGeneration' });
      const { title, message } = parseError(error);
      toast({
        title,
        description: message,
        variant: 'destructive'
      });
      setError(message);
      setIsProcessing(false);
      setCurrentStage('error');
    }
  }, [runRound, toast, parseError, resetSession, resetDialogue, resetTasks, startSession, setPendingResume, setCurrentStage]);

  const reset = useCallback(() => {
    resetSession();
    resetDialogue();
    resetTasks();
    setPendingResume(null);
    setIsProcessing(false);
    resetStage();
    setError(null);
  }, [resetSession, resetDialogue, resetTasks, setPendingResume, resetStage]);

  const hydrateFromStorage = useCallback((data: {
    generatedSpec?: string;
    dialogueEntries?: DialogueEntry[];
    sessionState?: SessionState;
  } | null) => {
    if (!data) return;

    if (data.sessionState) {
      setSessionState(data.sessionState);
      pendingResumeRef.current = data.sessionState.pendingResume ?? null;
    }

    if (data.dialogueEntries) {
      setDialogue(data.dialogueEntries);
    }

    if (typeof data.generatedSpec === 'string') {
      setGeneratedSpec(data.generatedSpec);
      setCurrentStage('complete');
    } else {
      setCurrentStage('idle');
    }

    setIsProcessing(false);
  }, [setSessionState, setDialogue, setGeneratedSpec, setCurrentStage, pendingResumeRef]);

  const startRefinement = useCallback(async (input: string) => {
    resetSession();
    resetDialogue();
    resetTasks();
    setPendingResume(null);
    setIsProcessing(true);
    setCurrentStage('refinement');
    startSession();

    addDialogue({
      agent: 'user',
      message: input,
      timestamp: new Date().toISOString(),
      type: 'user'
    });

    try {
      // Find a suitable agent for PM role (Steve or first enabled)
      const pmAgent = agentConfigs.find(c => c.enabled && c.agent === 'steve') || 
                      agentConfigs.find(c => c.enabled) || 
                      agentConfigs[0];

      if (!pmAgent) throw new Error("No agents available");

      const prompt = `I have a product idea: "${input}". 
      
      Act as a Senior Product Manager. Your goal is to refine this idea into a solid spec.
      I want you to ask me the **single most important** clarifying question to define the scope right now.
      
      Format your response exactly like this:
      **Question:** [The question]
      **Context:** [Why this matters]
      
      **Options:**
      A) [Option A]
      B) [Option B]
      C) [Option C]
      D) [Option D - "Something else" / Custom]
      
      **Recommendation:** I recommend [Option] because [Reason].
      
      Do not ask multiple questions. Ask only one.`;
      
      const response = await api.chatWithAgent(agentConfigs, pmAgent.agent, prompt);
      
      addDialogue({
        agent: pmAgent.agent as AgentType,
        message: response.response,
        timestamp: response.timestamp,
        type: 'question'
      });
      
      setIsProcessing(false);
    } catch (error) {
      logger.error('Refinement failed', error instanceof Error ? error : new Error(String(error)), { action: 'startRefinement' });
      const { title, message } = parseError(error);
      toast({ title, description: message, variant: 'destructive' });
      setError(message);
      setIsProcessing(false);
    }
  }, [agentConfigs, resetSession, resetDialogue, resetTasks, startSession, addDialogue, parseError, toast, setPendingResume]);

  const proceedToGeneration = useCallback(async () => {
    setIsProcessing(true);
    setCurrentStage('questions');
    setPendingResume(null);
    
    // Aggregate context from the dialogue
    const fullContext = dialogueEntries
      .map(e => `${e.agent.toUpperCase()}: ${e.message}`)
      .join('\n\n');
      
    try {
      await runRound(fullContext, 1);
    } catch (error) {
      logger.error('Spec generation failed', error instanceof Error ? error : new Error(String(error)), { action: 'proceedToGeneration' });
      const { title, message } = parseError(error);
      toast({ title, description: message, variant: 'destructive' });
      setError(message);
      setIsProcessing(false);
      setCurrentStage('error');
    }
  }, [dialogueEntries, runRound, parseError, toast, setPendingResume]);

  const chatWithAgent = useCallback(async (agentId: string, message: string) => {
    // Add user message to dialogue
    addDialogue({
      agent: 'user',
      message: message,
      timestamp: new Date().toISOString(),
      type: 'user'
    });

    try {
      const response = await api.chatWithAgent(agentConfigs, agentId, message);
      
      // Add agent response to dialogue
      addDialogue({
        agent: response.agent as AgentType,
        message: response.response,
        timestamp: response.timestamp,
        type: 'discussion' // or a new 'chat' type if we defined it
      });
      
      return true;
    } catch (error) {
      logger.error('Chat error', error instanceof Error ? error : new Error(String(error)), { action: 'chatWithAgent', agentId });
      const { title, message: errorMsg } = parseError(error);
      toast({ title, description: errorMsg, variant: 'destructive' });
      return false;
    }
  }, [agentConfigs, addDialogue, parseError, toast]);

  const shareSpec = useCallback(async () => {
    if (!generatedSpec) return;
    
    try {
      const title = generatedSpec.split('\n')[0].replace('# ', '').trim() || "Product Specification";
      
      const { id } = await api.saveSpec(title, generatedSpec, {
        rounds: sessionState.rounds.length,
        agents: agentConfigs.filter(c => c.enabled).map(c => c.agent)
      });
      
      const url = `${window.location.origin}/spec/${id}`;
      navigator.clipboard.writeText(url);
      
      toast({
        title: "Link Copied!",
        description: "Share this URL with your team."
      });

    } catch (error) {
      logger.error('Share failed', error instanceof Error ? error : new Error(String(error)), { action: 'shareSpec' });
      toast({ title: "Share Failed", description: "Could not save specification.", variant: "destructive" });
    }
  }, [generatedSpec, sessionState.rounds.length, agentConfigs, toast]);

  return {
    isProcessing,
    currentStage,
    sessionState,
    tasks,
    generatedSpec,
    techStack,
    mockupUrl,
    dialogueEntries,
    error,
    startGeneration,
    startRefinement,
    proceedToGeneration,
    pause,
    resume,
    reset,
    hydrateFromStorage,
    chatWithAgent,
    shareSpec
  };
}
