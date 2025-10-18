export type AgentType = 'elon' | 'cuban' | 'dev' | 'designer' | 'entrepreneur' | 'legal';

export interface AgentPerspective {
  agent: AgentType;
  thinking: string;
  response: string;
  status: 'thinking' | 'complete' | 'idle';
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
}

export interface SpecOutput {
  title: string;
  summary: string;
  sections: SpecSection[];
  dependencies: string[];
  risks: string[];
  testStrategy: string[];
}

export interface SpecSection {
  title: string;
  content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface SelfReflection {
  critique: string;
  improvement: string;
}

export interface ImprovedPrompt {
  version: 'unsatisfactory' | 'next-step';
  prompt: string;
  expectedImprovement: string;
}
