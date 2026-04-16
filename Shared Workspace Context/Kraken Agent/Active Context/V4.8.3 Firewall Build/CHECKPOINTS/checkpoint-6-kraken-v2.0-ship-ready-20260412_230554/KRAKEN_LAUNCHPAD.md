# KRAKEN ENGINEER — ACTIVE CONTEXT LAUNCHPAD
**File:** `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md`
**Updated:** 2026-04-12 18:35

---

## CURRENT MISSION

Test and deploy **Kraken V2.0** with working identity wall, tool summarization, and compaction survival.

---

## PROJECT LOCATIONS

- **Active Build:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0-Build-Final/`
- **Plugin:** `/home/leviathan/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js`
- **Checkpoint:** `/home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/checkpoint-3-kraken-v2.0-with-token-fix/`
- **Context:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/`

---

## V2.0 SYSTEMS (What Needs Testing)

| System | Status | Test |
|--------|--------|------|
| Agent Identity Wall | ✅ Implemented | chat.message sets agent, hooks check |
| Tool Guardian (Layer 1) | ✅ Implemented | Blocks dangerous tools |
| Message Guardian (Layer 2) | ✅ Implemented | Pattern enforcement |
| Tool Summarization | ✅ FIXED | grep→~200 chars |
| Compaction Recovery | ✅ Fixed | Writes to FILE only |
| Session Cleanup | ✅ Implemented | session.ended cleanup |
| Gate Evaluation | ✅ Implemented | Per-brain criteria |

---

## CRITICAL BUG FOUND AND FIXED

**Bug:** `createToolSummarizerHook` was NOT imported in `src/index.ts`!

```typescript
// WRONG - missing import
import {
  createEventHook,
  createChatMessageHook,
  createToolGuardianHook,
  createGateHook,  // ← had this
  createCompactionHook,  // ← had this
  // createToolSummarizerHook  ← MISSING!
} from './hooks/index.js';
```

**Result:** Bundler tree-shook the function because it was undefined at compile time.

**Fix:**
```typescript
// CORRECT - all imports present
import {
  createEventHook,
  createChatMessageHook,
  createToolGuardianHook,
  createToolSummarizerHook,  // ← ADDED THIS
  createGateHook,
  createCompactionHook,
} from './hooks/index.js';
```

**Lesson:** Always verify ALL function imports are present, even in ESM bundling.

---

## HOOK EXECUTION ORDER

```
1. tool.execute.before  ← Identity wall + Tool enforcement
2. tool.execute.after   ← [ToolSummarizer, GateHook]
3. chat.message         ← Identity init + Message enforcement
4. session.compacting   ← File recovery ONLY (not context)
5. session.ended        ← Cleanup
```

---

## TEST PLAN

### Test 1: Plugin Loads
- [ ] Restart OpenCode
- [ ] Look for "kraken" in agent tab toggle
- [ ] Run `/kraken-status`

### Test 2: Identity Wall
- [ ] Select "kraken" agent
- [ ] Check kraken-status shows brain: kraken

### Test 3: Tool Summarization
- [ ] Run grep on large directory
- [ ] Verify output is summarized (~200 chars)

### Test 4: Compaction Survival
- [ ] Fill context to 85%
- [ ] Verify compaction fires
- [ ] Verify recovery works after compaction

---

## RECENT DECISIONS LOG

| Time | Decision | Files |
|------|----------|-------|
| 18:33 | Fixed missing import of createToolSummarizerHook | src/index.ts |
| 17:50 | Fixed identity wall - isKrakenAgent, setCurrentAgent | hooks/index.ts |
| 17:50 | Fixed compaction - file only, not context | hooks/index.ts |
| 17:50 | Added session.ended cleanup | hooks/index.ts |
| 17:50 | Built Kraken V2.0 checkpoint 3 | CHECKPOINTS/ |

---

## STREAM ANCHOR

**Current phase:** TEST (verifying V2.0 systems)
**Current gate:** BUILD
**Active task:** Testing Kraken V2.0 in local TUI
**Next:** Restart OpenCode, verify "kraken" agent appears

---

*After compaction: Read LAUNCHPAD.md first, then check /tmp/kraken-compaction/{sessionID}/INJECTION.md*
