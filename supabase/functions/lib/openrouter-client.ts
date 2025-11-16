/**
 * OpenRouter API Client
 * Provides unified access to multiple AI models via OpenRouter
 */

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'xai' | 'groq' | 'meta';
  model: string;
  costPer1MTokensInput: number;
  costPer1MTokensOutput: number;
  strengths: string[];
  contextWindow: number;
  speed: 'fast' | 'medium' | 'slow';
}

export const MODELS: Record<string, ModelConfig> = {
  'gpt-5.1': {
    provider: 'openai',
    model: 'gpt-5.1',
    costPer1MTokensInput: 10,
    costPer1MTokensOutput: 30,
    strengths: ['reasoning', 'meta-cognition', 'math'],
    contextWindow: 128000,
    speed: 'medium'
  },
  'gpt-5.1-codex': {
    provider: 'openai',
    model: 'gpt-5.1-codex',
    costPer1MTokensInput: 10,
    costPer1MTokensOutput: 30,
    strengths: ['coding', 'architecture', 'technical_writing'],
    contextWindow: 128000,
    speed: 'medium'
  },
  'claude-sonnet-4.5': {
    provider: 'anthropic',
    model: 'claude-sonnet-4.5-20250929',
    costPer1MTokensInput: 3,
    costPer1MTokensOutput: 15,
    strengths: ['coding', 'reasoning', 'nuance'],
    contextWindow: 200000,
    speed: 'medium'
  },
  'gemini-2.5-flash': {
    provider: 'google',
    model: 'gemini-2.5-flash',
    costPer1MTokensInput: 0.075,
    costPer1MTokensOutput: 0.30,
    strengths: ['speed', 'multimodal', 'long_context'],
    contextWindow: 1000000,
    speed: 'fast'
  },
  'llama-3.3-70b': {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    costPer1MTokensInput: 0.10,
    costPer1MTokensOutput: 0.30,
    strengths: ['speed', 'cost'],
    contextWindow: 8192,
    speed: 'fast'
  }
};

// Fallback model if preferred model fails
export const FALLBACK_MODEL = 'llama-3.3-70b';

export interface LLMCallParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  model: string;
  provider: string;
}

/**
 * Call OpenRouter API with automatic fallback
 */
export async function callOpenRouter(params: LLMCallParams): Promise<LLMResponse> {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

  // Fallback to Groq if OpenRouter not configured
  if (!OPENROUTER_API_KEY) {
    console.warn('[OpenRouter] API key not found, falling back to Groq');
    return callGroqFallback(params);
  }

  const modelConfig = MODELS[params.model];

  if (!modelConfig) {
    console.warn(`[OpenRouter] Unknown model: ${params.model}, using fallback`);
    return callOpenRouter({ ...params, model: FALLBACK_MODEL });
  }

  try {
    const openRouterModel = `${modelConfig.provider}/${modelConfig.model}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://specificity.ai',
        'X-Title': 'Specificity AI'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2000,
        response_format: params.responseFormat === 'json'
          ? { type: 'json_object' }
          : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OpenRouter] API error: ${response.status}`, errorText);

      // Fallback to Groq on error
      console.warn('[OpenRouter] Falling back to Groq due to error');
      return callGroqFallback(params);
    }

    const data = await response.json();

    // Calculate cost
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const cost = (
      (inputTokens / 1_000_000) * modelConfig.costPer1MTokensInput +
      (outputTokens / 1_000_000) * modelConfig.costPer1MTokensOutput
    );

    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: data.usage?.total_tokens || (inputTokens + outputTokens)
      },
      cost,
      model: params.model,
      provider: modelConfig.provider
    };
  } catch (error) {
    console.error('[OpenRouter] Request failed:', error);
    console.warn('[OpenRouter] Falling back to Groq');
    return callGroqFallback(params);
  }
}

/**
 * Fallback to Groq API (always available)
 */
async function callGroqFallback(params: LLMCallParams): Promise<LLMResponse> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

  if (!GROQ_API_KEY) {
    throw new Error('Neither OPENROUTER_API_KEY nor GROQ_API_KEY is configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2000
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = (
    (inputTokens / 1_000_000) * 0.10 +
    (outputTokens / 1_000_000) * 0.30
  );

  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens: inputTokens + outputTokens
    },
    cost,
    model: 'llama-3.3-70b',
    provider: 'groq'
  };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );

      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
