# Implementation Roadmap: Hybrid Multi-Agent Architecture

**Project:** Specificity AI Enhancement
**Goal:** Combine Make It Heavy's orchestration with Specificity's production quality
**Timeline:** 5 weeks
**Start Date:** November 16, 2025

---

## PHASE 1: Dynamic Question Generation (Week 1)

### Objective
Replace fixed expert personas with AI-generated research questions tailored to each user input.

### Implementation

#### 1.1 Create Question Generation Function

```typescript
// supabase/functions/multi-agent-spec/question-generator.ts

export interface ResearchQuestion {
  id: string;
  question: string;
  domain: string; // 'technical' | 'design' | 'market' | 'legal' | 'growth'
  priority: number; // 1-10
  requiredExpertise: string[]; // ['steve', 'elon', 'amal']
}

export async function generateDynamicQuestions(
  userInput: string,
  options: {
    model?: string;
    count?: number;
    style?: string;
  } = {}
): Promise<ResearchQuestion[]> {
  const {
    model = 'gpt-5.1', // Latest model for meta-reasoning
    count = 7,
    style = 'technical_spec_research'
  } = options;

  const systemPrompt = `You are a research question generator for a product specification system.

Given a user's product idea, generate ${count} research questions that will comprehensively explore:
1. Technical architecture and implementation
2. User experience and design
3. Market landscape and competition
4. Legal, compliance, and ethical considerations
5. Growth strategy and go-to-market
6. Security and scalability
7. Cost and resource requirements

Each question should:
- Be specific and actionable
- Target a distinct domain of expertise
- Require contemporaneous web research (November 2025)
- Lead to concrete specification requirements

Output JSON array with this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "What are the latest authentication standards for SaaS applications in November 2025?",
      "domain": "technical",
      "priority": 9,
      "requiredExpertise": ["elon", "jony"]
    }
  ]
}`;

  const userPrompt = `Product Idea: ${userInput}

Generate ${count} research questions that will help create a comprehensive technical specification.`;

  try {
    // Use OpenRouter for multi-model support
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://specificity.ai',
        'X-Title': 'Specificity AI'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return result.questions.map((q: any, index: number) => ({
      id: q.id || `q${index + 1}`,
      question: q.question,
      domain: q.domain,
      priority: q.priority || 5,
      requiredExpertise: q.requiredExpertise || []
    }));
  } catch (error) {
    console.error('Question generation failed:', error);
    // Fallback to generic questions
    return generateFallbackQuestions(userInput);
  }
}

function generateFallbackQuestions(userInput: string): ResearchQuestion[] {
  return [
    {
      id: 'q1',
      question: `What are the core technical requirements for: ${userInput}?`,
      domain: 'technical',
      priority: 10,
      requiredExpertise: ['elon', 'jony']
    },
    {
      id: 'q2',
      question: `What are the key UX/design considerations for: ${userInput}?`,
      domain: 'design',
      priority: 9,
      requiredExpertise: ['steve', 'jony']
    },
    {
      id: 'q3',
      question: `What is the competitive landscape for: ${userInput}?`,
      domain: 'market',
      priority: 8,
      requiredExpertise: ['bartlett', 'oprah']
    },
    {
      id: 'q4',
      question: `What legal/compliance issues should be considered for: ${userInput}?`,
      domain: 'legal',
      priority: 7,
      requiredExpertise: ['amal']
    },
    {
      id: 'q5',
      question: `What are the scalability challenges for: ${userInput}?`,
      domain: 'technical',
      priority: 8,
      requiredExpertise: ['elon']
    },
    {
      id: 'q6',
      question: `What is the go-to-market strategy for: ${userInput}?`,
      domain: 'growth',
      priority: 7,
      requiredExpertise: ['bartlett', 'oprah']
    },
    {
      id: 'q7',
      question: `What are the cost and resource requirements for: ${userInput}?`,
      domain: 'market',
      priority: 6,
      requiredExpertise: ['elon', 'bartlett']
    }
  ];
}
```

#### 1.2 Intelligent Expert Assignment

```typescript
// supabase/functions/multi-agent-spec/expert-matcher.ts

export interface ExpertAssignment {
  expertId: string;
  expertName: string;
  questions: ResearchQuestion[];
  model: string; // Model selection per expert specialty
}

export function assignQuestionsToExperts(
  questions: ResearchQuestion[],
  availableExperts: AgentConfig[]
): ExpertAssignment[] {
  const assignments: Map<string, ExpertAssignment> = new Map();

  // Initialize assignments
  availableExperts.forEach(expert => {
    assignments.set(expert.id, {
      expertId: expert.id,
      expertName: expert.name,
      questions: [],
      model: selectModelForExpert(expert.id)
    });
  });

  // Assign questions based on domain and expertise match
  questions.forEach(question => {
    const scoredExperts = availableExperts.map(expert => ({
      expert,
      score: calculateExpertScore(question, expert)
    }));

    // Sort by score descending
    scoredExperts.sort((a, b) => b.score - a.score);

    // Assign to top expert (or top 2 if high priority)
    const topExperts = question.priority >= 8
      ? scoredExperts.slice(0, 2)
      : scoredExperts.slice(0, 1);

    topExperts.forEach(({ expert }) => {
      const assignment = assignments.get(expert.id);
      if (assignment) {
        assignment.questions.push(question);
      }
    });
  });

  return Array.from(assignments.values()).filter(a => a.questions.length > 0);
}

function calculateExpertScore(question: ResearchQuestion, expert: AgentConfig): number {
  let score = 0;

  // Domain match
  const domainScores: Record<string, Record<string, number>> = {
    technical: { elon: 10, jony: 8, steve: 6 },
    design: { steve: 10, jony: 10, zaha: 9 },
    market: { bartlett: 10, oprah: 8 },
    legal: { amal: 10 },
    growth: { bartlett: 10, oprah: 8 },
    security: { amal: 8, elon: 7 }
  };

  score += domainScores[question.domain]?.[expert.id] || 0;

  // Explicit expertise match
  if (question.requiredExpertise.includes(expert.id)) {
    score += 15;
  }

  // Priority weighting
  score += question.priority / 2;

  return score;
}

function selectModelForExpert(expertId: string): string {
  // Model selection based on expert specialty (Nov 2025)
  const modelMap: Record<string, string> = {
    elon: 'openai/gpt-5.1-codex', // Technical/architecture
    steve: 'anthropic/claude-sonnet-4.5', // Design/UX reasoning
    jony: 'anthropic/claude-sonnet-4.5', // Design precision
    zaha: 'anthropic/claude-sonnet-4.5', // Creative design
    bartlett: 'google/gemini-2.5-flash', // Market/growth (fast)
    oprah: 'google/gemini-2.5-flash', // Human connection (multimodal)
    amal: 'openai/gpt-5.1' // Legal reasoning (deep thinking)
  };

  return modelMap[expertId] || 'groq/llama-3.3-70b-versatile';
}
```

#### 1.3 Integration into Main Flow

```typescript
// supabase/functions/multi-agent-spec/index.ts

// Replace current discussion stage with:

async function runEnhancedRound(
  userInput: string,
  enabledAgents: AgentConfig[],
  roundNumber: number
) {
  // STEP 1: Generate dynamic questions
  const questions = await generateDynamicQuestions(userInput, {
    model: 'openai/gpt-5.1',
    count: 7,
    style: 'technical_spec_research'
  });

  // STEP 2: Assign questions to experts
  const assignments = assignQuestionsToExperts(questions, enabledAgents);

  // STEP 3: Parallel execution (see Phase 2)
  // ...

  return {
    questions,
    assignments
    // ...rest of round data
  };
}
```

### Testing
- [ ] Unit test: question generation with 10 different product ideas
- [ ] Unit test: expert assignment algorithm
- [ ] Integration test: full flow with dynamic questions
- [ ] A/B test: dynamic questions vs fixed personas (quality comparison)

### Success Criteria
- [ ] Questions are relevant to 90%+ of test cases
- [ ] Expert assignments match expected domains
- [ ] Fallback works when API fails
- [ ] Cost per question generation < $0.05

---

## PHASE 2: True Parallel Execution (Week 2)

### Objective
Replace sequential moderator-orchestrated discussion with true parallel agent execution.

### Implementation

#### 2.1 Parallel Research Executor

```typescript
// supabase/functions/multi-agent-spec/parallel-executor.ts

export interface AgentResearchResult {
  expertId: string;
  expertName: string;
  question: ResearchQuestion;
  findings: string;
  toolsUsed: string[];
  duration: number;
  model: string;
}

export async function executeParallelResearch(
  assignments: ExpertAssignment[],
  tools: ToolRegistry,
  researchContext: any
): Promise<AgentResearchResult[]> {
  console.log(`Starting parallel execution with ${assignments.length} agents...`);

  const startTime = Date.now();

  // Execute all agents simultaneously
  const results = await Promise.all(
    assignments.map(async (assignment) => {
      return executeAgentAssignment(assignment, tools, researchContext);
    })
  );

  const duration = Date.now() - startTime;
  console.log(`Parallel execution completed in ${duration}ms`);

  return results;
}

async function executeAgentAssignment(
  assignment: ExpertAssignment,
  tools: ToolRegistry,
  researchContext: any
): Promise<AgentResearchResult> {
  const startTime = Date.now();
  const toolsUsed: string[] = [];

  // Combine all assigned questions into research task
  const taskDescription = assignment.questions
    .map(q => q.question)
    .join('\n\n');

  const systemPrompt = `You are ${assignment.expertName}, a world-class expert.

Your task is to research the following questions and provide comprehensive findings:

${taskDescription}

You have access to these tools:
${tools.list().map(t => `- ${t.name}: ${t.description}`).join('\n')}

Use tools by outputting JSON:
{
  "tool": "tool_name",
  "params": { "key": "value" }
}

When you have completed your research, output:
{
  "complete": true,
  "findings": "Your comprehensive findings..."
}

Remember:
- Focus on November 2025 bleeding-edge technology
- Verify all recommendations with web searches
- Prioritize practical, actionable insights
- Consider your unique perspective as ${assignment.expertName}`;

  let context = researchContext;
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const response = await callLLM({
      model: assignment.model,
      system: systemPrompt,
      user: context,
      temperature: 0.7,
      maxTokens: 1500
    });

    // Check if task complete
    if (response.includes('"complete": true')) {
      const result = JSON.parse(response);
      return {
        expertId: assignment.expertId,
        expertName: assignment.expertName,
        question: assignment.questions[0], // Primary question
        findings: result.findings,
        toolsUsed,
        duration: Date.now() - startTime,
        model: assignment.model
      };
    }

    // Check if tool call
    if (response.includes('"tool":')) {
      const toolCall = JSON.parse(response);
      const tool = tools.get(toolCall.tool);

      if (tool) {
        toolsUsed.push(toolCall.tool);
        const toolResult = await tool.execute(toolCall.params);
        context += `\n\nTool Result (${toolCall.tool}):\n${JSON.stringify(toolResult, null, 2)}`;
      }
    }
  }

  // Max iterations reached - return current context
  return {
    expertId: assignment.expertId,
    expertName: assignment.expertName,
    question: assignment.questions[0],
    findings: context,
    toolsUsed,
    duration: Date.now() - startTime,
    model: assignment.model
  };
}

async function callLLM(params: {
  model: string;
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user }
      ],
      temperature: params.temperature,
      max_tokens: params.maxTokens
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

#### 2.2 Update Main Orchestrator

```typescript
// supabase/functions/multi-agent-spec/index.ts

async function runEnhancedRound(
  userInput: string,
  enabledAgents: AgentConfig[],
  roundNumber: number,
  tools: ToolRegistry
) {
  // STEP 1: Generate dynamic questions
  const questions = await generateDynamicQuestions(userInput);

  // STEP 2: Assign questions to experts
  const assignments = assignQuestionsToExperts(questions, enabledAgents);

  // STEP 3: TRUE PARALLEL EXECUTION (NEW)
  const researchResults = await executeParallelResearch(
    assignments,
    tools,
    { userInput, roundNumber }
  );

  // STEP 4: Keep existing synthesis + voting
  const syntheses = await synthesizeFindings(researchResults);
  const votes = await conductVoting(syntheses);

  return {
    questions,
    assignments,
    researchResults,
    syntheses,
    votes,
    approvalRate: calculateApprovalRate(votes)
  };
}
```

### Performance Testing

```typescript
// Test parallel vs sequential performance
async function benchmarkExecution() {
  const testInput = "AI-powered SaaS for content generation";

  // Sequential (current)
  const sequentialStart = Date.now();
  await runSequentialDiscussion(testInput);
  const sequentialTime = Date.now() - sequentialStart;

  // Parallel (new)
  const parallelStart = Date.now();
  await runEnhancedRound(testInput, enabledAgents, 1, tools);
  const parallelTime = Date.now() - parallelStart;

  console.log({
    sequential: `${sequentialTime}ms`,
    parallel: `${parallelTime}ms`,
    improvement: `${((sequentialTime / parallelTime) * 100).toFixed(0)}%`
  });
}
```

### Testing
- [ ] Load test: 10 concurrent spec generations
- [ ] Performance test: Sequential vs parallel benchmarking
- [ ] Error handling: 1 agent fails, others continue
- [ ] Timeout handling: Agent exceeds max iterations

### Success Criteria
- [ ] 4x faster than sequential execution
- [ ] All agents complete successfully 95%+ of time
- [ ] Graceful degradation if 1 agent fails
- [ ] Cost increase < 2x (parallel is more efficient)

---

## PHASE 3: Hot-Swappable Tool System (Week 3)

### Objective
Create extensible tool ecosystem that agents can use autonomously.

### Implementation

#### 3.1 Tool Interface

```typescript
// supabase/functions/tools/base-tool.ts

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    duration: number;
    cost: number;
    source: string;
  };
}

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: ToolParameter[];

  abstract execute(params: Record<string, any>): Promise<ToolResult>;

  validate(params: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    this.parameters.forEach(param => {
      if (param.required && !(param.name in params)) {
        errors.push(`Missing required parameter: ${param.name}`);
      }

      if (param.name in params) {
        const value = params[param.name];
        const expectedType = typeof value;

        if (param.type === 'object' && typeof value !== 'object') {
          errors.push(`Parameter ${param.name} must be an object`);
        } else if (param.type !== 'object' && expectedType !== param.type) {
          errors.push(`Parameter ${param.name} must be ${param.type}, got ${expectedType}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

#### 3.2 Web Search Tool

```typescript
// supabase/functions/tools/web-search-tool.ts

import { BaseTool, ToolParameter, ToolResult } from './base-tool.ts';

export class WebSearchTool extends BaseTool {
  name = 'web_search';
  description = 'Search the web for latest information (November 2025). Always use for verifying technology recommendations.';

  parameters: ToolParameter[] = [
    {
      name: 'query',
      type: 'string',
      description: 'Search query',
      required: true
    },
    {
      name: 'focus',
      type: 'string',
      description: 'Focus area: latest, pricing, technical, market',
      required: false,
      default: 'latest'
    },
    {
      name: 'numResults',
      type: 'number',
      description: 'Number of results to return (1-20)',
      required: false,
      default: 8
    }
  ];

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const validation = this.validate(params);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    const { query, focus = 'latest', numResults = 8 } = params;
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('EXA_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          type: 'neural',
          useAutoprompt: true,
          numResults,
          // CRITICAL: Filter to recent content only (Nov 2025)
          startPublishedDate: '2025-11-01'
        })
      });

      const data = await response.json();

      return {
        success: true,
        data: {
          results: data.results.map((r: any) => ({
            title: r.title,
            url: r.url,
            snippet: r.text || r.snippet,
            publishedDate: r.publishedDate,
            score: r.score
          })),
          query,
          focus
        },
        metadata: {
          duration: Date.now() - startTime,
          cost: 0.01, // Approximate cost
          source: 'exa'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

#### 3.3 Competitor Analysis Tool

```typescript
// supabase/functions/tools/competitor-analysis-tool.ts

import { BaseTool, ToolParameter, ToolResult } from './base-tool.ts';

export class CompetitorAnalysisTool extends BaseTool {
  name = 'competitor_analysis';
  description = 'Analyze competitors for a given product category';

  parameters: ToolParameter[] = [
    {
      name: 'category',
      type: 'string',
      description: 'Product category (e.g., "AI content generation")',
      required: true
    },
    {
      name: 'aspects',
      type: 'string',
      description: 'What to analyze: pricing, features, technology, market_share',
      required: false,
      default: 'features'
    }
  ];

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { category, aspects = 'features' } = params;
    const startTime = Date.now();

    try {
      // Search for competitors
      const searchQuery = `${category} competitors ${aspects} November 2025`;
      const webSearch = new WebSearchTool();
      const searchResult = await webSearch.execute({
        query: searchQuery,
        numResults: 10
      });

      if (!searchResult.success) {
        return searchResult;
      }

      // Analyze results
      const competitors = searchResult.data.results.map((r: any) => ({
        name: this.extractCompanyName(r.title),
        url: r.url,
        insights: r.snippet
      }));

      return {
        success: true,
        data: {
          category,
          aspects,
          competitors: competitors.slice(0, 5), // Top 5
          totalFound: competitors.length
        },
        metadata: {
          duration: Date.now() - startTime,
          cost: 0.02,
          source: 'web_search + analysis'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private extractCompanyName(title: string): string {
    // Simple extraction - could be enhanced with NLP
    return title.split('-')[0].trim();
  }
}
```

#### 3.4 GitHub Search Tool

```typescript
// supabase/functions/tools/github-search-tool.ts

import { BaseTool, ToolParameter, ToolResult } from './base-tool.ts';

export class GitHubSearchTool extends BaseTool {
  name = 'github_search';
  description = 'Search GitHub for relevant open-source projects and libraries';

  parameters: ToolParameter[] = [
    {
      name: 'query',
      type: 'string',
      description: 'Search query (e.g., "React authentication library")',
      required: true
    },
    {
      name: 'language',
      type: 'string',
      description: 'Programming language filter',
      required: false
    },
    {
      name: 'sort',
      type: 'string',
      description: 'Sort by: stars, updated, created',
      required: false,
      default: 'stars'
    }
  ];

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { query, language, sort = 'stars' } = params;
    const startTime = Date.now();

    try {
      let searchQuery = query;
      if (language) {
        searchQuery += ` language:${language}`;
      }

      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=${sort}&per_page=10`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Specificity-AI'
          }
        }
      );

      const data = await response.json();

      const repositories = data.items.map((repo: any) => ({
        name: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        url: repo.html_url,
        language: repo.language,
        lastUpdated: repo.updated_at,
        topics: repo.topics
      }));

      return {
        success: true,
        data: {
          repositories,
          totalCount: data.total_count
        },
        metadata: {
          duration: Date.now() - startTime,
          cost: 0,
          source: 'github_api'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

#### 3.5 Tool Registry

```typescript
// supabase/functions/tools/registry.ts

import { BaseTool } from './base-tool.ts';
import { WebSearchTool } from './web-search-tool.ts';
import { CompetitorAnalysisTool } from './competitor-analysis-tool.ts';
import { GitHubSearchTool } from './github-search-tool.ts';
import { NPMSearchTool } from './npm-search-tool.ts';
import { MarketDataTool } from './market-data-tool.ts';

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    this.register(new WebSearchTool());
    this.register(new CompetitorAnalysisTool());
    this.register(new GitHubSearchTool());
    this.register(new NPMSearchTool());
    this.register(new MarketDataTool());
  }

  register(tool: BaseTool) {
    this.tools.set(tool.name, tool);
    console.log(`Tool registered: ${tool.name}`);
  }

  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  list(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  getDescription(): string {
    return this.list()
      .map(tool => `${tool.name}: ${tool.description}`)
      .join('\n');
  }
}
```

### Testing
- [ ] Unit test: Each tool with valid/invalid params
- [ ] Integration test: Agent using multiple tools
- [ ] Load test: 100 concurrent tool calls
- [ ] Error handling: Tool failures don't crash agent

### Success Criteria
- [ ] All 5 core tools working
- [ ] Tool auto-discovery successful
- [ ] Average tool call < 2 seconds
- [ ] Tool failure rate < 5%

---

## PHASE 4: Multi-Model Strategy (Week 4)

### Objective
Use the best model for each stage of spec generation.

### Implementation

#### 4.1 Model Configuration

```typescript
// supabase/functions/multi-agent-spec/model-config.ts

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'xai' | 'groq';
  model: string;
  costPer1MTokensInput: number;
  costPer1MTokensOutput: number;
  strengths: string[];
  contextWindow: number;
  speed: 'fast' | 'medium' | 'slow';
}

export const MODELS: Record<string, ModelConfig> = {
  'gpt-5.1': {
    provider: 'openai',
    model: 'gpt-5.1',
    costPer1MTokensInput: 10,
    costPer1MTokensOutput: 30,
    strengths: ['reasoning', 'meta-cognition', 'math'],
    contextWindow: 128000,
    speed: 'medium'
  },
  'gpt-5.1-codex': {
    provider: 'openai',
    model: 'gpt-5.1-codex',
    costPer1MTokensInput: 10,
    costPer1MTokensOutput: 30,
    strengths: ['coding', 'architecture', 'technical_writing'],
    contextWindow: 128000,
    speed: 'medium'
  },
  'claude-sonnet-4.5': {
    provider: 'anthropic',
    model: 'claude-sonnet-4.5',
    costPer1MTokensInput: 3,
    costPer1MTokensOutput: 15,
    strengths: ['coding', 'reasoning', 'nuance'],
    contextWindow: 200000,
    speed: 'medium'
  },
  'gemini-2.5-flash': {
    provider: 'google',
    model: 'gemini-2.5-flash',
    costPer1MTokensInput: 0.075,
    costPer1MTokensOutput: 0.30,
    strengths: ['speed', 'multimodal', 'long_context'],
    contextWindow: 1000000,
    speed: 'fast'
  },
  'grok-4-heavy': {
    provider: 'xai',
    model: 'grok-4-heavy',
    costPer1MTokensInput: 100, // Approximation for $300/mo subscription
    costPer1MTokensOutput: 100,
    strengths: ['multi_agent_synthesis', 'reasoning'],
    contextWindow: 128000,
    speed: 'slow'
  },
  'llama-3.3-70b': {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    costPer1MTokensInput: 0.10,
    costPer1MTokensOutput: 0.30,
    strengths: ['speed', 'cost'],
    contextWindow: 8192,
    speed: 'fast'
  }
};

export const STAGE_MODEL_SELECTION = {
  questionGeneration: 'gpt-5.1',
  technicalResearch: 'gpt-5.1-codex',
  designResearch: 'claude-sonnet-4.5',
  marketResearch: 'gemini-2.5-flash',
  legalResearch: 'gpt-5.1',
  synthesis: 'grok-4-heavy', // Fallback to gpt-5.1 if unavailable
  specGeneration: {
    architecture: 'gpt-5.1-codex',
    design: 'claude-sonnet-4.5',
    market: 'gemini-2.5-flash',
    final: 'gpt-5.1'
  }
};
```

#### 4.2 Unified LLM Caller with OpenRouter

```typescript
// supabase/functions/multi-agent-spec/llm-caller.ts

export async function callLLM(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}): Promise<{ content: string; usage: any; cost: number }> {
  const modelConfig = MODELS[params.model];

  if (!modelConfig) {
    throw new Error(`Unknown model: ${params.model}`);
  }

  // Use OpenRouter for unified access
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://specificity.ai',
      'X-Title': 'Specificity AI'
    },
    body: JSON.stringify({
      model: `${modelConfig.provider}/${params.model}`,
      messages: params.messages,
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 2000,
      response_format: params.responseFormat === 'json'
        ? { type: 'json_object' }
        : undefined
    })
  });

  const data = await response.json();

  // Calculate cost
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = (
    (inputTokens / 1_000_000) * modelConfig.costPer1MTokensInput +
    (outputTokens / 1_000_000) * modelConfig.costPer1MTokensOutput
  );

  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    cost
  };
}
```

#### 4.3 Cost Monitoring

```typescript
// Add to database schema
CREATE TABLE spec_generation_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  spec_id uuid,
  stage text,
  model text,
  input_tokens integer,
  output_tokens integer,
  cost numeric(10, 4),
  created_at timestamptz DEFAULT now()
);

// Log costs
export async function logCost(
  userId: string,
  specId: string,
  stage: string,
  model: string,
  usage: any,
  cost: number
) {
  await supabaseClient
    .from('spec_generation_costs')
    .insert({
      user_id: userId,
      spec_id: specId,
      stage,
      model,
      input_tokens: usage.prompt_tokens,
      output_tokens: usage.completion_tokens,
      cost
    });
}
```

### Testing
- [ ] Test each model individually
- [ ] Compare output quality across models
- [ ] Verify cost calculations
- [ ] Test fallback when premium models unavailable

### Success Criteria
- [ ] All models accessible via OpenRouter
- [ ] Cost tracking accurate to $0.01
- [ ] Quality improvement measurable (user ratings)
- [ ] Average cost per spec < $1.00

---

## PHASE 5: Production Hardening (Week 5)

### Objective
Ensure system is production-ready with enhanced capabilities.

### Implementation

#### 5.1 Enhanced Rate Limiting

```sql
-- Update rate limit table for higher API usage
CREATE TABLE rate_limit_tiers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  tier text NOT NULL DEFAULT 'free',
  max_specs_per_hour integer NOT NULL DEFAULT 5,
  max_tool_calls_per_spec integer NOT NULL DEFAULT 50,
  max_cost_per_spec numeric(10, 2) NOT NULL DEFAULT 1.00,
  created_at timestamptz DEFAULT now()
);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_enhanced_rate_limit(
  p_user_id uuid,
  p_resource_type text,
  p_estimated_cost numeric DEFAULT 0
)
RETURNS jsonb AS $$
DECLARE
  v_tier record;
  v_current_usage integer;
  v_current_cost numeric;
BEGIN
  -- Get user tier
  SELECT * INTO v_tier
  FROM rate_limit_tiers
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- Create default tier
    INSERT INTO rate_limit_tiers (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_tier;
  END IF;

  -- Check specs per hour
  IF p_resource_type = 'spec_generation' THEN
    SELECT COUNT(*) INTO v_current_usage
    FROM spec_generation_costs
    WHERE user_id = p_user_id
      AND created_at > now() - interval '1 hour';

    IF v_current_usage >= v_tier.max_specs_per_hour THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'specs_per_hour_exceeded',
        'limit', v_tier.max_specs_per_hour,
        'current', v_current_usage
      );
    END IF;
  END IF;

  -- Check cost limit
  IF p_estimated_cost > v_tier.max_cost_per_spec THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'cost_limit_exceeded',
      'limit', v_tier.max_cost_per_spec,
      'estimated', p_estimated_cost
    );
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$ LANGUAGE plpgsql;
```

#### 5.2 Error Handling & Retries

```typescript
// supabase/functions/multi-agent-spec/resilience.ts

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );

      if (onRetry) {
        onRetry(error, attempt + 1);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Usage
const result = await retryWithExponentialBackoff(
  () => callLLM({ model: 'gpt-5.1', messages: [...] }),
  {
    maxRetries: 3,
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt} after error:`, error.message);
    }
  }
);
```

#### 5.3 Monitoring Dashboard

```typescript
// Add to Index.tsx - Admin panel for monitoring

export function MonitoringDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const { data } = await supabase
      .from('spec_generation_costs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const totalCost = data.reduce((sum, row) => sum + row.cost, 0);
    const avgCost = totalCost / data.length;
    const modelUsage = data.reduce((acc, row) => {
      acc[row.model] = (acc[row.model] || 0) + 1;
      return acc;
    }, {});

    setStats({
      totalSpecs: data.length,
      totalCost: totalCost.toFixed(2),
      avgCost: avgCost.toFixed(2),
      modelUsage
    });
  }

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Last 24 Hours</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">Total Specs</p>
          <p className="text-3xl font-bold">{stats.totalSpecs}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Cost</p>
          <p className="text-3xl font-bold">${stats.totalCost}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Avg Cost</p>
          <p className="text-3xl font-bold">${stats.avgCost}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold mt-6 mb-2">Model Usage</h3>
      <ul>
        {Object.entries(stats.modelUsage).map(([model, count]) => (
          <li key={model}>
            {model}: {count}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Testing
- [ ] Load test: 100 concurrent users
- [ ] Chaos test: Random API failures
- [ ] Cost test: Verify budgets enforced
- [ ] Monitoring: Verify all metrics tracked

### Success Criteria
- [ ] 99.9% uptime under load
- [ ] Graceful degradation on failures
- [ ] Cost overruns prevented
- [ ] All metrics visible in dashboard

---

## SUCCESS METRICS

### Performance
- [ ] Average spec generation time: < 30 seconds (from 120s)
- [ ] Research depth: 20+ tool calls per spec (from 5 queries)
- [ ] System uptime: 99.9%
- [ ] Error rate: < 1%

### Quality
- [ ] User satisfaction: 4.5+ stars (from qualitative feedback)
- [ ] Spec completeness: 95%+ (validation checklist)
- [ ] Technology currency: 100% bleeding-edge (verified by verification agent)

### Cost
- [ ] Average cost per spec: $0.50 - $1.00
- [ ] User pricing: $25 (still 93% cheaper than $300+ freelancer)
- [ ] Cost overruns: 0 incidents

---

## ROLLOUT PLAN

### Week 1-2: Alpha Testing
- Internal testing with 10 product ideas
- Invite 5 trusted users for feedback
- Fix critical bugs

### Week 3: Beta Launch
- Limited beta: 50 users
- Monitor costs and performance
- Gather qualitative feedback

### Week 4: Public Launch
- Full public availability
- Marketing push
- Support system ready

### Week 5: Optimization
- Analyze usage patterns
- Cost optimization
- Feature requests prioritization

---

## RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| OpenRouter downtime | Medium | High | Fallback to Groq for all stages |
| Cost explosion | Low | High | Per-user cost limits + monitoring |
| Quality regression | Medium | High | A/B testing + user feedback loops |
| Tool failures | High | Medium | Graceful degradation + retries |
| Rate limiting from providers | Low | Medium | Multiple API keys + rotation |

---

## NEXT STEPS

1. **Review this roadmap** with stakeholders
2. **Set up OpenRouter account** and get API key
3. **Create development branch**: `feature/hybrid-architecture`
4. **Start Phase 1**: Dynamic question generation
5. **Weekly check-ins** to review progress

**Questions?** See ARCHITECTURE_COMPARISON.md for detailed analysis.
