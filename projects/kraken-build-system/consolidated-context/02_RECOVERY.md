# MECHANICAL RECOVERY PROCEDURE

**Version:** 2.0 | **Type:** Machine-readable recovery

---

## PURPOSE

This file contains a **MECHANICAL procedure** for recovering from crashes and compactions. No judgment required. Follow the steps.

---

## RECOVERY DECISION TREE

```
START
  │
  ▼
Is context FRESH?
  │
  ├─► YES → Resume from SESSION_STATE.md
  │         Update timestamp, log recovery, continue
  │
  └─► NO (stale) → Find latest HANDOVER
              │
              ▼
         Does HANDOVER exist?
              │
              ├─► YES → Restore from HANDOVER
              │         Update SESSION_STATE.md
              │         Log recovery
              │         Continue
              │
              └─► NO → Rebuild from CHECKPOINTS
                        │
                        ▼
                   Does CHECKPOINT exist?
                        │
                        ├─► YES → Restore from CHECKPOINT
                        │         Rebuild state
                        │         Continue
                        │
                        └─► NO → FATAL ERROR
                                  (No recovery possible)
```

---

## DEFINITIONS

### FRESH vs STALE

| Condition |判定 | Action |
|-----------|------|--------|
| Session state timestamp < 1 hour | FRESH | Resume |
| Session state timestamp > 1 hour | STALE | Handover |
| Tokens since last update < 50K | FRESH | Resume |
| Tokens since last update > 50K | STALE | Handover |
| BUILD_LOG.md gap > 1 hour | STALE | Handover |

### HANDOVER vs CHECKPOINT

| Type | When | Contents |
|------|------|----------|
| HANDOVER | Pre-export at 140K tokens | Full context snapshot |
| CHECKPOINT | Milestones | State + checksums |

---

## MECHANICAL RECOVERY STEPS

### STEP 1: ASSESS FRESHNESS (30 seconds)

```bash
# Read session state
cat "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE.md"

# Check timestamp (look for "Updated:" line)
# Check tokens since (look for "Tokens Since:" line)

# Decision: FRESH or STALE?
```

**If FRESH:**
```
→ Go to STEP 4: RESUME
```

**If STALE:**
```
→ Go to STEP 2: FIND HANDOVER
```

---

### STEP 2: FIND LATEST HANDOVER (1 minute)

```bash
# List handover packages by date
ls -t "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/" | head -1

# Read the latest one
LATEST=$(ls -t "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/" | head -1)
cat "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/${LATEST}/SESSION_STATE.md"
```

**If HANDOVER exists:**
```
→ Go to STEP 3: RESTORE
```

**If NO HANDOVER:**
```
→ Go to STEP 2b: FIND CHECKPOINT
```

---

### STEP 2b: FIND LATEST CHECKPOINT (1 minute)

```bash
# List checkpoints by date
ls -t "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/" | head -1

# Read checkpoint state
LATEST=$(ls -t "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/" | head -1)
cat "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${LATEST}/BUILD_STATE.txt"
```

**If CHECKPOINT exists:**
```
→ Go to STEP 3b: RESTORE FROM CHECKPOINT
```

**If NO CHECKPOINT:**
```
→ FATAL ERROR: Cannot recover
→ Log to BUILD_LOG.md: "RECOVERY FAILED: No handover or checkpoint found"
→ Exit
```

---

### STEP 3: RESTORE FROM HANDOVER (2 minutes)

```bash
# Copy session state from handover
cp "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/${LATEST}/SESSION_STATE.md" \
   "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE.md"

# Restore any other critical files
cp "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/${LATEST}/BUILD_LOG.md" \
   "(PROJECT_PATH)/artifacts/BUILD_LOG.md" 2>/dev/null || true

# Update timestamp in SESSION_STATE.md
# (Replace "Updated:" line with current time)

# Verify restoration
head -20 "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE.md"
```

**Success:**
```
→ Go to STEP 4: LOG RECOVERY
```

---

### STEP 3b: RESTORE FROM CHECKPOINT (3 minutes)

```bash
# Read checkpoint state
cat "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${LATEST}/BUILD_STATE.txt"

# Extract:
# - Last Action
# - Next Action
# - Phase
# - Milestone

# Reconstruct SESSION_STATE.md manually:
# 1. Copy template
# 2. Fill in from BUILD_STATE.txt
# 3. Set "Restored from checkpoint" flag
# 4. Set current timestamp

# Optionally restore files from checkpoint
# (if CHECKSUMS.md5 shows discrepancies)
```

**Success:**
```
→ Go to STEP 4: LOG RECOVERY
```

---

### STEP 4: LOG RECOVERY (1 minute)

```bash
# Append recovery entry to BUILD_LOG.md
echo "**[(CURRENT_TIMESTAMP)] SYSTEM:CONTEXT_RESTORED**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: Post-compaction/crash recovery" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Restored From: {HANDOVER or CHECKPOINT}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Was Doing: {last action before crash}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Resuming: {next action}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Stream: RESTORED" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"

# Update SESSION_STATE.md timestamp
# (Update "Updated:" line with current time)
# (Reset "Tokens Since" counter)
```

---

### STEP 5: RESUME (Begin Work)

```bash
# Read next action from SESSION_STATE.md
# (Look for "NEXT ACTIONS" section)

# Execute next action

# After completing action:
# → Log result to BUILD_LOG.md
# → Update SESSION_STATE.md
# → Create checkpoint if at milestone
```

---

## PRE-EXPORT PROCEDURE (Tier 1)

**When:** At 140K tokens — BEFORE compaction

```bash
# 1. Update SESSION_STATE.md
#    - Set "Updated:" to current time
#    - Note "NEXT ACTIONS"

# 2. Create HANDOVER_PACKAGE
HANDOVER_DIR="(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/handover-$(date +%Y%m%d_%H%M%S)"
mkdir -p "${HANDOVER_DIR}"

# 3. Copy critical files
cp "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE.md" "${HANDOVER_DIR}/"
cp "(PROJECT_PATH)/artifacts/BUILD_LOG.md" "${HANDOVER_DIR}/"
cp "(PROJECT_PATH)/artifacts/CHANGE_LOG.md" "${HANDOVER_DIR}/"
cp "(PROJECT_PATH)/artifacts/DEBUG_LOG.md" "${HANDOVER_DIR}/"

# 4. Create BUILD_STATE.txt
cat > "${HANDOVER_DIR}/BUILD_STATE.txt" << 'EOF'
=== HANDOVER ===
Date: {CURRENT_DATE}
Phase: {CURRENT_PHASE}
Last Action: {LAST_ACTION}
Next Action: {NEXT_ACTION}
Token Count: ~{ESTIMATED_TOKENS}
EOF

# 5. Log to BUILD_LOG.md
echo "**[(CURRENT_TIMESTAMP)] SYSTEM:PRE-EXPORT**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: Pre-compaction context export" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Handover: ${HANDOVER_DIR}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

## POST-COMPACTION TEMPLATE

When you recover, add this to BUILD_LOG.md:

```markdown
**[{TIMESTAMP}] SYSTEM:CONTEXT_RESTORED**
- What: Post-compaction/crash recovery
- Restored From: {HANDOVER/CHECKPOINT name}
- Time Gap: {how long since last update}
- Was Doing: {last action before crash}
- Resuming: {next action}
- Stream: RESTORED
```

---

## TOKEN ESTIMATION

```bash
# Rough estimation
# 1 terminal screen ≈ 2,000 tokens
# 1 file read (200 lines) ≈ 500 tokens
# 1 tool output ≈ 500-2000 tokens

# Watch for:
# - Response times slowing
# - OpenCode mentioning context
# - Tool outputs truncating
```

---

## RECOVERY VERIFICATION

After recovery, verify you're back on track:

```bash
# 1. Read SESSION_STATE.md — Does it make sense?
head -30 "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE.md"

# 2. Read last 10 BUILD_LOG entries — Is stream intact?
tail -20 "(PROJECT_PATH)/artifacts/BUILD_LOG.md"

# 3. Do the NEXT ACTIONS in SESSION_STATE.md make sense?
#    - Is the next action achievable?
#    - Do you have the files/tools needed?

# 4. Execute next action
```

---

## ERROR HANDLING

| Scenario | Action |
|----------|--------|
| No HANDOVER, no CHECKPOINT | FATAL — Log and exit |
| HANDOVER corrupted | Try CHECKPOINT |
| CHECKPOINT corrupted | Try earlier CHECKPOINT |
| All checkpoints failed | FATAL — Log and exit |
| File missing | Restore from git/handover if possible |
| State contradictory | Trust BUILD_LOG.md, rebuild state |

---

## QUICK REFERENCE CARD

```bash
# FRESH? Check session state timestamp
stat -c %Y "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE.md"

# Find latest handover
ls -t "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/" | head -1

# Find latest checkpoint
ls -t "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/" | head -1

# Recovery entry
echo "**SYSTEM:CONTEXT_RESTORED**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

**END OF MECHANICAL RECOVERY**
