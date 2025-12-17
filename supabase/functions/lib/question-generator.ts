import { callOpenRouter, retryWithBackoff } from './openrouter-client.ts';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { Prompts } from './prompts.ts';

export const ResearchQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  domain: z.enum(['technical', 'design', 'market', 'legal', 'growth', 'security']),
  priority: z.number().int().min(1).max(10),
  requiredExpertise: z.array(z.string()),
});

export type ResearchQuestion = z.infer<typeof ResearchQuestionSchema>;

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

  const systemPrompt = Prompts.Questions.system(count);
  const userPrompt = Prompts.Questions.user(userInput, count);

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
