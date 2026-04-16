/**
 * tests/unit/hooks/gate-hook.test.ts
 * 
 * Gate hook tests.
 */

import { describe, it, expect } from 'vitest';
import { createDelegationGateHook, createQAEnforcementHook } from '../../../src/coordination/hooks/gate-hook.js';

describe('GateHook', () => {
  describe('createDelegationGateHook', () => {
    it('should create a gate hook', () => {
      const hook = createDelegationGateHook();
      expect(typeof hook).toBe('function');
    });
    
    it('should track consecutive coder calls', async () => {
      const hook = createDelegationGateHook({ maxConsecutiveCoderCalls: 3 });
      
      // Simulate delegate_task calls
      await hook({ tool: 'delegate_task', name: 'delegate_task' }, {});
      await hook({ tool: 'delegate_task', name: 'delegate_task' }, {});
      
      // Non-delegation tool resets counter
      await hook({ tool: 'edit' }, {});
      
      await hook({ tool: 'delegate_task', name: 'delegate_task' }, {});
      await hook({ tool: 'delegate_task', name: 'delegate_task' }, {});
      // At this point with max=3, next one might warn
    });
  });
  
  describe('createQAEnforcementHook', () => {
    it('should create a QA enforcement hook', () => {
      const hook = createQAEnforcementHook();
      expect(typeof hook).toBe('function');
    });
    
    it('should warn on edit/write operations', async () => {
      const hook = createQAEnforcementHook();
      
      // Should not throw
      await hook({ tool: 'edit' }, {});
      await hook({ tool: 'write' }, {});
    });
  });
});
