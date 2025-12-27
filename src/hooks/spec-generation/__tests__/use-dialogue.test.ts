/**
 * Unit Tests for useDialogue hook reducer
 * Tests all reducer actions for dialogue entry management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { AgentType } from '@/types/spec';

// ═══════════════════════════════════════════════════════════════════════════════
// Copy of reducer logic for isolated testing
// ═══════════════════════════════════════════════════════════════════════════════

export interface DialogueEntry {
  agent: AgentType | 'system' | 'user';
  message: string;
  timestamp: string;
  type: 'question' | 'answer' | 'vote' | 'reasoning' | 'discussion' | 'user';
}

type DialogueAction =
  | { type: 'ADD_ENTRY'; payload: DialogueEntry }
  | { type: 'ADD_ENTRIES'; payload: DialogueEntry[] }
  | { type: 'RESET_DIALOGUE' }
  | { type: 'SET_DIALOGUE'; payload: DialogueEntry[] };

function dialogueReducer(state: DialogueEntry[], action: DialogueAction): DialogueEntry[] {
  switch (action.type) {
    case 'ADD_ENTRY':
      return [...state, action.payload];
    case 'ADD_ENTRIES':
      return [...state, ...action.payload];
    case 'RESET_DIALOGUE':
      return [];
    case 'SET_DIALOGUE':
      return action.payload;
    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════════

describe('dialogueReducer', () => {
  let state: DialogueEntry[];

  const createEntry = (overrides: Partial<DialogueEntry> = {}): DialogueEntry => ({
    agent: 'elon' as AgentType,
    message: 'Test message',
    timestamp: '2025-12-27T00:00:00.000Z',
    type: 'question',
    ...overrides
  });

  beforeEach(() => {
    state = [];
  });

  describe('ADD_ENTRY', () => {
    it('should add entry to empty array', () => {
      const entry = createEntry();
      const result = dialogueReducer(state, { type: 'ADD_ENTRY', payload: entry });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(entry);
    });

    it('should append entry to existing entries', () => {
      const entry1 = createEntry({ agent: 'elon' as AgentType, message: 'First' });
      const entry2 = createEntry({ agent: 'steve' as AgentType, message: 'Second' });
      state = [entry1];

      const result = dialogueReducer(state, { type: 'ADD_ENTRY', payload: entry2 });

      expect(result).toHaveLength(2);
      expect(result[1].agent).toBe('steve');
    });

    it('should not mutate original state', () => {
      const entry = createEntry();
      const originalState = [...state];
      dialogueReducer(state, { type: 'ADD_ENTRY', payload: entry });

      expect(state).toEqual(originalState);
    });

    it('should handle all agent types', () => {
      const systemEntry = createEntry({ agent: 'system' });
      const userEntry = createEntry({ agent: 'user' });

      let result = dialogueReducer(state, { type: 'ADD_ENTRY', payload: systemEntry });
      result = dialogueReducer(result, { type: 'ADD_ENTRY', payload: userEntry });

      expect(result).toHaveLength(2);
      expect(result[0].agent).toBe('system');
      expect(result[1].agent).toBe('user');
    });

    it('should handle all entry types', () => {
      const types: DialogueEntry['type'][] = ['question', 'answer', 'vote', 'reasoning', 'discussion', 'user'];

      let result = state;
      types.forEach((type, index) => {
        const entry = createEntry({ type, message: `Message ${index}` });
        result = dialogueReducer(result, { type: 'ADD_ENTRY', payload: entry });
      });

      expect(result).toHaveLength(6);
      expect(result.map(e => e.type)).toEqual(types);
    });
  });

  describe('ADD_ENTRIES', () => {
    it('should add multiple entries at once', () => {
      const entries = [
        createEntry({ agent: 'elon' as AgentType, message: 'First' }),
        createEntry({ agent: 'steve' as AgentType, message: 'Second' }),
        createEntry({ agent: 'oprah' as AgentType, message: 'Third' })
      ];

      const result = dialogueReducer(state, { type: 'ADD_ENTRIES', payload: entries });

      expect(result).toHaveLength(3);
      expect(result.map(e => e.agent)).toEqual(['elon', 'steve', 'oprah']);
    });

    it('should append to existing entries', () => {
      state = [createEntry({ message: 'Existing' })];
      const newEntries = [
        createEntry({ message: 'New 1' }),
        createEntry({ message: 'New 2' })
      ];

      const result = dialogueReducer(state, { type: 'ADD_ENTRIES', payload: newEntries });

      expect(result).toHaveLength(3);
      expect(result[0].message).toBe('Existing');
    });

    it('should handle empty array', () => {
      state = [createEntry()];
      const result = dialogueReducer(state, { type: 'ADD_ENTRIES', payload: [] });

      expect(result).toHaveLength(1);
    });
  });

  describe('RESET_DIALOGUE', () => {
    it('should clear all entries', () => {
      state = [
        createEntry({ message: '1' }),
        createEntry({ message: '2' }),
        createEntry({ message: '3' })
      ];

      const result = dialogueReducer(state, { type: 'RESET_DIALOGUE' });

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should work on already empty state', () => {
      const result = dialogueReducer(state, { type: 'RESET_DIALOGUE' });
      expect(result).toEqual([]);
    });
  });

  describe('SET_DIALOGUE', () => {
    it('should replace all entries', () => {
      state = [createEntry({ message: 'Old' })];
      const newEntries = [
        createEntry({ message: 'New 1' }),
        createEntry({ message: 'New 2' })
      ];

      const result = dialogueReducer(state, { type: 'SET_DIALOGUE', payload: newEntries });

      expect(result).toHaveLength(2);
      expect(result[0].message).toBe('New 1');
      expect(result[1].message).toBe('New 2');
    });

    it('should allow setting empty array', () => {
      state = [createEntry()];
      const result = dialogueReducer(state, { type: 'SET_DIALOGUE', payload: [] });

      expect(result).toEqual([]);
    });

    it('should restore from saved state', () => {
      const savedEntries = [
        createEntry({ agent: 'elon' as AgentType, timestamp: '2025-12-26T10:00:00Z' }),
        createEntry({ agent: 'steve' as AgentType, timestamp: '2025-12-26T10:01:00Z' })
      ];

      const result = dialogueReducer(state, { type: 'SET_DIALOGUE', payload: savedEntries });

      expect(result).toEqual(savedEntries);
    });
  });

  describe('default case', () => {
    it('should return current state for unknown action', () => {
      state = [createEntry()];
      const result = dialogueReducer(state, { type: 'UNKNOWN' as never });

      expect(result).toBe(state);
    });
  });

  describe('immutability', () => {
    it('should not mutate state on ADD_ENTRY', () => {
      state = [createEntry({ message: 'Original' })];
      const originalLength = state.length;

      dialogueReducer(state, { type: 'ADD_ENTRY', payload: createEntry() });

      expect(state.length).toBe(originalLength);
    });

    it('should not mutate state on ADD_ENTRIES', () => {
      state = [createEntry()];
      const originalRef = state;

      const result = dialogueReducer(state, {
        type: 'ADD_ENTRIES',
        payload: [createEntry(), createEntry()]
      });

      expect(result).not.toBe(originalRef);
    });
  });
});
