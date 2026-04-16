# IMPLEMENTATION PLAN: plugin-agent-prototype-v3

**Integration of Agent Coordination Layer into plugin-agent-prototype**

---

## Overview

This plan outlines the creation of **v3** which integrates the generic agent coordination layer (per `AGENT_COORDINATION_LAYER.md`) into the existing plugin-agent-prototype-v2 scaffold.

**Goal**: Create a fully self-contained multi-agent plugin boilerplate that supports:
- Simple 5-agent architectures (backward compatible with v2)
- Complex multi-brain, multi-cluster architectures (Hydra: 5 brains + 13 agents)
- Formal task lifecycle management
- Delegation enforcement gates
- File-based persistence (plans, evidence, checkpoints)

---

## 1. Architecture Changes

### 1.1 Directory Structure (v3 Target)

```
plugin-agent-prototype-v3/
├── src/
│   ├── coordination/                    # NEW: Generic coordination layer
│   │   ├── index.ts                   # Main export (createCoordinationLayer)
│   │   ├── types.ts                   # Shared types (AgentDefinition, ClusterDefinition, etc.)
│   │   ├── utils.ts                   # randomId, helpers
│   │   ├── registry.ts                 # Agent registry
│   │   ├── delegation.ts               # Delegation engine
│   │   ├── state-machine.ts            # Task state machine
│   │   ├── defaults/
│   │   │   └── states.ts              # Default states & transitions
│   │   ├── hooks/                     # Enforcement hooks
│   │   │   ├── index.ts              # Hook composition
│   │   │   ├── gate-hook.ts         # Delegation gate
│   │   │   ├── guardrail-hook.ts    # Resource limits
│   │   │   ├── slop-detector-hook.ts # Quality detection
│   │   │   └── brainstorm-gate.ts    # Phase enforcement
│   │   ├── persistence/              # File-based state
│   │   │   ├── index.ts
│   │   │   ├── swarm-state.ts       # Swarm state manager
│   │   │   ├── plan.ts              # Plan file operations
│   │   │   ├── evidence.ts          # Evidence collection
│   │   │   └── checkpoint.ts        # Checkpoint management
│   │   ├── tools/                   # Coordination tools
│   │   │   ├── index.ts
│   │   │   ├── delegate.ts          # delegate_task tool
│   │   │   ├── checkpoint.ts        # checkpoint tool
│   │   │   ├── phase-complete.ts     # phase_complete tool
│   │   │   ├── swarm-status.ts      # swarm_status tool
│   │   │   └── evidence.ts          # evidence_check tool
│   │   └── commands/                 # Slash commands
│   │       └── registry.ts           # Command registration
│   │
│   ├── agents/                        # EXISTING (v2) - Agent personas
│   │   ├── architect.ts              # Primary orchestrator
│   │   ├── coder.ts
│   │   ├── reviewer.ts
│   │   ├── test-engineer.ts
│   │   ├── sme.ts
│   │   └── index.ts
│   │
│   ├── clusters/                      # NEW: Cluster definitions
│   │   ├── index.ts                 # Cluster registry
│   │   ├── execution.ts             # Execution cluster config
│   │   ├── qa.ts                   # QA cluster config
│   │   └── research.ts              # Research cluster config
│   │
│   ├── brains/                        # NEW: Brain definitions (for complex archs)
│   │   ├── index.ts                # Brain registry
│   │   └── orchestrator.ts          # Default orchestrator brain
│   │
│   ├── config/                        # EXISTING (v2)
│   │   ├── schema.ts               # Updated with coordination config
│   │   ├── loader.ts
│   │   └── constants.ts
│   │
│   ├── hooks/                         # EXISTING (v2) - OpenCode hooks
│   │   ├── utils.ts
│   │   ├── event.ts
│   │   ├── tool-before-after.ts
│   │   ├── command.ts
│   │   ├── chat-message.ts
│   │   ├── chat-messages-transform.ts
│   │   ├── chat-system-transform.ts
│   │   ├── session-compacting.ts
│   │   └── index.ts
│   │
│   ├── tools/                         # EXISTING (v2) - Plugin tools
│   │   ├── health-check.ts
│   │   ├── my-tool.ts
│   │   └── index.ts
│   │
│   ├── services/                      # EXISTING (v2)
│   │   ├── session-db.ts
│   │   ├── external-api.ts
│   │   └── fallback-storage.ts
│   │
│   ├── utils/                         # EXISTING (v2)
│   │   ├── logger.ts
│   │   └── retry.ts
│   │
│   └── index.ts                       # UPDATED: Plugin entry point
│
├── tests/
│   ├── unit/                          # NEW: Unit tests
│   │   ├── coordination/
│   │   │   ├── registry.test.ts
│   │   │   ├── delegation.test.ts
│   │   │   └── state-machine.test.ts
│   │   └── hooks/
│   │       └── gate-hook.test.ts
│   └── integration/
│       └── plugin.test.ts             # EXISTING (v2)
│
├── docs/
│   └── COORDINATION_LAYER_SPEC.md    # From AGENT_COORDINATION_LAYER.md
│
├── package.json                        # UPDATED: Add dependencies
├── tsconfig.json
└── README.md                           # UPDATED: v3 documentation
```

---

## 2. Implementation Phases

### Phase 1: Core Types & Utils
**Files to create**: 2 files

1. `src/coordination/types.ts`
   - AgentDefinition, AgentMode
   - ClusterDefinition
   - DelegationRequest, DelegationResult, DelegationTarget
   - GateResult, GateDecision
   - TaskState, StateTransition
   - SwarmState, Plan, Phase, Evidence, Checkpoint
   - CoordinationConfig

2. `src/coordination/utils.ts`
   - randomId() function
   - Helper utilities

### Phase 2: Agent Registry
**Files to create**: 1 file

3. `src/coordination/registry.ts`
   - createAgentRegistry() function
   - AgentRegistry interface
   - getAgent(), getAgentsByMode(), getAgentsByCluster()
   - isAgentAllowedTool()

### Phase 3: Delegation Engine
**Files to create**: 1 file

4. `src/coordination/delegation.ts`
   - createDelegationEngine() function
   - DelegationEngine interface
   - delegate(), canDelegate(), getClusterAgents()
   - resolveTarget() helper
   - Gate policy enforcement (strict/advisory/off)

### Phase 4: State Machine
**Files to create**: 2 files

5. `src/coordination/state-machine.ts`
   - createStateMachine() function
   - StateMachine interface
   - createTask(), transition(), getTask(), getTasksByState()
   - Task lifecycle management

6. `src/coordination/defaults/states.ts`
   - DEFAULT_STATES
   - DEFAULT_TRANSITIONS

### Phase 5: Persistence Layer
**Files to create**: 5 files

7. `src/coordination/persistence/swarm-state.ts`
   - createSwarmState() function
   - SwarmState interface
   - Plan/evidence/checkpoint operations
   - Phase management
   - Snapshot save/load

8. `src/coordination/persistence/plan.ts`
   - Plan file operations
   - loadPlan(), savePlan(), syncPlan()
   - generatePlanMarkdown()

9. `src/coordination/persistence/evidence.ts`
   - Evidence collection
   - addEvidence(), getEvidence(), verifyEvidence()

10. `src/coordination/persistence/checkpoint.ts`
    - Checkpoint management
    - createCheckpoint(), restoreCheckpoint(), listCheckpoints()

11. `src/coordination/persistence/index.ts`
    - Re-exports

### Phase 6: Enforcement Hooks
**Files to create**: 5 files

12. `src/coordination/hooks/gate-hook.ts`
    - createDelegationGateHook()
    - Prevents invalid delegation patterns
    - QA gate enforcement

13. `src/coordination/hooks/guardrail-hook.ts`
    - createGuardrailHook()
    - Resource limits per agent
    - Duration, idle timeout, error tracking

14. `src/coordination/hooks/slop-detector-hook.ts`
    - createSlopDetectorHook()
    - Quality degradation detection
    - Pattern matching for repetitive code

15. `src/coordination/hooks/brainstorm-gate.ts`
    - createBrainstormGateHook()
    - Phase 0 completion enforcement
    - Blocks coding tools before brainstorm

16. `src/coordination/hooks/index.ts`
    - createCoordinationHooks()
    - Hook composition

### Phase 7: Coordination Tools
**Files to create**: 6 files

17. `src/coordination/tools/delegate.ts`
    - delegate_task tool
    - Task delegation with Zod v4 schema

18. `src/coordination/tools/checkpoint.ts`
    - checkpoint tool
    - Named checkpoint creation

19. `src/coordination/tools/phase-complete.ts`
    - phase_complete tool
    - Phase completion with evidence verification

20. `src/coordination/tools/swarm-status.ts`
    - swarm_status tool
    - Status reporting

21. `src/coordination/tools/evidence.ts`
    - evidence_check tool
    - Evidence verification

22. `src/coordination/tools/index.ts`
    - createCoordinationTools()
    - Tool registry

### Phase 8: Commands
**Files to create**: 2 files

23. `src/coordination/commands/registry.ts`
    - createCommandRegistry()
    - Command handlers

24. `src/coordination/commands/index.ts`
    - Re-exports

### Phase 9: Clusters & Brains
**Files to create**: 4 files

25. `src/clusters/index.ts`
    - Cluster definitions
    - Cluster registry

26. `src/clusters/execution.ts`
    - Execution cluster config (coder, tester)

27. `src/clusters/qa.ts`
    - QA cluster config (reviewer)

28. `src/clusters/research.ts`
    - Research cluster config (explorer, sme)

29. `src/brains/index.ts`
    - Brain registry

30. `src/brains/orchestrator.ts`
    - Default orchestrator brain

### Phase 10: Main Coordination Export
**Files to create**: 1 file

31. `src/coordination/index.ts`
    - createCoordinationLayer()
    - Main factory function
    - Wires all components together

### Phase 11: Config Integration
**Files to create/modify**: 3 files

32. `src/config/schema.ts` (UPDATE)
    - Add CoordinationConfigSchema
    - Agent clusters config
    - Gates config
    - Guardrails config

33. `src/config/loader.ts` (UPDATE)
    - Load coordination config
    - Merge with plugin config

34. `src/config/constants.ts` (UPDATE)
    - Add coordination constants

### Phase 12: Updated Plugin Entry Point
**Files to modify**: 1 file

35. `src/index.ts` (UPDATE)
    - Integrate createCoordinationLayer()
    - Register coordination tools
    - Register coordination hooks
    - Wire commands

### Phase 13: Tests & Documentation
**Files to create**: 6 files

36. `tests/unit/coordination/registry.test.ts`
37. `tests/unit/coordination/delegation.test.ts`
38. `tests/unit/coordination/state-machine.test.ts`
39. `tests/unit/hooks/gate-hook.test.ts`
40. `docs/COORDINATION_LAYER_SPEC.md` (copy from AGENT_COORDINATION_LAYER.md)
41. `README.md` (UPDATE with v3 docs)

---

## 3. File Count Summary

| Category | Count | Notes |
|----------|-------|-------|
| **Coordination layer** | 22 files | Core coordination components |
| **Clusters** | 3 files | Cluster definitions |
| **Brains** | 2 files | Brain definitions |
| **Config updates** | 3 files | Schema, loader, constants |
| **Entry point update** | 1 file | src/index.ts |
| **Tests** | 4 files | Unit + integration |
| **Documentation** | 2 files | SPEC copy, README |
| **TOTAL NEW** | **~37 files** | |
| **EXISTING (v2)** | 26 files | Preserved, some updated |

---

## 4. Implementation Order

```
Phase 1: Types & Utils
  └→ coordination/types.ts
  └→ coordination/utils.ts

Phase 2: Agent Registry
  └→ coordination/registry.ts

Phase 3: Delegation Engine
  └→ coordination/delegation.ts

Phase 4: State Machine
  └→ coordination/defaults/states.ts
  └→ coordination/state-machine.ts

Phase 5: Persistence
  └→ coordination/persistence/swarm-state.ts
  └→ coordination/persistence/plan.ts
  └→ coordination/persistence/evidence.ts
  └→ coordination/persistence/checkpoint.ts
  └→ coordination/persistence/index.ts

Phase 6: Enforcement Hooks
  └→ coordination/hooks/gate-hook.ts
  └→ coordination/hooks/guardrail-hook.ts
  └→ coordination/hooks/slop-detector-hook.ts
  └→ coordination/hooks/brainstorm-gate.ts
  └→ coordination/hooks/index.ts

Phase 7: Coordination Tools
  └→ coordination/tools/delegate.ts
  └→ coordination/tools/checkpoint.ts
  └→ coordination/tools/phase-complete.ts
  └→ coordination/tools/swarm-status.ts
  └→ coordination/tools/evidence.ts
  └→ coordination/tools/index.ts

Phase 8: Commands
  └→ coordination/commands/registry.ts
  └→ coordination/commands/index.ts

Phase 9: Clusters & Brains
  └→ clusters/index.ts
  └→ clusters/execution.ts
  └→ clusters/qa.ts
  └→ clusters/research.ts
  └→ brains/index.ts
  └→ brains/orchestrator.ts

Phase 10: Main Export
  └→ coordination/index.ts

Phase 11: Config
  └→ config/schema.ts (update)
  └→ config/loader.ts (update)
  └→ config/constants.ts (update)

Phase 12: Entry Point
  └→ src/index.ts (update)

Phase 13: Tests & Docs
  └→ tests/unit/... (4 files)
  └→ docs/COORDINATION_LAYER_SPEC.md
  └→ README.md (update)
```

---

## 5. Key Integration Points

### 5.1 Plugin Entry Point (src/index.ts)

```typescript
// NEW: Import coordination layer
import { createCoordinationLayer } from './coordination/index.js';
import { createCoordinationTools } from './coordination/tools/index.js';
import { createCoordinationHooks } from './coordination/hooks/index.js';

// EXISTING imports...

export default async function PluginV3(): Promise<Hooks> {
  const config = loadConfig();

  // Create coordination layer
  const coordination = createCoordinationLayer({
    swarmId: 'plugin-v3',
    swarmName: 'Plugin Agent v3',
    config: config.coordination,
    directory: ctx.directory, // from plugin context
  });

  return {
    name: 'plugin-v3',

    // NEW: Coordination tools
    tool: {
      ...createCoordinationTools(coordination),
      ...createToolRegistry(config), // Existing tools
    },

    // NEW: Coordination hooks integrated with existing
    'tool.execute.before': composeHandlers(
      coordination.hooks['tool.execute.before'],
      toolBeforeHook,
    ),

    // ... rest of hooks
  };
}
```

### 5.2 Backward Compatibility

v3 maintains v2's simple mode via config:

```typescript
// Simple mode (like v2): No clusters, flat structure
config = {
  coordination: {
    enabled: false, // Falls back to v2 behavior
    agents: { architect: {...}, coder: {...} }
  }
}

// Complex mode (v3): Full coordination layer
config = {
  coordination: {
    enabled: true,
    swarmId: 'my-swarm',
    agents: {...},
    clusters: {...},
    gates: {...}
  }
}
```

---

## 6. Configuration Schema Changes

### Updated Config Schema

```typescript
// src/config/schema.ts - Additions

export const CoordinationConfigSchema = z.object({
  enabled: z.boolean().default(false),
  swarmId: z.string(),
  swarmName: z.string(),
  agents: z.record(z.object({...})),
  clusters: z.record(z.object({...})).optional(),
  gates: z.object({...}).optional(),
  guardrails: z.record(z.object({...})).optional(),
  storage: z.object({...}).optional(),
});

export const PluginConfigSchema = z.object({
  // ... existing fields ...
  coordination: CoordinationConfigSchema.optional(),
});
```

---

## 7. Dependencies

### New Dependencies

None required - all implemented with Node.js stdlib + existing deps.

### Updated peerDependencies

```json
{
  "@opencode-ai/plugin": "^1.3.6",
  "@opencode-ai/sdk": "^1.3.6"
}
```

---

## 8. Testing Strategy

### Unit Tests (4 files)

1. `tests/unit/coordination/registry.test.ts`
   - Agent registration
   - Tool filtering
   - Cluster queries

2. `tests/unit/coordination/delegation.test.ts`
   - Task delegation
   - Gate enforcement
   - Cluster resolution

3. `tests/unit/coordination/state-machine.test.ts`
   - Task creation
   - State transitions
   - Transition guards

4. `tests/unit/hooks/gate-hook.test.ts`
   - Delegation gate
   - QA enforcement
   - Warning injection

### Integration Test

Existing `tests/integration/plugin.test.ts` updated to:
- Test coordination layer initialization
- Test tool registration
- Test hook firing

---

## 9. Migration Path

### v2 → v3

1. Copy v3 template
2. Update `config/schema.ts` with coordination config
3. Define agents in coordination format
4. Optionally add clusters
5. Enable gates for enforcement

### Backward Compatibility

v3 without `coordination.enabled` falls back to v2 behavior:
- No state machine
- No delegation enforcement
- No file persistence
- Simple flat agent list

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing v2 users | Opt-in via `coordination.enabled: false` |
| Complexity overwhelming for simple use cases | Coordination layer fully optional |
| State machine bugs | Comprehensive unit tests |
| File persistence race conditions | Use atomic writes |
| Gate false positives | Advisory mode option |

---

## 11. Acceptance Criteria

### Must Have (v3.0)

- [ ] All 26 v2 files preserved and functional
- [ ] All 37 new files created per phase
- [ ] TypeScript compilation with 0 errors
- [ ] Build succeeds with `bun build --bundle`
- [ ] Unit tests pass for coordination components
- [ ] Integration tests pass (existing + new)
- [ ] Backward compatibility maintained
- [ ] Documentation updated

### Should Have

- [ ] Default cluster definitions (execution, qa, research)
- [ ] Default orchestrator brain
- [ ] All 4 enforcement hooks implemented
- [ ] All 5 coordination tools implemented
- [ ] Command registry functional

### Could Have

- [ ] Full Hydra example (5 brains, 13 agents)
- [ ] Shark Agent example (3 brains, 5 agents)
- [ ] Performance benchmarks

---

## 12. Timeline Estimate

| Phase | Files | Time Estimate |
|-------|-------|---------------|
| Phase 1-4 (Core) | 6 | 1-2 hours |
| Phase 5-8 (Persistence + Tools) | 13 | 2-3 hours |
| Phase 9-11 (Integration) | 8 | 1-2 hours |
| Phase 12-13 (Entry + Tests) | 7 | 1-2 hours |
| **TOTAL** | **~37** | **5-9 hours** |

---

## 13. Next Steps After v3

1. **Hydra Example**: Full 5-brain, 13-agent implementation
2. **Shark Agent Example**: Integration with existing Shark Agent
3. **Spider Agent Migration**: Move Spider from standalone to v3 scaffold
4. **Monitoring**: Add observability dashboards
5. **Autoscaling**: Dynamic agent spawning based on load

---

**Plan Generated**: 2026-04-02  
**Based on**: `AGENT_COORDINATION_LAYER.md` spec  
**Target Version**: plugin-agent-prototype-v3
