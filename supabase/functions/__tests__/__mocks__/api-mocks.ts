/**
 * Mock API Responses for Integration Tests
 * Provides realistic mock data for OpenRouter, Groq, and Exa APIs
 */

export const mockOpenRouterResponse = (content: string, model = 'gpt-5.2') => ({
  choices: [
    {
      message: {
        role: 'assistant',
        content
      },
      finish_reason: 'stop'
    }
  ],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 200,
    total_tokens: 300
  },
  model: `openai/${model}`
});

export const mockGroqResponse = (content: string) => ({
  choices: [
    {
      message: {
        role: 'assistant',
        content
      },
      finish_reason: 'stop'
    }
  ],
  usage: {
    prompt_tokens: 150,
    completion_tokens: 250,
    total_tokens: 400
  },
  model: 'llama-3.3-70b-versatile'
});

export const mockExaSearchResponse = (query: string) => ({
  results: [
    {
      title: `Research result for ${query}`,
      url: 'https://example.com/result1',
      text: `Detailed information about ${query}. This includes key technical insights and industry best practices.`,
      score: 0.95,
      publishedDate: '2025-01-01'
    },
    {
      title: `${query} - Technical Analysis`,
      url: 'https://example.com/result2',
      text: `Technical deep-dive on ${query} covering architecture, scalability, and implementation details.`,
      score: 0.88,
      publishedDate: '2025-01-02'
    }
  ],
  autopromptString: query
});

export const mockQuestionsResponse = () => [
  {
    id: 'q1',
    question: 'What are the core technical requirements?',
    domain: 'technical' as const,
    priority: 10,
    requiredExpertise: ['developer', 'architect']
  },
  {
    id: 'q2',
    question: 'What are the primary user experience goals?',
    domain: 'design' as const,
    priority: 9,
    requiredExpertise: ['designer', 'ux']
  },
  {
    id: 'q3',
    question: 'What is the target market size?',
    domain: 'market' as const,
    priority: 8,
    requiredExpertise: ['entrepreneur', 'marketer']
  }
];

export const mockResearchResult = (expertId: string, expertName: string) => ({
  expertId,
  expertName,
  questions: mockQuestionsResponse().slice(0, 2),
  findings: `Research findings from ${expertName}. Key insights:\n- Technical feasibility confirmed\n- Market opportunity validated\n- Implementation roadmap defined`,
  toolsUsed: [
    { tool: 'exa-search', success: true, duration: 1500 },
    { tool: 'competitor-analysis', success: true, duration: 2000 }
  ],
  duration: 3500,
  model: 'gpt-5.2',
  cost: 0.05,
  tokensUsed: 3000
});

export const mockDebateResolution = () => ({
  originalPosition: 'Initial technical approach',
  challenges: ['Scalability concerns', 'Cost implications'],
  resolution: 'Revised approach with horizontal scaling and cost optimization',
  confidenceChange: 15,
  adoptedAlternatives: ['Cloud-native architecture', 'Serverless functions']
});

export const mockSynthesis = (expertId: string, expertName: string) => ({
  expertId,
  expertName,
  synthesis: `${expertName}'s synthesis: Based on research and debate, the recommended approach balances technical feasibility with market opportunity.`,
  timestamp: new Date().toISOString(),
  researchQuality: {
    toolsUsed: 2,
    cost: 0.05,
    duration: 3500,
    battleTested: true,
    confidenceBoost: 15
  }
});

export const mockVote = (agent: string, approved: boolean) => ({
  agent,
  approved,
  confidence: approved ? 85 : 45,
  reasoning: approved
    ? `Strong technical foundation with clear market opportunity`
    : `Concerns about scalability and cost`,
  keyRequirements: ['Scalability', 'Security', 'User Experience'],
  timestamp: new Date().toISOString()
});

export const mockReviewResult = (passed: boolean) => ({
  overallScore: passed ? 88 : 62,
  passed,
  issues: passed ? [] : [
    {
      severity: 'major' as const,
      category: 'completeness' as const,
      description: 'Missing security considerations',
      remediation: 'Add security architecture section'
    }
  ],
  recommendations: [
    'Consider adding performance benchmarks',
    'Include disaster recovery plan'
  ],
  citationAnalysis: {
    totalCitations: 12,
    verifiedCitations: 10,
    missingCitations: 2,
    expertCoverage: {
      'elon': { citations: 4, verified: true },
      'steve': { citations: 6, verified: true },
      'oprah': { citations: 2, verified: false }
    }
  },
  timestamp: new Date().toISOString(),
  model: 'gpt-5.2-codex'
});

export const mockSpec = () => `
# Technical Specification

## Executive Summary
AI-powered task manager with real-time collaboration capabilities.

## Technical Requirements
- Real-time WebSocket connections
- PostgreSQL database with row-level security
- React 18+ frontend with TypeScript
- Supabase backend for auth and storage

## Architecture
- Microservices architecture
- Event-driven design
- Horizontal scaling capability

## Security
- End-to-end encryption for messages
- OAuth 2.0 authentication
- Role-based access control

## Implementation Timeline
- Phase 1: Core infrastructure (4 weeks)
- Phase 2: User features (6 weeks)
- Phase 3: Real-time collaboration (4 weeks)

## Budget
Estimated development cost: $75,000 - $100,000
`.trim();

export const mockAuthUser = (userId = 'test-user-123') => ({
  id: userId,
  email: 'test@example.com',
  created_at: '2025-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {}
});

export const mockSupabaseClient = () => ({
  auth: {
    getUser: async (token: string) => ({
      data: { user: mockAuthUser() },
      error: null
    })
  },
  rpc: async (fn: string, params: any) => {
    if (fn === 'check_and_increment_rate_limit') {
      return { data: { allowed: true, remaining: 95 }, error: null };
    }
    return { data: null, error: null };
  }
});

export const mockRateLimitHeaders = {
  'X-RateLimit-Remaining': '95',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};

export const mockCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};
