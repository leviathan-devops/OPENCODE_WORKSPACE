# KRAKEN V2.0 - FRESH SESSION START HERE

## Location
`/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/`

## Build Project (Source + Bundle)
`/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/`

---

## COMPLETED FIXES

### 1. Python Wrappers - ALL HARDCODE PATHS FIXED
Files in `v2.0-retry/kraken-agent-source/wrappers/` and `v2.0-retry/subagent-manager/wrappers/`:
- `opencode_agent.py` - Fixed PLUGIN_MOUNTS destinations, workspace mount, wrapper mount
- `container_pool.py` - Fixed PLUGIN_MOUNTS destinations, workspace mount
- `kraken-agent-wrapper.py` - Fixed PLUGIN_MOUNTS destinations, workspace mount

### 2. TypeScript Source - ALL HARDCODE PATHS FIXED  
Files synced to build project `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/src/`:
- `kraken-hive/index.ts` - LOCAL_FALLBACK_DIR now uses `os.homedir()`
- `hooks/cluster-state-hook.ts` - ACTIVITY_LOG_DIR now uses `os.homedir()`
- `tools/shark-t2-tools.ts` - Added KRAKEN_HIVE_DIR, fixed reportPath/contextPath
- `hooks/index.ts` - LAUNCHPAD_PATH now uses `os.homedir()` with env override

### 3. Zod Schema - FIXED PREVIOUSLY
- `src/tools/cluster-tools.ts` - Removed 3 unused standalone schemas

### 4. Bundle __dirname - FIXED PREVIOUSLY
- `shark-t2-tools.ts` and `subagent-manager/tools/index.ts` use `import.meta.url`

---

## BLOCKER: Bundle NOT Rebuilt

The source files were fixed but the bundle was NOT rebuilt. This is the only remaining action.

### Step 1: Rebuild
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build
bun run build
```

### Step 2: Copy to Ship Package
```bash
cp dist/index.js "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/build/dist/index.js"
```

### Step 3: Verify No Hardcodes
```bash
grep -n "/home/leviathan" "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/build/dist/index.js"
# Should return nothing (except possibly in comments)
```

### Step 4: Syntax Check
```bash
node --check "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/build/dist/index.js"
```

### Step 5: Test Container
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry"
docker build -t kraken-v2.0-final:latest -f Dockerfile.test .
```

---

## File Manifest

```
v2.0-retry/
├── build/dist/index.js              # NEEDS REBUILD
├── build/dist/node_modules/        # OK (40MB)
├── kraken-agent-source/wrappers/  # ALL FIXED
├── subagent-manager/wrappers/      # ALL FIXED
├── subagent-manager/dist/index.js   # OK (dynamic __dirname)
├── Dockerfile.test
├── COMPLETE_AUDIT_LOG.md
├── CONTEXT_HANDOVER.md
└── INSTALL.md
```

---

## Quick Status

| Component | Status |
|-----------|--------|
| Python Wrappers | ✅ FIXED |
| TypeScript Source | ✅ FIXED |
| Bundle | ⏳ NEEDS REBUILD |
| Container Test | ⏳ NEEDS TO RUN |
| Ship Ready | ⏳ PENDING VERIFY |
