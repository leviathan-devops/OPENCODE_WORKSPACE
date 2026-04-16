# CHECKPOINT SYSTEM

**Version:** 2.0 | **Type:** Milestone saves with working code

---

## PURPOSE

Checkpoints are **full working snapshots** of the project at key milestones. They include:
- `BUILD_STATE.txt` — Human-readable state summary
- `CHECKSUMS.md5` — File integrity verification
- `code-snapshot/` — **Working copy of critical source files**

If catastrophic failure occurs, you can restore the actual code and continue.

---

## CHECKPOINT TYPES

| Type | When | Code Snapshot? |
|------|------|---------------|
| Milestone | After major feature/fix | YES — full |
| Pre-action | Before risky change | YES — full |
| Auto | Pre-export at 140K | YES — full |
| End-of-session | Before closing | YES — full |

---

## CHECKPOINT CREATION

```bash
# 1. Choose checkpoint name
CHECKPOINT_NAME="milestone-{name}-$(date +%Y%m%d_%H%M%S)"
CHECKPOINT_DIR="(PROJECT_PATH)/compaction-survival/CHECKPOINTS/${CHECKPOINT_NAME}"

# 2. Create directory structure
mkdir -p "${CHECKPOINT_DIR}/code-snapshot"

# 3. Create BUILD_STATE.txt
cat > "${CHECKPOINT_DIR}/BUILD_STATE.txt" << 'EOF'
=== CHECKPOINT: {CHECKPOINT_NAME} ===
Date: {CURRENT_DATE}
Phase: {PHASE}
Milestone: {MILESTONE_NAME}

STATUS:
- What completed: {desc}
- Current state: {desc}
- Working: {list}

NEXT:
- Immediate: {action}
- Future: {list}

FILES:
- Modified: {list}
- Created: {list}

ERRORS:
- Known: {list}
- Outstanding: {list}
EOF

# 4. Copy CRITICAL source files (the working code)
# Adjust paths based on your project structure

# For Kraken v2.0:
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/dist "${CHECKPOINT_DIR}/code-snapshot/" 2>/dev/null
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/src "${CHECKPOINT_DIR}/code-snapshot/" 2>/dev/null
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/wrappers "${CHECKPOINT_DIR}/code-snapshot/" 2>/dev/null

# 5. Save checksums
cat > "${CHECKPOINT_DIR}/CHECKSUMS.md5" << 'EOF'
# Checksums at checkpoint {CHECKPOINT_NAME}
# Generated: {CURRENT_DATE}
EOF

# Source checksums
find "${CHECKPOINT_DIR}/code-snapshot" -type f -name "*.js" -o -name "*.ts" -o -name "*.py" 2>/dev/null | while read f; do
    md5sum "$f" >> "${CHECKPOINT_DIR}/CHECKSUMS.md5"
done

# Bundle checksums
md5sum /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js >> "${CHECKPOINT_DIR}/CHECKSUMS.md5" 2>/dev/null

# 6. Update checkpoint manifest (this file at bottom)
echo "| ${CHECKPOINT_NAME} | $(date +%Y-%m-%d) | ${PHASE} | ${STATUS} |" >> "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/MANIFEST.md"

# 7. Log to BUILD_LOG.md
echo "**[(TIMESTAMP)] SYSTEM:CHECKPOINT**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: Created checkpoint ${CHECKPOINT_NAME}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Location: ${CHECKPOINT_DIR}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Code Snapshot: YES ($(du -sh "${CHECKPOINT_DIR}/code-snapshot" | cut -f1))" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

## RESTORE FROM CHECKPOINT

```bash
# 1. Read BUILD_STATE.txt to understand state
cat "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint-name}/BUILD_STATE.txt"

# 2. Verify checksums before restore
cd "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint-name}/"
md5sum -c CHECKSUMS.md5 2>/dev/null
# Any failures = file corrupted

# 3. Restore code snapshot
# Option A: Full restore (overwrites current)
cp -r "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint-name}/code-snapshot/"* \
      /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/

# Option B: Selective restore (only specific files)
cp "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint-name}/code-snapshot/dist/index.js" \
   /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/dist/

# 4. Verify restore
md5sum /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js
# Compare to CHECKSUMS.md5

# 5. Rebuild if needed
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build && bun run build

# 6. Log restore
echo "**[(TIMESTAMP)] SYSTEM:CHECKPOINT_RESTORED**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: Restored from checkpoint {checkpoint-name}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Action: Continue from restored state" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
```

---

## WHAT TO SNAPSHOT

### For Kraken v2.0 (adjust for your project)

```
code-snapshot/
├── dist/
│   └── index.js          # Primary bundle
├── src/
│   ├── index.ts
│   ├── clusters/
│   ├── hooks/
│   ├── tools/
│   └── kraken-hive/
├── wrappers/
│   ├── opencode_agent.py
│   ├── container_pool.py
│   └── kraken-agent-wrapper.py
├── shark-agent-src/       # If applicable
├── manta-agent-src/      # If applicable
└── package.json
```

### For Node.js Projects

```
code-snapshot/
├── dist/                  # Compiled output
├── src/                   # TypeScript source
├── package.json
├── tsconfig.json
└── BUILD_LOG.md          # Stream at checkpoint
```

### For Python Projects

```
code-snapshot/
├── src/                   # Python source
├── package.json          # If pyproject.toml exists
├── requirements.txt
└── BUILD_LOG.md
```

---

## CHECKPOINT MANIFEST

| Checkpoint | Date | Phase | Status | Code Size |
|------------|------|-------|--------|-----------|
| | | | | |

---

## DISK USAGE

Typical checkpoint sizes:

| Project | Full Snapshot |
|---------|-------------|
| Kraken v2.0 | ~2-5 MB |
| Small Node.js | ~100-500 KB |
| Large project | ~5-20 MB |

**Recommendation:** Keep ALL checkpoints (disk is cheap). You never know when you'll need an old state.

---

## CRITICAL FAILURE SCENARIO

```bash
# Scenario: Bundle rebuild corrupts output, no backup

# 1. Find last good checkpoint
ls -t "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/" | head -5

# 2. Verify checkpoint has code-snapshot
ls "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint}/code-snapshot/"

# 3. Check if dist/index.js exists in snapshot
ls "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint}/code-snapshot/dist/"

# 4. Verify checksum
grep "dist/index.js" "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint}/CHECKSUMS.md5"

# 5. Restore
cp "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint}/code-snapshot/dist/index.js" \
   /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/dist/

# 6. Verify
md5sum /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js
# Should match CHECKSUMS.md5

# 7. Continue
```

---

## CHECKPOINT VS HANDOVER

| Aspect | Checkpoint | Handover |
|--------|------------|----------|
| Purpose | Milestone freeze | Pre-compact export |
| Content | State + CODE snapshot | Full context |
| Size | Medium (MB) | Small (KB) |
| Frequency | Per milestone | Per compaction |
| Code included | YES | NO |
| Auto-created | No | Yes (at 140K) |

---

## BEST PRACTICES

- **Create checkpoint BEFORE risky actions**
- **Include descriptive checkpoint names with date**
- **Always save checksums**
- **Log checkpoint creation in BUILD_LOG.md**
- **Keep ALL checkpoints** — you can always delete old ones later
- **Test restore procedure** occasionally to verify it works

---

**END OF CHECKPOINT SYSTEM**
