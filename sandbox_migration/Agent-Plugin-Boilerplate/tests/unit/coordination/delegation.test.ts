/**
 * tests/unit/coordination/delegation.test.ts
 * 
 * Delegation engine tests.
 */

import { describe, it, expect } from 'vitest';
import { createAgentRegistry, getDefaultAgents } from '../../../src/coordination/registry.js';
import { createDelegationEngine } from '../../../src/coordination/delegation.js';

describe('DelegationEngine', () => {
  const agents = getDefaultAgents();
  const registry = createAgentRegistry(agents);
  const engine = createDelegationEngine(registry);
  
  describe('delegate', () => {
    it('should successfully delegate to valid agent', async () => {
      const result = await engine.delegate({
        taskId: 'task-1',
        target: { agentId: 'coder', agentMode: 'coder' },
        task: 'Write some code',
      });
      
      expect(result.success).toBe(true);
      expect(result.delegatedTo).toBe('coder');
    });
    
    it('should reject delegation to unknown agent', async () => {
      const result = await engine.delegate({
        taskId: 'task-2',
        target: { agentId: 'unknown', agentMode: 'coder' },
        task: 'Write some code',
      });
      
      expect(result.success).toBe(false);
      expect(result.gateResult?.decision).toBe('REJECTED');
    });
    
    it('should reject when agent mode does not match', async () => {
      const result = await engine.delegate({
        taskId: 'task-3',
        target: { agentId: 'architect', agentMode: 'coder' },
        task: 'Write some code',
      });
      
      expect(result.success).toBe(false);
      expect(result.gateResult?.decision).toBe('REJECTED');
    });
  });
  
  describe('canDelegate', () => {
    it('architect can delegate to anyone', () => {
      expect(engine.canDelegate('architect', 'coder')).toBe(true);
      expect(engine.canDelegate('architect', 'reviewer')).toBe(true);
    });
    
    it('coder can delegate back to architect', () => {
      expect(engine.canDelegate('coder', 'architect')).toBe(true);
    });
    
    it('coders cannot delegate to other coders', () => {
      expect(engine.canDelegate('coder', 'coder')).toBe(false);
    });
  });
  
  describe('getClusterAgents', () => {
    it('should return agents in cluster', () => {
      const clusterAgents = engine.getClusterAgents('execution');
      expect(clusterAgents.length).toBeGreaterThan(0);
    });
  });
  
  describe('enforceGate', () => {
    it('should approve valid delegation', () => {
      const result = engine.enforceGate({
        taskId: 'task-4',
        target: { agentId: 'coder', agentMode: 'coder' },
        task: 'Write code',
      });
      
      expect(result.decision).toBe('APPROVED');
    });
  });
});
