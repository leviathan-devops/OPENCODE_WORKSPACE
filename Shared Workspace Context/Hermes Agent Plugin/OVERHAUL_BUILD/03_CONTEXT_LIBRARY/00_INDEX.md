# Hermes Agent Plugin v3 — Context Library

**Version:** v3.0  
**Build ID:** hermes-v3-overhaul  
**Date:** 2026-04-14  
**Status:** READY TO EXECUTE  

---

## What Is This Project?

A complete rebuild of the Hermes Agent Plugin — Leviathan's persistent 2nd-brain orchestrator for OpenCode. v2.3.5 had 94% code coverage but 0% real-session hook verification and 3 broken tools. This build produces a **verified working** plugin where every system fires correctly in actual OpenCode sessions.

**What makes this different from v2.3.5:**
- Verify-first discipline: no moving to next phase without hook firing evidence
- Brainstorm gate guard fix incorporated (was blocking Spider Agent coder)
- sast_scan, imports, symbols, grill all fixed
- Integration test harness built before completion
- Kraken 3-cluster parallel verification (Alpha=test, Beta=build, Gamma=debug)
- Container TUI replica SHIP gate per AGENTS.md

---

## How To Use This Library

**Read in order:**
1. `00_INDEX.md` (this file) — orientation
2. `01_SURFACE_ANALYSIS.md` — what was broken, what it should do
3. `02_ARCHITECTURE.md` — 14-part spec from REFERENCE/ARCHITECTURE.md
4. `03_COMPONENTS.md` — every component with inputs/outputs/boundaries
5. `04_DATA_FLOW.md` — how data moves through the system
6. `05_INTERFACES.md` — SDK contracts and tool schemas
7. `06_STATE_MANAGEMENT.md` — phase persistence and session state
8. `07_ERROR_HANDLING.md` — failure recovery and fallbacks
9. `08_TESTING.md` — mechanical verification approach
10. `09_DEPLOYMENT.md` — how to ship with container TUI replica
11. `10_MENTAL_MODEL.md` — simplest explanation for onboarding

**Work directory:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v3-build/`

---

## Quick Start

### Prerequisites
```bash
node --version  # must be Node 18+
bun --version   # must be Bun 1.0+
```

### Build Command (CRITICAL — use EXACTLY this)
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/v3-build/
bun install
bun build.ts           # NOT 'bun build dist/index.ts'
# Verify dist freshness:
stat -c '%Y' dist/index.js $(find src -name '*.ts' -exec stat -c '%Y' {} \; | sort -n | tail -1) | awk 'NR==1{d=$1;next} {if($1<d){print "FAIL: dist not fresh"; exit 1}}'
```

### OpenCode Registration
Add to `~/.config/opencode/opencode.json`:
```json
{
  "plugins": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v3-build/dist/index.js"
  ]
}
```

### E2E Test Command
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/v3-build/
bun test-e2e.ts
```

---

## Source Reference Files

| File | Purpose | Key Sections |
|------|---------|--------------|
| `../v2.3.5-build/BUILD_REPORT.md` | Prior build log | All 8 fixes applied |
| `../v2.3.5-build/PROGRESS_REPORT.md` | What was broken | Lines 184-305 |
| `../v2.3.5-build/src/` | Working source to adapt | All 68 TypeScript files |
| `../REFERENCE/ARCHITECTURE.md` | Full 14-part spec | 900+ lines |
| `../DEBUG-HERMES-BRAINSTORM-GATE-BLOCKS-SPIDER-CODER-2026-04-08.md` | Brainstorm gate bug | Fix at lines 80-121 |
| `../../Trident Brain/Deep Planning Mode/ARCHITECTURE/TRIDENT_BRAIN.md` | Trident reasoning process | V3 gates |
| `../../Kraken Agent/NUKE RELOAD/v1.1/kraken-agent-github/src/` | Kraken patterns | ClusterManager, AsyncDelegationEngine |
