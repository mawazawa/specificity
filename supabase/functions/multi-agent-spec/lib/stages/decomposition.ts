import { corsHeaders } from '../utils/api.ts';
import { callOpenRouter } from '../../../lib/openrouter-client.ts';
import { ImplementationTicket } from '../types.ts';
import { trackPromptUsage } from '../../../lib/prompt-service.ts';

const DECOMPOSITION_MODEL = 'gpt-5.2';

const DECOMPOSITION_PROMPT = `
You are a Senior Technical Project Manager and Architect.
Your task is to decompose the provided Technical Specification into atomic, actionable Implementation Tickets.

INPUT:
A complete technical specification.

OUTPUT:
A JSON array of Implementation Tickets.

Each ticket must follow this structure:
{
  "id": "TICKET-1",
  "title": "Title of the task",
  "type": "feature" | "bug" | "chore" | "refactor" | "setup" | "test",
  "description": "Detailed implementation steps...",
  "complexity": "S" | "M" | "L" | "XL",
  "dependencies": ["TICKET-ID"],
  "acceptance_criteria": ["Given...", "When...", "Then..."],
  "files_to_create": ["path/to/file"],
  "files_to_modify": ["path/to/file"]
}

RULES:
1. Break down large features into smaller tasks.
2. Ensure dependencies are logically ordered (e.g., database schema before API endpoint).
3. Include setup tasks (e.g., project initialization, CI/CD setup).
4. Include testing tasks.
5. Complexity estimation:
   - S: < 2 hours
   - M: 2-4 hours
   - L: 1-2 days
   - XL: > 2 days (Consider breaking these down further if possible)
6. IDs should be sequential (TICKET-1, TICKET-2, etc.).

Analyze the specification and generate the complete list of tickets.
`;

export const handleDecompositionStage = async (specContent: string) => {
    console.log('[Decomposition] Starting atomic decomposition...');
    const start = Date.now();

    const response = await callOpenRouter({
        model: DECOMPOSITION_MODEL,
        messages: [
            { role: 'system', content: DECOMPOSITION_PROMPT },
            { role: 'user', content: specContent }
        ],
        temperature: 0.2, // Low temperature for consistent output
        maxTokens: 4000,
        responseFormat: 'json'
    });

    await trackPromptUsage('decomposition', {
        latency_ms: Date.now() - start,
        model_used: DECOMPOSITION_MODEL
    });

    let tickets: ImplementationTicket[] = [];
    try {
        // Use flexible regex that handles uppercase JSON, missing newlines, and extra whitespace
        // Pattern matches: ```json, ```JSON, ```Json, or just ``` (no language identifier)
        const codeBlockMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        const jsonContent = codeBlockMatch ? codeBlockMatch[1] : response.content.trim();
        const parsed = JSON.parse(jsonContent);
        // Handle if the model returns { "tickets": [...] } or just [...]
        tickets = Array.isArray(parsed) ? parsed : parsed.tickets || [];
    } catch (e) {
        console.error('[Decomposition] Failed to parse JSON:', e);
    }

    console.log(`[Decomposition] Generated ${tickets.length} tickets`);

    return new Response(
        JSON.stringify({ tickets }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
};
