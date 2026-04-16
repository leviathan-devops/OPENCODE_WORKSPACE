import { describe, it, expect } from 'bun:test';
import { AgentFactory } from '../../../src/factory/AgentFactory.js';
import type { AgentTemplate } from '../../../src/factory/types.js';

describe('AgentFactory', () => {
  const factory = new AgentFactory();

  // Register a test template
  const testTemplate: AgentTemplate = {
    id: 'test-agent',
    description: 'A test agent template',
    tools: ['read', 'write', 'bash'],
    capabilities: ['coding', 'testing'],
    prompt: 'You are a test agent.',
    defaultModel: 'sonnet',
    defaultTemperature: 0.2,
  };

  factory.registerTemplate(testTemplate);

  describe('createAgent', () => {
    it('creates an agent from scratch', () => {
      const agent = factory.createAgent('my-agent', {
        name: 'My Agent',
        mode: 'coder',
        description: 'A custom agent',
        capabilities: ['coding'],
        allowedTools: ['write', 'edit'],
        maxConcurrentTasks: 2,
      });

      expect(agent.id).toBe('my-agent');
      expect(agent.name).toBe('My Agent');
      expect(agent.mode).toBe('coder');
      expect(agent.capabilities).toEqual(['coding']);
      expect(agent.allowedTools).toEqual(['write', 'edit']);
      expect(agent.maxConcurrentTasks).toBe(2);
    });

    it('uses defaults for missing fields', () => {
      const agent = factory.createAgent('minimal', {});

      expect(agent.id).toBe('minimal');
      expect(agent.name).toBe('minimal');
      expect(agent.mode).toBe('generic');
      expect(agent.description).toBe('');
      expect(agent.capabilities).toEqual([]);
      expect(agent.allowedTools).toEqual([]);
      expect(agent.maxConcurrentTasks).toBe(1);
    });

    it('throws if id is missing', () => {
      expect(() => factory.createAgent('', {})).toThrow();
    });
  });

  describe('createFromTemplate', () => {
    it('creates an agent from a template', () => {
      const agent = factory.createFromTemplate('test-agent', 'my-test-agent');

      expect(agent.id).toBe('my-test-agent');
      expect(agent.mode).toBe('test-agent');
      expect(agent.description).toBe('A test agent template');
      expect(agent.allowedTools).toEqual(['read', 'write', 'bash']);
      expect(agent.capabilities).toEqual(['coding', 'testing']);
      expect(agent.prompt).toBe('You are a test agent.');
      expect(agent.model).toBe('sonnet');
      expect(agent.temperature).toBe(0.2);
    });

    it('throws if template not found', () => {
      expect(() => factory.createFromTemplate('nonexistent', 'my-agent')).toThrow();
    });

    it('applies overrides when provided', () => {
      const agent = factory.createFromTemplate('test-agent', 'custom-agent', {
        prompt: 'Custom prompt',
        maxConcurrentTasks: 3,
      });

      expect(agent.prompt).toBe('Custom prompt');
      expect(agent.maxConcurrentTasks).toBe(3);
      // Original tools preserved
      expect(agent.allowedTools).toEqual(['read', 'write', 'bash']);
    });
  });

  describe('extend', () => {
    it('merges overrides into existing agent', () => {
      const agent = factory.createAgent('base', {
        name: 'Base',
        mode: 'coder',
        description: 'Base agent',
        capabilities: ['coding'],
        allowedTools: ['read', 'write'],
        maxConcurrentTasks: 1,
        prompt: 'Original prompt',
      });

      const extended = factory.extend(agent, {
        prompt: 'New prompt',
        maxConcurrentTasks: 3,
      });

      expect(extended.prompt).toBe('New prompt');
      expect(extended.maxConcurrentTasks).toBe(3);
      // Original fields preserved
      expect(extended.allowedTools).toEqual(['read', 'write']);
      expect(extended.capabilities).toEqual(['coding']);
    });

    it('UNIONS tools instead of replacing them', () => {
      const agent = factory.createAgent('base', {
        name: 'Base',
        mode: 'coder',
        description: 'Base agent',
        capabilities: ['coding'],
        allowedTools: ['read', 'write'],
        maxConcurrentTasks: 1,
      });

      const extended = factory.extend(agent, {
        tools: ['bash', 'grep', 'read'], // 'read' is duplicate
      });

      // Tools should be unioned: original + new, no duplicates
      expect(extended.allowedTools).toContain('read');
      expect(extended.allowedTools).toContain('write');
      expect(extended.allowedTools).toContain('bash');
      expect(extended.allowedTools).toContain('grep');
      expect(extended.allowedTools.length).toBe(4); // No duplicates
    });
  });

  describe('createAgents', () => {
    it('processes mixed config (templates and definitions)', () => {
      const agents = factory.createAgents({
        agent1: 'test-agent', // template reference
        agent2: {
          id: 'agent2',
          name: 'Agent 2',
          mode: 'custom',
          description: 'Custom agent',
          capabilities: ['testing'],
          allowedTools: ['test'],
          maxConcurrentTasks: 1,
        },
      });

      expect(agents.size).toBe(2);
      expect(agents.get('agent1')?.mode).toBe('test-agent');
      expect(agents.get('agent2')?.name).toBe('Agent 2');
    });

    it('throws if template reference not found', () => {
      expect(() =>
        factory.createAgents({ bad: 'nonexistent-template' }),
      ).toThrow();
    });
  });

  describe('validate', () => {
    it('returns valid for a complete agent', () => {
      const agent = factory.createAgent('valid', {
        name: 'Valid',
        mode: 'coder',
        description: 'A valid agent',
        capabilities: ['coding'],
        allowedTools: ['write'],
        maxConcurrentTasks: 1,
      });

      const result = factory.validate(agent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns errors for missing required fields', () => {
      const agent = factory.createAgent('bad', {
        mode: '',
        description: '',
        capabilities: [],
        allowedTools: [],
        maxConcurrentTasks: 0,
      });

      const result = factory.validate(agent);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns warnings for missing optional fields', () => {
      const agent = factory.createAgent('minimal', {});

      const result = factory.validate(agent);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
