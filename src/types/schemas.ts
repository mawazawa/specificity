import { z } from "zod";

// ============================================================================
// SESSION PERSISTENCE SCHEMAS
// Used for validating localStorage data to prevent corruption/XSS attacks
// ============================================================================

// Dialogue entry schema for session persistence
export const dialogueEntrySchema = z.object({
  id: z.string(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  content: z.string(),
  timestamp: z.string(),
  type: z.enum(['question', 'research', 'challenge', 'synthesis', 'vote', 'spec', 'chat', 'system']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type DialogueEntrySchema = z.infer<typeof dialogueEntrySchema>;

// Round schema for session state
export const sessionRoundSchema = z.object({
  id: z.string(),
  stage: z.string(),
  status: z.enum(['pending', 'in-progress', 'complete', 'paused', 'failed']),
  data: z.record(z.unknown()).optional(),
  userComment: z.string().optional(),
  timestamp: z.string().optional(),
});

// Session state schema
export const sessionStateSchema = z.object({
  isPaused: z.boolean(),
  currentStage: z.string().nullable(),
  rounds: z.array(sessionRoundSchema),
  error: z.string().nullable().optional(),
});

// Complete session data schema for localStorage
export const sessionDataSchema = z.object({
  generatedSpec: z.string(),
  dialogueEntries: z.array(dialogueEntrySchema),
  sessionState: sessionStateSchema,
  timestamp: z.string(),
  version: z.number().optional(), // For future migrations
});

export type SessionData = z.infer<typeof sessionDataSchema>;

// ============================================================================
// INPUT VALIDATION SCHEMAS
// Used for validating user inputs before API calls
// ============================================================================

// User spec input (25-5000 characters as per SimpleSpecInput validation)
export const userInputSchema = z.string()
  .min(25, 'Input must be at least 25 characters')
  .max(5000, 'Input must be at most 5000 characters')
  .transform(s => s.trim());

// Chat message (1-2000 characters)
export const chatMessageSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message must be at most 2000 characters')
  .transform(s => s.trim());

// Safe URL schema with protocol validation
export const safeUrlSchema = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  { message: 'URL must use http or https protocol' }
);

// Tech logo domain whitelist for security
export const ALLOWED_LOGO_DOMAINS = [
  'cdn.brandfetch.io',
  'img.logo.dev',
  'logo.clearbit.com',
  'avatars.githubusercontent.com',
  'raw.githubusercontent.com',
] as const;

export const techLogoDomainSchema = z.string().refine(
  (domain) => ALLOWED_LOGO_DOMAINS.some(allowed => domain.endsWith(allowed)),
  { message: 'Logo domain not in whitelist' }
);

// ============================================================================
// BACKEND SCHEMAS (Copied from supabase/functions)
// ============================================================================

// Copied from supabase/functions/multi-agent-spec/lib/types.ts and associated files
// to ensure frontend-backend type parity.

// From lib/question-generator.ts
export const researchQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  domain: z.enum(['technical', 'design', 'market', 'legal', 'growth', 'security']),
  priority: z.number().int().min(1).max(10),
  requiredExpertise: z.array(z.string()),
});

export type ResearchQuestion = z.infer<typeof researchQuestionSchema>;

// From lib/expert-matcher.ts
export const expertAssignmentSchema = z.object({
  expertId: z.string(),
  expertName: z.string(),
  questions: z.array(researchQuestionSchema),
  model: z.string(),
});

export type ExpertAssignment = z.infer<typeof expertAssignmentSchema>;

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

export type AgentResearchResult = z.infer<typeof agentResearchResultSchema>;

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

export type ChallengeQuestion = z.infer<typeof challengeQuestionSchema>;

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

export type ChallengeResponse = z.infer<typeof challengeResponseSchema>;

// From lib/challenge-generator.ts
export const debateResolutionSchema = z.object({
  originalPosition: z.string(),
  challenges: z.array(z.string()),
  resolution: z.string(),
  confidenceChange: z.number().int().min(-100).max(100),
  adoptedAlternatives: z.array(z.string()),
});

export type DebateResolution = z.infer<typeof debateResolutionSchema>;

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

export type ExpertSynthesis = z.infer<typeof expertSynthesisSchema>;

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

export type ExpertVote = z.infer<typeof expertVoteSchema>;

// From review.ts - Phase 4 heavy-model review
export const reviewIssueSchema = z.object({
  severity: z.enum(['critical', 'major', 'minor']),
  category: z.enum(['accuracy', 'completeness', 'citation', 'feasibility', 'consistency']),
  description: z.string(),
  affectedExpert: z.string().optional(),
  remediation: z.string(),
});

export const citationAnalysisSchema = z.object({
  totalCitations: z.number().int(),
  verifiedCitations: z.number().int(),
  missingCitations: z.number().int(),
  expertCoverage: z.record(z.string(), z.object({
    citations: z.number().int(),
    verified: z.boolean(),
  })),
});

export const reviewResultSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  passed: z.boolean(),
  issues: z.array(reviewIssueSchema),
  recommendations: z.array(z.string()),
  citationAnalysis: citationAnalysisSchema,
  timestamp: z.string(),
  model: z.string(),
});

export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
export type CitationAnalysis = z.infer<typeof citationAnalysisSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;

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
  review: reviewResultSchema.optional(), // Phase 4: Heavy-model review
  votes: z.array(expertVoteSchema).optional(),
});

export type RoundData = z.infer<typeof roundDataSchema>;
