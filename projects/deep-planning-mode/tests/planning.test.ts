/**
 * Deep Planning Mode - Planning Tests
 * 
 * Tests for plan generation, dependency analysis,
 * and checkpoint management.
 */

import {
  PlanData,
  PlanTemplate,
  PLAN_TEMPLATES,
  createCheckpoint,
  createStep,
  createRisk,
  createDependency,
  createConstraint,
  getDefaultPlanData,
} from '../context-library/templates';

describe('Plan Template Tests', () => {
  const samplePlan: PlanData = {
    task: 'Build User Authentication System',
    requirements: ['User login', 'User logout', 'Password reset'],
    constraints: [
      { type: 'time', value: '3 days', hard: true },
      { type: 'scope', value: 'JWT-based auth', hard: false },
    ],
    dependencies: [
      { id: 'DB', name: 'Database', type: 'service', dependsOn: [] },
      { id: 'API', name: 'Auth API', type: 'api', dependsOn: ['DB'] },
      { id: 'UI', name: 'Login UI', type: 'file', dependsOn: ['API'] },
    ],
    risks: [
      {
        id: 'R1',
        description: 'JWT token expiry issues',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Implement token refresh mechanism',
      },
    ],
    checkpoints: [
      {
        id: 'CP1',
        name: 'Requirements Approved',
        criteria: ['All requirements documented', 'Stakeholder sign-off'],
        time: '2h',
        owner: 'agent',
      },
    ],
    steps: [
      {
        id: 'STEP1',
        name: 'Set up database schema',
        description: 'Create user and session tables',
        time: '2h',
        owner: 'agent',
        criteria: ['Schema created', 'Migrations run'],
        rollback: 'Drop tables and rerun migrations',
        dependencies: [],
      },
    ],
  };

  describe('Standard Plan Template', () => {
    it('generates complete plan output', () => {
      const template = PLAN_TEMPLATES.standard;
      const output = template.generate(samplePlan);
      
      expect(output).toContain('# Deep Plan: Build User Authentication System');
      expect(output).toContain('## Requirements');
      expect(output).toContain('## Constraints');
      expect(output).toContain('## Dependency Graph');
      expect(output).toContain('## Risk Register');
    });

    it('includes all requirements', () => {
      const template = PLAN_TEMPLATES.standard;
      const output = template.generate(samplePlan);
      
      expect(output).toContain('User login');
      expect(output).toContain('User logout');
      expect(output).toContain('Password reset');
    });
  });

  describe('Minimal Plan Template', () => {
    it('generates concise output', () => {
      const template = PLAN_TEMPLATES.minimal;
      const output = template.generate(samplePlan);
      
      expect(output).toContain('# Plan:');
      expect(output).toContain('## Steps');
      expect(output).not.toContain('## Risk Register');
    });
  });

  describe('Detailed Plan Template', () => {
    it('includes all sections', () => {
      const template = PLAN_TEMPLATES.detailed;
      const output = template.generate(samplePlan);
      
      expect(output).toContain('## Success Metrics');
      expect(output).toContain('Validation Checklist');
    });
  });
});

describe('Checkpoint Management', () => {
  it('creates checkpoint with correct structure', () => {
    const cp = createCheckpoint('CP1', 'Test', ['Criteria 1'], '1h');
    
    expect(cp.id).toBe('CP1');
    expect(cp.name).toBe('Test');
    expect(cp.criteria).toContain('Criteria 1');
    expect(cp.time).toBe('1h');
  });

  it('creates checkpoint with default owner', () => {
    const cp = createCheckpoint('CP1', 'Test', ['Criteria 1'], '1h');
    expect(cp.owner).toBe('agent');
  });
});

describe('Step Creation', () => {
  it('creates step with correct structure', () => {
    const step = createStep(
      'STEP1',
      'Test Step',
      'Description',
      '2h',
      ['Criteria 1'],
      'Rollback instructions'
    );
    
    expect(step.id).toBe('STEP1');
    expect(step.name).toBe('Test Step');
    expect(step.time).toBe('2h');
    expect(step.owner).toBe('agent');
    expect(step.rollback).toBe('Rollback instructions');
  });

  it('creates step with dependencies', () => {
    const step = createStep(
      'STEP2',
      'Step 2',
      'Description',
      '1h',
      ['Done'],
      'Remove changes',
      ['STEP1']
    );
    
    expect(step.dependencies).toContain('STEP1');
  });
});

describe('Risk Creation', () => {
  it('creates risk with correct severity mapping', () => {
    const risk = createRisk(
      'Test risk',
      'high',
      'high',
      'Mitigation'
    );
    
    expect(risk.probability).toBe('high');
    expect(risk.impact).toBe('high');
  });

  it('generates unique ID', async () => {
    const risk1 = createRisk('Risk 1', 'low', 'low', 'M1');
    await new Promise(r => setTimeout(r, 2)); // Ensure different timestamp
    const risk2 = createRisk('Risk 2', 'low', 'low', 'M2');
    
    expect(risk1.id).not.toBe(risk2.id);
  });
});

describe('Dependency Creation', () => {
  it('creates dependency with depends-on', () => {
    const dep = createDependency('API', 'Auth API', 'api', ['DB']);
    
    expect(dep.id).toBe('API');
    expect(dep.type).toBe('api');
    expect(dep.dependsOn).toContain('DB');
  });
});

describe('Constraint Creation', () => {
  it('creates hard constraint', () => {
    const constraint = createConstraint('time', '3 days', true);
    
    expect(constraint.type).toBe('time');
    expect(constraint.hard).toBe(true);
  });

  it('creates soft constraint', () => {
    const constraint = createConstraint('scope', 'mobile support', false);
    
    expect(constraint.type).toBe('scope');
    expect(constraint.hard).toBe(false);
  });
});

describe('Default Plan Data', () => {
  it('creates empty plan with task name', () => {
    const plan = getDefaultPlanData('Test Task');
    
    expect(plan.task).toBe('Test Task');
    expect(plan.requirements).toEqual([]);
    expect(plan.dependencies).toEqual([]);
    expect(plan.risks).toEqual([]);
  });
});
