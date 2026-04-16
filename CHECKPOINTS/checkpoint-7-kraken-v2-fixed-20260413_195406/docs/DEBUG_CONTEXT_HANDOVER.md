# KRAKEN AGENT v2.0 - DEBUG CONTEXT HANDOVER PACKAGE

**Checkpoint:** checkpoint-7-kraken-v2-fixed-20260413_195406
**Date:** 2026-04-13
**Status:** ✅ OPERATIONAL

---

## EXECUTIVE SUMMARY

Fixed the "evidence is not defined" error and restored the dual plugin architecture for Kraken Agent v2.0. The system now has 6 plugins loading correctly and the kraken agent responds to tool calls.

---

## BUGS FIXED

### 1. Evidence Variable Ordering Bug

**File:** `/manta-agent/src/hooks/v4.1/gate-hook.ts`

**Problem:** `checkGateAdvance()` was called with `evidence` variable before it was defined.

**Fix:** Moved `const evidence = buildEvidenceRecord(tool, args, result);` BEFORE the call to `checkGateAdvance()`.

```typescript
// BEFORE (broken):
const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);  // evidence undefined!
const evidence = buildEvidenceRecord(tool, args, result);

// AFTER (fixed):
const evidence = buildEvidenceRecord(tool, args, result);  // Build FIRST
const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);  // Now valid
```

---

### 2. Dual Plugin Architecture Restored

**Required Plugin Order:**

```json
{
  "plugin": [
    "file:///.../opencode-subagent-manager/dist/index.js",  // Position 0 - Execution layer
    "file:///.../coding-subagents/dist/index.js",
    "file:///.../opencode-plugin-engineering/dist/index.js",
    "file:///.../kraken-agent/dist/index.js",               // Orchestrator
    "file:///.../shark-agent-v4.7-hotfix-v3/dist/index.js", // Standalone TAB
    "file:///.../manta-agent-v1.5/dist/index.js"           // Standalone TAB
  ]
}
```

**Why subagent-manager first:** It provides `run_subagent_task`, `run_parallel_tasks`, `cleanup_subagents` tools that kraken delegates to for actual Docker container spawning.

---

## WORKING CONFIG

### Local `~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
  ],
  "agent": {
    "architect": {
      "disable": true
    }
  },
  "permission": {
    "*": {
      "*": "allow"
    }
  }
}
```

---

## CONTAINER BUILD

**Image:** `kraken-v2-tui-test:1.4.8`

**Build Command:**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/container-build/kraken-tui-test
docker build --no-cache -t kraken-v2-tui-test:1.4.8 .
```

**Test Command:**
```bash
docker run --rm -e MINIMAX_API_KEY="$MINIMAX_API_KEY" kraken-v2-tui-test:1.4.8 /bin/bash -c 'opencode run "get_cluster_status" --agent kraken'
```

**Container Config:** `/home/leviathan/OPENCODE_WORKSPACE/container-build/kraken-tui-test/config/opencode.json`

---

## VERIFIED WORKING SYSTEMS

| System | Status | Notes |
|--------|--------|-------|
| subagent-manager | ✅ | First plugin loaded, 3 tools available |
| coding-subagents | ✅ | Route/gemma/qwen tools |
| opencode-plugin-engineering | ✅ | Engineering context |
| kraken-agent | ✅ | 3 clusters, 11 agents registered |
| shark-agent (standalone) | ✅ | v4.7-hotfix-v3 |
| manta-agent (standalone) | ✅ | v1.5 |
| get_cluster_status | ✅ | Returns cluster data |
| kraken agent tab | ✅ | Responds to "echo hello" |

---

## PLUGINS DIRECTORY STRUCTURE

```
/home/leviathan/OPENCODE_WORKSPACE/
├── plugins/
│   ├── opencode-subagent-manager/
│   │   ├── src/tools/index.ts     # run_subagent_task, run_parallel_tasks, cleanup_subagents
│   │   ├── dist/index.js         # Built bundle
│   │   └── wrappers/              # Python wrappers (NOT copied to container)
│   │       ├── opencode_agent.py
│   │       └── container_pool.py
│   ├── coding-subagents/
│   ├── opencode-plugin-engineering/
│   ├── shark-agent-v4.7-hotfix-v3/
│   └── manta-agent-v1.5/
└── projects/kraken-agent/
    ├── src/index.ts               # Main entry
    ├── src/tools/                 # Kraken tools
    ├── src/kraken-hive/          # Hive Mind engine
    ├── src/clusters/              # Cluster management
    ├── dist/index.js              # Built bundle
    ├── shark-agent/               # Embedded shark (NOT standalone)
    │   └── shark-agent-v4.7-hotfix-v3/
    ├── manta-agent/               # Embedded manta (NOT standalone)
    │   └── src/index.ts
    └── subagent-manager/           # Container execution (embedded)
        └── dist/index.js
```

---

## SUBAGENT MANAGER WRAPPERS PATH

The subagent-manager tool looks for Python wrappers at:
```
/home/leviathan/hermes-workspace/projects/Shadow Magic/OpenCode Subagents/wrappers/
```

**Files:**
- `opencode_agent.py` - CLI wrapper for spawning agents
- `container_pool.py` - Docker container pool management

**IMPORTANT:** The container build does NOT include these wrappers. They must exist on the host at the hardcoded path OR the tool will fail.

---

## KRACKEN ARCHITECTURE (REMINDER)

### Dual Plugin System

1. **kraken-agent** (Orchestration)
   - spawn_cluster_task
   - spawn_shark_agent
   - spawn_manta_agent
   - kraken_hive_search/remember
   - get_cluster_status
   - aggregate_results

2. **opencode-subagent-manager** (Execution)
   - run_subagent_task
   - run_parallel_tasks
   - cleanup_subagents

### Cluster Agents (Embedded - NOT Tabs)

| Cluster | Agents |
|---------|--------|
| Alpha | shark-alpha-1, shark-alpha-2, manta-alpha-1 |
| Beta | shark-beta-1, manta-beta-1, manta-beta-2 |
| Gamma | manta-gamma-1, manta-gamma-2, shark-gamma-1 |

### Standalone Agents (TABS - Separate Plugins)

- **shark** → shark-agent-v4.7-hotfix-v3
- **manta** → manta-agent-v1.5
- **kraken** → kraken-agent (orchestrator)

---

## KNOWN ISSUES / LIMITATIONS

1. **API Provider Fallback:** Without explicit model setting, opencode falls back to google gemini. Must pass MINIMAX_API_KEY env var.

2. **Python Wrappers Path:** Hardcoded path in subagent-manager tool. Container doesn't bundle these - they must exist on host.

3. **TypeScript Type Errors:** Tests have some missing `acceptanceCriteria` fields in test data. Non-critical - builds work.

4. **No Container Output Retrieval:** subagent-manager spawns containers but outputs stay in container filesystem (documented V2.0 issue).

---

## REBUILT FILES

After fixing the evidence bug, rebuild with:

```bash
# Rebuild kraken-agent
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent
bun run build

# Rebuild embedded shark
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/shark-agent
bun run build

# Rebuild embedded manta
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/manta-agent
bun run build

# Rebuild opencode-subagent-manager
cd /home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager
bun run build
```

---

## VERIFICATION CHECKLIST

- [x] opencode-subagent-manager loads first
- [x] All 6 plugins load without errors
- [x] kraken agent tab visible in TUI
- [x] get_cluster_status returns JSON
- [x] 3 clusters configured (Alpha, Beta, Gamma)
- [x] 9 cluster agents + 2 standalone agents = 11 total
- [x] MINIMAX_API_KEY passed to container
- [x] No "evidence is not defined" errors

---

**END OF HANDOVER PACKAGE**