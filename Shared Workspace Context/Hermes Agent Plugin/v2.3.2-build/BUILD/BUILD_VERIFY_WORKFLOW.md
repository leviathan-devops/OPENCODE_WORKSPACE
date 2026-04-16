# HERMES AGENT PLUGIN v2 — BUILD/TEST/VERIFY WORKFLOW

**For**: Spider Agent Execution  
**Created**: 2026-04-03  
**Scope**: Fully self-contained build/test/verify pipeline for v2-build  
**Success**: Clean compile + "works as designed" (production-grade, ship-ready)

---

## PHASE 0: INVESTIGATION

**Goal**: Understand current v2-build state vs. what's needed

- [ ] Read `v2-build/BUILD_CONTEXT.md` — understand the 10 Priority items
- [ ] Read `v2-build/HANDOVER/HERMES_V2_HANDOVER.md` — understand what's been done
- [ ] Read `v2-build/BUILD_INDEX.md` — understand implementation order
- [ ] Compare `v2-build/src/` source files against HANDOVER claims
- [ ] Verify which Priority 0/1 items are actually fixed vs. still stubs

**Acceptance**: Documented inventory of "what's done vs. what's stubbed"

---

## PHASE 1: DEPENDENCY INSTALL & CLEAN BUILD

**Goal**: Verify reproducible build from scratch

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2-build"
rm -rf node_modules dist
bun install
bun build.ts
```

### Verification Checklist

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 1.1 | `bun build.ts` exits 0 | `echo $?` after build | `0` |
| 1.2 | `dist/index.js` exists | `ls -la dist/index.js` | file exists, ≥15,000 lines |
| 1.3 | Syntax valid | `node --check dist/index.js` | "Syntax OK" or no output |
| 1.4 | Typecheck passes | `npx tsc --noEmit` | 0 errors, exit 0 |

---

## PHASE 2: SOURCE AUDIT

**Goal**: Confirm all Priority 0/1 fixes are actually implemented, not stubs

### Priority 0 — Enforcement (MUST be real)

| # | File | Check | Verify Method |
|---|------|-------|---------------|
| 0.1 | `src/hooks/tdd-enforcer.ts` | `testFileExists()` uses `existsSync()` | `grep "existsSync" src/hooks/tdd-enforcer.ts` |
| 0.2 | `src/hooks/delegation-gate.ts` | `checkReviewerApproval()` reads from `~/.hermes/approvals/` | No `return true` stub |
| 0.3 | `src/hooks/snapshot-writer.ts` | Calls `SessionDB.saveSnapshot()` | Not stubbed `writeFileSync` |

### Priority 1 — Tool Realization (MUST execute real commands)

| # | File | Check | Verify Method |
|---|------|-------|---------------|
| 1.1 | `src/tools/quality.ts` | `lint` spawns `eslint`, `buildCheck` spawns `tsc` | No hardcoded "✓ No lint errors" |
| 1.2 | `src/tools/security.ts` | `testRunner` spawns `npm test`, `sastScan` spawns `semgrep` | Real subprocess calls |
| 1.3 | `src/tools/analysis.ts` | `symbols` parses AST, `imports` parses real statements | Not stubbed |
| 1.4 | `src/tools/verification.ts` | `verify` runs real test/build/lint, `grill` analyzes code | Real implementation |
| 1.5 | `src/tools/session-tools.ts` | Uses `SessionDB` | Not hardcoded return strings |
| 1.6 | `src/tools/hermes-*.ts` | Memory path is `~/.hermes/memory/` | Path inspection |

### Stub Detection Commands

```bash
# Search for stub patterns
grep -rn "return true;" src/hooks/  # Should find none (except guardrails)
grep -rn "return true;" src/tools/  # Should find none
grep -rn "TODO\|FIXME\|STUB" src/   # Should find none
grep -rn '"✓.*"' src/tools/          # Hardcoded success = stub indicator
```

### Audit Checklist

- [ ] `src/hooks/tdd-enforcer.ts` — `testFileExists()` uses `existsSync()`
- [ ] `src/hooks/delegation-gate.ts` — `checkReviewerApproval()` reads approval files
- [ ] `src/hooks/snapshot-writer.ts` — Uses SessionDB, not bare writeFileSync
- [ ] `src/tools/quality.ts` — All 4 tools spawn real subprocesses
- [ ] `src/tools/security.ts` — All 4 tools spawn real subprocesses
- [ ] `src/tools/analysis.ts` — All 5 tools parse/analyze real content
- [ ] `src/tools/verification.ts` — All 5 tools perform real verification
- [ ] `src/tools/session-tools.ts` — Uses SessionDB
- [ ] `src/tools/hermes-remember.ts` — Memory path = `~/.hermes/memory/`
- [ ] `src/tools/hermes-recall.ts` — Memory path = `~/.hermes/memory/`
- [ ] `src/tools/hermes-context.ts` — Memory path = `~/.hermes/memory/`
- [ ] Zero `return true;` stubs in enforcement hooks
- [ ] Zero `TODO`/`FIXME`/`STUB` in implementations

---

## PHASE 3: STATIC VALIDATION

**Goal**: Verify plugin structure is correct before runtime testing

### 3.1 Plugin Manifest Check

```javascript
// Load compiled plugin and verify structure
const plugin = require('./dist/index.js');
// plugin.name === 'hermes-agent'
// plugin.agent.length === 19
// Object.keys(plugin.tool).length >= 28
// typeof plugin['tool.execute.before'] === 'function'
```

### 3.2 Tool Schema Validation

Each tool must have:
- `description`: non-empty string
- `args`: object (even if empty `{}`)
- `execute`: async function with correct signature

### 3.3 Hook Signature Verification

```javascript
const hooks = [
  'tool.execute.before',
  'tool.execute.after', 
  'experimental.chat.messages.transform',
  'experimental.chat.system.transform',
  'experimental.session.compacting'
];
```

### Static Validation Checklist

- [ ] Plugin name is `hermes-agent`
- [ ] Exactly 19 agents registered
- [ ] At least 28 tools registered
- [ ] `tool.execute.before` hook present
- [ ] `tool.execute.after` hook present
- [ ] `experimental.chat.messages.transform` hook present
- [ ] `experimental.chat.system.transform` hook present
- [ ] `experimental.session.compacting` hook present
- [ ] All tool schemas have description + args + execute

---

## PHASE 4: RUNTIME VERIFICATION

**Goal**: Plugin actually loads and functions in OpenCode

### 4.1 OpenCode Load Test

```bash
opencode --version
opencode plugins list 2>/dev/null || echo "plugin command available"
```

### 4.2 E2E Test Suite

Create `v2-build/test-e2e.ts` that tests:

#### Plugin Initialization (6 tests)
- [ ] Plugin name is `hermes-agent`
- [ ] Has exactly 19 agents
- [ ] Has at least 28 tools
- [ ] Has `tool.execute.before` hook
- [ ] Has `tool.execute.after` hook
- [ ] Has `experimental.chat.messages.transform` hook

#### Tool Execution (12 tests)
- [ ] `lint` tool runs on `v2-build/src/` and returns real output
- [ ] `buildCheck` tool runs `tsc --noEmit` and returns real result
- [ ] `syntaxCheck` tool runs on a real TypeScript file
- [ ] `testRunner` tool attempts `npm test`
- [ ] `placeholderScan` scans source for placeholders
- [ ] `sastScan` runs security scan
- [ ] `secretScan` detects patterns
- [ ] `hermesRemember` stores to `~/.hermes/memory/`
- [ ] `hermesRecall` retrieves from `~/.hermes/memory/`
- [ ] `listSessions` lists sessions
- [ ] `grill` analyzes a real file
- [ ] `verify` runs verification sequence

#### Hook Firing (3 tests)
- [ ] TDD enforcer fires on `write_file` during BUILD phase
- [ ] Delegation gate fires on `complete_task` without approval
- [ ] Snapshot writer fires on `checkpoint`

### 4.3 Run E2E Suite

```bash
cd v2-build
bun test-e2e.ts
```

**Success threshold**: ≥95% tests pass (≥25/28)

---

## PHASE 5: PRODUCTION READINESS CHECKLIST

| # | Checklist Item | Verify Method |
|---|---------------|--------------|
| 1 | Zero `TODO`/`FIXME`/`STUB` in source | `grep -r "TODO\|FIXME\|STUB" src/` |
| 2 | No hardcoded success returns | Code review tool `execute` functions |
| 3 | All tools handle errors gracefully | Test with invalid inputs |
| 4 | Memory tools use `~/.hermes/memory/` | Path inspection |
| 5 | SessionDB uses `~/.opencode/.hermes/sessions/` | Path inspection |
| 6 | TDD enforcer uses real `existsSync` | Code review |
| 7 | Delegation gate reads real approval files | Code review |
| 8 | All 28 tools have descriptions | Schema validation |
| 9 | Hooks don't throw (errors caught) | E2E test |
| 10 | TypeScript strict mode clean | `npx tsc --noEmit` |

---

## PHASE 6: ARTIFACT GENERATION

- [ ] Final `dist/index.js` — verified working plugin
- [ ] `BUILD_VERIFY_REPORT.md` — Phase-by-phase verification results
- [ ] `TEST_RESULTS.md` — E2E test output (pass/fail for each test)
- [ ] Update `HANDOVER/HERMES_V2_HANDOVER.md` — Reflect final state

---

## SUCCESS CRITERIA SUMMARY

| Criterion | Threshold |
|-----------|-----------|
| Clean compile | `bun build.ts` exits 0, `tsc --noEmit` 0 errors |
| Syntax valid | `node --check dist/index.js` passes |
| Line count | dist/index.js ≥ 15,000 lines |
| Source audit | Zero stub returns, zero `return true;` in enforcement |
| Type safety | TypeScript strict mode clean |
| Tool count | ≥28 tools registered |
| Hook count | ≥5 lifecycle hooks registered |
| E2E pass rate | ≥95% (≥25/28 tests pass) |
| Production ready | All 10 production checklist items pass |

---

## COMMAND REFERENCE

```bash
# Phase 1: Clean build
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2-build"
rm -rf node_modules dist
bun install
bun build.ts
node --check dist/index.js
npx tsc --noEmit

# Phase 2: Source audit
grep -rn "return true;" src/hooks/
grep -rn "return true;" src/tools/
grep -rn "TODO\|FIXME\|STUB" src/

# Phase 4: E2E tests
cd v2-build
bun test-e2e.ts
```

---

**Document Created**: 2026-04-03  
**Status**: READY FOR EXECUTION
