# Spider Agent: Build V4 Parallel Peer Brains Boilerplate

**Task**: Build the V4 Agent Boilerplate implementing the Parallel Peer Brains multi-orchestrator architecture.

**Context Docs** (read these first):
- `docs/PARALLEL_PEER_BRAINS_ARCHITECTURE.md` — Deep-dive on parallel orchestrator design
- `docs/V4_BOILERPLATE_BUILD_PLAN.md` — Implementation plan with file structure and types

**Target Location**: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Agent Plugin Prototype/`

---

## Overview

Build a **config-driven boilerplate** that supports:

| Brain Type | Orchestrators | Description |
|------------|--------------|-------------|
| `single` | 1 | Spider model — 1 architect, sequential phases |
| `dual` | 2 | Shark model — Architect (planning) + Executor (execution), **parallel** |
| `trio` | 3 | Extended — Architect + Executor + Guardian, **parallel** |

The key innovation: **multiple orchestrators work in parallel** on different concerns, not sequentially repeating the same workflow.

---

## Architecture Summary

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

**Hybrid** (recommended):
- Primary: Shared state store with versioning (plan-state, execution-state, quality-state)
- Secondary: Direct messages for urgent handoffs

---

## Phase 1: Factory Core

Create `factory/` directory with these files:

### 1.1 `factory/types.ts`

Define all types:

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
```

### 1.2 `factory/AgentFactory.ts`

```typescript
import type { AgentDefinition, AgentTemplate, AgentOverride, ArchitectureConfig } from './types.js';

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

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

**Key methods**:
- `createAgent()` — Create agent from scratch
- `createFromTemplate()` — Create from template ID with optional overrides
- `extend()` — Merge overrides into existing agent (tools get unioned, not replaced)
- `createAgents()` — Process architecture agents config, resolving template references
- `validate()` — Check agent has required fields, warn if no tools

### 1.3 `factory/BrainFactory.ts`

```typescript
import type { BrainType, BrainConfig, SingleBrainConfig, DualBrainConfig, TrioBrainConfig } from './types.js';

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

### 1.4 `factory/ClusterFactory.ts`

```typescript
import type { ClusterConfig, AgentDefinition } from './types.js';

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

### 1.5 `factory/ArchitectureFactory.ts`

```typescript
import type { ArchitectureConfig, ArchitectureInstance } from './types.js';

export interface ArchitectureFactory {
  create(config: ArchitectureConfig): ArchitectureInstance;
  validate(config: ArchitectureConfig): ValidationResult;
  getTemplate(templateId: string): AgentTemplate | undefined;
  listTemplates(): AgentTemplate[];
}
```

**create() flow**:
1. Validate config
2. Create agents (resolving template references)
3. Create brains
4. Create clusters
5. Create V3 coordination layer (registry, delegation, state machine)
6. Return ArchitectureInstance

### 1.6 `factory/index.ts`

Re-export all factory types and create functions.

---

## Phase 2: Agent Templates

Create `factory/templates/agent/` with these templates:

| File | Template ID | Purpose |
|------|------------|---------|
| `architect.ts` | `architect` | Primary orchestrator, owns planning |
| `coder.ts` | `coder` | Implementation |
| `reviewer.ts` | `reviewer` | Code review |
| `test-engineer.ts` | `test-engineer` | Test generation |
| `sme.ts` | `sme` | Domain expertise |
| `explorer.ts` | `explorer` | Context gathering |
| `critic.ts` | `critic` | Risk assessment |
| `docs.ts` | `docs` | Documentation |
| `designer.ts` | `designer` | Architecture/design |
| `index.ts` | — | Re-exports all templates |

### Template Schema

```typescript
export interface AgentTemplate {
  id: string;
  description: string;
  tools: string[];           // Tool permissions
  capabilities: string[];      // Agent capabilities
  prompt: string;             // System prompt
  defaultModel?: string;
  defaultTemperature?: number;
}
```

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

---

## Phase 3: Pre-Built Architectures

Create `config/templates/`:

### 3.1 `spider.ts` — Single Brain

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

### 3.2 `shark.ts` — Dual Parallel (MVP)

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

### 3.3 `trio.ts` — Trio Parallel (Extended)

Same as shark but with 3 orchestrators:
- `architect` — planning
- `executor` — execution
- `guardian` — context, knowledge, quality

Add `knowledge-pool` cluster with `analyst`, `docs` agents.

### 3.4 `index.ts`

Re-export all architecture configs.

---

## Phase 4: Config Loader

### `config/loader.ts`

```typescript
export async function loadArchitectureConfig(path: string): Promise<ArchitectureConfig> {
  // Load .ts or .json config file
  // Return parsed ArchitectureConfig
}
```

### `config/schema.ts`

Extended JSON schema for architecture validation.

---

## Phase 5: Plugin Integration

### `src/index.ts`

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

## Phase 6: Tests

Create `tests/unit/factory/`:

- `AgentFactory.test.ts` — Test createAgent, createFromTemplate, extend
- `BrainFactory.test.ts` — Test single/dual/trio brain creation
- `ClusterFactory.test.ts` — Test cluster creation and validation
- `ArchitectureFactory.test.ts` — Test full architecture assembly

Create `tests/integration/full-architecture.test.ts`:
- Test that spider architecture creates correct agents/clusters
- Test that shark architecture has 2 orchestrators
- Test that trio architecture has 3 orchestrators
- Test template resolution in agent creation

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
│   │   └── templates/
│   │       └── agent/
│   │           ├── architect.ts
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
│   ├── coordination/          # FROM V3 (wire up)
│   ├── hooks/                 # FROM V3
│   ├── tools/                 # FROM V3
│   └── index.ts              # Updated to use factory
├── tests/
│   ├── unit/
│   │   └── factory/
│   │       ├── AgentFactory.test.ts
│   │       ├── BrainFactory.test.ts
│   │       ├── ClusterFactory.test.ts
│   │       └── ArchitectureFactory.test.ts
│   └── integration/
│       └── full-architecture.test.ts
└── docs/                      # Already written
    ├── V4_BOILERPLATE_BUILD_PLAN.md
    └── PARALLEL_PEER_BRAINS_ARCHITECTURE.md
```

---

## Implementation Priority

1. **Phase 1 (Foundation)**: `factory/types.ts`, `AgentFactory.ts`, `BrainFactory.ts`, `ClusterFactory.ts`, `ArchitectureFactory.ts`
2. **Phase 2 (Templates)**: Agent template files
3. **Phase 3 (Configs)**: Pre-built architecture configs
4. **Phase 4 (Loader)**: Config loading
5. **Phase 5 (Integration)**: Plugin wiring
6. **Phase 6 (Tests)**: Unit and integration tests

---

## Key Constraints

- All factories must validate inputs and return clear errors
- AgentFactory.extend() must union tools, not replace
- BrainFactory must handle single/dual/trio differently
- ClusterFactory must validate agent references exist
- ArchitectureFactory must wire everything into V3 coordination layer
- Templates are TypeScript files (not JSON) because prompts are too complex for JSON

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
- [ ] All TypeScript compiles with 0 errors
- [ ] All unit tests pass

---

Build this step by step. Start with Phase 1 (Factory Core). Use the docs for architectural context. Report progress and any blockers.
