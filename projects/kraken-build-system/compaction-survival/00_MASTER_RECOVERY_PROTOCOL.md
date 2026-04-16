# KRAKEN UNIVERSAL BUILD SYSTEM — v1.0

**Type:** Universal Build Framework for Kraken Agents  
**Purpose:** Ensure zero-disruption builds via external context anchors  
**Location:** This directory is the COMPACTION SURVIVAL ROOT for all projects

---

## THE ONE RULE

**IF IT'S NOT REAL, IT'S NOT DONE.**

Every function must execute for real. Every fix must be verified. No theatrical placeholders.

---

## CRITICAL: READ THIS FIRST

**Every session start — read THIS FILE first:**

```bash
cat "(PROJECT_PATH)/compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md"
```

This system ensures:
- Stream of consciousness NEVER dies
- Context survives crashes and compactions
- Build progress is NEVER lost
- Every session resumes exactly where it left off

---

## DIRECTORY STRUCTURE

```
(PROJECT_PATH)/
├── compaction-survival/           ← UNIVERSAL CONTEXT ANCHOR ROOT
│   ├── 00_MASTER_RECOVERY_PROTOCOL.md  ← READ THIS FIRST
│   ├── 01_SESSION_STATE_TRACKER.md      ← CURRENT STATE (update every 20K tokens)
│   ├── 02_COMPACTION_WORKFLOW.md        ← HOW TO SURVIVE COMPACTIONS
│   ├── 03_EXTERNAL_CONTEXT_ANCHORS.md   ← KNOWLEDGE ANCHOR SYSTEM
│   ├── 04_CHECKPOINT_SYSTEM.md          ← CHECKPOINT CREATION & USAGE
│   ├── HANDOVER_PACKAGES/               ← Pre-compaction exports
│   │   └── (auto-timestamped folders)
│   └── CHECKPOINTS/                     ← Named milestone saves
│       └── (milestone-name/)
│           ├── BUILD_STATE.txt
│           └── CHECKSUMS.md5
├── artifacts/                     ← BUILD ARTIFACTS
│   ├── BUILD_LOG.md               ← All build actions (append-only)
│   ├── CHANGE_LOG.md              ← Changes made
│   └── DEBUG_LOG.md               ← Debug info & errors
├── knowledge/                     ← EXTERNAL KNOWLEDGE ANCHORS
│   ├── 00_INDEX.md               ← Knowledge library index
│   └── (topic-specific files)
└── PROJECT_MANIFEST.md           ← This file
```

---

## SESSION START PROTOCOL

### Step 1: Read Master Recovery Protocol
```bash
cat "(PROJECT_PATH)/compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md"
```

### Step 2: Read Session State Tracker
```bash
cat "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE_TRACKER.md"
```

### Step 3: Check for Handover Packages
```bash
ls -t "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/" | head -1
```

### Step 4: Resume Work

---

## KNOWLEDGE ANCHOR SYSTEM

### What Are Knowledge Anchors?

Knowledge anchors are **external files** that preserve critical context outside of OpenCode's context window. They enable:

1. **Instant stream restoration** after compaction
2. **Cross-session continuity**
3. **Independent verification** of facts
4. **Distributed expertise** across agents

### Types of Knowledge Anchors

| Type | Purpose | Update Frequency |
|------|---------|------------------|
| `BUILD_LOG.md` | Stream of consciousness | Every action |
| `CHANGE_LOG.md` | What changed and why | Every change |
| `DEBUG_LOG.md` | Errors and solutions | As they occur |
| Topic files | Deep dives on specifics | As needed |
| Checkpoints | Milestone states | At milestones |

### Using Knowledge Anchors

**Writing to anchors:**
```bash
echo "**[(CURRENT_TIMESTAMP)] ACTION**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: description" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Result: outcome" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

**Reading anchors:**
```bash
tail -100 "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

## STREAM OF CONSCIOUSNESS

### What It Is

The "stream" is the continuous narrative:
- What you're building
- Why each decision was made
- Where you are in the build
- What failed and what worked
- What's next

### Why It Matters

When context compacts, you LOSE the narrative. The stream restoration system ensures:
1. You immediately know what was happening
2. You know what was interrupted
3. You know the exact next step
4. You can resume as if no crash occurred

### Stream Entry Template

```markdown
**[{TIMESTAMP}] {PHASE}:{ACTION}**
- What: {1-2 sentence description}
- Where: {file or location}
- Result: {Success/Failure/Partial}
- Next: {exact next step}
```

### Example Stream Entry

```markdown
**[(2026-04-14T20:15:00Z)] BUILD:REBUILD_BUNDLE**
- What: Rebuilt kraken-agent bundle after fixing hardcoded paths in source
- Where: /projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js
- Result: SUCCESS — MD5: abc123..., hardcoded paths removed
- Next: Copy rebuilt bundle to SHIP_KRAKEN_V2.0
```

---

## COMPACTION SURVIVAL WORKFLOW

### Tier 0: Light Pruning (65% context)
OpenCode DynamicContextPruner auto-removes low-value context.

### Tier 1: PRE-EXPORT (140-150K tokens)
**CRITICAL — DO THIS MANUALLY:**

1. Update session state tracker
2. Create handover package
3. Update build log
4. Create checkpoint

### Tier 2: AUTO-COMPACT (~170-175K tokens)
OpenCode native compaction fires. Context reduced to ~15%.

### Tier 3: POST-COMPACTION RECOVERY

**IMMEDIATE ACTIONS:**

1. Read this protocol (you're already doing it)
2. Read session state tracker
3. Read latest handover package
4. Read build log (last 100 entries)
5. Resume work

---

## CHECKPOINT SYSTEM

### When to Create Checkpoints

| Trigger | Action |
|---------|--------|
| Before any major change | Create checkpoint |
| After any fix verified | Create checkpoint |
| Every 50-100K tokens | Create checkpoint |
| Before session end | Create checkpoint |

### Checkpoint Creation

```bash
# Create milestone checkpoint
CHECKPOINT_NAME="milestone-$(date +%Y%m%d_%H%M%S)"
mkdir -p "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}"

# Export build state
cat > "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}/BUILD_STATE.txt" << 'EOF'
=== CHECKPOINT ===
Date: {CURRENT_DATE}
Phase: {CURRENT_PHASE}
Milestone: {MILESTONE_NAME}
Status: {STATUS}
Last Action: {LAST_ACTION}
Next Action: {NEXT_ACTION}
EOF

# Save checksums
md5sum "(PROJECT_PATH)/build/dist/index.js" > "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}/CHECKSUMS.md5"

# Update checkpoint manifest
echo "| ${CHECKPOINT_NAME} | $(date +%Y-%m-%d) | {STATUS} |" >> "(PROJECT_PATH)/compaction-survival/04_CHECKPOINT_SYSTEM.md"
```

---

## KNOWLEDGE LIBRARY

### Creating Topic Knowledge Files

```bash
cat > "(PROJECT_PATH)/knowledge/{TOPIC_NAME}.md" << 'EOF'
# {TOPIC NAME}

**Created:** {DATE}
**Updated:** {DATE}
**Status:** {DRAFT/ACTIVE/COMPLETED}

---

## SUMMARY

{Brief description of what this knowledge file covers}

---

## KEY POINTS

1. 
2. 
3. 

---

## RELATED

- Related topic file
- Related artifact

---

## LOG

| Date | Change |
|------|--------|
| {DATE} | Created |
EOF
```

### Knowledge Library Index

See `knowledge/00_INDEX.md` for all knowledge files.

---

## BUILD ARTIFACTS

### BUILD_LOG.md

**Purpose:** Append-only stream of consciousness log

**Format:** Every significant action gets an entry:
```markdown
**[{TIMESTAMP}] {PHASE}:{ACTION}**
- What: {description}
- Where: {file/location}
- Result: {outcome}
- Next: {next step}
```

### CHANGE_LOG.md

**Purpose:** Track all changes made

**Format:**
```markdown
## {DATE}

### Changed
| File | Change | Reason |
|------|--------|--------|
| {file} | {change} | {reason} |

### Added
| File | Purpose |
|------|---------|
| {file} | {purpose} |

### Removed
| File | Reason |
|------|--------|
| {file} | {reason} |
```

### DEBUG_LOG.md

**Purpose:** Track errors and solutions

**Format:**
```markdown
## {TIMESTAMP} — {ERROR_TYPE}

**Error:**
```
{error message}
```

**Location:** {file:line}

**Root Cause:** {cause}

**Fix Applied:** {fix}

**Verification:** {how verified}
```

---

## QUICK REFERENCE

### Essential Commands

```bash
# Session start
cat "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE_TRACKER.md"

# Stream entry
echo "**[{TIMESTAMP}] ACTION**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"

# Checkpoint
mkdir -p "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{name}"

# Hardcoded path check
grep -rn "/home/leviathan" src/ --include="*.ts" --include="*.py"

# Bundle checksum
md5sum build/dist/index.js

# Update session state
cat > "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE_TRACKER.md" << 'EOF'
{updated state}
EOF
```

---

## PROJECT-SPECIFIC SECTION

**Complete this section for each project:**

```
PROJECT NAME: 
PROJECT PATH: 
CURRENT PHASE: 
BUILD STATUS: 
LAST ACTION: 
NEXT ACTION: 
CHECKPOINT: 
```

---

## LAST UPDATE

**Date:** 2026-04-14  
**Event:** Universal build system created  
**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system/`

---

**END OF MASTER RECOVERY PROTOCOL**
