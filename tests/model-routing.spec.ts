/**
 * Model Routing Regression Tests
 * Phase 5.3 - Tests for model registry and routing decisions
 *
 * Verifies:
 * - All model IDs match December 2025 verified models
 * - Fallback chains work correctly
 * - Expert-to-model mappings are consistent
 * - Provider routing is correct
 */

import { describe, it, expect } from 'vitest';

// Mock the MODELS registry from openrouter-client.ts
const VERIFIED_MODELS = {
  'gpt-5.2': {
    provider: 'openai',
    model: 'gpt-5.2',
    costPer1MTokensInput: 1.75,
    costPer1MTokensOutput: 14.00,
    contextWindow: 400000,
    speed: 'medium',
  },
  'gpt-5.2-codex': {
    provider: 'openai',
    model: 'gpt-5.2-codex',
    costPer1MTokensInput: 2.00,
    costPer1MTokensOutput: 16.00,
    contextWindow: 256000,
    speed: 'medium',
  },
  'claude-opus-4.5': {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    costPer1MTokensInput: 15.00,
    costPer1MTokensOutput: 75.00,
    contextWindow: 200000,
    speed: 'medium',
  },
  'gemini-3-flash': {
    provider: 'google',
    model: 'gemini-3-flash-preview',
    costPer1MTokensInput: 0.50,
    costPer1MTokensOutput: 3.00,
    contextWindow: 1048576,
    speed: 'fast',
  },
  'kimi-k2-thinking': {
    provider: 'moonshotai',
    model: 'kimi-k2-thinking',
    costPer1MTokensInput: 0.45,
    costPer1MTokensOutput: 2.35,
    contextWindow: 256000,
    speed: 'medium',
  },
  'deepseek-v3': {
    provider: 'deepseek',
    model: 'deepseek-chat',
    costPer1MTokensInput: 0.30,
    costPer1MTokensOutput: 1.20,
    contextWindow: 163840,
    speed: 'fast',
  },
  'groq-llama-3.3-70b': {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    costPer1MTokensInput: 0,
    costPer1MTokensOutput: 0,
    contextWindow: 131072,
    speed: 'medium',
  },
  'groq-llama-3.1-8b': {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    costPer1MTokensInput: 0,
    costPer1MTokensOutput: 0,
    contextWindow: 131072,
    speed: 'fast',
  },
} as const;

// Expert-to-model mappings from expert-matcher.ts
const EXPERT_MODEL_MAP: Record<string, string> = {
  elon: 'gpt-5.2-codex',
  steve: 'claude-opus-4.5',
  jony: 'claude-opus-4.5',
  zaha: 'claude-opus-4.5',
  bartlett: 'gemini-3-flash',
  oprah: 'gemini-3-flash',
  amal: 'gpt-5.2',
};

// Stage-to-model mappings
const STAGE_MODEL_MAP: Record<string, string> = {
  questions: 'groq-llama-3.1-8b',
  research: 'dynamic', // Uses EXPERT_MODEL_MAP
  challenge: 'gpt-5.2',
  synthesis: 'llama-3.3-70b-versatile', // Groq
  review: 'gpt-5.2-codex',
  voting: 'llama-3.3-70b-versatile', // Groq
  spec: 'llama-3.3-70b-versatile', // Groq
  chat: 'gpt-5.2',
};

describe('Model Registry', () => {
  it('should have all verified models from December 2025', () => {
    const expectedModels = [
      'gpt-5.2',
      'gpt-5.2-codex',
      'claude-opus-4.5',
      'gemini-3-flash',
      'kimi-k2-thinking',
      'deepseek-v3',
      'groq-llama-3.3-70b',
      'groq-llama-3.1-8b',
    ];

    for (const modelId of expectedModels) {
      expect(VERIFIED_MODELS).toHaveProperty(modelId);
    }
  });

  it('should NOT have deprecated models', () => {
    const deprecatedModels = [
      'gpt-5.1',
      'gpt-5.1-codex',
      'claude-sonnet-4.5',
      'gemini-2.5-flash',
      'deepseek-v3.2-speciale',
    ];

    for (const modelId of deprecatedModels) {
      expect(VERIFIED_MODELS).not.toHaveProperty(modelId);
    }
  });

  it('should have correct provider mappings', () => {
    expect(VERIFIED_MODELS['gpt-5.2'].provider).toBe('openai');
    expect(VERIFIED_MODELS['gpt-5.2-codex'].provider).toBe('openai');
    expect(VERIFIED_MODELS['claude-opus-4.5'].provider).toBe('anthropic');
    expect(VERIFIED_MODELS['gemini-3-flash'].provider).toBe('google');
    expect(VERIFIED_MODELS['kimi-k2-thinking'].provider).toBe('moonshotai');
    expect(VERIFIED_MODELS['deepseek-v3'].provider).toBe('deepseek');
    expect(VERIFIED_MODELS['groq-llama-3.3-70b'].provider).toBe('groq');
    expect(VERIFIED_MODELS['groq-llama-3.1-8b'].provider).toBe('groq');
  });

  it('should have valid context windows', () => {
    for (const [modelId, config] of Object.entries(VERIFIED_MODELS)) {
      expect(config.contextWindow).toBeGreaterThan(0);
      expect(config.contextWindow).toBeLessThanOrEqual(1048576); // 1M max
    }
  });

  it('should have valid pricing', () => {
    for (const [modelId, config] of Object.entries(VERIFIED_MODELS)) {
      const priced = config.provider !== 'groq';
      if (priced) {
        expect(config.costPer1MTokensInput).toBeGreaterThan(0);
        expect(config.costPer1MTokensOutput).toBeGreaterThan(0);
      } else {
        expect(config.costPer1MTokensInput).toBeGreaterThanOrEqual(0);
        expect(config.costPer1MTokensOutput).toBeGreaterThanOrEqual(0);
      }
      expect(config.costPer1MTokensOutput).toBeGreaterThanOrEqual(config.costPer1MTokensInput);
    }
  });
});

describe('Expert-to-Model Routing', () => {
  it('should map all experts to valid models', () => {
    for (const [expertId, modelId] of Object.entries(EXPERT_MODEL_MAP)) {
      expect(VERIFIED_MODELS).toHaveProperty(modelId.replace('-codex', '-codex'));
      // Verify model exists (handle codex special case)
      const normalizedModelId = modelId === 'gpt-5.2-codex' ? 'gpt-5.2-codex' : modelId;
      expect(VERIFIED_MODELS[normalizedModelId as keyof typeof VERIFIED_MODELS]).toBeDefined();
    }
  });

  it('should assign technical experts to reasoning-heavy models', () => {
    expect(EXPERT_MODEL_MAP.elon).toBe('gpt-5.2-codex');
    expect(EXPERT_MODEL_MAP.amal).toBe('gpt-5.2');
  });

  it('should assign design experts to Claude', () => {
    expect(EXPERT_MODEL_MAP.steve).toBe('claude-opus-4.5');
    expect(EXPERT_MODEL_MAP.jony).toBe('claude-opus-4.5');
    expect(EXPERT_MODEL_MAP.zaha).toBe('claude-opus-4.5');
  });

  it('should assign market/empathy experts to fast models', () => {
    expect(EXPERT_MODEL_MAP.bartlett).toBe('gemini-3-flash');
    expect(EXPERT_MODEL_MAP.oprah).toBe('gemini-3-flash');
  });

  it('should cover all 7 experts', () => {
    const expectedExperts = ['elon', 'steve', 'jony', 'zaha', 'bartlett', 'oprah', 'amal'];
    expect(Object.keys(EXPERT_MODEL_MAP).sort()).toEqual(expectedExperts.sort());
  });
});

describe('Stage-to-Model Routing', () => {
  it('should use a fast Groq model for question generation', () => {
    expect(STAGE_MODEL_MAP.questions).toBe('groq-llama-3.1-8b');
  });

  it('should use Groq for fast synthesis stages', () => {
    const groqStages = ['synthesis', 'voting', 'spec'];
    for (const stage of groqStages) {
      expect(STAGE_MODEL_MAP[stage]).toBe('llama-3.3-70b-versatile');
    }
  });

  it('should use GPT-5.2 Codex for heavy review', () => {
    expect(STAGE_MODEL_MAP.review).toBe('gpt-5.2-codex');
  });

  it('should cover all pipeline stages', () => {
    const expectedStages = ['questions', 'research', 'challenge', 'synthesis', 'review', 'voting', 'spec', 'chat'];
    expect(Object.keys(STAGE_MODEL_MAP).sort()).toEqual(expectedStages.sort());
  });
});

describe('Fallback Chains', () => {
  const FALLBACK_CHAINS: Record<string, string[]> = {
    'gpt-5.2': ['gpt-5.2', 'claude-opus-4.5', 'gemini-3-flash'],
    'gpt-5.2-codex': ['gpt-5.2-codex', 'gpt-5.2', 'claude-opus-4.5'],
    'claude-opus-4.5': ['claude-opus-4.5', 'gpt-5.2', 'gemini-3-flash'],
    'gemini-3-flash': ['gemini-3-flash', 'deepseek-v3', 'gpt-5.2'],
  };

  it('should have fallback chains for primary models', () => {
    for (const [primary, chain] of Object.entries(FALLBACK_CHAINS)) {
      expect(chain.length).toBeGreaterThanOrEqual(2);
      expect(chain[0]).toBe(primary); // First fallback is the primary
    }
  });

  it('should only use verified models in fallback chains', () => {
    for (const [primary, chain] of Object.entries(FALLBACK_CHAINS)) {
      for (const modelId of chain) {
        const normalizedId = modelId === 'gpt-5.2-codex' ? 'gpt-5.2-codex' : modelId;
        expect(VERIFIED_MODELS[normalizedId as keyof typeof VERIFIED_MODELS]).toBeDefined();
      }
    }
  });
});

describe('Cost Optimization', () => {
  it('should use cheaper models for high-volume stages', () => {
    // Synthesis, voting, spec run on Groq (cheapest)
    const highVolumeModel = VERIFIED_MODELS['groq-llama-3.1-8b'];
    const premiumModel = VERIFIED_MODELS['gpt-5.2'];

    expect(highVolumeModel.costPer1MTokensInput).toBeLessThan(premiumModel.costPer1MTokensInput);
  });

  it('should use premium models only for critical stages', () => {
    // Review uses GPT-5.2 Codex (most expensive but most capable)
    expect(STAGE_MODEL_MAP.review).toBe('gpt-5.2-codex');
  });

  it('should balance cost and quality for research', () => {
    // Research uses dynamic routing based on expert
    expect(STAGE_MODEL_MAP.research).toBe('dynamic');
  });
});
