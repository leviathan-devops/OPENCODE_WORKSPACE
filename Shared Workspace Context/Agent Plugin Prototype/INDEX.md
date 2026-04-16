# Agent Plugin Prototype

Complete plugin template with build reports and changelog.

---

## Directory Structure

```
Agent Plugin Prototype/
├── INDEX.md                          # This file
├── plugin-agent-prototype-v3/        # ✅ RECOMMENDED - Agent Coordination Layer (v3)
├── plugin-agent-prototype-v2/        # Stable v2 (backward compatible)
├── plugin-agent-prototype/           # Legacy plugin code (v1)
├── v3-BUILD/                        # v3 build report & changelog
├── v2-BUILD/                        # v2 build report & changelog
├── v1-BUILD/                        # v1 build report
└── docs/                            # Specifications and plans
```

---

## Version Comparison

| Version | Status | TypeScript | Bundle | Tests | Use |
|---------|--------|------------|--------|-------|-----|
| **v3** | ✅ Production | 0 errors | 0.51 MB | 51/52 | ✅ **RECOMMENDED** |
| **v2** | ✅ Stable | 0 errors | 0.47 MB | 1/1 | Backward compatible |
| v1 | ⚠️ Legacy | 8 errors | 0.59 MB | - | ❌ Use v3 |

---

## Quick Start

### Using v3 (Recommended)

```bash
# Copy the template
cp -r plugin-agent-prototype-v3/ /path/to/your-plugin

# Install dependencies
cd /path/to/your-plugin
npm install

# Build
npm run build

# Test
npm test
```

---

## What's New in v3

### Agent Coordination Layer
- **State Machine** - Formal task lifecycle (pending → in_progress → completed/failed)
- **Delegation Gates** - Enforce delegation rules (QA gates, loop detection)
- **Persistence** - Plans, evidence, checkpoints with atomic writes
- **Clusters** - Hierarchical Hub-Spoke architecture
- **Brains** - Orchestrator brain for coordination
- **Enforcement Hooks** - Guardrails, slop detection, brainstorm gates

### Architecture
```
                          ┌─────────────┐
                          │ Orchestrator│ (Brain)
                          └──────┬──────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
     ┌────▼────┐           ┌────▼────┐           ┌────▼────┐
     │Execution │           │   QA    │           │Research │
     │ Cluster  │           │ Cluster │           │ Cluster │
     └───┬─────┘           └───┬─────┘           └───┬─────┘
         │                    │                      │
     ┌───┴───┐           ┌───┴───┐            ┌───┴───┐
     │ Coder │           │Review │            │  SME   │
     │       │           │TestEng│            │Explorer│
     └───────┘           └───────┘            └───────┘
```

---

## Contents

### plugin-agent-prototype-v3/ (Recommended ✅)
- **63 TypeScript source files** (26 new coordination files)
- **8 test files** (unit tests)
- **Coordination layer** - State machine, delegation, persistence, hooks, tools
- **TypeScript**: 0 errors
- **Bundle**: 0.51 MB

Contains:
```
src/
├── coordination/              # NEW: Coordination layer (25 files)
│   ├── types.ts             # All shared types
│   ├── utils.ts             # Helpers
│   ├── registry.ts         # Agent registry
│   ├── delegation.ts        # Delegation engine
│   ├── state-machine.ts      # Task lifecycle
│   ├── persistence/         # Atomic file operations
│   ├── hooks/              # Enforcement hooks
│   ├── tools/              # Coordination tools
│   └── commands/           # Slash commands
├── clusters/                 # NEW: Cluster definitions
├── brains/                   # NEW: Brain definitions
├── hooks/                   # Existing: OpenCode hooks
├── tools/                   # Existing: Plugin tools
├── agents/                   # Existing: Agent personas
└── index.ts                 # Plugin entry point
```

### plugin-agent-prototype-v2/ (Backward Compatible ✅)
- **28 TypeScript source files**
- **Multi-agent system** (Architect, Coder, Reviewer, Test Engineer, SME)
- **TypeScript**: 0 errors
- **Bundle**: 0.47 MB

### docs/

| File | Purpose |
|------|---------|
| **AGENT_COORDINATION_LAYER.md** | Boilerplate specification for multi-agent coordination layer. Works for Shark, Spider, Hermes, Hydra. |
| **V3_IMPLEMENTATION_PLAN.md** | Full implementation plan for V3 |
| **V3_IMPLEMENTATION_EDITS.md** | Critical fixes applied during v3 build |
| **COORDINATION_LAYER_SPEC.md** | Copy of AGENT_COORDINATION_LAYER.md |
| **V4_AGENT_FACTORY_BUILD_PLAN.md** | V4 (Agent Factory Edition) - future |

### Build Reports

| Directory | Contents |
|-----------|----------|
| **v3-BUILD/** | BUILD_REPORT.md - v3 changelog, fixes applied, architecture |
| **v2-BUILD/** | BUILD_REPORT.md - v2 changelog (Zod fix, TS errors) |
| **v1-BUILD/** | BUILD_REPORT.md - Initial build documentation |

---

## Changelog

### v3.0.0 (April 2, 2026)
- **37 new files** added for coordination layer
- **State Machine** - Task lifecycle with pending/in_progress/completed/failed states
- **Delegation Gates** - QA enforcement, loop detection, brainstorm gates
- **Atomic Persistence** - Plans, evidence, checkpoints with fsync+rename
- **Clusters** - Execution, QA, Research cluster definitions
- **Brains** - Orchestrator brain for coordination
- **8 test files** created (51 tests passing)
- **composeHandlers** updated to filter undefined handlers
- **Backward compatible** - v2 mode available via `coordination.enabled: false`

### v2.0.0 (April 2, 2026)
- Fixed 8 TypeScript errors → 0 errors
- Updated Zod from v3.25.76 to v4.1.8 (exact)
- Removed 4 unused variables
- Fixed event hook signature
- Bundle size reduced 20% (0.59 MB → 0.47 MB)

### v1.0.0 (April 2, 2026)
- Initial release
- 28 TypeScript files
- 7 hook types implemented
- Multi-agent architecture

---

## Migration Guide

### v2 → v3

v3 is backward compatible. To enable coordination:

```json
{
  "coordination": {
    "enabled": true,
    "swarmId": "my-swarm",
    "swarmName": "My Swarm",
    "gates": {
      "delegation": { "policy": "advisory", "maxRejections": 3 }
    }
  }
}
```

Without this config, v3 behaves exactly like v2.

---

**Last Updated**: April 2nd, 2026
