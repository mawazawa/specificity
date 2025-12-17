import { useReducer, useCallback } from 'react';
import type { AgentType } from '@/types/spec';

export interface DialogueEntry {
  agent: AgentType | 'system' | 'user'; // broadened for system/user messages
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

export function useDialogue() {
  const [entries, dispatch] = useReducer(dialogueReducer, []);

  const addEntry = useCallback((entry: DialogueEntry) => {
    dispatch({ type: 'ADD_ENTRY', payload: entry });
  }, []);

  const addEntries = useCallback((newEntries: DialogueEntry[]) => {
    dispatch({ type: 'ADD_ENTRIES', payload: newEntries });
  }, []);

  const resetDialogue = useCallback(() => {
    dispatch({ type: 'RESET_DIALOGUE' });
  }, []);

  const setDialogue = useCallback((newEntries: DialogueEntry[]) => {
    dispatch({ type: 'SET_DIALOGUE', payload: newEntries });
  }, []);

  return {
    entries,
    addEntry,
    addEntries,
    resetDialogue,
    setDialogue
  };
}
