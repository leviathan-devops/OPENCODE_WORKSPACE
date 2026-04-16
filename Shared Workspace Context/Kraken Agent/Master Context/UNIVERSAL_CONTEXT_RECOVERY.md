# UNIVERSAL CONTEXT RECOVERY — For All Agents

**Version:** 1.0 | **Status:** ACTIVE | **Type:** Universal Recovery Protocol
**Applies To:** ALL Kraken agents, ALL projects

---

## THE PROBLEM

OpenCode compacts context at ~170K tokens. Without a recovery system, you LOSE:
- Stream of consciousness (what you were doing)
- Recent decisions and their rationale
- Current work state
- Error history and solutions
- Build progress

**Result:** Every crash/compaction resets you to zero.

---

## THE SOLUTION

**EXTERNAL CONTEXT ANCHORS** — files that live on disk, outside OpenCode's context.

When context compacts, these anchors PRESERVE your work. Any agent can read them and instantly know:
- What was being built
- Where the build was interrupted
- What to do next
- How to resume without losing progress

---

## ONE COMMAND TO RULE THEM ALL

```bash
# READ THIS FIRST on any session start
cat "/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system/compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md"
```

This single document contains EVERYTHING needed to recover from any crash or compaction.

---

## UNIVERSAL BUILD SYSTEM TEMPLATE

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system/`

This is a **copy-and-go template** for any project. It contains:

```
kraken-build-system/
├── compaction-survival/           ← YOUR LIFELine
│   ├── 00_MASTER_RECOVERY_PROTOCOL.md  ← READ THIS FIRST
│   ├── 01_SESSION_STATE_TRACKER.md     ← Current state (update every 20K tokens)
│   ├── 02_COMPACTION_WORKFLOW.md       ← 4-tier survival system
│   ├── 03_EXTERNAL_CONTEXT_ANCHORS.md  ← How anchors work
│   ├── 04_CHECKPOINT_SYSTEM.md         ← Milestone saves
│   ├── HANDOVER_PACKAGES/              ← Pre-compact exports
│   └── CHECKPOINTS/                    ← Milestone states
├── artifacts/                     ← STREAM OF CONSCIOUSNESS
│   ├── BUILD_LOG.md              ← Every action (APPEND ONLY)
│   ├── CHANGE_LOG.md             ← What changed
│   └── DEBUG_LOG.md              ← Errors and fixes
├── knowledge/                     ← Topic deep dives
│   └── 00_INDEX.md
└── PROJECT_MANIFEST.md
```

---

## HOW TO USE FOR ANY PROJECT

### Step 1: Copy the Template

```bash
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system \
      /home/leviathan/OPENCODE_WORKSPACE/projects/{YOUR_PROJECT_NAME}/
```

### Step 2: Customize Session State

Edit `compaction-survival/01_SESSION_STATE_TRACKER.md`:

```markdown
## CURRENT PROJECT
| Field | Value |
|-------|-------|
| Project Name | YOUR_PROJECT |
| Project Path | /path/to/your/project |
| Phase | PLAN/BUILD/TEST/VERIFY/SHIP |
| Status | What you're doing |
```

### Step 3: Start Building

```bash
# Always read this first
cat "compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md"

# Start your build...
```

---

## STREAM OF CONSCIOUSNESS

### What It Is

The **stream** is the continuous narrative of your build:

```markdown
**[(2026-04-14T20:15:00Z)] BUILD:FIX_PATHS**
- What: Fixed hardcoded paths in Python wrappers
- Where: src/wrappers/opencode_agent.py
- Result: SUCCESS — no more hardcoded paths
- Next: Rebuild bundle
```

### Why It Matters

When you crash, the stream tells you:
1. Exactly what was happening
2. Exactly what was interrupted
3. Exactly what to do next

### Maintaining the Stream

**EVERY action → BUILD_LOG.md:**

```bash
echo "**[{TIMESTAMP}] {PHASE}:{ACTION}**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: {description}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Where: {file/location}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Result: {outcome}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Next: {next step}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

## COMPACTION SURVIVAL WORKFLOW

### Tier 0: Light Pruning (65% context)
Automatic — OpenCode removes low-value context.

### Tier 1: PRE-EXPORT (140-150K tokens) ⚠️ DO THIS MANUALLY

**STOP and export at 140K tokens:**

1. Update `01_SESSION_STATE_TRACKER.md`
2. Create `HANDOVER_PACKAGES/{timestamp}/`
3. Create checkpoint
4. Update `BUILD_LOG.md`

### Tier 2: AUTO-COMPACT (~170K tokens)
Context compresses automatically. Your EXTERNAL anchors SURVIVE.

### Tier 3: POST-COMPACT RECOVERY

```bash
# 1. Read recovery protocol
cat "(PROJECT_PATH)/compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md"

# 2. Read session state
cat "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE_TRACKER.md"

# 3. Read latest handover
ls -t "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/" | head -1

# 4. Read stream
tail -100 "(PROJECT_PATH)/artifacts/BUILD_LOG.md"

# 5. Resume work
```

---

## CHECKPOINT SYSTEM

### When to Checkpoint

| Trigger | Action |
|---------|--------|
| Before major change | `mkdir -p compaction-survival/CHECKPOINTS/{name}` |
| After verified fix | Create checkpoint |
| Every 50-100K tokens | Create checkpoint |
| Before session end | Create checkpoint |

### Checkpoint Creation

```bash
CHECKPOINT_NAME="milestone-{name}-$(date +%Y%m%d_%H%M%S)"
mkdir -p "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}"

cat > "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}/BUILD_STATE.txt" << 'EOF'
=== CHECKPOINT ===
Date: {DATE}
Phase: {PHASE}
Status: {STATUS}
Last Action: {LAST_ACTION}
Next Action: {NEXT_ACTION}
EOF

# Save checksums
md5sum "(PROJECT_PATH)/build/dist/index.js" > "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}/CHECKSUMS.md5"

# Log it
echo "**[{TIMESTAMP}] SYSTEM:CHECKPOINT**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: Created checkpoint ${CHECKPOINT_NAME}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

## KNOWLEDGE ANCHORS

Beyond BUILD_LOG.md, create topic-specific knowledge files as needed:

```bash
cat > "(PROJECT_PATH)/knowledge/{TOPIC}.md" << 'EOF'
# {TOPIC NAME}

**Created:** {DATE}
**Status:** ACTIVE

## Summary
{2-3 sentence overview}

## Key Points
1. {point}
2. {point}

## Technical Details
{deep dive}

## Related
- Related file
- Related topic
EOF
```

---

## QUICK REFERENCE

| Need | Command |
|------|---------|
| Recovery Protocol | `cat compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md` |
| Session State | `cat compaction-survival/01_SESSION_STATE_TRACKER.md` |
| Stream of Consciousness | `tail -50 artifacts/BUILD_LOG.md` |
| Add to Stream | `echo "**ACTION**" >> artifacts/BUILD_LOG.md` |
| Create Checkpoint | `mkdir -p compaction-survival/CHECKPOINTS/{name}` |
| Find Latest Handover | `ls -t compaction-survival/HANDOVER_PACKAGES/ \| head -1` |
| Hardcoded Paths | `grep -rn "/home/leviathan" src/` |

---

## ANCHOR HIERARCHY

| Tier | Anchor | Purpose | When Updated |
|------|--------|---------|-------------|
| 1 | `00_MASTER_RECOVERY_PROTOCOL.md` | Universal recovery | Rarely |
| 1 | `01_SESSION_STATE_TRACKER.md` | Current state | Every 20K tokens |
| 2 | `artifacts/BUILD_LOG.md` | Stream of consciousness | Every action |
| 2 | `artifacts/CHANGE_LOG.md` | Changes made | Every change |
| 2 | `artifacts/DEBUG_LOG.md` | Errors and fixes | As they occur |
| 3 | `knowledge/*.md` | Topic deep dives | As needed |
| 4 | `CHECKPOINTS/{name}/` | Milestone states | At milestones |

---

## THE GOLDEN RULE

**COMPACTION SURVIVAL IS EQUAL PRIORITY TO THE BUILD.**

```
No context anchors → No stream of consciousness
No stream → No progress
No progress → Build fails
```

Treat the compaction survival system as seriously as the build itself.

---

## SESSION START CHECKLIST

Every session, every agent, every time:

- [ ] Read `compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md`
- [ ] Read `compaction-survival/01_SESSION_STATE_TRACKER.md`
- [ ] `tail -50 artifacts/BUILD_LOG.md`
- [ ] Check `HANDOVER_PACKAGES/` for recent exports
- [ ] Assess current state
- [ ] Resume work
- [ ] Update BUILD_LOG.md after every action

---

## FOR KRAKEN V2.0 SPECIFICALLY

**Current State:** BUILD phase interrupted — bundle needs rebuild

**Recovery Steps:**

```bash
# 1. Read this protocol
cat "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/UNIVERSAL_CONTEXT_RECOVERY.md"

# 2. Read v2.0 specific context
cat "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/QUICK_RECOVERY.md"

# 3. Rebuild bundle
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build && bun run build

# 4. Copy to ship package
cp dist/index.js /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/build/dist/

# 5. Verify
grep -n "/home/leviathan" /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/build/dist/index.js

# 6. Update logs
echo "**[(2026-04-14T20:45:00Z)] BUILD:BUNDLE_REBUILT**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: Rebuilt bundle after source path fixes" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Result: SUCCESS" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

## CONSOLIDATED SYSTEM (v2.0 — 2026-04-14)

**Location:** `projects/kraken-build-system/consolidated-context/`

**5 files, ~1,200 lines total:**

| File | Purpose |
|------|---------|
| `00_INDEX.md` | Entry point — READ FIRST |
| `01_SESSION_STATE.md` | Current build state |
| `02_RECOVERY.md` | Mechanical recovery procedure |
| `03_CHECKPOINTS.md` | Milestone saves with WORKING CODE |
| `04_ARTIFACTS.md` | Log usage (BUILD_LOG, CHANGE_LOG, DEBUG_LOG) |

**Key Feature:** Checkpoints include `code-snapshot/` — working copy of source files for full disaster recovery.

---

## HOW TO USE FOR ANY PROJECT

```bash
# Copy template
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system \
      /home/leviathan/OPENCODE_WORKSPACE/projects/{YOUR_PROJECT}/

# Start session
cat /home/leviathan/OPENCODE_WORKSPACE/projects/{YOUR_PROJECT}/consolidated-context/00_INDEX.md
```

---

## FILES CREATED

| File | Location | Purpose |
|------|----------|---------|
| `UNIVERSAL_CONTEXT_RECOVERY.md` | Master Context/ | This file — universal recovery |
| `CRASH_RECOVERY_AND_BUILD_CONTINUATION_PROTOCOL.md` | Master Context/ | Full v2.0 recovery (legacy) |
| `QUICK_RECOVERY.md` | Master Context/ | 30-second v2.0 restart (legacy) |
| Consolidated System | `projects/kraken-build-system/consolidated-context/` | **NEW** — 5-file core |

---

**END OF UNIVERSAL CONTEXT RECOVERY**
