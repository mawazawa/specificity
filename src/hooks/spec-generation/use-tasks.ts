import { useReducer, useCallback } from 'react';

export interface Task {
  id: string;
  type: 'question' | 'research' | 'answer' | 'vote';
  agent?: string;
  description: string;
  status: 'pending' | 'running' | 'complete';
  duration?: number;
  result?: unknown;
}

type TaskAction =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'RESET_TASKS' };

function taskReducer(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case 'ADD_TASK':
      return [...state, action.payload];
    case 'UPDATE_TASK':
      return state.map(t =>
        t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
      );
    case 'RESET_TASKS':
      return [];
    default:
      return state;
  }
}

export function useTasks() {
  const [tasks, dispatch] = useReducer(taskReducer, []);

  const addTask = useCallback((task: Omit<Task, 'id'>): string => {
    const id = crypto.randomUUID();
    dispatch({ type: 'ADD_TASK', payload: { ...task, id } });
    return id;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
  }, []);

  const resetTasks = useCallback(() => {
    dispatch({ type: 'RESET_TASKS' });
  }, []);

  return {
    tasks,
    addTask,
    updateTask,
    resetTasks
  };
}
