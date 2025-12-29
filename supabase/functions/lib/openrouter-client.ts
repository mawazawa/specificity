/**
 * OpenRouter API Client
 * Provides unified access to multiple AI models via OpenRouter
 */

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'xai' | 'groq' | 'meta' | 'deepseek' | 'moonshotai';
  model: string;
  costPer1MTokensInput: number;
  costPer1MTokensOutput: number;
  strengths: string[];
  contextWindow: number;
  speed: 'fast' | 'medium' | 'slow';
}

/**
 * Model Registry - Single Source of Truth
 * Last Verified: December 23, 2025 via Exa search + Evidence Ledger
 * Evidence Ledger: docs/reports/model-evidence-ledger-2025-12-19.md
 *
 * Verified Models (11 total):
 * - gpt-5.2, gpt-5.2-codex (OpenAI)
 * - claude-opus-4.5 (Anthropic)
 * - gemini-3-flash (Google)
 * - deepseek-v3, deepseek-v3.2, deepseek-v3.2-speciale (DeepSeek)
 * - kimi-k2-thinking (MoonshotAI)
 * - groq-llama-3.3-70b, groq-llama-3.1-8b (Groq)
 */
export const MODELS: Record<string, ModelConfig> = {
  // ═══════════════════════════════════════════════════════════════
  // VERIFIED MODELS (Dec 19, 2025)
  // ═══════════════════════════════════════════════════════════════

  'gpt-5.2': {
    provider: 'openai',
    model: 'gpt-5.2', // OpenRouter: openai/gpt-5.2
    costPer1MTokensInput: 1.75, // Verified Dec 19, 2025
    costPer1MTokensOutput: 14.00,
    strengths: ['reasoning', 'meta-cognition', 'math', 'creativity', 'agentic'],
    contextWindow: 400000, // Verified: 400K context
    speed: 'medium'
  },

  'gpt-5.2-codex': {
    provider: 'openai',
    model: 'gpt-5.2-codex', // OpenRouter: openai/gpt-5.2-codex (API rolling out Dec 2025)
    costPer1MTokensInput: 2.00, // Estimated - API not fully available
    costPer1MTokensOutput: 15.00,
    strengths: ['coding', 'architecture', 'refactoring', 'security', 'agentic'],
    contextWindow: 400000,
    speed: 'medium'
  },

  'claude-opus-4.5': {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101', // OpenRouter: anthropic/claude-opus-4-5-20251101
    costPer1MTokensInput: 15.00,
    costPer1MTokensOutput: 75.00,
    strengths: ['nuance', 'writing', 'complex_instruction_following'],
    contextWindow: 200000,
    speed: 'slow'
  },

  'gemini-3-flash': {
    provider: 'google',
    model: 'gemini-3-flash-preview', // OpenRouter: google/gemini-3-flash-preview
    costPer1MTokensInput: 0.50, // Verified Dec 19, 2025
    costPer1MTokensOutput: 3.00,
    strengths: ['speed', 'multimodal', 'huge_context', 'agentic'],
    contextWindow: 1048576, // Verified: 1M context
    speed: 'fast'
  },

  'deepseek-v3': {
    provider: 'deepseek',
    model: 'deepseek-chat', // OpenRouter: deepseek/deepseek-chat (V3)
    costPer1MTokensInput: 0.30, // Verified Dec 19, 2025
    costPer1MTokensOutput: 1.20,
    strengths: ['balanced', 'efficiency', 'general_purpose', 'coding'],
    contextWindow: 163840,
    speed: 'fast'
  },

  'kimi-k2-thinking': {
    provider: 'moonshotai',
    model: 'kimi-k2-thinking', // OpenRouter: moonshotai/kimi-k2-thinking
    costPer1MTokensInput: 0.45, // Verified Dec 19, 2025
    costPer1MTokensOutput: 2.35,
    strengths: ['chain_of_thought', 'self_correction', 'planning', 'tool_use'],
    contextWindow: 262144, // 256K context
    speed: 'slow'
  },

  'groq-llama-3.3-70b': {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile', // Groq API: llama-3.3-70b-versatile
    costPer1MTokensInput: 0, // Pricing TBD - verify via Groq pricing
    costPer1MTokensOutput: 0,
    strengths: ['reasoning', 'synthesis', 'general_purpose'],
    contextWindow: 131072,
    speed: 'medium'
  },

  'groq-llama-3.1-8b': {
    provider: 'groq',
    model: 'llama-3.1-8b-instant', // Groq API: llama-3.1-8b-instant
    costPer1MTokensInput: 0, // Pricing TBD - verify via Groq pricing
    costPer1MTokensOutput: 0,
    strengths: ['speed', 'cost', 'general_purpose'],
    contextWindow: 131072,
    speed: 'fast'
  },

  // ═══════════════════════════════════════════════════════════════
  // DEEPSEEK V3.2 MODELS (Verified Dec 20, 2025)
  // ═══════════════════════════════════════════════════════════════

  'deepseek-v3.2': {
    provider: 'deepseek',
    model: 'deepseek-v3.2', // OpenRouter: deepseek/deepseek-v3.2
    costPer1MTokensInput: 0.27, // Verified Dec 20, 2025
    costPer1MTokensOutput: 0.41,
    strengths: ['reasoning', 'tool_use', 'agentic', 'coding'],
    contextWindow: 163840,
    speed: 'fast'
  },

  'deepseek-v3.2-speciale': {
    provider: 'deepseek',
    model: 'deepseek-v3.2-speciale', // OpenRouter: deepseek/deepseek-v3.2-speciale
    costPer1MTokensInput: 0.27, // Verified Dec 20, 2025
    costPer1MTokensOutput: 0.41,
    strengths: ['complex_reasoning', 'math', 'competitions', 'gold_medal_level'],
    contextWindow: 163840,
    speed: 'medium' // Higher compute, slightly slower
  }

  // NOTE: claude-opus-4.5 is the correct name (not "octopus")
};

// Fallback model if preferred model fails
export const FALLBACK_MODEL = 'groq-llama-3.1-8b';

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

const REQUEST_TIMEOUT_MS = 25000;
const DEFAULT_GROQ_MODEL = FALLBACK_MODEL;

/**
 * Fetch with an abort timeout to prevent edge function hangs.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function resolveGroqModel(params: LLMCallParams): { modelId: string; modelName: string; config: ModelConfig } {
  const requested = MODELS[params.model];
  if (requested && requested.provider === 'groq') {
    return { modelId: params.model, modelName: requested.model, config: requested };
  }

  const fallback = MODELS[DEFAULT_GROQ_MODEL];
  if (!fallback) {
    throw new Error(`Groq fallback model not configured: ${DEFAULT_GROQ_MODEL}`);
  }

  return { modelId: DEFAULT_GROQ_MODEL, modelName: fallback.model, config: fallback };
}

/**
 * Call Groq API directly using a supported Groq model.
 */
async function callGroqModel(params: LLMCallParams): Promise<LLMResponse> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

  if (!GROQ_API_KEY) {
    throw new Error('Neither OPENROUTER_API_KEY nor GROQ_API_KEY is configured');
  }

  const { modelId, modelName, config } = resolveGroqModel(params);

  const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = (
    (inputTokens / 1_000_000) * config.costPer1MTokensInput +
    (outputTokens / 1_000_000) * config.costPer1MTokensOutput
  );

  const firstChoice = data.choices?.[0];
  if (!firstChoice?.message?.content) {
    throw new Error('Invalid response from Groq API: missing content');
  }

  return {
    content: firstChoice.message.content,
    usage: {
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens: data.usage?.total_tokens || (inputTokens + outputTokens)
    },
    cost,
    model: modelId,
    provider: 'groq'
  };
}

/**
 * Call OpenRouter API with automatic fallback
 */
export async function callOpenRouter(params: LLMCallParams): Promise<LLMResponse> {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  const modelConfig = MODELS[params.model];

  if (modelConfig?.provider === 'groq') {
    return callGroqModel(params);
  }

  // Fallback to Groq if OpenRouter not configured
  if (!OPENROUTER_API_KEY) {
    console.warn('[OpenRouter] API key not found, falling back to Groq');
    return callGroqModel(params);
  }

  if (!modelConfig) {
    console.warn(`[OpenRouter] Unknown model: ${params.model}, using fallback`);
    return callOpenRouter({ ...params, model: FALLBACK_MODEL });
  }

  try {
    const openRouterModel = `${modelConfig.provider}/${modelConfig.model}`;

    const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
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
      return callGroqModel({ ...params, model: FALLBACK_MODEL });
    }

    const data = await response.json();

    // Calculate cost
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const cost = (
      (inputTokens / 1_000_000) * modelConfig.costPer1MTokensInput +
      (outputTokens / 1_000_000) * modelConfig.costPer1MTokensOutput
    );

    const firstChoice = data.choices?.[0];
    if (!firstChoice?.message?.content) {
      throw new Error('Invalid response from OpenRouter API: missing content');
    }

    return {
      content: firstChoice.message.content,
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
    return callGroqModel({ ...params, model: FALLBACK_MODEL });
  }
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

      console.info(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
