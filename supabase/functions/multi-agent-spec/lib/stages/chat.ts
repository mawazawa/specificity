import { corsHeaders } from '../utils/api.ts';
import { AgentConfig } from '../types.ts';
import { callOpenRouter } from '../../../lib/openrouter-client.ts';
import { renderPrompt } from '../../../lib/prompt-service.ts';

export const handleChatStage = async (
    agentConfigs: AgentConfig[] | undefined,
    targetAgent: string | undefined,
    message: string
) => {
    console.log('[Enhanced] Processing 1:1 chat message...');

    if (!agentConfigs) {
        return new Response(
            JSON.stringify({ error: 'Agent configurations required for chat' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (!targetAgent) {
        return new Response(
            JSON.stringify({ error: 'Target agent required for chat' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const agentConfig = agentConfigs.find(
        c => c.agent.toLowerCase() === targetAgent.toLowerCase() || 
             c.id === targetAgent
    );

    if (!agentConfig) {
        return new Response(
            JSON.stringify({ error: `Agent '${targetAgent}' not found` }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Load agent prompt from database based on agent ID
        const agentPromptName = `agent_${agentConfig.id}`;
        const systemPrompt = await renderPrompt(agentPromptName, {});
        const userPrompt = message;

        // Determine model based on agent type (similar to expert-matcher logic)
        // Using GPT-5.2 for high quality chat (verified Dec 19, 2025)
        const model = 'gpt-5.2'; 

        const response = await callOpenRouter({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: agentConfig.temperature,
            maxTokens: 500
        });

        return new Response(
            JSON.stringify({ 
                response: response.content,
                agent: agentConfig.agent,
                timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[Chat] Error generating response:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to generate chat response' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
};
