# Testing — Full Test Suite and Verification Commands

**Version:** v3.0  
**Date:** 2026-04-14  

---

## Test Categories

| Category | Test File | What It Tests | Pass Criteria |
|----------|-----------|---------------|---------------|
| **E2E** | `test-e2e.ts` | Tool logic in isolation with mock context | ≥144/147 |
| **Integration** | `test-real-session.ts` | Hooks firing in actual OpenCode session | 29/29 hooks |
| **Delegation** | `test-delegation-chain.ts` | hermes→analyst→builder→reviewer chain | Full chain fires |
| **State Machine** | `test-state-machine.ts` | Phase transitions + persistence | 7/7 transitions |
| **Memory** | `test-memory.ts` | Cross-session recall/remember | Returns prior data |
| **Regression** | `test-regression.ts` | No Spider/Manta/Shark breakage | All pass |
| **Container TUI** | `test-tui-replica.sh` | TUI test in Docker sandbox | All SHIP criteria |

---

## Test Commands

### E2E Baseline
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/v3-build/
bun test-e2e.ts
# Must return: 144+/147 (98%+)
```

### Build Verification (Pre-flight)
```bash
# Verify dist is fresh (mtime check)
./scripts/BUILD_VERIFY.sh
# Must exit 0 — dist/index.js mtime > all src/**/*.ts mtime
```

### Hook Verification (Integration)
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/v3-build/
bun test-real-session.ts --verbose
# Outputs hook firing evidence for all 29 hooks
# Writes: HOOK_VERIFICATION_LOG.md
```

### Delegation Chain Test
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/v3-build/
bun test-delegation-chain.ts
# Verifies: hermes→analyst→builder→reviewer
# Outputs: DELEGATION_CHAIN_LOG.md
```

### State Machine Test
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/v3-build/
bun test-state-machine.ts
# Tests all 7 phase transitions
# Tests hot-reload persistence
# Outputs: STATE_MACHINE_LOG.md
```

### Memory System Test
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/v3-build/
bun test-memory.ts
# Tests hermes_remember → hermes_recall cross-session
# Outputs: MEMORY_LOG.md
```

### Full Test Suite
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/v3-build/
./scripts/run-all-tests.sh
# Runs all tests in sequence
# Produces: FULL_TEST_REPORT.md
```

---

## HOOK_VERIFICATION_LOG.md Template

```markdown
# HOOK VERIFICATION LOG

**Date:** [timestamp]
**Build:** [v3-build hash]
**Test Run:** [test-real-session.ts output]

## Hooks Verified (n/29)

| Hook | Event | Firing Evidence | Status |
|------|-------|-----------------|--------|
| brainstorm-gate | messages.transform | [log snippet] | ✅ VERIFIED |
| plan-validator | messages.transform | [log snippet] | ✅ VERIFIED |
| ... | ... | ... | ... |

## Hooks NOT Verified (n/29)

| Hook | Event | Why Not Verified | Next Action |
|------|-------|------------------|-------------|
| [name] | [event] | [reason] | [fix to apply] |

## Hook Firing Order

```
[tool.execute.before]
  → guardrails
  → scope-guard
  → tdd-enforcer
  → delegation-gate
  → activity
[tool.execute.after]
  → phase-monitor
  → self-review
  → debugging-spiral
  → ...
```

## Issues Found

[None / List of issues]
```

---

## STATE_MACHINE_LOG.md Template

```markdown
# STATE MACHINE VERIFICATION LOG

**Date:** [timestamp]
**Build:** [v3-build hash]

## Transitions Tested

| From | To | Result | Evidence |
|------|-----|--------|----------|
| idle | analyze | ✅ PASS | [phase.json before/after] |
| analyze | plan | ✅ PASS | [phase.json before/after] |
| ... | ... | ... | ... |

## Persistence Test

**Hot-reload test:** [PASS/FAIL]
**Evidence:** [restart + phase check]

## Illegal Transition Tests

| From | To | Expected | Actual | Result |
|------|-----|----------|---------|--------|
| idle | build | ERROR | [what happened] | ✅ PASS |
| ... | ... | ... | ... | ... |

## Issues Found

[None / List of issues]
```

---

## DELEGATION_CHAIN_LOG.md Template

```markdown
# DELEGATION CHAIN VERIFICATION LOG

**Date:** [timestamp]
**Build:** [v3-build hash]
**Task:** [user task]

## Chain Verification

```
[User] "implement user authentication"
  ↓
[Hermes] delegates to analyst
  ↓ [VERIFIED: delegation ledger entry]
[Analyst] returns specs
  ↓
[Hermes] delegates to builder
  ↓ [VERIFIED: delegation ledger entry]
[Builder] TDD cycle (test first)
  ↓
[Hermes] delegates to reviewer
  ↓ [VERIFIED: delegation ledger entry]
[Reviewer] returns approval
  ↓
[Hermes] phase → complete
```

## Phase Timeline

| Phase | Entered At | Delegation |
|-------|------------|------------|
| idle | T+0s | - |
| analyze | T+5s | hermes→analyst |
| plan | T+15s | plan validated |
| build | T+20s | hermes→builder |
| review | T+45s | hermes→reviewer |
| complete | T+60s | reviewer approved |

## Issues Found

[None / List of issues]
```

---

## MEMORY_LOG.md Template

```markdown
# MEMORY SYSTEM VERIFICATION LOG

**Date:** [timestamp]
**Build:** [v3-build hash]

## hermes_remember Test

**Operation:** hermes_remember("test-key", "test-value")
**Result:** [PASS/FAIL]
**Evidence:** [output]

## hermes_recall Test

**Operation:** hermes_recall("test-key")
**Expected:** test-value
**Actual:** [what was returned]
**Result:** [PASS/FAIL]

## Cross-Session Test

**Session A:** Stored test-key at T+0
**Session B:** Recalled at T+5
**Result:** [PASS/FAIL — data returned]
**Evidence:** [session B output]

## knowledge-injector Test

**Setup:** Memory has relevant entry
**Turn 1:** Tool call made
**Turn 2:** System prompt check — memory injected?
**Result:** [PASS/FAIL]
**Evidence:** [system prompt snippet]

## Issues Found

[None / List of issues]
```

---

## Regression Test

### Spider Agent Regression
```bash
# While hermes-agent loaded, spider coder should NOT be blocked
# Run spider coder subagent task
# Verify: file written successfully, no [HARD-GATE BLOCKED] message
```

### Manta Agent Regression
```bash
# While hermes-agent loaded, manta tools should still work
# Run manta status, manta-gate
# Verify: no interference
```

### Shark Agent Regression
```bash
# While hermes-agent loaded, shark tools should still work
# Run shark status, shark-evidence
# Verify: no interference
```

---

## Full Test Report Template

```markdown
# FULL TEST REPORT — Hermes v3

**Date:** [timestamp]
**Build:** [v3-build hash]
**Status:** [READY TO SHIP / NOT READY]

## Test Results

| Test | Result | Details |
|------|--------|---------|
| E2E (test-e2e.ts) | 147/147 ✅ | [details] |
| Build Verification | PASS ✅ | dist mtime fresh |
| Hook Verification | 29/29 ✅ | [HOOK_VERIFICATION_LOG.md] |
| Delegation Chain | PASS ✅ | [DELEGATION_CHAIN_LOG.md] |
| State Machine | 7/7 ✅ | [STATE_MACHINE_LOG.md] |
| Memory System | PASS ✅ | [MEMORY_LOG.md] |
| Regression | PASS ✅ | Spider/Manta/Shark OK |
| Container TUI | PASS ✅ | [test-tui-replica.sh output] |

## Known Issues

[None / List]

## Verdict

**[READY TO SHIP / NOT READY — issues must be fixed before ship]**
```
