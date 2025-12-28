/* eslint-disable @typescript-eslint/no-explicit-any */
import { callGroq, corsHeaders, GROQ_MODEL } from '../utils/api.ts';
import { RoundData } from '../types.ts';
import { renderPrompt, trackPromptUsage } from '../../../lib/prompt-service.ts';

export const handleSynthesisStage = async (
    roundData: RoundData | undefined,
    cleanComment: string | undefined,
    groqApiKey: string
) => {
    console.info('[Enhanced] Synthesizing research findings...');

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
        // Safe array access with bounds check and property validation
        const debateResolution = idx < debateResolutions.length ? debateResolutions[idx] : undefined;
        const debateContext = debateResolution && debateResolution.resolution
            ? `\n\n**DEBATE-TESTED POSITION** (Ray Dalio productive conflict):\n${debateResolution.resolution}\n\nChallenges addressed: ${(debateResolution.challenges || []).join('; ')}\nConfidence change: ${debateResolution.confidenceChange > 0 ? '+' : ''}${debateResolution.confidenceChange || 0}%\nAdopted alternatives: ${(debateResolution.adoptedAlternatives || []).join(', ') || 'None'}`
            : '';

        // Load synthesis stage prompt from database
        const prompt = await renderPrompt('synthesis_stage', {
            findings: result.findings,
            toolsContext,
            debateContext,
            userGuidance
        });

        const startTime = Date.now();
        const response = await callGroq(
            groqApiKey,
            `You are ${result.expertName}, a world-class expert. Provide your synthesis.`,
            prompt,
            0.7,
            800
        );

        await trackPromptUsage('synthesis_stage', {
            latency_ms: Date.now() - startTime,
            model_used: GROQ_MODEL
        });

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

    // Use Promise.allSettled for graceful partial failure handling
    // If one agent fails, others still contribute to synthesis
    const settledResults = await Promise.allSettled(synthesisPromises);

    const syntheses = settledResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

    const failedCount = settledResults.filter(r => r.status === 'rejected').length;
    if (failedCount > 0) {
        console.warn(`[Synthesis] ${failedCount}/${settledResults.length} syntheses failed, continuing with ${syntheses.length} successful`);
    }

    const battleTestedCount = syntheses.filter(s => s.researchQuality.battleTested).length;
    console.info(`[Enhanced] Synthesized ${syntheses.length} expert recommendations (${battleTestedCount} battle-tested)`);

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
