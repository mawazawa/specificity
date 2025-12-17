/**
 * Shared types for the multi-agent-spec function
 */
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const agentConfigSchema = z.object({
    id: z.string().optional(),
    agent: z.string().min(1).max(50),
    systemPrompt: z.string().min(1).max(2000),
    temperature: z.number().min(0).max(1),
    enabled: z.boolean(),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;

// From lib/question-generator.ts
export const researchQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  domain: z.enum(['technical', 'design', 'market', 'legal', 'growth', 'security']),
  priority: z.number().int().min(1).max(10),
  requiredExpertise: z.array(z.string()),
});

// From lib/expert-matcher.ts
export const expertAssignmentSchema = z.object({
  expertId: z.string(),
  expertName: z.string(),
  questions: z.array(researchQuestionSchema),
  model: z.string(),
});

// From lib/parallel-executor.ts
export const toolUsedSchema = z.object({
  tool: z.string(),
  success: z.boolean(),
  duration: z.number(),
});

export const agentResearchResultSchema = z.object({
  expertId: z.string(),
  expertName: z.string(),
  questions: z.array(researchQuestionSchema),
  findings: z.string(),
  toolsUsed: z.array(toolUsedSchema),
  duration: z.number(),
  model: z.string(),
  cost: z.number(),
  tokensUsed: z.number(),
});

// Inferred from handleResearchStage
export const researchMetadataSchema = z.object({
  totalCost: z.number(),
  totalTokens: z.number(),
  totalToolsUsed: z.number(),
  duration: z.number(),
});

// From lib/challenge-generator.ts
export const challengeQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['feasibility', 'risk', 'alternative', 'assumption', 'vision', 'cost']),
  question: z.string(),
  targetFindings: z.string(),
  challenger: z.string(),
  priority: z.number().int().min(1).max(10),
});

// From lib/challenge-generator.ts
export const challengeResponseSchema = z.object({
  challengeId: z.string(),
  challenger: z.string(),
  challenge: z.string(),
  evidenceAgainst: z.array(z.string()),
  alternativeApproach: z.string().optional(),
  riskScore: z.number().int().min(0).max(10),
  model: z.string(),
  cost: z.number(),
});

// From lib/challenge-generator.ts
export const debateResolutionSchema = z.object({
  originalPosition: z.string(),
  challenges: z.array(z.string()),
  resolution: z.string(),
  confidenceChange: z.number().int().min(-100).max(100),
  adoptedAlternatives: z.array(z.string()),
});

// Inferred from handleChallengeStage
export const challengeMetadataSchema = z.object({
  totalChallenges: z.number().int(),
  totalResponses: z.number().int(),
  avgRiskScore: z.number(),
  challengeCost: z.number(),
  debatesResolved: z.number().int(),
  productiveConflict: z.boolean(),
});

// Inferred from handleSynthesisStage
export const researchQualitySchema = z.object({
  toolsUsed: z.number().int(),
  cost: z.number(),
  duration: z.number(),
  battleTested: z.boolean(),
  confidenceBoost: z.number().int(),
});

export const expertSynthesisSchema = z.object({
  expertId: z.string(),
  expertName: z.string(),
  synthesis: z.string(),
  timestamp: z.string(), // ISO string
  researchQuality: researchQualitySchema,
});

// Inferred from handleSynthesisStage
export const synthesisMetadataSchema = z.object({
  totalSyntheses: z.number().int(),
  battleTested: z.number().int(),
  productiveConflict: z.boolean(),
});

// Inferred from handleVotingStage
export const expertVoteSchema = z.object({
  agent: z.string(),
  approved: z.boolean(),
  confidence: z.number().int().min(0).max(100),
  reasoning: z.string(),
  keyRequirements: z.array(z.string()),
  timestamp: z.string(), // ISO string
});


// Combine into a single roundData schema
export const roundDataSchema = z.object({
  questions: z.array(researchQuestionSchema).optional(),
  researchResults: z.array(agentResearchResultSchema).optional(),
  assignments: z.array(expertAssignmentSchema).optional(),
  researchMetadata: researchMetadataSchema.optional(),
  challenges: z.array(challengeQuestionSchema).optional(),
  challengeResponses: z.array(challengeResponseSchema).optional(),
  debateResolutions: z.array(debateResolutionSchema).optional(),
  challengeMetadata: challengeMetadataSchema.optional(),
  syntheses: z.array(expertSynthesisSchema).optional(),
  synthesisMetadata: synthesisMetadataSchema.optional(),
  votes: z.array(expertVoteSchema).optional(),
});

export type RoundData = z.infer<typeof roundDataSchema>;

export const requestSchema = z.object({
    userInput: z.string()
        .min(1, 'Input required')
        .max(5000, 'Input too long')
        .optional(),
    stage: z.enum(['questions', 'research', 'challenge', 'synthesis', 'voting', 'spec']),
    userComment: z.string().max(1000).optional(),
    agentConfigs: z.array(agentConfigSchema).optional(),
    roundData: roundDataSchema.optional(),
});

export type RequestBody = z.infer<typeof requestSchema>;
