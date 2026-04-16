# COMPACTION SURVIVAL WORKFLOW

**Purpose:** Step-by-step guide for surviving context compactions and crashes

---

## OVERVIEW

OpenCode compacts context at ~170-175K tokens. This system ensures ZERO disruption to build progress.

### The Compaction Cycle

```
Normal Operation (0-65%)
    ↓
Tier 0: Light Pruning (65%)
    ↓
Tier 1: PRE-EXPORT (140-150K) ← YOU MUST DO THIS MANUALLY
    ↓
Tier 2: AUTO-COMPACT (~170-175K)
    ↓
Tier 3: RECOVERY (post-compact) ← Read this folder
```

---

## TIER 1: PRE-EXPORT (140-150K TOKENS)

### When to Trigger

Watch token count. At ~140K tokens, **STOP and do pre-export**:

```bash
# Check approximate token count
# If you're at 140K+ tokens, execute pre-export NOW
```

### Pre-Export Checklist

- [ ] **1. Update Session State Tracker**
  ```bash
  cat > "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE_TRACKER.md" << 'EOF'
  [Full current state - see template]
  EOF
  ```

- [ ] **2. Create Handover Package**
  ```bash
  HANDOVER_DIR="(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/HANDOVER_$(date +%Y%m%d_%H%M%S)"
  mkdir -p "${HANDOVER_DIR}"
  
  # Copy critical files
  cp "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE_TRACKER.md" "${HANDOVER_DIR}/"
  cp "(PROJECT_PATH)/compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md" "${HANDOVER_DIR}/"
  cp "(PROJECT_PATH)/artifacts/BUILD_LOG.md" "${HANDOVER_DIR}/"
  cp "(PROJECT_PATH)/artifacts/CHANGE_LOG.md" "${HANDOVER_DIR}/"
  
  # Create BUILD_STATE.txt
  cat > "${HANDOVER_DIR}/BUILD_STATE.txt" << 'EOF'
  === HANDOVER BUILD STATE ===
  Date: {CURRENT_DATE}
  Phase: {CURRENT_PHASE}
  Last Action: {LAST_ACTION}
  Next Action: {NEXT_ACTION}
  Files Modified: {LIST}
  Errors: {ANY_CURRENT_ERRORS}
  EOF
  ```

- [ ] **3. Create Checkpoint**
  ```bash
  CHECKPOINT_NAME="auto-precompact-$(date +%Y%m%d_%H%M%S)"
  mkdir -p "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}"
  cat > "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}/BUILD_STATE.txt" << 'EOF'
  [State at pre-compact]
  EOF
  ```

- [ ] **4. Update Build Log**
  ```bash
  echo "**[{TIMESTAMP}] SYSTEM:PRE-EXPORT**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
  echo "- What: Pre-compaction context export" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
  echo "- Handover: ${HANDOVER_DIR}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
  echo "- Checkpoint: ${CHECKPOINT_NAME}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
  echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
  ```

- [ ] **5. Verify Exports**
  ```bash
  ls -la "${HANDOVER_DIR}/"
  ls -la "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}/"
  ```

---

## TIER 2: AUTO-COMPACT

### What Happens

OpenCode compresses context to ~15%. You lose:
- Older chat history
- File contents that were in context
- Recent tool outputs

### What Is Preserved

- Files on disk
- Project directories
- External context anchors (BUILD_LOG, etc.)
- Checkpoints
- Handover packages

---

## TIER 3: POST-COMPACTION RECOVERY

### IMMEDIATE ACTIONS (First 30 seconds)

**Step 1: Read the Recovery Protocol**
```bash
cat "(PROJECT_PATH)/compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md"
```

**Step 2: Read Session State**
```bash
cat "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE_TRACKER.md"
```

**Step 3: Find Latest Handover**
```bash
ls -t "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/" | head -1
# Read that directory's BUILD_STATE.txt
```

**Step 4: Read Build Log (last 50 entries)**
```bash
tail -100 "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

**Step 5: Resume Work**
- Identify exactly what was happening
- Identify exact next step
- Execute next step
- Update session state

---

## CRASH RECOVERY (Hard Crash)

### If OpenCode Dies Completely

1. **Restart OpenCode**
2. **Load project context:**
   ```bash
   cat "(PROJECT_PATH)/compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md"
   ```
3. **Find most recent handover:**
   ```bash
   ls -t "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/" | head -1
   ```
4. **Read BUILD_STATE.txt from handover**
5. **Identify last action and next action**
6. **Resume**

---

## TOKEN ESTIMATION

### How to Track

```bash
# Approximate token count based on session history
# Rule of thumb: ~4 chars = 1 token
# A full terminal screen ≈ 2000 tokens

# Watch for these signs at ~140K tokens:
# - Response times slowing down
# - OpenCode mentioning context
# - Tool outputs getting truncated
```

### Automatic Reminder

Add to your workflow:
```
Every ~50 tool calls → Check token count
Every ~100 tool calls → Update session state
Every ~150 tool calls → PRE-EXPORT
```

---

## STREAM RESTORATION TEMPLATE

When recovering, add this to BUILD_LOG.md immediately:

```markdown
**[{RECOVERY_TIMESTAMP}] SYSTEM:CONTEXT_RESTORED**
- What: Post-compaction/crash recovery
- Preserved: {what survived}
- Lost: {what was lost}
- Was Doing: {last action before crash}
- Resuming: {next action}
- Stream: RESTORED
```

---

## EMERGENCY RECOVERY (If All Else Fails)

If you have NO context at all:

1. **Read PROJECT_MANIFEST.md** (exists in every project root)
2. **Read knowledge/00_INDEX.md** (lists all knowledge files)
3. **Read compaction-survival/01_SESSION_STATE_TRACKER.md** (should exist)
4. **Find latest checkpoint:**
   ```bash
   ls -t "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/" | head -1
   ```
5. **Read checkpoint BUILD_STATE.txt**
6. **Reconstruct from artifacts:**
   - BUILD_LOG.md = full stream history
   - CHANGE_LOG.md = all changes
   - DEBUG_LOG.md = all errors and fixes

---

## PREVENTION CHECKLIST

To minimize compaction disruption:

- [ ] Read 00_MASTER_RECOVERY_PROTOCOL.md at session start
- [ ] Update BUILD_LOG.md every significant action
- [ ] Update session state tracker every 20K tokens
- [ ] Pre-export at 140K tokens (Tier 1)
- [ ] Create checkpoint at every milestone
- [ ] Verify all anchors are current before major action
- [ ] Document errors in DEBUG_LOG.md immediately

---

## COMPACTION SURVIVAL RULE

**Treat compaction survival as equal priority to the build itself.**

If you can't maintain context, you can't maintain stream.
If you lose stream, you lose progress.

---

**END OF COMPACTION WORKFLOW**
