# CHECKPOINT SYSTEM

**Purpose:** Create frozen milestone states that survive crashes and compactions

---

## WHAT ARE CHECKPOINTS

Checkpoints are **directory snapshots** of the build state at key milestones. They include:
- BUILD_STATE.txt — Human-readable state summary
- CHECKSUMS.md5 — File integrity verification
- Optional: copies of critical files

---

## CHECKPOINT TYPES

### 1. MILESTONE CHECKPOINTS
Created at significant build achievements.

```bash
mkdir -p "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/milestone-{name}/"
```

**When:**
- After completing a major feature
- After fixing a critical bug
- Before attempting risky changes
- After verified test suite passes

### 2. PRE-ACTION CHECKPOINTS
Created before risky or irreversible actions.

```bash
mkdir -p "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/pre-{action-name}/"
```

**When:**
- Before bundle rebuild
- Before database migration
- Before architecture changes
- Before any "point of no return" action

### 3. AUTO-EXPORT CHECKPOINTS
Created automatically during pre-export at 140K tokens.

```bash
mkdir -p "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/auto-precompact-{timestamp}/"
```

### 4. END-OF-SESSION CHECKPOINTS
Created before ending session.

```bash
mkdir -p "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/eos-{date}/"
```

---

## CHECKPOINT CREATION PROCEDURE

### Standard Checkpoint

```bash
# 1. Choose checkpoint name
CHECKPOINT_NAME="milestone-{descriptive-name}-$(date +%Y%m%d_%H%M%S)"
CHECKPOINT_DIR="(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}"

# 2. Create directory
mkdir -p "${CHECKPOINT_DIR}"

# 3. Create BUILD_STATE.txt
cat > "${CHECKPOINT_DIR}/BUILD_STATE.txt" << 'EOF'
=== CHECKPOINT: {CHECKPOINT_NAME} ===
Date: {CURRENT_DATE}
Phase: {CURRENT_PHASE}
Milestone: {MILESTONE_NAME}

STATUS:
- What was completed: {description}
- Current state: {description}
- What's working: {list}

NEXT:
- Immediate next action: {action}
- Future milestones: {list}

CRITICAL FILES:
- Modified: {list}
- Created: {list}
- Deleted: {list}

ERRORS:
- Known issues: {list}
- Outstanding: {list}
EOF

# 4. Save checksums of critical files
cat > "${CHECKPOINT_DIR}/CHECKSUMS.md5" << 'EOF'
# Checksums at checkpoint {CHECKPOINT_NAME}
EOF
md5sum "(PROJECT_PATH)/build/dist/index.js" >> "${CHECKPOINT_DIR}/CHECKSUMS.md5" 2>/dev/null
md5sum "(PROJECT_PATH)/src/**/*.ts" >> "${CHECKPOINT_DIR}/CHECKSUMS.md5" 2>/dev/null

# 5. Update checkpoint manifest (this file)
echo "| ${CHECKPOINT_NAME} | $(date +%Y-%m-%d) | ${PHASE} | ${STATUS} |" >> "(PROJECT_PATH)/compaction-survival/04_CHECKPOINT_SYSTEM.md"

# 6. Update session state tracker
# (See 01_SESSION_STATE_TRACKER.md)

# 7. Log to BUILD_LOG.md
echo "**[{TIMESTAMP}] SYSTEM:CHECKPOINT**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: Created checkpoint ${CHECKPOINT_NAME}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Location: ${CHECKPOINT_DIR}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Phase: ${PHASE}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

## CHECKPOINT VERIFICATION

### Verify File Integrity

```bash
# Check checksums match
cd "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint-name}/"

# Compare current checksums to saved
md5sum -c CHECKSUMS.md5

# Any failures will be flagged
```

### Restore from Checkpoint

```bash
# 1. Read BUILD_STATE.txt to understand the state
cat "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint-name}/BUILD_STATE.txt"

# 2. If needed, restore specific files:
# cp "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint-name}/file" "(PROJECT_PATH)/"

# 3. Verify restoration
md5sum "(PROJECT_PATH)/build/dist/index.js"
# Compare to CHECKSUMS.md5
```

---

## CHECKPOINT MANIFEST

| Checkpoint | Date | Phase | Status |
|------------|------|-------|--------|
| | | | |

---

## CHECKPOINT vs HANDOVER

| Aspect | Checkpoint | Handover |
|--------|-------------|----------|
| Purpose | Milestone freeze | Pre-compact export |
| Content | State + checksums | Full context bundle |
| Size | Small (KB) | Medium (MB) |
| Frequency | Per milestone | Per compaction |
| Auto-created | No | Yes (at 140K tokens) |

---

## BEST PRACTICES

### DO

- Create checkpoint BEFORE risky actions
- Include descriptive checkpoint names
- Always save checksums
- Update checkpoint manifest
- Log checkpoint creation in BUILD_LOG.md

### DON'T

- Skip checkpoints before major changes
- Create checkpoint without updating session state
- Delete old checkpoints (they're cheap storage)
- Rely solely on checkpoints (still update BUILD_LOG.md)

---

## RECOVERY FROM CHECKPOINT

### Scenario: Bundle rebuild failed

1. Find relevant pre-action checkpoint:
   ```bash
   ls -la "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/" | grep pre-
   ```

2. Read BUILD_STATE.txt:
   ```bash
   cat "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/pre-bundle-rebuild/BUILD_STATE.txt"
   ```

3. Restore original bundle:
   ```bash
   # Find original checksum
   grep "dist/index.js" "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/pre-bundle-rebuild/CHECKSUMS.md5"
   
   # Copy from checkpoint if backed up
   # Or rebuild from source
   ```

4. Resume from checkpoint state

---

## AUTOMATED CHECKPOINTING

### Session Start Auto-Check

On session start, check if current state matches latest checkpoint:

```bash
# Get latest checkpoint
LATEST=$(ls -t "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/" | head -1)

# Read state
cat "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${LATEST}/BUILD_STATE.txt"

# If current state differs significantly, create new checkpoint
# before proceeding
```

---

## CHECKPOINT STORAGE

Checkpoints are designed to be small. Guidelines:

| Content | Approximate Size |
|---------|------------------|
| BUILD_STATE.txt | 1-2 KB |
| CHECKSUMS.md5 | < 1 KB |
| Critical file copies | As needed |

**Total typical checkpoint:** < 10 KB

**Recommended retention:** All checkpoints (disk is cheap)

---

**END OF CHECKPOINT SYSTEM**
