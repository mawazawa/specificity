/**
 * API utilities for the multi-agent-spec function
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

// Utility: Get user-friendly error message
export const getUserMessage = (error: unknown): string => {
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

/**
 * Groq API call for synthesis/voting/spec stages
 * Model: llama-3.3-70b-versatile (verified via Groq /v1/models)
 */
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_TIMEOUT_MS = Number(Deno.env.get('GROQ_TIMEOUT_MS') || 25000);

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = GROQ_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

export async function callGroq(
    apiKey: string,
    systemPrompt: string,
    userMessage: string,
    temperature: number = 0.7,
    maxTokens: number = 800
): Promise<string> {
    const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
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
        console.error('External API error:', { type: 'api_error', status: response.status, body: errorText });

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
export async function checkRateLimit(
    supabaseUrl: string,
    supabaseKey: string,
    userId: string,
    endpoint: string,
    maxRequests: number = 5
): Promise<{ allowed: boolean; remaining: number }> {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
            p_user_id: userId,
            p_endpoint: endpoint,
            p_max_requests: maxRequests,
            p_window_hours: 1
        });

        if (error) {
            console.error('Rate limit error:', { type: 'rate_limit_error', user_id: userId });
            return { allowed: true, remaining: maxRequests };
        }

        return {
            allowed: data.allowed,
            remaining: data.remaining
        };
    } catch (error) {
        console.error('Rate limit exception:', { type: 'rate_limit_exception', user_id: userId });
        return { allowed: true, remaining: maxRequests };
    }
}

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
