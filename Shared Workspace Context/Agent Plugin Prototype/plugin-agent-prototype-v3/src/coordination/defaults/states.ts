/**
 * src/coordination/defaults/states.ts
 * 
 * Default states and transitions for the task state machine.
 */

import type { StateTransition, TaskStatus } from '../types.js';

export interface StateDefinition {
  status: TaskStatus;
  label: string;
  description: string;
  final: boolean;
}

export const DEFAULT_STATES: Record<TaskStatus, StateDefinition> = {
  pending: {
    status: 'pending',
    label: 'Pending',
    description: 'Task has been created but not started',
    final: false,
  },
  in_progress: {
    status: 'in_progress',
    label: 'In Progress',
    description: 'Task is currently being worked on',
    final: false,
  },
  completed: {
    status: 'completed',
    label: 'Completed',
    description: 'Task has been completed successfully',
    final: true,
  },
  failed: {
    status: 'failed',
    label: 'Failed',
    description: 'Task has failed',
    final: true,
  },
  blocked: {
    status: 'blocked',
    label: 'Blocked',
    description: 'Task is blocked by dependencies',
    final: false,
  },
  cancelled: {
    status: 'cancelled',
    label: 'Cancelled',
    description: 'Task has been cancelled',
    final: true,
  },
};

export const DEFAULT_TRANSITIONS: StateTransition[] = [
  { from: 'pending', to: 'in_progress', label: 'Start' },
  { from: 'pending', to: 'cancelled', label: 'Cancel' },
  { from: 'in_progress', to: 'completed', label: 'Complete' },
  { from: 'in_progress', to: 'failed', label: 'Fail' },
  { from: 'in_progress', to: 'blocked', label: 'Block' },
  { from: 'blocked', to: 'in_progress', label: 'Unblock' },
  { from: 'blocked', to: 'cancelled', label: 'Cancel' },
  { from: 'completed', to: 'in_progress', label: 'Reopen' },
  { from: 'failed', to: 'in_progress', label: 'Retry' },
];

export function isValidTransition(
  from: TaskStatus,
  to: TaskStatus,
  transitions: StateTransition[] = DEFAULT_TRANSITIONS
): boolean {
  return transitions.some(t => t.from === from && t.to === to);
}

export function getNextStates(
  from: TaskStatus,
  transitions: StateTransition[] = DEFAULT_TRANSITIONS
): TaskStatus[] {
  return transitions
    .filter(t => t.from === from)
    .map(t => t.to);
}
