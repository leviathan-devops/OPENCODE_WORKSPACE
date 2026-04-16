# ARTIFACTS — Stream of Consciousness

**Type:** Append-only logs
**Purpose:** Preserve stream, changes, and errors outside context

---

## BUILD_LOG.md

**Format:** Every significant action gets an entry.

```bash
# Add entry
echo "**[{TIMESTAMP}] {PHASE}:{ACTION}**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: {1-2 sentence description}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Where: {file or location}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Result: {Success/Failure/Partial}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Next: {exact next step}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

**Entry Template:**
```markdown
**[(2026-04-14T20:15:00Z)] BUILD:FIX_PATHS**
- What: Fixed hardcoded paths in Python wrappers using os.homedir()
- Where: src/wrappers/opencode_agent.py
- Result: SUCCESS — grep returns no hardcoded paths
- Next: Copy fixed wrappers to ship package
```

---

## CHANGE_LOG.md

**Format:** All changes, grouped by date.

```bash
# Add change
echo "### Changed" >> "(PROJECT_PATH)/artifacts/CHANGE_LOG.md"
echo "| {file} | {change} | {reason} |" >> "(PROJECT_PATH)/artifacts/CHANGE_LOG.md"
```

**Entry Template:**
```markdown
## 2026-04-14

### Changed
| File | Change | Reason |
|------|--------|--------|
| wrappers/opencode_agent.py | Hardcoded path → dynamic | Runtime path resolution |

### Added
| File | Purpose |
|------|---------|
| src/new-file.ts | New feature implementation |

### Removed
| File | Reason |
|------|--------|
| src/old-file.ts | Replaced by new implementation |
```

---

## DEBUG_LOG.md

**Format:** Every error gets a complete entry.

```bash
# Add error
echo "## {TIMESTAMP} — {ERROR_TYPE}" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "**Error:**" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "\`\`\`" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "{error message}" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "\`\`\`" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "**Location:** {file:line}" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "**Root Cause:** {cause}" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "**Fix Applied:** {fix}" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "**Verification:** {how verified}" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"
```

**Entry Template:**
```markdown
## 2026-04-14T19:30 — TypeError: undefined is not an object

**Error:**
```
TypeError: undefined is not an object (evaluating 'schema._zod.def')
    at parseSchema (/app/index.js:1234)
```

**Location:** index.js:1234

**Root Cause:** Unused standalone Zod schemas in cluster-tools.ts

**Fix Applied:** Removed spawnClusterTaskSchema, aggregateResultsSchema, etc.

**Verification:** Rebuilt bundle, grep for standalone schemas returns nothing

---
```

---

## USAGE RULES

| Log | Update Rule | Retention |
|-----|-------------|-----------|
| BUILD_LOG.md | EVERY action | FOREVER (append only) |
| CHANGE_LOG.md | EVERY change | FOREVER (append only) |
| DEBUG_LOG.md | EVERY error | FOREVER (append only) |

**NEVER delete from logs. Only append.**

---

## DISASTER RECOVERY

If all context is lost:

```bash
# 1. Read BUILD_LOG.md — reconstruct stream
tail -500 "(PROJECT_PATH)/artifacts/BUILD_LOG.md"

# 2. Read CHANGE_LOG.md — reconstruct changes
tail -100 "(PROJECT_PATH)/artifacts/CHANGE_LOG.md"

# 3. Read DEBUG_LOG.md — reconstruct errors
tail -100 "(PROJECT_PATH)/artifacts/DEBUG_LOG.md"

# 4. Find checkpoint with code snapshot
ls -t "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/" | head -1

# 5. Restore working code
cp -r "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint}/code-snapshot/"* \
      /path/to/project/
```

---

**END OF ARTIFACTS**
