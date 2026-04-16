# V4 Boilerplate Architecture

## Overview

The v4 boilerplate is a factory-based architecture system for creating multi-agent plugins. It provides:

1. **ArchitectureFactory** — Orchestrates creation of agents, brains, clusters
2. **AgentFactory** — Creates agents from templates or overrides
3. **BrainFactory** — Creates brain instances with shared state
4. **ClusterFactory** — Creates cluster hierarchies
5. **StateStore** — Shared state with domain ownership
6. **BrainMessenger** — Inter-brain priority messaging
7. **Validator pipeline** — Config validation at startup

## Architecture Instance

`ArchitectureFactory.create(config)` returns an `ArchitectureInstance`:

```typescript
interface ArchitectureInstance {
  config: ArchitectureConfig;                    // Original config
  agents: Map<string, AgentDefinition>;         // Created agents
  clusters: Map<string, ClusterConfig>;        // Cluster configs
  brains: {
    type: 'single' | 'dual' | 'trio';
    primary: BrainInstance;
    all: BrainInstance[];
    workflows: Record<string, WorkflowConfig>;
    syncMode: 'shared-state' | 'message-passing';
  };
  coordination: {
    registry: AgentRegistry;      // Agent lookup interface
    delegation: DelegationEngine;  // Delegation + gate enforcement
    stateMachine: StateMachine;   // Task state machine
  };
  stateStore: StateStore;         // Shared state
  messenger: BrainMessenger;       // Priority messaging
}
```

## Config Structure

```typescript
interface ArchitectureConfig {
  name: string;
  version: string;
  description?: string;
  
  brain: BrainConfig;              // Single, dual, or trio
  clusters: ClusterConfig[];       // Cluster hierarchy
  agents: Record<string, AgentDefinition | string>;  // Agents or template refs
  
  delegation?: {
    allowCrossCluster?: boolean;
    requireGateApproval?: boolean;
    maxHops?: number;
  };
}
```

## Brain Types

### Single Brain
```typescript
{
  type: 'single',
  name: 'my-brain',
  orchestrator: 'orchestrator-agent-id',
}
```

### Dual Brain (Shark uses this)
```typescript
{
  type: 'dual',
  name: 'shark-brain',
  syncMode: 'shared-state',
  orchestrators: {
    architect: 'shark-architect',
    executor: 'shark-orchestrator',
  },
  workflows: {
    architect: {
      name: 'The Architect',
      description: 'Long-term planning',
      owns: ['plan-state', 'claims'],
      delegatesTo: ['research-pool'],
      gates: ['plan-gate'],
    },
    executor: {
      name: 'The Executor',
      description: 'Execution tracking',
      owns: ['execution-state', 'quality-state', 'workflow-state'],
      delegatesTo: ['execution-pool', 'qa-pool'],
      gates: ['qa-gate', 'test-gate', 'verify-gate'],
    },
  },
}
```

### Trio Brain
```typescript
{
  type: 'trio',
  name: 'trio-brain',
  syncMode: 'shared-state',
  orchestrators: {
    planner: 'planner-agent',
    executor: 'executor-agent',
    reviewer: 'reviewer-agent',
  },
  workflows: { /* ... */ },
}
```

## StateStore

Shared state with domain ownership. Each domain can only be WRITTEN by specific brains, but READ by all.

```typescript
const stateStore = createStateStore();

// Write (owner only)
stateStore.set('claims', claimsData, 'plan-state', 'shark-architect');

// Read (anyone)
const claims = stateStore.get('claims', 'plan-state');

// Watch for changes
const unsub = stateStore.watch('claims', (value, version) => {
  console.log(`Claims updated to version ${version}`);
});

// Snapshot + restore
const snap = stateStore.snapshot();
stateStore.restore(snap);
```

Domain ownership map:
```typescript
const DOMAIN_OWNERSHIP = {
  'plan-state': ['architect'],
  'execution-state': ['executor'],
  'quality-state': ['guardian', 'executor'],
};
```

## BrainMessenger

Priority-based inter-brain messaging with ack support:

```typescript
const messenger = createBrainMessenger();

// Send message
messenger.send({
  from: 'shark-architect',
  to: 'shark-orchestrator',
  type: 'handoff',
  priority: 'high',
  payload: { claims: [...], plan: '...' },
  requiresAck: true,
});

// Receive messages
const messages = messenger.receive('shark-orchestrator');

// Wait for ack
const acked = await messenger.waitForAck('msg_001', 5000);
```

Priority order: `critical > high > normal > low`

## Cluster Hierarchy

Clusters group agents and optionally have a sub-orchestrator:

```typescript
interface ClusterConfig {
  id: string;
  name: string;
  description?: string;
  agents: string[];           // Agent IDs in this cluster
  parentCluster?: string;     // Parent cluster ID
  subOrchestrator?: string;   // Optional sub-orchestrator agent
}
```

## Validator Pipeline

Validators run at factory creation time:

```typescript
const architectureValidators: Validator<ArchitectureConfig>[] = [
  validateRequiredFields,
  validateBrainReferences,
  validateAgentReferences,
  validateClusterIntegrity,
  validateToolPermissions,
  validateStateOwnership,
  validateWorkflowGates,
];
```

Validation errors throw exceptions — bad configs never produce a partial instance.

## Shark Integration Points

Shark uses the v4 boilerplate as:

1. **Agent creation** — Shark agents created via `AgentFactory.createFromTemplate()`
2. **State coordination** — `StateStore` for architect ↔ executor shared state
3. **Messaging** — `BrainMessenger` for urgent handoffs
4. **Cluster pools** — `ClusterFactory` for research/execution/qa pools
5. **Validation** — `architectureValidators` run on Shark's config at startup

What Shark adds on top:
- Guardian (not in boilerplate)
- WorkflowMachine (not in boilerplate)
- Claims system (not in boilerplate)
- Verification gate runners (not in boilerplate)
