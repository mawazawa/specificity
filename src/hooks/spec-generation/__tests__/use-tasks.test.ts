/**
 * Unit Tests for useTasks hook reducer
 * Tests all reducer actions for task management
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Copy of reducer logic for isolated testing
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════════

describe('taskReducer', () => {
  let state: Task[];

  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: `task-${Math.random().toString(36).substr(2, 9)}`,
    type: 'question',
    description: 'Test task',
    status: 'pending',
    ...overrides
  });

  beforeEach(() => {
    state = [];
  });

  describe('ADD_TASK', () => {
    it('should add task to empty array', () => {
      const task = createTask({ id: 'task-1' });
      const result = taskReducer(state, { type: 'ADD_TASK', payload: task });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(task);
    });

    it('should append task to existing tasks', () => {
      const task1 = createTask({ id: 'task-1', description: 'First' });
      const task2 = createTask({ id: 'task-2', description: 'Second' });
      state = [task1];

      const result = taskReducer(state, { type: 'ADD_TASK', payload: task2 });

      expect(result).toHaveLength(2);
      expect(result[1].description).toBe('Second');
    });

    it('should handle all task types', () => {
      const types: Task['type'][] = ['question', 'research', 'answer', 'vote'];
      let result = state;

      types.forEach((type, index) => {
        const task = createTask({ id: `task-${index}`, type });
        result = taskReducer(result, { type: 'ADD_TASK', payload: task });
      });

      expect(result).toHaveLength(4);
      expect(result.map(t => t.type)).toEqual(types);
    });

    it('should handle task with agent', () => {
      const task = createTask({ id: 'task-1', agent: 'elon' });
      const result = taskReducer(state, { type: 'ADD_TASK', payload: task });

      expect(result[0].agent).toBe('elon');
    });

    it('should handle task with optional fields', () => {
      const task = createTask({
        id: 'task-1',
        duration: 1500,
        result: { success: true }
      });
      const result = taskReducer(state, { type: 'ADD_TASK', payload: task });

      expect(result[0].duration).toBe(1500);
      expect(result[0].result).toEqual({ success: true });
    });
  });

  describe('UPDATE_TASK', () => {
    it('should update task by id', () => {
      state = [
        createTask({ id: 'task-1', status: 'pending' }),
        createTask({ id: 'task-2', status: 'pending' })
      ];

      const result = taskReducer(state, {
        type: 'UPDATE_TASK',
        payload: { id: 'task-1', updates: { status: 'running' } }
      });

      expect(result[0].status).toBe('running');
      expect(result[1].status).toBe('pending');
    });

    it('should update multiple fields at once', () => {
      state = [createTask({ id: 'task-1', status: 'running' })];

      const result = taskReducer(state, {
        type: 'UPDATE_TASK',
        payload: {
          id: 'task-1',
          updates: {
            status: 'complete',
            duration: 2500,
            result: { data: 'test' }
          }
        }
      });

      expect(result[0].status).toBe('complete');
      expect(result[0].duration).toBe(2500);
      expect(result[0].result).toEqual({ data: 'test' });
    });

    it('should not modify other tasks', () => {
      state = [
        createTask({ id: 'task-1', description: 'First' }),
        createTask({ id: 'task-2', description: 'Second' }),
        createTask({ id: 'task-3', description: 'Third' })
      ];

      const result = taskReducer(state, {
        type: 'UPDATE_TASK',
        payload: { id: 'task-2', updates: { status: 'complete' } }
      });

      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('complete');
      expect(result[2].status).toBe('pending');
    });

    it('should handle non-existent task id gracefully', () => {
      state = [createTask({ id: 'task-1' })];

      const result = taskReducer(state, {
        type: 'UPDATE_TASK',
        payload: { id: 'non-existent', updates: { status: 'complete' } }
      });

      // State should be unchanged (but new array reference due to map)
      expect(result[0].status).toBe('pending');
    });

    it('should allow updating description', () => {
      state = [createTask({ id: 'task-1', description: 'Original' })];

      const result = taskReducer(state, {
        type: 'UPDATE_TASK',
        payload: { id: 'task-1', updates: { description: 'Updated' } }
      });

      expect(result[0].description).toBe('Updated');
    });

    it('should handle status transitions', () => {
      const task = createTask({ id: 'task-1', status: 'pending' });
      state = [task];

      // pending -> running
      let result = taskReducer(state, {
        type: 'UPDATE_TASK',
        payload: { id: 'task-1', updates: { status: 'running' } }
      });
      expect(result[0].status).toBe('running');

      // running -> complete
      result = taskReducer(result, {
        type: 'UPDATE_TASK',
        payload: { id: 'task-1', updates: { status: 'complete' } }
      });
      expect(result[0].status).toBe('complete');
    });
  });

  describe('RESET_TASKS', () => {
    it('should clear all tasks', () => {
      state = [
        createTask({ id: 'task-1' }),
        createTask({ id: 'task-2' }),
        createTask({ id: 'task-3' })
      ];

      const result = taskReducer(state, { type: 'RESET_TASKS' });

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should work on already empty state', () => {
      const result = taskReducer(state, { type: 'RESET_TASKS' });
      expect(result).toEqual([]);
    });

    it('should return new array reference', () => {
      state = [];
      const result = taskReducer(state, { type: 'RESET_TASKS' });
      expect(result).not.toBe(state);
    });
  });

  describe('default case', () => {
    it('should return current state for unknown action', () => {
      state = [createTask()];
      const result = taskReducer(state, { type: 'UNKNOWN' as never });

      expect(result).toBe(state);
    });
  });

  describe('immutability', () => {
    it('should not mutate state on ADD_TASK', () => {
      state = [createTask({ id: 'task-1' })];
      const originalLength = state.length;

      taskReducer(state, { type: 'ADD_TASK', payload: createTask({ id: 'task-2' }) });

      expect(state.length).toBe(originalLength);
    });

    it('should not mutate task objects on UPDATE_TASK', () => {
      const originalTask = createTask({ id: 'task-1', status: 'pending' });
      state = [originalTask];

      taskReducer(state, {
        type: 'UPDATE_TASK',
        payload: { id: 'task-1', updates: { status: 'complete' } }
      });

      expect(originalTask.status).toBe('pending');
    });
  });

  describe('realistic workflow', () => {
    it('should handle typical task lifecycle', () => {
      // Add pending task
      let result = taskReducer(state, {
        type: 'ADD_TASK',
        payload: createTask({
          id: 'question-1',
          type: 'question',
          agent: 'elon',
          description: 'Generate clarifying questions',
          status: 'pending'
        })
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');

      // Start running
      result = taskReducer(result, {
        type: 'UPDATE_TASK',
        payload: { id: 'question-1', updates: { status: 'running' } }
      });
      expect(result[0].status).toBe('running');

      // Complete with result
      result = taskReducer(result, {
        type: 'UPDATE_TASK',
        payload: {
          id: 'question-1',
          updates: {
            status: 'complete',
            duration: 3500,
            result: { questions: ['Q1', 'Q2', 'Q3'] }
          }
        }
      });

      expect(result[0].status).toBe('complete');
      expect(result[0].duration).toBe(3500);
      expect(result[0].result).toEqual({ questions: ['Q1', 'Q2', 'Q3'] });
    });

    it('should handle multiple concurrent tasks', () => {
      // Add multiple tasks
      let result = taskReducer(state, {
        type: 'ADD_TASK',
        payload: createTask({ id: 'research-elon', agent: 'elon', type: 'research' })
      });
      result = taskReducer(result, {
        type: 'ADD_TASK',
        payload: createTask({ id: 'research-steve', agent: 'steve', type: 'research' })
      });
      result = taskReducer(result, {
        type: 'ADD_TASK',
        payload: createTask({ id: 'research-oprah', agent: 'oprah', type: 'research' })
      });

      expect(result).toHaveLength(3);

      // Start all running
      result = taskReducer(result, {
        type: 'UPDATE_TASK',
        payload: { id: 'research-elon', updates: { status: 'running' } }
      });
      result = taskReducer(result, {
        type: 'UPDATE_TASK',
        payload: { id: 'research-steve', updates: { status: 'running' } }
      });
      result = taskReducer(result, {
        type: 'UPDATE_TASK',
        payload: { id: 'research-oprah', updates: { status: 'running' } }
      });

      const runningCount = result.filter(t => t.status === 'running').length;
      expect(runningCount).toBe(3);

      // Complete one by one
      result = taskReducer(result, {
        type: 'UPDATE_TASK',
        payload: { id: 'research-steve', updates: { status: 'complete', duration: 2000 } }
      });

      const completedCount = result.filter(t => t.status === 'complete').length;
      const stillRunning = result.filter(t => t.status === 'running').length;
      expect(completedCount).toBe(1);
      expect(stillRunning).toBe(2);
    });
  });
});
