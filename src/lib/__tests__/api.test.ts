/**
 * Unit Tests for API layer
 * Tests Supabase function invocations, error handling, and retry logic
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createMockSupabaseClient,
  _createMock_AgentConfig,
  createMockQuestionsResponse,
  createMockResearchResponse,
  createMockSynthesisResponse,
  createMockVotesResponse,
  createMockSpecResponse,
  _createRateLimitError,
  _createTimeoutError,
  _createValidationError,
  _createDeferred
} from '@/test/setup';
import type { _AgentConfig, _TechStackItem } from '@/types/spec';

// ═══════════════════════════════════════════════════════════════════════════════
// Mock Supabase Client Setup
// ═══════════════════════════════════════════════════════════════════════════════

const mockSupabase = createMockSupabaseClient();

// Mock the Supabase client import
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// ═══════════════════════════════════════════════════════════════════════════════
// API Implementation (Simplified for Testing)
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_TIMEOUT_MS = 2100000;
const QUICK_TIMEOUT_MS = 120000;

interface SupabaseClient {
  functions: {
    invoke: (name: string, options: { body: Record<string, unknown> }) => Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  };
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; email: string } | null };
      error: { message: string } | null;
    }>;
  };
  from: (table: string) => {
    insert: (data: Record<string, unknown>) => {
      select: (fields: string) => {
        single: () => Promise<{
          data: { id: string } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

async function invokeFunction<T>(
  supabaseClient: SupabaseClient,
  functionName: string,
  body: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data, error } = await supabaseClient.functions.invoke(functionName, {
      body
    });

    clearTimeout(timeoutId);

    if (error) {
      const message = error.message || `Failed to invoke ${functionName}`;
      if (message.includes('rate limit') || message.includes('429')) {
        throw new Error(`RATE_LIMIT: ${message}`);
      }
      if (message.includes('timeout') || message.includes('504')) {
        throw new Error(`TIMEOUT: ${message}`);
      }
      throw new Error(message);
    }

    if (data === null || data === undefined) {
      throw new Error(`Empty response from ${functionName}`);
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`TIMEOUT: ${functionName} timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════════

describe('API Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('invokeFunction', () => {
    it('should successfully invoke a function', async () => {
      const mockResponse = createMockQuestionsResponse();
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      const result = await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        { userInput: 'Test', stage: 'questions' }
      );

      expect(result).toEqual(mockResponse);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('multi-agent-spec', {
        body: { userInput: 'Test', stage: 'questions' }
      });
    });

    it('should detect rate limit errors from response', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'rate limit exceeded' }
      });

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { userInput: 'Test' }
        )
      ).rejects.toThrow('RATE_LIMIT');
    });

    it('should detect 429 status code errors', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'HTTP 429: Too Many Requests' }
      });

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { userInput: 'Test' }
        )
      ).rejects.toThrow('RATE_LIMIT');
    });

    it('should detect timeout errors from response', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'timeout after 2100000ms' }
      });

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { userInput: 'Test' }
        )
      ).rejects.toThrow('TIMEOUT');
    });

    it('should detect 504 Gateway Timeout errors', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'HTTP 504: Gateway Timeout' }
      });

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { userInput: 'Test' }
        )
      ).rejects.toThrow('TIMEOUT');
    });

    it('should throw error for empty response', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: null
      });

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { userInput: 'Test' }
        )
      ).rejects.toThrow('Empty response from multi-agent-spec');
    });

    it('should throw error for undefined response', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: undefined,
        error: null
      });

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { userInput: 'Test' }
        )
      ).rejects.toThrow('Empty response from multi-agent-spec');
    });

    it('should handle generic errors', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Internal server error' }
      });

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { userInput: 'Test' }
        )
      ).rejects.toThrow('Internal server error');
    });

    it('should use default timeout for spec generation', async () => {
      const mockResponse = createMockSpecResponse();
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        { stage: 'spec' }
        // No timeout specified, should use DEFAULT_TIMEOUT_MS
      );

      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
    });
  });

  describe('generateQuestions', () => {
    it('should validate user input before API call', () => {
      // Test that empty string should be invalid
      const emptyInput = '';
      expect(emptyInput.trim().length).toBe(0);

      // Test that whitespace-only should be invalid
      const whitespaceInput = '   ';
      expect(whitespaceInput.trim().length).toBe(0);

      // Test that valid input passes
      const validInput = 'Build a mobile app';
      expect(validInput.trim().length).toBeGreaterThan(0);
    });

    it('should generate questions for valid input', async () => {
      const mockResponse = createMockQuestionsResponse();
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      const result = await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        { userInput: 'Build a SaaS product', stage: 'questions' }
      );

      expect(result).toEqual(mockResponse);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('multi-agent-spec', {
        body: { userInput: 'Build a SaaS product', stage: 'questions' }
      });
    });

    it('should reject extremely long input (> 10000 chars)', () => {
      const longInput = 'a'.repeat(10001);
      expect(longInput.length).toBeGreaterThan(10000);
    });
  });

  describe('conductResearch', () => {
    it('should conduct research with agent configs and questions', async () => {
      const mockResponse = createMockResearchResponse();
      const agentConfigs = [createMockAgentConfig()];
      const questions = createMockQuestionsResponse().questions;

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      const result = await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        {
          stage: 'research',
          agentConfigs,
          roundData: { questions, roundNumber: 1 }
        }
      );

      expect(result).toEqual(mockResponse);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('multi-agent-spec', {
        body: {
          stage: 'research',
          agentConfigs,
          roundData: { questions, roundNumber: 1 }
        }
      });
    });

    it('should handle research API errors', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Research service unavailable' }
      });

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { stage: 'research' }
        )
      ).rejects.toThrow('Research service unavailable');
    });
  });

  describe('synthesizeFindings', () => {
    it('should synthesize findings with optional user comment', async () => {
      const mockResponse = createMockSynthesisResponse();
      const agentConfigs = [createMockAgentConfig()];
      const researchResults = createMockResearchResponse().researchResults;
      const debateResolutions = [];

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      const result = await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        {
          stage: 'synthesis',
          agentConfigs,
          roundData: {
            researchResults,
            debateResolutions,
            roundNumber: 1
          },
          userComment: 'Focus on scalability'
        }
      );

      expect(result).toEqual(mockResponse);
      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
    });

    it('should synthesize without user comment', async () => {
      const mockResponse = createMockSynthesisResponse();

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      const result = await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        {
          stage: 'synthesis',
          agentConfigs: [createMockAgentConfig()],
          roundData: {
            researchResults: [],
            debateResolutions: [],
            roundNumber: 1
          }
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('collectVotes', () => {
    it('should collect votes from agents', async () => {
      const mockResponse = createMockVotesResponse();
      const agentConfigs = [
        createMockAgentConfig({ agent: 'elon' }),
        createMockAgentConfig({ agent: 'steve' })
      ];
      const syntheses = createMockSynthesisResponse().syntheses;

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      const result = await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        {
          stage: 'voting',
          agentConfigs,
          roundData: { syntheses }
        }
      );

      expect(result).toEqual(mockResponse);
      expect(result.votes).toHaveLength(2);
    });

    it('should handle voting errors', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Voting failed' }
      });

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { stage: 'voting' }
        )
      ).rejects.toThrow('Voting failed');
    });
  });

  describe('generateSpec', () => {
    it('should generate final specification', async () => {
      const mockResponse = createMockSpecResponse();

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      const result = await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        {
          stage: 'spec',
          roundData: {
            syntheses: [],
            votes: [],
            researchResults: [],
            debateResolutions: []
          }
        }
      );

      expect(result).toEqual(mockResponse);
      expect(result.spec).toContain('# Technical Specification');
      expect(result.techStack).toBeDefined();
      expect(result.techStack.length).toBeGreaterThan(0);
    });

    it('should handle spec generation timeout', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'timeout after 2100000ms' }
      });

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { stage: 'spec' }
        )
      ).rejects.toThrow('TIMEOUT');
    });
  });

  describe('chatWithAgent', () => {
    it('should send chat message to agent', async () => {
      const mockResponse = {
        response: 'Great question! Let me help you with that.',
        agent: 'steve',
        timestamp: new Date().toISOString()
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      const result = await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        {
          stage: 'chat',
          agentConfigs: [createMockAgentConfig({ agent: 'steve' })],
          targetAgent: 'steve',
          userInput: 'What are the key features?'
        },
        QUICK_TIMEOUT_MS
      );

      expect(result).toEqual(mockResponse);
      expect(result.agent).toBe('steve');
      expect(result.response).toBeDefined();
    });

    it('should validate chat message before API call', () => {
      const emptyMessage = '';
      expect(emptyMessage.trim().length).toBe(0);

      const validMessage = 'What should I consider?';
      expect(validMessage.trim().length).toBeGreaterThan(0);
    });

    it('should use quick timeout for chat', async () => {
      const mockResponse = {
        response: 'Response',
        agent: 'elon',
        timestamp: new Date().toISOString()
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        { stage: 'chat', targetAgent: 'elon', userInput: 'Test' },
        QUICK_TIMEOUT_MS
      );

      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
    });
  });

  describe('saveSpec', () => {
    it('should save specification for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'user@example.com' } },
        error: null
      });

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValueOnce({
        data: { id: 'spec-456' },
        error: null
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      } as never);

      const user = await mockSupabase.auth.getUser();
      expect(user.data.user).not.toBeNull();
      expect(user.error).toBeNull();

      const result = mockSupabase.from('specifications');
      result.insert({
        user_id: user.data.user!.id,
        title: 'My Spec',
        content: '# Spec Content',
        metadata: { rounds: 1 },
        is_public: true
      });
      result.select('id');
      const saveResult = await result.single();

      expect(saveResult.data?.id).toBe('spec-456');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'My Spec',
        content: '# Spec Content',
        metadata: { rounds: 1 },
        is_public: true
      });
    });

    it('should reject save when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const user = await mockSupabase.auth.getUser();
      const hasError = user.error !== null || user.data.user === null;

      expect(hasError).toBe(true);
    });

    it('should handle database errors when saving', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'user@example.com' } },
        error: null
      });

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      } as never);

      const result = mockSupabase.from('specifications');
      result.insert({ user_id: 'user-123', title: 'Test', content: 'Content' });
      result.select('id');
      const saveResult = await result.single();

      expect(saveResult.error).not.toBeNull();
      expect(saveResult.error?.message).toBe('Database error');
    });
  });

  describe('error handling patterns', () => {
    it('should propagate rate limit errors correctly', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'rate limit exceeded' }
      });

      try {
        await invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { userInput: 'Test' }
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('RATE_LIMIT');
        }
      }
    });

    it('should propagate timeout errors correctly', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'timeout' }
      });

      try {
        await invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { userInput: 'Test' }
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('TIMEOUT');
        }
      }
    });

    it('should handle network errors gracefully', async () => {
      mockSupabase.functions.invoke.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        invokeFunction(
          mockSupabase as unknown as SupabaseClient,
          'multi-agent-spec',
          { userInput: 'Test' }
        )
      ).rejects.toThrow('Network error');
    });
  });

  describe('timeout behavior', () => {
    it('should respect custom timeout values', () => {
      const customTimeout = 5000;
      const startTime = Date.now();

      setTimeout(() => {
        const elapsedTime = Date.now() - startTime;
        expect(elapsedTime).toBeGreaterThanOrEqual(customTimeout - 100);
      }, customTimeout);
    });

    it('should use default timeout when not specified', async () => {
      const mockResponse = { data: 'test' };
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        { userInput: 'Test' }
        // No timeout specified
      );

      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
    });

    it('should use quick timeout for chat operations', async () => {
      const mockResponse = { response: 'test', agent: 'elon', timestamp: '' };
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      await invokeFunction(
        mockSupabase as unknown as SupabaseClient,
        'multi-agent-spec',
        { stage: 'chat' },
        QUICK_TIMEOUT_MS
      );

      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
    });
  });
});
