# POST-COMPACTION RECOVERY SYSTEM PROMPT

**SYSTEM PROMPT FOR POST-COMPACTION CONTEXT REINJECTION**

---

## IMMEDIATE ACTION REQUIRED

You just experienced a context compaction. Your context has been reduced.

**DO NOT continue working until you have read:**
1. `00_COMPACTION_PROOF_KNOWLEDGE_BASE.md` (this directory)
2. `03_SESSION_STATE_TRACKER.md` (where we were)

---

## WHAT HAPPENED

Context compaction reduces your working context to ~15% of previous size. Older messages and files are deleted.

**Your stream of consciousness was interrupted.**

---

## RECOVERY PROTOCOL

### Step 1: Read Knowledge Base
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/00_COMPACTION_PROOF_KNOWLEDGE_BASE.md
```

### Step 2: Read Session State
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md
```

### Step 3: Check for Recent Exports
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/EXPORTS/
```

---

## WHAT WAS LOST (TYPICALLY)

- Older chat history
- File contents that were in context
- Tool outputs from earlier tasks

## WHAT WAS PRESERVED

- Files on disk (NOT in context)
- Project directories
- Dist files

---

## WHERE WE WERE

**Project:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/`

**Current Phase:** BUILD (fixing wrapper daemon execute endpoint)

**Issue:** Wrapper daemon returns `success: false` on execute endpoint

**Next:** Debug why execute endpoint fails when health works

---

## THE ONE RULE (ALWAYS)

**IF IT'S NOT REAL, IT'S NOT DONE.**

Every function must do what it says. Every tool must execute for real.

---

## COMPACTION THRESHOLDS (KNOW THESE)

| Threshold | Action |
|-----------|--------|
| 65% | Light pruning (Tier 0) |
| 75% | **PRE-EXPORT** (Tier 1) |
| 85% | **AUTO-COMPACTION** (Tier 2) |

**Next time: Export at 75% BEFORE compaction hits.**

---

## LIGHTWEIGHT REINJECTION (TIER 3)

After recovery, context reinjection should be **lightweight**:

- Current gate (PLAN/BUILD/TEST/VERIFY)
- 1-2 sentences on what was happening
- 1-2 sentences on what comes next
- Critical file paths only

**NOT** a full context dump. Just decision points.

---

## TO CONTINUE

After reading the knowledge base and session state:

1. Document where you stopped
2. Continue from the last decision point
3. Update `03_SESSION_STATE_TRACKER.md` with where you are now

---

## FILES TO KNOW

- Knowledge Base: `COMPACTION SURVIVAL/00_COMPACTION_PROOF_KNOWLEDGE_BASE.md`
- Session State: `COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md`
- V2.0 Architecture: `V2.0 Optimized/Working Context Library/01_ARCHITECTURE_OVERVIEW.md`

---

**END OF POST-COMPACTION SYSTEM PROMPT**