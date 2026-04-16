# TRIDENT BRAIN - CODE REVIEW MODE v2.0
## Context Library & Handover Package - COMPLETE

**Version:** 3.0 (Hotfix Applied)  
**Status:** OPERATIONAL - All critical fixes applied (2026-04-14)  
**Date:** 2026-04-14  
**Context Complete:** Yes - fresh session ready

---

## QUICK START

```bash
# Deploy plugin
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/dist/* \
  ~/.config/opencode/plugins/trident-brain/

# Plugin loads "trident" agent in OpenCode tab toggle
# Say "audit this" to scan current directory
```

---

## WHAT IS TRIDENT BRAIN

Algorithmic code review system for OpenCode using **pure regex pattern matching**.

**Core Principle:** Model ONLY reads files. ALL detection is algorithmic.

### v2.0 Capabilities

| Capability | Status | Description |
|------------|--------|-------------|
| Pattern Library | ✅ | 100+ regex patterns across 12 categories |
| Audit Engine | ✅ | 7-layer state machine |
| Proof Verifier | ✅ | Filesystem verification of claims |
| Hook Analyzer | ✅ | Detects cross-plugin contamination |
| Resource Estimator | ✅ | Memory/token bloat detection |
| Cross-Ref Verifier | ✅ | Import/cluster ID validation |
| Real-Time Firewall | ✅ | FIXED - safetyCount + maxMatches added |

---

## NATURAL LANGUAGE COMMANDS

| Say This | Action |
|----------|--------|
| "audit this" | Scan current directory |
| "audit /path/to/project" | Scan specific path |
| "verify that dist/index.js exists" | Proof verification |
| "analyze hook isolation" | Cross-plugin check |
| "resource footprint" | Memory/token analysis |
| "show me the full report" | Detailed findings |
| "show status" | Current state |

---

## BANNED PATTERNS (CRITICAL)

These patterns generate CRITICAL findings - they are **BANNED**:

| Category | Patterns |
|----------|----------|
| SIMULATED_EXECUTION | `setTimeout → resolve({success:true})`, `Promise.resolve({success:true})`, fake delays |
| THEATRICAL_CODE | `TODO.*full.*implementation`, `mock data`, `fake`, `simulate` |
| STUB_CODE | `function.*return null`, `=> null`, empty async functions |

---

## ARCHITECTURE

```
src/
├── index.ts                 # Plugin entry, chat.message hook (582 lines)
└── algorithmic-core.ts      # PATTERNS, Scanner, Engine, Verifiers (1400+ lines)

dist/                        # Compiled output (21KB + 47KB)
```

### Plugin Flow

```
User Message → parseNaturalLanguage() → switch(action)
                                        ├── 'audit' → runAudit()
                                        ├── 'verify' → runVerify()
                                        ├── 'analyze-hooks' → runHookAnalysis()
                                        ├── 'resource-cost' → runResourceAnalysis()
                                        ├── 'cross-ref' → runCrossRefAnalysis()
                                        └── 'firewall-test' → runFirewallTest()
```

---

## PATTERN CATEGORIES

| Category | Severity | Count |
|----------|----------|-------|
| SIMULATED_EXECUTION | CRITICAL (BANNED) | 12 |
| THEATRICAL_CODE | CRITICAL (BANNED) | 11 |
| STUB_CODE | CRITICAL (BANNED) | 7 |
| SQL_INJECTION | CRITICAL | 4 |
| SECRET_EXPOSURE | CRITICAL | 7 |
| AUTH_BYPASS | CRITICAL | 6 |
| XSS | HIGH | 4 |
| EMPTY_CATCH | HIGH | 2 |
| HOOK_SPILLOVER | HIGH | 5 |
| GLOBAL_STATE | MEDIUM | 3 |
| COMPLEXITY | MEDIUM | 3 |
| RESOURCE_LEAK | MEDIUM | 2 |

---

## ISSUES & BUGS

### Fixed Issues (2026-04-14)

- ✅ Console UI spillover (49+ console.log removed)
- ✅ Plugin crashes during audits (defensive error handling added)
- ✅ Regex infinite loops in `scanPatterns()` (safetyCount + remove g flag)
- ✅ Firewall throwing in hooks (removed - crashes plugins)
- ✅ **RealTimeFirewall infinite loop** - FIXED (safetyCount added to scanRealtime + scanSoft)

### Known Limitations

- ⚠️ `scanDirectory()` - Loads 200 files into memory, no size limit (audit smaller dirs)
- ⚠️ `scanFile()` - No error recovery for binary/large files (will fail on problematic files)

**See 03_CRASH_ANALYSIS.md for complete crash analysis and fix details.**

---

## ANTI-PATTERNS

### NEVER DO

1. **NEVER throw from hooks** - `tool.execute.before/after` throwing crashes plugin
2. **NEVER use console.log** - Causes UI spillover
3. **NEVER use global regex flag with exec()** - Causes infinite loops
4. **NEVER skip safety limits** - Add `safetyCount` with `maxMatches`

---

## PROJECT STRUCTURE

```
trident-brain-code-review/
├── src/
│   ├── index.ts                 # Plugin entry + chat.message hook
│   └── algorithmic-core.ts      # PATTERNS, Scanner, Engine, Verifiers
├── dist/                        # Compiled output
├── README.md                    # Installation instructions
├── package.json
└── .git/                        # Git repo with history
```

---

## INSTALLATION

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review
npm install
npm run build
```

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugins": {
    "trident-brain": {
      "enabled": true,
      "path": "/home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/dist"
    }
  },
  "agent": {
    "trident": {
      "name": "trident",
      "mode": "primary",
      "color": "#8B5CF6"
    }
  }
}
```

---

## GIT HISTORY

```
acb7844 FIX: Defensive scanPatterns with safety limits
49aaf06 CLEANUP: Remove old tools folder from dist
275a48d FIX: Remove console.log, prevent UI spillover
39076c2 v2.0 OVERHAUL: Add proof verification, firewall, hook isolation
ed8574c Add compiled dist files for easy installation
```

---

## FILES IN THIS PACKAGE

| File | Content |
|------|---------|
| `INDEX.md` | This file - overview & quick reference |
| `01_CONTEXT_LIBRARY.md` | Full architectural documentation |
| `02_CONTAINER_RESOURCE_DEBUGGING.md` | Agent-swarm bloat investigation (UNRESOLVED) |
| `03_CRASH_ANALYSIS.md` | **NEW** - Crash root cause & bugs |
| `PATTERNS.md` | All 100+ detection patterns with regex |
| `QUICK_START.md` | 2-minute deploy guide |

---

## OPEN ISSUES

1. **RealTimeFirewall infinite loop** - Fix using safetyCount (see 03_CRASH_ANALYSIS.md)
2. **Agent-swarm container bloat** - 2.8GB images found but NOT actively used, investigation suspended
3. **Session database corruption** - `list_sessions` returns undefined sessions

---

*Context Library v2.0 - Complete as of session crash*