/* eslint-disable @typescript-eslint/no-explicit-any */
import { corsHeaders, callGroq, GROQ_MODEL } from '../utils/api.ts';
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
        // Guard against division by zero: if avgToolsUsed is 0, use neutral weight of 1
        const researchDepth = avgToolsUsed > 0 ? (quality.toolsUsed || 0) / avgToolsUsed : 1;
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

// Hardcoded system prompt to replace Prompts.SpecGeneration.system
const SPEC_SYSTEM_PROMPT = "You are a Principal Software Architect. Generate the final specification.";

// Helper to generate tech stack extraction prompt
const generateTechStackPrompt = (specText: string) => `Analyze the following technical specification and extract the recommended Technology Stack into a structured JSON format.

SPECIFICATION:
${specText.substring(0, 15000)}... [truncated]

Extract the key technology decisions for these categories: Frontend, Backend, Database, AI/ML, DevOps.
For each decision, identify the "Selected" tech and 1-2 "Alternatives" mentioned (or reasonable alternatives if not explicit).

Output ONLY JSON with this schema:
[
  {
    "category": "Frontend",
    "selected": { "name": "React", "rating": 5, "pros": ["Ecosystem", "Components"], "cons": ["Complexity"], "logo": "https://..." },
    "alternatives": [{ "name": "Vue", "rating": 4, "pros": [...], "cons": [...] }]
  },
  ...
]

Try to find real logo URLs if possible, or use placeholder. Ensure "rating" is 1-5.`;

export const handleSpecStageComplete = async (roundData: RoundData | undefined, groqApiKey: string) => {
    const { specPrompt } = await handleSpecStage(roundData);

    const specStart = Date.now();
    const spec = await callGroq(
        groqApiKey,
        SPEC_SYSTEM_PROMPT,
        specPrompt,
        0.7,
        4000
    );

    await trackPromptUsage('specification_generation', {
        latency_ms: Date.now() - specStart,
        model_used: GROQ_MODEL
    });

    // Extract Tech Stack
    console.log('[Enhanced] Extracting structured tech stack...');
    const techStackPrompt = generateTechStackPrompt(spec);

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
        const match = techStackJson.match(/```json\n([\s\S]*?)\n```/) || techStackJson.match(/[[\]]\s*\{[\s\S]*\}\s*[[]]/);
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
