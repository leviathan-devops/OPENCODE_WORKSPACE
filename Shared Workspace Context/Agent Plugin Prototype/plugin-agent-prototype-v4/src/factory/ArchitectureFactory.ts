/**
 * V4 Architecture Factory
 *
 * Main orchestrator: validates config, creates agents/brains/clusters,
 * wires into V3 coordination layer, returns ArchitectureInstance.
 */

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

// Bridge: convert V4 AgentDefinition to V3-compatible AgentDefinition
function toV3Agent(agent: AgentDefinition): V3AgentDefinition {
  return {
    id: agent.id,
    name: agent.name,
    mode: agent.mode as AgentMode,
    description: agent.description,
    cluster: agent.cluster,
    capabilities: agent.capabilities,
    allowedTools: agent.allowedTools,
    maxConcurrentTasks: agent.maxConcurrentTasks,
    agentPrefix: agent.brain,
  };
}

export class ArchitectureFactory {
  private agentFactory: AgentFactory;
  private brainFactory: BrainFactory;
  private clusterFactory: ClusterFactory;

  constructor() {
    this.agentFactory = new AgentFactory();
    this.brainFactory = new BrainFactory();
    this.clusterFactory = new ClusterFactory();
  }

  // ── Template Management ──────────────────────────────────

  registerTemplate(template: AgentTemplate): void {
    this.agentFactory.registerTemplate(template);
  }

  getTemplate(templateId: string): AgentTemplate | undefined {
    return this.agentFactory.getTemplate(templateId);
  }

  listTemplates(): AgentTemplate[] {
    return this.agentFactory.listTemplates();
  }

  // ── Validation ───────────────────────────────────────────

  validate(config: ArchitectureConfig): ValidationResult {
    return runValidators(architectureValidators, config);
  }

  // ── Create Architecture ──────────────────────────────────

  create(config: ArchitectureConfig): ArchitectureInstance {
    // Step 1: Validate
    const validation = this.validate(config);
    if (!validation.valid) {
      throw new Error(
        `ArchitectureFactory.create: validation failed — ${validation.errors.join('; ')}`,
      );
    }

    // Step 2: Create agents (resolve template references)
    const agents = this.agentFactory.createAgents(
      config.agents,
      new Map(this.agentFactory.listTemplates().map((t) => [t.id, t])),
    );

    // Validate each agent
    for (const [id, agent] of agents) {
      const agentValidation = this.agentFactory.validate(agent);
      if (!agentValidation.valid) {
        throw new Error(
          `ArchitectureFactory.create: agent "${id}" validation failed — ${agentValidation.errors.join(', ')}`,
        );
      }
    }

    // Step 3: Create brains
    const brainInstance = this.brainFactory.create(config.brain);

    // Step 4: Create clusters
    const clusters = this.clusterFactory.createHierarchy(config.clusters, agents);

    // Validate each cluster
    const agentIds = Array.from(agents.keys());
    for (const cluster of config.clusters) {
      const clusterValidation = this.clusterFactory.validate(cluster, agentIds);
      if (!clusterValidation.valid) {
        throw new Error(
          `ArchitectureFactory.create: cluster "${cluster.id}" validation failed — ${clusterValidation.errors.join(', ')}`,
        );
      }
    }

    // Step 5: Create StateStore and BrainMessenger
    const stateStore = createStateStore();
    const messenger = createBrainMessenger();

    // Step 6: Build coordination layer (V3-compatible)
    const registry = this.buildRegistry(agents, clusters);
    const delegation = this.buildDelegationEngine(registry, clusters);
    const stateMachine = this.buildStateMachine();

    // Build cluster map
    const clusterMap = new Map<string, import('./types.js').ClusterConfig>();
    for (const cluster of config.clusters) {
      clusterMap.set(cluster.id, cluster);
    }

    return {
      config,
      agents,
      clusters: clusterMap,
      brains: {
        type: brainInstance.type,
        primary: brainInstance.primary,
        all: brainInstance.all,
        workflows: brainInstance.workflows,
        syncMode: brainInstance.syncMode,
      },
      coordination: {
        registry,
        delegation,
        stateMachine,
      },
      stateStore,
      messenger,
    };
  }

  // ── V3 Coordination Layer Builders ───────────────────────

  private buildRegistry(
    agents: Map<string, AgentDefinition>,
    clusters: import('./types.js').ClusterInstance[],
  ): AgentRegistry {
    // Convert V4 agents to V3-compatible agents
    const v3Agents = new Map<string, V3AgentDefinition>();
    for (const [id, agent] of agents) {
      v3Agents.set(id, toV3Agent(agent));
    }

    return {
      getAgent(agentId: string): V3AgentDefinition | null {
        return v3Agents.get(agentId) ?? null;
      },

      getAgentsByMode(mode: AgentMode): V3AgentDefinition[] {
        return Array.from(v3Agents.values()).filter((a) => a.mode === mode);
      },

      getAgentsByCluster(clusterId: string): V3AgentDefinition[] {
        const cluster = clusters.find((c) => c.config.id === clusterId);
        return cluster ? cluster.agents.map(toV3Agent) : [];
      },

      isAgentAllowedTool(agentId: string, toolName: string): boolean {
        const agent = v3Agents.get(agentId);
        if (!agent) return false;
        if (agent.allowedTools.includes('*')) return true;
        return agent.allowedTools.includes(toolName);
      },

      listAgents(): V3AgentDefinition[] {
        return Array.from(v3Agents.values());
      },
    };
  }

  private buildDelegationEngine(
    registry: AgentRegistry,
    clusters: import('./types.js').ClusterInstance[],
  ): DelegationEngine {
    return {
      async delegate(request: DelegationRequest): Promise<DelegationResult> {
        const target = registry.getAgent(request.target.agentId);
        if (!target) {
          return {
            success: false,
            taskId: request.taskId,
            reason: `Agent "${request.target.agentId}" not found`,
          };
        }
        return {
          success: true,
          taskId: request.taskId,
          delegatedTo: request.target.agentId,
        };
      },

      canDelegate(fromAgent: string, toAgent: string): boolean {
        const from = registry.getAgent(fromAgent);
        const to = registry.getAgent(toAgent);
        return !!(from && to);
      },

      getClusterAgents(clusterId: string): V3AgentDefinition[] {
        const cluster = clusters.find((c) => c.config.id === clusterId);
        return cluster ? cluster.agents.map(toV3Agent) : [];
      },

      enforceGate(_request: DelegationRequest): GateResult {
        return {
          decision: 'APPROVED',
          gateName: 'delegation',
          reason: 'Delegation approved',
        };
      },
    };
  }

  private buildStateMachine(): StateMachine {
    const tasks = new Map<string, Task>();

    return {
      createTask(input: CreateTaskInput): Task {
        const now = Date.now();
        const task: Task = {
          id: input.id,
          description: input.description,
          status: 'pending',
          assignedAgent: input.assignedAgent,
          depends: input.depends,
          createdAt: now,
          updatedAt: now,
          phase: input.phase,
          acceptance: input.acceptance,
          size: input.size,
        };
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

      getTask(taskId: string): Task | null {
        return tasks.get(taskId) ?? null;
      },

      getTasksByState(state: TaskStatus): Task[] {
        return Array.from(tasks.values()).filter((t) => t.status === state);
      },

      getTasksByAgent(agentId: string): Task[] {
        return Array.from(tasks.values()).filter((t) => t.assignedAgent === agentId);
      },

      canTransition(taskId: string, _to: TaskStatus): boolean {
        const task = tasks.get(taskId);
        if (!task) return false;
        // Simple state machine: any transition is allowed except from completed/failed/cancelled
        if (['completed', 'failed', 'cancelled'].includes(task.status)) return false;
        return true;
      },

      getStats() {
        const counts: Partial<Record<TaskStatus, number>> = {};
        for (const task of tasks.values()) {
          counts[task.status] = (counts[task.status] ?? 0) + 1;
        }
        return { totalTasks: tasks.size, byStatus: counts };
      },
    };
  }
}

// ── Factory Creator ────────────────────────────────────────

export function createArchitectureFactory(): ArchitectureFactory {
  return new ArchitectureFactory();
}
