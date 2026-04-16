# KRAKEN AGENT - COMPACTION SURVIVAL KNOWLEDGE

## Version: 2.1
## Last Updated: 2026-04-13
## Purpose: Preserve stream of consciousness across context compactions

---

## CRITICAL CONTEXT (NEVER LOSE)

### What Happened: The Great v2.0 Catastrophic Failure

During the v1.1 → v2.0 refactor, the ENTIRE EXECUTION SYSTEM was corrupted:

1. **v1.0 (GitHub)**: Had subagent-manager with Python wrappers, BUT ClusterInstance.simulateTaskExecution() was FAKE
2. **v1.1 (local)**: Same issue - Python wrappers existed but were never called
3. **v2.0 (broken)**: Deleted integration code, left fake placeholder, bundle went from 521KB → 52KB

### The Fix Applied

Replaced fake execution with REAL execution:
```typescript
// BEFORE (FAKE - BAD):
private async simulateTaskExecution(...) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ success: true }), 100);
  });
}

// AFTER (REAL - GOOD):
private async executeOnAgent(agent, request) {
  // Make HTTP call to wrapper daemon
  const result = await httpCall(wrapperDaemon, { task: request.task });
}
```

---

## V2.0 PROPER ARCHITECTURE

### Dual Plugin System (Properly Integrated)

```
kraken-agent-v2.0/
├── subagent-manager/           # Execution Layer (REAL)
│   └── wrappers/
│       ├── opencode_agent.py   # Original CLI wrapper (spawns containers)
│       ├── container_pool.py   # Container pool
│       └── kraken-agent-wrapper.py  # HTTP daemon wrapper (IN PROGRESS)
├── kraken-agent/              # Orchestration Layer
│   └── dist/index.js           # 199 KB
├── shark-agent/               # Shark v4.7-hotfix-v3 (569 KB)
└── manta-agent/               # Manta v1.3.5 (158 KB)
```

### Bundle Sizes (Must be > 500KB total)

| Component | Size | Status |
|-----------|------|--------|
| kraken-agent dist | 199 KB | ✅ REAL |
| shark-agent dist | 569 KB | ✅ REAL |
| manta-agent dist | 158 KB | ✅ REAL |
| **TOTAL** | **~926 KB** | ✅ PROPER |

---

## THE ONE RULE

**IF IT'S NOT REAL, IT'S NOT DONE.**

Every function must do what it says. Every tool must execute for real.

---

## KNOWN ISSUES (DEBUGGING IN PROGRESS)

### Critical Issue: Python3 Not in opencode Container

**Problem**: The opencode Docker container does NOT have python3 installed.

**Impact**: Kraken runs INSIDE a container, cannot spawn python3 to call wrapper.

**Root Cause**: 
1. opencode_agent.py runs on HOST (has python3) ✅
2. Kraken runs INSIDE opencode container (no python3) ❌
3. ClusterInstance.executeOnAgent() tries to spawn python3 ❌

### Solution In Progress: HTTP Daemon Wrapper

**Approach**:
1. Run `kraken-agent-wrapper.py` as HTTP daemon on host (port 18086)
2. Kraken inside container makes HTTP POST to wrapper daemon
3. Wrapper daemon spawns Docker containers on host

**Current Status**:
- Wrapper daemon starts and health endpoint works ✅
- Container spawn works (verified with docker run) ✅
- Health check in wrapper times out due to parse issue ⚠️
- Output parsing is JSON lines, not single JSON ⚠️

### Verified Working

1. **Docker container spawns**: `docker run -d -p PORT:8080 ghcr.io/anomalyco/opencode serve` ✅
2. **Health check passes**: `curl http://localhost:PORT/global/health` returns `{"healthy":true}` ✅
3. **Task execution works**: `docker exec CONTAINER opencode run "echo hello" --format json` outputs JSON lines ✅
4. **Wrapper daemon runs**: HTTP server on port 18086 ✅

### Issues Found

1. **Wrapper health check timeout**: The Python wait_healthy() returns False even when container is healthy
2. **JSON output parsing**: opencode run outputs JSON lines, not single JSON - need to handle this

---

## 3-LAYER AUDIT RESULTS

### LAYER 1: Structure Audit ✅
- All dist files exist (199KB + 569KB + 158KB)
- Python wrappers present
- Source files present
- Wrapper daemon code written

### LAYER 2: Integration Audit ✅
- ClusterInstance.executeOnAgent() calls HTTP wrapper (not python3)
- ClusterManager properly imported
- HTTP client code in TypeScript

### LAYER 3: Execution Audit ⚠️ PARTIAL
- Wrapper daemon starts ✅
- Health check works (manual test) ✅
- Container spawn works (manual test) ✅
- Wrapper daemon execute endpoint returns success: false ❌
- Container cleanup works ✅

---

## CURRENT STATE (Updated 2026-04-13)

### What's Built ✅
- ClusterInstance with HTTP-based execution
- kraken-agent-wrapper.py HTTP daemon (syntax verified)
- shark v4.7-hotfix-v3 integrated
- manta v1.3.5 integrated
- Bundle size proper (~926 KB total)

### What's Broken ⚠️
- Wrapper execute endpoint returns success: false
- wait_healthy() timing out incorrectly
- JSON output parsing not handling JSON lines format

### Debug Log Location
```
/tmp/kraken-wrapper.log - wrapper daemon logs
```

### Start Wrapper Daemon
```bash
nohup python3 /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/wrappers/kraken-agent-wrapper.py > /tmp/kraken-wrapper.log 2>&1 &
```

---

## NEXT STEPS

1. Fix wrapper wait_healthy() - health check succeeds but returns False
2. Handle JSON lines output format from opencode run
3. Test full end-to-end flow
4. Verify Kraken can delegate tasks through wrapper

---

## V2.0 REBUILD INSTRUCTIONS

### KEEP (Don't Remove)
- ClusterInstance with HTTP-based execution
- shark v4.7-hotfix-v3 (569 KB real code)
- manta v1.3.5 (158 KB real code)
- HTTP daemon wrapper architecture

### ADD (As Enhancements, Not Replacements)
- Kraken-Hive Mind context systems
- Multi-brain coordination
- Two-layer security

### NEVER
- Remove real Docker container spawning
- Use simulateTaskExecution() or any fake execution

---

## DEBUG LOGS

```
/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/13-kraken-catastrophic-failure-20260413_005709/
```

---

**END OF COMPACTION SURVIVAL KNOWLEDGE**
