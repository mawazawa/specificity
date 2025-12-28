/* eslint-disable @typescript-eslint/no-explicit-any */
import { callGroq, corsHeaders, GROQ_MODEL } from '../utils/api.ts';
import { AgentConfig, RoundData } from '../types.ts';
import { renderPrompt, trackPromptUsage } from '../../../lib/prompt-service.ts';

export const handleVotingStage = async (
    agentConfigs: AgentConfig[] | undefined,
    roundData: RoundData | undefined,
    groqApiKey: string
) => {
    console.info('[Enhanced] Collecting consensus votes...');

    if (!agentConfigs) {
        return new Response(
            JSON.stringify({ error: 'Agent configurations required for voting stage' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const activeAgents = agentConfigs.filter((c: any) => c.enabled);
    const syntheses = roundData.syntheses || [];

    const votePromises = activeAgents.map(async (config: any) => {
        const synthesesSummary = syntheses.map((s: any) =>
            `${s.expertName}: ${s.synthesis.slice(0, 300)}...`
        ).join('\n\n');

        // Load voting stage prompt from database
        const votePrompt = await renderPrompt('voting_stage', { synthesesSummary });

        const startTime = Date.now();
        const response = await callGroq(
            groqApiKey,
            config.systemPrompt,
            votePrompt,
            config.temperature,
            300
        );

        await trackPromptUsage('voting_stage', {
            latency_ms: Date.now() - startTime,
            model_used: GROQ_MODEL
        });

        try {
            const vote = JSON.parse(response);
            return {
                agent: config.agent,
                approved: vote.approved ?? true,
                confidence: vote.confidence ?? 75,
                reasoning: vote.reasoning || response,
                keyRequirements: vote.keyRequirements || [],
                timestamp: new Date().toISOString()
            };
        } catch {
            const approved = response.toLowerCase().includes('yes') ||
                response.toLowerCase().includes('approve');
            return {
                agent: config.agent,
                approved,
                confidence: approved ? 70 : 30,
                reasoning: response,
                keyRequirements: [],
                timestamp: new Date().toISOString()
            };
        }
    });

    // Use Promise.allSettled for graceful partial failure handling
    // If one agent's vote fails, others still count toward consensus
    const settledResults = await Promise.allSettled(votePromises);

    const votes = settledResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

    const failedCount = settledResults.filter(r => r.status === 'rejected').length;
    if (failedCount > 0) {
        console.warn(`[Voting] ${failedCount}/${settledResults.length} votes failed, continuing with ${votes.length} successful`);
    }

    return new Response(
        JSON.stringify({ votes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
};
