/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Challenge Generator - Ray Dalio Style Productive Conflict
 *
 * Implements "radical truth" by having experts challenge each other's assumptions,
 * stress-test ideas, and explore contrarian viewpoints.
 */

import { callOpenRouter, retryWithBackoff } from './openrouter-client.ts';

export interface ChallengeQuestion {
  id: string;
  type: 'feasibility' | 'risk' | 'alternative' | 'assumption' | 'vision' | 'cost';
  question: string;
  targetFindings: string; // Which research findings this challenges
  challenger: string; // Expert ID who will challenge
  priority: number;
}

export interface ChallengeResponse {
  challengeId: string;
  challenger: string;
  challenge: string; // The contrarian argument
  evidenceAgainst: string[]; // Evidence supporting the challenge
  alternativeApproach?: string;
  riskScore: number; // 0-10, how serious is this concern
  model: string;
  cost: number;
}

export interface DebateResolution {
  originalPosition: string;
  challenges: string[];
  resolution: string; // Synthesized position after debate
  confidenceChange: number; // How much confidence changed (-100 to +100)
  adoptedAlternatives: string[];
}

/**
 * Generate challenge questions based on research findings
 * Inspired by Ray Dalio's principle: "Stress test your ideas by having the smartest people challenge them"
 */
export async function generateChallenges(
  researchResults: any[],
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

  const systemPrompt = `You are a critical thinking expert trained in Ray Dalio's principles of "radical truth" and "thoughtful disagreement."

Your role is to generate CHALLENGING, CONTRARIAN questions that stress-test ideas and expose hidden assumptions.

Key principles:
1. **Play devil's advocate** - Find weaknesses in popular approaches
2. **Challenge assumptions** - What are they taking for granted?
3. **Explore alternatives** - What other paths weren't considered?
4. **Identify risks** - What could go catastrophically wrong?
5. **Question vision** - Is this ambitious enough? Or too ambitious?
6. **Cost-benefit reality** - Are they underestimating complexity?

Generate ${challengesPerFinding * researchResults.length} challenge questions that will force experts to defend their positions and consider alternatives.`;

  const userPrompt = `Product Idea: ${userInput}

Research Findings:
${findingsSummary}

Generate challenge questions in this JSON format:
{
  "challenges": [
    {
      "type": "feasibility|risk|alternative|assumption|vision|cost",
      "question": "Challenging question that forces rethinking",
      "targetFindingIndex": 0,
      "priority": 1-10
    }
  ]
}

Make challenges TOUGH but fair. We want productive conflict that improves the final product.`;

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
export async function executeChallenges(
  challenges: ChallengeQuestion[],
  researchResults: any[],
  agentConfigs: any[]
): Promise<ChallengeResponse[]> {
  const responses = await Promise.all(
    challenges.map(challenge => executeChallenge(challenge, researchResults, agentConfigs))
  );

  return responses;
}

async function executeChallenge(
  challenge: ChallengeQuestion,
  researchResults: any[],
  agentConfigs: any[]
): Promise<ChallengeResponse> {
  const challenger = agentConfigs.find(a => a.id === challenge.challenger);
  if (!challenger) {
    throw new Error(`Challenger ${challenge.challenger} not found`);
  }

  // Find the original findings being challenged
  const targetFindings = researchResults.find(r => r.expertId === challenge.targetFindings);

  const systemPrompt = `You are ${challenger.agent}, playing the role of "devil's advocate."

Your personality: ${challenger.systemPrompt}

Your task: CHALLENGE the current thinking with a well-reasoned contrarian argument.

Ray Dalio principles:
- "Be radically open-minded" - consider this may be wrong
- "Stress test by disagreeing" - find the weakest points
- "Thoughtful disagreement" - argue with evidence, not emotion
- "Triangulate" - what alternative paths exist?

Argue the OPPOSITE position or identify CRITICAL FLAWS.`;

  const userPrompt = `Challenge Question: ${challenge.question}

Original Research Finding:
${targetFindings?.findings || 'General findings'}

Provide your contrarian argument in JSON:
{
  "challenge": "Your core argument against the current approach",
  "evidenceAgainst": ["Specific reason 1", "Specific reason 2", "Specific reason 3"],
  "alternativeApproach": "What should we do instead? (optional)",
  "riskScore": 1-10
}

Be tough but fair. Your job is to IMPROVE the final outcome through productive conflict.`;

  const model = getModelForChallenger(challenger.id);
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
  researchResults: any[],
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
  research: any,
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

  const systemPrompt = `You are a neutral facilitator synthesizing a debate using Ray Dalio's principles:

1. "Truth over harmony" - Best ideas win, not most popular
2. "Idea meritocracy" - Weigh arguments on merit
3. "Believability-weighted decision making" - Consider expertise
4. "Synthesize" - Find the stronger position that emerges from conflict

Your task: Reconcile the original position with challenges to create a STRONGER, BATTLE-TESTED position.`;

  const userPrompt = `Original Position:
${research.findings}

Challenges Raised:
${relevantChallenges.map((c, idx) =>
    `${idx + 1}. ${c.challenger}: ${c.challenge}\n   Evidence: ${c.evidenceAgainst.join('; ')}\n   Alternative: ${c.alternativeApproach || 'N/A'}\n   Risk Score: ${c.riskScore}/10`
  ).join('\n\n')}

Synthesize these into a stronger position in JSON:
{
  "resolution": "The battle-tested position that incorporates valid challenges",
  "confidenceChange": -100 to +100 (how much confidence changed after debate),
  "adoptedAlternatives": ["Which alternative approaches are worth pursuing"]
}

Don't just compromise - find the TRUTH through productive conflict.`;

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
