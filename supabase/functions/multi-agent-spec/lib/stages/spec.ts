/* eslint-disable @typescript-eslint/no-explicit-any */
import { corsHeaders } from '../utils/api.ts';
import { callGroq } from '../utils/api.ts';
import { RoundData } from '../types.ts';
import { Prompts } from '../../../lib/prompts.ts';

export const handleSpecStage = async (roundData: RoundData | undefined) => {
    console.log('[Enhanced] Generating final specification...');

    const syntheses = roundData?.syntheses || [];
    const votes = roundData?.votes || [];
    const researchResults = roundData?.researchResults || [];

    // Calculate research quality scores
    const avgToolsUsed = researchResults.reduce((sum: number, r: any) =>
        sum + (r.toolsUsed?.length || 0), 0) / Math.max(researchResults.length, 1);

    const weightedContext = syntheses.map((s: any) => {
        const quality = s.researchQuality || {};
        const researchDepth = (quality.toolsUsed || 0) / Math.max(avgToolsUsed, 1);
        const weight = Math.min(researchDepth * 100, 100);
        return `${s.expertName} (research depth: ${weight.toFixed(0)}%):\n${s.synthesis}`;
    }).join('\n\n');

    const keyRequirements = votes.flatMap((v: any) => v.keyRequirements || []).join('\n');

    // Include debate resolutions if available
    const debateContext = roundData?.debateResolutions ?
        `\n\nDEBATE RESOLUTIONS (battle-tested through Ray Dalio-style challenges):\n${roundData.debateResolutions.map((d: any) =>
            `Resolution: ${d.resolution}\nAdopted Alternatives: ${d.adoptedAlternatives.join(', ')}\nConfidence Change: ${d.confidenceChange > 0 ? '+' : ''}${d.confidenceChange}%`
        ).join('\n\n')
        }` : '';

    const specPrompt = Prompts.SpecGeneration.user(weightedContext, keyRequirements, debateContext);

    return { specPrompt };
};

export const handleSpecStageComplete = async (roundData: RoundData | undefined, groqApiKey: string) => {
    const { specPrompt } = await handleSpecStage(roundData);

    const spec = await callGroq(
        groqApiKey,
        Prompts.SpecGeneration.system,
        specPrompt,
        0.7,
        4000 // Increased token limit for spec
    );

    return new Response(
        JSON.stringify({ spec }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}
