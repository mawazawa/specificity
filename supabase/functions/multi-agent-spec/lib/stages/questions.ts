import { generateDynamicQuestions } from '../../lib/question-generator.ts';
import { corsHeaders } from '../utils/api.ts';

export const handleQuestionsStage = async (cleanInput: string) => {
    console.log('[Enhanced] Generating dynamic research questions...');

    const questions = await generateDynamicQuestions(cleanInput, {
        model: 'gpt-5.2', // Verified Dec 19, 2025 (openai/gpt-5.2)
        count: 7
    });

    console.log(`[Enhanced] Generated ${questions.length} questions`);

    return new Response(
        JSON.stringify({ questions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
};
