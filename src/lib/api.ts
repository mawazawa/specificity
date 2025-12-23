import { supabase } from '@/integrations/supabase/client';
import { AgentConfig, TechStackItem } from '@/types/spec';
import { RoundData } from '@/types/schemas';

// Helper to handle Supabase function errors
async function invokeFunction<T>(functionName: string, body: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    throw new Error(error.message || `Failed to invoke ${functionName}`);
  }
  return data as T;
}

export const api = {
  generateQuestions: async (userInput: string) => {
    return invokeFunction<{ questions: RoundData['questions'] }>('multi-agent-spec', {
      userInput,
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
    return invokeFunction<{ response: string; agent: string; timestamp: string }>('multi-agent-spec', {
      stage: 'chat',
      agentConfigs,
      targetAgent,
      userInput: message
    });
  },

  /**
   * Persist a specification for the current authenticated user.
   */
  saveSpec: async (
    title: string,
    content: string,
    metadata: any = {}
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
