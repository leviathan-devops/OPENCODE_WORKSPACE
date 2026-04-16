# Kraken NUKE RELOAD v1.1 - RELOAD ANCHOR

**Date Restored:** 2026-04-15
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/NUKE RELOAD/v1.1/kraken-agent-source/`
**Status:** ✅ WORKING - REAL execution, NOT theatrical

---

## What's Different From v1.1_multi_brain_restored

| Aspect | v1.1_multi_brain (FAKE) | NUKE_RELOAD v1.1 (REAL) |
|--------|-------------------------|--------------------------|
| Cluster execution | `simulateTaskExecution` (fake) | `executeOnAgent` (real Docker) |
| Task return | Always `{ success: true }` | Real output from container |
| Python wrapper | Not called | Called via spawn |
| Timeout | 100ms fake | 120 seconds real |
| Execution type | THEATRICAL | REAL |

---

## File Inventory

| Component | Size | Status |
|-----------|------|--------|
| `kraken-agent/dist/index.js` | 515 KB | ✅ Real |
| `subagent-manager/dist/index.js` | 945 KB | ✅ Real |
| `shark-agent/dist/index.js` | 556 KB | ✅ Real |
| `manta-agent/dist/index.js` | 476 KB | ✅ Real |
| `opencode_agent.py` | 19 KB | ✅ Real |
| `container_pool.py` | 18 KB | ✅ Real |

---

## Execution Path (REAL)

```
spawn_cluster_task()
    ↓
AsyncDelegationEngine.delegate()
    ↓
ClusterManager.executeTask()
    ↓
ClusterInstance.executeTaskAsync()
    ↓
ClusterInstance.executeOnAgent()  ← REAL SPAWN
    ↓
spawn('python3', [opencode_agent.py, ...])
    ↓
Docker container spawns real agent
    ↓
Returns actual output
```

---

## Quick Reload

1. Copy to plugins directory:
```bash
cp -r /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/NUKE_RELOAD_v1.1_working/kraken-agent ~/.config/opencode/plugins/kraken-nuke-reload
```

2. Update `~/.config/opencode/opencode.json`:
```json
{
  "plugins": [
    "file:///home/leviathan/.config/opencode/plugins/kraken-nuke-reload/subagent-manager/dist/index.js",
    "file:///home/leviathan/.config/opencode/plugins/kraken-nuke-reload/dist/index.js",
    "file:///home/leviathan/.config/opencode/plugins/kraken-nuke-reload/shark-agent/dist/index.js",
    "file:///home/leviathan/.config/opencode/plugins/kraken-nuke-reload/manta-agent/dist/index.js"
  ]
}
```

3. Restart opencode

---

## This is the WORKING engine. Use this first.