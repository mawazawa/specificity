import { generateDynamicQuestions } from '../../../lib/question-generator.ts';
import { corsHeaders } from '../utils/api.ts';

const QUESTIONS_MODEL = Deno.env.get('QUESTIONS_MODEL')
    || (Deno.env.get('OPENROUTER_API_KEY') ? 'gpt-5.2' : 'groq-llama-3.1-8b');

export const handleQuestionsStage = async (cleanInput: string) => {
    console.info('[Enhanced] Generating dynamic research questions...');

    const questions = await generateDynamicQuestions(cleanInput, {
        model: QUESTIONS_MODEL,
        count: 7
    });

    console.info(`[Enhanced] Generated ${questions.length} questions`);

    return new Response(
        JSON.stringify({ questions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
};
