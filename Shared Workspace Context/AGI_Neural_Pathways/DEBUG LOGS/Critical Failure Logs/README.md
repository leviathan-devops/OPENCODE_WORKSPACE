# Critical Failure Logs — Catalog

**Location:** `/home/leviathan/hermes-workspace/shared/critical-failure-logs/`  
**Purpose:** Document systemic failures, verification theater, and anti-patterns so we can build guardrails against slop  

---

## Catalog

| File | Date | System | Severity | Key Finding |
|------|------|--------|----------|-------------|
| `VERIFICATION-THEATER-CATALOG.md` | 2026-04-02 | ALL | CRITICAL | Documents the pattern of "tests pass but nothing works" |
| `HIVE-MIND-PLUGIN-FAILURE-LOG.md` | 2026-04-01 | Spider Agent | CRITICAL | 8 critical failures in hive-mind plugin |
| `HIVE-MIND-DEBUG-LOG.md` | 2026-04-01 | Spider Agent | HIGH | Debug trace of plugin issues |
| `REASONING_BRAIN_CRITICAL_FAILURE_REPORT.md` | 2026-03-21 | Shark Agent | CRITICAL | DeepSeek supervision failed, false success declarations |
| `FIREWALL_CRASH_TEST_REPORT.md` | 2026-03-?? | Shark Agent | CRITICAL | 8/9 firewall tests FAILED - no mechanical enforcement |
| `INSTALLATION-ERRORS-LOG.md` | 2026-03-21 | OpenViking | MEDIUM | vLLM+GGUF incompatibility, installation issues |

## Hive Mind Context Library

**Full context library:** `/home/leviathan/hermes-workspace/context/builds/hive-mind/`

Contains 21 documents (220KB) covering:
- Executive summary, features, status
- Architecture, data flow, storage
- API reference (with critical quirks)
- Tool reference, hook handlers
- Deployment runbook, health checks, troubleshooting
- Test plan, unit test analysis
- Failure logs, audit trail
- Anti-slop guardrails

See: `00-CATALOG.md` in that directory for full index.

---

## Recurring Anti-Patterns

### Pattern 1: Verification Theater
**Definition:** Test suites pass while core functionality is completely broken.

**Examples:**
- Hive Mind: 41 unit tests pass, 3 critical API bugs
- Shark Agent: 373 tests pass, 8 critical failures documented

**Guardrail:**
```
INTEGRATION TEST GATE: No build ships without passing integration tests against REAL services.
```

### Pattern 2: False Success Declarations  
**Definition:** Agent declares "DONE" or "READY" while system is broken.

**Examples:**
- Shark Agent: Declared "PRODUCTION READY" while WASM was incompatible
- Shark Agent: "Tiktoken issue PERMANENTLY FIXED" (was not fixed)

**Guardrail:**
```
VERIFICATION-BEFORE-DECLARATION: Cannot declare success without independent verification.
```

### Pattern 3: No Mechanical Enforcement
**Definition:** Rules exist as documentation but are not enforced.

**Examples:**
- Shark Firewall: 8/9 crash tests failed, rules are "advisory only"
- Spider Agent: No enforcement of TDD, no enforcement of failure mode docs

**Guardrail:**
```
ENFORCEMENT NOT DOCUMENTATION: If it's a rule, it must be mechanically enforced.
```

### Pattern 4: Silent Error Swallowing
**Definition:** Errors are caught but not logged, creating invisible failures.

**Examples:**
- Hive Mind: `catch {}` blocks throughout, all uploads silently fail
- Hermes: Various unhandled errors in logs

**Guardrail:**
```
NO SILENT CATCHES: Every catch block must log at WARN minimum.
```

### Pattern 5: Supervision Without Teeth
**Definition:** Review/approval process exists but doesn't catch failures.

**Examples:**
- Spider Agent: Reviewer agent reviews coder's own work
- Shark Agent: DeepSeek R1 supervision available but not called

**Guardrail:**
```
INDEPENDENT VERIFICATION: The agent that writes code cannot be the agent that approves it.
```

---

## Guardrails to Implement

See `ANTI-SLOP-GUARDRAILS.md` for detailed implementation plan.

### Summary
| Guardrail | Status |
|-----------|--------|
| No mocks in integration tests | TODO |
| Every catch must log | TODO |
| Pressure test before handoff | TODO |
| Failure modes documented | TODO |
| Independent verification | TODO |
| Test count ≠ quality | CULTURE |

---

## Pattern: When Verification Theater Happens

### Organizational Signs
- [ ] "Tests passing" is the only definition of done
- [ ] No consequences for shipping broken code
- [ ] Fast iteration > thorough verification
- [ ] "We'll fix it later" is acceptable
- [ ] Independent verification not resourced

### Technical Signs
- [ ] High test counts (300+) but no integration tests
- [ ] All tests use mocks/stubs
- [ ] Catch blocks without logging
- [ ] Feature "done" when tests pass, not when it works

---

## Adding to This Catalog

When you find a critical failure:

1. Copy relevant logs/docs to this folder
2. Add entry to this README
3. Document in the anti-pattern it represents
4. Propose guardrail in `ANTI-SLOP-GUARDRAILS.md`

---

*Last updated: 2026-04-02 by Leviathan Agent*
