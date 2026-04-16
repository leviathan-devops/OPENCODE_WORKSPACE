import { describe, it, expect } from 'bun:test';
import { ArchitectureFactory } from '../../../src/factory/ArchitectureFactory.js';
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
} from '../../../src/factory/templates/agent/index.js';
import type { ArchitectureConfig } from '../../../src/factory/types.js';

describe('ArchitectureFactory', () => {
  const factory = new ArchitectureFactory();

  // Register all templates
  const templates = [
    architectTemplate, executorTemplate, coderTemplate, reviewerTemplate,
    testEngineerTemplate, smeTemplate, explorerTemplate, criticTemplate,
    docsTemplate, designerTemplate,
  ];
  for (const t of templates) {
    factory.registerTemplate(t);
  }

  describe('create — Spider (single brain)', () => {
    it('creates a single-brain architecture', () => {
      const config: ArchitectureConfig = {
        name: 'test-spider',
        version: '1.0.0',
        description: 'Test spider architecture',
        brain: {
          type: 'single',
          name: 'test-brain',
          orchestrator: 'architect',
        },
        clusters: [
          {
            id: 'execution', name: 'Execution', agents: ['coder'],
            intraClusterDelegation: false, interClusterDelegation: false, sharedContext: true,
          },
          {
            id: 'qa', name: 'QA', agents: ['reviewer', 'test-engineer'],
            intraClusterDelegation: false, interClusterDelegation: true, sharedContext: true,
          },
        ],
        agents: {
          architect: 'architect',
          coder: 'coder',
          reviewer: 'reviewer',
          'test-engineer': 'test-engineer',
        },
      };

      const instance = factory.create(config);

      expect(instance.config.name).toBe('test-spider');
      expect(instance.brains.type).toBe('single');
      expect(instance.brains.primary).toBe('architect');
      expect(instance.brains.all).toEqual(['architect']);
      expect(instance.agents.size).toBe(4);
      expect(instance.clusters.size).toBe(2);
      expect(instance.coordination.registry).toBeDefined();
      expect(instance.coordination.delegation).toBeDefined();
      expect(instance.coordination.stateMachine).toBeDefined();
      expect(instance.stateStore).toBeDefined();
      expect(instance.messenger).toBeDefined();
    });
  });

  describe('create — Shark (dual brain)', () => {
    it('creates a dual-brain architecture with 2 orchestrators', () => {
      const config: ArchitectureConfig = {
        name: 'test-shark',
        version: '1.0.0',
        description: 'Test shark architecture',
        brain: {
          type: 'dual',
          name: 'test-dual-brain',
          syncMode: 'shared-state',
          orchestrators: {
            architect: 'architect',
            executor: 'executor',
          },
          workflows: {
            architect: {
              name: 'Architect', description: 'Planning',
              owns: ['planning'], delegatesTo: ['research'],
            },
            executor: {
              name: 'Executor', description: 'Execution',
              owns: ['execution'], delegatesTo: ['coder'],
            },
          },
        },
        clusters: [
          {
            id: 'execution', name: 'Execution', agents: ['coder'],
            intraClusterDelegation: true, interClusterDelegation: false, sharedContext: true,
          },
        ],
        agents: {
          architect: 'architect',
          executor: 'executor',
          coder: 'coder',
        },
      };

      const instance = factory.create(config);

      expect(instance.brains.type).toBe('dual');
      expect(instance.brains.all.length).toBe(2);
      expect(instance.brains.all).toContain('architect');
      expect(instance.brains.all).toContain('executor');
      expect(instance.brains.syncMode).toBe('shared-state');
      expect(instance.brains.workflows).toBeDefined();
      expect(Object.keys(instance.brains.workflows!)).toHaveLength(2);
    });
  });

  describe('create — Trio (triple brain)', () => {
    it('creates a trio-brain architecture with 3 orchestrators', () => {
      const config: ArchitectureConfig = {
        name: 'test-trio',
        version: '1.0.0',
        description: 'Test trio architecture',
        brain: {
          type: 'trio',
          name: 'test-trio-brain',
          syncMode: 'shared-state',
          orchestrators: {
            architect: 'architect',
            executor: 'executor',
            guardian: 'guardian',
          },
          workflows: {
            architect: {
              name: 'Architect', description: 'Planning',
              owns: ['planning'], delegatesTo: ['research'],
            },
            executor: {
              name: 'Executor', description: 'Execution',
              owns: ['execution'], delegatesTo: ['coder'],
            },
            guardian: {
              name: 'Guardian', description: 'Quality',
              owns: ['quality'], delegatesTo: ['reviewer'],
            },
          },
        },
        clusters: [
          {
            id: 'execution', name: 'Execution', agents: ['coder'],
            intraClusterDelegation: true, interClusterDelegation: false, sharedContext: true,
          },
        ],
        agents: {
          architect: 'architect',
          executor: 'executor',
          guardian: 'critic',
          coder: 'coder',
        },
      };

      const instance = factory.create(config);

      expect(instance.brains.type).toBe('trio');
      expect(instance.brains.all.length).toBe(3);
      expect(instance.brains.all).toContain('architect');
      expect(instance.brains.all).toContain('executor');
      expect(instance.brains.all).toContain('guardian');
    });
  });

  describe('validate', () => {
    it('returns valid for correct config', () => {
      const result = factory.validate({
        name: 'valid',
        version: '1.0.0',
        brain: { type: 'single', name: 'brain', orchestrator: 'architect' },
        clusters: [{
          id: 'c1', name: 'C1', agents: ['architect'],
          intraClusterDelegation: false, interClusterDelegation: false, sharedContext: true,
        }],
        agents: {
          architect: {
            id: 'architect', name: 'Architect', mode: 'architect',
            description: 'Architect', capabilities: [], allowedTools: ['*'], maxConcurrentTasks: 1,
          },
        },
      });

      expect(result.valid).toBe(true);
    });

    it('returns errors for missing required fields', () => {
      const result = factory.validate({
        name: '',
        version: '',
        brain: {} as any,
        clusters: [],
        agents: {},
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('template management', () => {
    it('lists all registered templates', () => {
      const templateList = factory.listTemplates();
      expect(templateList.length).toBe(10);
    });

    it('gets a template by ID', () => {
      const template = factory.getTemplate('architect');
      expect(template).toBeDefined();
      expect(template?.id).toBe('architect');
    });
  });

  describe('coordination layer', () => {
    it('registry can get agents', () => {
      const config: ArchitectureConfig = {
        name: 'test-registry',
        version: '1.0.0',
        brain: { type: 'single', name: 'brain', orchestrator: 'architect' },
        clusters: [{
          id: 'c1', name: 'C1', agents: ['architect'],
          intraClusterDelegation: false, interClusterDelegation: false, sharedContext: true,
        }],
        agents: {
          architect: 'architect',
        },
      };

      const instance = factory.create(config);
      const agent = instance.coordination.registry.getAgent('architect');
      expect(agent).not.toBeNull();
      expect(agent?.id).toBe('architect');
    });

    it('state machine can create and transition tasks', () => {
      const config: ArchitectureConfig = {
        name: 'test-sm',
        version: '1.0.0',
        brain: { type: 'single', name: 'brain', orchestrator: 'architect' },
        clusters: [{
          id: 'c1', name: 'C1', agents: ['architect'],
          intraClusterDelegation: false, interClusterDelegation: false, sharedContext: true,
        }],
        agents: {
          architect: 'architect',
        },
      };

      const instance = factory.create(config);
      const sm = instance.coordination.stateMachine;

      const task = sm.createTask({
        id: 'task-1',
        description: 'Test task',
        assignedAgent: 'architect',
      });

      expect(task.id).toBe('task-1');
      expect(task.status).toBe('pending');

      const updated = sm.transition('task-1', 'in_progress');
      expect(updated?.status).toBe('in_progress');

      const retrieved = sm.getTask('task-1');
      expect(retrieved?.status).toBe('in_progress');
    });

    it('delegation engine can delegate', async () => {
      const config: ArchitectureConfig = {
        name: 'test-delegation',
        version: '1.0.0',
        brain: { type: 'single', name: 'brain', orchestrator: 'architect' },
        clusters: [{
          id: 'c1', name: 'C1', agents: ['architect'],
          intraClusterDelegation: false, interClusterDelegation: false, sharedContext: true,
        }],
        agents: {
          architect: 'architect',
        },
      };

      const instance = factory.create(config);
      const result = await instance.coordination.delegation.delegate({
        taskId: 'task-1',
        target: { agentId: 'architect', agentMode: 'architect' },
        task: 'Do something',
      });

      expect(result.success).toBe(true);
      expect(result.delegatedTo).toBe('architect');
    });
  });
});
