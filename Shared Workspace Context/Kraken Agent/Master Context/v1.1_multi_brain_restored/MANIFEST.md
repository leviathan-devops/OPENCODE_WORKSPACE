# Kraken v1.1 Multi-Brain Restored - FILE MANIFEST

## Restore Location
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored/
```

## Complete File Inventory

### Compiled Distributions (2.5 MB total)
| File | Size | SHA256 |
|------|------|--------|
| `dist/index.js` | 521 KB (523,805 bytes) | kraken orchestrator |
| `subagent-manager/dist/index.js` | 944 KB (966,723 bytes) | container spawner |
| `shark-agent/dist/index.js` | 490 KB (501,827 bytes) | shark brain |
| `manta-agent/dist/index.js` | 541 KB (554,481 bytes) | manta brain |

### Source Code (TypeScript)
| Path | Description |
|------|-------------|
| `src/index.ts` | Main entry (18 KB) |
| `src/clusters/ClusterInstance.ts` | Async task queue + parallel execution |
| `src/clusters/ClusterManager.ts` | Cluster lifecycle management |
| `src/factory/BrainFactory.ts` | Brain creation/wiring |
| `src/factory/BrainMessenger.ts` | Inter-brain communication |
| `src/factory/AsyncDelegationEngine.ts` | Async task delegation |
| `src/factory/ClusterScheduler.ts` | Load balancing + focus anchoring |
| `src/factory/StateStore.ts` | Persistent state |
| `src/factory/validators.ts` | Input validation |
| `src/kraken-hive/index.ts` | Hive Mind integration |
| `src/tools/cluster-tools.ts` | spawn_cluster_task, spawn_shark_agent, etc |
| `src/tools/kraken-hive-tools.ts` | kraken-hive-store, kraken-hive-search |
| `src/v4.1/` | Guardrail infrastructure (config, hooks, state) |

### Python Wrappers (Docker Execution)
| File | Size | Purpose |
|------|------|---------|
| `subagent-manager/wrappers/opencode_agent.py` | 19 KB | Single agent container wrapper |
| `subagent-manager/wrappers/container_pool.py` | 18 KB | Parallel container pool |

### Documentation
| File | Purpose |
|------|---------|
| `RELOAD_ANCHOR.md` | This file - quick reload instructions |
| `INSTALLATION.md` | Step-by-step setup guide |
| `TROUBLESHOOTING.md` | Common issues + fixes |
| `README.md` | Original documentation |
| `ARCHITECTURE/DUAL_PLUGIN_SYSTEM.md` | Plugin architecture details |
| `kraken-context/T2_*.md` | T2 patterns, build chain, failure modes |

### Configuration
| File | Purpose |
|------|---------|
| `package.json` | Main package (kraken-agent) |
| `tsconfig.json` | TypeScript config |
| `subagent-manager/package.json` | Subagent manager package |
| `shark-agent/package.json` | Shark agent package |
| `manta-agent/package.json` | Manta agent package |

### Embedded Agents (Pre-built)
| Path | Version | Purpose |
|------|---------|---------|
| `shark-agent/src/hooks/v4.1/` | v4.7-hotfix-v3 | Triple-brain coordination |
| `shark-agent/src/shark/macro/brains.ts` | - | Macro brain |
| `shark-agent/src/tools/shark-*.ts` | - | Shark T2 tools |
| `manta-agent/hooks/v4.1/` | v1.3.5-hotfix | Dual-brain coordination |
| `manta-agent/manta/brains.ts` | - | Manta brain |
| `manta-agent/tools/manta-*.ts` | - | Manta tools |

---

## Verification Commands

```bash
# Verify all 4 dist files
ls -la .../v1.1_multi_brain_restored/dist/index.js              # 521 KB
ls -la .../v1.1_multi_brain_restored/shark-agent/dist/index.js  # 490 KB
ls -la .../v1.1_multi_brain_restored/manta-agent/dist/index.js  # 541 KB
ls -la .../v1.1_multi_brain_restored/subagent-manager/dist/index.js # 944 KB

# Verify Python wrappers
file .../subagent-manager/wrappers/opencode_agent.py   # Python script, executable
file .../subagent-manager/wrappers/container_pool.py    # Python script

# Verify source completeness
ls .../v1.1_multi_brain_restored/src/factory/           # 12 files
ls .../v1.1_multi_brain_restored/src/clusters/         # 2 files
ls .../v1.1_multi_brain_restored/src/tools/             # 4 files
```

---

## Self-Contained Restore Procedure

1. **This directory IS the restore** - no external dependencies
2. **DIST files are pre-built** - no build step required
3. **Python wrappers included** - no additional downloads
4. **Embedded agents compiled** - shark + manta ready

To restore:
```bash
# Copy to plugin location
cp -r /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/v1.1_multi_brain_restored ~/.opencode/plugins/kraken-v1.1

# Update opencode.json with:
# "file:///home/leviathan/.opencode/plugins/kraken-v1.1/subagent-manager/dist/index.js"
# "file:///home/leviathan/.opencode/plugins/kraken-v1.1/dist/index.js"
# "file:///home/leviathan/.opencode/plugins/kraken-v1.1/shark-agent/dist/index.js"
# "file:///home/leviathan/.opencode/plugins/kraken-v1.1/manta-agent/dist/index.js"

# Restart OpenCode
pkill -f opencode && opencode
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────┐
│           KRAKEN ORCHESTRATOR (521 KB)          │
│  ┌────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │ BrainFactory│ │AsyncDelegation│ │Cluster   │ │
│  │            │ │Engine         │ │Scheduler │ │
│  └────────────┘ └──────────────┘ └───────────┘ │
│  ┌─────────────────────────────────────────────┤
│  │              KRAKEN-HIVE MIND                │
│  └─────────────────────────────────────────────┤
└──────────────────────┬──────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    ▼                  ▼                  ▼
┌─────────┐       ┌─────────┐       ┌─────────┐
│ ALPHA   │       │ BETA    │       │ GAMMA   │
│ Cluster │       │ Cluster │       │ Cluster │
├─────────┤       ├─────────┤       ├─────────┤
│Shark-A1 │       │Shark-B1 │       │Shark-G1 │
│Shark-A2 │       │Manta-B1 │       │Manta-G1 │
│Manta-A1 │       │Manta-B2 │       │Manta-G2 │
└─────────┘       └─────────┘       └─────────┘
    │                  │                  │
    └──────────────────┼──────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│        SUBAGENT MANAGER (944 KB)                │
│  ┌─────────────────┐  ┌────────────────────┐  │
│  │ opencode_agent.py│  │ container_pool.py  │  │
│  │ (single agent)   │  │ (parallel pool)     │  │
│  └─────────────────┘  └────────────────────┘  │
│  → Docker container spawning                    │
└─────────────────────────────────────────────────┘
```