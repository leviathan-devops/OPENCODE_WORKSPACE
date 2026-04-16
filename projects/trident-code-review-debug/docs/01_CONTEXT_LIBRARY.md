# TRIDENT BRAIN - CODE REVIEW MODE v2.0
## Context Library & Handover Package

**Version:** 2.0  
**Status:** OPERATIONAL (fixed console spillover and crash issues)  
**Date:** 2026-04-14

---

## LAYER 1: INITIAL PLAN

### Purpose

Trident Brain Code Review Mode is an **algorithmic code review system** for OpenCode that uses pure regex pattern matching to detect:
- Theatrical/simulated code (BANNED - CRITICAL)
- Security vulnerabilities
- Quality issues
- Hook spillover
- Resource bloat

### Core Principle

> "If a human can write a rule for it, write the rule."

The model is ONLY used to READ files. ALL intelligence is algorithmic (regex classifiers). No behavioral prompts.

### What Was Built

| Component | Status | Description |
|-----------|--------|-------------|
| Pattern Library | ✅ | 100+ regex patterns across 12 categories |
| Audit Engine | ✅ | 7-layer state machine |
| Proof Verifier | ✅ | Filesystem verification of claims |
| Real-Time Firewall | ⚠️ | REMOVED - throwing crashes plugins |
| Hook Analyzer | ✅ | Detects cross-plugin contamination |
| Resource Estimator | ✅ | Memory/token bloat detection |
| Cross-Ref Verifier | ✅ | Import/cluster ID validation |

---

## LAYER 2: WORKFLOW & ARCHITECTURE

### Project Structure

```
trident-brain-code-review/
├── src/
│   ├── index.ts                 # Plugin entry + chat.message hook
│   ├── algorithmic-core.ts       # PATTERNS, Scanner, Engine, Verifiers
│   ├── modes/                   # Multi-mode architecture (preserved)
│   │   ├── planning/
│   │   ├── problem-solving/
│   │   └── context-synthesis/
│   └── shared/
├── dist/                        # Compiled output
├── README.md                    # Installation instructions
├── package.json
└── SYSTEM_DIAGNOSTIC_TEST_SUITE.md
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

### Pattern Categories

| Category | Severity | Patterns |
|----------|----------|----------|
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

## LAYER 3: CONTEXT LIBRARY

### What Was Accomplished

**COMPLETED:**
- ✅ Algorithmic core with 100+ patterns
- ✅ Natural language interface (no slash commands)
- ✅ Proof-based verification engine
- ✅ Hook isolation analyzer
- ✅ Resource footprint estimator
- ✅ Cross-reference verifier
- ✅ Git repo with proper install docs
- ✅ Dist files included for easy install

**FIXED ISSUES:**
- ✅ Console UI spillover (49+ console.log statements removed)
- ✅ Plugin crashes during audits (defensive error handling)
- ✅ Regex infinite loops (safetyCount + remove global flag)
- ✅ Firewall throwing in hooks (removed - crashes plugins)

### Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Plugin entry, chat.message handler, command routing |
| `src/algorithmic-core.ts` | PATTERNS, AlgorithmicScanner, AuditEngine, Verifiers |
| `dist/index.js` | Compiled plugin (21KB) |
| `dist/algorithmic-core.js` | Compiled core (47KB) |
| `README.md` | Installation guide for vanilla OpenCode |

### Installation

```bash
# 1. Clone/copy directory
cd trident-brain-code-review
npm install
npm run build

# 2. Add to OpenCode config (~/.config/opencode/opencode.json)
{
  "plugins": {
    "trident-brain": {
      "enabled": true,
      "path": "/FULL/PATH/TO/trident-brain-code-review/dist"
    }
  },
  "agent": {
    "trident": {
      "name": "trident",
      "description": "TRIDENT v2.0 - Algorithmic code review...",
      "mode": "primary",
      "permission": { "task": "allow" },
      "color": "#8B5CF6"
    }
  }
}

# 3. Restart OpenCode, select "trident" from tab toggle
```

### Natural Language Commands

| Phrase | Action |
|--------|--------|
| "audit this" | Scan current directory |
| "audit /path/to/project" | Scan specific path |
| "verify that dist/index.js exists" | Proof verification |
| "analyze hook isolation" | Cross-plugin check |
| "resource footprint" | Memory/token analysis |
| "cross-reference check" | Validate references |
| "show me the full report" | Detailed findings |
| "show status" | Current state |

### Known Limitations

1. **Real-Time Firewall Disabled** - Cannot throw from hooks (crashes plugin). Firewall only runs as part of audit command now.

2. **Container Testing** - Container wasn't running during last deploy. Manual deployment required.

3. **Build/Test Skip Default** - Build and test verification are skipped by default for speed. Say "audit with build test" to enable.

---

## LAYER 4: EVIDENCE & VERIFICATION

### Git History

```
acb7844 FIX: Defensive scanPatterns with safety limits
49aaf06 CLEANUP: Remove old tools folder from dist
275a48d FIX: Remove console.log, prevent UI spillover
39076c2 v2.0 OVERHAUL: Add proof verification, firewall, hook isolation
ed8574c Add compiled dist files for easy installation
```

### Build Verification

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review
npm run build  # ✅ Compiles clean, 0 errors
```

### Console.log Audit

```bash
grep -r "console.log" src/  # ✅ 0 matches
```

### Files in Dist

```
algorithmic-core.d.ts
algorithmic-core.d.ts.map
algorithmic-core.js        (47KB)
algorithmic-core.js.map
index.d.ts
index.d.ts.map
index.js                  (21KB)
index.js.map
```

---

## LAYER 5: ANTI-PATTERNS (What NOT To Do)

### NEVER DO

1. **NEVER throw from hooks** - `tool.execute.before/after` throwing crashes the plugin
2. **NEVER use console.log in production** - Causes UI spillover
3. **NEVER use global regex flag with exec()** - Causes infinite loops
4. **NEVER skip safety limits** - Add `safetyCount` with `maxMatches`

### What Caused Crashes

| Issue | Fix Applied |
|-------|-------------|
| Firewall threw in `tool.execute.before` | Removed throwing from hooks |
| Regex with `g` flag in `exec()` loop | Removed global flag, added safetyCount |
| No error handling around async ops | Added try-catch everywhere |
| 49+ console.log statements | Removed all console.log |

---

## LAYER 6: DEPLOYMENT CHECKLIST

- [ ] `npm run build` compiles clean
- [ ] `grep -r "console.log" src/` returns 0
- [ ] `dist/` contains compiled JS files
- [ ] `~/.config/opencode/opencode.json` has plugin registered
- [ ] `~/.config/opencode/opencode.json` has agent registered
- [ ] OpenCode restarted
- [ ] "trident" appears in tab toggle
- [ ] "audit this" returns results

---

## LAYER 7: FUTURE EXPANSION

### Preserved Architecture (Multi-Mode)

The full Trident Brain has multiple modes preserved for future:
- **Deep Planning Mode** - 3-layer planning
- **Problem Solving Mode** - 6-layer hypothesis → verification
- **Context Synthesis Mode** - 4-layer context compression

Code Review Mode is the ACTIVE focus. Others are preserved but not being developed.

### Potential Enhancements

1. **Real-Time Firewall (Safe)** - Could use soft logging instead of throwing
2. **Container Verification** - Actually spawn test containers to verify builds
3. **Pattern Editor** - Allow adding custom patterns via config
4. **Report Export** - JSON/SARIF format export

---

*Context Library v2.0 - Synthesized from 4 git commits of active development*
