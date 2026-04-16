/**
 * V4.1.1 End-to-End Test Suite
 * Tests V4 presets, wizard elicitation, factory integration, state, messaging, and coordination.
 */

import { describe, it, expect } from 'vitest';
import {
  createV4Instance,
  extractFromQandA,
  specToConfig,
  createStateStore,
} from '../../dist/index.js';

// ============================================================
// TEST HELPERS
// ============================================================

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// ============================================================
// V4 PRESETS
// ============================================================

describe('V4 Presets', () => {
  it('Spider preset creates single-brain architecture', async () => {
    const spider = await createV4Instance({ architecture: 'spider' });
    expect(spider.brains.type).toBe('single');
    expect(spider.agents.size).toBeGreaterThan(0);
    expect(spider.clusters.size).toBeGreaterThan(0);
  });

  it('Shark preset creates dual-brain architecture', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    expect(shark.brains.type).toBe('dual');
    expect(shark.brains.all).toContain('architect');
    expect(shark.brains.all).toContain('executor');
    expect(shark.agents.size).toBeGreaterThan(0);
    expect(shark.clusters.size).toBeGreaterThan(0);
  });

  it('Trio preset creates triple-brain architecture', async () => {
    const trio = await createV4Instance({ architecture: 'trio' });
    expect(trio.brains.type).toBe('trio');
    expect(trio.brains.all).toContain('architect');
    expect(trio.brains.all).toContain('executor');
    expect(trio.brains.all).toContain('guardian');
    expect(trio.agents.size).toBeGreaterThan(0);
  });
});

// ============================================================
// WIZARD ELICITATION
// ============================================================

describe('Wizard Elicitation', () => {
  it('extractFromQandA produces valid dual-brain config', () => {
    const result = extractFromQandA('Research assistant', [
      { questionId: 'brain_type', answer: 'dual' },
      { questionId: 'orchestrator_names', answer: 'Planner, Writer' },
      { questionId: 'workflow_clusters', answer: 'research, writing' },
      { questionId: 'agents_per_cluster', answer: 'researcher: search\nwriter: write' },
      { questionId: 'delegation_pattern', answer: 'yes' },
      { questionId: 'quality_gates', answer: 'no' },
      { questionId: 'parallel_execution', answer: 'no' },
      { questionId: 'context_sharing', answer: 'yes' },
      { questionId: 'special_requirements', answer: '' },
    ]);
    expect(result.config.brain.type).toBe('dual');
    expect(result.config.clusters.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBe(0);
    expect(result.sessionId).toBeDefined();
  });

  it('extractFromQandA produces valid trio config', () => {
    const result = extractFromQandA('Full system', [
      { questionId: 'brain_type', answer: 'trio' },
      { questionId: 'orchestrator_names', answer: 'Planner, Executor, Guardian' },
      { questionId: 'workflow_clusters', answer: 'research, coding, qa' },
      { questionId: 'agents_per_cluster', answer: 'r: research\nc: code\nq: qa' },
      { questionId: 'delegation_pattern', answer: 'yes' },
      { questionId: 'quality_gates', answer: 'yes' },
      { questionId: 'parallel_execution', answer: 'yes' },
      { questionId: 'context_sharing', answer: 'yes' },
      { questionId: 'special_requirements', answer: '' },
    ]);
    expect(result.config.brain.type).toBe('trio');
    expect(Object.keys(result.config.brain.orchestrators!).length).toBe(3);
  });

  it('Session IDs are unique per elicitation', () => {
    const makeQandA = (n: number) => [
      { questionId: 'brain_type', answer: 'single' },
      { questionId: 'orchestrator_names', answer: 'Lead' },
      { questionId: 'workflow_clusters', answer: 'work' },
      { questionId: 'agents_per_cluster', answer: 'w' },
      { questionId: 'delegation_pattern', answer: 'yes' },
      { questionId: 'quality_gates', answer: 'no' },
      { questionId: 'parallel_execution', answer: 'no' },
      { questionId: 'context_sharing', answer: 'yes' },
      { questionId: 'special_requirements', answer: '' },
    ].slice(0, n);
    
    const r1 = extractFromQandA('idea 1', makeQandA(9));
    const r2 = extractFromQandA('idea 2', makeQandA(9));
    expect(r1.sessionId).not.toBe(r2.sessionId);
  });

  it('specToConfig produces factory-ready config', async () => {
    const cfg = specToConfig({
      name: 'TestSpec',
      description: 'test spec',
      brainType: 'single',
      orchestrators: [{
        id: 'lead',
        name: 'Lead',
        role: 'architect',
        description: 'Leader',
        owns: ['plan-state'],
        delegatesTo: ['pool'],
        readOnly: [],
        gates: [],
      }],
      clusters: [{
        id: 'pool',
        name: 'Pool',
        description: 'Workers',
        agentIds: ['worker'],
        intraClusterDelegation: false,
        interClusterDelegation: false,
        sharedContext: true,
      }],
      agentRoles: [{
        id: 'worker',
        name: 'Worker',
        mode: 'coder',
        description: 'Does work',
        cluster: 'pool',
        capabilities: ['execute'],
        suggestedTools: ['*'],
        maxConcurrentTasks: 1,
      }],
    });
    const inst = await createV4Instance({ customConfig: cfg });
    expect(inst.config.name).toBe('TestSpec');
    expect(inst.brains.type).toBe('single');
  });
});

// ============================================================
// WIZARD → FACTORY
// ============================================================

describe('Wizard Config → Factory', () => {
  it('Wizard config feeds through factory successfully', async () => {
    const result = extractFromQandA('Test system', [
      { questionId: 'brain_type', answer: 'dual' },
      { questionId: 'orchestrator_names', answer: 'Alpha, Beta' },
      { questionId: 'workflow_clusters', answer: 'work' },
      { questionId: 'agents_per_cluster', answer: 'x: task' },
      { questionId: 'delegation_pattern', answer: 'yes' },
      { questionId: 'quality_gates', answer: 'no' },
      { questionId: 'parallel_execution', answer: 'yes' },
      { questionId: 'context_sharing', answer: 'yes' },
      { questionId: 'special_requirements', answer: '' },
    ]);
    const inst = await createV4Instance({ customConfig: result.config });
    expect(inst.brains.type).toBe('dual');
    expect(inst.brains.all.length).toBe(2);
    expect(inst.coordination.registry.listAgents().length).toBeGreaterThan(0);
  });
});

// ============================================================
// STATE STORE
// ============================================================

describe('StateStore', () => {
  it('domain ownership enforcement — architect writes plan-state', () => {
    const store = createStateStore();
    const result = store.set('key', 'value', 'plan-state', 'architect');
    expect(result.success).toBe(true);
  });

  it('domain ownership enforcement — executor blocked from plan-state', () => {
    const store = createStateStore();
    const result = store.set('key2', 'val', 'plan-state', 'executor');
    expect(result.success).toBe(false);
    expect(result.error).toContain('executor');
  });

  it('domain ownership enforcement — executor writes execution-state', () => {
    const store = createStateStore();
    const result = store.set('task1', 'active', 'execution-state', 'executor');
    expect(result.success).toBe(true);
  });

  it('get returns undefined for missing key', () => {
    const store = createStateStore();
    expect(store.get('nonexistent')).toBeUndefined();
  });

  it('has returns true for existing key', () => {
    const store = createStateStore();
    store.set('x', 'y', 'plan-state', 'architect');
    expect(store.has('x', 'plan-state')).toBe(true);
    expect(store.has('x')).toBe(true);
  });

  it('has returns false for missing key', () => {
    const store = createStateStore();
    expect(store.has('nonexistent')).toBe(false);
  });

  it('delete removes key and returns success', () => {
    const store = createStateStore();
    store.set('x', 'y', 'plan-state', 'architect');
    const result = store.delete('x', 'plan-state', 'architect');
    expect(result.success).toBe(true);
    expect(store.has('x', 'plan-state')).toBe(false);
  });

  it('delete enforces domain ownership', () => {
    const store = createStateStore();
    store.set('x', 'y', 'plan-state', 'architect');
    const result = store.delete('x', 'plan-state', 'executor');
    expect(result.success).toBe(false);
  });

  it('watcher receives callbacks on set', () => {
    const store = createStateStore();
    let called = false;
    store.set('x', 'init', 'plan-state', 'architect');
    store.watch('x', (_v) => { called = true; });
    store.set('x', 'updated', 'plan-state', 'architect');
    expect(called).toBe(true);
  });

  it('snapshot and restore', () => {
    const store = createStateStore();
    store.set('a', '1', 'plan-state', 'architect');
    store.set('b', '2', 'execution-state', 'executor');
    const snap = store.snapshot();
    const store2 = createStateStore();
    store2.restore(snap);
    expect(store2.get('a')).toBe('1');
    expect(store2.get('b')).toBe('2');
  });
});

// ============================================================
// BRAIN MESSENGER
// ============================================================

describe('BrainMessenger', () => {
  it('send and receive between brains', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    shark.messenger.send({
      id: 'm1',
      from: 'architect',
      to: 'executor',
      type: 'handoff',
      priority: 'high',
      payload: { task: 'build auth' },
      timestamp: Date.now(),
    });
    const received = shark.messenger.receive('executor');
    expect(received.length).toBe(1);
    expect(received[0].payload.task).toBe('build auth');
    expect(received[0].priority).toBe('high');
  });

  it('ack confirms message receipt', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    shark.messenger.send({
      id: 'm2',
      from: 'architect',
      to: 'executor',
      type: 'handoff',
      priority: 'high',
      payload: {},
      timestamp: Date.now(),
      requiresAck: true,
    });
    // ack() is void — it sends an ack message without returning a result
    expect(() => shark.messenger.ack('m2', 'executor')).not.toThrow();
  });

  it('priority filter works', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    shark.messenger.send({
      id: 'p1',
      from: 'architect',
      to: 'executor',
      type: 'info',
      priority: 'low',
      payload: {},
      timestamp: Date.now(),
    });
    shark.messenger.send({
      id: 'p2',
      from: 'architect',
      to: 'executor',
      type: 'handoff',
      priority: 'high',
      payload: {},
      timestamp: Date.now(),
    });
    const high = shark.messenger.receive('executor', { minPriority: 'high' });
    expect(high.length).toBe(1);
    expect(high[0].id).toBe('p2');
  });

  it('receive returns empty array for unknown recipient', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    const received = shark.messenger.receive('nonexistent-brain');
    expect(Array.isArray(received)).toBe(true);
    expect(received.length).toBe(0);
  });
});

// ============================================================
// AGENT REGISTRY
// ============================================================

describe('AgentRegistry', () => {
  it('getAgent returns correct mode for coder', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    const coder = shark.coordination.registry.getAgent('coder');
    expect(coder?.mode).toBe('coder');
  });

  it('getAgentsByMode returns coder agents', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    const coders = shark.coordination.registry.getAgentsByMode('coder');
    expect(coders.length).toBeGreaterThan(0);
  });

  it('listAgents returns all registered agents', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    const all = shark.coordination.registry.listAgents();
    expect(all.length).toBeGreaterThan(0);
  });
});

// ============================================================
// STATE MACHINE
// ============================================================

describe('StateMachine', () => {
  it('createTask initializes with pending status', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    shark.coordination.stateMachine.createTask({
      id: 't1',
      description: 'test task',
      assignedAgent: 'coder',
    });
    const task = shark.coordination.stateMachine.getTask('t1');
    expect(task?.status).toBe('pending');
  });

  it('transition advances task status', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    shark.coordination.stateMachine.createTask({
      id: 't2',
      description: 'test',
      assignedAgent: 'coder',
    });
    const next = shark.coordination.stateMachine.transition('t2', 'in_progress');
    expect(next?.status).toBe('in_progress');
  });

  it('getStats returns correct counts', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    shark.coordination.stateMachine.createTask({ id: 's1', description: 'a', assignedAgent: 'coder' });
    shark.coordination.stateMachine.createTask({ id: 's2', description: 'b', assignedAgent: 'coder' });
    const stats = shark.coordination.stateMachine.getStats();
    expect(stats.totalTasks).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// DELEGATION ENGINE
// ============================================================

describe('Delegation Engine', () => {
  it('delegate returns success with valid target', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });
    shark.coordination.stateMachine.createTask({ id: 'd1', description: 'test', assignedAgent: 'coder' });
    const result = await shark.coordination.delegation.delegate({
      taskId: 'd1',
      target: { agentId: 'coder', clusterId: 'execution-pool' },
      context: { prompt: 'do it' },
      priority: 'normal',
    });
    expect(result.success).toBe(true);
    expect(result.delegatedTo).toBe('coder');
  });
});

// ============================================================
// FULL INTEGRATION
// ============================================================

describe('Full Integration (Shark)', () => {
  it('state + messenger + delegation work together', async () => {
    const shark = await createV4Instance({ architecture: 'shark' });

    // Write state — domain is 'plan-state', ownerBrain is 'architect'
    shark.stateStore.set('phase', 'planning', 'plan-state', 'architect');
    const phase = shark.stateStore.get('phase', 'plan-state');
    expect(phase).toBe('planning');

    // Send message
    shark.messenger.send({
      id: 'i1',
      from: 'architect',
      to: 'executor',
      type: 'handoff',
      priority: 'high',
      payload: { phase: 'build' },
      timestamp: Date.now(),
    });
    const msgs = shark.messenger.receive('executor');
    expect(msgs.length).toBe(1);

    // Create and delegate task
    shark.coordination.stateMachine.createTask({ id: 'i2', description: 'ship', assignedAgent: 'coder' });
    const result = await shark.coordination.delegation.delegate({
      taskId: 'i2',
      target: { agentId: 'coder', clusterId: 'execution-pool' },
      context: { prompt: 'build auth' },
      priority: 'high',
    });
    expect(result.success).toBe(true);
  });
});
