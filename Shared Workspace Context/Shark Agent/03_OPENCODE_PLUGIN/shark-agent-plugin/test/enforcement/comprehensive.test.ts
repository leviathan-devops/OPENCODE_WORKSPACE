import { describe, it, expect, beforeEach, afterAll } from 'bun:test';
import { enforceSharkArchitecture } from '../../src/enforcement/enforcer';
import { workflowMachine, WorkflowStep } from '../../src/workflow/machine';
import { checkGuardianProtection } from '../../src/enforcement/guardian-enhancer';
import * as os from 'os';
import * as path from 'path';

describe('Shark Enforcement System', () => {
  const homeDir = os.homedir();

  beforeEach(() => {
    workflowMachine.reset('test-session');
  });

  afterAll(() => {
    workflowMachine.reset('test-session');
  });

  describe('Guardian Protection', () => {
    it('should block PERSONAL path writes', async () => {
      const personalPath = path.join(homeDir, '.ssh', 'config');
      const result = await enforceSharkArchitecture({
        tool: 'write',
        args: {
          filePath: personalPath,
          content: 'test content'
        },
        sessionID: 'test-session',
        workflowStep: WorkflowStep.PLAN,
        agent: 'test-agent',
        context: {}
      });

      expect(result.allowed).toBe(false);
      expect(result.firewall).toBe('guardian');
    });

    it('should block SYSTEM path writes', async () => {
      const result = await enforceSharkArchitecture({
        tool: 'write',
        args: {
          filePath: '/etc/passwd',
          content: 'test content'
        },
        sessionID: 'test-session',
        workflowStep: WorkflowStep.PLAN,
        agent: 'test-agent',
        context: {}
      });

      expect(result.allowed).toBe(false);
      expect(result.firewall).toBe('guardian');
    });

    it('should allow workspace writes', async () => {
      const result = await enforceSharkArchitecture({
        tool: 'write',
        args: {
          filePath: '/tmp/workspace/test.txt',
          content: 'test content'
        },
        sessionID: 'test-session',
        workflowStep: WorkflowStep.PLAN,
        agent: 'test-agent',
        context: {}
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('Workflow Enforcement', () => {
    it('should start at PLAN step', () => {
      const state = workflowMachine.getState('test-session');
      expect(state.currentStep).toBe(WorkflowStep.PLAN);
    });

    it('should enforce workflow progression', () => {
      const result = workflowMachine.canAdvanceTo('test-session', WorkflowStep.BUILD);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Guardian Direct', () => {
    it('should block ~/.ssh paths', async () => {
      const sshPath = path.join(homeDir, '.ssh', 'config');
      const result = await checkGuardianProtection('write', {
        filePath: sshPath
      });
      expect(result.allowed).toBe(false);
    });

    it('should block /etc paths', async () => {
      const result = await checkGuardianProtection('write', {
        filePath: '/etc/passwd'
      });
      expect(result.allowed).toBe(false);
    });

    it('should allow /tmp paths', async () => {
      const result = await checkGuardianProtection('write', {
        filePath: '/tmp/test.txt'
      });
      expect(result.allowed).toBe(true);
    });
  });
});
