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
import { StreamEmitter } from '../lib/stream-emitter.ts';
import { verifyAllAgents } from '../lib/fact-verifier.ts';
import { getDepthConfig, filterAgentsForDepth, type ResearchDepth } from '../lib/depth-control.ts';

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
  sessionId: z.string().optional(), // For WebSocket streaming
  depth: z.enum(['quick', 'standard', 'deep', 'exhaustive']).optional(), // Research depth control
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check environment variables
    if (!validateEnv()) {
      console.error('Configuration error:', { type: 'missing_env_vars' });
      return new Response(
        JSON.stringify({
          error: 'Service configuration error. Please contact support.',
          code: 'CONFIG_ERROR'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const { userInput, stage, agentConfigs, roundData, userComment, sessionId, depth } = validated;
    const researchDepth: ResearchDepth = depth || 'standard'; // Default to standard
    const depthConfig = getDepthConfig(researchDepth);

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
        count: depthConfig.questionCount
      });

      console.log(`[Enhanced] Using ${researchDepth} depth: ${depthConfig.questionCount} questions, ${depthConfig.maxAgents} agents`);

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
      let configsWithIds: AgentConfig[] = agentConfigs.map((config, idx) => ({
        id: config.id || config.agent.toLowerCase().replace(/\s+/g, '_'),
        agent: config.agent,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        enabled: config.enabled
      }));

      // Filter agents based on depth (KISS: simple filtering)
      configsWithIds = filterAgentsForDepth(configsWithIds.filter(c => c.enabled), researchDepth);
      console.log(`[DepthControl] Using ${researchDepth} depth: ${configsWithIds.length} agents, ${depthConfig.maxIterations} max iterations`);

      // Assign questions to experts
      const assignments = assignQuestionsToExperts(questions, configsWithIds);
      const balancedAssignments = balanceWorkload(assignments);

      console.log(`[Enhanced] Assigned questions to ${balancedAssignments.length} experts`);

      // Create stream emitter for real-time progress updates (if sessionId provided)
      const streamEmitter = sessionId ? new StreamEmitter(sessionId) : undefined;

      // Execute parallel research
      const researchResults = await executeParallelResearch(
        balancedAssignments,
        tools,
        {
          userInput: cleanInput,
          roundNumber: roundData?.roundNumber || 1,
          streamEmitter,
          maxIterations: depthConfig.maxIterations
        }
      );

      // Calculate total cost and tokens
      const totalCost = researchResults.reduce((sum, r) => sum + r.cost, 0);
      const totalTokens = researchResults.reduce((sum, r) => sum + r.tokensUsed, 0);
      const totalTools = researchResults.reduce((sum, r) => sum + r.toolsUsed.length, 0);

      console.log(`[Enhanced] Research complete - Cost: $${totalCost.toFixed(4)}, Tokens: ${totalTokens}, Tools: ${totalTools}`);

      // Optional: Verify research findings with fact-checking layer
      // Controlled by depth config (disabled for 'quick' mode)
      let verificationReports = undefined;
      const hasSubstantialFindings = researchResults.some(r => r.findings.length > 200);

      if (depthConfig.enableFactChecking && hasSubstantialFindings) {
        console.log('[FactVerifier] Running fact verification on research findings...');
        const verifyStartTime = Date.now();

        verificationReports = await verifyAllAgents(
          researchResults.map(r => ({
            expertId: r.expertId,
            expertName: r.expertName,
            findings: r.findings
          })),
          tools
        );

        const verifyDuration = Date.now() - verifyStartTime;
        const avgVerificationConfidence = verificationReports.reduce((sum, r) => sum + r.overallConfidence, 0) / verificationReports.length;

        console.log(`[FactVerifier] ✓ Verification complete in ${(verifyDuration/1000).toFixed(1)}s`);
        console.log(`[FactVerifier]   Avg confidence: ${avgVerificationConfidence.toFixed(1)}%`);
      }

      return new Response(
        JSON.stringify({
          researchResults,
          assignments: balancedAssignments,
          verificationReports, // Add verification results
          metadata: {
            totalCost,
            totalTokens,
            totalToolsUsed: totalTools,
            duration: Math.max(...researchResults.map(r => r.duration)),
            factChecked: !!verificationReports,
            avgFactCheckConfidence: verificationReports
              ? Math.round(verificationReports.reduce((sum, r) => sum + r.overallConfidence, 0) / verificationReports.length)
              : undefined,
            depth: researchDepth,
            depthConfig: {
              maxIterations: depthConfig.maxIterations,
              agentsUsed: configsWithIds.length,
              estimatedCost: depthConfig.estimatedCost,
              estimatedDuration: depthConfig.estimatedDuration
            }
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

Generate a 20-30 PAGE production-ready specification with EXTREME implementation detail and VISUAL EXCELLENCE:

# 1. Executive Summary
- Product vision and value proposition
- Target market and user personas
- Key differentiators from competitors
- Success criteria (quantifiable)

# 2. User Experience & Design Strategy

## 2.1 User Personas (3-5 detailed personas)
For each persona provide:
- **Name, age, role, background**
- **Photo description** (for design reference)
- **Goals & motivations** (what they want to achieve)
- **Frustrations & pain points** (current problems)
- **Tech savviness** (1-10 scale)
- **Quote** (representative of their mindset)

## 2.2 Empathy Maps (one per persona)
For each persona create a detailed empathy map:

**THINKS:**
- List 3-5 thoughts going through their mind
- Concerns, considerations, mental models

**FEELS:**
- Emotional states (excited, frustrated, anxious, confident)
- Intensity levels (high/medium/low)

**SAYS:**
- Direct quotes they would say
- Feedback they give
- Questions they ask

**DOES:**
- Observable behaviors
- Actions they take
- Habits and patterns

**PAINS:**
- Obstacles and challenges
- Frustrations and fears
- Unmet needs

**GAINS:**
- Desired outcomes
- Success criteria
- What would delight them

## 2.3 User Journey Maps
Create journey maps for critical user flows (signup, first use, core action):

**Table Format:**
| Stage | User Action | Touchpoint | Emotion | Pain Point | Opportunity | Design Requirement |
|-------|-------------|------------|---------|------------|-------------|-------------------|
| [Stage] | [Action] | [Where] | 😊/😐/😤 | [Problem] | [Solution] | [Spec] |

Example stages: Awareness → Consideration → Decision → Action → Retention

## 2.4 User Flow Diagrams (Mermaid)
Provide Mermaid diagrams for critical user flows:

\`\`\`mermaid
graph LR
    Start([User Entry Point]) --> Decision{Condition}
    Decision -->|Yes| ActionA[Action A]
    Decision -->|No| ActionB[Action B]
    ActionA --> Success([Success State])
    ActionB --> Error([Error State])
\`\`\`

Include flows for:
- First-time user onboarding
- Authentication (login/signup/password reset)
- Core feature usage
- Error recovery paths
- Admin/power user workflows

# 3. Core Requirements
- Functional requirements (user stories with acceptance criteria)
- Non-functional requirements (performance, security, scalability)
- Must-have vs nice-to-have (prioritized by consensus)
- Constraints and assumptions

# 4. Complete Technical Architecture with Visual Diagrams

## 4.1 System Architecture (Mermaid Diagram)
\`\`\`mermaid
graph TB
    Client[Web Client]
    API[API Gateway]
    Auth[Auth Service]
    DB[(Database)]
    Cache[(Redis Cache)]
    CDN[CDN]

    Client --> CDN
    Client --> API
    API --> Auth
    API --> DB
    API --> Cache
    Auth --> DB
\`\`\`

Provide detailed Mermaid diagram showing:
- All major system components
- Data flow between components
- External services and integrations
- Caching layers
- Load balancers and CDN

## 4.2 Authentication Flow (Sequence Diagram)
\`\`\`mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant Auth
    participant DB

    User->>Client: Enter credentials
    Client->>API: POST /auth/login
    API->>Auth: Validate credentials
    Auth->>DB: Check user
    DB-->>Auth: User data
    Auth-->>API: JWT token
    API-->>Client: Auth response
    Client-->>User: Logged in
\`\`\`

## 4.3 Database ERD (Entity Relationship Diagram)
\`\`\`mermaid
erDiagram
    USER ||--o{ POST : creates
    USER ||--o{ COMMENT : writes
    POST ||--o{ COMMENT : has
    USER {
        uuid id PK
        string email UK
        string password_hash
        timestamp created_at
    }
    POST {
        uuid id PK
        uuid user_id FK
        string title
        text content
    }
\`\`\`

Provide complete ERD with all tables, relationships, and key fields.

## 4.4 Component Architecture
- **Frontend architecture**: Component hierarchy, state management, routing
- **Backend architecture**: API design, microservices/monolith, data flow
- **Database schema**: EXACT tables, columns, types, indexes, relationships, constraints
- **Third-party integrations**: APIs, SDKs, webhooks
- **Deployment architecture**: Cloud provider, regions, CDN, load balancing

# 5. API Specification
- **Every endpoint** with:
  - HTTP method, path, authentication
  - Request parameters (path, query, body) with types and validation
  - Response format (success and error cases)
  - Status codes and error messages
  - Rate limiting and caching strategy
- **WebSocket/real-time** endpoints if applicable
- **API versioning** strategy

# 6. Database Schema (Detailed)
For each table provide:
- Table name and purpose
- Every column: name, type, constraints (NOT NULL, UNIQUE, etc.)
- Primary keys and foreign keys
- Indexes for performance
- Triggers and stored procedures if needed
- Sample data for clarity
- Migration strategy

# 7. Design System & Visual Language (CRITICAL - 10-Point Excellence Standard)

## 7.1 Design Philosophy & Principles
Specify a **glassmorphic/liquid glass design system** that surpasses Apple's visual sophistication:

**Core Principles (based on Apple HIG + elevated sophistication):**
1. **Clarity**: Content and functionality at different Z-depths with perfect hierarchy
2. **Deference**: Fluid glass surfaces defer to content while adding depth
3. **Depth**: Realistic layers with multi-level frosted glass blur effects
4. **Luminosity**: Dynamic light interactions, reflections, and refractions
5. **Precision**: Pixel-perfect alignment, mathematical spacing ratios
6. **Fluidity**: Smooth, physics-based animations (120fps on high-refresh displays)

**Visual Aesthetic Requirements:**
- **Primary Material**: Frosted glass with backdrop-blur (24px-40px blur radius)
- **Sophistication Level**: Beyond Apple Vision Pro UI - more refined, more tactile
- **Depth Layers**: Minimum 5 Z-index layers with distinct glass tint variations
- **Light Physics**: Simulate real glass properties (refraction, reflection, caustics)
- **Edge Treatment**: Soft glows, rim lighting, subtle shadows with color tinting
- **Motion**: Spring animations with realistic mass and damping

## 7.2 10-Point Design Quality Rating System

Evaluate EVERY design element on a 10-point scale across these dimensions:

### Typography (must score 9-10/10)
- **Hierarchy Clarity** (10/10): 6+ distinct type scales with perfect mathematical ratios
- **Readability** (10/10): WCAG AAA contrast, optimal line height (1.5-1.7), line length (60-80ch)
- **Font Selection** (10/10): System font stack (SF Pro, Inter, -apple-system) with perfect fallbacks
- **Tracking & Kerning** (10/10): Optically balanced spacing, responsive font sizing
- **Weight Progression** (10/10): 5+ weights (300, 400, 500, 600, 700) used meaningfully
- **Responsiveness** (10/10): Fluid typography (clamp() functions), device-optimized

**Typography Scale Specification:**
\`\`\`css
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
--text-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
--text-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem);
--text-4xl: clamp(2.25rem, 1.9rem + 1.75vw, 3rem);
\`\`\`

### Color System (must score 9-10/10)
- **Palette Sophistication** (10/10): 5+ shades per color, HSL-based with luminosity curves
- **Glass Tinting** (10/10): Subtle color overlays on glass surfaces (5-15% opacity)
- **Dark Mode Parity** (10/10): Equally refined light and dark themes
- **Contrast Compliance** (10/10): All text meets WCAG AAA (7:1 minimum)
- **Semantic Naming** (10/10): Context-based tokens (--color-surface-glass, --color-text-primary)
- **Dynamic Theming** (10/10): CSS variables with smooth transitions

**Glass Material Variants:**
\`\`\`css
/* Ultra-light glass (backgrounds) */
--glass-lightest: hsla(0, 0%, 100%, 0.05);
backdrop-filter: blur(40px) saturate(180%);

/* Primary glass (cards, panels) */
--glass-primary: hsla(210, 20%, 98%, 0.08);
backdrop-filter: blur(24px) saturate(150%);
box-shadow:
  0 8px 32px hsla(0, 0%, 0%, 0.12),
  inset 0 1px 0 hsla(0, 0%, 100%, 0.15),
  inset 0 -1px 0 hsla(0, 0%, 0%, 0.05);

/* Elevated glass (modals, popovers) */
--glass-elevated: hsla(210, 25%, 99%, 0.12);
backdrop-filter: blur(32px) saturate(170%);
\`\`\`

### Spacing & Layout (must score 9-10/10)
- **Mathematical Precision** (10/10): 8px base unit, powers of 2 (8, 16, 24, 32, 48, 64, 96, 128)
- **Optical Alignment** (10/10): Visual centering, not mathematical (account for font metrics)
- **Density Levels** (10/10): Compact, default, comfortable, spacious (user preference)
- **Grid System** (10/10): 12-column responsive grid with perfect gutters
- **Container Widths** (10/10): Content-optimized max-widths (prose: 65ch, wide: 1280px)
- **Whitespace Usage** (10/10): Generous breathing room, clear visual grouping

### Glass Effects & Materials (must score 10/10 - SIGNATURE FEATURE)
- **Blur Quality** (10/10): Multi-pass gaussian blur, hardware-accelerated
- **Transparency Depth** (10/10): 5+ distinct glass opacity levels (2%, 5%, 8%, 12%, 15%)
- **Refraction Effects** (10/10): Subtle content distortion behind glass
- **Reflection Simulation** (10/10): Environment reflections on glass surfaces
- **Edge Lighting** (10/10): Rim lights, halos, glows with proper color temperature
- **Shadow Sophistication** (10/10): Multi-layered shadows with color (not just black)

**Advanced Glass Effects:**
\`\`\`css
.glass-surface {
  background: linear-gradient(
    135deg,
    hsla(210, 100%, 95%, 0.12) 0%,
    hsla(210, 100%, 98%, 0.08) 50%,
    hsla(210, 100%, 95%, 0.12) 100%
  );
  backdrop-filter: blur(24px) saturate(150%) brightness(1.1);
  border: 1px solid hsla(0, 0%, 100%, 0.18);
  box-shadow:
    /* Outer glow */
    0 0 0 1px hsla(210, 100%, 70%, 0.04),
    /* Depth shadow */
    0 8px 32px hsla(210, 30%, 10%, 0.12),
    0 2px 8px hsla(210, 30%, 10%, 0.08),
    /* Inner highlight */
    inset 0 1px 0 hsla(0, 0%, 100%, 0.15),
    /* Inner shadow */
    inset 0 -1px 0 hsla(0, 0%, 0%, 0.05);
}
\`\`\`

### Animation & Motion (must score 10/10)
- **Physics Accuracy** (10/10): Spring animations with realistic mass/stiffness/damping
- **Performance** (10/10): 60fps minimum, 120fps on capable displays, GPU-accelerated
- **Duration Curve** (10/10): Apple-style easing (cubic-bezier with precise control points)
- **Choreography** (10/10): Staggered animations, entrance/exit transitions
- **Micro-interactions** (10/10): Hover states, click feedback, loading states
- **Accessibility** (10/10): Respects prefers-reduced-motion, no vestibular triggers

**Animation Specifications:**
\`\`\`css
/* Spring-based easing (mimics physics) */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-apple: cubic-bezier(0.25, 0.1, 0.25, 1.0);
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);

/* Duration scale */
--duration-instant: 100ms;
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--duration-slower: 500ms;
\`\`\`

### Component Quality (must score 9-10/10)
- **Consistency** (10/10): Every component follows design system rules
- **Composability** (10/10): Components work together seamlessly
- **States Coverage** (10/10): Default, hover, active, focus, disabled, loading, error
- **Prop API Design** (10/10): Intuitive, flexible, well-documented props
- **Accessibility** (10/10): ARIA labels, keyboard navigation, screen reader support
- **Responsive Behavior** (10/10): Mobile-first, adapts gracefully across breakpoints

## 7.3 Storybook Specification (MANDATORY)

**Storybook Setup Requirements:**
- **Version**: Storybook 8.0+ (latest stable)
- **Framework Integration**: React + Vite + TypeScript
- **Addons Required**:
  - @storybook/addon-essentials (controls, actions, docs)
  - @storybook/addon-a11y (accessibility testing)
  - @storybook/addon-interactions (interaction testing)
  - @storybook/addon-themes (dark/light theme switching)
  - @storybook/addon-measure (spacing/layout debugging)
  - @storybook/addon-outline (layout visualization)

**Story Coverage Requirements:**
- **Every component** must have minimum 5 stories:
  1. Default state
  2. All variants (if applicable)
  3. Interactive states (hover/focus/active)
  4. Edge cases (long text, empty state, error state)
  5. Accessibility demonstration

**Story Format:**
\`\`\`typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://figma.com/file/...'
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'glass']
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const GlassMorphic: Story = {
  args: {
    variant: 'glass',
    children: 'Glass Button'
  },
  parameters: {
    backgrounds: { default: 'dark' }
  }
};
\`\`\`

**Documentation Requirements:**
- **Component Docs**: MDX format with usage examples, prop tables, accessibility notes
- **Design Tokens**: Documented color, spacing, typography scales
- **Glass Effects Library**: Visual catalog of all glass variants with code examples
- **Animation Showcase**: Interactive examples of all transitions/animations
- **Accessibility Guide**: Keyboard navigation map, ARIA patterns, screen reader testing

## 7.4 Component Library Structure

**Required Components (all with glass aesthetic):**
1. **Buttons**: 5 variants (primary, secondary, tertiary, ghost, glass)
2. **Cards**: 4 variants (flat-glass, elevated-glass, interactive-glass, outlined-glass)
3. **Inputs**: Text, textarea, select, checkbox, radio, switch (all with glass styling)
4. **Navigation**: Navbar, sidebar, breadcrumbs, tabs (floating glass panels)
5. **Overlays**: Modal, dialog, popover, tooltip, dropdown (frosted backdrops)
6. **Feedback**: Toast, alert, progress, skeleton, badge, spinner
7. **Data Display**: Table, list, grid, timeline, stat cards
8. **Media**: Avatar, image, video player, carousel
9. **Forms**: Form wrapper, field groups, validation states, step indicators
10. **Layout**: Container, grid, flex, stack, spacer, divider

**Each component MUST include:**
- TypeScript type definitions
- Prop documentation
- Accessibility attributes
- Keyboard navigation support
- Responsive variants
- Dark/light theme support
- Storybook stories
- Unit tests
- Visual regression tests

## 7.5 Design Token System

Specify complete design tokens in JSON/YAML format:

\`\`\`json
{
  "color": {
    "glass": {
      "lightest": "hsla(0, 0%, 100%, 0.05)",
      "light": "hsla(210, 20%, 98%, 0.08)",
      "medium": "hsla(210, 25%, 99%, 0.12)",
      "heavy": "hsla(210, 30%, 100%, 0.15)"
    }
  },
  "blur": {
    "sm": "16px",
    "md": "24px",
    "lg": "32px",
    "xl": "40px"
  },
  "shadow": {
    "glass": "0 8px 32px hsla(0, 0%, 0%, 0.12)",
    "elevated": "0 16px 48px hsla(0, 0%, 0%, 0.16)"
  }
}
\`\`\`

# 8. Frontend Implementation Details
- **Exact folder structure**: /src/components, /src/pages, /src/hooks, /src/design-system, /stories, etc.
- **Component breakdown**: Every major component with props, state, events
- **State management**: Redux/Context/Zustand setup, store structure, actions
- **Routing**: Exact routes, protected routes, navigation flow
- **Form validation**: Libraries (Zod/Yup), validation rules
- **Design system integration**: How components consume design tokens
- **Responsive design**: Breakpoints, mobile-first approach, container queries
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support, focus management

# 9. Backend Implementation Details
- **Exact folder structure**: /src/routes, /src/controllers, /src/models, etc.
- **Authentication flow**: Step-by-step with code patterns
- **Authorization middleware**: Role checks, permission system
- **Data validation**: Input sanitization, schema validation
- **Error handling**: Global error handler, error types, logging
- **Background jobs**: Queue system (Bull/BullMQ), cron jobs
- **File uploads**: Storage strategy (S3/Cloudinary), validation, CDN

# 10. Technology Stack (November 2025 - Latest Versions)
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

# 11. Environment Configuration
- **Every environment variable** needed:
  - Variable name
  - Purpose
  - Example value (non-sensitive)
  - Where to obtain (API keys)
- **.env.example** file content
- **Secrets management** (Vault, Parameter Store)

# 12. Dependencies & Third-Party Services
- **Every npm package** with version and purpose
- **API services** (Stripe, SendGrid, etc.) with pricing tiers
- **OAuth providers** (Google, GitHub) with setup steps
- **CDN/Storage** (Cloudflare, S3) with configuration
- **Monitoring** (Sentry, DataDog) with alert rules

# 13. Security Implementation
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

# 14. Scalability & Performance
- **Horizontal scaling** strategy (load balancer, session management)
- **Database optimization** (indexing strategy, query optimization)
- **Caching layers** (Redis, CDN, browser cache)
- **Asset optimization** (code splitting, lazy loading, compression)
- **CDN strategy** (static assets, geographic distribution)
- **Performance budgets** (load time, bundle size, FCP, LCP)
- **Monitoring** (APM tools, metrics to track)

# 15. Testing Strategy
- **Unit tests**: What to test, coverage goals (80%+), frameworks
- **Integration tests**: API endpoints, database interactions
- **E2E tests**: Critical user flows, test scenarios
- **Performance tests**: Load testing (k6/Artillery), benchmarks
- **Security tests**: Penetration testing, vulnerability scanning
- **Test data**: Fixtures, factories, seed data
- **CI/CD integration**: Test automation, coverage reporting

# 16. Deployment & DevOps
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

# 17. Risk Analysis & Mitigation
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

# 18. Success Metrics & KPIs
- **User metrics**: DAU/MAU, retention, churn, session duration
- **Performance metrics**: API response time, error rate, uptime
- **Business metrics**: Conversion rate, revenue, CAC, LTV
- **Technical metrics**: Test coverage, deployment frequency, MTTR
- **Monitoring dashboards**: What to track, alert thresholds

# 19. Cost Estimates
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

# 20. Implementation Timeline
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

# 21. Code Examples & Patterns
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

# 22. Open Questions & Future Enhancements
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
- Total spec should be 20-30 pages when rendered as PDF

Use markdown with proper headings, code blocks, tables, and lists. Be EXTRAORDINARILY specific and actionable.`;

      const spec = await callOpenRouter({
        model: 'gpt-5.1-codex', // Specialized for code architecture
        messages: [
          {
            role: 'system',
            content: 'You are an elite senior technical architect and staff engineer. Your specifications are legendary for their completeness - developers can implement entire applications from your specs without asking a single clarifying question. You have deep expertise in modern web development, AI integration, scalability, and security. You write 20-30 page specs with extreme implementation detail including exact API endpoints, database schemas, code patterns, and deployment steps.'
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

    throw new Error('Invalid stage');

  } catch (error) {
    console.error('Request error:', sanitizeError(error));
    return new Response(
      JSON.stringify({ error: getUserMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
