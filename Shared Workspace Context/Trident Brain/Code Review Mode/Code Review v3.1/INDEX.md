# TRIDENT BRAIN v3.1 - CODE REVIEW MODE
## Consolidated Single Source

**Version:** 3.1.0
**Status:** SHIP READY ✅
**Date:** 2026-04-16

---

## PROJECT LOCATION

```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Code Review v3.1/
```

---

## FOLDER STRUCTURE

```
Code Review v3.1/
├── src/                    # TypeScript source
│   ├── index.ts           # Plugin entry, hooks, commands (782 lines)
│   └── algorithmic-core.ts # Patterns, scanners, engines (1699 lines)
├── dist/                   # Built plugin (READY TO DEPLOY)
│   ├── index.js           # Entry point
│   └── algorithmic-core.js # Core logic
├── package.json           # v3.1.0
├── tsconfig.json
└── node_modules/         # Dependencies
```

---

## QUICK START

### Deploy to OpenCode
```bash
cp -r /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Trident\ Brain/Code\ Review\ Mode/Code\ Review\ v3.1/dist/* \
  ~/.config/opencode/plugins/trident-brain/
```

### Add to OpenCode config (~/.config/opencode/opencode.json)
```json
{
  "plugin": [
    "file:///home/leviathan/.config/opencode/plugins/trident-brain/index.js",
    ...
  ]
}
```

### Build from source
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Code Review v3.1"
npm install
npm run build
```

---

## v3.1 CHANGES FROM v3.0

| Feature | v3.0 | v3.1 |
|---------|-------|------|
| Documentation-only enforcement | Implicit | **EXPLICIT** |
| Agent instructions | Basic | **"Trident Documents. Humans Fix."** |
| Tool block reason | "No direct edits" | **"documentation-only"** |
| Report naming | TRIDENT_CODE_REVIEW.md | **TRIDENT_CODE_REVIEW_{context}_{date}.md** |
| scanFile() findings storage | Bug (not stored) | **FIXED** |
| Path parsing | Lowercase bug | **FIXED** |

---

## CORE PRINCIPLE

> **"Trident Documents. Humans Fix."**

TRIDENT NEVER:
- Edits source code
- Applies fixes automatically
- Modifies any files
- Uses edit, write, apply_diff, or patch tools

TRIDENT ALWAYS:
- Documents findings in TRIDENT_CODE_REVIEW_*.md files
- Explains WHY each issue is problematic
- Explains HOW to fix (for human review)
- Provides proof-based verification

---

## COMMANDS

| Command | Action |
|---------|--------|
| `audit this` | Scan and document findings |
| `audit /path` | Scan specific path |
| `show full report` | Display detailed findings |
| `document_fix` | Generate fix documentation (NOT apply) |
| `verify that [claim]` | Proof verification |
| `analyze hook isolation` | Cross-plugin check |
| `show status` | Current state |

---

## CONTAINER TESTED (Docker)

All commands verified working:
- ✅ status
- ✅ help (shows "Trident Documents. Humans Fix.")
- ✅ audit /path (finds theatrical code)
- ✅ document_fix (shows "DOCUMENTATION ONLY" warnings)
- ✅ tool.execute.before blocks edit/bash
- ✅ tool.execute.before allows test scripts

---

## TESTED ON REAL CODE

**Target:** shark-agent-v4.7-hotfix-v3/src.bak
**Files Scanned:** 21
**Findings:** 67 (1 CRITICAL, 35 HIGH, 31 MEDIUM)

---

## RELOAD ANCHOR

This folder IS the reload anchor. To restore:
1. Copy this folder to your project location
2. Run `npm install && npm run build`
3. Deploy dist to OpenCode plugins

---

*Last Updated: 2026-04-16*