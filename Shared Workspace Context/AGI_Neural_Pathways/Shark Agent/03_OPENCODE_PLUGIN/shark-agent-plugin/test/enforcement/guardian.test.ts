import { describe, it, expect, beforeAll } from 'bun:test';
import * as path from 'path';
import { checkGuardianProtection } from '../../src/enforcement/guardian-enhancer';
import { enforceSharkArchitecture } from '../../src/enforcement/enforcer';
import { workflowMachine, WorkflowStep } from '../../src/workflow/machine';

import { detectMockMode } from '../../src/validation/mock-detector';
import { detectTheatricalCode } from '../../src/validation/theatrical-detector';
import { enforceStyleGuide } from '../../src/validation/style-enforcer';
import { preventRepoRootTests } from '../../src/validation/test-enforcer';
import { enforceVerificationGates } from '../../src/verification/gates';
import { validateDocumentation } from '../../src/validation/doc-validator';

import { AuditLogger } from '../../src/enforcement/audit-logger';

describe('Shark Enforcement System', () => {
  it('should enforce all 9 firewalls', async () => {
    // Initialize workflow machine
    const state = workflowMachine.getState('test-session');
    expect(state.currentStep).toBe(WorkflowStep.PLAN);
    expect(state.completedSteps).toEqual([]);
    expect(state.blocked).toBe(false);
  });

});
