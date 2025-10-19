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
    .min(10, 'Input too short')
    .max(2000, 'Input too long (max 2000 characters)'),
  stage: z.enum(['questions', 'research', 'answers', 'voting', 'spec']),
  userComment: z.string().max(500).optional(),
  agentConfigs: z.array(agentConfigSchema).min(1).max(10),
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

    const { userInput, stage, agentConfigs, roundData, userComment } = validated;
    
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

    if (stage === 'questions') {
      console.log('Generating clarifying questions...');
      
      const activeAgents = agentConfigs.filter((c: AgentConfig) => c.enabled);
      const questions = [];
      
      for (const config of activeAgents) {
        const questionPrompt = `Input: ${cleanInput}

Generate 2 critical questions to clarify this spec from your perspective.
Return ONLY a JSON array: [{"question": "...", "context": "...", "importance": "high", "reasoning": "..."}]`;

        const response = await callGroq(config.systemPrompt, questionPrompt, config.temperature, 400);
        try {
          const parsed = JSON.parse(response);
          questions.push(...parsed.map((q: any) => ({ ...q, askedBy: config.agent })));
        } catch {
          questions.push({
            question: response.split('\n')[0],
            context: 'Generated by agent',
            importance: 'high',
            askedBy: config.agent,
            reasoning: response
          });
        }
      }

      return new Response(
        JSON.stringify({ questions }),
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

    if (stage === 'answers') {
      console.log('Generating agent answers...');
      
      const activeAgents = agentConfigs.filter((c: AgentConfig) => c.enabled);
      const questions = roundData.questions || [];
      const research = roundData.research || [];
      
      const answerPromises = activeAgents.map(async (config: AgentConfig) => {
        const context = cleanComment ? `\nUSER GUIDANCE: ${cleanComment}\n` : '';
        const researchContext = research.slice(0, 3).map((r: any) => 
          `- ${r.title}: ${r.text || r.snippet}`
        ).join('\n');
        
        const answers = [];
        
        for (const q of questions.slice(0, 3)) {
          if (q.askedBy === config.agent) {
            const prompt = `${context}Q: ${q.question}

Research:
${researchContext}

Answer briefly with your key insight and reasoning.`;
            
            const response = await callGroq(config.systemPrompt, prompt, config.temperature, 500);
            answers.push({
              agent: config.agent,
              question: q.question,
              answer: response,
              reasoning: `Analysis based on ${config.agent} perspective`
            });
          }
        }
        
        return answers;
      });

      const allAnswers = (await Promise.all(answerPromises)).flat();
      
      return new Response(
        JSON.stringify({ answers: allAnswers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stage === 'voting') {
      console.log('Collecting votes...');
      
      const activeAgents = agentConfigs.filter((c: AgentConfig) => c.enabled);
      const answers = roundData.answers || [];
      
      const votePromises = activeAgents.map(async (config: AgentConfig) => {
        const answerSummary = answers.map((a: any) => 
          `${a.agent}: ${a.answer.slice(0, 200)}...`
        ).join('\n\n');
        
        const votePrompt = `Answers:
${answerSummary}

Vote YES or NO to proceed. Return JSON: {"approved": true/false, "reasoning": "brief explanation"}`;

        const response = await callGroq(config.systemPrompt, votePrompt, config.temperature, 200);
        
        try {
          const vote = JSON.parse(response);
          return {
            agent: config.agent,
            approved: vote.approved,
            reasoning: vote.reasoning,
            timestamp: new Date().toISOString()
          };
        } catch {
          const approved = response.toLowerCase().includes('yes') || 
                          response.toLowerCase().includes('approve');
          return {
            agent: config.agent,
            approved,
            reasoning: response,
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
      console.log('Generating spec...');
      
      const answers = roundData.answers || [];
      const votes = roundData.votes || [];
      
      const context = answers.map((a: any) => 
        `${a.agent}: ${a.answer}`
      ).join('\n\n');
      
      const specPrompt = `Synthesize this analysis into a technical spec:

${context}

Include: 1) Summary 2) Architecture 3) Phases 4) Dependencies 5) Risks 6) Testing
Be concise and actionable. Use markdown.`;

      const spec = await callGroq(
        "You are a senior technical architect. Be concise and specific.",
        specPrompt,
        0.5,
        1200
      );

      const approvedBy = votes.filter((v: any) => v.approved).map((v: any) => v.agent);
      const dissentedBy = votes.filter((v: any) => !v.approved).map((v: any) => v.agent);

      return new Response(
        JSON.stringify({ 
          spec,
          approvedBy,
          dissentedBy
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
