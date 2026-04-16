# TRIDENT BRAIN - CODE REVIEW MODE v3.0
## Master Index - Start Here

**Version:** 3.0 (Final)  
**Status:** SHIP READY ✅  
**Date:** 2026-04-14

---

## FOR FRESH SESSIONS

**READ FIRST:** This file (`INDEX.md`)  
**THEN READ:** `05_SHIP_READY.md` for audit results  
**IF CRASHES:** See `03_CRASH_ANALYSIS.md` for bug history

---

## PACKAGE CONTENTS

| File | Lines | Purpose |
|------|-------|---------|
| `INDEX.md` | This | Quick reference & file manifest |
| `00_INDEX.md` | 220 | Complete overview, architecture |
| `01_CONTEXT_LIBRARY.md` | 268 | Full architectural documentation |
| `02_CONTAINER_RESOURCE_DEBUGGING.md` | 259 | Agent-swarm investigation (UNRESOLVED) |
| `03_CRASH_ANALYSIS.md` | 132 | Crash root cause & infinite loop fixes |
| `04_HOTFIX_v3.0.md` | 93 | Architectural violations fixed |
| `05_SHIP_READY.md` | 80 | Ship readiness audit |
| `06_BUG_FIX.md` | 60 | Regex exec() duplicate bug fixed |
| `MECHANICAL_TEST_SUITE.md` | 280 | **NEW** - 20 mechanical verification tests |
| `PATTERNS.md` | 131 | All detection patterns (now universal) |
| `QUICK_START.md` | 71 | 2-minute deployment guide |

---

## WHAT IS TRIDENT BRAIN

Algorithmic code review plugin using **pure regex pattern matching**.

**Core Principle:** Model ONLY reads files. ALL detection is algorithmic.

> **"Trident documents. Humans fix."**

---

## QUICK START

```bash
# Deploy plugin
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/dist/* \
  ~/.config/opencode/plugins/trident-brain/

# Restart OpenCode, select "trident" from tab toggle
# Say "audit this" to scan current directory
```

---

## v3.0 CAPABILITIES

| Capability | Status |
|------------|--------|
| Pattern Library | ✅ 100+ patterns across 12 categories |
| Audit Engine | ✅ 7-layer state machine |
| Proof Verifier | ✅ Filesystem verification |
| Hook Analyzer | ✅ Cross-plugin contamination detection |
| Resource Estimator | ✅ Memory/token bloat detection |
| Cross-Ref Verifier | ✅ Import/cluster ID validation (now universal) |
| Real-Time Firewall | ✅ safetyCount protected |
| Tool Enforcement | ✅ Active blocking hook |
| Documentation-Only | ✅ Architectural enforcement |

---

## NATURAL LANGUAGE COMMANDS

| Say This | Action |
|----------|--------|
| "audit this" | Scan current directory |
| "verify that [claim]" | Proof verification |
| "analyze hook isolation" | Cross-plugin check |
| "resource footprint" | Memory/token analysis |
| "show me the full report" | Detailed findings |
| "show fix documentation" | **NEW** - Documentation-only fix guide |

---

## BANNED PATTERNS (CRITICAL)

| Category | Examples |
|----------|----------|
| SIMULATED_EXECUTION | `setTimeout → resolve({success:true})` |
| THEATRICAL_CODE | `TODO.*full.*implementation` |
| STUB_CODE | `function.*return null` |

---

## KEY PATHS

| Item | Path |
|------|------|
| Plugin Repo | `/home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/` |
| Source | `src/index.ts`, `src/algorithmic-core.ts` |
| Built | `dist/` (21KB + 48KB) |
| Config | `~/.config/opencode/opencode.json` |

---

## CRITICAL FIXES APPLIED (v3.0)

| Issue | Fix |
|-------|-----|
| Tool enforcement disabled | Active blocking hook now prevents edits |
| `fix` action ambiguous | Renamed to `document_fix` with explicit warnings |
| RealTimeFirewall infinite loop | safetyCount + maxMatches added |
| HookAnalyzer infinite loop | safetyCount + maxHooks=50 added |
| Hardcoded shark/manta prefixes | Now accepts any valid format |
| Hardcoded agent tool prefixes | Now generic word-word pattern |

---

## OPEN ISSUES

1. **Agent-swarm container bloat** - 2.8GB images found but NOT actively used. Investigation suspended.

2. **Session DB corruption** - `list_sessions` returns undefined. May need DB repair.

---

## GIT HISTORY

```
acb7844 FIX: Defensive scanPatterns with safety limits
49aaf06 CLEANUP: Remove old tools folder from dist
275a48d FIX: Remove console.log, prevent UI spillover
39076c2 v2.0 OVERHAUL: Add proof verification, firewall, hook isolation
[2026-04-14] v3.0 HOTFIX: Architectural enforcement + universal patterns
```

---

## VERIFICATION

```bash
# Build check
cd /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review && npm run build

# Deploy
cp -r dist/* ~/.config/opencode/plugins/trident-brain/

# Test blocked tools
# Say "fix the issues" - should be blocked with warning

# Test audit
# Say "audit this" - should complete without hanging
```

---

*Last updated: 2026-04-14 - v3.0 Hotfix Complete*