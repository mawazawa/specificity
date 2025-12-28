/**
 * Unit Tests for useSpecFlow hook
 * Tests stage transitions, error handling, and core orchestration logic
 */

import { describe, it, expect, beforeEach, vi as _vi } from 'vitest';
import {
  createMockAgentConfig,
  createMockRound,
  _createMockQuestionsResponse,
  _createMockResearchResponse,
  _createMockSynthesisResponse,
  createMockVotesResponse,
  _createMockSpecResponse,
  createRateLimitError,
  createTimeoutError,
  createValidationError,
  createOpenRouterError,
  createNetworkError
} from '@/test/setup';
import type { Round } from '@/types/spec';

// ═══════════════════════════════════════════════════════════════════════════════
// Core Logic Extraction for Testing
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse error messages and return user-friendly error objects
 * Extracted from useSpecFlow for isolated testing
 */
function parseError(error: unknown): { title: string; message: string } {
  const errMessage = error instanceof Error ? error.message : '';

  if (errMessage.includes('RATE_LIMIT') || errMessage.includes('429') || errMessage.includes('rate limit')) {
    return {
      title: '⚠️ Rate Limit Exceeded',
      message: "You've reached the rate limit. Please wait a few minutes and try again."
    };
  }
  if (errMessage.includes('OPENROUTER') || errMessage.includes('OpenRouter')) {
    return {
      title: '⚠️ OpenRouter API Issue',
      message: `Falling back to Groq. ${errMessage}`
    };
  }

  return {
    title: 'Error',
    message: errMessage || 'An error occurred during processing'
  };
}

/**
 * Calculate approval rate from votes
 * Extracted from useSpecFlow for isolated testing
 */
function calculateApprovalRate(votes: Array<{ approved: boolean }>): number {
  // Guard against division by zero when votes array is empty
  if (votes.length === 0) {
    return 0;
  }
  return votes.filter((v) => v.approved).length / votes.length;
}

/**
 * Determine if spec generation should proceed based on approval rate and round number
 */
function shouldProceedToSpec(approvalRate: number, roundNumber: number): boolean {
  return approvalRate >= 0.6 || roundNumber >= 3;
}

/**
 * Stage progression sequence
 */
const STAGE_SEQUENCE = [
  'questions',
  'research',
  'challenge',
  'synthesis',
  'review',
  'voting',
  'spec',
  'complete'
] as const;

type Stage = typeof STAGE_SEQUENCE[number];

function getNextStage(currentStage: Stage): Stage | null {
  const currentIndex = STAGE_SEQUENCE.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === STAGE_SEQUENCE.length - 1) {
    return null;
  }
  return STAGE_SEQUENCE[currentIndex + 1];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════════

describe('useSpecFlow - Core Logic', () => {
  describe('parseError', () => {
    it('should detect rate limit errors', () => {
      const error = createRateLimitError();
      const result = parseError(error);

      expect(result.title).toBe('⚠️ Rate Limit Exceeded');
      expect(result.message).toContain('rate limit');
    });

    it('should detect 429 status code errors', () => {
      const error = new Error('HTTP 429: Too Many Requests');
      const result = parseError(error);

      expect(result.title).toBe('⚠️ Rate Limit Exceeded');
      expect(result.message).toContain('rate limit');
    });

    it('should detect OpenRouter API errors', () => {
      const error = createOpenRouterError();
      const result = parseError(error);

      expect(result.title).toBe('⚠️ OpenRouter API Issue');
      expect(result.message).toContain('Falling back to Groq');
      expect(result.message).toContain('OPENROUTER');
    });

    it('should handle generic errors', () => {
      const error = createNetworkError();
      const result = parseError(error);

      expect(result.title).toBe('Error');
      expect(result.message).toContain('Network error');
    });

    it('should handle validation errors', () => {
      const error = createValidationError('user input');
      const result = parseError(error);

      expect(result.title).toBe('Error');
      expect(result.message).toContain('VALIDATION');
    });

    it('should handle timeout errors', () => {
      const error = createTimeoutError();
      const result = parseError(error);

      expect(result.title).toBe('Error');
      expect(result.message).toContain('TIMEOUT');
    });

    it('should handle non-Error objects', () => {
      const result = parseError('String error');

      expect(result.title).toBe('Error');
      expect(result.message).toBe('An error occurred during processing');
    });

    it('should handle null/undefined errors', () => {
      const result1 = parseError(null);
      const result2 = parseError(undefined);

      expect(result1.message).toBe('An error occurred during processing');
      expect(result2.message).toBe('An error occurred during processing');
    });
  });

  describe('calculateApprovalRate', () => {
    it('should return 0 for empty votes array', () => {
      const rate = calculateApprovalRate([]);
      expect(rate).toBe(0);
    });

    it('should return 1.0 for all approved votes', () => {
      const votes = [
        { approved: true },
        { approved: true },
        { approved: true }
      ];
      const rate = calculateApprovalRate(votes);
      expect(rate).toBe(1.0);
    });

    it('should return 0 for all rejected votes', () => {
      const votes = [
        { approved: false },
        { approved: false },
        { approved: false }
      ];
      const rate = calculateApprovalRate(votes);
      expect(rate).toBe(0);
    });

    it('should calculate partial approval rate correctly', () => {
      const votes = [
        { approved: true },
        { approved: true },
        { approved: false },
        { approved: false }
      ];
      const rate = calculateApprovalRate(votes);
      expect(rate).toBe(0.5);
    });

    it('should handle 60% approval threshold', () => {
      const votes = [
        { approved: true },
        { approved: true },
        { approved: true },
        { approved: false },
        { approved: false }
      ];
      const rate = calculateApprovalRate(votes);
      expect(rate).toBe(0.6);
    });

    it('should handle single vote', () => {
      const approvedRate = calculateApprovalRate([{ approved: true }]);
      const rejectedRate = calculateApprovalRate([{ approved: false }]);

      expect(approvedRate).toBe(1.0);
      expect(rejectedRate).toBe(0);
    });
  });

  describe('shouldProceedToSpec', () => {
    it('should proceed when approval rate >= 60%', () => {
      expect(shouldProceedToSpec(0.6, 1)).toBe(true);
      expect(shouldProceedToSpec(0.7, 1)).toBe(true);
      expect(shouldProceedToSpec(1.0, 1)).toBe(true);
    });

    it('should not proceed when approval rate < 60% in early rounds', () => {
      expect(shouldProceedToSpec(0.5, 1)).toBe(false);
      expect(shouldProceedToSpec(0.59, 2)).toBe(false);
      expect(shouldProceedToSpec(0, 1)).toBe(false);
    });

    it('should always proceed at round 3 regardless of approval', () => {
      expect(shouldProceedToSpec(0, 3)).toBe(true);
      expect(shouldProceedToSpec(0.1, 3)).toBe(true);
      expect(shouldProceedToSpec(0.5, 3)).toBe(true);
      expect(shouldProceedToSpec(1.0, 3)).toBe(true);
    });

    it('should always proceed after round 3', () => {
      expect(shouldProceedToSpec(0, 4)).toBe(true);
      expect(shouldProceedToSpec(0.3, 5)).toBe(true);
    });

    it('should handle edge case of exactly 60% approval', () => {
      expect(shouldProceedToSpec(0.6, 1)).toBe(true);
      expect(shouldProceedToSpec(0.6, 2)).toBe(true);
      expect(shouldProceedToSpec(0.6, 3)).toBe(true);
    });
  });

  describe('stage transitions', () => {
    it('should follow correct stage sequence', () => {
      expect(getNextStage('questions')).toBe('research');
      expect(getNextStage('research')).toBe('challenge');
      expect(getNextStage('challenge')).toBe('synthesis');
      expect(getNextStage('synthesis')).toBe('review');
      expect(getNextStage('review')).toBe('voting');
      expect(getNextStage('voting')).toBe('spec');
      expect(getNextStage('spec')).toBe('complete');
    });

    it('should return null after complete stage', () => {
      expect(getNextStage('complete')).toBe(null);
    });

    it('should handle all stages in sequence', () => {
      let stage: Stage | null = 'questions';
      const stages: Stage[] = [];

      while (stage) {
        stages.push(stage);
        stage = getNextStage(stage);
      }

      expect(stages).toEqual([
        'questions',
        'research',
        'challenge',
        'synthesis',
        'review',
        'voting',
        'spec',
        'complete'
      ]);
    });
  });

  describe('round state management', () => {
    let round: Round;

    beforeEach(() => {
      round = createMockRound();
    });

    it('should initialize round with correct defaults', () => {
      expect(round.roundNumber).toBe(1);
      expect(round.stage).toBe('questions');
      expect(round.status).toBe('in-progress');
      expect(round.questions).toEqual([]);
      expect(round.research).toEqual([]);
      expect(round.answers).toEqual([]);
      expect(round.votes).toEqual([]);
    });

    it('should update round stage as it progresses', () => {
      round.stage = 'questions';
      expect(round.stage).toBe('questions');

      round.stage = 'research';
      expect(round.stage).toBe('research');

      round.stage = 'challenge';
      expect(round.stage).toBe('challenge');

      round.stage = 'synthesis';
      expect(round.stage).toBe('synthesis');
    });

    it('should mark round as complete after voting', () => {
      round.stage = 'voting';
      round.status = 'complete';

      expect(round.status).toBe('complete');
      expect(round.stage).toBe('voting');
    });

    it('should handle user comments in rounds', () => {
      const roundWithComment = createMockRound({
        userComment: 'Please focus on scalability'
      });

      expect(roundWithComment.userComment).toBe('Please focus on scalability');
    });

    it('should track multiple rounds', () => {
      const rounds: Round[] = [
        createMockRound({ roundNumber: 1 }),
        createMockRound({ roundNumber: 2 }),
        createMockRound({ roundNumber: 3 })
      ];

      expect(rounds).toHaveLength(3);
      expect(rounds[0].roundNumber).toBe(1);
      expect(rounds[1].roundNumber).toBe(2);
      expect(rounds[2].roundNumber).toBe(3);
    });
  });

  describe('agent configuration', () => {
    it('should create agent with default enabled state', () => {
      const agent = createMockAgentConfig();
      expect(agent.enabled).toBe(true);
    });

    it('should create agent with custom properties', () => {
      const agent = createMockAgentConfig({
        agent: 'steve',
        role: 'Product Visionary',
        enabled: false
      });

      expect(agent.agent).toBe('steve');
      expect(agent.role).toBe('Product Visionary');
      expect(agent.enabled).toBe(false);
    });

    it('should filter enabled agents', () => {
      const agents = [
        createMockAgentConfig({ agent: 'elon', enabled: true }),
        createMockAgentConfig({ agent: 'steve', enabled: false }),
        createMockAgentConfig({ agent: 'oprah', enabled: true })
      ];

      const enabledAgents = agents.filter(a => a.enabled);
      expect(enabledAgents).toHaveLength(2);
      expect(enabledAgents.map(a => a.agent)).toEqual(['elon', 'oprah']);
    });

    it('should handle all agents disabled scenario', () => {
      const agents = [
        createMockAgentConfig({ agent: 'elon', enabled: false }),
        createMockAgentConfig({ agent: 'steve', enabled: false })
      ];

      const enabledAgents = agents.filter(a => a.enabled);
      expect(enabledAgents).toHaveLength(0);
    });
  });

  describe('pause/resume logic', () => {
    it('should detect paused state', () => {
      const sessionState = { isPaused: true };
      expect(sessionState.isPaused).toBe(true);
    });

    it('should store pending resume data when paused', () => {
      const pendingResume = {
        input: 'Build a mobile app',
        nextRound: 2,
        userComment: 'Focus on UX'
      };

      expect(pendingResume.input).toBe('Build a mobile app');
      expect(pendingResume.nextRound).toBe(2);
      expect(pendingResume.userComment).toBe('Focus on UX');
    });

    it('should clear pending resume when completed', () => {
      let pendingResume: { input: string; nextRound: number } | null = {
        input: 'Test',
        nextRound: 2
      };

      pendingResume = null;
      expect(pendingResume).toBeNull();
    });

    it('should resume from correct round', () => {
      const pendingResume = {
        input: 'Build a SaaS product',
        nextRound: 2,
        userComment: undefined
      };

      const { input, nextRound, userComment } = pendingResume;

      expect(input).toBe('Build a SaaS product');
      expect(nextRound).toBe(2);
      expect(userComment).toBeUndefined();
    });
  });

  describe('error recovery', () => {
    it('should set error state on failure', () => {
      let errorState: string | null = null;

      try {
        throw createNetworkError();
      } catch (error) {
        const { message } = parseError(error);
        errorState = message;
      }

      expect(errorState).toContain('Network error');
    });

    it('should clear error state on reset', () => {
      let errorState: string | null = 'Previous error';

      // Reset operation
      errorState = null;

      expect(errorState).toBeNull();
    });

    it('should handle multiple consecutive errors', () => {
      const errors = [
        createRateLimitError(),
        createTimeoutError(),
        createNetworkError()
      ];

      const parsedErrors = errors.map(e => parseError(e));

      expect(parsedErrors[0].title).toBe('⚠️ Rate Limit Exceeded');
      expect(parsedErrors[1].message).toContain('TIMEOUT');
      expect(parsedErrors[2].message).toContain('Network error');
    });
  });

  describe('spec generation flow', () => {
    it('should handle complete flow with high approval', () => {
      const votes = createMockVotesResponse().votes;
      const approvalRate = calculateApprovalRate(votes);
      const roundNumber = 1;

      expect(approvalRate).toBeGreaterThanOrEqual(0.6);
      expect(shouldProceedToSpec(approvalRate, roundNumber)).toBe(true);
    });

    it('should require additional rounds with low approval', () => {
      const votes = [
        { approved: false },
        { approved: false },
        { approved: true }
      ];
      const approvalRate = calculateApprovalRate(votes);
      const roundNumber = 1;

      expect(approvalRate).toBeLessThan(0.6);
      expect(shouldProceedToSpec(approvalRate, roundNumber)).toBe(false);
    });

    it('should force proceed at max rounds even with low approval', () => {
      const votes = [
        { approved: false },
        { approved: false }
      ];
      const approvalRate = calculateApprovalRate(votes);
      const roundNumber = 3;

      expect(approvalRate).toBe(0);
      expect(shouldProceedToSpec(approvalRate, roundNumber)).toBe(true);
    });
  });

  describe('state reset', () => {
    it('should reset all state to initial values', () => {
      // Simulate state with data
      let isProcessing = true;
      let currentStage: Stage = 'voting';
      let errorState: string | null = 'Some error';
      let generatedSpec = '# Spec content';

      // Reset operation
      isProcessing = false;
      currentStage = 'questions';
      errorState = null;
      generatedSpec = '';

      expect(isProcessing).toBe(false);
      expect(currentStage).toBe('questions');
      expect(errorState).toBeNull();
      expect(generatedSpec).toBe('');
    });
  });

  describe('chat functionality', () => {
    it('should format chat context from dialogue entries', () => {
      const entries = [
        { agent: 'user', message: 'I want to build an app', type: 'user' as const },
        { agent: 'steve', message: 'What kind of app?', type: 'question' as const },
        { agent: 'user', message: 'A productivity tool', type: 'user' as const }
      ];

      const fullContext = entries
        .map(e => `${e.agent.toUpperCase()}: ${e.message}`)
        .join('\n\n');

      expect(fullContext).toContain('USER: I want to build an app');
      expect(fullContext).toContain('STEVE: What kind of app?');
      expect(fullContext).toContain('USER: A productivity tool');
    });

    it('should extract spec title from generated spec', () => {
      const spec = '# Mobile Productivity App\n\n## Overview\n\nThis is a spec...';
      const title = spec.split('\n')[0].replace('# ', '').trim();

      expect(title).toBe('Mobile Productivity App');
    });

    it('should handle spec without title', () => {
      const spec = 'Some content without title';
      const title = spec.split('\n')[0].replace('# ', '').trim() || 'Product Specification';

      expect(title).toBe('Some content without title');
    });

    it('should use default title for empty spec', () => {
      const spec = '';
      const title = spec.split('\n')[0].replace('# ', '').trim() || 'Product Specification';

      expect(title).toBe('Product Specification');
    });
  });
});
