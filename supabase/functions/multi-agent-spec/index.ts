import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const EXA_API_KEY = Deno.env.get('EXA_API_KEY');

interface AgentConfig {
  name: string;
  systemPrompt: string;
}

const agents: Record<string, AgentConfig> = {
  elon: {
    name: "Elon Musk",
    systemPrompt: "You are Elon Musk analyzing this spec. Focus on: 1) Can it scale to 100M+ users? 2) What's the simplest architecture? 3) What are we overengineering? Be direct and visionary."
  },
  cuban: {
    name: "Mark Cuban",
    systemPrompt: "You are Mark Cuban analyzing this spec. Focus on: 1) What's the business model? 2) How does this make money? 3) What's the market opportunity? 4) What's the competitive advantage? Be practical and business-focused."
  },
  dev: {
    name: "Senior Dev",
    systemPrompt: "You are a senior developer analyzing this spec. Focus on: 1) TypeScript strict mode readiness 2) Error handling strategy 3) Test coverage plan 4) Performance considerations 5) Security concerns. Be thorough and technical."
  },
  designer: {
    name: "UX Designer",
    systemPrompt: "You are a UX designer analyzing this spec. Focus on: 1) User experience flow 2) Visual hierarchy 3) Accessibility 4) Mobile responsiveness 5) Design system needs. Be user-centric and detail-oriented."
  },
  entrepreneur: {
    name: "Entrepreneur",
    systemPrompt: "You are an entrepreneur analyzing this spec. Focus on: 1) What's the MVP? 2) What can we ship fast? 3) What should we defer? 4) What are the critical path items? Be action-oriented and pragmatic."
  },
  legal: {
    name: "Legal Expert",
    systemPrompt: "You are a legal expert analyzing this spec. Focus on: 1) Evidence-based requirements 2) Compliance considerations 3) Data privacy 4) Terms of service needs 5) Risk mitigation. Be thorough and precise."
  }
};

async function callGroq(systemPrompt: string, userMessage: string): Promise<string> {
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
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response';
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
        num_results: 5,
        use_autoprompt: true,
        type: 'neural',
      }),
    });

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Exa search error:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput, stage } = await req.json();
    console.log('Processing request:', { stage, inputLength: userInput?.length });

    if (stage === 'research') {
      console.log('Starting research phase...');
      const researchResults = await researchWithExa(userInput);
      
      return new Response(
        JSON.stringify({ researchResults }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stage === 'agents') {
      console.log('Starting multi-agent analysis...');
      
      // Run all agents in parallel for maximum speed
      const agentPromises = Object.entries(agents).map(async ([type, config]) => {
        const response = await callGroq(
          config.systemPrompt,
          `Analyze this project specification:\n\n${userInput}\n\nProvide your perspective in 2-3 concise paragraphs.`
        );
        
        return {
          agent: type,
          response,
          thinking: `Analyzing from ${config.name}'s perspective...`,
          status: 'complete'
        };
      });

      const perspectives = await Promise.all(agentPromises);
      
      return new Response(
        JSON.stringify({ perspectives }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stage === 'spec') {
      console.log('Generating comprehensive spec...');
      
      const specPrompt = `Based on this project: ${userInput}

Generate a comprehensive technical specification with:
1. Executive Summary
2. Technical Architecture
3. Dependencies & Stack
4. Implementation Phases
5. Risk Assessment
6. Testing Strategy

Format as structured markdown. Be specific and actionable.`;

      const spec = await callGroq(
        "You are a senior technical architect. Create detailed, actionable specifications.",
        specPrompt
      );

      return new Response(
        JSON.stringify({ spec }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stage === 'questions') {
      console.log('Generating clarifying questions...');
      
      const questionsPrompt = `Analyze this project: ${userInput}

Generate the 5 highest-leverage clarifying questions that would most improve the specification.
For each question, explain:
1. The question itself
2. Why it's critical (weight score 1-10)
3. What assumptions it challenges

Also list 5 runner-up questions (6-10) and explain why they didn't make the top 5.

Format as JSON.`;

      const questions = await callGroq(
        "You are an expert at identifying critical unknowns in project specifications.",
        questionsPrompt
      );

      return new Response(
        JSON.stringify({ questions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stage === 'reflection') {
      console.log('Generating self-reflection...');
      
      const reflectionPrompt = `Review this project spec generation: ${userInput}

Provide 3 specific critiques from the user's perspective, as if they were giving you feedback.
Each critique should identify a concrete way the output could be more productive.

Then generate 2 improved prompts:
1. One assuming the current output is unsatisfactory
2. One assuming it's satisfactory and exploring the next logical step

Aim for 10-20x improvement in clarity and value.`;

      const reflection = await callGroq(
        "You are a critical reviewer focused on continuous improvement.",
        reflectionPrompt
      );

      return new Response(
        JSON.stringify({ reflection }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid stage');

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
