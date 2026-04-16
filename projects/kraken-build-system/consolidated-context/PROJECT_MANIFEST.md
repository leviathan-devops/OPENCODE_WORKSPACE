# KRAKEN BUILD SYSTEM — Universal Template

**Version:** 2.0 | **Status:** ACTIVE
**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system/`

---

## PURPOSE

Zero-disruption builds via external context anchors. Stream of consciousness survives crashes and compactions.

---

## START HERE

**Every session start — execute FIRST:**

```bash
cat "/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system/consolidated-context/00_INDEX.md"
```

---

## DIRECTORY STRUCTURE

```
(PROJECT_PATH)/
├── compaction-survival/
│   ├── 00_INDEX.md           ← READ THIS FIRST
│   ├── 01_SESSION_STATE.md   ← Current state
│   ├── 02_RECOVERY.md        ← Mechanical recovery
│   ├── 03_CHECKPOINTS.md     ← Milestone saves (with CODE)
│   ├── 04_ARTIFACTS.md       ← How to use logs
│   ├── CHECKPOINTS/
│   │   └── {milestone-name}/
│   │       ├── BUILD_STATE.txt
│   │       ├── CHECKSUMS.md5
│   │       └── code-snapshot/  ← WORKING CODE COPY
│   └── HANDOVER_PACKAGES/
│       └── {handover-*/}
├── artifacts/
│   ├── BUILD_LOG.md          ← Stream of consciousness
│   ├── CHANGE_LOG.md         ← All changes
│   └── DEBUG_LOG.md          ← Errors and fixes
└── PROJECT_MANIFEST.md        ← This file
```

---

## CORE FILES

| File | Lines | Purpose |
|------|-------|---------|
| `00_INDEX.md` | ~150 | Entry point, navigation |
| `01_SESSION_STATE.md` | ~150 | Current build state |
| `02_RECOVERY.md` | ~300 | Mechanical recovery procedure |
| `03_CHECKPOINTS.md` | ~250 | Milestone saves with CODE snapshots |
| `04_ARTIFACTS.md` | ~100 | Log usage guide |

**Total:** ~950 lines — minimal, precise, complete

---

## RECOVERY WORKFLOW

```
COMPACTION HIT
    ↓
READ 00_INDEX.md
    ↓
READ 01_SESSION_STATE.md
    ↓
FRESH? (< 1 hour, < 50K tokens)
    ├── YES → Resume work
    └── NO → Find latest HANDOVER or CHECKPOINT
              ↓
         RESTORE from HANDOVER/CHECKPOINT
              ↓
         CHECKPOINT has code-snapshot/ ← WORKING CODE
              ↓
         RESTORE code if needed
              ↓
         LOG recovery in BUILD_LOG.md
              ↓
         RESUME
```

---

## TOKEN BUDGET

| Threshold | Action |
|-----------|--------|
| 65% (~110K) | Light pruning (automatic) |
| **140K** | **PRE-EXPORT** (create handover) |
| ~170K | AUTO-COMPACT |
| Post-compact | Recovery via 02_RECOVERY.md |

**Rule:** At 140K tokens, PRE-EXPORT. Don't wait.

---

## CHECKPOINT SYSTEM

Every milestone = checkpoint with **working code snapshot**:

```
CHECKPOINTS/{name}/
├── BUILD_STATE.txt     # State documentation
├── CHECKSUMS.md5       # Integrity verification
└── code-snapshot/      # WORKING CODE COPY
    ├── dist/index.js
    ├── src/
    └── wrappers/
```

**Restore command:**
```bash
cp -r "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint}/code-snapshot/"* \
      /path/to/project/
```

---

## ARTIFACTS

| Log | Purpose | Update |
|-----|---------|--------|
| BUILD_LOG.md | Stream of consciousness | EVERY action |
| CHANGE_LOG.md | What changed | EVERY change |
| DEBUG_LOG.md | Errors and fixes | EVERY error |

---

## FOR V2.0 BUILD

**Current:** BUILD phase — pre-ship debugging

**Next:**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build && bun run build
```

---

## COPY TO NEW PROJECT

```bash
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system \
      /home/leviathan/OPENCODE_WORKSPACE/projects/{YOUR_PROJECT}/
```

---

**END OF MANIFEST**
