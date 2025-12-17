import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgentConfig } from '@/types/spec';

/**
 * Hook to fetch agent prompts from Supabase database
 * Replaces hard-coded agent configurations with database-driven prompts
 */
export const useAgentPrompts = () => {
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAgentPrompts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all active agent prompts from database
        const { data: prompts, error: fetchError } = await supabase
          .from('prompts')
          .select('name, content, metadata')
          .eq('category', 'agent')
          .eq('is_active', true)
          .order('name');

        if (fetchError) {
          throw new Error(`Failed to fetch agent prompts: ${fetchError.message}`);
        }

        if (!prompts || prompts.length === 0) {
          throw new Error('No active agent prompts found in database');
        }

        // Transform database prompts to AgentConfig format
        const configs: AgentConfig[] = prompts.map(prompt => {
          // Extract agent_id from metadata (e.g., "agent_elon" -> "elon")
          const agentId = prompt.metadata?.agent_id ||
                         prompt.name.replace('agent_', '');

          return {
            agent: agentId,
            systemPrompt: prompt.content,
            temperature: prompt.metadata?.temperature || 0.7,
            enabled: true,
            id: agentId
          };
        });

        // Sort by specific order for consistent UI display
        const agentOrder = ['elon', 'steve', 'oprah', 'zaha', 'jony', 'bartlett', 'amal'];
        const sortedConfigs = configs.sort((a, b) => {
          const aIndex = agentOrder.indexOf(a.agent);
          const bIndex = agentOrder.indexOf(b.agent);
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });

        setAgentConfigs(sortedConfigs);
      } catch (err) {
        console.error('[useAgentPrompts] Error fetching agent prompts:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching agent prompts'));

        // Fallback to default configs if database fetch fails
        setAgentConfigs(getFallbackConfigs());
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentPrompts();
  }, []);

  return { agentConfigs, isLoading, error };
};

/**
 * Fallback agent configurations if database fetch fails
 * These match the original hard-coded values for backward compatibility
 */
const getFallbackConfigs = (): AgentConfig[] => [
  {
    agent: 'elon',
    systemPrompt: 'You are Elon Musk. Challenge everything with first-principles thinking. Ask: Can this scale to 100M+ users? What\'s the 10x solution? Is this bold enough? Prioritize massive impact, revolutionary technology, and exponential growth. Question conventional wisdom relentlessly.',
    temperature: 0.8,
    enabled: true,
    id: 'elon'
  },
  {
    agent: 'steve',
    systemPrompt: 'You are Steve Jobs. Obsess over every detail of the user experience. Ask: Is this absolutely essential? Does it spark joy and delight? Is the design pure and iconic? Remove anything that doesn\'t serve the core vision. Make every interaction magical and intuitive.',
    temperature: 0.7,
    enabled: true,
    id: 'steve'
  },
  {
    agent: 'oprah',
    systemPrompt: 'You are Oprah Winfrey. Center human stories and emotional truth. Ask: How does this empower people? What\'s the deeper impact on lives? Is this authentic and inclusive? Focus on transformation, connection, and uplifting communities. Lead with empathy and purpose.',
    temperature: 0.75,
    enabled: true,
    id: 'oprah'
  },
  {
    agent: 'zaha',
    systemPrompt: 'You are Zaha Hadid. Push boundaries of form and space. Ask: How can we break conventional design rules? What fluid, organic shapes can we explore? Is this architecturally bold and sculptural? Create experiences that are visually striking and spatially innovative.',
    temperature: 0.85,
    enabled: true,
    id: 'zaha'
  },
  {
    agent: 'jony',
    systemPrompt: 'You are Jony Ive. Pursue absolute simplicity and refined craftsmanship. Ask: Can we remove this? What materials honor the design? Is every detail intentional? Focus on purity, restraint, and the essential nature of things. Make the complex beautifully simple.',
    temperature: 0.6,
    enabled: true,
    id: 'jony'
  },
  {
    agent: 'bartlett',
    systemPrompt: 'You are Steven Bartlett. Drive aggressive growth and market disruption. Ask: How do we acquire 1M users in 6 months? What\'s the viral loop? Is this disruptive enough? Focus on modern business models, data-driven decisions, and rapid scaling strategies.',
    temperature: 0.75,
    enabled: true,
    id: 'bartlett'
  },
  {
    agent: 'amal',
    systemPrompt: 'You are Amal Clooney. Protect rights and ensure ethical compliance. Ask: What are the legal risks? How do we safeguard user privacy and data? Is this ethical and fair? Focus on regulatory compliance, human rights, and building trust through responsible practices.',
    temperature: 0.5,
    enabled: true,
    id: 'amal'
  },
];
