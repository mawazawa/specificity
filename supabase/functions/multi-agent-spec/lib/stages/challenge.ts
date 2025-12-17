/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateChallenges, executeChallenges, resolveDebates } from '../../lib/challenge-generator.ts';
import { corsHeaders } from '../utils/api.ts';
import { AgentConfig, RoundData } from '../types.ts';

export const handleChallengeStage = async (
    agentConfigs: AgentConfig[] | undefined,
    roundData: RoundData | undefined,
    cleanInput: string
) => {
    console.log('[Ray Dalio] Generating contrarian challenges for productive conflict...');

    const researchResults = roundData?.researchResults || [];

    if (researchResults.length === 0) {
        return new Response(
            JSON.stringify({ error: 'No research results to challenge' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Generate challenge questions that stress-test the research
    const challenges = await generateChallenges(
        researchResults,
        cleanInput,
        {
            model: 'gpt-5.1',
            challengesPerFinding: 2 // 2 challenges per research finding
        }
    );

    console.log(`[Ray Dalio] Generated ${challenges.length} challenge questions`);

    // Execute challenges in parallel - have experts argue contrarian positions
    if (!agentConfigs) {
        return new Response(
            JSON.stringify({ error: 'Agent configurations required for challenges' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const configsWithIds: AgentConfig[] = agentConfigs.map((config) => ({
        id: config.id || config.agent.toLowerCase().replace(/\s+/g, '_'),
        agent: config.agent,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        enabled: config.enabled
    }));

    const challengeResponses = await executeChallenges(
        challenges,
        researchResults,
        configsWithIds
    );

    console.log(`[Ray Dalio] Received ${challengeResponses.length} contrarian challenges`);

    // Resolve debates - synthesize original + challenges into stronger positions
    const debateResolutions = await resolveDebates(
        researchResults,
        challengeResponses,
        { model: 'claude-sonnet-4.5' } // Claude excels at synthesis
    );

    console.log(`[Ray Dalio] Resolved ${debateResolutions.length} debates`);

    // Calculate challenge costs
    const totalChallengeCost = challengeResponses.reduce((sum, c) => sum + c.cost, 0);
    const avgRiskScore = challengeResponses.reduce((sum, c) => sum + c.riskScore, 0) / challengeResponses.length;

    return new Response(
        JSON.stringify({
            challenges,
            challengeResponses,
            debateResolutions,
            metadata: {
                totalChallenges: challenges.length,
                totalResponses: challengeResponses.length,
                avgRiskScore: avgRiskScore.toFixed(1),
                challengeCost: totalChallengeCost,
                debatesResolved: debateResolutions.length,
                productiveConflict: true
            }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
};
