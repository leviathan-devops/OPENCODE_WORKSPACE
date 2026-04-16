# KRAKEN V2.0 SHIP PACKAGE - COMPLETE AUDIT LOG

**Generated**: 2026-04-14
**Session**: Kraken Factory v2.0 Rebuild
**Status**: ⚠️ NOT SHIP READY - Critical Issues Found
**Package Location**: `Shared Workspace Context/Kraken Agent/NUKE RELOAD/v2.0/`

---

## EXECUTIVE SUMMARY

The Kraken v2.0 ship package has been audited. While the **JavaScript bundle issues have been fixed**, the **Python wrappers that handle Docker container spawning have critical hardcoded paths** that will cause failures at runtime.

| Category | Status |
|----------|--------|
| JavaScript Bundles | ✅ FIXED |
| Python Wrappers | ❌ CRITICAL ISSUES |
| End-to-End Container Spawning | ❌ UNTESTED |

---

## ISSUE #1: Python Wrapper Hardcoded Paths

### Severity: CRITICAL

### Description

The Python wrapper scripts that spawn Docker containers have **multiple hardcoded paths** pointing to the development environment (`/home/leviathan/OPENCODE_WORKSPACE/`). These paths do not exist inside spawned containers and will cause volume mounts and plugin state access to fail silently or throw errors.

### Affected Files

1. `kraken-agent-source/wrappers/opencode_agent.py`
2. `kraken-agent-source/wrappers/container_pool.py`
3. `kraken-agent-source/wrappers/kraken-agent-wrapper.py`
4. `subagent-manager/wrappers/opencode_agent.py`
5. `subagent-manager/wrappers/container_pool.py`
6. `subagent-manager/wrappers/kraken-agent-wrapper.py`

### Problem Code

#### Problem A: Workspace Volume Mount (Line ~185)

**File**: `opencode_agent.py`

```python
# CURRENT (BROKEN):
f"{OPENCODE_WORKSPACE}:/home/leviathan/OPENCODE_WORKSPACE:rw",
```

**Issue**: `OPENCODE_WORKSPACE` resolves to `/root/OPENCODE_WORKSPACE` (or equivalent on the host), but inside the Docker container it attempts to mount at `/home/leviathan/OPENCODE_WORKSPACE`. The path `/home/leviathan/` may not even exist inside the spawned container.

**Expected Behavior**: Host workspace should mount to the same path inside the container that OpenCode expects.

**Fix Required**:
```python
# FIXED:
f"{OPENCODE_WORKSPACE}:{OPENCODE_WORKSPACE}:rw",
```

---

#### Problem B: Plugin State Mounts (Lines ~44-64)

**File**: `opencode_agent.py`, `container_pool.py`, `kraken-agent-wrapper.py`

```python
# CURRENT (BROKEN):
PLUGIN_MOUNTS = [
    # Shark agent state
    (
        ".shark",
        OPENCODE_WORKSPACE / ".shark",           # Local: /root/OPENCODE_WORKSPACE/.shark
        "/home/leviathan/OPENCODE_WORKSPACE/.shark",  # Container: WRONG PATH!
    ),
    # Manta agent state
    (
        ".manta",
        OPENCODE_WORKSPACE / ".manta",
        "/home/leviathan/OPENCODE_WORKSPACE/.manta",
    ),
    # Spider agent state
    (
        ".Spider",
        OPENCODE_WORKSPACE / ".Spider",
        "/home/leviathan/OPENCODE_WORKSPACE/.Spider",
    ),
    # Spider agent plugin source
    (
        "spider-agent",
        OPENCODE_WORKSPACE / "plugins" / "spider-agent",
        "/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent",
    ),
]
```

**Issue**: Container destination paths are hardcoded to `/home/leviathan/OPENCODE_WORKSPACE/...` which is a development-specific path that doesn't exist inside spawned containers.

**Fix Required**:
```python
# FIXED:
PLUGIN_MOUNTS = [
    # Shark agent state
    (
        ".shark",
        OPENCODE_WORKSPACE / ".shark",
        str(OPENCODE_WORKSPACE / ".shark"),  # Use same path in container
    ),
    # Manta agent state
    (
        ".manta",
        OPENCODE_WORKSPACE / ".manta",
        str(OPENCODE_WORKSPACE / ".manta"),
    ),
    # Spider agent state
    (
        ".Spider",
        OPENCODE_WORKSPACE / ".Spider",
        str(OPENCODE_WORKSPACE / ".Spider"),
    ),
    # Spider agent plugin source
    (
        "spider-agent",
        OPENCODE_WORKSPACE / "plugins" / "spider-agent",
        str(OPENCODE_WORKSPACE / "plugins" / "spider-agent"),
    ),
]
```

---

#### Problem C: Wrapper Mount Path (Line ~188)

**File**: `opencode_agent.py`

```python
# CURRENT (BROKEN):
f"{OPENCODE_WORKSPACE}/projects/kraken-agent-v2.0/subagent-manager/wrappers:/opt/kraken-wrappers:rw",
```

**Issue**: This path only exists on the development machine, not on a fresh deployment.

**Fix Required**: The wrappers should either:
1. Be bundled with the plugin and mounted from there, OR
2. Be copied into the container at build time, OR
3. Be mounted from the installed plugin location

```python
# POSSIBLE FIX - mount from plugin install location:
WRAPPER_DIR = CONFIG_PATH / "plugins" / "subagent-manager" / "wrappers"
# Then mount:
f"{WRAPPER_DIR}:/opt/kraken-wrappers:rw",
```

---

## ISSUE #2: Bundle `__dirname` Hardcoding (FIXED)

### Severity: HIGH (Previously Critical, Now Fixed)

### Description

The JavaScript bundles previously had hardcoded `__dirname` values pointing to development paths. This has been fixed.

### What Was Fixed

| File | Before | After |
|------|--------|-------|
| `build/dist/index.js` (shark-t2-tools) | `var __dirname = "/home/leviathan/..."` | `var __filename3 = fileURLToPath2(import.meta.url); var __dirname3 = path3.dirname(__filename3);` |
| `subagent-manager/dist/index.js` | `var __dirname = "/home/leviathan/..."` | `var __filename2 = fileURLToPath(import.meta.url); var __dirname2 = path.dirname(__filename2);` |

### Verification

```bash
$ grep -E "var __dirname.*=.*\"/home" build/dist/index.js subagent-manager/dist/index.js
# No results - hardcoded paths removed
```

### Bundles Now Use Dynamic Resolution

```javascript
// build/dist/index.js line 14069-14072
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename3 = fileURLToPath2(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
var T2_LIBRARY_DIR = path3.join(__dirname3, "..", "..", "kraken-context");
```

---

## ISSUE #3: Zod Schema Error (FIXED)

### Severity: CRITICAL (Previously)

### Root Cause

Three **unused** standalone Zod schemas at the top of `cluster-tools.ts`:

```typescript
// REMOVED - These caused _zod.def undefined errors
const spawnClusterTaskSchema = z.object({...});  // DEFINED BUT NEVER USED
const spawnSharkAgentSchema = z.object({...});  // DEFINED BUT NEVER USED
const spawnMantaAgentSchema = z.object({...});  // DEFINED BUT NEVER USED
```

OpenCode processes **ALL** schemas in the bundle, even unused ones. These unused schemas caused `_zod.def` to be undefined.

### What Was Fixed

Removed the three unused standalone schema definitions from `src/tools/cluster-tools.ts`.

### Verification

```bash
$ grep -n "const spawnClusterTaskSchema\|const spawnSharkAgentSchema\|const spawnMantaAgentSchema" dist/index.js
# No results - unused schemas removed
```

---

## ISSUE #4: ClusterInstance Uses Correct Dynamic `__dirname`

### Severity: INFO

### Status: Already Correct

The `ClusterInstance.ts` file correctly uses ESM `import.meta.url` for dynamic path resolution:

```typescript
// src/clusters/ClusterInstance.ts (lines 22-23)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

This was **NOT** the source of the hardcoding - the issue was in `shark-t2-tools.ts` which is now fixed.

---

## SUMMARY OF REQUIRED FIXES

### Must Fix Before Ship

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 1A | Workspace volume mount path | `opencode_agent.py` line 185 | Change destination from `/home/leviathan/OPENCODE_WORKSPACE` to `{OPENCODE_WORKSPACE}` |
| 1B | Plugin state mount paths | `opencode_agent.py`, `container_pool.py`, `kraken-agent-wrapper.py` lines 44-64 | Change destination paths to use `str(OPENCODE_WORKSPACE / ...)` |
| 1C | Wrapper mount path | `opencode_agent.py` line 188 | Mount from plugin install location, not hardcoded dev path |

### Already Fixed

| # | Issue | File(s) | Status |
|---|-------|---------|--------|
| 2 | `__dirname` hardcoding in bundles | `shark-t2-tools.ts`, `subagent-manager/tools/index.ts` | ✅ FIXED |
| 3 | Unused Zod schemas | `cluster-tools.ts` | ✅ FIXED |

---

## DEPLOYMENT IMPACT

### What WILL Work After Fix

- ✅ Plugin initialization without Zod errors
- ✅ 11 agents registered correctly
- ✅ 3 clusters created
- ✅ All tools registered in registry
- ✅ Python wrappers loaded by kraken-agent

### What WILL Work After Python Wrapper Fix

- ✅ Docker containers spawn with correct volume mounts
- ✅ Plugin state (`.shark`, `.manta`, `.Spider`) accessible inside containers
- ✅ Workspace files accessible inside containers
- ✅ Task delegation through spawned containers

### What Needs End-to-End Testing

- ⚠️ Full `spawn_cluster_task` workflow from OpenCode prompt to container result
- ⚠️ Shark/Manta agent spawning and communication
- ⚠️ Parallel task execution via `run_parallel_tasks`

---

## RECOMMENDED REMEDIATION STEPS

### Step 1: Fix Python Wrapper Paths

Apply the following changes to all 6 wrapper files:

1. **Fix workspace mount** (line ~185):
   ```python
   # Before:
   f"{OPENCODE_WORKSPACE}:/home/leviathan/OPENCODE_WORKSPACE:rw",
   # After:
   f"{OPENCODE_WORKSPACE}:{OPENCODE_WORKSPACE}:rw",
   ```

2. **Fix plugin state mounts** (lines ~44-64):
   ```python
   # Change all third elements from hardcoded paths to:
   str(OPENCODE_WORKSPACE / ".shark"),
   str(OPENCODE_WORKSPACE / ".manta"),
   str(OPENCODE_WORKSPACE / ".Spider"),
   str(OPENCODE_WORKSPACE / "plugins" / "spider-agent"),
   ```

3. **Fix wrapper mount** (line ~188):
   ```python
   # Option A: Mount from installed plugin location
   WRAPPER_DIR = CONFIG_PATH / "plugins" / "subagent-manager" / "wrappers"
   f"{WRAPPER_DIR}:/opt/kraken-wrappers:rw",
   ```

### Step 2: Rebuild Bundles (if source changed)

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build
bun run build
cd subagent-manager && bun run build
```

### Step 3: Copy Fixed Files to Ship Package

```bash
cp dist/index.js "SHIPPATH/build/dist/index.js"
cp subagent-manager/dist/index.js "SHIPPATH/subagent-manager/dist/index.js"
cp kraken-agent-source/wrappers/*.py "SHIPPATH/kraken-agent-source/wrappers/"
cp subagent-manager/wrappers/*.py "SHIPPATH/subagent-manager/wrappers/"
```

### Step 4: Regenerate Checksums

```bash
cd "SHIPPATH"
md5sum build/dist/index.js subagent-manager/dist/index.js > build/dist/CHECKSUMS.md5
```

### Step 5: Test in Container

```bash
docker build -t kraken-v2.0-final:test .
docker run -it --rm kraken-v2.0-final:test
# In container:
opencode run "test"
```

---

## BUNDLE CHECKSUMS (Current - Before Python Wrapper Fix)

| File | Checksum (MD5) |
|------|----------------|
| `build/dist/index.js` | `4988835fbfadca0d0c1d28058a079d72` |
| `subagent-manager/dist/index.js` | `c1bc10d20e49adcd4e34b483945180b8` |

**Note**: These will change after rebuilding if source files are modified.

---

## FILE MANIFEST

### Ship Package Contents

```
NUKE RELOAD/v2.0/
├── build/dist/
│   ├── index.js              ✅ Fixed - Dynamic __dirname
│   ├── node_modules/         ✅ Bundled (40MB)
│   └── CHECKSUMS.md5
├── kraken-agent-source/wrappers/
│   ├── opencode_agent.py     ❌ NEEDS FIX - Hardcoded paths
│   ├── container_pool.py     ❌ NEEDS FIX - Hardcoded paths
│   └── kraken-agent-wrapper.py ❌ NEEDS FIX - Hardcoded paths
├── subagent-manager/dist/
│   └── index.js              ✅ Fixed - Dynamic __dirname
├── subagent-manager/wrappers/
│   ├── opencode_agent.py     ❌ NEEDS FIX - Hardcoded paths
│   ├── container_pool.py     ❌ NEEDS FIX - Hardcoded paths
│   └── kraken-agent-wrapper.py ❌ NEEDS FIX - Hardcoded paths
├── shark-agent-src/          ⚠️ Source only (NOT a plugin)
├── manta-agent-src/          ⚠️ Source only (NOT a plugin)
├── INSTALL.md
├── README.md
├── MANIFEST.md
├── AUDIT_LOG.md              ← This file
├── CHANGELOG.md
└── package.json
```

---

## CHANGELOG

| Date | Change | Author |
|------|--------|--------|
| 2026-04-14 | Created initial audit log | Kraken Factory v2.0 Rebuild Session |
| 2026-04-14 | Documented __dirname fix | Session |
| 2026-04-14 | Documented Zod schema fix | Session |
| 2026-04-14 | Documented Python wrapper issues | Session |

---

## END OF AUDIT LOG

**Next Action**: Fix Python wrapper hardcoded paths before this package can be considered ship-ready.
