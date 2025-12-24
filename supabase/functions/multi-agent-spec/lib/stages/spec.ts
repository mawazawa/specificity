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

// Common tech domains mapping for Brandfetch logo lookup
// When the LLM outputs a domain, Brandfetch will provide the logo automatically
const KNOWN_TECH_DOMAINS: Record<string, string> = {
  'react': 'react.dev',
  'vue': 'vuejs.org',
  'angular': 'angular.io',
  'svelte': 'svelte.dev',
  'next.js': 'nextjs.org',
  'nextjs': 'nextjs.org',
  'nuxt': 'nuxt.com',
  'vite': 'vitejs.dev',
  'webpack': 'webpack.js.org',
  'node.js': 'nodejs.org',
  'nodejs': 'nodejs.org',
  'deno': 'deno.land',
  'bun': 'bun.sh',
  'express': 'expressjs.com',
  'fastify': 'fastify.io',
  'supabase': 'supabase.com',
  'firebase': 'firebase.google.com',
  'postgresql': 'postgresql.org',
  'postgres': 'postgresql.org',
  'mongodb': 'mongodb.com',
  'redis': 'redis.io',
  'prisma': 'prisma.io',
  'drizzle': 'orm.drizzle.team',
  'openai': 'openai.com',
  'anthropic': 'anthropic.com',
  'groq': 'groq.com',
  'google': 'google.com',
  'gemini': 'gemini.google.com',
  'vercel': 'vercel.com',
  'netlify': 'netlify.com',
  'cloudflare': 'cloudflare.com',
  'aws': 'aws.amazon.com',
  'docker': 'docker.com',
  'kubernetes': 'kubernetes.io',
  'github': 'github.com',
  'typescript': 'typescriptlang.org',
  'tailwindcss': 'tailwindcss.com',
  'tailwind': 'tailwindcss.com',
  'shadcn': 'ui.shadcn.com',
  'radix': 'radix-ui.com',
  'framer': 'framer.com',
  'stripe': 'stripe.com',
  'clerk': 'clerk.com',
  'auth0': 'auth0.com',
  'sentry': 'sentry.io',
  'vitest': 'vitest.dev',
  'jest': 'jestjs.io',
  'playwright': 'playwright.dev',
  'cypress': 'cypress.io',
  'zustand': 'zustand-demo.pmnd.rs',
  'redux': 'redux.js.org',
  'tanstack': 'tanstack.com',
};

// Helper to generate tech stack extraction prompt
const generateTechStackPrompt = (specText: string) => `Analyze the following technical specification and extract the recommended Technology Stack into a structured JSON format.

SPECIFICATION:
${specText.substring(0, 15000)}... [truncated]

Extract the key technology decisions for these categories: Frontend, Backend, Database, AI/ML, DevOps.
For each decision, identify the "Selected" tech and 1-2 "Alternatives" mentioned (or reasonable alternatives if not explicit).

IMPORTANT: Include the "domain" field for each technology - this is the official website domain (e.g., "react.dev", "nextjs.org", "supabase.com").
The domain is used for automatic logo lookup via Brandfetch CDN.

Output ONLY JSON with this schema:
[
  {
    "category": "Frontend",
    "selected": {
      "name": "React",
      "domain": "react.dev",
      "version": "19.0.2",
      "rating": 5,
      "pros": ["Ecosystem", "Components"],
      "cons": ["Complexity"],
      "logo": ""
    },
    "alternatives": [{
      "name": "Vue",
      "domain": "vuejs.org",
      "version": "3.5.0",
      "rating": 4,
      "pros": [...],
      "cons": [...],
      "logo": ""
    }]
  },
  ...
]

Common domains: ${Object.entries(KNOWN_TECH_DOMAINS).slice(0, 20).map(([k, v]) => `${k}=${v}`).join(', ')}

Leave "logo" empty - logos are fetched dynamically from Brandfetch CDN using the domain.
Ensure "rating" is 1-5.`;

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
