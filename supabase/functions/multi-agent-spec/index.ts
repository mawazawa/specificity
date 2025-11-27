/**
 * Enhanced Multi-Agent Specification Generator
 * Hybrid architecture combining Make It Heavy's orchestration with Specificity's expertise
 *
 * Features:
 * - Dynamic question generation (GPT-5.1)
 * - Intelligent expert assignment
 * - True parallel execution
 * - Hot-swappable tool system (5 core tools)
 * - Multi-model support via OpenRouter
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

// Import new architecture modules
import { ToolRegistry } from '../tools/registry.ts';
import { generateDynamicQuestions } from '../lib/question-generator.ts';
import { assignQuestionsToExperts, balanceWorkload, AgentConfig } from '../lib/expert-matcher.ts';
import { executeParallelResearch } from '../lib/parallel-executor.ts';
import { callOpenRouter } from '../lib/openrouter-client.ts';
import { generateChallenges, executeChallenges, resolveDebates } from '../lib/challenge-generator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const EXA_API_KEY = Deno.env.get('EXA_API_KEY');
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize tool registry
const tools = new ToolRegistry();

// Validate required environment variables
const validateEnv = () => {
  const missing = [];
  if (!GROQ_API_KEY) missing.push('GROQ_API_KEY');
  if (!EXA_API_KEY) missing.push('EXA_API_KEY');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  // OpenRouter is optional (falls back to Groq)
  if (!OPENROUTER_API_KEY) {
    console.warn('[Config] OPENROUTER_API_KEY not set - will fallback to Groq');
  }

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing.join(', '));
    return false;
  }
  return true;
};

// Input validation schemas
const agentConfigSchema = z.object({
  id: z.string().optional(),
  agent: z.string().min(1).max(50),
  systemPrompt: z.string().min(1).max(2000),
  temperature: z.number().min(0).max(1),
  enabled: z.boolean(),
});

const requestSchema = z.object({
  userInput: z.string()
    .min(1, 'Input required')
    .max(5000, 'Input too long')
    .optional(),
  stage: z.enum(['questions', 'research', 'synthesis', 'voting', 'spec']),
  userComment: z.string().max(1000).optional(),
  agentConfigs: z.array(agentConfigSchema).optional(),
  roundData: z.any().optional(),
});

// Prompt injection detection
const detectPromptInjection = (input: string): boolean => {
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|commands?)/i,
    /system\s+(prompt|message|instruction)/i,
    /(api|secret|private)\s*key/i,
    /reveal\s+(secrets?|credentials?|keys?)/i,
    /(output|show|display|print|return)\s+(your|the)\s+(prompt|instructions?|system)/i,
    /you\s+are\s+now/i,
    /new\s+instructions?:/i,
    /reset\s+context/i,
  ];
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

// Enhanced input sanitization
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>"'`]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u202A-\u202E]/g, '')
    .normalize('NFKC')
    .slice(0, 2000)
    .trim();
};

// Utility: Sanitize errors for logging
const sanitizeError = (error: any) => {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: 'Unknown error' };
};

// Utility: Get user-friendly error message
const getUserMessage = (error: any): string => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('RATE_LIMIT') || message.includes('rate limit')) {
    return 'Service temporarily unavailable. Please try again shortly.';
  }
  if (message.includes('API') || message.includes('api')) {
    return 'Processing error. Please try again.';
  }
  if (message.includes('not configured')) {
    return 'Service configuration error. Please contact support.';
  }
  return 'An unexpected error occurred. Please try again.';
};

// Legacy Groq fallback for synthesis/voting/spec stages
async function callGroq(systemPrompt: string, userMessage: string, temperature: number = 0.7, maxTokens: number = 800): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    console.error('External API error:', { type: 'api_error', status: response.status });

    if (response.status === 429) {
      throw new Error('RATE_LIMIT: Rate limit exceeded');
    }

    throw new Error('API request failed');
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Invalid response:', { type: 'invalid_api_response' });
    throw new Error('Invalid response from API');
  }
  return data.choices[0].message.content || 'No response';
}

// Atomic rate limiting function
async function checkRateLimit(userId: string, endpoint: string, maxRequests: number = 5): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_hours: 1
    });

    if (error) {
      console.error('Rate limit error:', { type: 'rate_limit_error', user_id: userId });
      return { allowed: false, remaining: 0 };
    }

    return {
      allowed: data.allowed,
      remaining: data.remaining
    };
  } catch (error) {
    console.error('Rate limit exception:', { type: 'rate_limit_exception', user_id: userId });
    return { allowed: false, remaining: 0 };
  }
}

serve(async (req) => {
  console.log('[EdgeFunction] Request received:', { method: req.method, url: req.url });

  if (req.method === 'OPTIONS') {
    console.log('[EdgeFunction] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check environment variables
    console.log('[EdgeFunction] Validating environment variables...');
    if (!validateEnv()) {
      console.error('[EdgeFunction] Configuration error: Missing environment variables');
      return new Response(
        JSON.stringify({
          error: 'Service configuration error. Please contact support.',
          code: 'CONFIG_ERROR',
          details: 'Required environment variables are not set'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[EdgeFunction] Environment variables validated successfully');

    // Verify authentication
    console.log('[EdgeFunction] Verifying authentication...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[EdgeFunction] No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[EdgeFunction] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication', code: 'AUTH_INVALID' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EdgeFunction] User authenticated:', user.id);

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, 'multi-agent-spec', 5);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. You can generate up to 5 specifications per hour. Please try again later.',
          retryAfter: 3600
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString()
          }
        }
      );
    }

    // Parse and validate request
    const rawBody = await req.json();

    let validated;
    try {
      validated = requestSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation failed:', { type: 'validation_error', user_id: user.id });
        return new Response(
          JSON.stringify({ error: 'Invalid request format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    const { userInput, stage, agentConfigs, roundData, userComment } = validated;

    console.log('[EdgeFunction] Request validated:', { stage, hasUserInput: !!userInput, hasAgentConfigs: !!agentConfigs });

    // Check for prompt injection
    if (userInput && detectPromptInjection(userInput)) {
      console.warn('Security event:', { type: 'injection_detected', field: 'userInput', user_id: user.id });
      return new Response(
        JSON.stringify({ error: 'Please rephrase your request.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userComment && detectPromptInjection(userComment)) {
      console.warn('Security event:', { type: 'injection_detected', field: 'userComment', user_id: user.id });
      return new Response(
        JSON.stringify({ error: 'Please rephrase your comment.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (agentConfigs) {
      for (const config of agentConfigs) {
        if (config.systemPrompt && detectPromptInjection(config.systemPrompt)) {
          console.warn('Security event:', { type: 'injection_detected', field: 'systemPrompt', user_id: user.id });
          return new Response(
            JSON.stringify({ error: 'Invalid agent configuration detected.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Sanitize inputs
    const cleanInput = userInput ? sanitizeInput(userInput) : '';
    const cleanComment = userComment ? sanitizeInput(userComment) : undefined;

    console.log('[Enhanced] Processing:', { stage, userId: user.id });

    // ========================================
    // STAGE 1: DYNAMIC QUESTION GENERATION
    // ========================================
    if (stage === 'questions') {
      console.log('[Enhanced] Generating dynamic research questions...');

      const questions = await generateDynamicQuestions(cleanInput, {
        model: 'gpt-5.1',
        count: 7
      });

      console.log(`[Enhanced] Generated ${questions.length} questions`);

      return new Response(
        JSON.stringify({ questions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // STAGE 2: PARALLEL RESEARCH WITH TOOLS
    // ========================================
    if (stage === 'research') {
      console.log('[Enhanced] Starting parallel research with tools...');

      if (!agentConfigs) {
        return new Response(
          JSON.stringify({ error: 'Agent configurations required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const questions = roundData?.questions || [];
      if (questions.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No questions provided for research' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add IDs to agent configs
      const configsWithIds: AgentConfig[] = agentConfigs.map((config, idx) => ({
        id: config.id || config.agent.toLowerCase().replace(/\s+/g, '_'),
        agent: config.agent,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        enabled: config.enabled
      }));

      // Assign questions to experts
      const assignments = assignQuestionsToExperts(questions, configsWithIds);
      const balancedAssignments = balanceWorkload(assignments);

      console.log(`[Enhanced] Assigned questions to ${balancedAssignments.length} experts`);

      // Execute parallel research
      const researchResults = await executeParallelResearch(
        balancedAssignments,
        tools,
        {
          userInput: cleanInput,
          roundNumber: roundData?.roundNumber || 1
        }
      );

      // Calculate total cost and tokens
      const totalCost = researchResults.reduce((sum, r) => sum + r.cost, 0);
      const totalTokens = researchResults.reduce((sum, r) => sum + r.tokensUsed, 0);
      const totalTools = researchResults.reduce((sum, r) => sum + r.toolsUsed.length, 0);

      console.log(`[Enhanced] Research complete - Cost: $${totalCost.toFixed(4)}, Tokens: ${totalTokens}, Tools: ${totalTools}`);

      return new Response(
        JSON.stringify({
          researchResults,
          assignments: balancedAssignments,
          metadata: {
            totalCost,
            totalTokens,
            totalToolsUsed: totalTools,
            duration: Math.max(...researchResults.map(r => r.duration))
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // STAGE 2.5: CHALLENGE/DEBATE (RAY DALIO STYLE)
    // ========================================
    if (stage === 'challenge') {
      console.log('[Ray Dalio] Generating contrarian challenges for productive conflict...');

      const researchResults = roundData?.researchResults || [];

      if (researchResults.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No research results to challenge' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate challenge questions that stress-test the research
      const challenges = await generateChallenges(
        researchResults,
        cleanInput,
        {
          model: 'gpt-5.1',
          challengesPerFinding: 2 // 2 challenges per research finding
        }
      );

      console.log(`[Ray Dalio] Generated ${challenges.length} challenge questions`);

      // Execute challenges in parallel - have experts argue contrarian positions
      if (!agentConfigs) {
        return new Response(
          JSON.stringify({ error: 'Agent configurations required for challenges' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const configsWithIds: AgentConfig[] = agentConfigs.map((config) => ({
        id: config.id || config.agent.toLowerCase().replace(/\s+/g, '_'),
        agent: config.agent,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        enabled: config.enabled
      }));

      const challengeResponses = await executeChallenges(
        challenges,
        researchResults,
        configsWithIds
      );

      console.log(`[Ray Dalio] Received ${challengeResponses.length} contrarian challenges`);

      // Resolve debates - synthesize original + challenges into stronger positions
      const debateResolutions = await resolveDebates(
        researchResults,
        challengeResponses,
        { model: 'claude-sonnet-4.5' } // Claude excels at synthesis
      );

      console.log(`[Ray Dalio] Resolved ${debateResolutions.length} debates`);

      // Calculate challenge costs
      const totalChallengeCost = challengeResponses.reduce((sum, c) => sum + c.cost, 0);
      const avgRiskScore = challengeResponses.reduce((sum, c) => sum + c.riskScore, 0) / challengeResponses.length;

      return new Response(
        JSON.stringify({
          challenges,
          challengeResponses,
          debateResolutions,
          metadata: {
            totalChallenges: challenges.length,
            totalResponses: challengeResponses.length,
            avgRiskScore: avgRiskScore.toFixed(1),
            challengeCost: totalChallengeCost,
            debatesResolved: debateResolutions.length,
            productiveConflict: true
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // STAGE 3: SYNTHESIS (ENHANCED)
    // ========================================
    if (stage === 'synthesis') {
      console.log('[Enhanced] Synthesizing research findings...');

      const researchResults = roundData?.researchResults || [];
      const debateResolutions = roundData?.debateResolutions || [];

      if (researchResults.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No research results to synthesize' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Each expert synthesizes their findings (now incorporating debate outcomes)
      const synthesisPromises = researchResults.map(async (result: any, idx: number) => {
        const toolsContext = result.toolsUsed.length > 0
          ? `\n\nTools used: ${result.toolsUsed.map((t: any) => t.tool).join(', ')}`
          : '';

        const userGuidance = cleanComment ? `\nUser guidance: ${cleanComment}` : '';

        // Include debate resolution if available (battle-tested position)
        const debateResolution = debateResolutions[idx];
        const debateContext = debateResolution ?
          `\n\n**DEBATE-TESTED POSITION** (Ray Dalio productive conflict):\n${debateResolution.resolution}\n\nChallenges addressed: ${debateResolution.challenges.join('; ')}\nConfidence change: ${debateResolution.confidenceChange > 0 ? '+' : ''}${debateResolution.confidenceChange}%\nAdopted alternatives: ${debateResolution.adoptedAlternatives.join(', ') || 'None'}` : '';

        const prompt = `Your research findings:
${result.findings}${toolsContext}${debateContext}${userGuidance}

${debateResolution ? 'Your position has been battle-tested through contrarian challenges. ' : ''}Synthesize your final recommendations:
1. What are the 3 most critical requirements?
2. What specific technologies/approaches should be used? (November 2025 bleeding-edge)
3. What are the key risks or challenges?

Be specific, actionable, and cite sources when relevant.`;

        const response = await callGroq(
          `You are ${result.expertName}, a world-class expert. Provide your synthesis.`,
          prompt,
          0.7,
          800
        );

        return {
          expertId: result.expertId,
          expertName: result.expertName,
          synthesis: response,
          timestamp: new Date().toISOString(),
          researchQuality: {
            toolsUsed: result.toolsUsed.length,
            cost: result.cost,
            duration: result.duration,
            battleTested: !!debateResolution,
            confidenceBoost: debateResolution?.confidenceChange || 0
          }
        };
      });

      const syntheses = await Promise.all(synthesisPromises);

      const battleTestedCount = syntheses.filter(s => s.researchQuality.battleTested).length;
      console.log(`[Enhanced] Synthesized ${syntheses.length} expert recommendations (${battleTestedCount} battle-tested)`);

      return new Response(
        JSON.stringify({
          syntheses,
          metadata: {
            totalSyntheses: syntheses.length,
            battleTested: battleTestedCount,
            productiveConflict: battleTestedCount > 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // STAGE 4: VOTING (UNCHANGED)
    // ========================================
    if (stage === 'voting') {
      console.log('[Enhanced] Collecting consensus votes...');

      if (!agentConfigs) {
        return new Response(
          JSON.stringify({ error: 'Agent configurations required for voting stage' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const activeAgents = agentConfigs.filter((c: any) => c.enabled);
      const syntheses = roundData.syntheses || [];

      const votePromises = activeAgents.map(async (config: any) => {
        const synthesesSummary = syntheses.map((s: any) =>
          `${s.expertName}: ${s.synthesis.slice(0, 300)}...`
        ).join('\n\n');

        const votePrompt = `Expert syntheses:
${synthesesSummary}

Based on the research depth and consensus level, vote YES (proceed to spec) or NO (needs another round).
Return JSON: {"approved": true/false, "confidence": 0-100, "reasoning": "why", "keyRequirements": ["req1", "req2"]}`;

        const response = await callGroq(config.systemPrompt, votePrompt, config.temperature, 300);

        try {
          const vote = JSON.parse(response);
          return {
            agent: config.agent,
            approved: vote.approved ?? true,
            confidence: vote.confidence ?? 75,
            reasoning: vote.reasoning || response,
            keyRequirements: vote.keyRequirements || [],
            timestamp: new Date().toISOString()
          };
        } catch {
          const approved = response.toLowerCase().includes('yes') ||
                          response.toLowerCase().includes('approve');
          return {
            agent: config.agent,
            approved,
            confidence: approved ? 70 : 30,
            reasoning: response,
            keyRequirements: [],
            timestamp: new Date().toISOString()
          };
        }
      });

      const votes = await Promise.all(votePromises);

      return new Response(
        JSON.stringify({ votes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // STAGE 5: SPEC GENERATION (ENHANCED)
    // ========================================
    if (stage === 'spec') {
      console.log('[Enhanced] Generating final specification...');

      const syntheses = roundData.syntheses || [];
      const votes = roundData.votes || [];
      const researchResults = roundData.researchResults || [];

      // Calculate research quality scores
      const avgToolsUsed = researchResults.reduce((sum: number, r: any) =>
        sum + (r.toolsUsed?.length || 0), 0) / researchResults.length;

      const weightedContext = syntheses.map((s: any) => {
        const quality = s.researchQuality || {};
        const researchDepth = (quality.toolsUsed || 0) / Math.max(avgToolsUsed, 1);
        const weight = Math.min(researchDepth * 100, 100);
        return `${s.expertName} (research depth: ${weight.toFixed(0)}%):\n${s.synthesis}`;
      }).join('\n\n');

      const keyRequirements = votes.flatMap((v: any) => v.keyRequirements || []);

      // Include debate resolutions if available
      const debateContext = roundData.debateResolutions ?
        `\n\nDEBATE RESOLUTIONS (battle-tested through Ray Dalio-style challenges):\n${
          roundData.debateResolutions.map((d: any) =>
            `Resolution: ${d.resolution}\nAdopted Alternatives: ${d.adoptedAlternatives.join(', ')}\nConfidence Change: ${d.confidenceChange > 0 ? '+' : ''}${d.confidenceChange}%`
          ).join('\n\n')
        }` : '';

      const specPrompt = `Based on deep expert research with contemporaneous web verification and battle-tested through contrarian challenges, create an EXTRAORDINARILY DETAILED technical specification.

This spec must be so comprehensive that an AI agent (like Claude Code) could implement the ENTIRE application from start to finish in a single session without additional clarification.

EXPERT SYNTHESES (with research depth scores):
${weightedContext}

KEY REQUIREMENTS (from consensus voting):
${keyRequirements.join('\n')}${debateContext}

Generate a 15-20 PAGE production-ready specification with EXTREME implementation detail:

# 1. Executive Summary
- Product vision and value proposition
- Target market and user personas
- Key differentiators from competitors
- Success criteria (quantifiable)

# 2. Core Requirements
- Functional requirements (user stories with acceptance criteria)
- Non-functional requirements (performance, security, scalability)
- Must-have vs nice-to-have (prioritized by consensus)
- Constraints and assumptions

# 3. Complete Technical Architecture
- **System architecture diagram** (describe in detail)
- **Frontend architecture**: Component hierarchy, state management, routing
- **Backend architecture**: API design, microservices/monolith, data flow
- **Database schema**: EXACT tables, columns, types, indexes, relationships, constraints
- **Authentication/Authorization**: Flow diagrams, JWT/session strategy, role-based access
- **Third-party integrations**: APIs, SDKs, webhooks
- **Deployment architecture**: Cloud provider, regions, CDN, load balancing

# 4. API Specification
- **Every endpoint** with:
  - HTTP method, path, authentication
  - Request parameters (path, query, body) with types and validation
  - Response format (success and error cases)
  - Status codes and error messages
  - Rate limiting and caching strategy
- **WebSocket/real-time** endpoints if applicable
- **API versioning** strategy

# 5. Database Schema (Detailed)
For each table provide:
- Table name and purpose
- Every column: name, type, constraints (NOT NULL, UNIQUE, etc.)
- Primary keys and foreign keys
- Indexes for performance
- Triggers and stored procedures if needed
- Sample data for clarity
- Migration strategy

# 6. Frontend Implementation Details
- **Exact folder structure**: /src/components, /src/pages, /src/hooks, etc.
- **Component breakdown**: Every major component with props, state, events
- **State management**: Redux/Context/Zustand setup, store structure, actions
- **Routing**: Exact routes, protected routes, navigation flow
- **Form validation**: Libraries (Zod/Yup), validation rules
- **UI/UX patterns**: Design system, component library, theming
- **Responsive design**: Breakpoints, mobile-first approach
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

# 7. Backend Implementation Details
- **Exact folder structure**: /src/routes, /src/controllers, /src/models, etc.
- **Authentication flow**: Step-by-step with code patterns
- **Authorization middleware**: Role checks, permission system
- **Data validation**: Input sanitization, schema validation
- **Error handling**: Global error handler, error types, logging
- **Background jobs**: Queue system (Bull/BullMQ), cron jobs
- **File uploads**: Storage strategy (S3/Cloudinary), validation, CDN

# 8. Technology Stack (November 2025 - Latest Versions)
For each technology specify:
- **Exact version number** (e.g., React 19.0.2, Next.js 15.1.0)
- **Why chosen** (specific features needed)
- **Alternatives considered** and why rejected
- **Installation command**
- **Configuration requirements**

Include:
- Frontend: Framework, UI library, state management, form handling, data fetching
- Backend: Runtime (Node/Deno/Bun), framework, ORM/query builder
- Database: Primary DB, caching layer (Redis), search (Elasticsearch)
- AI/ML: Model providers, vector DB for embeddings
- DevOps: CI/CD, containerization, monitoring, logging
- Testing: Unit (Vitest/Jest), E2E (Playwright/Cypress), API (Supertest)

# 9. Environment Configuration
- **Every environment variable** needed:
  - Variable name
  - Purpose
  - Example value (non-sensitive)
  - Where to obtain (API keys)
- **.env.example** file content
- **Secrets management** (Vault, Parameter Store)

# 10. Dependencies & Third-Party Services
- **Every npm package** with version and purpose
- **API services** (Stripe, SendGrid, etc.) with pricing tiers
- **OAuth providers** (Google, GitHub) with setup steps
- **CDN/Storage** (Cloudflare, S3) with configuration
- **Monitoring** (Sentry, DataDog) with alert rules

# 11. Security Implementation
- **OWASP Top 10** mitigation strategies (specific to this app)
- **Input validation** and sanitization (where and how)
- **SQL injection** prevention (parameterized queries, ORM)
- **XSS protection** (CSP headers, sanitization libraries)
- **CSRF tokens** implementation
- **Rate limiting** (endpoints, algorithms, thresholds)
- **Secrets management** (how and where stored)
- **Encryption** (data at rest, data in transit)
- **Security headers** (helmet.js configuration)
- **Dependency scanning** (Snyk, npm audit)

# 12. Scalability & Performance
- **Horizontal scaling** strategy (load balancer, session management)
- **Database optimization** (indexing strategy, query optimization)
- **Caching layers** (Redis, CDN, browser cache)
- **Asset optimization** (code splitting, lazy loading, compression)
- **CDN strategy** (static assets, geographic distribution)
- **Performance budgets** (load time, bundle size, FCP, LCP)
- **Monitoring** (APM tools, metrics to track)

# 13. Testing Strategy
- **Unit tests**: What to test, coverage goals (80%+), frameworks
- **Integration tests**: API endpoints, database interactions
- **E2E tests**: Critical user flows, test scenarios
- **Performance tests**: Load testing (k6/Artillery), benchmarks
- **Security tests**: Penetration testing, vulnerability scanning
- **Test data**: Fixtures, factories, seed data
- **CI/CD integration**: Test automation, coverage reporting

# 14. Deployment & DevOps
- **Exact deployment steps** (command by command):
  1. Build frontend: npm run build
  2. Deploy to Vercel: vercel --prod
  3. Deploy backend: docker build and docker push and kubectl apply
  4. Run migrations: npm run migrate:prod
  5. Verify health checks
- **Infrastructure as code** (Terraform/Pulumi/CDK)
- **CI/CD pipeline** (GitHub Actions/GitLab CI configuration)
- **Environment promotion** (dev → staging → prod)
- **Rollback strategy** (blue-green, canary deployment)
- **Health checks** and monitoring
- **Logging** (structured logs, log aggregation)
- **Alerts** (error rates, performance degradation)

# 15. Risk Analysis & Mitigation
- **Technical risks**:
  - Specific risk, likelihood (1-10), impact (1-10), mitigation plan
- **Business risks**:
  - Market risk, competitive risk, adoption risk, mitigation
- **Security risks**:
  - Vulnerability, exploit scenario, prevention measures
- **Scalability risks**:
  - Bottlenecks, traffic spikes, mitigation (caching, auto-scaling)
- **Third-party risks**:
  - Vendor lock-in, API changes, downtime, backup plans

# 16. Success Metrics & KPIs
- **User metrics**: DAU/MAU, retention, churn, session duration
- **Performance metrics**: API response time, error rate, uptime
- **Business metrics**: Conversion rate, revenue, CAC, LTV
- **Technical metrics**: Test coverage, deployment frequency, MTTR
- **Monitoring dashboards**: What to track, alert thresholds

# 17. Cost Estimates
- **Infrastructure costs** (monthly):
  - Hosting: $X (provider, tier, usage assumptions)
  - Database: $X (storage, compute, backups)
  - CDN/Storage: $X (bandwidth, storage)
  - AI/ML APIs: $X (requests/month, pricing tier)
  - Monitoring/Logging: $X
  - Total: $X/month at 1K users, $Y at 10K users, $Z at 100K
- **Development costs**:
  - Team size and composition
  - Timeline and hourly rates
  - Total estimated hours
- **Third-party services**: License fees, API costs

# 18. Implementation Timeline
- **Phase 1 (Weeks 1-2)**: MVP core features
  - Week 1: Setup, auth, database schema
  - Week 2: Core UI, basic API endpoints
  - Deliverable: Working prototype
- **Phase 2 (Weeks 3-4)**: Feature completion
  - Week 3: Advanced features, integrations
  - Week 4: Testing, bug fixes
  - Deliverable: Feature-complete beta
- **Phase 3 (Weeks 5-6)**: Polish & launch
  - Week 5: Performance optimization, security audit
  - Week 6: Documentation, deployment, launch
  - Deliverable: Production release
- **Milestones**: Specific deliverables with acceptance criteria

# 19. Code Examples & Patterns
Include code snippets for:
- Authentication flow (login/signup/refresh)
- Protected API endpoint
- Database query with ORM
- React component with hooks
- Form validation
- Error handling
- File upload
- WebSocket connection
- Payment processing
- Email sending

# 20. Open Questions & Future Enhancements
- Items that need user decisions
- Features for v2.0
- Technical debt to address
- Scalability improvements for later

CRITICAL REQUIREMENTS:
- Use November 2025 technology versions (latest stable releases)
- Include specific code examples for complex patterns
- Provide exact configuration files where helpful
- Be so detailed that NO clarifying questions are needed
- Cite sources for technology choices
- Assume the implementer has your expertise but not your context
- Total spec should be 15-20 pages when rendered as PDF

Use markdown with proper headings, code blocks, tables, and lists. Be EXTRAORDINARILY specific and actionable.`;

      const spec = await callOpenRouter({
        model: 'gpt-5.1-codex', // Specialized for code architecture
        messages: [
          {
            role: 'system',
            content: 'You are an elite senior technical architect and staff engineer. Your specifications are legendary for their completeness - developers can implement entire applications from your specs without asking a single clarifying question. You have deep expertise in modern web development, AI integration, scalability, and security. You write 15-20 page specs with extreme implementation detail including exact API endpoints, database schemas, code patterns, and deployment steps.'
          },
          {
            role: 'user',
            content: specPrompt
          }
        ],
        temperature: 0.3, // Lower for consistent, detailed output
        maxTokens: 12000 // ~20-25 pages of detailed content
      });

      const specContent = spec.content;

      const approvedBy = votes.filter((v: any) => v.approved).map((v: any) => v.agent);
      const dissentedBy = votes.filter((v: any) => !v.approved).map((v: any) => v.agent);
      const avgConfidence = votes.reduce((sum: number, v: any) => sum + (v.confidence || 0), 0) / votes.length;

      return new Response(
        JSON.stringify({
          spec: specContent,
          approvedBy,
          dissentedBy,
          consensusScore: avgConfidence,
          metadata: {
            researchDepth: `${avgToolsUsed.toFixed(1)} tools per expert`,
            totalExperts: syntheses.length,
            specModel: 'gpt-5.1-codex',
            specTokens: spec.usage?.total_tokens || 12000,
            specCost: spec.cost
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Invalid stage - should never reach here
    console.error('[EdgeFunction] Invalid stage received:', stage);
    return new Response(
      JSON.stringify({
        error: 'Invalid stage parameter',
        code: 'INVALID_STAGE',
        validStages: ['questions', 'research', 'challenge', 'synthesis', 'voting', 'spec']
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EdgeFunction] Request error:', sanitizeError(error));
    const errorMessage = getUserMessage(error);
    const statusCode = error instanceof Error && error.message.includes('Authentication') ? 401 : 500;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
