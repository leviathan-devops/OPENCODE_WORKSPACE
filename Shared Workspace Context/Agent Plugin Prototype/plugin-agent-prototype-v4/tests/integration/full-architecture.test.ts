import { describe, it, expect } from 'bun:test';
import { createArchitectureFactory } from '../../src/factory/ArchitectureFactory.js';
import {
  architectTemplate,
  executorTemplate,
  coderTemplate,
  reviewerTemplate,
  testEngineerTemplate,
  smeTemplate,
  explorerTemplate,
  criticTemplate,
  docsTemplate,
  designerTemplate,
} from '../../src/factory/templates/agent/index.js';
import { spiderConfig } from '../../src/config/templates/spider.js';
import { sharkConfig } from '../../src/config/templates/shark.js';
import { trioConfig } from '../../src/config/templates/trio.js';

describe('Full Architecture Integration', () => {
  function registerAllTemplates(factory: ReturnType<typeof createArchitectureFactory>) {
    const templates = [
      architectTemplate, executorTemplate, coderTemplate, reviewerTemplate,
      testEngineerTemplate, smeTemplate, explorerTemplate, criticTemplate,
      docsTemplate, designerTemplate,
    ];
    for (const t of templates) {
      factory.registerTemplate(t);
    }
  }

  describe('Spider Architecture (single brain)', () => {
    it('creates correct single-brain architecture', () => {
      const factory = createArchitectureFactory();
      registerAllTemplates(factory);

      const instance = factory.create(spiderConfig);

      // Brain checks
      expect(instance.brains.type).toBe('single');
      expect(instance.brains.primary).toBe('architect');
      expect(instance.brains.all).toEqual(['architect']);
      expect(instance.brains.syncMode).toBe('none');

      // Agent checks
      expect(instance.agents.size).toBe(6);
      expect(instance.agents.has('architect')).toBe(true);
      expect(instance.agents.has('coder')).toBe(true);
      expect(instance.agents.has('reviewer')).toBe(true);
      expect(instance.agents.has('test-engineer')).toBe(true);
      expect(instance.agents.has('explorer')).toBe(true);
      expect(instance.agents.has('sme')).toBe(true);

      // Cluster checks
      expect(instance.clusters.size).toBe(3);
      expect(instance.clusters.has('execution')).toBe(true);
      expect(instance.clusters.has('qa')).toBe(true);
      expect(instance.clusters.has('research')).toBe(true);

      // Coordination checks
      const registry = instance.coordination.registry;
      expect(registry.getAgent('architect')).not.toBeNull();
      expect(registry.getAgent('nonexistent')).toBeNull();
      expect(registry.listAgents().length).toBe(6);

      // Tool permission checks
      expect(registry.isAgentAllowedTool('coder', 'write')).toBe(true);
      expect(registry.isAgentAllowedTool('architect', 'plan')).toBe(true);
    });
  });

  describe('Shark Architecture (dual brain)', () => {
    it('creates dual-brain architecture with 2 orchestrators', () => {
      const factory = createArchitectureFactory();
      registerAllTemplates(factory);

      const instance = factory.create(sharkConfig);

      // Brain checks
      expect(instance.brains.type).toBe('dual');
      expect(instance.brains.all.length).toBe(2);
      expect(instance.brains.all).toContain('architect');
      expect(instance.brains.all).toContain('executor');
      expect(instance.brains.syncMode).toBe('shared-state');
      expect(instance.brains.workflows).toBeDefined();
      expect(Object.keys(instance.brains.workflows!)).toHaveLength(2);

      // Workflow ownership checks
      const archWorkflow = instance.brains.workflows!['architect'];
      expect(archWorkflow.owns).toContain('planning');
      expect(archWorkflow.readOnly).toContain('execution-state');

      const execWorkflow = instance.brains.workflows!['executor'];
      expect(execWorkflow.owns).toContain('execution');
      expect(execWorkflow.readOnly).toContain('plan-state');

      // Agent checks
      expect(instance.agents.size).toBe(7);
      expect(instance.agents.has('executor')).toBe(true);

      // Cluster checks
      expect(instance.clusters.size).toBe(3);
      expect(instance.clusters.has('research-pool')).toBe(true);
      expect(instance.clusters.has('execution-pool')).toBe(true);
      expect(instance.clusters.has('qa-pool')).toBe(true);
    });
  });

  describe('Trio Architecture (triple brain)', () => {
    it('creates trio-brain architecture with 3 orchestrators', () => {
      const factory = createArchitectureFactory();
      registerAllTemplates(factory);

      const instance = factory.create(trioConfig);

      // Brain checks
      expect(instance.brains.type).toBe('trio');
      expect(instance.brains.all.length).toBe(3);
      expect(instance.brains.all).toContain('architect');
      expect(instance.brains.all).toContain('executor');
      expect(instance.brains.all).toContain('guardian');
      expect(instance.brains.syncMode).toBe('shared-state');
      expect(Object.keys(instance.brains.workflows!)).toHaveLength(3);

      // Guardian workflow checks
      const guardianWorkflow = instance.brains.workflows!['guardian'];
      expect(guardianWorkflow.owns).toContain('context');
      expect(guardianWorkflow.owns).toContain('knowledge');
      expect(guardianWorkflow.owns).toContain('quality');

      // Agent checks
      expect(instance.agents.size).toBe(10);
      expect(instance.agents.has('guardian')).toBe(true);
      expect(instance.agents.has('critic')).toBe(true);
      expect(instance.agents.has('docs')).toBe(true);

      // Cluster checks
      expect(instance.clusters.size).toBe(4);
      expect(instance.clusters.has('knowledge-pool')).toBe(true);
    });
  });

  describe('Template resolution', () => {
    it('resolves template references in agent creation', () => {
      const factory = createArchitectureFactory();
      registerAllTemplates(factory);

      const instance = factory.create(spiderConfig);

      // Verify that template-resolved agents have correct properties
      const architect = instance.agents.get('architect');
      expect(architect).toBeDefined();
      expect(architect?.prompt).toContain('Architect');
      expect(architect?.model).toBe('opus');

      const coder = instance.agents.get('coder');
      expect(coder).toBeDefined();
      expect(coder?.prompt).toContain('Coder');
    });
  });

  describe('StateStore domain enforcement', () => {
    it('enforces domain ownership in created architectures', () => {
      const factory = createArchitectureFactory();
      registerAllTemplates(factory);

      const instance = factory.create(sharkConfig);

      // Architect can write to plan-state
      const planResult = instance.stateStore.set('plan', { phases: [] }, 'plan-state', 'architect');
      expect(planResult.success).toBe(true);

      // Executor can write to execution-state
      const execResult = instance.stateStore.set('status', { running: true }, 'execution-state', 'executor');
      expect(execResult.success).toBe(true);

      // Executor CANNOT write to plan-state
      const badResult = instance.stateStore.set('plan', { phases: [] }, 'plan-state', 'executor');
      expect(badResult.success).toBe(false);
      expect(badResult.error).toContain('does not own domain');
    });
  });

  describe('BrainMessenger cross-brain communication', () => {
    it('delivers messages between parallel brains', () => {
      const factory = createArchitectureFactory();
      registerAllTemplates(factory);

      const instance = factory.create(sharkConfig);

      // Architect sends handoff to Executor
      instance.messenger.send({
        id: 'handoff-1',
        from: 'architect',
        to: 'executor',
        type: 'handoff',
        priority: 'high',
        payload: { phase: 'planning-complete', nextPhase: 'implementation' },
        timestamp: Date.now(),
        requiresAck: false,
      });

      // Executor receives the message
      const executorMessages = instance.messenger.receive('executor');
      expect(executorMessages.length).toBe(1);
      expect(executorMessages[0].from).toBe('architect');
      expect(executorMessages[0].type).toBe('handoff');
    });
  });
});
