# KRAKEN ENGINEER — ACTIVE CONTEXT LAUNCHPAD
**File:** `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md`
**Updated:** 2026-04-12 05:37

---

## CURRENT MISSION

Build and deploy **Kraken V2.0** with working compaction survival system.

---

## PROJECT LOCATIONS

- **Project:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/`
- **Plugin:** `~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js`
- **Checkpoint:** `/home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/checkpoint-2-kraken-v2.0-compaction/`
- **Context:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/`

---

## V2.0 OPTIMIZATIONS (5 Discoveries from Shark v4.8.3)

1. **Two-Layer Firewall** — Tool + Message enforcement
2. **Mechanical Output Verification** — fs.existsSync() checkpoints
3. **Structured Override Commands** — Typed schema
4. **Explicit Gate Criteria** — Per-brain requirements
5. **Dynamic Context Management** — Four-tier compaction (65/75/85%)

---

## JUST COMPLETED (Pre-Compaction Actions)

1. ✅ Rewrote hooks/index.ts with REAL OpenCode API:
   - `event` hook for `session.created` and `session.compacting`
   - `experimental.session.compacting` outputs to `output.context`
2. ✅ Built `buildCompactionContext()` function
3. ✅ Integrated `LAUNCHPAD_PATH` at `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/`
4. ✅ Compaction writes to `/tmp/kraken-compaction/{sessionID}/`
5. ✅ Deployed to plugin dir: `~/.config/opencode/plugins/kraken-agent-v2.0/`
6. ✅ Added to opencode.json plugin list

---

## HOOK MECHANICS (How Compaction Works)

### Event Hook
```
event.type === 'session.created' → Initialize brains, check recovery
event.type === 'session.compacting' → Write context to /tmp/kraken-compaction/
```

### Compaction Hook (`experimental.session.compacting`)
```
Input:  { sessionID: string }
Output: { context: string[] }

output.context.push(contextStr) → Appended to compaction prompt
```

### Compaction Context Flow
1. `session.compacting` fires (at ~85% tokens)
2. Hook reads LAUNCHPAD.md
3. Hook builds context string with decisions/tasks/gate
4. Context pushed to `output.context`
5. OpenCode appends context to compaction summary
6. After compaction, agent sees context in summary
7. `session.created` fires → reads `/tmp/kraken-compaction/` for recovery

---

## TOKEN THRESHOLDS (200k context window)

- 40% (~80k tokens): Current position
- 65% (~130k): Warning threshold
- 75% (~150k): Pre-compaction export trigger
- 85% (~170k): OPENCODE AUTO-COMPACTION

---

## NEXT IMMEDIATE ACTIONS

1. **Test in TUI** — Run container to verify plugin loads
2. **Trigger compaction** — Add content until 85% to test hook
3. **Verify recovery** — Check session.created reads recovery file

---

## RECENT DECISIONS LOG

| Time | Decision | Files |
|------|----------|-------|
| 05:37 | Fixed hooks to use real OpenCode API | hooks/index.ts |
| 05:37 | Added event hook for session lifecycle | hooks/index.ts |
| 05:37 | Built buildCompactionContext() | hooks/index.ts |
| 05:37 | Integrated LAUNCHPAD_PATH | hooks/index.ts |
| 05:37 | Deployed to plugin dir | ~/.config/opencode/plugins/ |
| 05:30 | Saved Checkpoint 2 | checkpoint-2-kraken-v2.0-compaction/ |

---

## ACTIVE FILES

1. `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src/hooks/index.ts`
2. `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src/brains/system/system-brain.ts`
3. `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src/brains/system/compaction-manager.ts`
4. `/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md`

---

## STREAM ANCHOR

**Current phase:** BUILD (testing compaction survival)
**Current gate:** BUILD
**Active task:** Testing Kraken V2.0 in TUI
**Next:** Verify plugin loads, test compaction hook fires

---

*After compaction: Read LAUNCHPAD.md first, then check /tmp/kraken-compaction/{sessionID}/INJECTION.md*
