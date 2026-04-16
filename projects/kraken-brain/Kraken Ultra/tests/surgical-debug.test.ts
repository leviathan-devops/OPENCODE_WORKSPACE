import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StagnationDetector, StagnationState } from '../src/surgical-debug/stagnation-detector';
import { DebugAgentFactory, DebugAgentType } from '../src/surgical-debug/debug-agents';
import { DebugInjector } from '../src/surgical-debug/injector';
import { UltraConnector } from '../src/surgical-debug/ultra-connector';

describe('Surgical Debug Protocol', () => {
  describe('StagnationDetector', () => {
    let detector: StagnationDetector;

    beforeEach(() => {
      detector = new StagnationDetector();
    });

    it('should create initial state for new agent', () => {
      const state = detector.checkStagnation('agent-1');
      
      expect(state.agentId).toBe('agent-1');
      expect(state.stuck).toBe(false);
      expect(state.failureCount).toBe(0);
    });

    it('should record progress events', () => {
      detector.recordProgress('agent-1', 'Completed module A');
      
      const history = detector.getAgentHistory('agent-1');
      
      expect(history.length).toBe(1);
      expect(history[0].message).toBe('Completed module A');
      expect(history[0].type).toBe('progress');
    });

    it('should record failure events', () => {
      detector.recordFailure('agent-1', 'Build failed: syntax error');
      
      const state = detector.checkStagnation('agent-1');
      
      expect(state.failureCount).toBe(1);
      expect(state.lastError).toBe('Build failed: syntax error');
    });

    it('should detect stagnation after 3 failures', () => {
      detector.recordFailure('agent-1', 'Error 1');
      detector.recordFailure('agent-1', 'Error 2');
      detector.recordFailure('agent-1', 'Error 3');
      
      const state = detector.checkStagnation('agent-1');
      
      expect(state.stuck).toBe(true);
      expect(state.failureCount).toBe(3);
    });

    it('should reset failure count on success', () => {
      detector.recordFailure('agent-1', 'Error 1');
      detector.recordFailure('agent-1', 'Error 2');
      detector.recordSuccess('agent-1', 'Fixed the issue');
      
      const state = detector.checkStagnation('agent-1');
      
      expect(state.failureCount).toBe(0);
      expect(state.stuck).toBe(false);
    });

    it('should return all stuck agents', () => {
      detector.recordFailure('agent-1', 'Error 1');
      detector.recordFailure('agent-1', 'Error 2');
      detector.recordFailure('agent-1', 'Error 3');
      
      detector.recordFailure('agent-2', 'Error 1');
      detector.recordFailure('agent-2', 'Error 2');
      detector.recordFailure('agent-2', 'Error 3');
      
      const stuck = detector.getStuckAgents();
      
      expect(stuck.length).toBe(2);
    });

    it('should allow custom thresholds', () => {
      detector.setThresholds({ failureCount: 2 });
      
      detector.recordFailure('agent-1', 'Error 1');
      detector.recordFailure('agent-1', 'Error 2');
      
      const state = detector.checkStagnation('agent-1');
      
      expect(state.stuck).toBe(true);
    });
  });

  describe('DebugAgentFactory', () => {
    let factory: DebugAgentFactory;

    beforeEach(() => {
      factory = new DebugAgentFactory();
    });

    it('should create fresh GLM agent', () => {
      const agent = factory.createFreshGLM();
      
      expect(agent.type).toBe('fresh-glm');
      expect(agent.modelId).toBeDefined();
      expect(agent.taskPrompt).toBeDefined();
    });

    it('should create specialized debugger with patterns', () => {
      const patterns = ['TypeError', 'ReferenceError'];
      const agent = factory.createSpecializedDebugger(patterns);
      
      expect(agent.type).toBe('specialized-debugger');
      expect(agent.preloadedPatterns).toContain('TypeError');
      expect(agent.preloadedPatterns).toContain('ReferenceError');
    });

    it('should create DeepSeek advisor', () => {
      const agent = factory.createDeepSeekAdvisor();
      
      expect(agent.type).toBe('deepseek-chat');
      expect(agent.modelId).toContain('deepseek');
    });

    it('should generate debug prompt with context', () => {
      const prompt = factory.generateDebugPrompt('TypeError: undefined', {
        originalAgentId: 'agent-1',
        stagnationReason: 'error-loop',
        recentProgress: ['Started work', 'Found issue'],
      });
      
      expect(prompt).toContain('agent-1');
      expect(prompt).toContain('TypeError: undefined');
      expect(prompt).toContain('ROOT_CAUSE');
    });

    it('should select best agent based on reason', () => {
      expect(factory.selectBestAgent('build-failure', [])).toBe('specialized-debugger');
      expect(factory.selectBestAgent('test-failure', ['error1', 'error2', 'error3'])).toBe('specialized-debugger');
      expect(factory.selectBestAgent('logic-error', [])).toBe('deepseek-chat');
      expect(factory.selectBestAgent('code-review', [])).toBe('code-reviewer');
      expect(factory.selectBestAgent('unknown', [])).toBe('fresh-glm');
    });
  });

  describe('DebugInjector', () => {
    let injector: DebugInjector;

    beforeEach(() => {
      injector = new DebugInjector();
    });

    it('should not inject into non-stuck agent', async () => {
      const result = await injector.injectDebugger('agent-1', {});
      
      expect(result.success).toBe(false);
      expect(result.fixApplied).toBe(false);
    });

    it('should inject into stuck agent', async () => {
      const detector = injector.getDetector();
      detector.recordFailure('agent-1', 'Error 1');
      detector.recordFailure('agent-1', 'Error 2');
      detector.recordFailure('agent-1', 'Error 3');
      
      const result = await injector.injectDebugger('agent-1', {
        codebaseContext: 'some code',
      });
      
      expect(result.success).toBe(true);
      expect(result.targetAgentId).toBe('agent-1');
      expect(result.debugAgentId).toBeDefined();
    });

    it('should coordinate fix from debug output', async () => {
      const debugOutput = `
ROOT_CAUSE: Missing null check
FIX: Add if (x !== null) before access
VERIFICATION: Run test suite
STATUS: FIX APPLIED
      `;
      
      const result = await injector.coordinateFix('agent-1', debugOutput);
      
      expect(result.fixed).toBe(true);
      expect(result.solution).toContain('Add if');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect when fix is not applied', async () => {
      const debugOutput = `
ROOT_CAUSE: Unknown
STATUS: NEEDS ESCALATION
      `;
      
      const result = await injector.coordinateFix('agent-1', debugOutput);
      
      expect(result.fixed).toBe(false);
    });

    it('should track active injections', async () => {
      const detector = injector.getDetector();
      detector.recordFailure('agent-1', 'Error 1');
      detector.recordFailure('agent-1', 'Error 2');
      detector.recordFailure('agent-1', 'Error 3');
      
      await injector.injectDebugger('agent-1', {});
      
      const active = injector.getActiveInjections();
      
      expect(active.length).toBe(1);
    });
  });

  describe('UltraConnector', () => {
    let connector: UltraConnector;

    beforeEach(() => {
      connector = new UltraConnector();
    });

    it('should spawn debug agent', async () => {
      const config = {
        agentType: 'hephaestus' as const,
        model: 'glm-5',
        task: 'Debug this error',
      };
      
      const result = await connector.spawnDebugAgent(config);
      
      expect(result.sessionId).toBeDefined();
      expect(result.status).toBe('spawned');
    });

    it('should track active sessions', async () => {
      await connector.spawnDebugAgent({
        agentType: 'hephaestus',
        model: 'glm-5',
        task: 'Task 1',
      });
      
      const active = connector.getActiveDebugSessions();
      
      expect(active.length).toBe(1);
    });

    it('should return session result', async () => {
      const { sessionId } = await connector.spawnDebugAgent({
        agentType: 'hephaestus',
        model: 'glm-5',
        task: 'Task 1',
      });
      
      const result = await connector.getSessionResult(sessionId);
      
      expect(result.sessionId).toBe(sessionId);
      expect(result.status).toBe('completed');
    });

    it('should terminate session', async () => {
      const { sessionId } = await connector.spawnDebugAgent({
        agentType: 'hephaestus',
        model: 'glm-5',
        task: 'Task 1',
      });
      
      connector.terminateSession(sessionId);
      
      const active = connector.getActiveDebugSessions();
      
      expect(active.length).toBe(0);
    });

    it('should create debug config from error', () => {
      const config = connector.createDebugConfig('Fix this bug', 'TypeError: x is undefined');
      
      expect(config.task).toContain('Fix this bug');
      expect(config.task).toContain('TypeError');
      expect(config.agentType).toBe('hephaestus');
    });

    it('should check ultra availability', () => {
      expect(connector.isUltraAvailable()).toBe(true);
      
      connector.setAvailability(false);
      
      expect(connector.isUltraAvailable()).toBe(false);
    });
  });
});
