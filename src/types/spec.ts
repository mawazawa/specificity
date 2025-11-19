export type AgentType = 'elon' | 'steve' | 'oprah' | 'zaha' | 'jony' | 'bartlett' | 'amal';

export interface AgentConfig {
  agent: AgentType;
  systemPrompt: string;
  temperature: number;
  enabled: boolean;
}

export interface AgentPerspective {
  agent: AgentType;
  thinking: string;
  response: string;
  reasoning: string;
  status: 'thinking' | 'complete' | 'idle';
}

export interface Vote {
  agent: AgentType;
  approved: boolean;
  reasoning: string;
  timestamp: string;
  confidence?: number;
}

export interface Challenge {
  id: string;
  question: string;
  challenger: AgentType;
  target: AgentType;
  riskScore: number;
}

export interface ChallengeResponse {
  id: string;
  challengeId: string;
  challenger: AgentType;
  challenge: string;
  evidenceAgainst: string[];
  alternativeApproach?: string;
  riskScore: number;
  cost: number;
}

export interface DebateResolution {
  resolution: string;
  confidenceChange: number;
  adoptedAlternatives: string[];
}

export interface Round {
  roundNumber: number;
  stage: 'questions' | 'research' | 'challenge' | 'answers' | 'voting' | 'spec';
  questions: SpecQuestion[];
  research: ResearchResult[];
  challenges?: Challenge[];
  challengeResponses?: ChallengeResponse[];
  debateResolutions?: DebateResolution[];
  answers: AgentAnswer[];
  votes: Vote[];
  status: 'in-progress' | 'complete' | 'paused';
  userComment?: string;
}

export interface AgentAnswer {
  agent: AgentType;
  question: string;
  answer: string;
  reasoning: string;
}

export interface ResearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export interface SpecQuestion {
  question: string;
  context: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  askedBy: AgentType;
}

export interface TechAlternative {
  name: string;
  logo: string;
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
  approvedBy: AgentType[];
  dissentedBy: AgentType[];
}

export interface SpecSection {
  title: string;
  content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface SessionState {
  rounds: Round[];
  currentRound: number;
  isPaused: boolean;
  finalSpec?: SpecOutput;
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
