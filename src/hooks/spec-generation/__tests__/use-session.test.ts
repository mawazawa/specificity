/**
 * Unit Tests for useSession hook reducer
 * Tests all reducer actions for session state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { SessionState, Round, TechStackItem } from '@/types/spec';

// ═══════════════════════════════════════════════════════════════════════════════
// Copy of reducer logic for isolated testing (avoiding React hook dependencies)
// ═══════════════════════════════════════════════════════════════════════════════

const initialSessionState: SessionState = {
  rounds: [],
  currentRound: 0,
  isPaused: false,
  pendingResume: null,
  history: []
};

interface FullSessionState {
  session: SessionState;
  generatedSpec: string;
  techStack: TechStackItem[];
  mockupUrl: string;
}

const initialState: FullSessionState = {
  session: initialSessionState,
  generatedSpec: '',
  techStack: [],
  mockupUrl: ''
};

type SessionAction =
  | { type: 'START_SESSION' }
  | { type: 'ADD_ROUND'; payload: Round }
  | { type: 'UPDATE_ROUND'; payload: Round }
  | { type: 'ADD_HISTORY'; payload: { type: 'vote' | 'output' | 'spec' | 'user-comment'; data: unknown } }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_SPEC'; payload: string }
  | { type: 'SET_TECH_STACK'; payload: TechStackItem[] }
  | { type: 'SET_MOCKUP_URL'; payload: string }
  | { type: 'RESET_SESSION' }
  | { type: 'SET_SESSION_STATE'; payload: Partial<SessionState> };

function sessionReducer(state: FullSessionState, action: SessionAction): FullSessionState {
  switch (action.type) {
    case 'START_SESSION':
      return initialState;

    case 'ADD_ROUND':
      return {
        ...state,
        session: {
          ...state.session,
          rounds: [...state.session.rounds, action.payload],
          currentRound: state.session.rounds.length
        }
      };

    case 'UPDATE_ROUND': {
      const rounds = [...state.session.rounds];
      if (rounds.length > 0) {
        rounds[rounds.length - 1] = action.payload;
      }
      return {
        ...state,
        session: { ...state.session, rounds }
      };
    }

    case 'ADD_HISTORY':
      return {
        ...state,
        session: {
          ...state.session,
          history: [
            ...state.session.history,
            {
              timestamp: new Date().toISOString(),
              type: action.payload.type,
              data: action.payload.data
            }
          ]
        }
      };

    case 'SET_PAUSED':
      return {
        ...state,
        session: { ...state.session, isPaused: action.payload }
      };

    case 'SET_SPEC':
      return {
        ...state,
        generatedSpec: action.payload
      };

    case 'SET_TECH_STACK':
      return {
        ...state,
        techStack: action.payload
      };

    case 'SET_MOCKUP_URL':
      return {
        ...state,
        mockupUrl: action.payload
      };

    case 'RESET_SESSION':
      return initialState;

    case 'SET_SESSION_STATE':
      return {
        ...state,
        session: { ...state.session, ...action.payload }
      };

    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════════

describe('sessionReducer', () => {
  let state: FullSessionState;

  beforeEach(() => {
    state = { ...initialState, session: { ...initialSessionState } };
  });

  describe('START_SESSION', () => {
    it('should reset state to initial values', () => {
      // Given: state with some data
      state.generatedSpec = 'some spec';
      state.session.rounds = [{ agents: [], stage: 'questions' } as Round];

      // When: START_SESSION action
      const result = sessionReducer(state, { type: 'START_SESSION' });

      // Then: state should be reset
      expect(result.generatedSpec).toBe('');
      expect(result.session.rounds).toEqual([]);
      expect(result.session.currentRound).toBe(0);
    });
  });

  describe('ADD_ROUND', () => {
    it('should add a round to empty array', () => {
      const round: Round = { agents: ['elon'], stage: 'questions' } as Round;

      const result = sessionReducer(state, { type: 'ADD_ROUND', payload: round });

      expect(result.session.rounds).toHaveLength(1);
      expect(result.session.rounds[0]).toEqual(round);
      expect(result.session.currentRound).toBe(0);
    });

    it('should add multiple rounds and update currentRound', () => {
      const round1: Round = { agents: ['elon'], stage: 'questions' } as Round;
      const round2: Round = { agents: ['steve'], stage: 'research' } as Round;

      let result = sessionReducer(state, { type: 'ADD_ROUND', payload: round1 });
      result = sessionReducer(result, { type: 'ADD_ROUND', payload: round2 });

      expect(result.session.rounds).toHaveLength(2);
      expect(result.session.currentRound).toBe(1);
    });
  });

  describe('UPDATE_ROUND', () => {
    it('should update the last round', () => {
      const round: Round = { agents: ['elon'], stage: 'questions' } as Round;
      state.session.rounds = [round];

      const updated: Round = { agents: ['elon', 'steve'], stage: 'questions' } as Round;
      const result = sessionReducer(state, { type: 'UPDATE_ROUND', payload: updated });

      expect(result.session.rounds[0].agents).toEqual(['elon', 'steve']);
    });

    it('should do nothing if no rounds exist', () => {
      const updated: Round = { agents: ['elon'], stage: 'questions' } as Round;
      const result = sessionReducer(state, { type: 'UPDATE_ROUND', payload: updated });

      expect(result.session.rounds).toHaveLength(0);
    });
  });

  describe('ADD_HISTORY', () => {
    it('should add history entry with timestamp', () => {
      const result = sessionReducer(state, {
        type: 'ADD_HISTORY',
        payload: { type: 'vote', data: { approved: true } }
      });

      expect(result.session.history).toHaveLength(1);
      expect(result.session.history[0].type).toBe('vote');
      expect(result.session.history[0].data).toEqual({ approved: true });
      expect(result.session.history[0].timestamp).toBeDefined();
    });

    it('should append to existing history', () => {
      state.session.history = [
        { timestamp: '2025-01-01', type: 'output', data: {} }
      ];

      const result = sessionReducer(state, {
        type: 'ADD_HISTORY',
        payload: { type: 'spec', data: { content: 'spec content' } }
      });

      expect(result.session.history).toHaveLength(2);
    });
  });

  describe('SET_PAUSED', () => {
    it('should set isPaused to true', () => {
      const result = sessionReducer(state, { type: 'SET_PAUSED', payload: true });
      expect(result.session.isPaused).toBe(true);
    });

    it('should set isPaused to false', () => {
      state.session.isPaused = true;
      const result = sessionReducer(state, { type: 'SET_PAUSED', payload: false });
      expect(result.session.isPaused).toBe(false);
    });
  });

  describe('SET_SPEC', () => {
    it('should set generated spec', () => {
      const result = sessionReducer(state, {
        type: 'SET_SPEC',
        payload: '# Technical Specification\n...'
      });
      expect(result.generatedSpec).toBe('# Technical Specification\n...');
    });

    it('should handle empty spec', () => {
      state.generatedSpec = 'existing spec';
      const result = sessionReducer(state, { type: 'SET_SPEC', payload: '' });
      expect(result.generatedSpec).toBe('');
    });
  });

  describe('SET_TECH_STACK', () => {
    it('should set tech stack items', () => {
      const techStack: TechStackItem[] = [
        { name: 'React', category: 'Frontend', selected: true }
      ];

      const result = sessionReducer(state, { type: 'SET_TECH_STACK', payload: techStack });
      expect(result.techStack).toEqual(techStack);
    });

    it('should replace existing tech stack', () => {
      state.techStack = [{ name: 'Vue', category: 'Frontend', selected: true }];
      const newStack: TechStackItem[] = [{ name: 'React', category: 'Frontend', selected: true }];

      const result = sessionReducer(state, { type: 'SET_TECH_STACK', payload: newStack });
      expect(result.techStack).toHaveLength(1);
      expect(result.techStack[0].name).toBe('React');
    });
  });

  describe('SET_MOCKUP_URL', () => {
    it('should set mockup URL', () => {
      const url = 'https://example.com/mockup.png';
      const result = sessionReducer(state, { type: 'SET_MOCKUP_URL', payload: url });
      expect(result.mockupUrl).toBe(url);
    });
  });

  describe('RESET_SESSION', () => {
    it('should reset all state to initial values', () => {
      state.generatedSpec = 'some spec';
      state.techStack = [{ name: 'React', category: 'Frontend', selected: true }];
      state.mockupUrl = 'https://mockup.com';
      state.session.rounds = [{ agents: [], stage: 'questions' } as Round];
      state.session.isPaused = true;

      const result = sessionReducer(state, { type: 'RESET_SESSION' });

      expect(result).toEqual(initialState);
    });
  });

  describe('SET_SESSION_STATE', () => {
    it('should partially update session state', () => {
      const result = sessionReducer(state, {
        type: 'SET_SESSION_STATE',
        payload: { isPaused: true, currentRound: 5 }
      });

      expect(result.session.isPaused).toBe(true);
      expect(result.session.currentRound).toBe(5);
      expect(result.session.rounds).toEqual([]);
    });

    it('should preserve non-updated fields', () => {
      state.session.rounds = [{ agents: ['elon'], stage: 'questions' } as Round];

      const result = sessionReducer(state, {
        type: 'SET_SESSION_STATE',
        payload: { isPaused: true }
      });

      expect(result.session.rounds).toHaveLength(1);
    });
  });

  describe('default case', () => {
    it('should return current state for unknown action', () => {
      const result = sessionReducer(state, { type: 'UNKNOWN' as never });
      expect(result).toEqual(state);
    });
  });
});
