/* eslint-disable @typescript-eslint/no-explicit-any */
import { callGroq, corsHeaders } from '../utils/api.ts';
import { RoundData } from '../types.ts';
import { renderPrompt } from '../../../lib/prompt-service.ts';

export const handleSynthesisStage = async (
    roundData: RoundData | undefined,
    cleanComment: string | undefined,
    groqApiKey: string
) => {
    console.log('[Enhanced] Synthesizing research findings...');

    const researchResults = roundData?.researchResults || [];
    const debateResolutions = roundData?.debateResolutions || [];

    if (researchResults.length === 0) {
        return new Response(
            JSON.stringify({ error: 'No research results to synthesize' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Each expert synthesizes their findings (now incorporating debate outcomes)
    const synthesisPromises = researchResults.map(async (result: any, idx: number) => {
        const toolsContext = result.toolsUsed.length > 0
            ? `\n\nTools used: ${result.toolsUsed.map((t: any) => t.tool).join(', ')}`
            : '';

        const userGuidance = cleanComment ? `\nUser guidance: ${cleanComment}` : '';

        // Include debate resolution if available (battle-tested position)
        const debateResolution = debateResolutions[idx];
        const debateContext = debateResolution ?
            `\n\n**DEBATE-TESTED POSITION** (Ray Dalio productive conflict):\n${debateResolution.resolution}\n\nChallenges addressed: ${debateResolution.challenges.join('; ')}\nConfidence change: ${debateResolution.confidenceChange > 0 ? '+' : ''}${debateResolution.confidenceChange}%\nAdopted alternatives: ${debateResolution.adoptedAlternatives.join(', ') || 'None'}` : '';

        // Load synthesis stage prompt from database
        const prompt = await renderPrompt('synthesis_stage', {
            findings: result.findings,
            toolsContext,
            debateContext,
            userGuidance
        });

        const response = await callGroq(
            groqApiKey,
            `You are ${result.expertName}, a world-class expert. Provide your synthesis.`,
            prompt,
            0.7,
            800
        );

        return {
            expertId: result.expertId,
            expertName: result.expertName,
            synthesis: response,
            timestamp: new Date().toISOString(),
            researchQuality: {
                toolsUsed: result.toolsUsed.length,
                cost: result.cost,
                duration: result.duration,
                battleTested: !!debateResolution,
                confidenceBoost: debateResolution?.confidenceChange || 0
            }
        };
    });

    const syntheses = await Promise.all(synthesisPromises);

    const battleTestedCount = syntheses.filter(s => s.researchQuality.battleTested).length;
    console.log(`[Enhanced] Synthesized ${syntheses.length} expert recommendations (${battleTestedCount} battle-tested)`);

    return new Response(
        JSON.stringify({
            syntheses,
            metadata: {
                totalSyntheses: syntheses.length,
                battleTested: battleTestedCount,
                productiveConflict: battleTestedCount > 0
            }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
};
