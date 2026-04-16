# KRAKEN V2.0 CONTEXT HANDOVER PACKAGE

**Generated**: 2026-04-14
**Status**: IN-PROGRESS - Session Crashed During Fixes
**Location**: `Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/`

---

## EXECUTIVE SUMMARY

We are fixing the Kraken v2.0 ship package. We have fixed the Python wrapper hardcoded paths and JavaScript __dirname issues. We were in the middle of fixing additional hardcoded paths in the source TypeScript files when the session crashed.

## WHAT HAS BEEN FIXED

### 1. Python Wrapper Hardcoded Paths ✅
Fixed in ALL 6 wrapper files (both `kraken-agent-source/wrappers/` and `subagent-manager/wrappers/`):

**Files Fixed:**
- `opencode_agent.py` - PLUGIN_MOUNTS destinations + workspace mount
- `container_pool.py` - PLUGIN_MOUNTS destinations + workspace mount  
- `kraken-agent-wrapper.py` - PLUGIN_MOUNTS destinations + workspace mount

**Changes Made:**
- Changed hardcoded `/home/leviathan/OPENCODE_WORKSPACE/.shark` → `str(OPENCODE_WORKSPACE / ".shark")`
- Changed `f"{OPENCODE_WORKSPACE}:/home/leviathan/OPENCODE_WORKSPACE:rw"` → `f"{OPENCODE_WORKSPACE}:{OPENCODE_WORKSPACE}:rw"`
- Changed wrapper mount to use `CONFIG_PATH / "plugins" / "subagent-manager" / "wrappers"`

**Verification:** `grep -rn "/home/leviathan" wrappers/` returns no results

### 2. JavaScript Bundle __dirname ✅
Fixed `shark-t2-tools.ts` and `subagent-manager/tools/index.ts` to use `import.meta.url`:
```typescript
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 3. Additional Source Files Fixed ⚠️ (Partial)
Fixed these files to use `os.homedir()` instead of hardcoded paths:

| File | Status |
|------|--------|
| `src/kraken-hive/index.ts` | ✅ Fixed |
| `src/hooks/cluster-state-hook.ts` | ✅ Fixed |
| `src/tools/shark-t2-tools.ts` | ✅ Fixed |
| `src/hooks/index.ts` | ✅ Fixed |

**Changes:**
- `LOCAL_FALLBACK_DIR` now uses `path.join(os.homedir(), '.local/share/opencode/kraken-hive')`
- `ACTIVITY_LOG_DIR` now uses `path.join(os.homedir(), '.local/share/opencode/kraken-hive/activity')`
- `KRAKEN_HIVE_DIR` constant added to `shark-t2-tools.ts`
- `LAUNCHPAD_PATH` now uses `path.join(os.homedir(), 'OPENCODE_WORKSPACE', ...)` with env var override

## WHAT STILL NEEDS TO BE DONE

### CRITICAL: Rebuild Bundle
The source TypeScript files were fixed but **the bundle was NOT rebuilt** before the session crashed. The current `build/dist/index.js` still has hardcoded paths.

**Command to rebuild:**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build
bun run build
```

**Then copy to ship package:**
```bash
cp dist/index.js "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/build/dist/index.js"
```

### Remaining Hardcoded Paths in Source
After rebuild, verify these are gone from the bundle:
```
src/index.ts:168:  # Comment only - not executable
src/tests/categories/hive.test.ts:  # Test file - not bundled
```

### Verify in Container
After rebuild, build test container and verify:
1. Python wrappers import correctly
2. JavaScript bundle has no hardcoded paths
3. Plugin loads without errors

---

## FILES MODIFIED IN THIS SESSION

### Python Wrappers (All Fixed)
```
kraken-agent-source/wrappers/opencode_agent.py
kraken-agent-source/wrappers/container_pool.py
kraken-agent-source/wrappers/kraken-agent-wrapper.py
subagent-manager/wrappers/opencode_agent.py
subagent-manager/wrappers/container_pool.py
subagent-manager/wrappers/kraken-agent-wrapper.py
```

### TypeScript Source (All Fixed)
```
kraken-agent-source/src/kraken-hive/index.ts
kraken-agent-source/src/hooks/cluster-state-hook.ts
kraken-agent-source/src/tools/shark-t2-tools.ts
kraken-agent-source/src/hooks/index.ts
kraken-agent-source/src/tools/cluster-tools.ts  # Previously fixed (Zod schema)
kraken-agent-source/src/clusters/ClusterInstance.ts  # Already correct (uses import.meta.url)
```

---

## VERIFICATION COMMANDS

```bash
# 1. Check Python wrappers have no hardcoded paths
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry"
grep -rn "/home/leviathan" kraken-agent-source/wrappers/ subagent-manager/wrappers/
# Expected: no output

# 2. Check TypeScript source has no hardcoded paths (excluding test files)
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build
grep -rn "/home/leviathan" kraken-agent/src/ --include="*.ts" | grep -v node_modules | grep -v test
# Expected: src/index.ts comment only (not executable)

# 3. Rebuild bundle
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build
bun run build

# 4. Verify bundle has no hardcoded paths
grep -n "/home/leviathan" kraken-agent/dist/index.js
# Expected: no output (or only in test code which won't execute)

# 5. Syntax check bundle
node --check kraken-agent/dist/index.js
# Expected: no output

# 6. Build test container
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry"
docker build -t kraken-v2.0-trident-test:latest -f Dockerfile.test .

# 7. Test Python wrappers in container
docker run --rm --entrypoint "" --user root kraken-v2.0-trident-test:latest python3 -c "
import sys
sys.path.insert(0, '/root/.config/opencode/plugins/kraken-agent/wrappers')
import opencode_agent
print('PLUGIN_MOUNTS:')
for name, src, dst in opencode_agent.PLUGIN_MOUNTS:
    print(f'  {name}: {dst}')
"
# Expected: All paths should use /root/ not /home/leviathan/
```

---

## SHIP PACKAGE STRUCTURE

```
v2.0-retry/
├── build/dist/
│   ├── index.js          # NEEDS REBUILD after source fixes
│   ├── node_modules/     # 40MB bundled
│   └── CHECKSUMS.md5
├── kraken-agent-source/wrappers/  # ALL FIXED
│   ├── opencode_agent.py
│   ├── container_pool.py
│   └── kraken-agent-wrapper.py
├── subagent-manager/
│   ├── dist/index.js     # Already correct (dynamic __dirname)
│   └── wrappers/         # ALL FIXED
│       ├── opencode_agent.py
│       ├── container_pool.py
│       └── kraken-agent-wrapper.py
├── shark-agent-src/      # Source only, NOT a plugin
├── manta-agent-src/      # Source only, NOT a plugin
├── Dockerfile.test       # For building test container
├── COMPLETE_AUDIT_LOG.md # Full audit with before/after code
├── INSTALL.md
└── package.json
```

---

## KEY FINDINGS FROM AUDIT

### Issue #1: Python Wrapper Paths (FIXED)
- PLUGIN_MOUNTS had hardcoded `/home/leviathan/OPENCODE_WORKSPACE/...`
- Now uses `str(OPENCODE_WORKSPACE / ".shark")` etc.

### Issue #2: Bundle __dirname (FIXED)
- Shark-t2-tools had `var __dirname = "/home/leviathan/..."`
- Now uses `fileURLToPath(import.meta.url)`

### Issue #3: Hive Mind Paths (FIXED)
- `LOCAL_FALLBACK_DIR` hardcoded
- Now uses `path.join(os.homedir(), '.local/share/opencode/kraken-hive')`

### Issue #4: Launchpad Path (FIXED)
- `LAUNCHPAD_PATH` hardcoded
- Now uses `path.join(os.homedir(), 'OPENCODE_WORKSPACE', ...)` with env var override

### Issue #5: Zod Schema (PREVIOUSLY FIXED)
- Unused standalone schemas caused `_zod.def` undefined errors
- Removed 3 unused schemas from `cluster-tools.ts`

---

## WHAT WAS NOT BROKEN (Already Correct)

1. **ClusterInstance.ts** - Already uses `import.meta.url` for dynamic `__dirname`
2. **cluster-tools.ts** - Zod fix already applied
3. **subagent-manager bundles** - Already use dynamic `__dirname`

---

## NEXT STEPS FOR FRESH SESSION

1. **REBUILD BUNDLE** - Most critical! Source fixes need to be compiled
2. **Verify bundle** - Check no hardcoded paths remain
3. **Copy to ship package** - Update `build/dist/index.js` in ship package
4. **Build test container** - Use `Dockerfile.test`
5. **Run container tests** - Verify Python wrappers and JS bundle
6. **Update checksums** - Regenerate `CHECKSUMS.md5`
7. **Update audit log** - Document all fixes as complete
8. **Final trident audit** - Run comprehensive code review

---

## CONTEXT FOR FRESH SESSION

We are performing final fixes on the Kraken v2.0 ship package to make it deployable. The package has:
- ✅ Python wrapper path fixes (DONE in source files)
- ✅ JavaScript bundle __dirname fixes (DONE but NOT rebuilt)
- ✅ Zod schema fixes (DONE previously)
- ⚠️ Bundle NOT rebuilt after latest source fixes
- ⚠️ Final verification NOT completed

The session kept crashing during the rebuild phase. A fresh session should:
1. Rebuild the bundle
2. Verify the fixes
3. Run container tests
4. Mark as ship-ready if all passes
