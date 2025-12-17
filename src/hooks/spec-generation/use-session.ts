import { useReducer, useCallback } from 'react';
import type { SessionState, Round, HistoryEntryData, HistoryEntry } from '@/types/spec';

// Initial state
const initialSessionState: SessionState = {
  rounds: [],
  currentRound: 0,
  isPaused: false,
  history: []
};

// Define state including spec string
interface FullSessionState {
  session: SessionState;
  generatedSpec: string;
}

const initialState: FullSessionState = {
  session: initialSessionState,
  generatedSpec: ''
};

type SessionAction =
  | { type: 'START_SESSION' } // Resets mostly
  | { type: 'ADD_ROUND'; payload: Round }
  | { type: 'UPDATE_ROUND'; payload: Round }
  | { type: 'ADD_HISTORY'; payload: { type: 'vote' | 'output' | 'spec' | 'user-comment'; data: HistoryEntryData } }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_SPEC'; payload: string }
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
          currentRound: state.session.rounds.length // 0-based index points to the new round
        }
      };

    case 'UPDATE_ROUND': {
      const rounds = [...state.session.rounds];
      if (rounds.length > 0) {
        rounds[rounds.length - 1] = action.payload; // Update current (last) round
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

export function useSession() {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const startSession = useCallback(() => {
    dispatch({ type: 'START_SESSION' });
  }, []);

  const addRound = useCallback((round: Round) => {
    dispatch({ type: 'ADD_ROUND', payload: round });
  }, []);

  const updateCurrentRound = useCallback((round: Round) => {
    dispatch({ type: 'UPDATE_ROUND', payload: round });
  }, []);

  const addHistory = useCallback((type: 'vote' | 'output' | 'spec' | 'user-comment', data: HistoryEntryData) => {
    dispatch({ type: 'ADD_HISTORY', payload: { type, data } });
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    dispatch({ type: 'SET_PAUSED', payload: paused });
  }, []);

  const setGeneratedSpec = useCallback((spec: string) => {
    dispatch({ type: 'SET_SPEC', payload: spec });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: 'RESET_SESSION' });
  }, []);

  const setSessionState = useCallback((updates: Partial<SessionState>) => {
    dispatch({ type: 'SET_SESSION_STATE', payload: updates });
  }, []);

  return {
    sessionState: state.session,
    generatedSpec: state.generatedSpec,
    startSession,
    addRound,
    updateCurrentRound,
    addHistory,
    setPaused,
    setGeneratedSpec,
    resetSession,
    setSessionState
  };
}
