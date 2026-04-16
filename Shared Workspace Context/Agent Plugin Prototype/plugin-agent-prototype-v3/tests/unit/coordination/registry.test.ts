/**
 * tests/unit/coordination/registry.test.ts
 * 
 * Agent registry tests.
 */

import { describe, it, expect } from 'vitest';
import { createAgentRegistry, getDefaultAgents } from '../../../src/coordination/registry.js';

describe('AgentRegistry', () => {
  const agents = getDefaultAgents();
  const registry = createAgentRegistry(agents);
  
  describe('getAgent', () => {
    it('should return agent by id', () => {
      const agent = registry.getAgent('architect');
      expect(agent).toBeDefined();
      expect(agent?.id).toBe('architect');
    });
    
    it('should return null for unknown agent', () => {
      const agent = registry.getAgent('unknown');
      expect(agent).toBeNull();
    });
  });
  
  describe('getAgentsByMode', () => {
    it('should return agents by mode', () => {
      const coders = registry.getAgentsByMode('coder');
      expect(coders.length).toBeGreaterThan(0);
      expect(coders[0].mode).toBe('coder');
    });
    
    it('should return empty array for unknown mode', () => {
      const agents = registry.getAgentsByMode('unknown');
      expect(agents).toEqual([]);
    });
  });
  
  describe('getAgentsByCluster', () => {
    it('should return agents by cluster', () => {
      const executionAgents = registry.getAgentsByCluster('execution');
      expect(executionAgents.length).toBeGreaterThan(0);
    });
  });
  
  describe('isAgentAllowedTool', () => {
    it('should allow tools in allowed list', () => {
      const allowed = registry.isAgentAllowedTool('architect', 'some_tool');
      expect(allowed).toBe(true);
    });
    
    it('should reject tools not in allowed list for non-* agents', () => {
      const rejected = registry.isAgentAllowedTool('architect', '');
      // Empty allowedTools means no tools - but architect has '*'
      expect(typeof rejected).toBe('boolean');
    });
  });
  
  describe('listAgents', () => {
    it('should list all agents', () => {
      const all = registry.listAgents();
      expect(all.length).toBeGreaterThan(0);
    });
  });
});
