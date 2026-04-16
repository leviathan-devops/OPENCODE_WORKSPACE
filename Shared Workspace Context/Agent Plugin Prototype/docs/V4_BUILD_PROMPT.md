# V4 Agent Boilerplate — Comprehensive Build Prompt

**Target**: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Agent Plugin Prototype/plugin-agent-prototype-v4/`  
**Source V3**: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Agent Plugin Prototype/plugin-agent-prototype-v3/`  
**Design Doc**: `~/hermes-workspace/docs/plans/V4_AGENT_BOILERPLATE_BUILD.md`  
**Build Plan**: `Shared Workspace Context/Agent Plugin Prototype/docs/V4_BOILERPLATE_BUILD_PLAN.md`  
**Architecture Doc**: `Shared Workspace Context/Agent Plugin Prototype/docs/PARALLEL_PEER_BRAINS_ARCHITECTURE.md`

---

## Mission

Build a **production-grade V4 Agent Boilerplate** that implements the **Parallel Peer Brains** multi-orchestrator architecture. This is a config-driven system supporting:

| Brain Type | Orchestrators | Description |
|------------|--------------|-------------|
| `single` | 1 | Spider model — 1 architect, sequential phases |
| `dual` | 2 | Shark model — Architect (planning) + Executor (execution), **parallel** |
| `trio` | 3 | Extended — Architect + Executor + Guardian, **parallel** |

The key innovation: **multiple orchestrators work in parallel** on different concerns, not sequentially repeating the same workflow.

---

## Critical Constraints

1. **NEVER overwrite V3**: V4 is a completely new directory. V3 remains untouched.
2. **Self-contained**: Copy all V3 code into V4. No external dependencies on V3.
3. **Production-grade**: Full validation, error handling, TypeScript strict mode, tests.
4. **Templates are TypeScript**: Not JSON — prompts are too complex for JSON.
5. **Tool unioning**: `AgentFactory.extend()` must **union** tools, not replace them.

---

## Architecture Overview

### Parallel Orchestrator Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                 PARALLEL PEER ORCHESTRATORS                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ARCHITECT ────────────────────────────── EXECUTOR          │
│   (planning)                              (execution)       │
│   owns: planning, phases, architecture    owns: tasks, QA   │
│   delegates → research-pool               delegates → coder  │
│   reads: execution-state                  reads: plan-state  │
│                                                             │
│                        ↓ ↑                                  │
│                  SHARED STATE STORE                         │
│                  (plan, execution, quality)                 │
│                                                             │
│                        ↓                                    │
│   GUARDIAN (trio only)                                      │
│   owns: context, knowledge, quality                         │
│   delegates → knowledge-pool                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Orchestrator Ownership Model

| Orchestrator | Owns | Delegates To | Reads (No Write) |
|-------------|------|-------------|------------------|
| **architect** | planning, phase-sequencing, architecture | research-pool | execution-state, quality-state |
| **executor** | execution, qa-gates, completion | execution-pool, qa-pool | plan-state, quality-state |
| **guardian** | context, knowledge, quality | knowledge-pool | plan-state, execution-state |

### Sync Model

**Hybrid**:
- Primary: Shared state store with versioning (plan-state, execution-state, quality-state)
- Secondary: Direct messages for urgent handoffs (BrainMessenger)

---

## Implementation Phases

### Phase 1: Factory Core (Foundation)

Create `src/factory/` with these files:

#### 1.1 `factory/types.ts`

Define all types. This is the single source of truth for the entire system.

```typescript
// Brain types
export type BrainType = 'single' | 'dual' | 'trio' | 'custom';

export interface BrainConfig {
  type: BrainType;
  name: string;
  description?: string;
}

export interface SingleBrainConfig extends BrainConfig {
  type: 'single';
  orchestrator: string;
}

export interface DualBrainConfig extends BrainConfig {
  type: 'dual';
  orchestrators: {
    [key: string]: string;  // orchestrator ID → agent ID
  };
  workflows: {
    [orchestratorId: string]: OrchestratorWorkflow;
  };
  syncMode: 'shared-state' | 'direct' | 'none';
}

export interface TrioBrainConfig extends BrainConfig {
  type: 'trio';
  orchestrators: {
    [key: string]: string;
  };
  workflows: {
    [orchestratorId: string]: OrchestratorWorkflow;
  };
  syncMode: 'shared-state' | 'direct' | 'none';
}

export interface OrchestratorWorkflow {
  name: string;
  description: string;
  owns: string[];
  delegatesTo: string[];
  readOnly?: string[];
  gates?: string[];
}

// Agent types
export interface AgentDefinition {
  id: string;
  name: string;
  mode: string;
  description: string;
  cluster?: string;
  capabilities: string[];
  allowedTools: string[];
  maxConcurrentTasks: number;
  prompt?: string;
  model?: string;
  temperature?: number;
  brain?: string;
}

export interface AgentTemplate {
  id: string;
  description: string;
  tools: string[];
  capabilities: string[];
  prompt: string;
  defaultModel?: string;
  defaultTemperature?: number;
}

export interface AgentOverride {
  prompt?: string;
  tools?: string[];
  model?: string;
  temperature?: number;
  maxConcurrentTasks?: number;
}

// Cluster types
export interface ClusterConfig {
  id: string;
  name: string;
  description?: string;
  agents: string[];
  subOrchestrator?: string;
  intraClusterDelegation: boolean;
  interClusterDelegation: boolean;
  sharedContext: boolean;
  parentCluster?: string;
}

// Architecture types
export interface ArchitectureConfig {
  name: string;
  version: string;
  description?: string;
  brain: SingleBrainConfig | DualBrainConfig | TrioBrainConfig | BrainConfig;
  clusters: ClusterConfig[];
  agents: Record<string, AgentDefinition | string>;  // string = template reference
  delegation?: {
    allowCrossCluster?: boolean;
    requireGateApproval?: boolean;
    maxHops?: number;
  };
  hooks?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ArchitectureInstance {
  config: ArchitectureConfig;
  agents: Map<string, AgentDefinition>;
  clusters: Map<string, ClusterConfig>;
  brains: {
    type: BrainType;
    primary: string;
    all: string[];
    workflows?: { [key: string]: OrchestratorWorkflow };
    syncMode?: 'shared-state' | 'direct' | 'none';
  };
  coordination: {
    registry: AgentRegistry;
    delegation: DelegationEngine;
    stateMachine: StateMachine;
  };
}

// State Store types (NEW)
export type StateDomain = 'plan-state' | 'execution-state' | 'quality-state';

export interface StateStore {
  get<T>(key: string, domain?: StateDomain): T | undefined;
  set<T>(key: string, value: T, domain: StateDomain, version?: number): WriteResult;
  watch(key: string, callback: (value: any, version: number) => void): Unsubscribe;
  snapshot(): StateSnapshot;
  restore(snapshot: StateSnapshot): void;
}

export interface WriteResult {
  success: boolean;
  version: number;
  error?: string;
}

export interface Unsubscribe {
  (): void;
}

export interface StateSnapshot {
  data: Record<string, any>;
  versions: Record<string, number>;
  timestamp: number;
}

// Brain Messenger types (NEW)
export interface BrainMessage {
  id: string;
  from: string;
  to: string;
  type: 'handoff' | 'alert' | 'request' | 'ack';
  priority: 'low' | 'normal' | 'high' | 'critical';
  payload: unknown;
  timestamp: number;
  requiresAck: boolean;
}

export interface BrainMessenger {
  send(message: BrainMessage): void;
  receive(brainId: string): BrainMessage[];
  waitForAck(messageId: string, timeoutMs: number): Promise<boolean>;
}

// Validation types (NEW)
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export type Validator<T> = (config: T) => ValidationResult;
```

#### 1.2 `factory/AgentFactory.ts`

```typescript
import type { AgentDefinition, AgentTemplate, AgentOverride, ArchitectureConfig, ValidationResult } from './types.js';

export interface AgentFactory {
  createAgent(id: string, config: Partial<AgentDefinition>): AgentDefinition;
  createFromTemplate(templateId: string, agentId: string, overrides?: AgentOverride): AgentDefinition;
  extend(agent: AgentDefinition, overrides: AgentOverride): AgentDefinition;
  createAgents(
    agents: Record<string, AgentDefinition | string>,
    templates: Map<string, AgentTemplate>
  ): Map<string, AgentDefinition>;
  validate(agent: AgentDefinition): ValidationResult;
}
```

**Key methods**:
- `createAgent()` — Create agent from scratch
- `createFromTemplate()` — Create from template ID with optional overrides
- `extend()` — Merge overrides into existing agent (**tools get unioned, not replaced**)
- `createAgents()` — Process architecture agents config, resolving template references
- `validate()` — Check agent has required fields, warn if no tools

#### 1.3 `factory/BrainFactory.ts`

```typescript
import type { BrainType, BrainConfig, SingleBrainConfig, DualBrainConfig, TrioBrainConfig, ValidationResult } from './types.js';

export interface BrainFactory {
  create(config: BrainConfig): BrainInstance;
  validate(config: BrainConfig): ValidationResult;
}

export interface BrainInstance {
  type: BrainType;
  primary: string;
  all: string[];
  hierarchy: BrainHierarchy;
  workflows?: { [orchestratorId: string]: OrchestratorWorkflow };
  syncMode?: 'shared-state' | 'direct' | 'none';
}

export interface BrainHierarchy {
  level: number;
  children: BrainInstance[];
  parent?: string;
}
```

**Factory creates**:
- `createSingleBrain()` — Returns { type: 'single', primary: orchestrator, all: [orchestrator] }
- `createDualBrain()` — Returns { type: 'dual', primary: first orchestrator, all: [...orchestrators], workflows, syncMode }
- `createTrioBrain()` — Same structure for 3 orchestrators

#### 1.4 `factory/ClusterFactory.ts`

```typescript
import type { ClusterConfig, AgentDefinition, ValidationResult } from './types.js';

export interface ClusterFactory {
  create(config: ClusterConfig, agents: Map<string, AgentDefinition>): ClusterInstance;
  createHierarchy(configs: ClusterConfig[], agents: Map<string, AgentDefinition>): ClusterInstance[];
  validate(config: ClusterConfig, agentIds: string[]): ValidationResult;
}

export interface ClusterInstance {
  config: ClusterConfig;
  agents: AgentDefinition[];
  subOrchestrator?: AgentDefinition;
}
```

**Validation rules**:
- Cluster ID required
- All agent references must exist in agentIds
- subOrchestrator must exist if specified
- Warn if cluster has no agents

#### 1.5 `factory/StateStore.ts` **[NEW]**

Shared state store with domain ownership enforcement.

```typescript
import type { StateStore, StateDomain, WriteResult, StateSnapshot, Unsubscribe } from './types.js';

// Domain ownership map — which brain owns which state domain
const DOMAIN_OWNERSHIP: Record<StateDomain, string[]> = {
  'plan-state': ['architect'],
  'execution-state': ['executor'],
  'quality-state': ['guardian', 'executor'],
};

export function createStateStore(): StateStore {
  // Implementation:
  // - In-memory Map for state storage
  // - Version tracking per key
  // - Domain ownership enforcement (only owner brains can write)
  // - Pub/sub via callback registry for watch()
  // - snapshot() returns full state + versions
  // - restore() replaces state from snapshot
}
```

**Key behaviors**:
- `set()` checks domain ownership — rejects writes from non-owner brains
- `watch()` registers callback, returns unsubscribe function
- `snapshot()` captures full state for persistence
- `restore()` rebuilds state from snapshot

#### 1.6 `factory/BrainMessenger.ts` **[NEW]**

Direct brain-to-brain messaging for urgent handoffs.

```typescript
import type { BrainMessenger, BrainMessage } from './types.js';

export function createBrainMessenger(): BrainMessenger {
  // Implementation:
  // - In-memory message queue per brain
  // - send() adds to receiver's queue
  // - receive() drains queue for a brain
  // - waitForAck() polls for acknowledgment with timeout
  // - Message IDs are UUIDs
  // - Priority ordering (critical > high > normal > low)
}
```

**Key behaviors**:
- Messages are queued per recipient brain
- `waitForAck()` blocks until ack received or timeout
- Priority ordering ensures critical messages processed first

#### 1.7 `factory/validators.ts` **[NEW]**

Composable validation pipeline.

```typescript
import type { Validator, ValidationResult, ArchitectureConfig, AgentDefinition, ClusterConfig, BrainConfig } from './types.js';

// Individual validators
export const validateRequiredFields: Validator<ArchitectureConfig> = (config) => { ... };
export const validateBrainReferences: Validator<ArchitectureConfig> = (config) => { ... };
export const validateAgentReferences: Validator<ArchitectureConfig> = (config) => { ... };
export const validateClusterIntegrity: Validator<ArchitectureConfig> = (config) => { ... };
export const validateToolPermissions: Validator<ArchitectureConfig> = (config) => { ... };
export const validateStateOwnership: Validator<ArchitectureConfig> = (config) => { ... };
export const validateWorkflowGates: Validator<ArchitectureConfig> = (config) => { ... };

// Run all validators
export function runValidators<T>(validators: Validator<T>[], config: T): ValidationResult {
  const results = validators.map(v => v(config));
  return {
    valid: results.every(r => r.valid),
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings),
  };
}
```

#### 1.8 `factory/ArchitectureFactory.ts`

```typescript
import type { ArchitectureConfig, ArchitectureInstance, ValidationResult, AgentTemplate } from './types.js';

export interface ArchitectureFactory {
  create(config: ArchitectureConfig): ArchitectureInstance;
  validate(config: ArchitectureConfig): ValidationResult;
  getTemplate(templateId: string): AgentTemplate | undefined;
  listTemplates(): AgentTemplate[];
}
```

**create() flow**:
1. Validate config using composable validators
2. Create agents (resolving template references)
3. Create brains
4. Create clusters
5. Create StateStore and BrainMessenger
6. Wire into V3 coordination layer (registry, delegation, state machine)
7. Return ArchitectureInstance

#### 1.9 `factory/index.ts`

Re-export all factory types and create functions.

---

### Phase 2: Agent Templates

Create `src/factory/templates/agent/` with these templates:

| File | Template ID | Purpose |
|------|------------|---------|
| `architect.ts` | `architect` | Primary orchestrator, owns planning |
| `executor.ts` | `executor` | Execution overseer, owns execution |
| `coder.ts` | `coder` | Implementation |
| `reviewer.ts` | `reviewer` | Code review |
| `test-engineer.ts` | `test-engineer` | Test generation |
| `sme.ts` | `sme` | Domain expertise |
| `explorer.ts` | `explorer` | Context gathering |
| `critic.ts` | `critic` | Risk assessment |
| `docs.ts` | `docs` | Documentation |
| `designer.ts` | `designer` | Architecture/design |
| `index.ts` | — | Re-exports all templates |

### Template Prompts

**architect** (The Planner):
```
You are the Architect — the strategic planner of this multi-agent system.

## Your Role
- Own long-term planning and phase sequencing
- Make architecture decisions
- Sequence and scope phase work
- Delegate research tasks to research-pool

## Parallel Execution Model
You work IN PARALLEL with The Executor. While you focus on PLANNING and ARCHITECTURE, 
The Executor handles EXECUTION and QA in parallel.

## Your Focus
- "What should we build next?"
- "Is the architecture sound?"
- "What are the risks?"

Communicate with other orchestrators through shared plan state.
```

**executor** (The Executor):
```
You are the Executor — the execution overseer of this multi-agent system.

## Your Role
- Track execution progress
- Enforce QA gates
- Verify completion
- Delegate to execution-pool and qa-pool

## Parallel Execution Model
You work IN PARALLEL with The Architect. While The Architect focuses on PLANNING, 
you handle EXECUTION and QA.

## Your Focus
- "What needs to be built right now?"
- "Did the last task pass QA?"
- "Is execution on track?"
```

**guardian** (The Guardian — trio only):
```
You are the Guardian — the quality and knowledge keeper of this multi-agent system.

## Your Role
- Maintain context and knowledge base
- Enforce quality standards
- Monitor system health
- Delegate to knowledge-pool

## Parallel Execution Model
You work IN PARALLEL with both The Architect and The Executor. While they focus on 
planning and execution respectively, you ensure QUALITY and KNOWLEDGE integrity.

## Your Focus
- "Is the work meeting quality standards?"
- "What context is missing?"
- "Are there knowledge gaps?"
```

---

### Phase 3: Pre-Built Architectures

Create `src/config/templates/`:

#### 3.1 `spider.ts` — Single Brain

```typescript
import { createArchitectureFactory } from '../../factory/index.js';
import { architectTemplate, coderTemplate, reviewerTemplate, 
         testEngineerTemplate, smeTemplate, explorerTemplate } 
  from '../../factory/templates/agent/index.js';

export const spiderArchitecture = factory.create({
  name: 'spider',
  version: '1.0.0',
  description: 'Single-brain hub-and-spoke (Spider model)',
  
  brain: {
    type: 'single',
    name: 'spider-brain',
    orchestrator: 'architect',
  },
  
  clusters: [
    { id: 'execution', name: 'Execution', agents: ['coder'], intraClusterDelegation: false, interClusterDelegation: false, sharedContext: true },
    { id: 'qa', name: 'QA', agents: ['reviewer', 'test-engineer'], intraClusterDelegation: false, interClusterDelegation: true, sharedContext: true },
    { id: 'research', name: 'Research', agents: ['explorer', 'sme'], intraClusterDelegation: true, interClusterDelegation: true, sharedContext: true },
  ],
  
  agents: {
    architect: architectTemplate,
    coder: coderTemplate,
    reviewer: reviewerTemplate,
    'test-engineer': testEngineerTemplate,
    explorer: explorerTemplate,
    sme: smeTemplate,
  },
});
```

#### 3.2 `shark.ts` — Dual Parallel (MVP)

```typescript
export const sharkArchitecture = factory.create({
  name: 'shark',
  version: '1.0.0',
  description: 'Dual parallel orchestrator: Architect (planning) + Executor (execution)',
  
  brain: {
    type: 'dual',
    name: 'shark-brain',
    syncMode: 'shared-state',
    orchestrators: {
      'architect': 'architect',
      'executor': 'executor',
    },
    workflows: {
      'architect': {
        name: 'The Architect',
        description: 'Long-term planning, architecture, phase sequencing',
        owns: ['planning', 'phase-sequencing', 'architecture'],
        delegatesTo: ['research-pool'],
        readOnly: ['execution-state'],
        gates: ['plan-gate'],
      },
      'executor': {
        name: 'The Executor',
        description: 'Execution tracking, QA gate enforcement',
        owns: ['execution', 'qa-gates', 'completion'],
        delegatesTo: ['execution-pool', 'qa-pool'],
        readOnly: ['plan-state'],
        gates: ['qa-gate', 'test-gate', 'review-gate'],
      },
    },
  },
  
  clusters: [
    { id: 'research', name: 'Research Pool', agents: ['explorer', 'sme'], intraClusterDelegation: true, interClusterDelegation: false, sharedContext: true },
    { id: 'execution', name: 'Execution Pool', agents: ['coder'], intraClusterDelegation: true, interClusterDelegation: false, sharedContext: true },
    { id: 'qa', name: 'QA Pool', agents: ['reviewer', 'test-engineer'], intraClusterDelegation: false, interClusterDelegation: true, sharedContext: true },
  ],
  
  agents: {
    architect: { ...architectTemplate, prompt: '...parallel version...' },
    executor: {
      id: 'executor',
      name: 'The Executor',
      mode: 'architect',
      description: 'Execution tracking, QA gate enforcement',
      capabilities: ['execution', 'qa', 'delegation'],
      allowedTools: ['*'],
      maxConcurrentTasks: 2,
      prompt: '...executor prompt...',
    },
    explorer: explorerTemplate,
    sme: smeTemplate,
    coder: coderTemplate,
    reviewer: reviewerTemplate,
    'test-engineer': testEngineerTemplate,
  },
});
```

#### 3.3 `trio.ts` — Trio Parallel (Extended)

Same as shark but with 3 orchestrators:
- `architect` — planning
- `executor` — execution
- `guardian` — context, knowledge, quality

Add `knowledge-pool` cluster with `analyst`, `docs` agents.

#### 3.4 `index.ts`

Re-export all architecture configs.

---

### Phase 4: Config Loader

#### `config/loader.ts`

```typescript
export async function loadArchitectureConfig(path: string): Promise<ArchitectureConfig> {
  // Load .ts or .json config file
  // Return parsed ArchitectureConfig
}
```

#### `config/schema.ts`

Extended JSON schema for architecture validation.

---

### Phase 5: Plugin Integration

#### `src/index.ts`

Update to use factory:

```typescript
import { createArchitectureFactory } from './factory/index.js';
import { spiderConfig } from './config/templates/spider.js';
import { sharkConfig } from './config/templates/shark.js';
import { trioConfig } from './config/templates/trio.js';

export interface V4PluginOptions {
  architecture?: 'spider' | 'shark' | 'trio' | 'custom';
  configPath?: string;
}

export default async function createPlugin(options: V4PluginOptions = {}): Promise<Plugin> {
  const architecture = options.architecture || 'spider';
  
  const configs = { spider: spiderConfig, shark: sharkConfig, trio: trioConfig };
  const config = configs[architecture as keyof typeof configs];
  
  const factory = createArchitectureFactory();
  const instance = factory.create(config);
  
  // Wire into V3 coordination layer
  return buildPlugin(instance);
}
```

---

### Phase 6: Tests

Create `tests/unit/factory/`:

- `AgentFactory.test.ts` — Test createAgent, createFromTemplate, extend, validate
- `BrainFactory.test.ts` — Test single/dual/trio brain creation
- `ClusterFactory.test.ts` — Test cluster creation and validation
- `ArchitectureFactory.test.ts` — Test full architecture assembly
- `StateStore.test.ts` — **[NEW]** Test domain ownership, versioning, watch, snapshot/restore
- `BrainMessenger.test.ts` — **[NEW]** Test message delivery, priority ordering, ack timeout

Create `tests/integration/full-architecture.test.ts`:
- Test that spider architecture creates correct agents/clusters
- Test that shark architecture has 2 orchestrators
- Test that trio architecture has 3 orchestrators
- Test template resolution in agent creation
- Test StateStore domain ownership enforcement
- Test BrainMessenger message delivery between brains

---

## File Structure (Target)

```
plugin-agent-prototype-v4/
├── src/
│   ├── factory/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── AgentFactory.ts
│   │   ├── BrainFactory.ts
│   │   ├── ClusterFactory.ts
│   │   ├── ArchitectureFactory.ts
│   │   ├── StateStore.ts            # NEW
│   │   ├── BrainMessenger.ts        # NEW
│   │   ├── validators.ts            # NEW
│   │   └── templates/
│   │       └── agent/
│   │           ├── architect.ts
│   │           ├── executor.ts
│   │           ├── coder.ts
│   │           ├── reviewer.ts
│   │           ├── test-engineer.ts
│   │           ├── sme.ts
│   │           ├── explorer.ts
│   │           ├── critic.ts
│   │           ├── docs.ts
│   │           ├── designer.ts
│   │           └── index.ts
│   ├── config/
│   │   ├── loader.ts
│   │   ├── schema.ts
│   │   └── templates/
│   │       ├── spider.ts
│   │       ├── shark.ts
│   │       ├── trio.ts
│   │       └── index.ts
│   ├── coordination/          # COPIED FROM V3
│   ├── hooks/                 # COPIED FROM V3
│   ├── tools/                 # COPIED FROM V3
│   └── index.ts              # Updated to use factory
├── tests/
│   ├── unit/
│   │   └── factory/
│   │       ├── AgentFactory.test.ts
│   │       ├── BrainFactory.test.ts
│   │       ├── ClusterFactory.test.ts
│   │       ├── ArchitectureFactory.test.ts
│   │       ├── StateStore.test.ts          # NEW
│   │       └── BrainMessenger.test.ts      # NEW
│   └── integration/
│       └── full-architecture.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Success Criteria

- [ ] `factory.createArchitectureFactory()` returns working factory
- [ ] `factory.createAgent('test', {})` creates valid agent
- [ ] `factory.createFromTemplate('coder', 'my-coder', {})` works
- [ ] `factory.extend(agent, { tools: [...] })` unions tools
- [ ] `BrainFactory.create({ type: 'dual', ... })` creates dual brain
- [ ] `spiderConfig` produces single-brain architecture
- [ ] `sharkConfig` produces dual-brain architecture with 2 orchestrators
- [ ] `trioConfig` produces trio-brain architecture with 3 orchestrators
- [ ] `StateStore` enforces domain ownership (brain can only write to owned domains)
- [ ] `BrainMessenger` delivers messages between parallel brains
- [ ] All TypeScript compiles with 0 errors
- [ ] All unit tests pass
- [ ] All integration tests pass

---

## Execution Workflow

1. **Copy V3 source** → `plugin-agent-prototype-v4/src/coordination/`, `hooks/`, `tools/`
2. **Build Phase 1** → Factory core (types, AgentFactory, BrainFactory, ClusterFactory, ArchitectureFactory, StateStore, BrainMessenger, validators)
3. **Build Phase 2** → Agent templates (10 template files)
4. **Build Phase 3** → Pre-built architectures (spider, shark, trio)
5. **Build Phase 4** → Config loader
6. **Build Phase 5** → Plugin integration (src/index.ts)
7. **Build Phase 6** → Tests (unit + integration)
8. **Verify** → TypeScript compile, run tests, check all success criteria

---

## Open Questions (Resolved)

1. **State persistence**: Memory-only with optional persistence (snapshot/restore)
2. **Hot reload**: Deferred to follow-up (not in initial build)
3. **Architecture snapshots**: Include config + brain state only (not in-progress tasks)
4. **BrainMessenger delivery**: At-least-once (simpler, good enough for initial build)

---

## Build Command

After implementation:
```bash
cd plugin-agent-prototype-v4
npm install
npm run build    # TypeScript compile
npm test         # Run all tests
```

---

Build this step by step. Start with Phase 1 (Factory Core). Use the docs for architectural context. Report progress and any blockers.