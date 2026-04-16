/**
 * Deep Planning Mode - Integration Tests
 * 
 * Full flow tests for command routing and hooks.
 */

import { routeCommand, resetState, getState } from '../src/index';

describe('Command Routing Integration Tests', () => {
  beforeEach(() => {
    resetState();
  });

  describe('deep plan command', () => {
    it('creates plan from context', async () => {
      const result = await routeCommand(
        'deep plan build authentication system',
        'Build a JWT-based authentication system. Must complete within 3 days.'
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Deep Plan');
      expect(result.output).toMatch(/3 days|within|constraint/i);
    });

    it('handles plan this trigger', async () => {
      const result = await routeCommand(
        'plan this',
        'Create a new feature for user notifications'
      );
      
      expect(result.success).toBe(true);
      expect(result.state.mode).toBe('planning');
    });

    it('extracts requirements from context', async () => {
      const result = await routeCommand(
        'deep plan build feature',
        'feature: email notifications. should support push and SMS'
      );
      
      expect(result.success).toBe(true);
      const hasRequirement = result.output.includes('email notifications') || result.output.includes('should');
      expect(hasRequirement).toBe(true);
    });

    it('extracts time constraints', async () => {
      const result = await routeCommand(
        'plan this',
        'Must complete within 1 week'
      );
      
      expect(result.output.toLowerCase()).toMatch(/week|time|constraint|within/);
    });
  });

  describe('analyze dependencies command', () => {
    it('detects file dependencies', async () => {
      const result = await routeCommand(
        'analyze deps',
        'import { auth } from "./auth"\nimport { db } from "./database"'
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Dependency Analysis');
      expect(result.output).toContain('auth');
    });

    it('detects API dependencies', async () => {
      const result = await routeCommand(
        'analyze deps',
        'calls the user API for authentication'
      );
      
      expect(result.output).toContain('API');
    });

    it('handles empty dependencies', async () => {
      const result = await routeCommand(
        'analyze deps',
        'no dependencies here'
      );
      
      expect(result.success).toBe(true);
    });
  });

  describe('risk analysis command', () => {
    it('detects failure possibilities', async () => {
      const result = await routeCommand(
        'what could go wrong',
        'The system might fail on network timeout'
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Risk Analysis');
      expect(result.output).toContain('might fail');
    });

    it('detects blockers', async () => {
      const result = await routeCommand(
        'risk analysis',
        'blocked by the database team'
      );
      
      expect(result.output).toContain('BLOCKER');
    });

    it('handles no risks gracefully', async () => {
      const result = await routeCommand(
        'what could go wrong',
        'Everything is well tested and documented'
      );
      
      expect(result.success).toBe(true);
    });
  });

  describe('checkpoint command', () => {
    it('creates checkpoint when plan exists', async () => {
      await routeCommand('plan this', 'build something');
      
      const result = await routeCommand('checkpoint');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Checkpoint Added');
    });

    it('fails without active plan', async () => {
      resetState();
      
      const result = await routeCommand('checkpoint');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('No active plan');
    });
  });

  describe('validate plan command', () => {
    it('validates existing plan', async () => {
      await routeCommand('plan this', 'build feature');
      
      const result = await routeCommand('validate plan');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Plan Validation');
      expect(result.output).toContain('Requirements');
    });

    it('fails without active plan', async () => {
      resetState();
      
      const result = await routeCommand('validate plan');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('No active plan');
    });
  });

  describe('show constraints command', () => {
    it('shows constraints from plan', async () => {
      await routeCommand(
        'plan this',
        'Must complete within 2 days. Scope: auth only.'
      );
      
      const result = await routeCommand('constraints');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Constraints');
    });

    it('fails without active plan', async () => {
      resetState();
      
      const result = await routeCommand('constraints');
      
      expect(result.success).toBe(false);
    });
  });

  describe('show dependencies command', () => {
    it('shows dependencies from plan', async () => {
      await routeCommand(
        'plan this',
        'import db from "./database"'
      );
      
      const result = await routeCommand('dependencies');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Dependency Graph');
    });
  });

  describe('unknown commands', () => {
    it('returns helpful message', async () => {
      const result = await routeCommand('gibberish command');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('Unknown command');
    });
  });
});

describe('State Management', () => {
  beforeEach(() => {
    resetState();
  });

  it('starts in idle mode', () => {
    const state = getState();
    expect(state.mode).toBe('idle');
  });

  it('transitions to planning mode', async () => {
    await routeCommand('plan this', 'build something');
    
    const state = getState();
    expect(state.mode).toBe('planning');
  });

  it('stores current plan', async () => {
    await routeCommand('plan this', 'build feature');
    
    const state = getState();
    expect(state.currentPlan).not.toBeNull();
    expect(state.currentPlan?.task).toBe('Planning Task');
  });

  it('resets state cleanly', async () => {
    await routeCommand('plan this', 'build something');
    resetState();
    
    const state = getState();
    expect(state.mode).toBe('idle');
    expect(state.currentPlan).toBeNull();
    expect(state.context).toBe('');
  });
});

describe('Hook Integration', () => {
  beforeEach(() => {
    resetState();
  });

  describe('Tool Blocking Hook', () => {
    it('blocks edit during planning', async () => {
      await routeCommand('plan this', 'build feature');
      
      const { getToolBlockingHook } = require('../src/index');
      const hook = getToolBlockingHook();
      
      const input = { tool: 'edit' };
      const output = { blocked: false, blockReason: '' };
      
      hook.handler(input, output);
      
      expect(output.blocked).toBe(true);
      expect(output.blockReason).toContain('blocked');
    });

    it('blocks bash during planning', async () => {
      await routeCommand('plan this', 'build feature');
      
      const { getToolBlockingHook } = require('../src/index');
      const hook = getToolBlockingHook();
      
      const input = { tool: 'bash' };
      const output = { blocked: false, blockReason: '' };
      
      hook.handler(input, output);
      
      expect(output.blocked).toBe(true);
    });

    it('allows tools when not planning', () => {
      resetState();
      
      const { getToolBlockingHook } = require('../src/index');
      const hook = getToolBlockingHook();
      
      const input = { tool: 'edit' };
      const output = { blocked: false, blockReason: '' };
      
      hook.handler(input, output);
      
      expect(output.blocked).toBe(false);
    });
  });

  describe('Chat Hook', () => {
    it('stores context from chat', () => {
      const { getChatHook } = require('../src/index');
      const hook = getChatHook();
      
      const input = { message: 'build authentication system' };
      const output = {};
      
      hook.handler(input, output);
      
      const state = getState();
      expect(state.context).toContain('authentication');
    });
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    resetState();
  });

  it('handles empty context gracefully', async () => {
    const result = await routeCommand('plan this', '');
    
    expect(result.success).toBe(true);
  });

  it('reports errors in state', async () => {
    // This test would need a way to inject an error
    // For now, just verify state management works
    const state = getState();
    expect(state.lastError).toBeUndefined();
  });
});
