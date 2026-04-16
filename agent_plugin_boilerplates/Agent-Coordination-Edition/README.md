# Plugin Agent Prototype Template v3

A **working OpenCode plugin scaffold** with Agent Coordination Layer supporting both simple 5-agent architectures and complex multi-brain, multi-cluster architectures (Hierarchical Hub-Spoke with Clusters).

## Version History

| Version | Status | Key Features |
|---------|--------|--------------|
| **v3** | ✅ Current | Agent Coordination Layer, delegation gates, state machine, persistence |
| v2 | ✅ Stable | TypeScript fixed, Zod 4.1.8, 0 errors |
| v1 | ⚠️ Legacy | Initial template, 8 TS errors |

## Quick Start

```bash
# 1. Copy the template
cp -r plugin-agent-prototype-v3 /path/to/your-plugin

# 2. Install dependencies
cd /path/to/your-plugin
npm install

# 3. Build
npm run build

# 4. Test
npm test
```

## What's New in v3

### Agent Coordination Layer
- **Formal task lifecycle management** - State machine with pending/in_progress/completed/failed states
- **Delegation enforcement gates** - QA gates prevent invalid delegation patterns
- **File-based persistence** - Plans, evidence, and checkpoints with atomic writes
- **Hierarchical Hub-Spoke with Clusters** - Supports complex multi-brain architectures

### Architecture
```
                    ┌─────────────┐
                    │ Orchestrator│ (Brain)
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │Execution│        │   QA    │        │Research │
   │ Cluster │        │ Cluster │        │ Cluster │
   └───┬────┘        └───┬────┘        └───┬────┘
       │                 │                  │
   ┌───┴───┐         ┌───┴───┐         ┌───┴───┐
   │ Coder │         │Review │         │  SME   │
   │       │         │TestEng│         │Explorer│
   └───────┘         └───────┘         └───────┘
```

### Enforcement Hooks
- **Gate Hook** - Blocks invalid delegation patterns, detects coder loops
- **Guardrail Hook** - Duration limits, idle timeout, error thresholds
- **Slop Detector** - Quality degradation detection, copy-paste patterns
- **Brainstorm Gate** - Blocks coding tools before Phase 0 completion

## Template Structure

```
plugin-agent-prototype-v3/
├── src/
│   ├── coordination/           # NEW: Coordination layer
│   │   ├── types.ts          # All shared types
│   │   ├── utils.ts          # Helpers
│   │   ├── registry.ts       # Agent registry
│   │   ├── delegation.ts      # Delegation engine
│   │   ├── state-machine.ts   # Task lifecycle
│   │   ├── defaults/states.ts # Default states
│   │   ├── persistence/       # File persistence
│   │   │   ├── plan-store.ts  # Atomic plan writes
│   │   │   ├── evidence-store.ts
│   │   │   ├── checkpoint-store.ts
│   │   │   └── plugin-state.ts # Facade
│   │   ├── hooks/             # Enforcement hooks
│   │   │   ├── gate-hook.ts
│   │   │   ├── guardrail-hook.ts
│   │   │   ├── slop-detector-hook.ts
│   │   │   └── brainstorm-gate.ts
│   │   ├── tools/             # Coordination tools
│   │   │   ├── delegate.ts
│   │   │   ├── checkpoint.ts
│   │   │   ├── phase-complete.ts
│   │   │   ├── plugin-status.ts
│   │   │   └── evidence.ts
│   │   └── commands/          # Slash commands
│   ├── clusters/              # NEW: Cluster definitions
│   ├── brains/                # NEW: Brain definitions
│   ├── hooks/                 # Existing: OpenCode hooks
│   ├── tools/                 # Existing: Plugin tools
│   ├── agents/                # Existing: Agent personas
│   ├── services/              # Existing: Storage, API
│   └── index.ts               # Plugin entry point
├── tests/
│   └── unit/                  # 8 test files
├── docs/
│   └── COORDINATION_LAYER_SPEC.md
└── package.json
```

## Configuration

### Enable Coordination Layer

```json
{
  "coordination": {
    "enabled": true,
    "pluginId": "my-plugin",
    "pluginName": "My Plugin",
    "gates": {
      "delegation": {
        "policy": "advisory",
        "maxRejections": 3
      }
    },
    "guardrails": {
      "maxDuration": 300000,
      "idleTimeout": 60000,
      "errorThreshold": 5
    }
  }
}
```

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npx vitest run tests/unit

# Run with coverage
npx vitest run --coverage
```

### Test Coverage

| Component | Tests |
|-----------|-------|
| `registry.ts` | getAgent, getAgentsByMode, getAgentsByCluster, isAgentAllowedTool |
| `delegation.ts` | delegate, canDelegate, getClusterAgents, gate enforcement |
| `state-machine.ts` | createTask, transition, getTask, getTasksByState, guards |
| `gate-hook.ts` | QA gate blocking, warning injection, consecutive coder detection |
| `guardrail-hook.ts` | duration limit, idle timeout, error threshold |
| `slop-detector-hook.ts` | class repetition, comment ratio, diff size |
| `plugin-state.ts` | loadPlan, savePlan, atomic writes, snapshots |
| `evidence.ts` | addEvidence, getEvidence, verifyEvidence |

## Key Features

### Atomic Writes (FIX 2)
All persistence uses atomic write pattern:
```typescript
// Write to temp file
await fs.writeFile(tmpPath, JSON.stringify(data));
// fsync for durability
await fs.fsync(await fs.open(tmpPath, 'r+'));
// Atomic rename
await fs.rename(tmpPath, finalPath);
```

### composeHandlers with undefined filtering (FIX 4)
```typescript
composeHandlers(
  coordination.hooks['tool.execute.before'],
  toolBeforeHook,
).filter(Boolean);  // Removes undefined handlers
```

### Zod v4.1.8 Compatibility (FIX 5)
This project uses Zod v4.1.8 exact to match `@opencode-ai/plugin`.

## Documentation

- [COORDINATION_LAYER_SPEC.md](./docs/COORDINATION_LAYER_SPEC.md) - Full specification
- [AGENT_COORDINATION_LAYER.md](./docs/AGENT_COORDINATION_LAYER.md) - Original spec

## Migration from v2

1. Copy v3 template
2. Enable coordination in config: `coordination.enabled: true`
3. Define agents in coordination format
4. Optionally add clusters for complex architectures

## Reference

- [Spider Agent Architecture](https://github.com/leviathan-devops/spider-agent)
- [OpenCode Plugin SDK](https://www.npmjs.com/package/@opencode-ai/plugin)

---

**Last Updated**: April 2nd, 2026
