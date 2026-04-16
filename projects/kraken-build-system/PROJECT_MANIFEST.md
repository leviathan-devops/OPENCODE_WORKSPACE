# PROJECT MANIFEST — KRAKEN UNIVERSAL BUILD SYSTEM

**Version:** 1.0 | **Date:** 2026-04-14
**Status:** ACTIVE — Universal template ready for use
**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system/`

---

## PURPOSE

This is a **universal build framework** for Kraken agents. It ensures:
- Zero-disruption builds via external context anchors
- Stream of consciousness survives crashes and compactions
- Every session resumes exactly where it left off
- Build progress is NEVER lost

---

## THE ONE RULE

**IF IT'S NOT REAL, IT'S NOT DONE.**

Every function must execute for real. Every fix must be verified. No theatrical placeholders.

---

## CRITICAL: READ THIS FIRST

**Every session start — execute:**

```bash
cat "/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system/compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md"
```

---

## QUICK START

### For a NEW project:

1. Copy this entire directory structure to your new project:
   ```bash
   cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system /home/leviathan/OPENCODE_WORKSPACE/projects/{new-project-name}/
   ```

2. Rename and customize:
   ```bash
   cd /home/leviathan/OPENCODE_WORKSPACE/projects/{new-project-name}/
   # Edit compaction-survival/01_SESSION_STATE_TRACKER.md with project details
   # Edit this PROJECT_MANIFEST.md
   ```

3. Start building:
   ```bash
   # Read the recovery protocol
   cat compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md
   
   # Begin your build...
   ```

### For CONTINUING a project:

1. Read session state:
   ```bash
   cat "compaction-survival/01_SESSION_STATE_TRACKER.md"
   ```

2. Read latest build log:
   ```bash
   tail -50 artifacts/BUILD_LOG.md
   ```

3. Resume work

---

## DIRECTORY STRUCTURE

```
(PROJECT_PATH)/
├── compaction-survival/           ← COMPACTION SURVIVAL ROOT
│   ├── 00_MASTER_RECOVERY_PROTOCOL.md
│   ├── 01_SESSION_STATE_TRACKER.md
│   ├── 02_COMPACTION_WORKFLOW.md
│   ├── 03_EXTERNAL_CONTEXT_ANCHORS.md
│   ├── 04_CHECKPOINT_SYSTEM.md
│   ├── HANDOVER_PACKAGES/
│   │   └── (auto-timestamped exports)
│   └── CHECKPOINTS/
│       └── (milestone-name/)
│           ├── BUILD_STATE.txt
│           └── CHECKSUMS.md5
├── artifacts/                     ← BUILD ARTIFACTS
│   ├── BUILD_LOG.md               ← Stream of consciousness
│   ├── CHANGE_LOG.md              ← Changes made
│   └── DEBUG_LOG.md               ← Errors and fixes
├── knowledge/                     ← KNOWLEDGE LIBRARY
│   ├── 00_INDEX.md
│   └── (topic files)
└── PROJECT_MANIFEST.md            ← THIS FILE
```

---

## KEY FILES

| File | Purpose | When to Read |
|------|---------|--------------|
| `compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md` | Full recovery system | Session start |
| `compaction-survival/01_SESSION_STATE_TRACKER.md` | Current state | Session start |
| `compaction-survival/02_COMPACTION_WORKFLOW.md` | Compaction survival | When compacted |
| `artifacts/BUILD_LOG.md` | Stream of consciousness | Always |
| `artifacts/CHANGE_LOG.md` | All changes | When needed |
| `artifacts/DEBUG_LOG.md` | Errors and solutions | When debugging |

---

## BUILD PHASES

- [ ] PLAN — Project planning
- [ ] BUILD — Implementation
- [ ] TEST — Testing and verification
- [ ] VERIFY — Final verification
- [ ] SHIP — Deployment/delivery

---

## STREAM OF CONSCIOUSNESS

The BUILD_LOG.md is the **primary stream of consciousness log**. Update it for every significant action:

```bash
echo "**[{TIMESTAMP}] {PHASE}:{ACTION}**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: {description}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Result: {outcome}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Next: {next step}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

## CHECKPOINT SCHEDULE

| Milestone | Action |
|-----------|--------|
| Before any major change | Create checkpoint |
| After any fix verified | Create checkpoint |
| Every 50-100K tokens | Create checkpoint |
| Before session end | Create checkpoint |

---

## COMPACTION SURVIVAL SCHEDULE

| Threshold | Action |
|-----------|--------|
| 65% (~110K tokens) | Light pruning (automatic) |
| 140-150K tokens | PRE-EXPORT (manual) |
| ~170-175K tokens | AUTO-COMPACT |
| Post-compact | Recovery via protocol |

---

## CURRENT PROJECT STATUS

| Field | Value |
|-------|-------|
| Project Name | Universal Build System Template |
| Project Path | /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system/ |
| Phase | READY FOR USE |
| Status | Universal template created |

---

## NEXT ACTIONS FOR NEW PROJECT

1. Copy template to new project directory
2. Update 01_SESSION_STATE_TRACKER.md with project details
3. Update this PROJECT_MANIFEST.md
4. Start building!

---

## KNOWLEDGE LIBRARY

See `knowledge/00_INDEX.md` for all topic-specific knowledge files.

---

**END OF PROJECT MANIFEST**
