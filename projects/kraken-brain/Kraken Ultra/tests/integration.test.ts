import { describe, it, expect, beforeEach } from 'vitest';

describe('Cross-Module Integration Tests', () => {
  describe('Nemotron + Anti-Hallucination', () => {
    it('should block theatrical code before ingestion', async () => {
      const { NemotronService } = await import('../../OPENCODE WORKSPACE/Nemotron Communication Layer/src/service');
      const { ValidatorHook } = await import('../src/anti-hallucination/validator-hook');
      
      const service = NemotronService.getInstance();
      const hook = new ValidatorHook();
      
      const theatricalOutput = `
        // TODO: implement this
        function placeholder() { return null; }
      `;
      
      const result = hook.interceptOutput('test-agent', theatricalOutput);
      
      expect(result.valid).toBe(false);
      expect(result.blocked).toBe(true);
    });

    it('should allow clean code through', async () => {
      const { ValidatorHook } = await import('../src/anti-hallucination/validator-hook');
      
      const hook = new ValidatorHook();
      
      const cleanOutput = `
        export function add(a: number, b: number) {
          return a + b;
        }
      `;
      
      const result = hook.interceptOutput('test-agent', cleanOutput);
      
      expect(result.valid).toBe(true);
      expect(result.blocked).toBe(false);
    });
  });

  describe('Surgical Debug + Stagnation Detection', () => {
    it('should trigger debug injection on stagnation', async () => {
      const { DebugInjector } = await import('../src/surgical-debug/injector');
      
      const injector = new DebugInjector();
      const detector = injector.getDetector();
      
      detector.recordFailure('stuck-agent', 'Build error 1');
      detector.recordFailure('stuck-agent', 'Build error 2');
      detector.recordFailure('stuck-agent', 'Build error 3');
      
      const state = detector.checkStagnation('stuck-agent');
      
      expect(state.stuck).toBe(true);
      
      const result = await injector.injectDebugger('stuck-agent', {});
      
      expect(result.success).toBe(true);
    });
  });

  describe('Full Workflow Validation', () => {
    it('should validate PLAN evidence', async () => {
      const { EvidenceChecker } = await import('../src/anti-hallucination/evidence-checker');
      
      const checker = new EvidenceChecker();
      const result = checker.verifyPlanEvidence('/nonexistent/path');
      
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should validate BUILD evidence', async () => {
      const { EvidenceChecker } = await import('../src/anti-hallucination/evidence-checker');
      
      const checker = new EvidenceChecker();
      const result = checker.verifyBuildEvidence('/nonexistent/package.json');
      
      expect(result.valid).toBe(false);
    });
  });

  describe('Pattern Detection Integration', () => {
    it('should detect all theatrical pattern types', async () => {
      const { MechanicalValidator } = await import('../src/anti-hallucination/mechanical-validator');
      
      const validator = new MechanicalValidator('/tmp');
      
      const codeWithMultipleIssues = `
        // TODO: implement
        // FIXME: this is broken
        describe.skip('broken test', () => {});
        function empty() {}
        test('fake', () => { expect(true).toBe(true); });
      `;
      
      const patterns = validator.detectTheatrical(codeWithMultipleIssues);
      
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('Service Event Emission', () => {
    it('should emit events on message processing', async () => {
      const { NemotronService } = await import('../../OPENCODE WORKSPACE/Nemotron Communication Layer/src/service');
      
      const service = NemotronService.getInstance();
      let eventFired = false;
      
      service.on('compression-complete', () => {
        eventFired = true;
      });
      
      service.ingestAgentOutput('test-agent', 'Test message content');
      
      expect(eventFired).toBe(true);
    });
  });

  describe('Error Recovery Flow', () => {
    it('should coordinate fix between stuck agent and debugger', async () => {
      const { DebugInjector } = await import('../src/surgical-debug/injector');
      
      const injector = new DebugInjector();
      const detector = injector.getDetector();
      
      detector.recordFailure('agent-1', 'TypeError: undefined');
      detector.recordFailure('agent-1', 'TypeError: undefined');
      detector.recordFailure('agent-1', 'TypeError: undefined');
      
      const result = await injector.injectDebugger('agent-1', {
        codebaseContext: 'const x = undefined; x.foo();',
      });
      
      expect(result.success).toBe(true);
      
      const fixResult = await injector.coordinateFix('agent-1', `
ROOT_CAUSE: Accessing property on undefined
FIX: Add null check
STATUS: FIX APPLIED
      `);
      
      expect(fixResult.fixed).toBe(true);
      
      const state = detector.checkStagnation('agent-1');
      expect(state.failureCount).toBe(0);
    });
  });
});
