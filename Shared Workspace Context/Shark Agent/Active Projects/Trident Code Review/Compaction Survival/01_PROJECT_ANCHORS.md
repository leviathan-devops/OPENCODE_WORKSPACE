# TRIDENT BRAIN v3.2 — PROJECT ANCHORS

**Date:** 2026-04-16T03:15 UTC
**Build:** v3.2 Artifact Generation
**Status:** ✅ BUILD COMPLETE

---

## PROJECT STRUCTURE

```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/
├── Code Review v3.2/                    # Active development (THIS IS PRIMARY)
│   ├── src/
│   │   ├── index.ts                    # Plugin entry, hooks, commands
│   │   ├── algorithmic-core.ts          # Pattern scanner engine
│   │   └── artifact-writer.ts          # WHY/HOW artifact generation [NEW v3.2]
│   ├── dist/
│   │   ├── index.js
│   │   ├── algorithmic-core.js
│   │   ├── artifact-writer.js          # ← KEY FILE - artifact generation
│   │   └── *.d.ts + *.map
│   ├── package.json                    # v3.2.0
│   ├── tsconfig.json
│   ├── PLAN.md                         # v3.2 design plan
│   └── test-mechanical.ts             # Mechanical tests
│
├── Reload Anchor v3.2/                 # Self-contained recovery package
│   ├── src/                            # Copy of source
│   ├── dist/                           # Copy of built plugin
│   ├── docs/
│   │   ├── BUILD_REPORT.md
│   │   ├── DEBUG_LOG.md
│   │   ├── RECOVERY.md
│   │   └── SHIP_READY.md
│   ├── scripts/
│   │   ├── build.sh
│   │   ├── deploy.sh
│   │   └── test.sh
│   ├── package.json
│   └── INDEX.md
│
└── Compaction Survival/                # This folder
    ├── 00_COMPACTION_PROOF_KNOWLEDGE_BASE.md
    ├── 01_PROJECT_ANCHORS.md            # ← THIS FILE
    ├── 02_CURRENT_STATE.md
    ├── 03_SESSION_STATE_TRACKER.md
    ├── 04_EMERGENCY_CONTEXT.md
    └── 05_KNOWLEDGE_LIBRARY.md
```

---

## KEY FILES AND PURPOSES

### Source Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/index.ts` | Plugin entry, hooks, commands | `runAudit()`, `tool.execute.before` hook |
| `src/algorithmic-core.ts` | Pattern detection engine | `AlgorithmicScanner`, `auditEngine`, `ReportGenerator` |
| `src/artifact-writer.ts` | Artifact generation [NEW] | `ArtifactWriter.generate()` |

### Built Files

| File | Purpose |
|------|---------|
| `dist/index.js` | Plugin entry point |
| `dist/algorithmic-core.js` | Built scanner engine |
| `dist/artifact-writer.js` | Built artifact generator |

---

## v3.2 ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      TRIDENT PLUGIN                          │
├─────────────────────────────────────────────────────────────┤
│  HOOKS: tool.execute.before → Block edit/write/bash        │
│  COMMANDS: audit, show artifact, show full report, verify    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │ AuditEngine │───▶│Algorithmic  │───▶│   Report      │ │
│  │             │    │  Scanner     │    │  Generator    │ │
│  └─────────────┘    └──────────────┘    └───────────────┘ │
│                           │                    │            │
│                           ▼                    ▼            │
│                    ┌──────────────┐    ┌───────────────┐  │
│                    │   Findings   │───▶│ArtifactWriter │  │
│                    │   Array      │    │   [NEW v3.2]  │  │
│                    └──────────────┘    └───────────────┘  │
│                                                │           │
│                                                ▼           │
│                                         ┌───────────┐     │
│                                         │ File Write│     │
│                                         │ (fs.write)│     │
│                                         └───────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## PRESERVED VS NEW CODE

### Preserved from v3.1
- All 50+ pattern detectors
- Tool hooks (blocks edit/write/bash)
- Agent instructions ("Trident Documents. Humans Fix.")
- All existing commands
- Real-time firewall
- Proof verifier

### New in v3.2
- `artifact-writer.ts` module
- 3-layer WHY/HOW artifact structure
- File writing on audit completion
- `show artifact` command

---

## COMMANDS

| Command | Action |
|---------|--------|
| `audit this` | Run audit, generate artifact, save to disk |
| `show artifact` | Display latest generated artifact |
| `show full report` | Display detailed findings |
| `document_fix` | Generate fix documentation |
| `verify that [claim]` | Proof verification |

---

## BUILD COMMANDS

```bash
# Build
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Trident\ Brain/Code\ Review\ Mode/Code\ Review\ v3.2
npm install
npm run build

# Deploy
cp -r dist/* ~/.config/opencode/plugins/trident-brain/

# Test
npm test
```

---

## TESTING

### Mechanical Tests
```bash
npm test
# Expected: === ALL TESTS PASSED ===
```

### Container Test
```bash
# Create fresh container (NEVER pollute other projects)
docker run -dit --name trident-v32-test leviathan/opencode:python3-enabled-1.4.3

# Deploy plugin
docker exec trident-v32-test mkdir -p ~/.config/opencode/plugins/trident-brain
docker exec trident-v32-test cp -r ~/.config/opencode/plugins/trident-brain/* ~/.config/opencode/plugins/trident-brain/

# Test in TUI
docker exec -it trident-v32-test opencode
```

---

## END OF PROJECT ANCHORS