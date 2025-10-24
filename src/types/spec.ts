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
}

export interface Round {
  roundNumber: number;
  stage: 'questions' | 'research' | 'answers' | 'voting' | 'spec';
  questions: SpecQuestion[];
  research: ResearchResult[];
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

export type HistoryEntryData =
  | { type: 'vote'; data: Vote }
  | { type: 'output'; data: AgentPerspective }
  | { type: 'spec'; data: string }
  | { type: 'user-comment'; data: string };

export interface HistoryEntry {
  timestamp: string;
  type: 'vote' | 'output' | 'spec' | 'user-comment';
  data: Vote | AgentPerspective | string;
}
