# V4 Factory Index — ArchitectureFactory, AgentFactory, BrainFactory, ClusterFactory

Full code of key factory files from `/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Agent-Factory-Edition/src/factory/`.

## ArchitectureFactory.ts

```typescript
import type {
  ArchitectureConfig,
  ArchitectureInstance,
  AgentDefinition,
  AgentTemplate,
  ValidationResult,
} from './types.js';
import type {
  AgentRegistry,
  DelegationEngine,
  StateMachine,
  AgentDefinition as V3AgentDefinition,
  AgentMode,
  DelegationRequest,
  DelegationResult,
  GateResult,
  TaskStatus,
  CreateTaskInput,
  Task,
} from '../coordination/types.js';
import { AgentFactory } from './AgentFactory.js';
import { BrainFactory } from './BrainFactory.js';
import { ClusterFactory } from './ClusterFactory.js';
import { createStateStore } from './StateStore.js';
import { createBrainMessenger } from './BrainMessenger.js';
import { runValidators, architectureValidators } from './validators.js';

export class ArchitectureFactory {
  private agentFactory: AgentFactory;
  private brainFactory: BrainFactory;
  private clusterFactory: ClusterFactory;

  constructor() {
    this.agentFactory = new AgentFactory();
    this.brainFactory = new BrainFactory();
    this.clusterFactory = new ClusterFactory();
  }

  registerTemplate(template: AgentTemplate): void {
    this.agentFactory.registerTemplate(template);
  }

  getTemplate(templateId: string): AgentTemplate | undefined {
    return this.agentFactory.getTemplate(templateId);
  }

  listTemplates(): AgentTemplate[] {
    return this.agentFactory.listTemplates();
  }

  validate(config: ArchitectureConfig): ValidationResult {
    return runValidators(architectureValidators, config);
  }

  create(config: ArchitectureConfig): ArchitectureInstance {
    // 1. Validate
    const validation = this.validate(config);
    if (!validation.valid) {
      throw new Error(`ArchitectureFactory.create: validation failed — ${validation.errors.join('; ')}`);
    }

    // 2. Create agents
    const agents = this.agentFactory.createAgents(config.agents,
      new Map(this.agentFactory.listTemplates().map((t) => [t.id, t])));

    // Validate each agent
    for (const [id, agent] of agents) {
      const agentValidation = this.agentFactory.validate(agent);
      if (!agentValidation.valid) {
        throw new Error(`Agent "${id}" validation failed — ${agentValidation.errors.join(', ')}`);
      }
    }

    // 3. Create brains
    const brainInstance = this.brainFactory.create(config.brain);

    // 4. Create clusters
    const clusters = this.clusterFactory.createHierarchy(config.clusters, agents);

    // Validate clusters
    const agentIds = Array.from(agents.keys());
    for (const cluster of config.clusters) {
      const clusterValidation = this.clusterFactory.validate(cluster, agentIds);
      if (!clusterValidation.valid) {
        throw new Error(`Cluster "${cluster.id}" validation failed — ${clusterValidation.errors.join(', ')}`);
      }
    }

    // 5. Create StateStore + BrainMessenger
    const stateStore = createStateStore();
    const messenger = createBrainMessenger();

    // 6. Build V3 coordination layer
    const registry = this.buildRegistry(agents, clusters);
    const delegation = this.buildDelegationEngine(registry, clusters);
    const stateMachine = this.buildStateMachine();

    const clusterMap = new Map<string, import('./types.js').ClusterConfig>();
    for (const cluster of config.clusters) {
      clusterMap.set(cluster.id, cluster);
    }

    return {
      config, agents, clusters: clusterMap,
      brains: {
        type: brainInstance.type,
        primary: brainInstance.primary,
        all: brainInstance.all,
        workflows: brainInstance.workflows,
        syncMode: brainInstance.syncMode,
      },
      coordination: { registry, delegation, stateMachine },
      stateStore, messenger,
    };
  }

  private buildRegistry(agents, clusters): AgentRegistry {
    const v3Agents = new Map<string, V3AgentDefinition>();
    for (const [id, agent] of agents) {
      v3Agents.set(id, {
        id: agent.id,
        name: agent.name,
        mode: agent.mode as AgentMode,
        description: agent.description,
        cluster: agent.cluster,
        capabilities: agent.capabilities,
        allowedTools: agent.allowedTools,
        maxConcurrentTasks: agent.maxConcurrentTasks,
        agentPrefix: agent.brain,
      });
    }

    return {
      getAgent(agentId: string) { return v3Agents.get(agentId) ?? null; },
      getAgentsByMode(mode: AgentMode) { return Array.from(v3Agents.values()).filter((a) => a.mode === mode); },
      getAgentsByCluster(clusterId: string) {
        const cluster = clusters.find((c) => c.config.id === clusterId);
        return cluster ? cluster.agents : [];
      },
      isAgentAllowedTool(agentId: string, toolName: string) {
        const agent = v3Agents.get(agentId);
        if (!agent) return false;
        if (agent.allowedTools.includes('*')) return true;
        return agent.allowedTools.includes(toolName);
      },
      listAgents() { return Array.from(v3Agents.values()); },
    };
  }

  private buildDelegationEngine(registry, clusters): DelegationEngine {
    return {
      async delegate(request: DelegationRequest): Promise<DelegationResult> {
        const target = registry.getAgent(request.target.agentId);
        if (!target) return { success: false, taskId: request.taskId, reason: `Agent "${request.target.agentId}" not found` };
        return { success: true, taskId: request.taskId, delegatedTo: request.target.agentId };
      },
      canDelegate(fromAgent: string, toAgent: string) { return !!(registry.getAgent(fromAgent) && registry.getAgent(toAgent)); },
      getClusterAgents(clusterId: string) {
        const cluster = clusters.find((c) => c.config.id === clusterId);
        return cluster ? cluster.agents : [];
      },
      enforceGate(_request: DelegationRequest): GateResult {
        return { decision: 'APPROVED', gateName: 'delegation', reason: 'Delegation approved' };
      },
    };
  }

  private buildStateMachine(): StateMachine {
    const tasks = new Map<string, Task>();

    return {
      createTask(input: CreateTaskInput): Task {
        const now = Date.now();
        const task: Task = { id: input.id, description: input.description, status: 'pending',
          assignedAgent: input.assignedAgent, depends: input.depends, createdAt: now, updatedAt: now,
          phase: input.phase, acceptance: input.acceptance, size: input.size };
        tasks.set(task.id, task);
        return task;
      },
      transition(taskId: string, to: TaskStatus): Task | null {
        const task = tasks.get(taskId);
        if (!task) return null;
        task.status = to;
        task.updatedAt = Date.now();
        return task;
      },
      getTask(taskId: string) { return tasks.get(taskId) ?? null; },
      getTasksByState(state: TaskStatus) { return Array.from(tasks.values()).filter((t) => t.status === state); },
      getTasksByAgent(agentId: string) { return Array.from(tasks.values()).filter((t) => t.assignedAgent === agentId); },
      canTransition(taskId: string, _to: TaskStatus): boolean {
        const task = tasks.get(taskId);
        if (!task) return false;
        return !['completed', 'failed', 'cancelled'].includes(task.status);
      },
    };
  }
}

export function createArchitectureFactory(): ArchitectureFactory {
  return new ArchitectureFactory();
}
```

## BrainFactory.ts (conceptual — not available as separate file, described in types)

Brain creation is based on `BrainConfig`:

```typescript
// BrainConfig types — from types.js
interface BrainConfig {
  type: 'single' | 'dual' | 'trio';
  name: string;
  syncMode?: 'shared-state' | 'message-passing';
  orchestrator?: string;                    // single brain
  orchestrators?: Record<string, string>;  // dual/trio brains
  workflows?: Record<string, {
    name: string;
    description: string;
    owns?: string[];
    delegatesTo?: string[];
    gates?: string[];
  }>;
}

interface BrainInstance {
  type: 'single' | 'dual' | 'trio';
  name: string;
  primary: OrchestratorInstance;
  all: OrchestratorInstance[];
  workflows: Record<string, WorkflowConfig>;
  syncMode: 'shared-state' | 'message-passing';
}
```

## StateStore.ts

```typescript
export const DOMAIN_OWNERSHIP: Record<StateDomain, string[]> = {
  'plan-state': ['architect'],
  'execution-state': ['executor'],
  'quality-state': ['guardian', 'executor'],
};

export function createStateStore(): StateStore {
  const data = new Map<string, any>();
  const versions = new Map<string, number>();
  const watchers = new Map<string, Array<(value: any, version: number) => void>>();

  function getKey(key: string, domain?: StateDomain): string {
    return domain ? `${domain}:${key}` : key;
  }

  return {
    get<T>(key: string, domain?: StateDomain): T | undefined {
      return data.get(getKey(key, domain)) as T | undefined;
    },

    set<T>(key: string, value: T, domain: StateDomain, ownerBrain?: string): WriteResult {
      const fullKey = getKey(key, domain);
      if (ownerBrain) {
        const owners = DOMAIN_OWNERSHIP[domain];
        if (owners && !owners.includes(ownerBrain)) {
          return { success: false, version: versions.get(fullKey) ?? 0,
            error: `Brain "${ownerBrain}" does not own domain "${domain}"` };
        }
      }
      const currentVersion = versions.get(fullKey) ?? 0;
      const newVersion = currentVersion + 1;
      data.set(fullKey, value);
      versions.set(fullKey, newVersion);
      // Notify watchers
      const watchersForKey = watchers.get(fullKey);
      if (watchersForKey) {
        for (const callback of watchersForKey) {
          try { callback(value, newVersion); } catch { /* ignore */ }
        }
      }
      return { success: true, version: newVersion };
    },

    watch(key: string, callback: (value: any, version: number) => void): Unsubscribe {
      const allKeys = [key, ...Object.keys(DOMAIN_OWNERSHIP).map(d => `${d}:${key}`)];
      for (const fullKey of allKeys) {
        if (!watchers.has(fullKey)) watchers.set(fullKey, []);
        watchers.get(fullKey)!.push(callback);
      }
      return () => {
        for (const fullKey of allKeys) {
          const list = watchers.get(fullKey);
          if (list) { const idx = list.indexOf(callback); if (idx !== -1) list.splice(idx, 1); }
        }
      };
    },

    snapshot(): StateSnapshot {
      return {
        data: Object.fromEntries(data),
        versions: Object.fromEntries(versions),
        timestamp: Date.now(),
      };
    },

    restore(snapshot: StateSnapshot): void {
      data.clear(); versions.clear();
      for (const [key, value] of Object.entries(snapshot.data)) data.set(key, value);
      for (const [key, version] of Object.entries(snapshot.versions)) versions.set(key, version as number);
    },
  };
}
```

## BrainMessenger.ts

```typescript
const PRIORITY_ORDER = { critical: 0, high: 1, normal: 2, low: 3 };

export function createBrainMessenger(): BrainMessenger {
  const queues = new Map<string, BrainMessage[]>();
  const pendingAcks = new Map<string, { resolved: boolean; resolve: (v: boolean) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  const receivedAcks = new Set<string>();

  function getQueue(brainId: string): BrainMessage[] {
    if (!queues.has(brainId)) queues.set(brainId, []);
    return queues.get(brainId)!;
  }

  return {
    send(message: BrainMessage): void {
      const msg: BrainMessage = { id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        from: message.from, to: message.to, type: message.type, priority: message.priority,
        payload: message.payload, timestamp: message.timestamp || Date.now(), requiresAck: message.requiresAck ?? false };
      getQueue(msg.to).push(msg);
      getQueue(msg.to).sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      if (msg.type === 'ack') {
        if (pendingAcks.has(msg.id)) { const p = pendingAcks.get(msg.id)!; if (!p.resolved) { p.resolved = true; clearTimeout(p.timer); p.resolve(true); } }
        else receivedAcks.add(msg.id);
      }
    },

    receive(brainId: string): BrainMessage[] {
      const q = getQueue(brainId); const msgs = [...q]; q.length = 0; return msgs;
    },

    waitForAck(messageId: string, timeoutMs: number): Promise<boolean> {
      if (receivedAcks.has(messageId)) { receivedAcks.delete(messageId); return Promise.resolve(true); }
      return new Promise((resolve, _reject) => {
        const timer = setTimeout(() => { if (!pendingAcks.get(messageId)?.resolved) resolve(false); }, timeoutMs);
        pendingAcks.set(messageId, { resolved: false, resolve, reject: () => {}, timer });
      });
    },
  };
}
```
