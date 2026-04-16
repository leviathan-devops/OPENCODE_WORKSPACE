import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { checkGuardianProtection } from '../../src/enforcement/guardian-enhancer';
import { enforceSharkArchitecture } from '../../src/enforcement/enforcer';
import { workflowMachine, WorkflowStep } from '../../src/workflow/machine';
import { detectMockMode } from '../../src/validation/mock-detector';
import { detectTheatricalCode } from '../../src/validation/theatrical-detector';
import { enforceStyleGuide } from '../../src/validation/style-enforcer';
import { preventRepoRootTests } from '../../src/validation/test-enforcer';
import { enforceVerificationGates } from '../../src/verification/gates';
import { validateDocumentation } from '../../src/validation/doc-validator';
import * as os from 'os';
import * as path from 'path';

const homeDir = os.homedir();

describe('Shark Enforcement Integration', () => {
  
  describe('Guardian Protection', () => {
    it('should block PERSONAL path writes', async () => {
      const sshPath = path.join(homeDir, '.ssh', 'config');
      const result = await checkGuardianProtection('write', { 
        filePath: sshPath 
      });
      
      expect(result.allowed).toBe(false);
    });

    it('should allow workspace paths', async () => {
      const result = await checkGuardianProtection('write', { 
        filePath: '/tmp/test-workspace/test.txt' 
      });
      
      expect(result.allowed).toBe(true);
    });

    it('should block system paths', async () => {
      const result = await checkGuardianProtection('write', { 
        filePath: '/etc/passwd' 
      });
      
      expect(result.allowed).toBe(false);
    });
  });

  describe('Workflow Machine', () => {
    it('should start at PLAN step', () => {
      const state = workflowMachine.getState('test-session');
      expect(state.currentStep).toBe(WorkflowStep.PLAN);
    });

    it('should enforce workflow progression', () => {
      const result = workflowMachine.canAdvanceTo('test-session', WorkflowStep.BUILD);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Mock Mode Detection', () => {
    it('should detect mock mode language', async () => {
      const result = await detectMockMode({
        content: 'I would run this test with mock mode disabled'
      });
      
      expect(result.allowed).toBe(false);
    });
  });

  describe('Style Guide Enforcement', () => {
    it('should enforce naming conventions', async () => {
      const result = await enforceStyleGuide({
        tool: 'write',
        args: {
          content: `const overlyComplexVariableName = {};`,
          filePath: '/tmp/test-style.ts'
        }
      });
      
      expect(result.allowed).toBe(false);
    });
  });

  describe('Documentation Validation', () => {
    it('should allow valid code', async () => {
      const result = await validateDocumentation({
        tool: 'write',
        args: {
          filePath: '/tmp/test.ts'
        }
      });
      
      expect(result.allowed).toBe(true);
    });
  });
});
