# KRAKEN BUILD — COMPACTION SURVIVAL

**Version:** 2.0 | **Type:** Entry Point

---

## READ THIS FIRST

**Every session start. Every crash. Every compaction.**

```bash
cat "/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-build-system/consolidated-context/00_INDEX.md"
```

---

## WHAT THIS IS

A **mechanical compaction survival system**. Recover in 2 minutes. Resume exactly where you left off. Working code preserved at every checkpoint.

---

## THE 5 FILES

| # | File | Purpose | When |
|---|------|---------|------|
| 1 | `00_INDEX.md` | **YOU ARE HERE** | ALWAYS FIRST |
| 2 | `01_SESSION_STATE.md` | Current state | After index |
| 3 | `02_RECOVERY.md` | Mechanical recovery | After crash |
| 4 | `03_CHECKPOINTS.md` | Milestone saves + CODE | Reference |
| 5 | `04_ARTIFACTS.md` | Log usage | Reference |

---

## ONE COMMAND RECOVERY

```bash
# Read index
cat "(PROJECT_PATH)/compaction-survival/00_INDEX.md"

# Check session state
cat "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE.md"

# Read stream
tail -30 "(PROJECT_PATH)/artifacts/BUILD_LOG.md"

# If stale → follow 02_RECOVERY.md
```

---

## CURRENT BUILD STATE

See `01_SESSION_STATE.md`

---

## FOR V2.0 BUILD

**Project:** Kraken Agent v2.0 Ship Package  
**Phase:** BUILD → pre-ship debugging  
**Milestone:** milestone-7c-zod-fix-verified

**Next Action:**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build && bun run build
```

---

## CHECKPOINT EXAMPLE

```
compaction-survival/CHECKPOINTS/milestone-7c-zod-fix-verified/
├── BUILD_STATE.txt     # Phase: BUILD, Status: Zod fix verified
├── CHECKSUMS.md5       # MD5 verification
└── code-snapshot/      # WORKING CODE
    ├── dist/index.js   # 526KB verified bundle
    └── ...
```

**Restore working code:**
```bash
cp -r "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{checkpoint}/code-snapshot/"* \
      /path/to/project/
```

---

## TOKEN BUDGET

| Threshold | Action |
|-----------|--------|
| 65% (~110K) | Automatic pruning |
| **140K** | **PRE-EXPORT** |
| ~170K | AUTO-COMPACT |

---

## QUICK COMMANDS

```bash
# Session start
cat "(PROJECT_PATH)/compaction-survival/01_SESSION_STATE.md"
tail -30 "(PROJECT_PATH)/artifacts/BUILD_LOG.md"

# Stream entry
echo "**[{TIMESTAMP}] {PHASE}:{ACTION}**" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- What: {desc}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "- Result: {outcome}" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"
echo "" >> "(PROJECT_PATH)/artifacts/BUILD_LOG.md"

# Create checkpoint with code
mkdir -p "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{name}/code-snapshot"
cp -r /path/to/project/dist "(PROJECT_PATH)/compaction-survival/CHECKPOINTS/{name}/code-snapshot/"

# Pre-export
cp -r "(PROJECT_PATH)/compaction-survival/"* "(PROJECT_PATH)/compaction-survival/HANDOVER_PACKAGES/handover-$(date +%Y%m%d_%H%M%S)/"
```

---

**END OF INDEX**
