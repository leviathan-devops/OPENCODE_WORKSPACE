# Trident Brain - Algorithmic Code Review System

**Status:** ✅ OPERATIONAL - Pure algorithmic pattern-based audit engine

---

## What is Trident Brain?

Trident Brain is a **multi-mode reasoning architecture** for OpenCode agents. Currently, we are focusing on the **Code Review Mode** - an algorithmic code review system that uses **pure pattern matching** (regex classifiers) to detect code quality issues, security vulnerabilities, and verification theater.

**Core Principle:** If a human can write a rule for it, write the rule. The model is ONLY used to READ code - all intelligence is algorithmic.

### Modes Available

| Mode | Status | Description |
|------|--------|-------------|
| **Code Review** | ✅ ACTIVE | Algorithmic pattern-based audit (current focus) |
| Deep Planning | 📋 AVAILABLE | Multi-layer planning with context synthesis |
| Problem Solving | 📋 AVAILABLE | Layered hypothesis → action → verification |
| Context Synthesis | 📋 AVAILABLE | Context collection and compression |

### Why Algorithmic?

Traditional code review AI can be "derailed" - it may:
- Claim success without proof
- Use mock/stub data
- Add theatrical delays to fake work
- Skip actual verification

Trident Brain **cannot be derailed** because:
- Pure regex classifiers don't have opinions
- State machine transitions are rigid
- Evidence is extracted, not asserted
- Build/test execution is mandatory unless explicitly skipped

---

## Architecture

```
trident-brain/
├── src/
│   ├── index.ts                    # Plugin entry point (NO system prompts)
│   ├── algorithmic-core.ts         # Core algorithms (PATTERNS, Scanner, Engine)
│   ├── tools/
│   │   └── algorithmic-tools.ts    # OpenCode tools (audit, status, report, fix)
│   ├── hooks/
│   │   └── trident-hook.ts         # Event hooks (minimal, no logic)
│   ├── modes/                      # Multi-mode architecture (preserved)
│   │   ├── planning/               # Deep Planning Mode
│   │   ├── problem-solving/        # Problem Solving Mode
│   │   └── context-synthesis/      # Context Synthesis Mode
│   └── shared/                     # Shared utilities
├── dist/                           # Compiled output
└── SYSTEM_DIAGNOSTIC_TEST_SUITE.md # Test cases for validation
```

### Code Review Mode - Audit Layers

| Layer | Focus | Detections |
|-------|-------|------------|
| 0 | Simulated Execution | Fake success, theatrical delays, stubs |
| 1 | Build Verification | Missing builds, bundle anomalies |
| 2 | Stub Code | Null/undefined returns, empty functions |
| 3 | Security | SQL injection, XSS, secrets, auth bypass |
| 4 | Isolation | Hook spillover, global state access |
| 5 | Quality | Empty catch, complexity hotspots, resource leaks |
| 6 | Integration | Container verification |

### Pattern Categories (100+ patterns)

| Category | Severity | Examples |
|----------|----------|----------|
| SIMULATED EXECUTION | CRITICAL | `setTimeout → resolve({success:true})`, 100ms delays |
| THEATRICAL CODE | HIGH | TODO with "full implementation", mock data comments |
| STUB CODE | HIGH | Functions returning null, empty async functions |
| SQL INJECTION | CRITICAL | Template literals with `${}` in queries |
| SECRET EXPOSURE | CRITICAL | Hardcoded API keys, tokens, passwords |
| AUTH BYPASS | CRITICAL | `if(true){return true}`, `bypass=true` |
| XSS | HIGH | `innerHTML=`, `dangerouslySetInnerHTML` |
| EMPTY CATCH | MEDIUM | `catch(e){}` |
| HOOK SPILLOVER | HIGH | Agent checks in shared hooks |
| GLOBAL STATE | MEDIUM | `global.*`, `globalThis.*` |
| COMPLEXITY | MEDIUM | 10+ conditionals in 100+ lines |
| RESOURCE LEAK | MEDIUM | Unpaired addEventListener |

---

## Commands (Code Review Mode)

| Command | Description |
|---------|-------------|
| `/audit` or `/audit this` | Start audit on current directory |
| `/audit <path> --depth=7` | Audit specific path with depth |
| `/trident report` | Get full audit report |
| `/trident status` | Show audit status and findings count |
| `/trident fix --severity=critical` | Get fix instructions |

---

## Building & Testing

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Verify build
ls dist/
```

---

## Current State

- ✅ Plugin compiles without errors
- ✅ Registered in OpenCode agent selector as `trident`
- ✅ Responds to `/audit` commands
- ✅ Pattern library with 100+ regex classifiers
- ✅ 7-layer audit engine implemented
- 🔄 Full end-to-end audit execution (output sometimes truncated)
- 🔄 Report file generation to `TRIDENT_CODE_REVIEW.md`

---

## Design Philosophy

1. **Model as Reader** - Model only reads files via fs operations
2. **Algorithm as Brain** - All detection is regex + rules
3. **State as Guardrail** - Rigid layer transitions prevent skipping
4. **Evidence over Assertion** - Findings contain extracted evidence, not claims

---

## Future Modes

The multi-mode architecture is preserved for future expansion:
- **Deep Planning Mode**: 3-layer plan → workflow → context
- **Problem Solving Mode**: 6-layer hypothesis → action → verification
- **Context Synthesis Mode**: 4-layer collect → score → compress → inject

---

*Trident Brain - Mechanical verification, zero derailing*
