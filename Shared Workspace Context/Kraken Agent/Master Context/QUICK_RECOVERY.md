# KRAKEN V2.0 — QUICK RECOVERY

**Version:** 2.0 | **For:** ANY session start after crash/compaction

---

## ONE COMMAND TO RULE THEM ALL

```bash
cat "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/CRASH_RECOVERY_AND_BUILD_CONTINUATION_PROTOCOL.md"
```

---

## WHERE WE ARE

**Project:** Kraken Agent v2.0 Ship Package  
**Phase:** BUILD complete, pre-ship debugging  
**Interrupted:** Bundle rebuild after source path fixes  
**Status:** NOT SHIP READY — hardcoded paths in bundle

---

## THE 3 THINGS THAT EXIST

1. **v2.0-retry/** — Has FIXED wrappers & source, OLD bundle
2. **SHIP_KRAKEN_V2.0/** — Generated but OUTDATED
3. **projects/kraken-v2.0-proper-build/** — Source project, NEEDS rebuild

---

## NEXT 5 MINUTES

```bash
# 1. Rebuild bundle
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build && bun run build

# 2. Copy fixed wrappers to ship
cp "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/kraken-agent-source/wrappers/"*.py \
   "/home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/kraken-agent-source/wrappers/"

# 3. Copy rebuilt bundle to ship
cp /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js \
   /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/build/dist/index.js

# 4. Verify no hardcoded paths
grep -n "/home/leviathan" /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/build/dist/index.js
# Should be empty or only comments

# 5. Build test container
cd /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0 && docker build -t kraken-v2.0-test:latest -f Dockerfile.test .
```

---

## WHAT WAS FIXED

| Component | Status | Location |
|-----------|--------|----------|
| Python wrapper paths | ✅ Fixed | `v2.0-retry/kraken-agent-source/wrappers/` |
| TypeScript source paths | ✅ Fixed | `v2.0-retry/kraken-agent-source/src/` |
| Bundle | ❌ OLD | `v2.0-retry/build/dist/index.js` |
| Ship package | ❌ OLD | `SHIP_KRAKEN_V2.0/` |

---

## KEY PATHS

```
Ship Package:  /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/
Project:       /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/
Fixed Source:  .../Working Project Space/v2.0-retry/kraken-agent-source/
Session State: .../COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md
Full Protocol: .../Master Context/CRASH_RECOVERY_AND_BUILD_CONTINUATION_PROTOCOL.md
```

---

## STREAM OF CONSCIOUSNESS (1 sentence)

Rebuilding bundle after fixing hardcoded `/home/leviathan/` paths in Python wrappers and TypeScript source. Ship package needs updated bundle + wrappers.

---

## CHECKPOINT SYSTEM

```bash
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/.checkpoints/{name}
```

---

**Full protocol:** `Master Context/CRASH_RECOVERY_AND_BUILD_CONTINUATION_PROTOCOL.md`
