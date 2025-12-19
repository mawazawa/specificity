/* eslint-disable @typescript-eslint/no-explicit-any */
import { corsHeaders } from '../utils/api.ts';
import { callGroq } from '../utils/api.ts';
import { Prompts } from '../../../lib/prompts.ts';
import { RoundData } from '../types.ts';
import { renderPrompt, trackPromptUsage } from '../../../lib/prompt-service.ts';

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

    // Load specification generation prompt from database
    const specPrompt = await renderPrompt('specification_generation', {
        weightedContext,
        keyRequirements,
        debateContext
    });

    return { specPrompt };
};

export const handleSpecStageComplete = async (roundData: RoundData | undefined, groqApiKey: string) => {
    const { specPrompt } = await handleSpecStage(roundData);

    const specStart = Date.now();
    const spec = await callGroq(
        groqApiKey,
        Prompts.SpecGeneration.system,
        specPrompt,
        0.7,
        4000
    );

    await trackPromptUsage('specification_generation', {
        latency_ms: Date.now() - specStart,
        model_used: 'llama-3.3-70b-versatile'
    });

    // Extract Tech Stack
    console.log('[Enhanced] Extracting structured tech stack...');
    const techStackPrompt = Prompts.SpecGeneration.techStackExtraction(spec);
    
    let techStack = [];
    try {
        const techStackJson = await callGroq(
            groqApiKey,
            "You are a JSON extractor. Output valid JSON only.",
            techStackPrompt,
            0.2, // Low temp for extraction
            1000
        );
        // Attempt to parse JSON from potential markdown blocks
        const match = techStackJson.match(/```json\n([\s\S]*?)\n```/) || techStackJson.match(/[\[]\s*\{[\s\S]*\}\s*[\]]/);
        const jsonStr = match ? match[1] || match[0] : techStackJson;
        techStack = JSON.parse(jsonStr);
    } catch (e) {
        console.error('Failed to extract tech stack:', e);
        // Fallback or empty
    }

    return new Response(
        JSON.stringify({ spec, techStack }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}
