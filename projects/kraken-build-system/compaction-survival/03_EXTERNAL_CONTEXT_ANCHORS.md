# EXTERNAL CONTEXT ANCHORS

**Purpose:** Define all external files that preserve context outside of OpenCode's context window

---

## THE PROBLEM

OpenCode compacts at ~170K tokens. Everything in context is at risk. The solution: **external anchors** — files that live on disk and preserve context.

---

## ANCHOR HIERARCHY

### Tier 0: EPHEMERAL (In-Context Only)
- Current working context
- Recent tool outputs
- Active discussions

### Tier 1: CRITICAL (Compaction Survival Folder)
**Must survive compaction. Read on EVERY session start.**

| File | Purpose | Update |
|------|---------|--------|
| `00_MASTER_RECOVERY_PROTOCOL.md` | Universal recovery system | Rarely |
| `01_SESSION_STATE_TRACKER.md` | Current session state | Every 20K tokens |
| `02_COMPACTION_WORKFLOW.md` | Recovery procedures | Rarely |
| `03_EXTERNAL_CONTEXT_ANCHORS.md` | This file | Rarely |
| `04_CHECKPOINT_SYSTEM.md` | Checkpoint procedures | Rarely |

### Tier 2: ARTIFACTS (Build Products)
**Append-only logs that preserve stream of consciousness.**

| File | Purpose | Update |
|------|---------|--------|
| `artifacts/BUILD_LOG.md` | Full action stream | Every action |
| `artifacts/CHANGE_LOG.md` | All changes | Every change |
| `artifacts/DEBUG_LOG.md` | Errors and fixes | As they occur |

### Tier 3: KNOWLEDGE (Topic-Specific Deep Dives)
**Deep expertise on specific topics. Created as needed.**

| File | Purpose | Update |
|------|---------|--------|
| `knowledge/00_INDEX.md` | Knowledge library index | When adding files |
| `knowledge/{TOPIC}.md` | Topic-specific knowledge | As needed |

### Tier 4: CHECKPOINTS (Milestone Saves)
**Frozen states at key milestones.**

| Location | Purpose |
|----------|---------|
| `compaction-survival/CHECKPOINTS/{name}/` | Named milestone saves |
| `compaction-survival/HANDOVER_PACKAGES/{name}/` | Pre-compact exports |

---

## HOW TO USE ANCHORS

### Writing to Anchors

**Every significant action → BUILD_LOG.md:**
```bash
echo "**[{TIMESTAMP}] {PHASE}:{ACTION}**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: {description}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Where: {file/location}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Result: {outcome}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Next: {next step}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

**Every change → CHANGE_LOG.md:**
```bash
echo "### Changed" >> "(PROJECT_PATH)/artifacts/CHANGE_LOG.md"
echo "| {file} | {change} | {reason} |" >> "(PROJECT_PATH)/artifacts/CHANGE_LOG.md"
```

**Every error → DEBUG_LOG.md:**
```bash
echo "## {TIMESTAMP} — {ERROR_TYPE}" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "**Error:**" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "\`\`\`" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "{error}" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "\`\`\`" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "**Fix:** {fix}" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
```

**Every 20K tokens → Session State Tracker:**
```bash
# Update 01_SESSION_STATE_TRACKER.md with current state
```

### Reading Anchors

**Session start:**
```bash
# Read session state (30 seconds)
cat "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE_TRACKER.md"

# Read stream (2 minutes)
tail -100 "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

**After compaction:**
```bash
# Read recovery protocol (1 minute)
cat "(PROJECT_PATH)/compaction-survival/00_MASTER_RECOVERY_PROTOCOL.md"

# Read handover state (1 minute)
cat "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/"*/BUILD_STATE.txt

# Reconstruct from stream (5 minutes)
tail -500 "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

## ANCHOR DEPENDENCIES

```
Session Start
    ↓
Read 01_SESSION_STATE_TRACKER.md
    ↓
Read artifacts/BUILD_LOG.md (last 100 entries)
    ↓
Resume Work
    ↓
Every Action → Update BUILD_LOG.md
    ↓
Every 20K tokens → Update Session State
    ↓
Every Milestone → Create Checkpoint
    ↓
At 140K tokens → PRE-EXPORT to HANDOVER_PACKAGES
    ↓
COMPACTION HITS
    ↓
Read 00_MASTER_RECOVERY_PROTOCOL.md
    ↓
Read Latest Handover
    ↓
Read BUILD_LOG.md
    ↓
STREAM RESTORED → Resume Work
```

---

## ANCHOR QUALITY STANDARDS

### BUILD_LOG.md

**DO:**
- Write entries for EVERY significant action
- Include exact file paths
- Include checksums for verification
- Include "what failed" and "what worked"
- Include exact next action

**DON'T:**
- Leave gaps in the stream
- Write vague entries ("did stuff")
- Skip failed actions
- Forget to mark continuation of multi-step fixes

### CHANGE_LOG.md

**DO:**
- Track every file created/modified/deleted
- Include reason for change
- Link to related errors in DEBUG_LOG.md

**DON'T:**
- Leave unexplained changes
- Lose the "why" behind modifications

### DEBUG_LOG.md

**DO:**
- Record EVERY error immediately
- Include exact error messages
- Include file:line when known
- Document root cause
- Document fix applied
- Document verification method

**DON'T:**
- Ignore "minor" errors
- Forget to verify fix
- Lose stack traces

---

## ANCHOR MAINTENANCE

### Token Budget Allocation

| Anchor | Tokens to Maintain |
|--------|-------------------|
| BUILD_LOG.md | ~500 tokens/week |
| CHANGE_LOG.md | ~300 tokens/week |
| DEBUG_LOG.md | ~200 tokens/week |
| Session State | ~400 tokens/update |

**Total anchor overhead:** ~1.5K tokens/week (negligible)

### Archiving Old Entries

When logs get large (>1000 entries), archive oldest entries:

```bash
# Archive entries older than 30 days
ARCHIVE_DIR="(PROJECT_PATH)/artifacts/archive/"
mkdir -p "${ARCHIVE_DIR}"

# Move old entries to archive
mv "(PROJECT_PATH)/artifacts/BUILD_LOG.md" "(PROJECT_PATH)/artifacts/BUILD_LOG.md.tmp"
head -100 "(PROJECT_PATH)/artifacts/BUILD_LOG.md.tmp" > "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
tail -n +101 "(PROJECT_PATH)/artifacts/BUILD_LOG.md.tmp" > "${ARCHIVE_DIR}/BUILD_LOG_$(date +%Y%m).md"
rm "(PROJECT_PATH)/artifacts/BUILD_LOG.md.tmp"
```

---

## KNOWLEDGE LIBRARY

### When to Create Knowledge Files

| Situation | Action |
|-----------|--------|
| Deep technical topic | Create knowledge file |
| Complex algorithm | Create knowledge file |
| Multi-session investigation | Create knowledge file |
| Important decision made | Document in knowledge file |

### Knowledge File Template

```markdown
# {TOPIC NAME}

**Created:** {DATE}
**Updated:** {DATE}
**Status:** DRAFT/ACTIVE/COMPLETED
**Confidence:** LOW/MEDIUM/HIGH

---

## SUMMARY

{2-3 sentence overview}

---

## BACKGROUND

{Why this topic matters}

---

## KEY CONCEPTS

### {Concept 1}
{Explanation}

### {Concept 2}
{Explanation}

---

## TECHNICAL DETAILS

{Deep dive on specifics}

---

## DECISIONS LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| {DATE} | {decision} | {rationale} |

---

## OPEN QUESTIONS

1. {question}
2. {question}

---

## RELATED

- Related file
- Related topic

---

## LOG

| Date | Change |
|------|--------|
| {DATE} | Created |
```

---

## ANCHOR RECOVERY TEST

After any session update, verify anchors are readable:

```bash
# Quick health check
wc -l "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
wc -l "(PROJECT_PATH)/artifacts/CHANGE_LOG.md"
wc -l "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"

# Verify session state is recent
stat -c %Y "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE_TRACKER.md"
```

---

## EMERGENCY ANCHOR RECOVERY

If ALL context is lost and anchors are corrupted:

1. **Check checkpoints** — frozen states may exist
   ```bash
   ls -la "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/"
   ```

2. **Check handover packages** — pre-compact exports
   ```bash
   ls -la "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/"
   ```

3. **Reconstruct from git history** (if versioned)
   ```bash
   git log --oneline -20
   ```

4. **Reconstruct from project files** — files on disk are truth
   ```bash
   find "(PROJECT_PATH)" -name "*.ts" -o -name "*.js" -o -name "*.py"
   ```

---

**END OF EXTERNAL CONTEXT ANCHORS**
