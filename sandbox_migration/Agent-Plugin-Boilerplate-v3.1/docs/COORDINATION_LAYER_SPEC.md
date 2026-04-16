# Agent Coordination Layer — Boilerplate Specification

**Purpose**: Generic, configurable multi-agent coordination layer for OpenCode plugins.
**Starting point**: Extracted from Spider Agent (11 agents, 68K-line compiled bundle) + plugin-agent-prototype-v2
**Target**: Reuse across Shark (3 brains, 5 agents), Spider (8 brains, 11 agents), Hermes, Hydra (5 brains, 13 agents), and future architectures.

**Status**: Design specification. Not yet implemented.

---

## Table of Contents

1. [Core Abstraction: Hub-Spoke with Clusters](#1-core-abstraction-hub-spoke-with-clusters)
2. [Architecture Overview](#2-architecture-overview)
3. [Coordination Layer API](#3-coordination-layer-api)
4. [Agent Registry System](#4-agent-registry-system)
5. [Delegation Engine](#5-delegation-engine)
6. [State Machine](#6-state-machine)
7. [Enforcement Hooks](#7-enforcement-hooks)
8. [File-Based Persistence](#8-file-based-persistence)
9. [Tool System](#9-tool-system)
10. [Command System](#10-command-system)
11. [Configuration Schema](#11-configuration-schema)
12. [Integration with plugin-agent-prototype-v2](#12-integration-with-plugin-agent-prototype-v2)
13. [Usage Examples](#13-usage-examples)
14. [Extending for Specific Architectures](#14-extending-for-specific-architectures)

---

## 1. Core Abstraction: Hub-Spoke with Clusters

Spider uses flat hub-spoke (1 architect → 10 subagents). This is insufficient for complex architectures.

**New model**: Hierarchical Hub-Spoke with Clusters (HHC).

```
                    ┌─────────────────────────────────────┐
                    │           ORCHESTRATOR               │
                    │    (top-level brain/architect)       │
                    └──────────────┬──────────────────────┘
                                   │ delegates to clusters
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   CLUSTER A     │   │   CLUSTER B     │   │   CLUSTER C     │
    │  "execution"    │   │    "qa"         │   │   "research"    │
    │                 │   │                 │   │                 │
    │  ┌───┐ ┌───┐   │   │  ┌───┐ ┌───┐   │   │  ┌───┐ ┌───┐   │
    │  │ A1│ │ A2│   │   │  │ B1│ │ B2│   │   │  │ C1│ │ C2│   │
    │  └───┘ └───┘   │   │  └───┘ └───┘   │   │  └───┘ └───┘   │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
```

**Key insight**: Clusters are logical groupings, not necessarily separate processes. They define:
- Which agents belong together
- Intra-cluster delegation rules
- Inter-cluster communication patterns
- Shared context boundaries

### Terminology

| Term | Definition |
|------|-----------|
| **Brain** | Top-level orchestrator agent (like Spider's architect) |
| **Cluster** | Logical group of related agents (e.g., "execution", "qa", "research") |
| **Agent** | Individual agent persona (coder, reviewer, etc.) |
| **Worker** | Sub-agent within a cluster (formerly "subagent" in Spider) |
| **Delegation** | Act of assigning a task to an agent |
| **Task** | Unit of work with input, output, constraints |
| **Gate** | Enforcement checkpoint that blocks or approves transitions |

---

## 2. Architecture Overview

### Directory Structure

```
src/
├── coordination/                    # NEW: Generic coordination layer
│   ├── index.ts                    # Main export
│   ├── registry.ts                 # Agent registry
│   ├── delegation.ts               # Delegation engine
│   ├── state-machine.ts            # Task state machine
│   ├── hooks/                      # Coordination hooks
│   │   ├── gate-hook.ts           # Delegation gate enforcement
│   │   ├── guardrail-hook.ts      # Resource limits per agent
│   │   ├── slop-detector-hook.ts  # Quality degradation detection
│   │   └── brainstorm-gate.ts     # Phase 0 completion enforcement
│   ├── persistence/                # File-based state
│   │   ├── plugin-state.ts         # Plugin directory management
│   │   ├── plan.ts                # Plan file operations
│   │   ├── evidence.ts            # Evidence collection
│   │   └── checkpoint.ts          # Checkpoint management
│   ├── tools/                     # Coordination tools
│   │   ├── delegate.ts            # Task delegation tool
│   │   ├── checkpoint.ts          # Create/restore checkpoints
│   │   ├── evidence.ts            # Evidence operations
│   │   ├── phase-complete.ts      # Phase completion
│   │   └── plugin-status.ts        # Status reporting
│   ├── commands/                   # Slash commands
│   │   └── registry.ts            # Command registration
│   └── types.ts                   # Shared types
│
├── agents/                         # Agent personas (customize per project)
│   ├── architect.ts               # Orchestrator prompt
│   ├── coder.ts
│   ├── reviewer.ts
│   └── ...
│
├── brains/                        # Brain definitions (for multi-brain archs)
│   ├── index.ts                   # Brain registry
│   ├── brain-alpha.ts             # Primary brain
│   ├── brain-beta.ts              # Secondary brain
│   └── brain-gamma.ts            # Tertiary brain
│
├── clusters/                      # Cluster definitions
│   ├── execution.ts              # Execution cluster
│   ├── qa.ts                     # QA cluster
│   └── research.ts               # Research cluster
│
├── config/
│   ├── schema.ts                 # Config validation
│   └── loader.ts                 # Config loading
│
├── hooks/                         # OpenCode hooks (from plugin-agent-prototype-v2)
│   ├── utils.ts
│   ├── event.ts
│   └── ...
│
└── index.ts                      # Plugin entry point
```

### Layer Responsibilities

| Layer | Responsibility | Customizable? |
|-------|---------------|----------------|
| **Coordination** | Task routing, state transitions, gates | Yes - per architecture |
| **Agents** | Persona prompts, tool access | Yes - core customization |
| **Brains** | Orchestration logic, delegation decisions | Yes - defines architecture |
| **Clusters** | Agent groupings, intra-cluster rules | Yes - structural organization |
| **OpenCode Hooks** | Lifecycle, message transforms | No - framework interface |
| **Persistence** | File-based state, evidence | No - generic implementation |

---

## 3. Coordination Layer API

### Main Export

```typescript
// src/coordination/index.ts

import type { PluginInput } from '@opencode-ai/plugin';
import { createAgentRegistry } from './registry.js';
import { createDelegationEngine } from './delegation.js';
import { createStateMachine } from './state-machine.js';
import { createCoordinationHooks } from './hooks/index.js';
import { createCoordinationTools } from './tools/index.js';
import { createPluginState } from './persistence/plugin-state.js';
import type { CoordinationConfig } from './types.js';

export interface CoordinationOptions {
  pluginId: string;
  pluginName: string;
  config: CoordinationConfig;
  directory: string;
}

export function createCoordinationLayer(options: CoordinationOptions) {
  const { pluginId, pluginName, config, directory } = options;

  // 1. Plugin state (file-based persistence)
  const pluginState = createPluginState({
    pluginId,
    pluginName,
    directory,
    storagePath: config.storage?.path ?? `${directory}/.plugin`,
  });

  // 2. Agent registry (who exists, what mode, what tools)
  const agentRegistry = createAgentRegistry({
    agents: config.agents,
    toolFilter: config.toolFilter?.enabled ?? true,
  });

  // 3. State machine (task lifecycle)
  const stateMachine = createStateMachine({
    states: config.states,
    initialState: 'idle',
    transitions: config.transitions,
  });

  // 4. Delegation engine (how tasks get assigned)
  const delegationEngine = createDelegationEngine({
    clusters: config.clusters,
    stateMachine,
    agentRegistry,
    gatePolicy: config.gates?.delegation ?? 'strict',
  });

  // 5. Coordination hooks (enforcement)
  const coordinationHooks = createCoordinationHooks({
    delegationEngine,
    stateMachine,
    agentRegistry,
    config: config.hooks,
  });

  // 6. Coordination tools (what agents can call)
  const coordinationTools = createCoordinationTools({
    delegationEngine,
    stateMachine,
    pluginState,
    agentRegistry,
  });

  // 7. Command registry
  const commands = createCommandRegistry({
    pluginId,
    tools: coordinationTools,
    state: pluginState,
  });

  return {
    pluginState,
    agentRegistry,
    stateMachine,
    delegationEngine,
    hooks: coordinationHooks,
    tools: coordinationTools,
    commands,
  };
}
```

---

## 4. Agent Registry System

### Agent Definition

```typescript
// src/coordination/types.ts

export type AgentMode = 'primary' | 'subagent' | 'all';

export interface AgentDefinition {
  name: string;
  description?: string;
  mode: AgentMode;
  model?: string;                    // Override default model
  temperature?: number;
  cluster?: string;                  // Which cluster this agent belongs to
  tools?: Record<string, boolean>;  // Tool allowlist (true = allowed)
  permission?: {
    task?: 'allow' | 'deny';
    file?: Record<string, 'allow' | 'deny'>;
  };
  prompt: string;                   // System prompt
}

export interface ClusterDefinition {
  id: string;
  name: string;
  description?: string;
  agents: string[];                 // Agent names in this cluster
  intraClusterDelegation: boolean;   // Can agents delegate to each other?
  interClusterDelegation: boolean;  // Can agents delegate to other clusters?
  sharedContext?: boolean;          // Share context between agents?
}
```

### Agent Registry Implementation

```typescript
// src/coordination/registry.ts

import type { AgentDefinition, ClusterDefinition, AgentMode } from './types.js';

export interface AgentRegistry {
  getAgent(name: string): AgentDefinition | undefined;
  getAgentsByMode(mode: AgentMode): AgentDefinition[];
  getAgentsByCluster(clusterId: string): AgentDefinition[];
  getPrimaryAgent(): AgentDefinition | undefined;
  getAllToolRestrictions(): Record<string, string[]>;
  isAgentAllowedTool(agentName: string, toolName: string): boolean;
}

export function createAgentRegistry(options: {
  agents: Record<string, AgentDefinition>;
  clusters?: Record<string, ClusterDefinition>;
  toolFilter?: boolean;
}): AgentRegistry {
  const { agents, clusters = {}, toolFilter = true } = options;

  return {
    getAgent(name: string) {
      return agents[name];
    },

    getAgentsByMode(mode: AgentMode) {
      return Object.values(agents).filter(a => a.mode === mode);
    },

    getAgentsByCluster(clusterId: string) {
      const cluster = clusters[clusterId];
      if (!cluster) return [];
      return cluster.agents.map(name => agents[name]).filter(Boolean);
    },

    getPrimaryAgent() {
      return Object.values(agents).find(a => a.mode === 'primary');
    },

    getAllToolRestrictions() {
      const restrictions: Record<string, string[]> = {};
      for (const [name, agent] of Object.entries(agents)) {
        if (agent.tools) {
          restrictions[name] = Object.entries(agent.tools)
            .filter(([, allowed]) => allowed)
            .map(([tool]) => tool);
        }
      }
      return restrictions;
    },

    isAgentAllowedTool(agentName: string, toolName: string) {
      if (!toolFilter) return true;
      const agent = agents[agentName];
      if (!agent?.tools) return true;  // No restriction = all allowed
      return agent.tools[toolName] === true;
    },
  };
}
```

---

## 5. Delegation Engine

### Delegation Types

```typescript
// src/coordination/delegation.ts

export type DelegationTarget =
  | { type: 'agent'; name: string }
  | { type: 'cluster'; clusterId: string }
  | { type: 'brain'; brainId: string };

export interface DelegationRequest {
  id: string;
  from: string;                      // Delegating agent
  to: DelegationTarget;
  task: {
    description: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    constraints?: string[];
    acceptanceCriteria?: string[];
  };
  priority?: 'low' | 'normal' | 'high' | 'critical';
  deadline?: number;                 // Unix timestamp
  context?: {
    planTaskId?: string;
    phase?: string;
    step?: number;
  };
}

export interface DelegationResult {
  success: boolean;
  taskId?: string;
  error?: string;
  state?: string;
}

export type GateDecision = 'allow' | 'block' | 'warn';

export interface GateResult {
  decision: GateDecision;
  reason?: string;
  warnings?: string[];
}
```

### Delegation Engine Implementation

```typescript
// src/coordination/delegation.ts

import { randomId } from './utils.js';
import type {
  DelegationRequest,
  DelegationResult,
  GateResult,
  DelegationTarget,
  ClusterDefinition,
} from './types.js';

export interface DelegationEngine {
  delegate(request: DelegationRequest): Promise<DelegationResult>;
  canDelegate(from: string, to: DelegationTarget): GateResult;
  getClusterAgents(clusterId: string): string[];
  setGatePolicy(policy: 'strict' | 'advisory' | 'off');
}

export function createDelegationEngine(options: {
  clusters: Record<string, ClusterDefinition>;
  stateMachine: any;
  agentRegistry: any;
  gatePolicy: 'strict' | 'advisory' | 'off';
}): DelegationEngine {
  const { clusters, stateMachine, agentRegistry, gatePolicy } = options;

  return {
    async delegate(request: DelegationRequest): Promise<DelegationResult> {
      // 1. Gate check
      const gateResult = this.canDelegate(request.from, request.to);
      if (gateResult.decision === 'block') {
        return { success: false, error: gateResult.reason };
      }
      if (gateResult.decision === 'warn') {
        // Log warning but proceed in advisory mode
        console.warn(`[delegation] Warning: ${gateResult.reason}`);
      }

      // 2. Resolve target (cluster → specific agent)
      const targetAgent = resolveTarget(request.to, clusters);

      // 3. Create task in state machine
      const taskId = randomId();
      await stateMachine.createTask({
        id: taskId,
        delegation: request,
        targetAgent,
        state: 'pending',
        createdAt: Date.now(),
      });

      // 4. Return Task tool call payload
      return {
        success: true,
        taskId,
        state: 'pending',
      };
    },

    canDelegate(from: string, to: DelegationTarget): GateResult {
      const warnings: string[] = [];

      if (to.type === 'cluster') {
        // Check cluster delegation rules
        const fromAgent = agentRegistry.getAgent(from);
        const cluster = clusters[to.clusterId];

        if (!cluster) {
          return { decision: 'block', reason: `Cluster ${to.clusterId} not found` };
        }

        if (fromAgent?.cluster !== to.clusterId && !cluster.interClusterDelegation) {
          return {
            decision: 'block',
            reason: `Cross-cluster delegation to ${to.clusterId} not allowed`,
          };
        }
      }

      // Gate policy check
      if (gatePolicy === 'strict') {
        // Enforce all gates strictly
        // (architecture-specific rules added by consumer)
      }

      return {
        decision: warnings.length > 0 ? 'warn' : 'allow',
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    },

    getClusterAgents(clusterId: string): string[] {
      const cluster = clusters[clusterId];
      return cluster?.agents ?? [];
    },

    setGatePolicy(policy: 'strict' | 'advisory' | 'off') {
      // Update gate enforcement level
    },
  };
}

function resolveTarget(
  to: DelegationTarget,
  clusters: Record<string, ClusterDefinition>
): string {
  if (to.type === 'agent') {
    return to.name;
  }
  if (to.type === 'cluster') {
    // Pick first agent in cluster (or implement smarter routing)
    const cluster = clusters[to.clusterId];
    return cluster?.agents[0] ?? 'coder';  // Fallback
  }
  if (to.type === 'brain') {
    // For brain delegation, this is a higher-level concept
    // (handled by orchestrator brain)
    return 'architect';
  }
  throw new Error(`Unknown delegation target type`);
}
```

---

## 6. State Machine

### Task State Machine

```typescript
// src/coordination/state-machine.ts

export interface TaskState {
  id: string;
  state: string;
  delegation: any;
  targetAgent: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  result?: any;
  evidence?: string[];
}

export interface StateTransition {
  from: string;
  to: string;
  trigger: 'delegate' | 'complete' | 'fail' | 'approve' | 'reject';
  guard?: (task: TaskState) => boolean;
}

export interface StateMachine {
  createTask(task: Omit<TaskState, 'updatedAt'>): Promise<TaskState>;
  transition(taskId: string, trigger: string, data?: any): Promise<TaskState>;
  getTask(taskId: string): TaskState | undefined;
  getTasksByState(state: string): TaskState[];
  getActiveTask(): TaskState | undefined;
}
```

### Default State Configuration

This matches Spider Agent's pipeline:

```typescript
// src/coordination/defaults/states.ts

export const DEFAULT_STATES = ['idle', 'pending', 'running', 'review', 'testing', 'complete', 'failed'];

export const DEFAULT_TRANSITIONS: StateTransition[] = [
  // Coder workflow
  { from: 'pending', to: 'running', trigger: 'delegate' },
  { from: 'running', to: 'review', trigger: 'complete' },
  { from: 'review', to: 'testing', trigger: 'approve' },
  { from: 'review', to: 'running', trigger: 'reject' },     // Retry
  { from: 'testing', to: 'complete', trigger: 'pass' },
  { from: 'testing', to: 'running', trigger: 'fail' },      // Retry

  // Direct paths
  { from: 'pending', to: 'complete', trigger: 'complete' }, // For trivial tasks
  { from: 'idle', to: 'complete', trigger: 'skip' },        // Skip phase
];
```

---

## 7. Enforcement Hooks

### Delegation Gate Hook

Prevents invalid delegation patterns (e.g., coder re-delegating without QA gate):

```typescript
// src/coordination/hooks/gate-hook.ts

import { safeHook } from '../../hooks/utils.js';

export function createDelegationGateHook(options: {
  stateMachine: any;
  agentRegistry: any;
  config: {
    maxConsecutiveCoderDelegations?: number;
    requireReviewerAfterCoder?: boolean;
    requireTestEngineerAfterReviewer?: boolean;
  };
}) {
  const { stateMachine, agentRegistry, config } = options;

  return {
    'tool.execute.before': safeHook(async (input, output) => {
      // Intercept Task tool calls
      const toolName = input.tool?.name;
      if (toolName !== 'Task') return;

      const targetAgent = input.tool?.arguments?.agent;
      const taskDescription = input.tool?.arguments?.task ?? '';

      // QA Gate: After coder, must go to reviewer
      if (targetAgent === 'coder') {
        const recentTasks = stateMachine.getTasksByState('review');
        const lastWasCoder = recentTasks[0]?.targetAgent === 'coder';

        if (lastWasCoder && config.requireReviewerAfterCoder) {
          const consecutiveCoder = countConsecutiveCoderTasks(stateMachine);
          if (consecutiveCoder >= (config.maxConsecutiveCoderDelegations ?? 1)) {
            throw new Error(
              `[GATE] QA_GATE_VIOLATION: Cannot delegate to coder without reviewer gate. ` +
              `Complete reviewer task first.`
            );
          }
        }
      }
    }, 'delegation-gate'),

    'experimental.chat.messages.transform': safeHook(async (input, output) => {
      // Inject warnings into context
      const warnings: string[] = [];
      const consecutiveCoder = countConsecutiveCoderTasks(stateMachine);

      if (consecutiveCoder >= 2) {
        warnings.push(
          `[WARNING] Multiple consecutive coder delegations without QA. ` +
          `Consider delegating to reviewer or test_engineer.`
        );
      }

      if (warnings.length > 0) {
        output.messages.push({
          role: 'system',
          content: warnings.join('\n'),
        });
      }
    }, 'delegation-gate-transform'),
  };
}

function countConsecutiveCoderTasks(stateMachine: any): number {
  const tasks = stateMachine.getTasksByState('running');
  let count = 0;
  for (const task of tasks) {
    if (task.targetAgent === 'coder') count++;
    else break;
  }
  return count;
}
```

### Guardrail Hook

Resource limits per agent:

```typescript
// src/coordination/hooks/guardrail-hook.ts

export interface GuardrailConfig {
  maxToolCalls?: number;
  maxDurationMinutes?: number;
  maxConsecutiveErrors?: number;
  idleTimeoutMinutes?: number;
}

export function createGuardrailHook(options: {
  agentRegistry: any;
  configs: Record<string, GuardrailConfig>;
}) {
  const invocationTracker = new Map<string, {
    count: number;
    startTime: number;
    errors: number;
    lastActivity: number;
  }>();

  return {
    'tool.execute.before': safeHook(async (input, output) => {
      const agent = input.agent;
      const config = options.configs[agent];

      if (!config) return;

      const tracker = invocationTracker.get(agent) ?? {
        count: 0,
        startTime: Date.now(),
        errors: 0,
        lastActivity: Date.now(),
      };

      // Duration check
      if (config.maxDurationMinutes) {
        const elapsed = (Date.now() - tracker.startTime) / 60000;
        if (elapsed > config.maxDurationMinutes) {
          throw new Error(`[GUARDRAIL] ${agent} exceeded max duration: ${config.maxDurationMinutes}m`);
        }
      }

      // Idle timeout check
      if (config.idleTimeoutMinutes) {
        const idle = (Date.now() - tracker.lastActivity) / 60000;
        if (idle > config.idleTimeoutMinutes) {
          throw new Error(`[GUARDRAIL] ${agent} idle timeout: ${config.idleTimeoutMinutes}m`);
        }
      }

      invocationTracker.set(agent, tracker);
    }, 'guardrail'),

    'tool.execute.after': safeHook(async (input, output) => {
      const agent = input.agent;
      const config = options.configs[agent];
      const tracker = invocationTracker.get(agent);

      if (!tracker) return;

      tracker.count++;
      tracker.lastActivity = Date.now();

      // Tool call limit
      if (config?.maxToolCalls && tracker.count > config.maxToolCalls) {
        console.warn(`[GUARDRAIL] ${agent} approaching tool call limit: ${tracker.count}/${config.maxToolCalls}`);
      }

      // Error tracking
      if (output.error) {
        tracker.errors++;
        if (config?.maxConsecutiveErrors && tracker.errors >= config.maxConsecutiveErrors) {
          throw new Error(`[GUARDRAIL] ${agent} consecutive errors: ${tracker.errors}`);
        }
      } else {
        tracker.errors = 0;
      }
    }, 'guardrail'),
  };
}
```

### Slop Detector Hook

Pattern-matches output for quality degradation:

```typescript
// src/coordination/hooks/slop-detector-hook.ts

export interface SlopDetectorConfig {
  classThreshold?: number;          // Repetitive class patterns
  commentStripThreshold?: number; // Excessive comments
  diffLineThreshold?: number;      // Suspiciously large diffs
  importHygiene?: boolean;          // Missing/broken imports
}

export function createSlopDetectorHook(options: {
  config: SlopDetectorConfig;
}) {
  const { config } = options;

  return {
    'tool.execute.after': safeHook(async (input, output) => {
      const content = output.result?.content ?? [];
      const text = content.map((c: any) => c.text ?? '').join('\n');

      const issues: string[] = [];

      // Check for repetitive structural patterns
      const classCount = (text.match(/class\s+\w+/g) ?? []).length;
      if (classCount > (config.classThreshold ?? 10)) {
        issues.push(`[SLOP] High class count: ${classCount} (threshold: ${config.classThreshold})`);
      }

      // Check for excessive comments (comment-to-code ratio)
      const commentCount = (text.match(/\/\//g) ?? []).length;
      const codeLineCount = text.split('\n').filter((l: string) => l.trim() && !l.trim().startsWith('//')).length;
      if (commentCount > codeLineCount * 2) {
        issues.push(`[SLOP] Excessive comments: ${commentCount} comments for ${codeLineCount} code lines`);
      }

      if (issues.length > 0) {
        console.warn(issues.join('\n'));
        // Could inject warning into context or block
      }
    }, 'slop-detector'),
  };
}
```

### Brainstorm Gate Hook

Phase 0 completion enforcement (from Superpowers workflow):

```typescript
// src/coordination/hooks/brainstorm-gate.ts

export function createBrainstormGateHook(options: {
  pluginState: any;
  requiredFiles?: string[];
}) {
  const { pluginState, requiredFiles = ['plan.md', 'spec.md'] } = options;

  return {
    'tool.execute.before': safeHook(async (input, output) => {
      const toolName = input.tool?.name;

      // Block any coding tools until brainstorm phase complete
      const codingTools = ['write', 'edit', 'patch', 'create_file', 'insert', 'replace', 'apply_patch'];
      if (codingTools.includes(toolName)) {
        const phase = pluginState.getCurrentPhase();
        if (phase !== 'execute' && phase !== 'build') {
          throw new Error(
            `[BRAINSTORM-GATE] Cannot use ${toolName} before brainstorm phase complete. ` +
            `Current phase: ${phase}. Complete brainstorm gate first.`
          );
        }
      }
    }, 'brainstorm-gate'),

    'experimental.chat.messages.transform': safeHook(async (input, output) => {
      const phase = pluginState.getCurrentPhase();
      if (phase !== 'execute' && phase !== 'build') {
        output.messages.push({
          role: 'system',
          content: `[REMINDER] BRAINSTORM GATE ACTIVE. Complete planning before executing.`,
        });
      }
    }, 'brainstorm-gate-transform'),
  };
}
```

---

## 8. File-Based Persistence

### Plugin State Manager

```typescript
// src/coordination/persistence/plugin-state.ts

export interface PluginState {
  pluginId: string;
  pluginName: string;
  directory: string;
  planPath: string;
  evidencePath: string;
  checkpointPath: string;

  // Plan operations
  loadPlan(): Plan | null;
  savePlan(plan: Plan): void;
  syncPlan(): void;

  // Evidence operations
  addEvidence(taskId: string, evidence: Evidence): void;
  getEvidence(taskId: string): Evidence[];
  verifyEvidence(taskId: string): boolean;

  // Checkpoint operations
  createCheckpoint(label: string, note?: string): void;
  restoreCheckpoint(label: string): void;
  listCheckpoints(): Checkpoint[];

  // Phase management
  getCurrentPhase(): string;
  setPhase(phase: string): void;

  // Resumability
  saveSnapshot(): void;
  loadSnapshot(): Snapshot | null;
}

export interface Plan {
  id: string;
  version: number;
  phases: Phase[];
  tasks: PlanTask[];
  createdAt: number;
  updatedAt: number;
}

export interface Phase {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'complete' | 'skipped';
  tasks: string[];  // Task IDs
}

export interface Evidence {
  type: 'review' | 'test' | 'delegate' | 'retrospective' | 'custom';
  content: any;
  agent: string;
  timestamp: number;
}

export interface Checkpoint {
  label: string;
  note?: string;
  createdAt: number;
  path: string;
}

export interface Snapshot {
  pluginId: string;
  plan: Plan;
  tasks: TaskState[];
  phase: string;
  createdAt: number;
}
```

### Implementation

```typescript
// src/coordination/persistence/plugin-state.ts

import fs from 'fs/promises';
import path from 'path';

export function createPluginState(options: {
  pluginId: string;
  pluginName: string;
  directory: string;
  storagePath?: string;
}): PluginState {
  const { pluginId, pluginName, directory, storagePath } = options;
  const basePath = storagePath ?? path.join(directory, '.plugin');

  return {
    pluginId,
    pluginName,
    directory,
    planPath: path.join(basePath, 'plan.json'),
    evidencePath: path.join(basePath, 'evidence'),
    checkpointPath: path.join(basePath, 'checkpoints'),

    async loadPlan() {
      try {
        const content = await fs.readFile(this.planPath, 'utf-8');
        return JSON.parse(content);
      } catch {
        return null;
      }
    },

    async savePlan(plan: Plan) {
      await fs.mkdir(basePath, { recursive: true });
      await fs.writeFile(this.planPath, JSON.stringify(plan, null, 2));

      // Also write plan.md for human readability
      const planMd = generatePlanMarkdown(plan);
      await fs.writeFile(path.join(basePath, 'plan.md'), planMd);
    },

    async syncPlan() {
      // Sync plan.json ↔ plan.md
      const plan = await this.loadPlan();
      if (plan) {
        await this.savePlan(plan);
      }
    },

    async addEvidence(taskId: string, evidence: Evidence) {
      await fs.mkdir(path.join(this.evidencePath, taskId), { recursive: true });
      const file = path.join(this.evidencePath, taskId, `${Date.now()}.json`);
      await fs.writeFile(file, JSON.stringify(evidence, null, 2));
    },

    async getEvidence(taskId: string) {
      const dir = path.join(this.evidencePath, taskId);
      try {
        const files = await fs.readdir(dir);
        const evidence = await Promise.all(
          files
            .filter(f => f.endsWith('.json'))
            .map(async f => {
              const content = await fs.readFile(path.join(dir, f), 'utf-8');
              return JSON.parse(content);
            })
        );
        return evidence;
      } catch {
        return [];
      }
    },

    async verifyEvidence(taskId: string) {
      const evidence = await this.getEvidence(taskId);
      // Check for required evidence types
      const hasReview = evidence.some(e => e.type === 'review');
      const hasTest = evidence.some(e => e.type === 'test');
      return hasReview && hasTest;
    },

    async createCheckpoint(label: string, note?: string) {
      await fs.mkdir(this.checkpointPath, { recursive: true });
      const checkpointDir = path.join(this.checkpointPath, label);
      await fs.mkdir(checkpointDir, { recursive: true });

      // Git stash
      const { execSync } = await import('child_process');
      try {
        execSync('git stash', { cwd: directory, stdio: 'ignore' });
      } catch {
        // Not a git repo or stash failed
      }

      await fs.writeFile(
        path.join(checkpointDir, 'meta.json'),
        JSON.stringify({ label, note, createdAt: Date.now() })
      );
    },

    async restoreCheckpoint(label: string) {
      const checkpointDir = path.join(this.checkpointPath, label);
      // Restore from checkpoint (implementation depends on strategy)
      // Could be git stash pop, file copy, etc.
    },

    async listCheckpoints() {
      try {
        const dirs = await fs.readdir(this.checkpointPath);
        return Promise.all(
          dirs.map(async d => {
            const meta = path.join(this.checkpointPath, d, 'meta.json');
            try {
              const content = await fs.readFile(meta, 'utf-8');
              return JSON.parse(content);
            } catch {
              return { label: d, createdAt: 0 };
            }
          })
        );
      } catch {
        return [];
      }
    },

    async saveSnapshot() {
      const snapshot: Snapshot = {
        pluginId: this.pluginId,
        plan: await this.loadPlan(),
        tasks: [], // From state machine
        phase: 'unknown', // From phase tracking
        createdAt: Date.now(),
      };
      await fs.writeFile(
        path.join(basePath, 'snapshot.json'),
        JSON.stringify(snapshot, null, 2)
      );
    },

    async loadSnapshot() {
      try {
        const content = await fs.readFile(
          path.join(basePath, 'snapshot.json'),
          'utf-8'
        );
        return JSON.parse(content);
      } catch {
        return null;
      }
    },
  };
}

function generatePlanMarkdown(plan: Plan): string {
  let md = `# Plan ${plan.id} (v${plan.version})\n\n`;
  for (const phase of plan.phases) {
    md += `## ${phase.name} [${phase.status}]\n\n`;
    for (const taskId of phase.tasks) {
      const task = plan.tasks.find(t => t.id === taskId);
      if (task) {
        md += `- [ ] ${task.description}\n`;
      }
    }
    md += '\n';
  }
  return md;
}
```

---

## 9. Tool System

### Coordination Tools

```typescript
// src/coordination/tools/index.ts

import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';

export function createCoordinationTools(options: {
  delegationEngine: any;
  stateMachine: any;
  pluginState: any;
  agentRegistry: any;
}) {
  const { delegationEngine, stateMachine, pluginState, agentRegistry } = options;

  return {
    // Task delegation tool
    delegate_task: tool({
      description: 'Delegate a task to an agent or cluster',
      args: {
        agent: z.string().describe('Target agent name'),
        task: z.string().describe('Task description'),
        input: z.record(z.any()).optional(),
        constraints: z.array(z.string()).optional(),
        acceptanceCriteria: z.array(z.string()).optional(),
        priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
      },
      execute: async (args, ctx) => {
        const result = await delegationEngine.delegate({
          id: randomId(),
          from: ctx.agent,
          to: { type: 'agent', name: args.agent },
          task: {
            description: args.task,
            input: args.input,
            constraints: args.constraints,
            acceptanceCriteria: args.acceptanceCriteria,
          },
          priority: args.priority ?? 'normal',
        });

        if (!result.success) {
          throw new Error(`Delegation failed: ${result.error}`);
        }

        return `Delegated to ${args.agent}. Task ID: ${result.taskId}`;
      },
    }),

    // Checkpoint tool
    checkpoint: tool({
      description: 'Create a named checkpoint',
      args: {
        label: z.string().describe('Checkpoint label'),
        note: z.string().optional().describe('Optional note'),
      },
      execute: async (args, ctx) => {
        await pluginState.createCheckpoint(args.label, args.note);
        return `Checkpoint created: ${args.label}`;
      },
    }),

    // Phase complete tool
    phase_complete: tool({
      description: 'Mark a phase as complete',
      args: {
        phase: z.string().describe('Phase name'),
        evidence: z.boolean().optional().describe('Verify evidence'),
      },
      execute: async (args, ctx) => {
        const currentPhase = pluginState.getCurrentPhase();
        if (currentPhase !== args.phase) {
          throw new Error(`Cannot complete phase ${args.phase}. Current: ${currentPhase}`);
        }

        // Verify evidence if requested
        if (args.evidence) {
          const activeTask = stateMachine.getActiveTask();
          if (activeTask) {
            const verified = await pluginState.verifyEvidence(activeTask.id);
            if (!verified) {
              throw new Error('Evidence verification failed. Complete all QA gates first.');
            }
          }
        }

        // Transition to next phase
        await pluginState.setPhase(args.phase + 1); // Simplified
        return `Phase ${args.phase} marked complete`;
      },
    }),

    // Plugin status tool
    plugin_status: tool({
      description: 'Show current plugin status',
      args: {},
      execute: async (args, ctx) => {
        const plan = await pluginState.loadPlan();
        const activeTask = stateMachine.getActiveTask();
        const phase = pluginState.getCurrentPhase();
        const agents = agentRegistry.getAgentsByMode('all');

        return {
          plugin: pluginState.pluginName,
          phase,
          activeTask: activeTask?.id,
          planTasks: plan?.tasks.length ?? 0,
          agents: agents.map(a => ({
            name: a.name,
            mode: a.mode,
            cluster: a.cluster,
          })),
        };
      },
    }),

    // Evidence check tool
    evidence_check: tool({
      description: 'Verify task evidence completeness',
      args: {
        taskId: z.string().optional().describe('Task ID (defaults to active)'),
      },
      execute: async (args, ctx) => {
        const taskId = args.taskId ?? stateMachine.getActiveTask()?.id;
        if (!taskId) {
          return 'No active task';
        }

        const evidence = await pluginState.getEvidence(taskId);
        const types = evidence.map(e => e.type);

        return {
          taskId,
          evidenceCount: evidence.length,
          types,
          complete: types.includes('review') && types.includes('test'),
        };
      },
    }),
  };
}
```

---

## 10. Command System

### Command Registry

```typescript
// src/coordination/commands/registry.ts

export interface CommandDefinition {
  name: string;
  template: string;
  description: string;
  handler: (args: string, ctx: CommandContext) => Promise<Part[]>;
}

export interface CommandContext {
  directory: string;
  sessionID: string;
  agents: any;
  tools: any;
  state: any;
}

export function createCommandRegistry(options: {
  pluginId: string;
  tools: any;
  state: any;
}) {
  const { pluginId, tools, state } = options;

  const commands: Record<string, CommandDefinition> = {
    [`${pluginId}-status`]: {
      name: `${pluginId}-status`,
      template: `/${pluginId} status`,
      description: 'Show current plugin status',
      handler: async (args, ctx) => {
        const result = await tools.plugin_status.execute({}, ctx);
        return [{ type: 'text', text: JSON.stringify(result, null, 2) }];
      },
    },

    [`${pluginId}-plan`]: {
      name: `${pluginId}-plan`,
      template: `/${pluginId} plan $ARGUMENTS`,
      description: 'Display or modify plan',
      handler: async (args, ctx) => {
        const plan = await state.loadPlan();
        if (!plan) return [{ type: 'text', text: 'No active plan' }];

        if (args) {
          // Add task to plan
          // ...
        }

        return [{ type: 'text', text: JSON.stringify(plan, null, 2) }];
      },
    },

    [`${pluginId}-agents`]: {
      name: `${pluginId}-agents`,
      template: `/${pluginId} agents`,
      description: 'List all agents',
      handler: async (args, ctx) => {
        // List agents
        return [];
      },
    },

    [`${pluginId}-checkpoint`]: {
      name: `${pluginId}-checkpoint`,
      template: `/${pluginId} checkpoint $ARGUMENTS`,
      description: 'Create or restore checkpoint',
      handler: async (args, ctx) => {
        const [action, label] = args.split(' ');
        if (action === 'create') {
          await state.createCheckpoint(label);
          return [{ type: 'text', text: `Checkpoint created: ${label}` }];
        }
        if (action === 'restore') {
          await state.restoreCheckpoint(label);
          return [{ type: 'text', text: `Restored: ${label}` }];
        }
        return [{ type: 'text', text: 'Usage: /plugin checkpoint create|restore <label>' }];
      },
    },
  };

  return {
    getCommands() {
      return commands;
    },

    getCommand(name: string) {
      return commands[name];
    },
  };
}
```

### Config Hook Registration

```typescript
// Register commands with OpenCode
config: async (opencodeConfig) => {
  if (!opencodeConfig.command) {
    opencodeConfig.command = {};
  }

  const commands = commandRegistry.getCommands();
  for (const [name, cmd] of Object.entries(commands)) {
    opencodeConfig.command[name] = {
      template: cmd.template,
      description: cmd.description,
    };
  }
}
```

---

## 11. Configuration Schema

### Complete Config Schema

```typescript
// src/coordination/config/schema.ts

import { z } from 'zod';

export const CoordinationConfigSchema = z.object({
  // Plugin identity
  pluginId: z.string(),
  pluginName: z.string(),
  version: z.string().optional(),

  // Agents
  agents: z.record(z.object({
    name: z.string(),
    description: z.string().optional(),
    mode: z.enum(['primary', 'subagent', 'all']),
    model: z.string().optional(),
    temperature: z.number().optional(),
    cluster: z.string().optional(),
    tools: z.record(z.boolean()).optional(),
    prompt: z.string(),
  })),

  // Clusters (optional - for complex architectures)
  clusters: z.record(z.object({
    id: z.string(),
    name: z.string(),
    agents: z.array(z.string()),
    intraClusterDelegation: z.boolean().optional(),
    interClusterDelegation: z.boolean().optional(),
    sharedContext: z.boolean().optional(),
  })).optional(),

  // State machine
  states: z.array(z.string()).optional(),
  transitions: z.array(z.object({
    from: z.string(),
    to: z.string(),
    trigger: z.string(),
  })).optional(),

  // Delegation gates
  gates: z.object({
    delegation: z.enum(['strict', 'advisory', 'off']).optional(),
    maxConsecutiveCoderDelegations: z.number().optional(),
    requireReviewerAfterCoder: z.boolean().optional(),
    requireTestEngineerAfterReviewer: z.boolean().optional(),
  }).optional(),

  // Guardrails per agent
  guardrails: z.record(z.object({
    maxToolCalls: z.number().optional(),
    maxDurationMinutes: z.number().optional(),
    maxConsecutiveErrors: z.number().optional(),
    idleTimeoutMinutes: z.number().optional(),
  })).optional(),

  // Tool filtering
  toolFilter: z.object({
    enabled: z.boolean(),
    overrides: z.record(z.array(z.string())).optional(),
  }).optional(),

  // Hooks config
  hooks: z.object({
    brainstormGate: z.object({ enabled: z.boolean() }).optional(),
    slopDetector: z.object({
      enabled: z.boolean(),
      classThreshold: z.number().optional(),
      commentStripThreshold: z.number().optional(),
    }).optional(),
    contextBudget: z.object({
      enabled: z.boolean(),
      warnThreshold: z.number().optional(),
      criticalThreshold: z.number().optional(),
    }).optional(),
  }).optional(),

  // Persistence
  storage: z.object({
    path: z.string().optional(),
    autoSnapshot: z.boolean().optional(),
    snapshotIntervalMs: z.number().optional(),
  }).optional(),

  // Execution mode
  executionMode: z.enum(['strict', 'balanced', 'fast']).optional(),
});
```

### Example: Shark Agent Config

```typescript
// sharks/config.ts

import { CoordinationConfigSchema } from '../coordination/config/schema.js';

export const sharkConfig = CoordinationConfigSchema.parse({
  pluginId: 'shark',
  pluginName: 'Shark Agent',
  version: '1.0.0',

  // 3 primary brains + 5 agents
  agents: {
    // Primary brains (orchestrators)
    'shark-brain': {
      name: 'shark-brain',
      mode: 'primary',
      cluster: 'orchestration',
      prompt: sharkBrainPrompt,
    },
    'macro-brain': {
      name: 'macro-brain',
      mode: 'primary',
      cluster: 'orchestration',
      prompt: macroBrainPrompt,
    },
    'micro-brain': {
      name: 'micro-brain',
      mode: 'primary',
      cluster: 'orchestration',
      prompt: microBrainPrompt,
    },

    // Execution cluster
    'coder': {
      name: 'coder',
      mode: 'subagent',
      cluster: 'execution',
      tools: { write: true, edit: true, patch: true },
      prompt: coderPrompt,
    },
    'tester': {
      name: 'tester',
      mode: 'subagent',
      cluster: 'execution',
      tools: { test_runner: true },
      prompt: testerPrompt,
    },

    // QA cluster
    'reviewer': {
      name: 'reviewer',
      mode: 'subagent',
      cluster: 'qa',
      tools: { evidence_check: true },
      prompt: reviewerPrompt,
    },

    // Research cluster
    'explorer': {
      name: 'explorer',
      mode: 'subagent',
      cluster: 'research',
      tools: { complexity_hotspots: true, detect_domains: true },
      prompt: explorerPrompt,
    },
    'sme': {
      name: 'sme',
      mode: 'subagent',
      cluster: 'research',
      prompt: smePrompt,
    },
  },

  clusters: {
    'orchestration': {
      id: 'orchestration',
      name: 'Orchestration',
      agents: ['shark-brain', 'macro-brain', 'micro-brain'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
      sharedContext: true,
    },
    'execution': {
      id: 'execution',
      name: 'Execution',
      agents: ['coder', 'tester'],
      intraClusterDelegation: true,
      interClusterDelegation: false,
    },
    'qa': {
      id: 'qa',
      name: 'Quality Assurance',
      agents: ['reviewer'],
      intraClusterDelegation: false,
      interClusterDelegation: true,
    },
    'research': {
      id: 'research',
      name: 'Research',
      agents: ['explorer', 'sme'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
    },
  },

  gates: {
    delegation: 'strict',
    maxConsecutiveCoderDelegations: 2,
    requireReviewerAfterCoder: true,
  },

  guardrails: {
    'coder': { maxDurationMinutes: 30, maxToolCalls: 200 },
    'reviewer': { maxDurationMinutes: 15, maxToolCalls: 100 },
  },

  hooks: {
    brainstormGate: { enabled: true },
    slopDetector: { enabled: true, classThreshold: 8 },
    contextBudget: { enabled: true, warnThreshold: 0.7, criticalThreshold: 0.9 },
  },

  storage: {
    path: '.shark',
    autoSnapshot: true,
    snapshotIntervalMs: 60000,
  },

  executionMode: 'balanced',
});
```

---

## 12. Integration with plugin-agent-prototype-v2

### Updated Plugin Entry Point

```typescript
// src/index.ts (updated)

import { createCoordinationLayer } from './coordination/index.js';
import { createCoordinationHooks } from './coordination/hooks/index.js';
import { createCoordinationTools } from './coordination/tools/index.js';
import { sharkConfig } from './config/shark-config.js';
import { loadConfig, getConfig } from './config/loader.js';
import { logger, setLogLevel } from './utils/logger.js';
import { getState } from './state.js';

export default async function SharkAgentPlugin(): Promise<Hooks> {
  const config = loadConfig();
  const pluginConfig = { ...config, ...sharkConfig };  // Merge

  if (pluginConfig.debug) {
    setLogLevel('debug');
  }

  const state = getState();
  state.initialized = true;

  // Create coordination layer
  const coordination = createCoordinationLayer({
    pluginId: pluginConfig.pluginId,
    pluginName: pluginConfig.pluginName,
    config: pluginConfig,
    directory: ctx.directory,  // from plugin context
  });

  logger.info(`${pluginConfig.pluginName} v${pluginConfig.version} initialized`, {
    agentCount: Object.keys(pluginConfig.agents).length,
    clusterCount: Object.keys(pluginConfig.clusters ?? {}).length,
  });

  return {
    name: pluginConfig.pluginId,
    agent: createSdkAgents(pluginConfig),  // Convert to SDK format
    tool: createCoordinationTools(coordination),

    // Hooks from coordination layer
    ...coordination.hooks,

    // Existing hooks from plugin-agent-prototype-v2
    'tool.execute.before': composeHandlers(
      coordination.hooks['tool.execute.before'],
      toolBeforeHook,
    ),
    'tool.execute.after': composeHandlers(
      coordination.hooks['tool.execute.after'],
      toolAfterHook,
    ),
    'experimental.chat.messages.transform': composeHandlers(
      coordination.hooks['experimental.chat.messages.transform'],
      pipelineTrackerHook,
      contextBudgetHook,
    ),
    'experimental.chat.system.transform': systemEnhancerHook,
    'experimental.session.compacting': compactionHook,
    'command.execute.before': commandHook,
    'chat.message': chatMessageHook,

    // Config hook for commands
    config: async (opencodeConfig) => {
      // Register plugin commands
      const commands = coordination.commands.getCommands();
      if (!opencodeConfig.command) opencodeConfig.command = {};
      for (const [name, cmd] of Object.entries(commands)) {
        opencodeConfig.command[name] = {
          template: cmd.template,
          description: cmd.description,
        };
      }
    },
  };
}
```

---

## 13. Usage Examples

### Example 1: Creating a New Architecture (Hydra)

```typescript
// hydra/config.ts

import { CoordinationConfigSchema } from '../coordination/config/schema.js';

export const hydraConfig = CoordinationConfigSchema.parse({
  pluginId: 'hydra',
  pluginName: 'Hydra Agent',
  version: '1.0.0',

  // 5 brains, 13 agents
  agents: {
    // Brains
    'alpha': { name: 'alpha', mode: 'primary', cluster: 'brain', prompt: alphaPrompt },
    'beta': { name: 'beta', mode: 'primary', cluster: 'brain', prompt: betaPrompt },
    'gamma': { name: 'gamma', mode: 'primary', cluster: 'brain', prompt: gammaPrompt },
    'delta': { name: 'delta', mode: 'primary', cluster: 'brain', prompt: deltaPrompt },
    'epsilon': { name: 'epsilon', mode: 'primary', cluster: 'brain', prompt: epsilonPrompt },

    // Workers (12)
    'coder-1': { name: 'coder-1', mode: 'subagent', cluster: 'execution', prompt: coderPrompt },
    'coder-2': { name: 'coder-2', mode: 'subagent', cluster: 'execution', prompt: coderPrompt },
    'coder-3': { name: 'coder-3', mode: 'subagent', cluster: 'execution', prompt: coderPrompt },
    'tester-1': { name: 'tester-1', mode: 'subagent', cluster: 'qa', prompt: testerPrompt },
    'tester-2': { name: 'tester-2', mode: 'subagent', cluster: 'qa', prompt: testerPrompt },
    'reviewer': { name: 'reviewer', mode: 'subagent', cluster: 'qa', prompt: reviewerPrompt },
    'security-reviewer': { name: 'security-reviewer', mode: 'subagent', cluster: 'qa', prompt: securityPrompt },
    'explorer': { name: 'explorer', mode: 'subagent', cluster: 'research', prompt: explorerPrompt },
    'sme': { name: 'sme', mode: 'subagent', cluster: 'research', prompt: smePrompt },
    'docs': { name: 'docs', mode: 'subagent', cluster: 'docs', prompt: docsPrompt },
    'designer': { name: 'designer', mode: 'subagent', cluster: 'design', prompt: designerPrompt },
    'debugger': { name: 'debugger', mode: 'subagent', cluster: 'execution', prompt: debuggerPrompt },
  },

  clusters: {
    'brain': {
      id: 'brain',
      name: 'Brain Council',
      agents: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
      sharedContext: true,
    },
    'execution': {
      id: 'execution',
      name: 'Execution Pool',
      agents: ['coder-1', 'coder-2', 'coder-3', 'debugger'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
    },
    'qa': {
      id: 'qa',
      name: 'Quality Assurance',
      agents: ['tester-1', 'tester-2', 'reviewer', 'security-reviewer'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
    },
    'research': {
      id: 'research',
      name: 'Research',
      agents: ['explorer', 'sme'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
    },
    'docs': {
      id: 'docs',
      name: 'Documentation',
      agents: ['docs'],
      intraClusterDelegation: false,
      interClusterDelegation: true,
    },
    'design': {
      id: 'design',
      name: 'Design',
      agents: ['designer'],
      intraClusterDelegation: false,
      interClusterDelegation: true,
    },
  },

  gates: {
    delegation: 'strict',
    maxConsecutiveCoderDelegations: 3,
    requireReviewerAfterCoder: true,
  },

  guardrails: {
    'coder-1': { maxDurationMinutes: 45, maxToolCalls: 300 },
    'coder-2': { maxDurationMinutes: 45, maxToolCalls: 300 },
    'coder-3': { maxDurationMinutes: 45, maxToolCalls: 300 },
    'tester-1': { maxDurationMinutes: 30, maxToolCalls: 200 },
    'tester-2': { maxDurationMinutes: 30, maxToolCalls: 200 },
    'reviewer': { maxDurationMinutes: 20, maxToolCalls: 150 },
    'security-reviewer': { maxDurationMinutes: 25, maxToolCalls: 175 },
  },

  hooks: {
    brainstormGate: { enabled: true },
    slopDetector: { enabled: true, classThreshold: 10 },
    contextBudget: { enabled: true, warnThreshold: 0.75, criticalThreshold: 0.95 },
  },

  storage: {
    path: '.hydra',
    autoSnapshot: true,
    snapshotIntervalMs: 45000,
  },

  executionMode: 'fast',
});
```

### Example 2: Flat Architecture (Simple Spider Clone)

```typescript
// spider-simple/config.ts

// Spider-style flat hub-spoke (no clusters needed)
export const spiderSimpleConfig = {
  ...baseCoordinationConfig,
  clusters: undefined,  // No clusters = flat

  agents: {
    'architect': { name: 'architect', mode: 'primary', prompt: architectPrompt },
    'coder': { name: 'coder', mode: 'subagent', prompt: coderPrompt },
    'reviewer': { name: 'reviewer', mode: 'subagent', prompt: reviewerPrompt },
    'tester': { name: 'tester', mode: 'subagent', prompt: testerPrompt },
    'explorer': { name: 'explorer', mode: 'subagent', prompt: explorerPrompt },
    'sme': { name: 'sme', mode: 'subagent', prompt: smePrompt },
  },

  gates: {
    delegation: 'strict',
    requireReviewerAfterCoder: true,
  },
};
```

---

## 14. Extending for Specific Architectures

### Hook Extension Pattern

For architecture-specific hooks, extend the base hooks:

```typescript
// spiders/hooks/shadow-gate.ts

import { createCoordinationHooks } from '../../coordination/hooks/index.js';
import type { CoordinationHooks } from '../../coordination/types.js';

export function createSpiderShadowGateHook(options: {
  stateMachine: any;
  config: any;
}) {
  return {
    'tool.execute.before': async (input, output) => {
      // Spider-specific shadow mode detection
      const agent = input.agent;
      const task = input.tool?.arguments?.task ?? '';

      // Detect "shadow coding" - architect doing coder work
      if (agent === 'architect' && /```\w+[\s\S]+```/.test(task)) {
        console.warn('[SHADOW-GATE] Architect appears to be writing code directly');
        // Could block or warn
      }
    },
  };
}

// In spider/index.ts:
const baseHooks = createCoordinationHooks({ ... });
const spiderHooks = createSpiderShadowGateHook({ ... });

return {
  ...baseHooks,
  'tool.execute.before': composeHandlers(
    baseHooks['tool.execute.before'],
    spiderHooks['tool.execute.before'],
  ),
};
```

### Custom State Transitions

```typescript
// spider/states.ts

import { createStateMachine } from '../../coordination/state-machine.js';
import { DEFAULT_STATES, DEFAULT_TRANSITIONS } from '../../coordination/defaults/states.js';

export const spiderStates = {
  ...DEFAULT_STATES,
  // Add Spider-specific states
  'preflight': 'pending',
  'exploring': 'pending',
  'critic_gate': 'review',
};

export const spiderTransitions = [
  ...DEFAULT_TRANSITIONS,
  // Spider-specific transitions
  {
    from: 'idle',
    to: 'exploring',
    trigger: 'delegate',
    guard: (task) => task.targetAgent === 'explorer',
  },
  {
    from: 'exploring',
    to: 'pending',
    trigger: 'complete',
  },
  {
    from: 'pending',
    to: 'critic_gate',
    trigger: 'delegate',
    guard: (task) => task.targetAgent === 'critic',
  },
  {
    from: 'critic_gate',
    to: 'running',
    trigger: 'approve',
  },
  {
    from: 'critic_gate',
    to: 'pending',
    trigger: 'reject',
  },
];

export function createSpiderStateMachine() {
  return createStateMachine({
    states: Object.values(spiderStates),
    transitions: spiderTransitions,
    initialState: 'idle',
  });
}
```

---

## Summary

### What This Layer Provides

| Capability | Status |
|-----------|--------|
| Agent registry with mode flags | ✅ Designed |
| Cluster-based organization | ✅ Designed |
| Delegation engine with gate policy | ✅ Designed |
| State machine with custom transitions | ✅ Designed |
| File-based persistence (plan, evidence, checkpoints) | ✅ Designed |
| Guardrail hooks (resource limits) | ✅ Designed |
| Slop detector hook | ✅ Designed |
| Brainstorm gate hook | ✅ Designed |
| Coordination tools (delegate, checkpoint, phase-complete, status) | ✅ Designed |
| Command registry | ✅ Designed |
| Config schema with Zod validation | ✅ Designed |

### What Remains Architecture-Specific

| Capability | Notes |
|-----------|-------|
| Agent prompts | Custom per project |
| Agent tool allowlists | Custom per project |
| State transition guards | Custom per workflow |
| Custom hooks | As needed |
| Cluster definitions | Optional (flat = no clusters) |

### Implementation Priority

1. **Phase 1**: Core types, registry, state machine (foundational)
2. **Phase 2**: Delegation engine, persistence layer
3. **Phase 3**: Base enforcement hooks (guardrail, gate)
4. **Phase 4**: Coordination tools
5. **Phase 5**: Command registry
6. **Phase 6**: Shark-specific config + integration
7. **Phase 7**: Spider/Hermes/Hydra configs

---

**End of Specification**
