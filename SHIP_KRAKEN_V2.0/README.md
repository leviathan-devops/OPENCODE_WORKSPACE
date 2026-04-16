# KRAKEN AGENT v2.0

> **Status:** ✅ FULLY OPERATIONAL  
> **Version:** 2.0  
> **Build:** 2026-04-14  

Multi-agent orchestrator with real Docker container spawning and Hive Mind integration.

---

## Quick Start

1. **Copy plugins to opencode plugins directory**
2. **Configure opencode.json**
3. **Run `opencode run "test"`**

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

---

## Architecture

- **3 Clusters:** alpha (build), beta (general), gamma (debug)
- **11 Agents:** 1 orchestrator + 1 executor + 4 sharks + 4 mantas
- **Tools:** 20+ tools for cluster management, task spawning, and Hive access

---

## Key Features

### Cluster Tools
- `spawn_cluster_task` — Generic task distribution
- `spawn_shark_agent` — Aggressive steamroll execution
- `spawn_manta_agent` — Precise linear execution
- `anchor_cluster` — Route clusters to projects

### Hive Mind (Orchestrator Only)
- `kraken_hive_search` — Query past sessions
- `kraken_hive_remember` — Store decisions
- `kraken_hive_inject_context` — Context injection

---

## Verification

```bash
opencode run "test"
# Should show: Kraken Agent Harness initialized, 11 agents, 3 clusters
```

---

## Files

| Path | Description |
|------|-------------|
| `build/index.js` | Primary bundle (526KB) |
| `INSTALL.md` | Full installation guide |
| `MANIFEST.md` | Complete system documentation |
| `CHANGELOG.md` | Version history |

---

**IF IT'S NOT REAL, IT'S NOT DONE.**