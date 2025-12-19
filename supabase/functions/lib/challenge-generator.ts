import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { callOpenRouter, retryWithBackoff } from './openrouter-client.ts';
import { AgentResearchResult } from './parallel-executor.ts';
import { renderPrompt, trackPromptUsage } from './prompt-service.ts';

export const ChallengeQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['feasibility', 'risk', 'alternative', 'assumption', 'vision', 'cost']),
  question: z.string(),
  targetFindings: z.string(), // Which research findings this challenges
  challenger: z.string(), // Expert ID who will challenge
  priority: z.number().int().min(1).max(10),
});

export type ChallengeQuestion = z.infer<typeof ChallengeQuestionSchema>;

export const ChallengeResponseSchema = z.object({
  challengeId: z.string(),
  challenger: z.string(),
  challenge: z.string(), // The contrarian argument
  evidenceAgainst: z.array(z.string()), // Evidence supporting the challenge
  alternativeApproach: z.string().optional(),
  riskScore: z.number().int().min(0).max(10), // 0-10, how serious is this concern
  model: z.string(),
  cost: z.number(),
});

export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>;

export const DebateResolutionSchema = z.object({
  originalPosition: z.string(),
  challenges: z.array(z.string()),
  resolution: z.string(), // Synthesized position after debate
  confidenceChange: z.number().int().min(-100).max(100), // How much confidence changed (-100 to +100)
  adoptedAlternatives: z.array(z.string()),
});

export type DebateResolution = z.infer<typeof DebateResolutionSchema>;

/**
 * Generate challenge questions based on research findings
 * Inspired by Ray Dalio's principle: "Stress test your ideas by having the smartest people challenge them"
 */
export async function generateChallenges(
  researchResults: AgentResearchResult[],
  userInput: string,
  options: {
    model?: string;
    challengesPerFinding?: number;
  } = {}
): Promise<ChallengeQuestion[]> {
  const {
    model = 'gpt-5.1',
    challengesPerFinding = 2
  } = options;

  // Create a summary of all findings
  const findingsSummary = researchResults.map((r, idx) =>
    `Finding ${idx + 1} (by ${r.expertId}):\n${r.findings.substring(0, 500)}...`
  ).join('\n\n');

  // Load challenge generation prompt from database
  const systemPrompt = await renderPrompt('challenge_generation', {
    challengesPerFinding,
    findingsSummary,
    userInput
  });
  const userPrompt = `Product Idea: ${userInput}\n\nResearch Findings:\n${findingsSummary}\n\nGenerate challenge questions in JSON format as specified.`;

  const startTime = Date.now();
  const response = await retryWithBackoff(
    () => callOpenRouter({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, // Higher temperature for creative challenges
      maxTokens: 2000,
      responseFormat: 'json'
    })
  );

  const parsed = JSON.parse(response.content);
  const challenges: ChallengeQuestion[] = parsed.challenges.map((c: any, idx: number) => ({
    id: `challenge_${idx}`,
    type: c.type,
    question: c.question,
    targetFindings: researchResults[c.targetFindingIndex]?.expertId || 'general',
    challenger: assignChallenger(c.type),
    priority: c.priority
  }));

  await trackPromptUsage('challenge_generation', {
    cost_cents: Math.round(response.cost * 100),
    latency_ms: Date.now() - startTime,
    model_used: response.model,
    tokens_input: response.usage.promptTokens,
    tokens_output: response.usage.completionTokens
  });

  return challenges;
}

/**
 * Assign the best challenger based on challenge type
 */
function assignChallenger(type: string): string {
  const assignments: Record<string, string[]> = {
    'feasibility': ['elon', 'steve'], // Tech realists
    'risk': ['amal', 'bartlett'], // Legal/business risk experts
    'alternative': ['steve', 'jony'], // Visionaries who see different paths
    'assumption': ['bartlett', 'oprah'], // Challenge conventional wisdom
    'vision': ['steve', 'zaha'], // Push for bigger thinking
    'cost': ['elon', 'bartlett'] // Pragmatic cost-conscious
  };

  const pool = assignments[type] || ['elon', 'steve', 'bartlett'];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Execute a challenge - have an expert argue the contrarian position
 */
import { AgentConfig } from '../multi-agent-spec/lib/types.ts'; // Import AgentConfig

export async function executeChallenges(
  challenges: ChallengeQuestion[],
  researchResults: AgentResearchResult[],
  agentConfigs: AgentConfig[]
): Promise<ChallengeResponse[]> {
  const responses = await Promise.all(
    challenges.map(challenge => executeChallenge(challenge, researchResults, agentConfigs))
  );

  return responses;
}

async function executeChallenge(
  challenge: ChallengeQuestion,
  researchResults: AgentResearchResult[],
  agentConfigs: AgentConfig[]
): Promise<ChallengeResponse> {
  const challenger = agentConfigs.find(a => a.id === challenge.challenger);
  if (!challenger) {
    throw new Error(`Challenger ${challenge.challenger} not found`);
  }

  // Find the original findings being challenged
  const targetFindings = researchResults.find(r => r.expertId === challenge.targetFindings);

  // Load challenge execution prompt from database
  const systemPrompt = await renderPrompt('challenge_execution', {
    challengerName: challenger.agent,
    challengerPersonality: challenger.systemPrompt,
    challenge: challenge.question,
    targetFindings: targetFindings?.findings || 'General findings'
  });
  const userPrompt = `Challenge Question: ${challenge.question}\n\nOriginal Research Finding:\n${targetFindings?.findings || 'General findings'}\n\nProvide your contrarian argument in JSON format as specified.`;

  const model = getModelForChallenger(challenger.id);
  const startTime = Date.now();
  const response = await retryWithBackoff(
    () => callOpenRouter({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 800,
      responseFormat: 'json'
    })
  );

  const parsed = JSON.parse(response.content);

  await trackPromptUsage('challenge_execution', {
    cost_cents: Math.round(response.cost * 100),
    latency_ms: Date.now() - startTime,
    model_used: response.model,
    tokens_input: response.usage.promptTokens,
    tokens_output: response.usage.completionTokens
  });

  return {
    challengeId: challenge.id,
    challenger: challenge.challenger,
    challenge: parsed.challenge,
    evidenceAgainst: parsed.evidenceAgainst,
    alternativeApproach: parsed.alternativeApproach,
    riskScore: parsed.riskScore,
    model,
    cost: response.cost
  };
}

/**
 * Resolve debates - synthesize original position + challenges into stronger position
 */
export async function resolveDebates(
  researchResults: AgentResearchResult[],
  challenges: ChallengeResponse[],
  options: { model?: string } = {}
): Promise<DebateResolution[]> {
  const { model = 'claude-sonnet-4.5' } = options; // Claude is great at synthesis

  const resolutions = await Promise.all(
    researchResults.map(research =>
      resolveDebate(research, challenges, model)
    )
  );

  return resolutions;
}

async function resolveDebate(
  research: AgentResearchResult,
  allChallenges: ChallengeResponse[],
  model: string
): Promise<DebateResolution> {
  // Find challenges relevant to this research
  const relevantChallenges = allChallenges.filter(
    c => c.challengeId.includes(research.expertId) || Math.random() > 0.5 // Some randomness
  );

  if (relevantChallenges.length === 0) {
    return {
      originalPosition: research.findings,
      challenges: [],
      resolution: research.findings,
      confidenceChange: 0,
      adoptedAlternatives: []
    };
  }

  const challengesText = relevantChallenges.map((c, idx) =>
    `${idx + 1}. ${c.challenger}: ${c.challenge}\n   Evidence: ${c.evidenceAgainst.join('; ')}\n   Alternative: ${c.alternativeApproach || 'N/A'}\n   Risk Score: ${c.riskScore}/10`
  ).join('\n\n');

  // Load debate resolution prompt from database
  const systemPrompt = await renderPrompt('debate_resolution', {
    originalPosition: research.findings,
    challenges: challengesText
  });
  const userPrompt = `Original Position:\n${research.findings}\n\nChallenges Raised:\n${challengesText}\n\nSynthesize these into a stronger position in JSON format as specified.`;

  const startTime = Date.now();
  const response = await retryWithBackoff(
    () => callOpenRouter({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      maxTokens: 1500,
      responseFormat: 'json'
    })
  );

  const parsed = JSON.parse(response.content);

  await trackPromptUsage('debate_resolution', {
    cost_cents: Math.round(response.cost * 100),
    latency_ms: Date.now() - startTime,
    model_used: response.model,
    tokens_input: response.usage.promptTokens,
    tokens_output: response.usage.completionTokens
  });

  return {
    originalPosition: research.findings,
    challenges: relevantChallenges.map(c => c.challenge),
    resolution: parsed.resolution,
    confidenceChange: parsed.confidenceChange,
    adoptedAlternatives: parsed.adoptedAlternatives
  };
}

/**
 * Select best model for each challenger
 */
function getModelForChallenger(expertId: string): string {
  const modelAssignments: Record<string, string> = {
    'elon': 'gpt-5.1', // Strong reasoning for tech challenges
    'steve': 'gpt-5.1', // Visionary challenges
    'jony': 'claude-sonnet-4.5', // Design/UX challenges
    'amal': 'gpt-5.1', // Legal/risk challenges
    'bartlett': 'gemini-2.5-flash', // Business/market challenges
    'zaha': 'claude-sonnet-4.5', // Architectural/vision challenges
    'oprah': 'gemini-2.5-flash' // User empathy challenges
  };

  return modelAssignments[expertId] || 'gpt-5.1';
}
