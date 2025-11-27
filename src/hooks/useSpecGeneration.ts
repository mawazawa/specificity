/**
 * useSpecGeneration Hook - Extracted from Index.tsx
 * State machine for the multi-stage spec generation workflow
 *
 * Performance improvements:
 * - useReducer instead of multiple useState (single render per dispatch)
 * - Memoized handlers with useCallback
 * - Centralized stage logic (was 440 lines in runRound)
 * - Predictable state transitions
 */

import { useReducer, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AgentConfig, SessionState, Round, HistoryEntryData } from '@/types/spec';
import type { DialogueEntry } from '@/components/DialoguePanel';

// Stage type for the state machine
export type GenerationStage =
  | 'idle'
  | 'questions'
  | 'research'
  | 'challenge'
  | 'synthesis'
  | 'voting'
  | 'spec'
  | 'complete'
  | 'error';

// Task type for tracking async operations
interface Task {
  id: string;
  type: 'question' | 'research' | 'answer' | 'vote';
  agent?: string;
  description: string;
  status: 'pending' | 'running' | 'complete';
  duration?: number;
  result?: unknown;
}

// State interface
interface GenerationState {
  isProcessing: boolean;
  currentStage: GenerationStage;
  sessionState: SessionState;
  tasks: Task[];
  generatedSpec: string;
  dialogueEntries: DialogueEntry[];
  error: string | null;
}

// Action types
type GenerationAction =
  | { type: 'START_GENERATION' }
  | { type: 'SET_STAGE'; payload: GenerationStage }
  | { type: 'ADD_ROUND'; payload: Round }
  | { type: 'UPDATE_ROUND'; payload: Round }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'ADD_DIALOGUE'; payload: DialogueEntry }
  | { type: 'ADD_DIALOGUES'; payload: DialogueEntry[] }
  | { type: 'SET_SPEC'; payload: string }
  | { type: 'ADD_HISTORY'; payload: { type: 'vote' | 'output' | 'spec' | 'user-comment'; data: HistoryEntryData } }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'GENERATION_COMPLETE' }
  | { type: 'RESET' };

// Initial state
const initialState: GenerationState = {
  isProcessing: false,
  currentStage: 'idle',
  sessionState: {
    rounds: [],
    currentRound: 0,
    isPaused: false,
    history: []
  },
  tasks: [],
  generatedSpec: '',
  dialogueEntries: [],
  error: null
};

// Reducer function
function generationReducer(state: GenerationState, action: GenerationAction): GenerationState {
  switch (action.type) {
    case 'START_GENERATION':
      return {
        ...initialState,
        isProcessing: true,
        currentStage: 'questions'
      };

    case 'SET_STAGE':
      return {
        ...state,
        currentStage: action.payload
      };

    case 'ADD_ROUND':
      return {
        ...state,
        sessionState: {
          ...state.sessionState,
          rounds: [...state.sessionState.rounds, action.payload],
          currentRound: state.sessionState.rounds.length
        }
      };

    case 'UPDATE_ROUND': {
      const rounds = [...state.sessionState.rounds];
      rounds[rounds.length - 1] = action.payload;
      return {
        ...state,
        sessionState: { ...state.sessionState, rounds }
      };
    }

    case 'ADD_TASK': {
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      };
    }

    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        )
      };
    }

    case 'ADD_DIALOGUE':
      return {
        ...state,
        dialogueEntries: [...state.dialogueEntries, action.payload]
      };

    case 'ADD_DIALOGUES':
      return {
        ...state,
        dialogueEntries: [...state.dialogueEntries, ...action.payload]
      };

    case 'SET_SPEC':
      return {
        ...state,
        generatedSpec: action.payload
      };

    case 'ADD_HISTORY':
      return {
        ...state,
        sessionState: {
          ...state.sessionState,
          history: [
            ...state.sessionState.history,
            {
              timestamp: new Date().toISOString(),
              type: action.payload.type,
              data: action.payload.data
            }
          ]
        }
      };

    case 'SET_PAUSED':
      return {
        ...state,
        sessionState: {
          ...state.sessionState,
          isPaused: action.payload
        }
      };

    case 'SET_ERROR':
      return {
        ...state,
        isProcessing: false,
        currentStage: 'error',
        error: action.payload
      };

    case 'GENERATION_COMPLETE':
      return {
        ...state,
        isProcessing: false,
        currentStage: 'complete'
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Hook interface
interface UseSpecGenerationProps {
  agentConfigs: AgentConfig[];
}

interface UseSpecGenerationReturn {
  state: GenerationState;
  startGeneration: (input: string) => Promise<void>;
  pause: () => void;
  resume: (comment?: string) => void;
  reset: () => void;
  // Expose individual state pieces for backward compatibility
  isProcessing: boolean;
  currentStage: string;
  sessionState: SessionState;
  tasks: Task[];
  generatedSpec: string;
  dialogueEntries: DialogueEntry[];
}

export const useSpecGeneration = ({
  agentConfigs
}: UseSpecGenerationProps): UseSpecGenerationReturn => {
  const [state, dispatch] = useReducer(generationReducer, initialState);
  const { toast } = useToast();

  // Helper to add a task
  const addTask = useCallback((task: Omit<Task, 'id'>): string => {
    const id = `${task.type}-${Date.now()}-${Math.random()}`;
    dispatch({ type: 'ADD_TASK', payload: { ...task, id } });
    return id;
  }, []);

  // Helper to update a task
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
  }, []);

  // Helper to add dialogue entry
  const addDialogue = useCallback((entry: DialogueEntry) => {
    dispatch({ type: 'ADD_DIALOGUE', payload: entry });
  }, []);

  // Helper to add history entry
  const addHistory = useCallback((type: 'vote' | 'output' | 'spec' | 'user-comment', data: HistoryEntryData) => {
    dispatch({ type: 'ADD_HISTORY', payload: { type, data } });
  }, []);

  // Parse error message for user-friendly display
  const parseError = useCallback((error: unknown): { title: string; message: string } => {
    const errMessage = error instanceof Error ? error.message : '';

    if (errMessage.includes('RATE_LIMIT') || errMessage.includes('429') || errMessage.includes('rate limit')) {
      return {
        title: '⚠️ Rate Limit Exceeded',
        message: "You've reached the rate limit. Please wait a few minutes and try again."
      };
    }
    if (errMessage.includes('OPENROUTER') || errMessage.includes('OpenRouter')) {
      return {
        title: '⚠️ OpenRouter API Issue',
        message: 'Falling back to Groq. ' + errMessage
      };
    }

    return {
      title: 'Error',
      message: errMessage || 'An error occurred during processing'
    };
  }, []);

  // Main generation function - runs a single round
  const runRound = useCallback(async (
    input: string,
    roundNumber: number,
    userComment?: string
  ) => {
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

    dispatch({ type: 'ADD_ROUND', payload: round });

    try {
      const activeAgents = agentConfigs.filter(c => c.enabled);

      // ========================================
      // STAGE 1: DYNAMIC QUESTION GENERATION
      // ========================================
      round.stage = 'questions';
      dispatch({ type: 'SET_STAGE', payload: 'questions' });
      toast({
        title: '🧠 Generating Research Questions',
        description: 'AI analyzing your idea to create targeted questions...'
      });

      const questionsStartTime = Date.now();
      const { data: questionsData, error: questionsError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { userInput: input, stage: 'questions' } }
      );

      if (questionsError) {
        throw new Error(questionsError.message || 'Failed to generate questions');
      }

      const questionsDuration = Date.now() - questionsStartTime;
      round.questions = questionsData.questions || [];

      const questionsText = round.questions
        .map((q: any, i: number) => `${i + 1}. [${q.domain}] ${q.question}`)
        .join('\n');

      addDialogue({
        agent: 'system' as any,
        message: `🎯 **Generated ${round.questions.length} Research Questions:**\n\n${questionsText}`,
        timestamp: new Date().toISOString(),
        type: 'discussion'
      });

      addHistory('output', {
        stage: 'questions',
        questions: round.questions,
        count: round.questions.length
      });

      toast({
        title: '✓ Questions Generated',
        description: `${round.questions.length} targeted questions in ${(questionsDuration / 1000).toFixed(1)}s`
      });

      // ========================================
      // STAGE 2: PARALLEL RESEARCH WITH TOOLS
      // ========================================
      round.stage = 'research';
      dispatch({ type: 'SET_STAGE', payload: 'research' });
      toast({
        title: '🔬 Deep Research Phase',
        description: 'Experts conducting parallel research with multiple tools...'
      });

      const researchStartTime = Date.now();
      const { data: researchData, error: researchError } = await supabase.functions.invoke(
        'multi-agent-spec',
        {
          body: {
            stage: 'research',
            agentConfigs,
            roundData: {
              questions: round.questions,
              roundNumber
            }
          }
        }
      );

      if (researchError) {
        throw new Error(researchError.message || 'Failed to conduct research');
      }

      const researchDuration = Date.now() - researchStartTime;
      round.research = researchData.researchResults || [];
      const metadata = researchData.metadata || {};

      const researchSummary = `📊 **Research Complete:**
• ${round.research.length} experts analyzed
• ${metadata.totalToolsUsed || 0} tool calls executed
• Cost: $${(metadata.totalCost || 0).toFixed(4)}
• Duration: ${(researchDuration / 1000).toFixed(1)}s

**Models Used:** Multi-model (GPT-5.1-Codex, Claude Sonnet 4.5, Gemini 2.5 Flash)`;

      addDialogue({
        agent: 'system' as any,
        message: researchSummary,
        timestamp: new Date().toISOString(),
        type: 'discussion'
      });

      // Add individual research findings
      round.research.forEach((result: any) => {
        const toolsList = result.toolsUsed?.map((t: any) => t.tool).join(', ') || 'none';
        const findingsPreview = result.findings.slice(0, 500);

        addDialogue({
          agent: result.expertId,
          message: `🔍 **Research Findings** (${result.model})\n\n${findingsPreview}...\n\n_Tools: ${toolsList} • Cost: $${result.cost.toFixed(4)}_`,
          timestamp: new Date().toISOString(),
          type: 'discussion'
        });
      });

      addHistory('output', {
        stage: 'research',
        expertsCount: round.research.length,
        toolsUsed: metadata.totalToolsUsed,
        cost: metadata.totalCost,
        duration: researchDuration
      });

      toast({
        title: '✓ Research Complete',
        description: `${round.research.length} experts • ${metadata.totalToolsUsed} tools • $${(metadata.totalCost || 0).toFixed(4)}`
      });

      // ========================================
      // STAGE 2.5: CHALLENGE/DEBATE (RAY DALIO STYLE)
      // ========================================
      round.stage = 'challenge';
      dispatch({ type: 'SET_STAGE', payload: 'challenge' });
      toast({
        title: '⚔️ Challenge Phase',
        description: 'Stress-testing ideas with contrarian viewpoints and productive conflict...'
      });

      const challengeStartTime = Date.now();
      const { data: challengeData, error: challengeError } = await supabase.functions.invoke(
        'multi-agent-spec',
        {
          body: {
            stage: 'challenge',
            agentConfigs,
            roundData: {
              researchResults: round.research,
              roundNumber
            }
          }
        }
      );

      if (challengeError) {
        throw new Error(challengeError.message || 'Failed to execute challenges');
      }

      const challengeDuration = Date.now() - challengeStartTime;
      round.challenges = challengeData.challenges || [];
      round.challengeResponses = challengeData.challengeResponses || [];
      round.debateResolutions = challengeData.debateResolutions || [];
      const challengeMetadata = challengeData.metadata || {};

      const challengeSummary = `⚔️ **Productive Conflict Complete (Ray Dalio Style):**
• ${challengeMetadata.totalChallenges || 0} contrarian challenges generated
• ${challengeMetadata.totalResponses || 0} expert debates
• ${challengeMetadata.debatesResolved || 0} positions battle-tested
• Avg Risk Score: ${challengeMetadata.avgRiskScore || 0}/10
• Cost: $${(challengeMetadata.challengeCost || 0).toFixed(4)}
• Duration: ${(challengeDuration / 1000).toFixed(1)}s

**Result:** Ideas stress-tested through thoughtful disagreement`;

      addDialogue({
        agent: 'system' as any,
        message: challengeSummary,
        timestamp: new Date().toISOString(),
        type: 'discussion'
      });

      // Add challenge responses and resolutions
      round.challengeResponses?.forEach((response: any) => {
        const challenge = round.challenges?.find((c: any) => c.id === response.challengeId);
        addDialogue({
          agent: response.challenger,
          message: `🎯 **Contrarian Challenge:**\n\n**Question:** ${challenge?.question || 'Challenge'}\n\n**Devil's Advocate Position:**\n${response.challenge}\n\n**Evidence Against:** ${response.evidenceAgainst.join('; ')}\n\n${response.alternativeApproach ? `**Alternative Approach:** ${response.alternativeApproach}\n\n` : ''}_Risk Score: ${response.riskScore}/10 • Cost: $${response.cost.toFixed(4)}_`,
          timestamp: new Date().toISOString(),
          type: 'discussion'
        });
      });

      round.debateResolutions?.forEach((resolution: any) => {
        addDialogue({
          agent: 'system' as any,
          message: `🤝 **Debate Resolution:**\n\n${resolution.resolution}\n\n**Confidence Change:** ${resolution.confidenceChange > 0 ? '+' : ''}${resolution.confidenceChange}%\n**Adopted Alternatives:** ${resolution.adoptedAlternatives.join(', ') || 'None'}`,
          timestamp: new Date().toISOString(),
          type: 'discussion'
        });
      });

      addHistory('output', {
        stage: 'challenge',
        challenges: round.challenges.length,
        responses: round.challengeResponses.length,
        resolutions: round.debateResolutions.length,
        cost: challengeMetadata.challengeCost,
        duration: challengeDuration
      });

      toast({
        title: '✓ Productive Conflict Complete',
        description: `${challengeMetadata.debatesResolved} positions battle-tested • $${(challengeMetadata.challengeCost || 0).toFixed(4)}`
      });

      // ========================================
      // STAGE 3: EXPERT SYNTHESIS
      // ========================================
      round.stage = 'answers';
      dispatch({ type: 'SET_STAGE', payload: 'synthesis' });
      toast({
        title: '💡 Synthesis Phase',
        description: 'Experts synthesizing battle-tested research into actionable recommendations...'
      });

      const synthesisStartTime = Date.now();
      const { data: synthesisData, error: synthesisError } = await supabase.functions.invoke(
        'multi-agent-spec',
        {
          body: {
            stage: 'synthesis',
            agentConfigs,
            roundData: {
              researchResults: round.research,
              debateResolutions: round.debateResolutions,
              roundNumber
            },
            userComment
          }
        }
      );

      if (synthesisError) {
        throw new Error(synthesisError.message || 'Failed to synthesize research');
      }

      const synthesisDuration = Date.now() - synthesisStartTime;
      round.answers = synthesisData.syntheses;
      addHistory('output', { stage: 'synthesis', syntheses: round.answers });

      synthesisData.syntheses?.forEach((s: any) => {
        const quality = s.researchQuality || {};
        addDialogue({
          agent: s.expertId,
          message: `📝 **Final Synthesis:**\n\n${s.synthesis}\n\n_Research depth: ${quality.toolsUsed || 0} tools • $${(quality.cost || 0).toFixed(4)}_`,
          timestamp: s.timestamp,
          type: 'answer'
        });
      });

      toast({
        title: '✓ Synthesis Complete',
        description: `${synthesisData.syntheses?.length || 0} expert syntheses in ${(synthesisDuration / 1000).toFixed(1)}s`
      });

      // ========================================
      // STAGE 4: CONSENSUS VOTING
      // ========================================
      round.stage = 'voting';
      dispatch({ type: 'SET_STAGE', payload: 'voting' });
      toast({
        title: '🗳️ Consensus Vote',
        description: 'Panel voting on proceeding to specification...'
      });

      const voteTaskIds = activeAgents.map(agent =>
        addTask({ type: 'vote', agent: agent.agent, description: 'Casting vote', status: 'running' })
      );

      const votingStartTime = Date.now();
      const { data: votesData, error: votesError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { stage: 'voting', agentConfigs, roundData: { syntheses: synthesisData.syntheses } } }
      );

      if (votesError) {
        throw new Error(votesError.message || 'Failed to collect votes');
      }

      const votingDuration = Date.now() - votingStartTime;
      voteTaskIds.forEach(id => updateTask(id, { status: 'complete', duration: votingDuration / voteTaskIds.length }));

      round.votes = votesData.votes;
      round.votes.forEach((vote: any) => addHistory('vote', vote));

      round.votes.forEach((v: any) => {
        const emoji = v.approved ? '✅' : '❌';
        addDialogue({
          agent: v.agent,
          message: `${emoji} **Vote:** ${v.approved ? 'APPROVED' : 'NEEDS ANOTHER ROUND'}\n\n${v.reasoning}\n\n_Confidence: ${v.confidence}%_`,
          timestamp: v.timestamp,
          type: 'vote'
        });
      });

      const approvedCount = round.votes.filter((v: any) => v.approved).length;
      toast({
        title: '✓ Vote Complete',
        description: `${approvedCount}/${round.votes.length} approved • ${votingDuration}ms`
      });

      round.status = 'complete';
      dispatch({ type: 'UPDATE_ROUND', payload: round });

      const approvalRate = round.votes.filter((v: any) => v.approved).length / round.votes.length;

      if (approvalRate >= 0.6 || roundNumber >= 3) {
        // ========================================
        // STAGE 5: FINAL SPECIFICATION GENERATION
        // ========================================
        round.stage = 'spec';
        dispatch({ type: 'SET_STAGE', payload: 'spec' });
        toast({
          title: '📄 Specification Phase',
          description: 'Generating comprehensive production-ready specification...'
        });

        const specTaskId = addTask({ type: 'answer', description: 'Synthesizing specification', status: 'running' });

        const specStartTime = Date.now();
        const { data: specData, error: specError } = await supabase.functions.invoke(
          'multi-agent-spec',
          {
            body: {
              stage: 'spec',
              roundData: {
                syntheses: synthesisData.syntheses,
                votes: round.votes,
                researchResults: round.research,
                debateResolutions: round.debateResolutions || []
              }
            }
          }
        );

        if (specError) {
          throw new Error(specError.message || 'Failed to generate specification');
        }

        const specDuration = Date.now() - specStartTime;
        updateTask(specTaskId, { status: 'complete', duration: specDuration });

        dispatch({ type: 'SET_SPEC', payload: specData.spec });
        addHistory('spec', { spec: specData.spec });

        const totalCost = round.research.reduce((sum: number, r: any) => sum + (r.cost || 0), 0);

        toast({
          title: '✅ Specification Complete!',
          description: `Round ${roundNumber} • ${specDuration}ms • Total cost: $${totalCost.toFixed(4)}`
        });

        dispatch({ type: 'GENERATION_COMPLETE' });
      } else {
        toast({
          title: `Round ${roundNumber} Complete`,
          description: `${Math.round(approvalRate * 100)}% approval. Starting next round...`
        });

        if (!state.sessionState.isPaused) {
          await runRound(input, roundNumber + 1, userComment);
        }
      }
    } catch (error) {
      console.error('Round error:', error);
      const { title, message } = parseError(error);
      toast({ title, description: message, variant: 'destructive', duration: 8000 });
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  }, [agentConfigs, toast, addTask, updateTask, addDialogue, addHistory, parseError, state.sessionState.isPaused]);

  // Start generation
  const startGeneration = useCallback(async (input: string) => {
    dispatch({ type: 'START_GENERATION' });
    try {
      await runRound(input, 1);
    } catch (error) {
      console.error('Spec generation failed:', error);
      const { title, message } = parseError(error);
      toast({
        title,
        description: message,
        variant: 'destructive'
      });
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  }, [runRound, toast, parseError]);

  // Pause
  const pause = useCallback(() => {
    dispatch({ type: 'SET_PAUSED', payload: true });
    toast({ title: 'Paused', description: 'Session paused. Add your comments.' });
  }, [toast]);

  // Resume
  const resume = useCallback((comment?: string) => {
    if (comment) {
      addHistory('user-comment', { comment });
      addDialogue({
        agent: 'user' as any,
        message: comment,
        timestamp: new Date().toISOString(),
        type: 'user' as any
      });
    }
    dispatch({ type: 'SET_PAUSED', payload: false });
    toast({ title: 'Resuming', description: 'Continuing with your guidance...' });
  }, [toast, addHistory, addDialogue]);

  // Reset
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    startGeneration,
    pause,
    resume,
    reset,
    // Backward compatibility
    isProcessing: state.isProcessing,
    currentStage: state.currentStage,
    sessionState: state.sessionState,
    tasks: state.tasks,
    generatedSpec: state.generatedSpec,
    dialogueEntries: state.dialogueEntries
  };
};
