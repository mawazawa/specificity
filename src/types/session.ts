/**
 * Centralized Session Types
 *
 * This module consolidates all session-related types from across the codebase
 * to provide a single source of truth for session state management.
 */

// Re-export core domain types from spec.ts
export type {
  SessionState,
  Round,
  ResumeContext,
  HistoryEntry,
  AgentConfig,
  TechStackItem,
  Vote,
  Challenge,
  ChallengeResponse,
  DebateResolution,
  AgentAnswer,
  ResearchResult,
  SpecQuestion,
  ReviewResult,
  ReviewIssue,
  CitationAnalysis
} from './spec';

// Re-export task types from use-tasks hook
export type { Task } from '@/hooks/spec-generation/use-tasks';

// Re-export dialogue types from use-dialogue hook
export type { DialogueEntry } from '@/hooks/spec-generation/use-dialogue';

// Generation stage type (from use-spec-flow)
export type GenerationStage =
  | 'idle'
  | 'refinement'
  | 'questions'
  | 'research'
  | 'challenge'
  | 'synthesis'
  | 'review'
  | 'voting'
  | 'spec'
  | 'complete'
  | 'error';
