# TRIDENT BRAIN v3.2 - CODE REVIEW MODE
## Consolidated Single Source

**Version:** 3.2.0
**Status:** SHIP READY ✅
**Date:** 2026-04-16

---

## PROJECT LOCATION

```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Code Review v3.2/
```

---

## FOLDER STRUCTURE

```
Code Review v3.2/
├── src/
│   ├── index.ts              # Plugin entry, hooks, commands
│   ├── algorithmic-core.ts   # Patterns, scanners, engines (1700 lines)
│   └── artifact-writer.ts    # NEW: Artifact generation with WHY/HOW (520 lines)
├── dist/                     # Built plugin (READY TO DEPLOY)
│   ├── index.js
│   ├── algorithmic-core.js
│   └── artifact-writer.js    # NEW
├── package.json              # v3.2.0
├── tsconfig.json
├── PLAN.md                   # v3.2 design plan
└── test-mechanical.ts        # Mechanical tests
```

---

## QUICK START

### Deploy to OpenCode
```bash
cp -r "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Code Review v3.2/dist/"* \
  ~/.config/opencode/plugins/trident-brain/
```

### Build from source
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Code Review v3.2"
npm install
npm run build
```

---

## v3.2 CHANGES FROM v3.1

| Feature | v3.1 | v3.2 |
|---------|-------|------|
| Artifact generation | None | **Automatic** |
| WHY explanations | Brief | **Detailed mechanistic** |
| HOW to fix | One line | **Step-by-step** |
| Verification commands | None | **Mechanical proof** |
| Layer structure | None | **3-layer Deep Planning** |

---

## CORE PRINCIPLE

> **"Trident Documents. Humans Fix."**

TRIDENT NEVER:
- Edits source code
- Applies fixes automatically
- Modifies any files

TRIDENT ALWAYS:
- Documents findings with WHY (mechanistic explanation)
- Explains HOW to fix (step-by-step)
- Provides verification commands (mechanical proof)
- Follows 3-layer Deep Planning structure

---

## COMMANDS

| Command | Action |
|---------|--------|
| `audit this` | Scan and generate artifact with full WHY/HOW |
| `show artifact` | Display latest generated artifact |
| `show full report` | Display detailed findings |
| `document_fix` | Generate fix documentation |
| `verify that [claim]` | Proof verification |
| `show status` | Current audit state |

---

## ARTIFACT FORMAT

When you run `audit this`, Trident now outputs:

1. **Summary response** (current behavior preserved)
2. **Full artifact** with 3-layer structure:
   - **Layer 1**: What is this / What went wrong
   - **Layer 2**: WHY is it a problem / HOW to fix each finding
   - **Layer 3**: Critical path + verification commands

Example artifact sections:
```
## LAYER 1: INITIAL ANALYSIS
## LAYER 2: FINDINGS BY CATEGORY
   ### 🚫 CRITICAL
      - WHY this is a problem
      - HOW to fix (steps)
      - Mechanical verification (command)
   ### ⚠️ HIGH
## LAYER 3: CONSOLIDATED FIX WORKFLOW
```

---

## MECHANICAL TESTS

Tests passed:
- ✓ Artifact structure (LAYER 1/2/3)
- ✓ Findings categorization
- ✓ Verification commands
- ✓ Semantic context extraction
- ✓ Empty findings handling
- ✓ All severity levels

---

## PRESERVED FROM v3.1

- All pattern detection (50+ patterns)
- Tool hooks (blocks edit/write/bash)
- Agent instructions ("Trident Documents. Humans Fix.")
- Real-time firewall
- Hook analyzer
- Proof verifier
- Cross-reference verifier

---

## DEPLOYED PLUGIN LOCATION

```
~/.config/opencode/plugins/trident-brain/
├── index.js
├── algorithmic-core.js
└── artifact-writer.js  ← NEW v3.2
```