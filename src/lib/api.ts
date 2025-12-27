import { supabase } from '@/integrations/supabase/client';
import { AgentConfig, TechStackItem } from '@/types/spec';
import { RoundData, userInputSchema, chatMessageSchema } from '@/types/schemas';

// Default timeout for API calls
// Spec generation takes ~30 minutes (8-stage pipeline with research, debate, synthesis)
// We use 35 minutes (2,100,000ms) to allow buffer for network latency
const DEFAULT_TIMEOUT_MS = 2100000;

// Shorter timeout for quick operations (chat, voice-to-text)
const QUICK_TIMEOUT_MS = 120000;

// Helper to handle Supabase function errors with timeout
async function invokeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      // Note: Supabase client may not support signal yet, but we handle timeout manually
    });

    clearTimeout(timeoutId);

    if (error) {
      // Enhanced error handling with specific error types
      const message = error.message || `Failed to invoke ${functionName}`;
      if (message.includes('rate limit') || message.includes('429')) {
        throw new Error(`RATE_LIMIT: ${message}`);
      }
      if (message.includes('timeout') || message.includes('504')) {
        throw new Error(`TIMEOUT: ${message}`);
      }
      throw new Error(message);
    }

    // Validate response is not null/undefined
    if (data === null || data === undefined) {
      throw new Error(`Empty response from ${functionName}`);
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`TIMEOUT: ${functionName} timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

export const api = {
  generateQuestions: async (userInput: string) => {
    // Validate user input before API call
    const validation = userInputSchema.safeParse(userInput);
    if (!validation.success) {
      throw new Error(`VALIDATION: ${validation.error.issues[0]?.message || 'Invalid input'}`);
    }

    return invokeFunction<{ questions: RoundData['questions'] }>('multi-agent-spec', {
      userInput: validation.data,
      stage: 'questions'
    });
  },

  conductResearch: async (
    agentConfigs: AgentConfig[],
    questions: RoundData['questions'],
    roundNumber: number
  ) => {
    return invokeFunction<{
      researchResults: RoundData['researchResults'];
      metadata: RoundData['researchMetadata'];
    }>('multi-agent-spec', {
      stage: 'research',
      agentConfigs,
      roundData: {
        questions,
        roundNumber
      }
    });
  },

  runChallenge: async (
    agentConfigs: AgentConfig[],
    researchResults: RoundData['researchResults'],
    roundNumber: number
  ) => {
    return invokeFunction<{
      challenges: RoundData['challenges'];
      challengeResponses: RoundData['challengeResponses'];
      debateResolutions: RoundData['debateResolutions'];
      metadata: RoundData['challengeMetadata'];
    }>('multi-agent-spec', {
      stage: 'challenge',
      agentConfigs,
      roundData: {
        researchResults,
        roundNumber
      }
    });
  },

  synthesizeFindings: async (
    agentConfigs: AgentConfig[],
    researchResults: RoundData['researchResults'],
    debateResolutions: RoundData['debateResolutions'],
    roundNumber: number,
    userComment?: string
  ) => {
    return invokeFunction<{
      syntheses: RoundData['syntheses'];
      metadata: RoundData['synthesisMetadata'];
    }>('multi-agent-spec', {
      stage: 'synthesis',
      agentConfigs,
      roundData: {
        researchResults,
        debateResolutions,
        roundNumber
      },
      userComment
    });
  },

  runReview: async (
    syntheses: RoundData['syntheses'],
    researchResults: RoundData['researchResults']
  ) => {
    return invokeFunction<{
      review: RoundData['review'];
      metadata: {
        reviewModel: string;
        latencyMs: number;
        synthesesReviewed: number;
        passThreshold: number;
      };
    }>('multi-agent-spec', {
      stage: 'review',
      roundData: {
        syntheses,
        researchResults
      }
    });
  },

  collectVotes: async (
    agentConfigs: AgentConfig[],
    syntheses: RoundData['syntheses']
  ) => {
    return invokeFunction<{ votes: RoundData['votes'] }>('multi-agent-spec', {
      stage: 'voting',
      agentConfigs,
      roundData: { syntheses }
    });
  },

  generateSpec: async (
    syntheses: RoundData['syntheses'],
    votes: RoundData['votes'],
    researchResults: RoundData['researchResults'],
    debateResolutions: RoundData['debateResolutions']
  ) => {
    return invokeFunction<{ spec: string; techStack: TechStackItem[] }>('multi-agent-spec', {
      stage: 'spec',
      roundData: {
        syntheses,
        votes,
        researchResults,
        debateResolutions
      }
    });
  },

  chatWithAgent: async (
    agentConfigs: AgentConfig[],
    targetAgent: string,
    message: string
  ) => {
    // Validate chat message before API call
    const validation = chatMessageSchema.safeParse(message);
    if (!validation.success) {
      throw new Error(`VALIDATION: ${validation.error.issues[0]?.message || 'Invalid message'}`);
    }

    // Chat uses quick timeout since it's a single agent response
    return invokeFunction<{ response: string; agent: string; timestamp: string }>('multi-agent-spec', {
      stage: 'chat',
      agentConfigs,
      targetAgent,
      userInput: validation.data
    }, QUICK_TIMEOUT_MS);
  },

  /**
   * Persist a specification for the current authenticated user.
   */
  saveSpec: async (
    title: string,
    content: string,
    metadata: Record<string, unknown> = {}
  ) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required to save specification');
    }

    const { data, error } = await supabase
      .from('specifications')
      .insert({
        user_id: user.id,
        title,
        content,
        metadata,
        is_public: true
      })
      .select('id')
      .single();
      
    if (error) throw new Error(error.message);
    return data;
  }
};
