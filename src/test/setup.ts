/**
 * Test Setup Utilities
 * Provides mock implementations and test helpers for Vitest tests
 */

import { vi } from 'vitest';
import type { AgentConfig, Round, TechStackItem } from '@/types/spec';
import type { DialogueEntry } from '@/hooks/spec-generation/use-dialogue';

// ═══════════════════════════════════════════════════════════════════════════════
// Mock Data Factories
// ═══════════════════════════════════════════════════════════════════════════════

export function createMockAgentConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  return {
    agent: 'elon',
    role: 'Visionary',
    enabled: true,
    ...overrides
  };
}

export function createMockRound(overrides: Partial<Round> = {}): Round {
  return {
    roundNumber: 1,
    stage: 'questions',
    questions: [],
    research: [],
    answers: [],
    votes: [],
    status: 'in-progress',
    ...overrides
  };
}

export function createMockDialogueEntry(overrides: Partial<DialogueEntry> = {}): DialogueEntry {
  return {
    agent: 'elon',
    message: 'Test message',
    timestamp: new Date().toISOString(),
    type: 'discussion',
    ...overrides
  };
}

export function createMockTechStack(): TechStackItem[] {
  return [
    { name: 'React', category: 'Frontend', selected: true },
    { name: 'TypeScript', category: 'Language', selected: true },
    { name: 'Tailwind CSS', category: 'Styling', selected: true }
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock Supabase Client
// ═══════════════════════════════════════════════════════════════════════════════

export function createMockSupabaseClient() {
  const mockFunctions = {
    invoke: vi.fn().mockResolvedValue({ data: {}, error: null })
  };

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    }),
    signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null })
  };

  const mockFrom = vi.fn((table: string) => ({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'test-spec-id' }, error: null }),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis()
  }));

  return {
    functions: mockFunctions,
    auth: mockAuth,
    from: mockFrom
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock API Responses
// ═══════════════════════════════════════════════════════════════════════════════

export function createMockQuestionsResponse() {
  return {
    questions: [
      {
        id: '1',
        question: 'What is the target market?',
        category: 'market'
      },
      {
        id: '2',
        question: 'What are the key features?',
        category: 'features'
      }
    ]
  };
}

export function createMockResearchResponse() {
  return {
    researchResults: [
      {
        agent: 'elon',
        findings: ['Finding 1', 'Finding 2'],
        sources: ['https://example.com/1']
      }
    ],
    metadata: {
      researchModel: 'groq/llama-3.3-70b',
      latencyMs: 1000,
      agentsParticipated: 1,
      questionsResearched: 2
    }
  };
}

export function createMockSynthesisResponse() {
  return {
    syntheses: [
      {
        agent: 'elon',
        synthesis: 'This is a synthesis of the research findings.',
        confidence: 0.9
      }
    ],
    metadata: {
      synthesisModel: 'groq/llama-3.3-70b',
      latencyMs: 2000,
      agentsSynthesized: 1
    }
  };
}

export function createMockVotesResponse() {
  return {
    votes: [
      {
        agent: 'elon',
        approved: true,
        reasoning: 'Good synthesis'
      },
      {
        agent: 'steve',
        approved: true,
        reasoning: 'Solid work'
      }
    ]
  };
}

export function createMockSpecResponse() {
  return {
    spec: '# Technical Specification\n\n## Overview\n\nThis is a test specification.',
    techStack: createMockTechStack()
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock Hooks
// ═══════════════════════════════════════════════════════════════════════════════

export function createMockToast() {
  return {
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: []
  };
}

export function createMockTasks() {
  return {
    tasks: [],
    addTask: vi.fn(),
    updateTask: vi.fn(),
    resetTasks: vi.fn()
  };
}

export function createMockDialogue() {
  return {
    entries: [],
    addEntry: vi.fn(),
    resetDialogue: vi.fn(),
    setDialogue: vi.fn()
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Wait for next tick (useful for testing async state updates)
 */
export function waitForNextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Wait for condition to be true (with timeout)
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Create a deferred promise for testing async flows
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve: resolve!, reject: reject! };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Error Helpers
// ═══════════════════════════════════════════════════════════════════════════════

export function createRateLimitError() {
  return new Error('RATE_LIMIT: Too many requests. Please try again later.');
}

export function createTimeoutError() {
  return new Error('TIMEOUT: Request timed out after 2100000ms');
}

export function createValidationError(field: string) {
  return new Error(`VALIDATION: Invalid ${field}`);
}

export function createOpenRouterError() {
  return new Error('OPENROUTER: API temporarily unavailable');
}

export function createNetworkError() {
  return new Error('Network error: Failed to fetch');
}
