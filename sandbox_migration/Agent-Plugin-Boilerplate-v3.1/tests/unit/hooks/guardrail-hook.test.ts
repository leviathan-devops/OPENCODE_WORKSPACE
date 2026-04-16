/**
 * tests/unit/hooks/guardrail-hook.test.ts
 * 
 * Guardrail hook tests.
 */

import { describe, it, expect } from 'vitest';
import { createGuardrailHook } from '../../../src/coordination/hooks/guardrail-hook.js';

describe('GuardrailHook', () => {
  describe('createGuardrailHook', () => {
    it('should create a guardrail hook', () => {
      const hook = createGuardrailHook();
      expect(typeof hook).toBe('function');
    });
    
    it('should track agent duration', async () => {
      const hook = createGuardrailHook({ maxDuration: 1000 });
      
      // First call initializes tracking
      await hook({ agent: 'test-agent', tool: 'test' }, {});
      
      // Second call checks duration
      await hook({ agent: 'test-agent', tool: 'test' }, {});
    });
    
    it('should track errors', async () => {
      const hook = createGuardrailHook({ errorThreshold: 2 });
      
      await hook({ agent: 'test-agent', error: true }, {});
      await hook({ agent: 'test-agent', error: true }, {});
      // Third error should trigger warning
    });
    
    it('should handle missing agent info', async () => {
      const hook = createGuardrailHook();
      
      // Should not throw with missing agent
      await hook({ tool: 'test' }, {});
    });
  });
});
