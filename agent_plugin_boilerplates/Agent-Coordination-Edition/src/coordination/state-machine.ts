/**
 * src/coordination/state-machine.ts
 * 
 * Task State Machine - manages task lifecycle.
 */

import type {
  CreateTaskInput,
  StateMachine,
  Task,
  TaskStatus,
} from './types.js';
import {
  DEFAULT_TRANSITIONS,
  isValidTransition,
} from './defaults/states.js';

export function createStateMachine(
  options: {
    transitions?: typeof DEFAULT_TRANSITIONS;
    onTransition?: (task: Task, from: TaskStatus, to: TaskStatus) => void;
  } = {}
): StateMachine {
  const tasks = new Map<string, Task>();
  const { transitions = DEFAULT_TRANSITIONS, onTransition } = options;
  
  return {
    createTask(input: CreateTaskInput): Task {
      const task: Task = {
        id: input.id,
        description: input.description,
        status: 'pending',
        assignedAgent: input.assignedAgent,
        depends: input.depends || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        phase: input.phase,
        acceptance: input.acceptance,
        size: input.size,
      };
      
      tasks.set(task.id, task);
      return task;
    },
    
    transition(taskId: string, to: TaskStatus): Task | null {
      const task = tasks.get(taskId);
      if (!task) return null;
      
      const from = task.status;
      
      // Check if transition is valid
      if (!isValidTransition(from, to, transitions)) {
        return null;
      }
      
      // Update task
      task.status = to;
      task.updatedAt = Date.now();
      
      // Fire transition callback
      if (onTransition) {
        onTransition(task, from, to);
      }
      
      return task;
    },
    
    getTask(taskId: string): Task | null {
      return tasks.get(taskId) || null;
    },
    
    getTasksByState(state: TaskStatus): Task[] {
      const result: Task[] = [];
      for (const task of tasks.values()) {
        if (task.status === state) {
          result.push(task);
        }
      }
      return result;
    },
    
    getTasksByAgent(agentId: string): Task[] {
      const result: Task[] = [];
      for (const task of tasks.values()) {
        if (task.assignedAgent === agentId) {
          result.push(task);
        }
      }
      return result;
    },
    
    canTransition(taskId: string, to: TaskStatus): boolean {
      const task = tasks.get(taskId);
      if (!task) return false;
      
      return isValidTransition(task.status, to, transitions);
    },
  };
}
