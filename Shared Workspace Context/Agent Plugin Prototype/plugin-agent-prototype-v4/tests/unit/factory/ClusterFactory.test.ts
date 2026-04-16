import { describe, it, expect } from 'bun:test';
import { ClusterFactory } from '../../../src/factory/ClusterFactory.js';
import type { AgentDefinition } from '../../../src/factory/types.js';

describe('ClusterFactory', () => {
  const factory = new ClusterFactory();

  const testAgents = new Map<string, AgentDefinition>([
    ['coder', {
      id: 'coder', name: 'Coder', mode: 'coder', description: 'Coder',
      capabilities: ['coding'], allowedTools: ['write'], maxConcurrentTasks: 1,
    }],
    ['reviewer', {
      id: 'reviewer', name: 'Reviewer', mode: 'reviewer', description: 'Reviewer',
      capabilities: ['review'], allowedTools: ['read'], maxConcurrentTasks: 1,
    }],
  ]);

  describe('create', () => {
    it('creates a cluster with resolved agents', () => {
      const cluster = factory.create({
        id: 'execution',
        name: 'Execution',
        agents: ['coder'],
        intraClusterDelegation: true,
        interClusterDelegation: false,
        sharedContext: true,
      }, testAgents);

      expect(cluster.config.id).toBe('execution');
      expect(cluster.agents.length).toBe(1);
      expect(cluster.agents[0].id).toBe('coder');
    });

    it('creates a cluster with subOrchestrator', () => {
      const agentsWithSub = new Map(testAgents);
      agentsWithSub.set('sub-orch', {
        id: 'sub-orch', name: 'Sub Orchestrator', mode: 'architect',
        description: 'Sub orchestrator', capabilities: ['planning'],
        allowedTools: ['*'], maxConcurrentTasks: 2,
      });

      const cluster = factory.create({
        id: 'managed-cluster',
        name: 'Managed Cluster',
        agents: ['coder'],
        subOrchestrator: 'sub-orch',
        intraClusterDelegation: true,
        interClusterDelegation: false,
        sharedContext: true,
      }, agentsWithSub);

      expect(cluster.subOrchestrator).toBeDefined();
      expect(cluster.subOrchestrator?.id).toBe('sub-orch');
    });

    it('throws if agent reference does not exist', () => {
      expect(() =>
        factory.create({
          id: 'bad-cluster',
          name: 'Bad Cluster',
          agents: ['nonexistent-agent'],
          intraClusterDelegation: false,
          interClusterDelegation: false,
          sharedContext: true,
        }, testAgents),
      ).toThrow();
    });
  });

  describe('createHierarchy', () => {
    it('creates multiple clusters', () => {
      const clusters = factory.createHierarchy([
        {
          id: 'execution',
          name: 'Execution',
          agents: ['coder'],
          intraClusterDelegation: true,
          interClusterDelegation: false,
          sharedContext: true,
        },
        {
          id: 'qa',
          name: 'QA',
          agents: ['reviewer'],
          intraClusterDelegation: false,
          interClusterDelegation: true,
          sharedContext: true,
        },
      ], testAgents);

      expect(clusters.length).toBe(2);
      expect(clusters[0].config.id).toBe('execution');
      expect(clusters[1].config.id).toBe('qa');
    });
  });

  describe('validate', () => {
    it('returns valid for correct cluster', () => {
      const result = factory.validate({
        id: 'valid',
        name: 'Valid Cluster',
        agents: ['coder'],
        intraClusterDelegation: false,
        interClusterDelegation: false,
        sharedContext: true,
      }, ['coder']);

      expect(result.valid).toBe(true);
    });

    it('returns errors for missing id', () => {
      const result = factory.validate({
        id: '',
        name: 'Bad Cluster',
        agents: [],
        intraClusterDelegation: false,
        interClusterDelegation: false,
        sharedContext: true,
      }, []);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('warns if cluster has no agents', () => {
      const result = factory.validate({
        id: 'empty',
        name: 'Empty Cluster',
        agents: [],
        intraClusterDelegation: false,
        interClusterDelegation: false,
        sharedContext: true,
      }, []);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('errors if agent reference does not exist', () => {
      const result = factory.validate({
        id: 'bad-refs',
        name: 'Bad Refs',
        agents: ['nonexistent'],
        intraClusterDelegation: false,
        interClusterDelegation: false,
        sharedContext: true,
      }, ['coder']);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
