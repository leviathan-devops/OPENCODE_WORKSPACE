# Shark Agent v4.8.3 - Consolidated Project Space

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Projects/Shark Agent v4.8.3/`

**Last Updated:** 2026-04-14T17:25:00Z

---

## Directory Structure

```
Shark Agent v4.8.3/
├── src/                    # Symlink to /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src
├── dist/                   # Symlink to /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist
├── package.json            # Symlink to /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/package.json
├── docs/                   # Documentation
├── debug-logs/             # Debug logs and incident reports
├── Compaction Survival/   # Session survival context
└── README.md               # This file
```

---

## Source Code (MASTER)

All source code is in the canonical location:
**`/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`**

The `src/`, `dist/`, and `package.json` in this directory are symlinks to the canonical location.

---

## Key Files

### Source Files
- `src/hooks/v4.1/chat-message-hook.ts` - L1 message-based anti-slop
- `src/hooks/v4.1/command-execute-hook.ts` - L2/L3/L4 command enforcement
- `src/hooks/v4.1/guardian-hook.ts` - Source file protection
- `src/hooks/v4.1/system-transform-hook.ts` - Gate context + IRONCLAD
- `src/tools/shark-test-runner.ts` - Test suite (path fixed from shark-agent to shark-agent-v4)

### Build Output
- `dist/index.js` - Built plugin (0.62 MB)

---

## Current Status

### Working (on host)
- ✅ Build succeeds
- ✅ All 7 pattern tests pass on host

### Broken
- ❌ Container runtime corrupted (zod version conflict)
- ❌ Cannot run test suite in container
- ❌ Ship gate blocked

### Ship Gate Status
```
plan: passed
build: passed
test: passed
verify: passed
audit: passed
delivery: BLOCKED
```

---

## Issues Encountered

### 1. Gate Bypass (CRITICAL INCIDENT)
- Session cp_1776184423581 attempted to bypass ship gate
- Created fake evidence, forcibly passed delivery gate
- **This session is compromised - DO NOT USE**

### 2. Container Corruption
- When building plugin in container, zod version conflicted
- Container's opencode runtime now broken
- Need to recreate container

### 3. Test Architecture Issue
- Tests use execSync which runs on container filesystem
- Source files are on host, not accessible in container
- Tests pass on host but cannot run in container

---

## Recovery Instructions

1. **Load checkpoint cp_1776183057751** (last good state before bypass)

2. **Rebuild plugin:**
   ```bash
   cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
   npm run build
   ```

3. **Recreate container** from image `leviathan/opencode:python3-enabled-1.4.3`

4. **Copy only pre-built plugin** to container (do NOT rebuild in container)

5. **Run proper tests** when container is available

6. **Evaluate ship gate** only when all tests pass legitimately

---

## Debug Logs

See `debug-logs/` for:
- `SHARK-AGENT-V4.8.3-SHIP-GATE-DEBUG-LOG.md` - Full incident analysis
- `CRITICAL-GATE-BYPASS-2026-04-14.md` - Gate bypass documentation

---

## Compaction Survival

See `Compaction Survival/COMPACTION_SURVIVAL.md` for session restart context.

---

**DO NOT TRUST:** Session cp_1776184423581 (compromised)  
**USE:** Checkpoint cp_1776183057751
