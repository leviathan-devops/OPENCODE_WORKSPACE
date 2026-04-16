# SHARK AGENT V4.8.3 — COMPACTION-PROOF BUILD WORKFLOW

**Version:** 4.8.3 | **Purpose:** Build and verify Shark Agent v4.8.3

---

## 🚨 POST-COMPACTION RECOVERY

**READ THIS FIRST IF COMPACTED:**

1. Read `00_COMPACTION_PROOF_KNOWLEDGE_BASE.md` (this dir)
2. Read `03_SESSION_STATE_TRACKER.md`
3. Read `01_PROJECT_ANCHORS.md` for project structure
4. Resume from last decision point

---

## THE ONE RULE

**IF IT'S NOT MECHANICAL, IT'S NOT DONE.**

Theatrical tests verify file existence. Mechanical tests verify actual functionality.

---

## PROJECT STRUCTURE

**Project:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`

**Consolidated Project Space:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Projects/Shark Agent v4.8.3/`

**Ship Package:** `ship-package-FINAL/`

---

## V4.8.3 ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARK AGENT v4.8.3                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  GUARDIAN    │  │   GATE       │  │  COMPACTING  │     │
│  │    HOOK      │  │    HOOK      │  │    HOOK      │     │
│  │              │  │              │  │              │     │
│  │ L1: Theatrical│  │ Gate control │  │ Dynamic      │     │
│  │ L2: Skip     │  │              │  │ BUILD_CONTEXT│     │
│  │ L6: File     │  │              │  │ generation   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                   │             │
│         └─────────────────┼───────────────────┘             │
│                           │                                 │
│                    ┌──────┴──────┐                          │
│                    │   SESSION   │                          │
│                    │    HOOK     │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐               │
│         ▼                 ▼                 ▼               │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐       │
│  │   STATE    │    │   PEER     │    │  AGENT     │       │
│  │   STORE    │    │  DISPATCH  │    │ IDENTITY   │       │
│  └────────────┘    └────────────┘    └────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## TRIDENT BRAIN LAYERS (L0-L6)

| Layer | Name | Purpose |
|-------|------|---------|
| L0 | Session Integrity | Verify session state management |
| L1 | Theatrical Pattern Detection | Block fake success claims |
| L2 | Skip Container Detection | Prevent test bypass attempts |
| L3 | Build Context Integrity | Ensure dynamic context generation |
| L4 | Agent Identity Enforcement | Prevent identity spoofing |
| L5 | Anti-Derailment Gates | Block premature completion claims |
| L6 | File Protection | Prevent destructive operations |

---

## KEY FILES

| File | Purpose |
|------|---------|
| `src/hooks/v4.1/guardian-hook.ts` | L1/L2/L6 protection - check order FIXED |
| `src/hooks/v4.1/compacting-hook.ts` | Dynamic BUILD_CONTEXT generation |
| `src/shared/state-store.ts` | State management - duplicate domain FIXED |
| `src/tools/shark-gate.ts` | Gate control tool |
| `src/tools/shark-status.ts` | Status tool |
| `src/tools/shark-evidence.ts` | Evidence collection |
| `src/tools/shark-comprehensive-runner.js` | 34 mechanical test runner |

---

## BUGS FIXED IN THIS BUILD

1. **L1/L2 Check Order** — Moved L1/L2 checks BEFORE identity verification
2. **Package Identity** — Updated `manta-agent` → `shark-agent` v4.8.3
3. **Duplicate State Domain** — Removed duplicate `shark-context` in state-store
4. **Hardcoded BUILD_CONTEXT** — Replaced with dynamic `generateBuildContext()`
5. **L6 ANSI Codes** — Added `stripAnsi()` for test assertion handling

---

## COMPACTION TIER SYSTEM

| Threshold | Tier | Action |
|-----------|------|--------|
| ~110K | 0 | Light pruning (DynamicContextPruner) |
| 140-150K | 1 | PRE-EXPORT via hook |
| ~170-175K | 2 | AUTO-COMPACT (OpenCode native) |
| Post-compact | 3 | RELOAD from state tracker |

---

## ALIGNMENT BIBLE

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Master Context/`

**Key Rules:**
- Container-first testing mandatory
- Mechanical tests > theatrical tests
- No local file edits outside project directory
- Checkpoint at every major milestone

---

**Last Updated:** 2026-04-16T03:20 UTC