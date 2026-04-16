# CHANGELOG - KRAKEN V2.0 PROPER BUILD

## Version: 2.0.0-PROPER - Milestone 1
## Date: 2026-04-14
## Status: DIRECT SPAWN REFACTOR COMPLETE

---

## CHANGELOG

### [Milestone 1] 2026-04-14 - Direct Spawn Refactor

**Changes:**
- Refactored `ClusterInstance.ts` to use direct `spawn('python3', [...])` instead of HTTP daemon
- Added `spawn` and `path` imports to ClusterInstance.ts
- Removed HTTP daemon dependency (port 18086)
- Updated executeOnAgent() to call Python wrapper directly

**Files Modified:**
- `src/clusters/ClusterInstance.ts` - Replaced 120+ lines of HTTP code with direct spawn

**Verification:**
- Anti-theatrical scan: PASSED (0 simulateTaskExecution found)
- Bundle size: 527KB (increased from 647KB original - expected due to different bundler)
- shark-agent: 569KB ✅
- manta-agent: 158KB ✅

**Anti-Theatrical Checks:**
```bash
grep -r "simulateTaskExecution" src/  # 0 results
grep -r "http.request.*18086" src/     # 0 results
```

---

## Architecture Change

### Before (HTTP Daemon):
```
ClusterInstance --HTTP--> daemon on port 18086 --spawn--> Docker
```

### After (Direct Spawn):
```
ClusterInstance --spawn('python3', [wrapper.py])--> Docker
```

---

## Next Milestone

**Milestone 2: Container TUI Testing**
- Build Docker image from isolated project
- Run OpenCode TUI in container
- Verify `docker ps` shows real containers
- Confirm actual task execution
