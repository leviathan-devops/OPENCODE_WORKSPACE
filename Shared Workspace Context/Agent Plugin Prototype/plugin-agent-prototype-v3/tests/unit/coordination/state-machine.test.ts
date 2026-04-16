/**
 * tests/unit/coordination/state-machine.test.ts
 * 
 * State machine tests.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { createStateMachine } from '../../../src/coordination/state-machine.js';

describe('StateMachine', () => {
  let stateMachine: ReturnType<typeof createStateMachine>;
  
  beforeEach(() => {
    stateMachine = createStateMachine();
  });
  
  describe('createTask', () => {
    it('should create a task with pending status', () => {
      const task = stateMachine.createTask({
        id: 'task-1',
        description: 'Test task',
      });
      
      expect(task.id).toBe('task-1');
      expect(task.status).toBe('pending');
      expect(task.description).toBe('Test task');
    });
    
    it('should create task with assigned agent', () => {
      const task = stateMachine.createTask({
        id: 'task-2',
        description: 'Assigned task',
        assignedAgent: 'coder',
      });
      
      expect(task.assignedAgent).toBe('coder');
    });
  });
  
  describe('transition', () => {
    it('should transition from pending to in_progress', () => {
      const task = stateMachine.createTask({
        id: 'task-3',
        description: 'Test',
      });
      
      const result = stateMachine.transition('task-3', 'in_progress');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe('in_progress');
    });
    
    it('should transition from in_progress to completed', () => {
      const task = stateMachine.createTask({
        id: 'task-4',
        description: 'Test',
      });
      
      stateMachine.transition('task-4', 'in_progress');
      const result = stateMachine.transition('task-4', 'completed');
      
      expect(result?.status).toBe('completed');
    });
    
    it('should reject invalid transitions', () => {
      const task = stateMachine.createTask({
        id: 'task-5',
        description: 'Test',
      });
      
      // Cannot go from pending to completed directly
      const result = stateMachine.transition('task-5', 'completed');
      expect(result).toBeNull();
    });
    
    it('should return null for unknown task', () => {
      const result = stateMachine.transition('unknown', 'in_progress');
      expect(result).toBeNull();
    });
  });
  
  describe('getTask', () => {
    it('should retrieve task by id', () => {
      stateMachine.createTask({
        id: 'task-6',
        description: 'Test',
      });
      
      const task = stateMachine.getTask('task-6');
      expect(task).not.toBeNull();
      expect(task?.id).toBe('task-6');
    });
    
    it('should return null for unknown task', () => {
      const task = stateMachine.getTask('unknown');
      expect(task).toBeNull();
    });
  });
  
  describe('getTasksByState', () => {
    it('should return tasks by state', () => {
      stateMachine.createTask({ id: 'task-7', description: 'Test 1' });
      stateMachine.createTask({ id: 'task-8', description: 'Test 2' });
      
      stateMachine.transition('task-7', 'in_progress');
      
      const pending = stateMachine.getTasksByState('pending');
      const inProgress = stateMachine.getTasksByState('in_progress');
      
      expect(pending.length).toBe(1);
      expect(inProgress.length).toBe(1);
    });
  });
  
  describe('canTransition', () => {
    it('should return true for valid transition', () => {
      stateMachine.createTask({ id: 'task-9', description: 'Test' });
      
      expect(stateMachine.canTransition('task-9', 'in_progress')).toBe(true);
    });
    
    it('should return false for invalid transition', () => {
      stateMachine.createTask({ id: 'task-10', description: 'Test' });
      
      expect(stateMachine.canTransition('task-10', 'completed')).toBe(false);
    });
  });
});
