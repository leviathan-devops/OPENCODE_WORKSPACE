# Kraken v1.1 Multi-Brain Orchestrator - INSTALLATION GUIDE

## Version Identity

| Property | Value |
|----------|-------|
| **Version** | v1.1 (Working) |
| **Date Restored** | 2026-04-15 |
| **Status** | GOLD STANDARD - Production verified |
| **Bundle Size** | 521 KB (kraken-agent), 944 KB (subagent-manager) |
| **Architecture** | Dual plugin system with 3 async clusters |

## Why This Version?

This is the **last working version** before the v2.0 refactor that broke everything:
- v1.1 had **real Docker container spawning** via subagent-manager
- v2.0 replaced it with `simulateTaskExecution` - a fake placeholder
- v2.0 bundle is **90% smaller** (52 KB vs 521 KB) because all execution code was deleted

---

## Prerequisites

### Required Software
- Node.js >= 20.0.0
- Bun >= 1.0.0
- Python >= 3.11
- Docker (for container spawning)

### Check Installation
```bash
node --version  # >= 20.0.0
bun --version    # >= 1.0.0
python3 --version # >= 3.11
docker --version  # Required for subagent execution
```

---

## Installation Methods

### Method 1: Direct File Reference (RECOMMENDED)

**Step 1: Configure OpenCode plugins**

Edit `~/.config/opencode/opencode.json`:

```json
{
  "plugins": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored/subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored/shark-agent/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored/manta-agent/dist/index.js"
  ]
}
```

**Step 2: Restart OpenCode**
```bash
# Kill existing OpenCode process
pkill -f opencode

# Restart OpenCode
opencode
```

**Step 3: Verify Installation**
```bash
# In OpenCode, run:
/kraken-status

# Should output cluster load info for Alpha/Beta/Gamma clusters
```

---

### Method 2: Copy to Local Path

If you want to reference from a different path:

```bash
# Create local installation
mkdir -p ~/.opencode/plugins/kraken-v1.1
cp -r /home/leviathan/OPENCODE_WORKSPACE/Shared Workspace\ Context/Kraken\ Agent/Master\ Context/v1.1_multi_brain_restored/* ~/.opencode/plugins/kraken-v1.1/

# Update opencode.json with new path
```

---

## Plugin Loading Order

**CRITICAL**: The order in `opencode.json` matters:

1. **subagent-manager** (FIRST) - Base execution layer for Docker containers
2. **kraken-agent** (SECOND) - Orchestration layer
3. **shark-agent** (THIRD) - Execution brain for shark agents
4. **manta-agent** (FOURTH) - Execution brain for manta agents

---

## Build Instructions (If Needed)

If you need to rebuild from source:

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/v1.1_multi_brain_restored"

# Install dependencies
bun install

# Build all components
bun run build:all

# Verify builds
ls -la dist/index.js              # Should be ~521 KB
ls -la shark-agent/dist/index.js # Should be ~490 KB
ls -la manta-agent/dist/index.js  # Should be ~541 KB
ls -la subagent-manager/dist/index.js # Should be ~944 KB
```

---

## Quick Verification Checklist

- [ ] All dist files exist with correct sizes
- [ ] `~/.config/opencode/opencode.json` has correct plugin paths
- [ ] OpenCode restarted after config change
- [ ] `/kraken-status` returns cluster info
- [ ] `/spawn_cluster_task` tool is available
- [ ] `/run_subagent_task` tool is available (subagent-manager)
- [ ] Hive tools available: `kraken-hive-store`, `kraken-hive-search`

---

## File Structure

```
v1.1_multi_brain_restored/
├── dist/index.js                    # Kraken orchestrator (521 KB)
├── subagent-manager/
│   ├── dist/index.js               # Container spawner (944 KB)
│   ├── wrappers/
│   │   ├── opencode_agent.py      # Single agent wrapper
│   │   └── container_pool.py      # Parallel container pool
│   └── src/tools/index.ts         # run_subagent_task, run_parallel_tasks
├── shark-agent/
│   └── dist/index.js              # Shark execution brain (490 KB)
├── manta-agent/
│   └── dist/index.js              # Manta execution brain (541 KB)
├── src/
│   ├── index.ts                   # Main entry, 18KB
│   ├── clusters/ClusterInstance.ts    # Async task queue
│   ├── clusters/ClusterManager.ts      # Cluster lifecycle
│   ├── factory/
│   │   ├── BrainFactory.ts            # Brain creation
│   │   ├── BrainMessenger.ts          # Inter-brain comms
│   │   ├── AsyncDelegationEngine.ts   # Task queue
│   │   └── ClusterScheduler.ts        # Load balancing
│   └── kraken-hive/index.ts       # Hive Mind integration
└── README.md                      # Original documentation
```