# Kraken v1.1 - RELOAD ANCHOR

## Purpose

This directory is a **reload anchor** for the last working Kraken multi-brain orchestrator.
Use this to restore full functionality when newer versions are broken.

---

## Quick Reload Command

Point a vanilla OpenCode build agent at this command:

```
"Reload kraken agent from this version"
```

Then run:
```bash
# 1. Kill existing OpenCode
pkill -f opencode

# 2. Copy this line into your opencode.json plugins array:
"file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored/subagent-manager/dist/index.js"
"file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored/dist/index.js"
"file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored/shark-agent/dist/index.js"
"file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored/manta-agent/dist/index.js"

# 3. Restart OpenCode
opencode
```

---

## What You Get

### 4-Plugin Dual System

| Plugin | File | Size | Purpose |
|--------|------|------|---------|
| **subagent-manager** | subagent-manager/dist/index.js | 944 KB | Docker container spawning |
| **kraken-agent** | dist/index.js | 521 KB | Orchestration + cluster management |
| **shark-agent** | shark-agent/dist/index.js | 490 KB | Execution brain (sharks) |
| **manta-agent** | manta-agent/dist/index.js | 541 KB | Execution brain (mantas) |

### 3-Cluster Architecture

- **Alpha Cluster**: shark-alpha-1, shark-alpha-2, manta-alpha-1
- **Beta Cluster**: shark-beta-1, manta-beta-1, manta-beta-2
- **Gamma Cluster**: shark-gamma-1, manta-gamma-1, manta-gamma-2

### Multi-Brain Coordination

- **BrainFactory**: Creates and wires brains together
- **BrainMessenger**: Inter-brain communication
- **AsyncDelegationEngine**: Async task queue with parallel execution
- **ClusterScheduler**: Load balancing and focus anchoring
- **StateStore**: Persistent state management

### Hive Mind Integration

- **kraken-hive-store**: Store patterns, failures, sessions
- **kraken-hive-search**: Query Hive Mind for context

---

## Why This Works (And v2.0 Doesn't)

| Metric | v1.1 (This) | v2.0 |
|--------|-------------|------|
| **Bundle Size** | 521 KB | 52 KB |
| **Execution** | Real Docker spawning | `simulateTaskExecution` fake |
| **Container Tools** | Yes (944 KB) | No (deleted) |
| **Python Wrappers** | Yes | No |
| **Multi-brain** | Fully wired | "All components, not wired" |

v2.0 had ALL the code but deleted the actual execution layer. This version has BOTH.

---

## File Inventory

```
v1.1_multi_brain_restored/
├── INSTALLATION.md          # Step-by-step setup
├── TROUBLESHOOTING.md        # Common issues + fixes
├── README.md                 # Original documentation
├── ARCHITECTURE/
│   └── DUAL_PLUGIN_SYSTEM.md # Plugin architecture
├── dist/index.js             # 521 KB - Kraken orchestrator
├── subagent-manager/
│   ├── dist/index.js         # 944 KB - Container spawner
│   ├── wrappers/
│   │   ├── opencode_agent.py    # Single agent wrapper
│   │   └── container_pool.py   # Parallel container pool
│   └── src/tools/index.ts   # run_subagent_task, run_parallel_tasks
├── shark-agent/
│   └── dist/index.js         # 490 KB - Shark brain
├── manta-agent/
│   └── dist/index.js         # 541 KB - Manta brain
├── src/
│   ├── index.ts              # Main entry
│   ├── clusters/             # ClusterInstance, ClusterManager
│   ├── factory/              # BrainFactory, AsyncDelegationEngine, etc.
│   ├── hooks/                # cluster-state-hook
│   ├── kraken-hive/         # Hive Mind integration
│   ├── tools/                # cluster-tools, monitoring-tools
│   └── v4.1/                 # Guardrail infrastructure
├── wrappers/                 # Python execution wrappers
└── kraken-context/           # T2 patterns, build chain, failure modes
```

---

## Reload Checklist

- [ ] OpenCode killed (`pkill -f opencode`)
- [ ] Config updated with 4 plugin paths
- [ ] OpenCode restarted
- [ ] `/kraken-status` returns cluster info
- [ ] `/spawn_cluster_task` available
- [ ] `/run_subagent_task` available
- [ ] Hive tools available

---

## Version History

| Version | Status | Date | Notes |
|---------|--------|------|-------|
| **v1.1** | ✅ WORKING | 2026-04-12 | Last working version |
| v1.2 | ❌ Unknown | - | Not documented |
| v2.0 | ❌ BROKEN | 2026-04-13 | 90% size reduction, fake execution |

**v1.1 is the GOLD STANDARD** - restore from here when anything breaks.