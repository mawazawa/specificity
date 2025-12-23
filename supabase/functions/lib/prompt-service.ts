/**
 * PromptService - Database-backed prompt management with caching and interpolation
 *
 * Replaces hard-coded prompts with database-driven system that supports:
 * - Centralized prompt management
 * - Version control and rollback
 * - Usage tracking and analytics
 * - A/B testing and optimization
 * - Dynamic template variable interpolation
 */

import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const PROMPT_FETCH_TIMEOUT_MS = Number(Deno.env.get('PROMPT_FETCH_TIMEOUT_MS') || 3000);
const PROMPT_USAGE_TIMEOUT_MS = Number(Deno.env.get('PROMPT_USAGE_TIMEOUT_MS') || 2000);

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  version: number;
  category: string;
  metadata: {
    default_count?: number;
    supports_variables?: boolean;
    variables?: string[];
    temperature?: number;
    recommended_model?: string;
    [key: string]: any;
  };
  is_active: boolean;
}

interface UsageMetrics {
  quality_score?: number;
  cost_cents?: number;
  latency_ms?: number;
  model_used?: string;
  tokens_input?: number;
  tokens_output?: number;
}

/**
 * In-memory cache for prompt templates
 * Reduces database queries and improves edge function performance
 */
class PromptCache {
  private cache: Map<string, { prompt: PromptTemplate; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(name: string, prompt: PromptTemplate): void {
    this.cache.set(name, { prompt, timestamp: Date.now() });
  }

  get(name: string): PromptTemplate | null {
    const cached = this.cache.get(name);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(name);
      return null;
    }

    return cached.prompt;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(name: string): void {
    this.cache.delete(name);
  }
}

export class PromptService {
  private supabase: SupabaseClient;
  private cache: PromptCache;
  private sessionId: string | null = null;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    // Use provided credentials or fall back to environment variables
    const url = supabaseUrl || Deno.env.get('SUPABASE_URL')!;
    const key = supabaseKey || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    this.supabase = createClient(url, key);
    this.cache = new PromptCache();
  }

  /**
   * Set the session ID for tracking prompt usage across a workflow
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Get a prompt template by name
   * Uses cache first, falls back to database
   */
  async getPrompt(name: string): Promise<PromptTemplate> {
    // Check cache first
    const cached = this.cache.get(name);
    if (cached) {
      return cached;
    }

    // Query database
    const query = this.supabase
      .from('prompts')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    const { data, error } = await withTimeout(
      query,
      PROMPT_FETCH_TIMEOUT_MS,
      `Prompt fetch timeout for "${name}"`
    );

    if (error) {
      throw new Error(`Failed to load prompt "${name}": ${error.message}`);
    }

    if (!data) {
      throw new Error(`Prompt "${name}" not found or is inactive`);
    }

    // Cache and return
    this.cache.set(name, data);
    return data;
  }

  /**
   * Render a prompt template with variable interpolation
   * Supports {{variable}} syntax for template variables
   */
  async renderPrompt(
    name: string,
    variables: Record<string, any> = {}
  ): Promise<string> {
    const template = await this.getPrompt(name);

    // Simple template variable replacement
    let rendered = template.content;

    // Replace {{variable}} with values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    // Warn if there are unresolved variables
    const unresolvedVars = rendered.match(/{{(\w+)}}/g);
    if (unresolvedVars && unresolvedVars.length > 0) {
      console.warn(
        `[PromptService] Unresolved variables in prompt "${name}":`,
        unresolvedVars
      );
    }

    return rendered;
  }

  /**
   * Track prompt usage for analytics and optimization
   */
  async trackUsage(
    promptName: string,
    metrics: UsageMetrics
  ): Promise<void> {
    try {
      const template = await this.getPrompt(promptName);

      const insertPromise = this.supabase
        .from('prompt_usage')
        .insert({
          prompt_id: template.id,
          version: template.version,
          session_id: this.sessionId,
          quality_score: metrics.quality_score,
          cost_cents: metrics.cost_cents,
          latency_ms: metrics.latency_ms,
          model_used: metrics.model_used,
          tokens_input: metrics.tokens_input,
          tokens_output: metrics.tokens_output,
        });

      const { error } = await withTimeout(
        insertPromise,
        PROMPT_USAGE_TIMEOUT_MS,
        `Prompt usage timeout for "${promptName}"`
      );

      if (error) {
        console.error(`[PromptService] Failed to track usage for "${promptName}":`, error);
      }
    } catch (err) {
      // Don't fail the main operation if tracking fails
      console.error(`[PromptService] Error tracking usage:`, err);
    }
  }

  /**
   * Get all agent prompts for multi-agent workflows
   */
  async getAgentPrompts(): Promise<Map<string, PromptTemplate>> {
    const { data, error } = await this.supabase
      .from('prompts')
      .select('*')
      .eq('category', 'agent')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to load agent prompts: ${error.message}`);
    }

    const agentMap = new Map<string, PromptTemplate>();
    for (const prompt of data || []) {
      // Extract agent ID from name (e.g., "agent_elon" -> "elon")
      const agentId = prompt.name.replace('agent_', '');
      agentMap.set(agentId, prompt);
      // Also cache the prompt
      this.cache.set(prompt.name, prompt);
    }

    return agentMap;
  }

  /**
   * Get all prompts of a specific category
   */
  async getPromptsByCategory(category: string): Promise<PromptTemplate[]> {
    const { data, error } = await this.supabase
      .from('prompts')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to load prompts for category "${category}": ${error.message}`);
    }

    // Cache all prompts
    for (const prompt of data || []) {
      this.cache.set(prompt.name, prompt);
    }

    return data || [];
  }

  /**
   * Clear the prompt cache
   * Useful for development or after prompt updates
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate a specific cached prompt
   */
  invalidateCache(name: string): void {
    this.cache.invalidate(name);
  }
}

/**
 * Create a singleton instance for edge functions
 * Usage: reference `promptService` from `supabase/functions/lib/prompt-service.ts`
 */
export const promptService = new PromptService();

/**
 * Convenience helper for quickly rendering prompts
 * Usage: const prompt = await renderPrompt('question_generation', { count: 7 });
 */
export async function renderPrompt(
  name: string,
  variables: Record<string, any> = {}
): Promise<string> {
  return promptService.renderPrompt(name, variables);
}

/**
 * Convenience helper for tracking prompt usage
 * Usage: await trackPromptUsage('agent_elon', { quality_score: 8.5, cost_cents: 45 });
 */
export async function trackPromptUsage(
  promptName: string,
  metrics: UsageMetrics
): Promise<void> {
  return promptService.trackUsage(promptName, metrics);
}
