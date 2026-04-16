# SHIP PACKAGE MANIFEST — KRAKEN AGENT v2.0
## Self-Contained Reload Point

**Package:** `SHIP_KRAKEN_V2.0/`  
**Build date:** 2026-04-14  
**Status:** ✅ FULLY VERIFIED — Ready for deployment  

---

## ⚠️ IMPORTANT - READ BEFORE INSTALLING

**The `build/dist/` directory contains BOTH `index.js` AND `node_modules/`.**
**You MUST copy the entire `dist/` directory, not just `index.js`.**

The working image structure is:
```
kraken-agent/
└── dist/
    ├── index.js      ← 526KB bundle
    └── node_modules/ ← ~12MB dependencies (REQUIRED)
```

---

## SYSTEM STATUS — ALL SYSTEMS OPERATIONAL ✅

### Verified Test Results (`kraken-v2.0-test:v2-fixed` container, 2026-04-14)

| Test | Result | Evidence |
|------|--------|---------|
| Kraken plugin loads | ✅ PASS | `[v4.1][kraken-agent] Kraken Agent Harness initialized` |
| Subagent-manager loads | ✅ PASS | `[SubAgentManager] initialized, tools: [run_subagent_task, run_parallel_tasks, cleanup_subagents]` |
| 11 agents registered | ✅ PASS | `totalAgents: 11` |
| 3 clusters created | ✅ PASS | `clusterCount: 3` |
| `spawn_cluster_task` registered | ✅ PASS | Tool appears in `opencode debug agent kraken` |
| `spawn_shark_agent` registered | ✅ PASS | Tool appears in `opencode debug agent kraken` |
| `spawn_manta_agent` registered | ✅ PASS | Tool appears in `opencode debug agent kraken` |
| Zod schema error | ✅ FIXED | No more `schema._zod.def` errors |

---

## ARCHITECTURE

### Multi-Plugin System

```
opencode (primary)
├── subagent-manager  (plugin)
│   ├── Location: ~/.config/opencode/plugins/subagent-manager/
│   ├── dist/index.js: 966KB
│   └── wrappers/: Python wrappers
│
└── kraken-agent  (primary plugin)
    ├── Location: ~/.config/opencode/plugins/kraken-agent/
    ├── dist/
    │   ├── index.js: 526KB (Zod fix applied)
    │   └── node_modules/: ~12MB (REQUIRED - Zod, @opencode-ai/plugin, etc.)
    └── wrappers/: Python wrappers
```

### Agent Hierarchy

| Agent | Type | Role |
|-------|------|------|
| kraken | orchestrator | Primary orchestrator with full Hive access |
| kraken-executor | orchestrator | Task execution coordinator |
| shark-alpha-1 | cluster | Aggressive/steamroll tasks |
| shark-alpha-2 | cluster | Aggressive/steamroll tasks |
| shark-beta-1 | cluster | Aggressive/steamroll tasks |
| shark-gamma-1 | cluster | Aggressive/steamroll tasks |
| manta-alpha-1 | cluster | Precise/linear tasks |
| manta-beta-1 | cluster | Precise/linear tasks |
| manta-beta-2 | cluster | Precise/linear tasks |
| manta-gamma-1 | cluster | Precise/linear tasks |
| manta-gamma-2 | cluster | Precise/linear tasks |

### ⚠️ SHARK AND MANTA ARE NOT SEPARATE PLUGINS

Shark and manta agents are spawned **internally** by kraken-agent via `spawn_shark_agent` and `spawn_manta_agent` tools. They do NOT appear in `opencode.json` and should NOT be installed as separate plugins.

---

## BUG FIXES APPLIED

| # | Bug | Symptom | Fix | File |
|---|-----|---------|-----|------|
| 1 | Zod schema error | `TypeError: undefined is not an object (evaluating 'schema._zod.def')` | Removed unused standalone schemas + bundled node_modules | `cluster-tools.ts`, `build/dist/node_modules/` |
| 2 | Agent routing | shark task → manta assigned | `getAvailableAgents(agentType)` filter | `ClusterInstance.ts` |
| 3 | Wrapper path | Hardcoded paths | `process.env.HOME` + runtime-resolved | `ClusterInstance.ts` |
| 4 | Python 3.9 compat | `TypeError: unsupported operand type(s) for \|` | `from __future__ import annotations` | wrapper files |
| 5 | node_modules missing | Zod errors at runtime | Bundled node_modules with plugin | `build/dist/node_modules/` |

---

## ARTIFACT CHECKSUMS

| File | Size | MD5 |
|------|------|-----|
| `build/dist/index.js` | 526KB | `dad4fa54cec2ed6d7cf23df24d82ebc7` |
| `subagent-manager/dist/index.js` | 966KB | `9bfb3cf00766ff0e5c36f249620e5c75` |

---

## SHIP PACKAGE CONTENTS

```
SHIP_KRAKEN_V2.0/
├── build/
│   └── dist/
│       ├── index.js          PRIMARY DELIVERABLE — 526KB, Zod fix baked in
│       └── node_modules/     REQUIRED — Zod, @opencode-ai/plugin (~12MB)
├── build/CHECKSUMS.md5       MD5 checksums
├── kraken-agent-source/
│   ├── src/                 TypeScript source (all tools)
│   └── wrappers/            Python wrappers (Python 3.9 compat)
│       ├── opencode_agent.py
│       ├── container_pool.py
│       └── kraken-agent-wrapper.py
├── subagent-manager/
│   ├── dist/index.js        Built: 966KB
│   └── wrappers/            Python wrappers (self-contained)
├── shark-agent-src/         Shark agent source (internal, NOT a plugin)
├── manta-agent-src/         Manta agent source (internal, NOT a plugin)
├── INSTALL.md               Full deployment guide
├── MANIFEST.md              This file
├── CHANGELOG.md             v2.0 history
└── README.md                Quick start guide
```

---

## TOOLS AVAILABLE

### Kraken Orchestrator Tools
- `anchor_cluster` — Anchor cluster to focus/project
- `spawn_cluster_task` — Generic task spawning
- `spawn_shark_agent` — Spawn Shark (aggressive/steamroll)
- `spawn_manta_agent` — Spawn Manta (precise/linear)

### Hive Tools (Orchestrator Only)
- `kraken_hive_search` — Search Hive Mind
- `kraken_hive_remember` — Store to Hive Mind
- `kraken_hive_inject_context` — Inject context into task
- `get_cluster_status` — Get cluster status
- `aggregate_results` — Aggregate task results

### Subagent Manager Tools
- `run_subagent_task` — Run task in subagent container
- `run_parallel_tasks` — Run tasks in parallel
- `cleanup_subagents` — Clean up subagent containers

---

## VERIFICATION COMMANDS

```bash
# 1. Check plugin loads
opencode run "test"

# 2. Check agent registration
opencode debug agent kraken

# 3. List all tools
opencode debug agent kraken | grep tools

# 4. Check clusters
opencode run "use get_cluster_status to check clusters"
```

---

## DEPLOYMENT SUMMARY

| Step | Action |
|------|--------|
| 1 | Copy `build/dist/` to `~/.config/opencode/plugins/kraken-agent/` (entire directory with node_modules) |
| 2 | Copy `kraken-agent-source/wrappers/` to `~/.config/opencode/plugins/kraken-agent/` |
| 3 | Copy `subagent-manager/dist/index.js` to `~/.config/opencode/plugins/subagent-manager/dist/` |
| 4 | Copy `subagent-manager/wrappers/` to `~/.config/opencode/plugins/subagent-manager/` |
| 5 | Configure `~/.config/opencode/opencode.json` |
| 6 | Run `opencode run "test"` |

---

**END OF MANIFEST**