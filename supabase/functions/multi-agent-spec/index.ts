import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const EXA_API_KEY = Deno.env.get('EXA_API_KEY');

// Input validation schemas
const agentConfigSchema = z.object({
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
  stage: z.enum(['discussion', 'research', 'synthesis', 'voting', 'spec']),
  userComment: z.string().max(1000).optional(),
  agentConfigs: z.array(agentConfigSchema).optional(),
  roundData: z.any().optional(),
  discussionTurns: z.number().min(3).max(20).optional(),
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

// Sanitize user input
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>"'`]/g, '') // Remove potentially dangerous chars
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

interface AgentConfig {
  agent: string;
  systemPrompt: string;
  temperature: number;
  enabled: boolean;
}

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
    const errorText = await response.text();
    console.error('Groq API error:', sanitizeError(new Error(`API request failed with status ${response.status}`)));
    
    // Parse rate limit errors
    if (response.status === 429) {
      throw new Error('RATE_LIMIT: Rate limit exceeded');
    }
    
    throw new Error('API request failed');
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Unexpected API response:', sanitizeError(new Error('Invalid response structure')));
    throw new Error('Invalid response from API');
  }
  return data.choices[0].message.content || 'No response';
}

async function researchWithExa(query: string) {
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EXA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        num_results: 8,
        use_autoprompt: true,
        type: 'neural',
      }),
    });

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Search API error:', sanitizeError(error));
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const rawBody = await req.json();
    
    // Validate with zod schema
    let validated;
    try {
      validated = requestSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', sanitizeError(error));
        return new Response(
          JSON.stringify({ error: 'Invalid request format', details: error.errors[0]?.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    const { userInput, stage, agentConfigs, roundData, userComment, discussionTurns = 8 } = validated;
    
    // Check for prompt injection
    if (userInput && detectPromptInjection(userInput)) {
      console.warn('Prompt injection attempt detected:', sanitizeError(new Error('Injection attempt')));
      return new Response(
        JSON.stringify({ error: 'Invalid input detected. Please rephrase your request.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userComment && detectPromptInjection(userComment)) {
      console.warn('Prompt injection in comment:', sanitizeError(new Error('Injection attempt')));
      return new Response(
        JSON.stringify({ error: 'Invalid comment detected. Please rephrase.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const cleanInput = userInput ? sanitizeInput(userInput) : '';
    const cleanComment = userComment ? sanitizeInput(userComment) : undefined;
    
    console.log('Processing:', { stage, hasConfigs: !!agentConfigs, authenticated: true });

    if (stage === 'discussion') {
      console.log('Running orchestrated roundtable discussion...');
      
      if (!agentConfigs) {
        return new Response(
          JSON.stringify({ error: 'Agent configurations required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const activeAgents = agentConfigs.filter((c: AgentConfig) => c.enabled);
      const dialogue = [];
      const agentScores: Record<string, { agreements: number; contributions: number; insights: string[] }> = {};
      
      activeAgents.forEach(a => {
        agentScores[a.agent] = { agreements: 0, contributions: 0, insights: [] };
      });

      // Orchestrator moderates the discussion
      const orchestratorPrompt = `You are an expert panel moderator. Topic: ${cleanInput}

Your panel: ${activeAgents.map(a => `${a.agent} (${a.systemPrompt.split('.')[0]})`).join(', ')}

For each turn, select which panelist should speak based on:
- Their domain expertise relevance to the current topic
- Building on previous points made
- Ensuring diverse perspectives
- Creating productive debate

Return JSON with turns: [{"speaker": "agent_name", "prompt": "what they should address", "reasoning": "why them"}]
Generate ${discussionTurns} turns.`;

      const orchestratorResponse = await callGroq(
        "You are a world-class panel moderator who orchestrates insightful discussions.",
        orchestratorPrompt,
        0.7,
        1500
      );

      let turns = [];
      try {
        turns = JSON.parse(orchestratorResponse);
      } catch {
        // Fallback: round-robin discussion
        turns = Array.from({ length: discussionTurns }, (_, i) => ({
          speaker: activeAgents[i % activeAgents.length].agent,
          prompt: "Share your perspective on this idea",
          reasoning: "Round-robin turn"
        }));
      }

      // Execute discussion turns
      for (const turn of turns) {
        const speakerConfig = activeAgents.find(a => a.agent === turn.speaker);
        if (!speakerConfig) continue;

        const context = dialogue.slice(-3).map(d => `${d.agent}: ${d.message}`).join('\n');
        const userGuidance = cleanComment ? `\nUser guidance: ${cleanComment}` : '';
        
        const turnPrompt = `Topic: ${cleanInput}${userGuidance}

Recent discussion:
${context}

Moderator asks you: ${turn.prompt}

Respond with your expert perspective. Be specific, opinionated, and build on or challenge previous points. Keep to 2-3 sentences.`;

        const response = await callGroq(speakerConfig.systemPrompt, turnPrompt, speakerConfig.temperature, 300);
        
        agentScores[speakerConfig.agent].contributions++;
        agentScores[speakerConfig.agent].insights.push(response);

        dialogue.push({
          agent: speakerConfig.agent,
          message: response,
          timestamp: new Date().toISOString(),
          type: 'discussion',
          turnNumber: dialogue.length + 1,
          moderatorNote: turn.reasoning
        });

        // Calculate agreement scores (simple keyword matching)
        if (dialogue.length > 1) {
          const prev = dialogue[dialogue.length - 2];
          const agreeWords = ['agree', 'yes', 'exactly', 'right', 'correct', 'absolutely'];
          const disagreeWords = ['but', 'however', 'disagree', 'no', 'actually', 'wrong'];
          
          const hasAgreement = agreeWords.some(w => response.toLowerCase().includes(w));
          const hasDisagreement = disagreeWords.some(w => response.toLowerCase().includes(w));
          
          if (hasAgreement) {
            agentScores[speakerConfig.agent].agreements++;
            agentScores[prev.agent].agreements++;
          }
        }
      }

      // Generate consensus summary
      const summaryPrompt = `Discussion transcript:
${dialogue.map(d => `${d.agent}: ${d.message}`).join('\n\n')}

Synthesize: 1) Key consensus points 2) Major disagreements 3) Top 3 insights
Be concise.`;

      const summary = await callGroq(
        "You synthesize panel discussions into actionable insights.",
        summaryPrompt,
        0.5,
        500
      );

      return new Response(
        JSON.stringify({ 
          dialogue, 
          agentScores,
          summary,
          totalTurns: dialogue.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stage === 'research') {
      console.log('Researching with Exa...');
      const questions = roundData.questions || [];
      const allResults = [];
      
      for (const q of questions.slice(0, 5)) {
        const results = await researchWithExa(q.question);
        allResults.push(...results);
      }
      
      return new Response(
        JSON.stringify({ research: allResults }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stage === 'synthesis') {
      console.log('Synthesizing insights from discussion...');
      
      if (!agentConfigs) {
        return new Response(
          JSON.stringify({ error: 'Agent configurations required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const activeAgents = agentConfigs.filter((c: AgentConfig) => c.enabled);
      const dialogue = roundData.dialogue || [];
      const research = roundData.research || [];
      
      const synthesisPromises = activeAgents.map(async (config: AgentConfig) => {
        const discussionContext = dialogue.slice(0, 10).map((d: any) => 
          `${d.agent}: ${d.message}`
        ).join('\n');
        
        const researchContext = research.slice(0, 3).map((r: any) => 
          `- ${r.title}: ${r.snippet || r.text || ''}`
        ).join('\n');
        
        const context = cleanComment ? `User guidance: ${cleanComment}\n\n` : '';
        
        const prompt = `${context}Discussion:
${discussionContext}

Research:
${researchContext}

Provide your final synthesis: What are the 3 most critical requirements/decisions from your perspective? Be specific and actionable.`;
        
        const response = await callGroq(config.systemPrompt, prompt, config.temperature, 600);
        
        return {
          agent: config.agent,
          synthesis: response,
          timestamp: new Date().toISOString()
        };
      });

      const allSyntheses = await Promise.all(synthesisPromises);
      
      return new Response(
        JSON.stringify({ syntheses: allSyntheses }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stage === 'voting') {
      console.log('Collecting votes...');
      
      if (!agentConfigs) {
        return new Response(
          JSON.stringify({ error: 'Agent configurations required for voting stage' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const activeAgents = agentConfigs.filter((c: AgentConfig) => c.enabled);
      const syntheses = roundData.syntheses || [];
      const agentScores = roundData.agentScores || {};
      
      const votePromises = activeAgents.map(async (config: AgentConfig) => {
        const synthesesSummary = syntheses.map((s: any) => 
          `${s.agent}: ${s.synthesis.slice(0, 250)}...`
        ).join('\n\n');
        
        const scoreContext = agentScores[config.agent] 
          ? `\nYour contributions: ${agentScores[config.agent].contributions} turns, ${agentScores[config.agent].agreements} agreements`
          : '';
        
        const votePrompt = `Panel syntheses:
${synthesesSummary}${scoreContext}

Based on the discussion and consensus level, vote YES (proceed to spec) or NO (needs another round).
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

    if (stage === 'spec') {
      console.log('Generating final spec...');
      
      const syntheses = roundData.syntheses || [];
      const votes = roundData.votes || [];
      const dialogue = roundData.dialogue || [];
      const agentScores = roundData.agentScores || {};
      
      // Weight syntheses by agreement scores
      const weightedContext = syntheses.map((s: any) => {
        const score = agentScores[s.agent];
        const weight = score ? (score.agreements / Math.max(score.contributions, 1)) : 0.5;
        return `${s.agent} (consensus weight: ${(weight * 100).toFixed(0)}%):\n${s.synthesis}`;
      }).join('\n\n');
      
      const keyRequirements = votes.flatMap((v: any) => v.keyRequirements || []);
      
      const specPrompt = `Based on this expert roundtable discussion, create a comprehensive technical specification.

WEIGHTED EXPERT SYNTHESES:
${weightedContext}

KEY REQUIREMENTS (from voting):
${keyRequirements.join('\n')}

Generate a spec with:
# Executive Summary
# Core Requirements (prioritized by consensus)
# Technical Architecture
# Implementation Phases
# Dependencies & Stack
# Risk Analysis
# Success Metrics

Use markdown. Be specific and actionable.`;

      const spec = await callGroq(
        "You are a senior technical architect synthesizing expert panel insights into executable specifications.",
        specPrompt,
        0.4,
        2000
      );

      const approvedBy = votes.filter((v: any) => v.approved).map((v: any) => v.agent);
      const dissentedBy = votes.filter((v: any) => !v.approved).map((v: any) => v.agent);
      const avgConfidence = votes.reduce((sum: number, v: any) => sum + (v.confidence || 0), 0) / votes.length;

      return new Response(
        JSON.stringify({ 
          spec,
          approvedBy,
          dissentedBy,
          consensusScore: avgConfidence,
          agentScores
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
