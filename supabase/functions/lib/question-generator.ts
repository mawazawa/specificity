import { callOpenRouter, retryWithBackoff } from './openrouter-client.ts';

export interface ResearchQuestion {
  id: string;
  question: string;
  domain: 'technical' | 'design' | 'market' | 'legal' | 'growth' | 'security';
  priority: number; // 1-10
  requiredExpertise: string[]; // Expert IDs who should answer this
}

/**
 * Generate dynamic research questions tailored to user input
 */
export async function generateDynamicQuestions(
  userInput: string,
  options: {
    model?: string;
    count?: number;
  } = {}
): Promise<ResearchQuestion[]> {
  const {
    model = 'gpt-5.1',
    count = 7
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

Output ONLY valid JSON (no markdown, no explanation) with this EXACT schema:
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
}

Valid domains: technical, design, market, legal, growth, security
Valid expert IDs: elon, steve, oprah, zaha, jony, bartlett, amal
Priority scale: 1 (low) to 10 (critical)`;

  const userPrompt = `Product Idea: ${userInput}

Generate ${count} research questions that will help create a comprehensive technical specification. Focus on what MUST be researched to create production-ready documentation.`;

  try {
    const response = await retryWithBackoff(
      () => callOpenRouter({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        maxTokens: 2000,
        responseFormat: 'json'
      }),
      {
        maxRetries: 2,
        onRetry: (error, attempt) => {
          console.log(`[QuestionGen] Retry ${attempt} due to:`, error.message);
        }
      }
    );

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response.content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON response');
      }
    }

    // Validate and map questions
    const questions: ResearchQuestion[] = result.questions.map((q: any, index: number) => ({
      id: q.id || `q${index + 1}`,
      question: q.question || 'No question provided',
      domain: q.domain || 'technical',
      priority: Math.max(1, Math.min(10, q.priority || 5)),
      requiredExpertise: Array.isArray(q.requiredExpertise) ? q.requiredExpertise : []
    }));

    console.log(`[QuestionGen] Generated ${questions.length} questions using ${model}`);

    return questions;
  } catch (error) {
    console.error('[QuestionGen] Failed to generate questions:', error);

    // Fallback to generic questions
    console.warn('[QuestionGen] Using fallback generic questions');
    return generateFallbackQuestions(userInput);
  }
}

/**
 * Fallback generic questions when AI generation fails
 */
function generateFallbackQuestions(userInput: string): ResearchQuestion[] {
  return [
    {
      id: 'q1',
      question: `What are the core technical requirements and architecture for: ${userInput}?`,
      domain: 'technical',
      priority: 10,
      requiredExpertise: ['elon', 'jony']
    },
    {
      id: 'q2',
      question: `What are the key UX/design considerations and user workflows for: ${userInput}?`,
      domain: 'design',
      priority: 9,
      requiredExpertise: ['steve', 'jony', 'zaha']
    },
    {
      id: 'q3',
      question: `Who are the main competitors and what is the competitive landscape for: ${userInput}?`,
      domain: 'market',
      priority: 8,
      requiredExpertise: ['bartlett', 'oprah']
    },
    {
      id: 'q4',
      question: `What legal, compliance, and data privacy issues should be considered for: ${userInput}?`,
      domain: 'legal',
      priority: 7,
      requiredExpertise: ['amal']
    },
    {
      id: 'q5',
      question: `What are the scalability challenges and infrastructure requirements for: ${userInput}?`,
      domain: 'technical',
      priority: 8,
      requiredExpertise: ['elon']
    },
    {
      id: 'q6',
      question: `What is the go-to-market strategy and growth roadmap for: ${userInput}?`,
      domain: 'growth',
      priority: 7,
      requiredExpertise: ['bartlett', 'oprah']
    },
    {
      id: 'q7',
      question: `What are the estimated costs, timeline, and resource requirements for building: ${userInput}?`,
      domain: 'market',
      priority: 6,
      requiredExpertise: ['elon', 'bartlett']
    }
  ];
}
