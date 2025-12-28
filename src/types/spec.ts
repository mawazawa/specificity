import {
  _ResearchQuestion,
  AgentResearchResult,
  ChallengeQuestion,
  ChallengeResponse,
  DebateResolution as SchemaDebateResolution,
  ExpertSynthesis,
  ExpertVote,
  ReviewResult as SchemaReviewResult,
  ReviewIssue as SchemaReviewIssue,
  CitationAnalysis as SchemaCitationAnalysis
} from './schemas';

export type AgentType = 'elon' | 'steve' | 'oprah' | 'zaha' | 'jony' | 'bartlett' | 'amal' | 'user' | 'system';

export interface AgentConfig {
  agent: string; // broadened from AgentType to allow dynamic agents
  id?: string;
  systemPrompt: string;
  temperature: number;
  enabled: boolean;
}

export interface AgentPerspective {
  agent: string;
  thinking: string;
  response: string;
  reasoning: string;
  status: 'thinking' | 'complete' | 'idle';
}

// Re-export or alias schema types for UI compatibility
export type Vote = ExpertVote;
export type Challenge = ChallengeQuestion;
export type { ChallengeResponse };
export type DebateResolution = SchemaDebateResolution;
export type AgentAnswer = ExpertSynthesis;
export type ResearchResult = AgentResearchResult;
export type SpecQuestion = ResearchQuestion;
export type ReviewResult = SchemaReviewResult;
export type ReviewIssue = SchemaReviewIssue;
export type CitationAnalysis = SchemaCitationAnalysis;

export interface Round {
  roundNumber: number;
  stage: 'questions' | 'research' | 'challenge' | 'answers' | 'review' | 'voting' | 'spec';
  questions: SpecQuestion[];
  research: ResearchResult[];
  challenges?: Challenge[];
  challengeResponses?: ChallengeResponse[];
  debateResolutions?: DebateResolution[];
  answers: AgentAnswer[];
  review?: ReviewResult;
  votes: Vote[];
  status: 'in-progress' | 'complete' | 'paused';
  userComment?: string;
}

export interface TechAlternative {
  name: string;
  logo: string;
  domain?: string; // For Brandfetch API logo lookup (e.g., "react.dev", "nextjs.org")
  version?: string; // Technology version (e.g., "19.0.2", "15.1.0")
  rating: number;
  pros: string[];
  cons: string[];
}

export interface TechStackItem {
  category: string;
  selected: TechAlternative;
  alternatives: TechAlternative[];
}

export interface SpecOutput {
  title: string;
  summary: string;
  sections: SpecSection[];
  techStack: TechStackItem[];
  dependencies: string[];
  risks: string[];
  testStrategy: string[];
  approvedBy: string[];
  dissentedBy: string[];
  mockup_url?: string; // AI-generated UI mockup URL
}

export interface SpecSection {
  title: string;
  content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ResumeContext {
  input: string;
  nextRound: number;
  userComment?: string;
}

export interface SessionState {
  rounds: Round[];
  currentRound: number;
  isPaused: boolean;
  finalSpec?: SpecOutput;
  pendingResume?: ResumeContext | null;
  history: HistoryEntry[];
}

// History entry types for tracking session events
export interface QuestionHistoryData {
  stage: 'questions';
  questions: SpecQuestion[];
  count: number;
}

export interface ResearchHistoryData {
  stage: 'research';
  expertsCount: number;
  toolsUsed: number;
  cost: number;
  duration: number;
}

export interface ChallengeHistoryData {
  stage: 'challenge';
  challenges: number;
  responses: number;
  resolutions: number;
  cost: number;
  duration: number;
}

export interface SynthesisHistoryData {
  stage: 'synthesis';
  syntheses: AgentAnswer[];
}

export interface SpecHistoryData {
  spec: string;
}

export interface UserCommentData {
  comment: string;
}

export type HistoryEntryData =
  | QuestionHistoryData
  | ResearchHistoryData
  | ChallengeHistoryData
  | SynthesisHistoryData
  | Vote
  | AgentPerspective
  | SpecHistoryData
  | UserCommentData
  | string;

export interface HistoryEntry {
  timestamp: string;
  type: 'vote' | 'output' | 'spec' | 'user-comment';
  data: HistoryEntryData;
}
