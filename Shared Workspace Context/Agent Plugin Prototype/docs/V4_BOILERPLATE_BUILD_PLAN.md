# V4 BOILERPLATE BUILD PLAN
## Config-Driven Multi-Brain Agent Architecture

**Date**: 2026-04-03
**Purpose**: Create a boilerplate that supports Spider (1-brain), Shark (3-brain), Hydra (5-brain), Kraken (3-brain + sub-orchestrators), and custom architectures.
**Prerequisite**: V3 Agent Coordination Edition

---

## 1. Core Problem Statement

### Current State (V3)

V3 has a working coordination layer but hardcodes agents:

```typescript
// registry.ts - HARDCODED
export function getDefaultAgents() {
  return {
    architect: { id: 'architect', mode: 'architect', ... },
    coder: { id: 'coder', mode: 'coder', ... },
    reviewer: { id: 'reviewer', mode: 'reviewer', ... },
    'test-engineer': { id: 'test-engineer', mode: 'test-engineer', ... },
    sme: { id: 'sme', mode: 'sme', ... },
    // ... can't add/remove without code changes
  };
}
```

### Desired State (V4)

```typescript
// spider-config.ts - CONFIG DRIVEN
export const spiderArchitecture = {
  name: 'spider',
  brain: {
    type: 'single',  // 1 orchestrator
    orchestrator: 'architect',
  },
  clusters: [
    { id: 'execution', agents: ['coder'] },
    { id: 'qa', agents: ['reviewer', 'test-engineer'] },
    { id: 'research', agents: ['explorer', 'sme'] },
  ],
  agents: {
    architect: { prompt: '...', tools: [...] },
    coder: { prompt: '...', tools: [...] },
    // ... or import from templates
  }
};

// shark-config.ts - 3 BRAIN
export const sharkArchitecture = {
  name: 'shark',
  brain: {
    type: 'triple',  // 3 brains: macro, micro, execution
    orchestrators: ['macro-brain', 'micro-brain', 'execution-brain'],
  },
  clusters: [
    { id: 'strategy', agents: ['strategist'] },
    { id: 'execution', agents: ['coder'], subOrchestrator: 'execution-brain' },
    { id: 'qa', agents: ['reviewer', 'test-engineer'], subOrchestrator: 'micro-brain' },
  ],
};

// kraken-config.ts - SUB-ORCHESTRATORS
export const krakenArchitecture = {
  name: 'kraken',
  brain: {
    type: 'triple',
    orchestrators: ['command-brain', 'tactical-brain', 'strategic-brain'],
    subOrchestrators: true,  // Each cluster has its own sub-orchestrator
  },
  clusters: [
    { 
      id: 'execution', 
      agents: ['coder', 'test-engineer'],
      subOrchestrator: 'tactical-brain',  // Direct control
      intraClusterDelegation: true,  // tactical-brain can delegate within cluster
    },
    {
      id: 'intelligence',
      agents: ['analyst', 'sme', 'researcher'],
      subOrchestrator: 'strategic-brain',
    },
  ],
};
```

---

## 2. Architecture Overview

### V4 System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                        V4 BOILERPLATE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    CONFIGURATION LAYER                      │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │     │
│  │  │ spider  │  │  shark  │  │  hydra  │  │ kraken      │   │     │
│  │  │.config  │  │.config  │  │.config  │  │  .config    │   │     │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘   │     │
│  └───────┼─────────────┼─────────────┼──────────────┼──────────┘     │
│          │             │             │              │                │
│          ▼             ▼             ▼              ▼                │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                  ARCHITECTURE FACTORY                        │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │     │
│  │  │BrainFactory │  │AgentFactory │  │ClusterFactory   │     │     │
│  │  │ - single    │  │ - create    │  │ - create        │     │     │
│  │  │ - triple    │  │ - extend    │  │ - subOrch       │     │     │
│  │  │ - penta     │  │ - template  │  │ - hierarchy     │     │     │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘     │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    V3 COORDINATION LAYER                    │     │
│  │  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌────────┐  │     │
│  │  │ Registry │  │ Delegation │  │   State   │  │ Hooks  │  │     │
│  │  │          │  │   Engine   │  │  Machine  │  │        │  │     │
│  │  └──────────┘  └────────────┘  └───────────┘  └────────┘  │     │
│  │  ┌──────────┐  ┌────────────┐  ┌───────────┐               │     │
│  │  │Persistence│ │   Tools    │  │ Commands  │               │     │
│  │  └──────────┘  └────────────┘  └───────────┘               │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    PLUGIN ENTRY POINT                        │     │
│  │           createPlugin(config) → PluginManifest              │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
plugin-agent-prototype-v4/
├── src/
│   ├── factory/                        # NEW: Architecture factories
│   │   ├── index.ts                    # Factory exports
│   │   ├── types.ts                    # Factory type definitions
│   │   ├── BrainFactory.ts             # Brain/orchestrator creation
│   │   ├── AgentFactory.ts             # Agent creation + extension
│   │   ├── ClusterFactory.ts           # Cluster creation + hierarchy
│   │   ├── ArchitectureFactory.ts       # Full architecture assembly
│   │   └── templates/
│   │       ├── brain/
│   │       │   ├── single.ts           # Spider brain
│   │       │   ├── triple.ts           # Shark brain
│   │       │   ├── penta.ts            # Hydra brain
│   │       │   └── index.ts
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
│   │
│   ├── coordination/                    # FROM V3 (unchanged)
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── delegation.ts
│   │   ├── state-machine.ts
│   │   ├── defaults/
│   │   ├── hooks/
│   │   ├── persistence/
│   │   ├── tools/
│   │   └── commands/
│   │
│   ├── config/                         # UPDATED: Architecture configs
│   │   ├── schema.ts                   # Extended with architecture types
│   │   ├── loader.ts                   # Load architecture from file
│   │   └── templates/                  # Pre-built architectures
│   │       ├── spider.ts              # 1-brain config
│   │       ├── shark.ts               # 3-brain config
│   │       ├── hydra.ts               # 5-brain config
│   │       ├── kraken.ts              # 3-brain + sub-orchestrators
│   │       └── index.ts
│   │
│   ├── hooks/                          # FROM V3 (updated)
│   ├── tools/                          # FROM V3 (updated)
│   ├── services/                        # FROM V3 (updated)
│   ├── utils/                           # FROM V3 (updated)
│   └── index.ts                        # UPDATED: Uses factory
│
├── tests/
│   ├── unit/
│   │   ├── factory/                    # NEW
│   │   │   ├── BrainFactory.test.ts
│   │   │   ├── AgentFactory.test.ts
│   │   │   ├── ClusterFactory.test.ts
│   │   │   └── ArchitectureFactory.test.ts
│   │   └── coordination/               # FROM V3
│   └── integration/                    # FROM V3
│
├── docs/
│   ├── V4_BOILERPLATE_BUILD_PLAN.md   # This file
│   ├── ARCHITECTURE_REFERENCE.md       # How to create custom architectures
│   └── MIGRATION_V3_V4.md
│
└── examples/
    ├── minimal/                        # Minimal 2-agent config
    ├── spider/                         # Spider 1-brain reference
    ├── shark/                          # Shark 3-brain reference
    ├── hydra/                          # Hydra 5-brain reference
    └── kraken/                         # Kraken sub-orchestrator reference
```

---

## 3. Factory System Design

### 3.1 Factory Types (`factory/types.ts`)

```typescript
// ============================================================
// BRAIN TYPES
// ============================================================

export type BrainType = 'single' | 'dual' | 'trio' | 'custom';

export interface BrainConfig {
  type: BrainType;
  name: string;
  description?: string;
}

// Single orchestrator (Spider model: 1 architect)
export interface SingleBrainConfig extends BrainConfig {
  type: 'single';
  orchestrator: string;  // Agent ID
}

// Dual parallel orchestrators (2 primary agents, same level, different concerns)
export interface DualBrainConfig extends BrainConfig {
  type: 'dual';
  orchestrators: {
    [key: string]: string;  // orchestrator ID → agent ID
  };
  // Each orchestrator owns a distinct workflow domain
  workflows: {
    [orchestratorId: string]: OrchestratorWorkflow;
  };
  // How orchestrators sync: 'shared-state' | 'direct' | 'none'
  syncMode: 'shared-state' | 'direct' | 'none';
}

// Trio parallel orchestrators (3 primary agents, same level, different concerns)
export interface TrioBrainConfig extends BrainConfig {
  type: 'trio';
  orchestrators: {
    [key: string]: string;  // orchestrator ID → agent ID
  };
  // Each orchestrator owns a distinct workflow domain
  workflows: {
    [orchestratorId: string]: OrchestratorWorkflow;
  };
  syncMode: 'shared-state' | 'direct' | 'none';
}

// Orchestrator workflow definition
export interface OrchestratorWorkflow {
  name: string;                    // e.g., "The Planner", "The Executor", "The Guardian"
  description: string;             // What this orchestrator does
  phase?: string;                  // Optional: which phase(s) this orchestrator is active
  owns: string[];                  // What this orchestrator owns: ['planning', 'delegation', 'qa-gates']
  delegatesTo: string[];           // Which agent pools this orchestrator can delegate to
  readOnly?: string[];             // What this orchestrator observes but doesn't control
  gates?: string[];               // QA gates this orchestrator enforces
}

// ============================================================
// AGENT TYPES
// ============================================================

export interface AgentDefinition {
  id: string;
  name: string;
  mode: string;
  description: string;
  cluster?: string;
  capabilities: string[];
  allowedTools: string[];
  maxConcurrentTasks: number;
  prompt?: string;        // System prompt
  model?: string;         // Override default model
  temperature?: number;
  brain?: string;         // Which brain owns this agent
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

// ============================================================
// CLUSTER TYPES
// ============================================================

export interface ClusterConfig {
  id: string;
  name: string;
  description?: string;
  agents: string[];
  subOrchestrator?: string;     // Which brain controls this cluster
  intraClusterDelegation: boolean;
  interClusterDelegation: boolean;
  sharedContext: boolean;
  parentCluster?: string;       // For nested clusters
}

// ============================================================
// ARCHITECTURE TYPES
// ============================================================

export interface ArchitectureConfig {
  name: string;
  version: string;
  description?: string;
  
  // Brain configuration
  brain: SingleBrainConfig | TripleBrainConfig | PentaBrainConfig | BrainConfig;
  
  // Cluster configuration
  clusters: ClusterConfig[];
  
  // Agent definitions (can reference templates)
  agents: Record<string, AgentDefinition | string>;  // string = template reference
  
  // Delegation rules
  delegation?: {
    allowCrossCluster?: boolean;
    requireGateApproval?: boolean;
    maxHops?: number;
  };
  
  // Optional hooks override
  hooks?: Record<string, unknown>;
  
  // Metadata
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
  };
  coordination: {
    registry: AgentRegistry;
    delegation: DelegationEngine;
    stateMachine: StateMachine;
  };
}
```

### 3.2 AgentFactory (`factory/AgentFactory.ts`)

```typescript
import type { 
  AgentDefinition, 
  AgentTemplate, 
  AgentOverride,
  ArchitectureConfig 
} from './types.js';

export interface AgentFactory {
  // Create agent from scratch
  createAgent(id: string, config: Partial<AgentDefinition>): AgentDefinition;
  
  // Create from template with optional overrides
  createFromTemplate(
    templateId: string, 
    agentId: string, 
    overrides?: AgentOverride
  ): AgentDefinition;
  
  // Extend existing agent with overrides
  extend(agent: AgentDefinition, overrides: AgentOverride): AgentDefinition;
  
  // Create multiple agents from architecture config
  createAgents(
    agents: Record<string, AgentDefinition | string>,
    templates: Map<string, AgentTemplate>
  ): Map<string, AgentDefinition>;
  
  // Validate agent configuration
  validate(agent: AgentDefinition): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function createAgentFactory(): AgentFactory {
  const templates = new Map<string, AgentTemplate>();
  
  // Built-in templates
  const builtInTemplates: AgentTemplate[] = [
    architectTemplate,
    coderTemplate,
    reviewerTemplate,
    testEngineerTemplate,
    smeTemplate,
    explorerTemplate,
    criticTemplate,
    docsTemplate,
    designerTemplate,
  ];
  
  for (const t of builtInTemplates) {
    templates.set(t.id, t);
  }
  
  return {
    createAgent(id, config) {
      return {
        id,
        name: config.name || id,
        mode: config.mode || 'subagent',
        description: config.description || `${id} agent`,
        capabilities: config.capabilities || [],
        allowedTools: config.allowedTools || ['*'],
        maxConcurrentTasks: config.maxConcurrentTasks || 1,
        ...config,
      };
    },
    
    createFromTemplate(templateId, agentId, overrides) {
      const template = templates.get(templateId);
      if (!template) {
        throw new Error(`Unknown template: ${templateId}`);
      }
      
      return this.createAgent(agentId, {
        ...template,
        id: agentId,
        name: overrides?.prompt ? agentId : templateId,
        ...overrides,
        tools: overrides?.tools || template.tools,
      });
    },
    
    extend(agent, overrides) {
      return {
        ...agent,
        ...overrides,
        tools: overrides?.tools 
          ? [...new Set([...agent.allowedTools, ...overrides.tools])]
          : agent.allowedTools,
      };
    },
    
    createAgents(agents, templateMap) {
      const result = new Map<string, AgentDefinition>();
      
      for (const [id, config] of Object.entries(agents)) {
        if (typeof config === 'string') {
          // Template reference
          const template = templateMap.get(config);
          if (!template) {
            throw new Error(`Unknown template: ${config}`);
          }
          result.set(id, this.createFromTemplate(config, id));
        } else {
          // Full definition
          result.set(id, this.createAgent(id, config));
        }
      }
      
      return result;
    },
    
    validate(agent) {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (!agent.id) errors.push('Agent must have an id');
      if (!agent.mode) errors.push('Agent must have a mode');
      if (!agent.allowedTools?.length) {
        warnings.push('Agent has no tools - will have no capabilities');
      }
      
      return { valid: errors.length === 0, errors, warnings };
    },
  };
}

// ============================================================
// TEMPLATES (can be imported from factory/templates/agent/)
// ============================================================

export const architectTemplate: AgentTemplate = {
  id: 'architect',
  description: 'Primary orchestrator - owns the plan, delegates all work',
  tools: ['checkpoint', 'save_plan', 'evidence_check', 'delegate_task', 'swarm_status', 'phase_complete'],
  capabilities: ['planning', 'coordination', 'delegation', 'review'],
  prompt: `You are the Architect - the control brain of the agent system.

## Your Role
- Own the project plan and make all delegation decisions
- Synthesize inputs from other agents
- Handle failures and escalations
- Maintain project context

## Core Principles
1. **Quality over speed** - Never skip QA gates
2. **One task at a time** - Serial execution prevents chaos
3. **Every task gets verified** - Before the next starts

## Delegation Rules
- Delegate to @coder for implementation
- Delegate to @reviewer for verification
- Delegate to @test_engineer for test generation
- Delegate to @explorer for context gathering
- Delegate to @sme for domain expertise
- NEVER let an agent approve its own output

Start by understanding the user's request. If unclear, ask clarifying questions.`,
  defaultTemperature: 0.1,
};

export const coderTemplate: AgentTemplate = {
  id: 'coder',
  description: 'Implements tasks one at a time, no batching',
  tools: ['write', 'edit', 'patch', 'create_file', 'insert', 'replace', 'apply_patch', 'diff', 'lint'],
  capabilities: ['coding', 'refactoring', 'debugging'],
  prompt: `You are the Coder - you implement tasks exactly as specified.

## Your Role
- Receive specific, bounded tasks from the architect
- Implement one task at a time
- Never batch multiple tasks
- Never skip QA gates

## Constraints
- Do NOT review your own code - that is the reviewer's job
- Do NOT write tests - that is the test engineer's job
- If you encounter issues, escalate to the architect

## Output
After completing a task, report what was done and wait for the next delegation.`,
  defaultTemperature: 0.2,
};

export const reviewerTemplate: AgentTemplate = {
  id: 'reviewer',
  description: 'Correctness and security review',
  tools: ['evidence_check', 'retrieve_summary', 'knowledge_query', 'lint', 'diff', 'secretscan', 'sast_scan'],
  capabilities: ['review', 'security', 'quality'],
  prompt: `You are the Reviewer - you verify correctness and security.

## Your Role
- Review code for correctness
- Check for security vulnerabilities
- Verify evidence completeness
- NEVER approve your own review

## Review Criteria
1. Does the code do what the task asked?
2. Are there security concerns?
3. Is the code readable and maintainable?
4. Are there missing error handlers?

## Constraints
- Be thorough but constructive
- If you find issues, report them clearly
- If code is good, say so explicitly`,
  defaultTemperature: 0.1,
};

// ... (other templates)
```

### 3.3 BrainFactory (`factory/BrainFactory.ts`)

```typescript
import type { 
  BrainType, 
  BrainConfig,
  SingleBrainConfig,
  TripleBrainConfig,
  PentaBrainConfig,
  AgentDefinition,
} from './types.js';

export interface BrainFactory {
  create(config: BrainConfig): BrainInstance;
  validate(config: BrainConfig): ValidationResult;
}

export interface BrainInstance {
  type: BrainType;
  primary: string;
  all: string[];
  hierarchy: BrainHierarchy;
  workflows?: {
    [orchestratorId: string]: OrchestratorWorkflow;
  };
  syncMode?: 'shared-state' | 'direct' | 'none';
}

export interface BrainHierarchy {
  level: number;
  children: BrainInstance[];
  parent?: string;
}

export function createBrainFactory(): BrainFactory {
  return {
    create(config) {
      switch (config.type) {
        case 'single':
          return createSingleBrain(config as SingleBrainConfig);
        case 'triple':
          return createTripleBrain(config as TripleBrainConfig);
        case 'penta':
          return createPentaBrain(config as PentaBrainConfig);
        default:
          throw new Error(`Unknown brain type: ${config.type}`);
      }
    },
    
    validate(config) {
      const errors: string[] = [];
      
      if (!config.name) errors.push('Brain must have a name');
      if (!['single', 'triple', 'penta', 'custom'].includes(config.type)) {
        errors.push(`Invalid brain type: ${config.type}`);
      }
      
      return { valid: errors.length === 0, errors, warnings: [] };
    },
  };
}

function createSingleBrain(config: SingleBrainConfig): BrainInstance {
  return {
    type: 'single',
    primary: config.orchestrator,
    all: [config.orchestrator],
    hierarchy: {
      level: 0,
      children: [],
    },
  };
}

function createDualBrain(config: DualBrainConfig): BrainInstance {
  const orchestratorIds = Object.values(config.orchestrators);
  
  return {
    type: 'dual',
    primary: orchestratorIds[0],  // First one is primary for fallback
    all: orchestratorIds,
    hierarchy: {
      level: 0,
      children: orchestratorIds.map(id => ({
        type: 'custom' as BrainType,
        primary: id,
        all: [id],
        hierarchy: { level: 1, children: [] },
      })),
    },
    workflows: config.workflows,
    syncMode: config.syncMode,
  };
}

function createTrioBrain(config: TrioBrainConfig): BrainInstance {
  const orchestratorIds = Object.values(config.orchestrators);
  
  return {
    type: 'trio',
    primary: orchestratorIds[0],  // First one is primary for fallback
    all: orchestratorIds,
    hierarchy: {
      level: 0,
      children: orchestratorIds.map(id => ({
        type: 'custom' as BrainType,
        primary: id,
        all: [id],
        hierarchy: { level: 1, children: [] },
      })),
    },
    workflows: config.workflows,
    syncMode: config.syncMode,
  };
}
```

### 3.4 ClusterFactory (`factory/ClusterFactory.ts`)

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

export function createClusterFactory(): ClusterFactory {
  return {
    create(config, agents) {
      const clusterAgents = config.agents
        .map(id => agents.get(id))
        .filter((a): a is AgentDefinition => a !== undefined);
      
      const subOrchestrator = config.subOrchestrator 
        ? agents.get(config.subOrchestrator)
        : undefined;
      
      return {
        config,
        agents: clusterAgents,
        subOrchestrator,
      };
    },
    
    createHierarchy(configs, agents) {
      return configs.map(config => this.create(config, agents));
    },
    
    validate(config, agentIds) {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (!config.id) errors.push('Cluster must have an id');
      if (!config.agents.length) {
        warnings.push(`Cluster ${config.id} has no agents`);
      }
      
      for (const agentId of config.agents) {
        if (!agentIds.includes(agentId)) {
          errors.push(`Cluster ${config.id} references unknown agent: ${agentId}`);
        }
      }
      
      if (config.subOrchestrator && !agentIds.includes(config.subOrchestrator)) {
        errors.push(`Cluster ${config.id} subOrchestrator ${config.subOrchestrator} not found`);
      }
      
      return { valid: errors.length === 0, errors, warnings };
    },
  };
}
```

### 3.5 ArchitectureFactory (`factory/ArchitectureFactory.ts`)

```typescript
import type { ArchitectureConfig, ArchitectureInstance } from './types.js';
import { createAgentFactory, type AgentTemplate } from './AgentFactory.js';
import { createBrainFactory } from './BrainFactory.js';
import { createClusterFactory } from './ClusterFactory.js';
import { createAgentRegistry } from '../coordination/registry.js';
import { createDelegationEngine } from '../coordination/delegation.js';
import { createStateMachine } from '../coordination/state-machine.js';

export interface ArchitectureFactory {
  create(config: ArchitectureConfig): ArchitectureInstance;
  validate(config: ArchitectureConfig): ValidationResult;
  getTemplate(templateId: string): AgentTemplate | undefined;
  listTemplates(): AgentTemplate[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function createArchitectureFactory(): ArchitectureFactory {
  const agentFactory = createAgentFactory();
  const brainFactory = createBrainFactory();
  const clusterFactory = createClusterFactory();
  
  return {
    create(config) {
      // 1. Validate first
      const validation = this.validate(config);
      if (!validation.valid) {
        throw new Error(`Invalid architecture: ${validation.errors.join(', ')}`);
      }
      
      // 2. Create agents
      const templates = new Map<string, AgentTemplate>();
      for (const t of getBuiltInTemplates()) {
        templates.set(t.id, t);
      }
      const agents = agentFactory.createAgents(config.agents, templates);
      
      // 3. Create brains
      const brain = brainFactory.create(config.brain);
      
      // 4. Create clusters
      const clusters = clusterFactory.createHierarchy(config.clusters, agents);
      
      // 5. Create coordination layer
      const agentMap = Object.fromEntries(agents);
      const registry = createAgentRegistry(agentMap);
      const delegation = createDelegationEngine(registry, config.delegation);
      const stateMachine = createStateMachine();
      
      return {
        config,
        agents,
        clusters: new Map(clusters.map(c => [c.config.id, c.config])),
        brains: {
          type: brain.type,
          primary: brain.primary,
          all: brain.all,
        },
        coordination: {
          registry,
          delegation,
          stateMachine,
        },
      };
    },
    
    validate(config) {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (!config.name) errors.push('Architecture must have a name');
      if (!config.brain) errors.push('Architecture must have a brain config');
      if (!config.agents || !Object.keys(config.agents).length) {
        errors.push('Architecture must have at least one agent');
      }
      
      // Validate brain
      if (config.brain) {
        const brainValidation = brainFactory.validate(config.brain);
        errors.push(...brainValidation.errors);
        warnings.push(...brainValidation.warnings);
      }
      
      // Validate clusters
      const agentIds = Object.keys(config.agents);
      for (const cluster of config.clusters || []) {
        const clusterValidation = clusterFactory.validate(cluster, agentIds);
        errors.push(...clusterValidation.errors);
        warnings.push(...clusterValidation.warnings);
      }
      
      return { valid: errors.length === 0, errors, warnings };
    },
    
    getTemplate(id) {
      return getBuiltInTemplates().find(t => t.id === id);
    },
    
    listTemplates() {
      return getBuiltInTemplates();
    },
  };
}

function getBuiltInTemplates(): AgentTemplate[] {
  return [
    // Imported from AgentFactory
  ];
}
```

---

## 4. Pre-Built Architecture Configs

### 4.1 Spider (1-Brain)

```typescript
// config/templates/spider.ts
import { createArchitectureFactory } from '../../factory/index.js';
import { architectTemplate, coderTemplate, reviewerTemplate, 
         testEngineerTemplate, smeTemplate, explorerTemplate, 
         criticTemplate, docsTemplate } from '../../factory/templates/agent/index.js';

const factory = createArchitectureFactory();

export const spiderArchitecture = factory.create({
  name: 'spider',
  version: '1.0.0',
  description: 'Single-brain hub-and-spoke architecture (Spider Agent)',
  
  brain: {
    type: 'single',
    name: 'spider-brain',
    orchestrator: 'architect',
  },
  
  clusters: [
    {
      id: 'execution',
      name: 'Execution Cluster',
      agents: ['coder'],
      intraClusterDelegation: false,
      interClusterDelegation: false,
      sharedContext: true,
    },
    {
      id: 'qa',
      name: 'QA Cluster',
      agents: ['reviewer', 'test-engineer'],
      intraClusterDelegation: false,
      interClusterDelegation: true,
      sharedContext: true,
    },
    {
      id: 'research',
      name: 'Research Cluster',
      agents: ['explorer', 'sme'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
      sharedContext: true,
    },
  ],
  
  agents: {
    // Orchestrator
    architect: architectTemplate,
    
    // Execution cluster
    coder: coderTemplate,
    
    // QA cluster
    reviewer: reviewerTemplate,
    'test-engineer': testEngineerTemplate,
    
    // Research cluster
    explorer: explorerTemplate,
    sme: smeTemplate,
    
    // Advisory
    critic: criticTemplate,
    docs: docsTemplate,
  },
  
  delegation: {
    allowCrossCluster: true,
    requireGateApproval: true,
    maxHops: 3,
  },
});
```

### 4.2 Shark (Dual Parallel Orchestrators)

The Shark architecture uses 2 parallel orchestrators — The Architect (long-term planning, phase sequencing, architecture) and The Executor (execution tracking, QA gates, completion verification). They operate concurrently on different aspects of the workflow.

```typescript
// config/templates/shark.ts
export const sharkArchitecture = factory.create({
  name: 'shark',
  version: '1.0.0',
  description: 'Dual parallel orchestrator: Architect (planning) + Executor (execution)',
  
  brain: {
    type: 'dual',
    name: 'shark-brain',
    syncMode: 'shared-state',  // Both read/write to shared plan state
    orchestrators: {
      'architect': 'architect',    // The Planner — owns planning, phase sequencing
      'executor': 'executor',     // The Executor — owns execution tracking, QA gates
    },
    workflows: {
      'architect': {
        name: 'The Architect',
        description: 'Long-term planning, architecture, phase sequencing',
        owns: ['planning', 'phase-sequencing', 'architecture'],
        delegatesTo: ['research-pool', 'design-pool'],
        readOnly: ['execution-state'],
        gates: ['plan-gate'],  // Plan must be approved before architect advances phases
      },
      'executor': {
        name: 'The Executor',
        description: 'Execution tracking, QA gate enforcement, completion verification',
        owns: ['execution', 'qa-gates', 'completion'],
        delegatesTo: ['coder', 'test-engineer', 'reviewer'],
        readOnly: ['plan-state'],  // Reads plan, but doesn't modify it
        gates: ['qa-gate', 'test-gate', 'review-gate'],
      },
    },
  },
  
  clusters: [
    {
      id: 'research',
      name: 'Research Pool',
      agents: ['explorer', 'sme', 'analyst'],
      intraClusterDelegation: true,
      interClusterDelegation: false,
      sharedContext: true,
    },
    {
      id: 'execution',
      name: 'Execution Pool',
      agents: ['coder', 'test-engineer'],
      intraClusterDelegation: true,
      interClusterDelegation: false,
      sharedContext: true,
    },
    {
      id: 'qa',
      name: 'QA Pool',
      agents: ['reviewer', 'critic'],
      intraClusterDelegation: false,
      interClusterDelegation: true,
      sharedContext: true,
    },
  ],
  
  agents: {
    // Parallel orchestrators
    architect: {
      ...architectTemplate,
      id: 'architect',
      prompt: `You are The Architect — the strategic planner of the Shark system.
      
## Your Role
- Own long-term planning and phase sequencing
- Make architecture decisions
- Sequence and scope phase work
- Delegate research tasks to research-pool

## Parallel Execution Model
You work IN PARALLEL with The Executor. While you focus on PLANNING and ARCHITECTURE, The Executor handles EXECUTION and QA in parallel.
- You delegate to research-pool for context gathering
- You read execution state to understand what's happening
- You do NOT delegate to coder/reviewer — The Executor owns that

## Your Focus
- "What should we build next?"
- "Is the architecture sound?"
- "What are the risks?"

Communicate with The Executor through shared plan state.`,
      maxConcurrentTasks: 1,
    },
    executor: {
      id: 'executor',
      name: 'The Executor',
      mode: 'architect',
      description: 'Execution tracking, QA gate enforcement',
      capabilities: ['execution', 'qa', 'delegation'],
      allowedTools: ['*'],
      maxConcurrentTasks: 2,
      prompt: `You are The Executor — the execution overseer of the Shark system.

## Your Role
- Track execution progress
- Enforce QA gates
- Verify completion
- Delegate to execution-pool and qa-pool

## Parallel Execution Model
You work IN PARALLEL with The Architect. While The Architect focuses on PLANNING and ARCHITECTURE, you handle EXECUTION and QA in parallel.
- You read the shared plan to know what to execute
- You delegate to coder for implementation
- You delegate to reviewer/test-engineer for QA
- You do NOT plan or sequence phases — The Architect owns that

## Your Focus
- "What needs to be built right now?"
- "Did the last task pass QA?"
- "Is execution on track?"

Communicate with The Architect through shared plan state.`,
    },
    
    // Research pool (delegated to by architect)
    explorer: explorerTemplate,
    sme: smeTemplate,
    analyst: { /* custom analyst */ },
    
    // Execution pool (delegated to by executor)
    coder: coderTemplate,
    'test-engineer': testEngineerTemplate,
    
    // QA pool (delegated to by executor)
    reviewer: reviewerTemplate,
    critic: criticTemplate,
  },
  
  delegation: {
    allowCrossCluster: true,
    requireGateApproval: true,
    maxHops: 2,
  },
});
```

### 4.3 Trio (3 Parallel Orchestrators)

The Trio architecture adds a third orchestrator — The Guardian (context, knowledge, quality assurance) — to work alongside The Architect and The Executor.

```typescript
// config/templates/trio.ts
export const trioArchitecture = factory.create({
  name: 'trio',
  version: '1.0.0',
  description: 'Trio parallel orchestrators: Architect + Executor + Guardian',
  
  brain: {
    type: 'trio',
    name: 'trio-brain',
    syncMode: 'shared-state',
    orchestrators: {
      'architect': 'architect',     // The Planner — planning, architecture, phases
      'executor': 'executor',      // The Executor — execution, QA gates
      'guardian': 'guardian',      // The Guardian — context, knowledge, quality
    },
    workflows: {
      'architect': {
        name: 'The Architect',
        description: 'Long-term planning, architecture, phase sequencing',
        owns: ['planning', 'phase-sequencing', 'architecture'],
        delegatesTo: ['research-pool'],
        readOnly: ['execution-state', 'quality-state'],
        gates: ['plan-gate'],
      },
      'executor': {
        name: 'The Executor',
        description: 'Execution tracking, QA gate enforcement',
        owns: ['execution', 'qa-gates', 'completion'],
        delegatesTo: ['execution-pool', 'qa-pool'],
        readOnly: ['plan-state', 'quality-state'],
        gates: ['qa-gate', 'test-gate', 'review-gate'],
      },
      'guardian': {
        name: 'The Guardian',
        description: 'Context preservation, knowledge management, quality oversight',
        owns: ['context', 'knowledge', 'quality'],
        delegatesTo: ['analyst', 'docs'],
        readOnly: ['plan-state', 'execution-state'],
        gates: ['context-gate', 'knowledge-gate'],
      },
    },
  },
  
  clusters: [
    { id: 'research', name: 'Research Pool', agents: ['explorer', 'sme', 'analyst'], ... },
    { id: 'execution', name: 'Execution Pool', agents: ['coder', 'test-engineer'], ... },
    { id: 'qa', name: 'QA Pool', agents: ['reviewer', 'critic'], ... },
    { id: 'knowledge', name: 'Knowledge Pool', agents: ['analyst', 'docs'], ... },
  ],
  
  agents: {
    architect: { /* The Planner */ },
    executor: { /* The Executor */ },
    guardian: {
      id: 'guardian',
      name: 'The Guardian',
      mode: 'architect',
      description: 'Context preservation and knowledge management',
      capabilities: ['context', 'knowledge', 'quality'],
      allowedTools: ['*'],
      maxConcurrentTasks: 2,
      prompt: `You are The Guardian — the context and knowledge keeper of the Trio system.

## Your Role
- Preserve context across sessions
- Manage knowledge base
- Oversee quality standards
- Maintain technical debt tracking

## Parallel Execution Model
You work IN PARALLEL with The Architect and The Executor.
- The Architect focuses on WHAT to build (planning)
- The Executor focuses on BUILDING it (execution)
- You focus on KNOWLEDGE and CONTEXT

## Your Focus
- "What context is needed?"
- "What was learned that should be preserved?"
- "Is quality being maintained?"
- "What technical debt is accumulating?"`,
    },
    // ... other agents
  },
});
```

---

## 5. Plugin Integration

### 5.1 Updated Entry Point (`src/index.ts`)

```typescript
import type { Plugin, Tool, Agent } from '@opencode-ai/plugin';
import { loadConfig } from './config/loader.js';
import { createArchitectureFactory } from './factory/index.js';
import { spiderConfig } from './config/templates/spider.js';
import { sharkConfig } from './config/templates/shark.js';
import { hydraConfig } from './config/templates/hydra.js';
import { krakenConfig } from './config/templates/kraken.js';

export interface V4PluginOptions {
  architecture?: 'spider' | 'shark' | 'hydra' | 'kraken' | 'custom';
  configPath?: string;
  coordination?: {
    enabled?: boolean;
    gates?: GateConfig;
    guardrails?: GuardrailConfig;
  };
}

export default async function createPlugin(options: V4PluginOptions = {}): Promise<Plugin> {
  // 1. Load architecture
  const architecture = options.architecture || 'spider';
  let architectureInstance;
  
  if (architecture === 'custom' && options.configPath) {
    const factory = createArchitectureFactory();
    const config = await loadConfig(options.configPath);
    architectureInstance = factory.create(config);
  } else {
    // Load pre-built architecture
    const configs = { spider: spiderConfig, shark: sharkConfig, hydra: hydraConfig, kraken: krakenConfig };
    const factory = createArchitectureFactory();
    architectureInstance = factory.create(configs[architecture as keyof typeof configs]);
  }
  
  // 2. Create coordination layer
  const coordination = options.coordination?.enabled !== false
    ? createCoordinationLayer({
        enabled: true,
        swarmId: architectureInstance.config.name,
        swarmName: architectureInstance.config.name,
        agents: Object.fromEntries(architectureInstance.agents),
        clusters: Object.fromEntries(architectureInstance.clusters),
        gates: options.coordination?.gates,
        guardrails: options.coordination?.guardrails,
      })
    : null;
  
  // 3. Build agents for OpenCode
  const agents = buildAgents(architectureInstance);
  
  // 4. Build tools
  const tools = buildTools(architectureInstance, coordination);
  
  // 5. Build hooks
  const hooks = buildHooks(architectureInstance, coordination);
  
  // 6. Return plugin manifest
  return {
    name: `agent-${architecture}`,
    agent: agents,
    tool: tools,
    hooks,
    config: (opencodeConfig) => {
      Object.assign(opencodeConfig.agent, agents);
      // Register commands
    },
  };
}

function buildAgents(instance: ArchitectureInstance): Record<string, Agent> {
  const agents: Record<string, Agent> = {};
  
  for (const [id, agent] of instance.agents) {
    agents[id] = {
      name: agent.name,
      description: agent.description,
      tools: agent.allowedTools,
    };
  }
  
  return agents;
}

function buildTools(instance: ArchitectureInstance, coordination: any): Record<string, Tool> {
  return {
    ...coordination?.tools,
  };
}

function buildHooks(instance: ArchitectureInstance, coordination: any) {
  return {
    'tool.execute.before': coordination?.hooks['tool.execute.before'],
    'tool.execute.after': coordination?.hooks['tool.execute.after'],
    'chat.message': coordination?.hooks['chat.message'],
  };
}
```

---

## 6. Implementation Phases

### Phase V4-1: Factory Core (Foundation)

**Goal**: Create the factory system that can produce agents, brains, clusters

**Files to create**:

| File | Purpose |
|------|---------|
| `factory/types.ts` | All factory type definitions (single/dual/trio) |
| `factory/AgentFactory.ts` | Agent creation, extension, validation |
| `factory/BrainFactory.ts` | Brain creation (single/dual/trio) |
| `factory/ClusterFactory.ts` | Cluster creation, hierarchy |
| `factory/ArchitectureFactory.ts` | Full architecture assembly |
| `factory/index.ts` | Re-exports |

### Phase V4-2: Agent Templates

**Goal**: Define all built-in agent templates

**Files to create**:
```
factory/templates/agent/
├── architect.ts           # Base architect template
├── coder.ts
├── reviewer.ts
├── test-engineer.ts
├── sme.ts
├── explorer.ts
├── critic.ts
├── docs.ts
├── designer.ts
└── index.ts
```

### Phase V4-3: Pre-Built Architectures

**Goal**: Create spider, shark, trio configs

**Files to create**:
```
config/templates/
├── spider.ts              # 1-brain (single orchestrator)
├── shark.ts               # 2 parallel orchestrators (dual)
├── trio.ts                # 3 parallel orchestrators
└── index.ts
```

### Phase V4-4: Config Loader

**Goal**: Support loading custom architectures from JSON/TS files

**Files to create**:
| File | Purpose |
|------|---------|
| `config/loader.ts` | Load architecture from file |
| `config/schema.ts` | Extended schema with architecture types |

### Phase V4-5: Plugin Integration

**Goal**: Wire factory into V3 coordination + plugin entry point

**Files to modify**:
| File | Change |
|------|--------|
| `src/index.ts` | Use architecture factory |
| `src/coordination/index.ts` | Accept factory-created agents |

### Phase V4-6: Testing

**Goal**: Comprehensive tests for factory system

**Files to create**:
```
tests/unit/factory/
├── AgentFactory.test.ts
├── BrainFactory.test.ts
├── ClusterFactory.test.ts
└── ArchitectureFactory.test.ts

tests/integration/
└── full-architecture.test.ts
```

---

## 7. File Count Summary

| Category | New Files | Modified |
|----------|-----------|----------|
| Factory Core | 6 | 0 |
| Agent Templates | 10 | 0 |
| Architecture Configs | 4 | 0 |
| Config Loader | 2 | 0 |
| Plugin Integration | 0 | 2 |
| Tests | 5 | 0 |
| Documentation | 2 | 1 |
| **TOTAL** | **29** | **3** |

---

## 8. Key Design Decisions

### A. Why Templates are TypeScript Files

Templates contain full prompts + tool definitions. This is too complex for JSON:

```typescript
// Templates are TypeScript for:
export const architectTemplate: AgentTemplate = {
  prompt: `You are the Architect...
  ## Delegation Rules
  - Delegate to @coder...
  - NEVER let an agent approve its own output
  ${getDynamicContent()}`,
  tools: [...],
};
```

JSON can't express this. Config files reference templates by ID.

### B. Why BrainFactory Separates Types

Each brain type has different constraints:

```typescript
SingleBrainConfig: { orchestrator: string }
TripleBrainConfig: { orchestrators: { strategic?, tactical?, execution? }, primary }
PentaBrainConfig: { orchestrators: { command?, strategic?, tactical?, operational?, execution? }, primary }
```

Validation is type-specific. Keeping them separate makes the factory predictable.

### C. Why ClusterFactory Validates Against Agent IDs

Clusters reference agents by ID. If an agent doesn't exist, we want to fail fast:

```typescript
// Cluster references 'super-coder' but it doesn't exist
validate: (cluster, ['coder', 'reviewer']) => {
  errors: ['Cluster execution references unknown agent: super-coder']
}
```

### D. ArchitectureFactory Returns Coordination Layer

The architecture creates agents, but agents need V3's coordination:

```typescript
create(config): ArchitectureInstance {
  // ... create agents, brains, clusters
  
  return {
    agents,
    clusters,
    brains,
    coordination: {
      registry: createAgentRegistry(agentMap),
      delegation: createDelegationEngine(registry),
      stateMachine: createStateMachine(),
    },
  };
}
```

This way the plugin entry point gets everything it needs.

---

## 9. Migration Path

### V3 → V4

```bash
# 1. Copy v4 template
cp -r plugin-agent-prototype-v4 plugin-agent-prototype-v4-migration

# 2. Install dependencies
cd plugin-agent-prototype-v4-migration
npm install

# 3. Choose an architecture
# Edit src/config/templates/your-arch.ts

# 4. Or create custom
# Edit your-architecture.config.ts

# 5. Update index.ts to use your architecture
export default createPlugin({ architecture: 'your-arch' });

# 6. Build and test
npm run build
npm test
```

### Creating a Custom Architecture

```typescript
// my-custom.config.ts
import { createArchitectureFactory } from './factory/index.js';
import { architectTemplate, coderTemplate } from './factory/templates/agent/index.js';

const factory = createArchitectureFactory();

export const myCustom = factory.create({
  name: 'my-custom',
  version: '1.0.0',
  brain: {
    type: 'single',
    name: 'my-brain',
    orchestrator: 'architect',
  },
  clusters: [
    { id: 'exec', name: 'Exec', agents: ['coder'], intraClusterDelegation: false, interClusterDelegation: false, sharedContext: true },
  ],
  agents: {
    architect: architectTemplate,
    coder: coderTemplate,
  },
});
```

---

## 10. Acceptance Criteria

### Must Have

- [ ] AgentFactory.createFromTemplate() works
- [ ] AgentFactory.extend() merges tools/prompts correctly
- [ ] BrainFactory creates single/triple/penta brains
- [ ] ClusterFactory validates agent references
- [ ] ArchitectureFactory assembles full architecture
- [ ] Spider 1-brain config works
- [ ] Shark 3-brain config works
- [ ] Hydra 5-brain config works
- [ ] Kraken sub-orchestrator config works
- [ ] V3 coordination layer receives factory-created agents
- [ ] TypeScript compilation: 0 errors
- [ ] Tests: all pass

### Should Have

- [ ] Custom architecture loading from JSON
- [ ] Architecture validation errors are clear
- [ ] Documentation for creating custom architectures
- [ ] Migration guide from V3

---

## 11. Reference: Agent Template Schema

```typescript
interface AgentTemplate {
  id: string;                    // Unique identifier (e.g., 'architect', 'coder')
  description: string;           // Human-readable description
  tools: string[];               // Tool permissions
  capabilities: string[];        // Agent capabilities
  prompt: string;                // System prompt (can include dynamic content)
  defaultModel?: string;         // Default model override
  defaultTemperature?: number;    // Default temperature override
}

interface AgentDefinition {
  id: string;                    // Unique identifier in this architecture
  name: string;                  // Display name
  mode: string;                  // Agent mode (architect, coder, etc.)
  description: string;           // Human-readable description
  cluster?: string;               // Which cluster this agent belongs to
  capabilities: string[];         // Agent capabilities
  allowedTools: string[];        // Tool permissions
  maxConcurrentTasks: number;    // Max concurrent tasks
  prompt?: string;               // Override template prompt
  model?: string;                // Override default model
  temperature?: number;           // Override default temperature
  brain?: string;                 // Which brain owns this agent
}
```

---

## 12. Reference: Brain Type Constraints

| Type | Orchestrators | Description |
|------|--------------|-------------|
| single | 1 | Spider model — 1 architect, hub-and-spoke |
| dual | 2 | Shark model — Architect (planning) + Executor (execution), parallel |
| trio | 3 | Extended model — Architect + Executor + Guardian (context/knowledge) |
| custom | N | Any custom arrangement |

### Brain Hierarchy

```
single (level 0) — Spider
  └── architect (level 1) — owns everything, delegates to pools

dual (level 0) — Shark (PARALLEL)
  ├── architect (level 1) — owns planning, phase sequencing, architecture
  │   └── delegates to research-pool
  └── executor (level 1) — owns execution tracking, QA gates, completion
      └── delegates to execution-pool, qa-pool

trio (level 0) — Extended (PARALLEL)
  ├── architect (level 1) — owns planning, phase sequencing
  │   └── delegates to research-pool
  ├── executor (level 1) — owns execution, QA gates
  │   └── delegates to execution-pool, qa-pool
  └── guardian (level 1) — owns context, knowledge, quality
      └── delegates to knowledge-pool

PARALLEL SYNC MODEL:
  - shared-state: All orchestrators read/write to shared plan state
  - direct: Orchestrators communicate peer-to-peer
  - none: Orchestrators work independently, no sync
```

### Orchestrator Workflow Ownership

Each orchestrator in a parallel brain owns distinct concerns:

| Orchestrator | Owns | Delegates To | Reads (No Write) |
|-------------|------|-------------|------------------|
| **architect** | planning, phase-sequencing, architecture | research-pool | execution-state, quality-state |
| **executor** | execution, qa-gates, completion | execution-pool, qa-pool | plan-state, quality-state |
| **guardian** | context, knowledge, quality | knowledge-pool | plan-state, execution-state |

This model increases throughput by running planning and execution concurrently rather than sequentially.

---

**Plan Generated**: 2026-04-03
**Target Version**: plugin-agent-prototype-v4
**Based on**: V3 Agent Coordination + DeepSeek's Meta-Architecture + Spider/Shark/Hydra/Kraken patterns
