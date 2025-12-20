/**
 * Enhanced Multi-Agent Specification Generator
 * Hybrid architecture combining Make It Heavy's orchestration with Specificity's expertise
 *
 * Pipeline Stages (Dec 2025):
 * 1. questions    - Dynamic question generation (GPT-5.2)
 * 2. research     - Parallel expert research with tools (multi-model via OpenRouter)
 * 3. challenge    - Ray Dalio-style productive conflict (GPT-5.2)
 * 4. synthesis    - Expert synthesis (Groq: deepseek-r1-distill-llama-70b)
 * 5. review       - Heavy-model review gate (GPT-5.2 Codex) [NEW Phase 4]
 * 6. voting       - Expert voting (Groq: deepseek-r1-distill-llama-70b)
 * 7. spec         - Final spec generation (Groq: deepseek-r1-distill-llama-70b)
 * 8. chat         - 1:1 expert chat (GPT-5.2)
 *
 * Features:
 * - Intelligent expert assignment
 * - True parallel execution
 * - Hot-swappable tool system (5 core tools)
 * - Multi-model support via OpenRouter
 * - Heavy-model review gate for output verification
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

// Import new architecture modules
import { ToolRegistry } from '../tools/registry.ts';
import { detectPromptInjection, sanitizeInput } from './lib/utils/security.ts';
import { checkRateLimit, corsHeaders } from './lib/utils/api.ts';
import { requestSchema } from './lib/types.ts';

// Import stage handlers
import { handleQuestionsStage } from './lib/stages/questions.ts';
import { handleResearchStage } from './lib/stages/research.ts';
import { handleChallengeStage } from './lib/stages/challenge.ts';
import { handleSynthesisStage } from './lib/stages/synthesis.ts';
import { handleReviewStage } from './lib/stages/review.ts';
import { handleVotingStage } from './lib/stages/voting.ts';
import { handleSpecStageComplete } from './lib/stages/spec.ts';
import { handleChatStage } from './lib/stages/chat.ts';

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

    const { userInput, stage, agentConfigs, roundData, userComment, targetAgent }: {
      userInput?: string;
      stage: RequestBody['stage'];
      agentConfigs?: AgentConfig[];
      roundData?: RequestBody['roundData'];
      userComment?: string;
      targetAgent?: string;
    } = validated;

    // Check rate limit (count 1 spec generation as the initial "questions" stage)
    /* 
    if (stage === 'questions') {
      const rateLimit = await checkRateLimit(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, user.id, 'multi-agent-spec', 5);
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
    }
    */

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
      return await handleQuestionsStage(cleanInput);
    }

    // ========================================
    // STAGE 2: PARALLEL RESEARCH WITH TOOLS
    // ========================================
    if (stage === 'research') {
      return await handleResearchStage(agentConfigs, roundData, cleanInput, tools);
    }

    // ========================================
    // STAGE 2.5: CHALLENGE/DEBATE (RAY DALIO STYLE)
    // ========================================
    if (stage === 'challenge') {
      return await handleChallengeStage(agentConfigs, roundData, cleanInput);
    }

    // ========================================
    // STAGE 3: SYNTHESIS (ENHANCED)
    // ========================================
    if (stage === 'synthesis') {
      return await handleSynthesisStage(roundData, cleanComment, GROQ_API_KEY!);
    }

    // ========================================
    // STAGE 3.5: REVIEW (HEAVY-MODEL GATE)
    // Phase 4 implementation - GPT-5.2 Codex validates outputs
    // ========================================
    if (stage === 'review') {
      return await handleReviewStage(roundData);
    }

    // ========================================
    // STAGE 4: VOTING (UNCHANGED)
    // ========================================
    if (stage === 'voting') {
      return await handleVotingStage(agentConfigs, roundData, GROQ_API_KEY!);
    }

    // ========================================
    // STAGE 5: SPEC GENERATION (ENHANCED)
    // ========================================
    if (stage === 'spec') {
      return await handleSpecStageComplete(roundData, GROQ_API_KEY!);
    }

    // ========================================
    // STAGE 6: 1:1 CHAT
    // ========================================
    if (stage === 'chat') {
      return await handleChatStage(agentConfigs, targetAgent, cleanInput);
    }

    // Fallback for unknown stage
    return new Response(
      JSON.stringify({ error: 'Invalid stage' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
