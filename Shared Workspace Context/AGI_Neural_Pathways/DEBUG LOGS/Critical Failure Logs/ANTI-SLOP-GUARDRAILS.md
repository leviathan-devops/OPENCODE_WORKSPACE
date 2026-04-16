# ANTI-SLOP GUARDRAILS — Enforcement Plan

**Document ID:** ANTI-SLOP-001  
**Date:** 2026-04-02  
**Author:** Leviathan Agent (MiniMax-M2.7)  
**Purpose:** Concrete steps to prevent verification theater and slop  

---

## The Problem

We have documented evidence of verification theater across multiple builds:

1. **Hive Mind Plugin**: 41 unit tests pass, 3 critical API bugs
2. **Shark Agent**: 373 tests pass, 8 critical failures documented  
3. **Shark Firewall**: 9 crash tests, 8 failed - "no mechanical enforcement"
4. **Reasoning Brain**: False success declarations, no DeepSeek supervision

**Root cause:** Quality assurance is a checklist, not a process.

---

## Guardrails to Implement

### GUARDRAIL 1: No Mocks in Integration Tests

**RULE:** Integration tests MUST test against real services.

```
❌ BAD:
  test('should upload', () => {
    const mockOV = { upload: jest.fn().mockResolvedValue({ success: true }) }
    result = plugin.uploadToOV(mockOV, ...)
    expect(result.success).toBe(true)  // PASSES but API might expect 'path' not 'temp_file_id'
  })

✅ GOOD:
  test('should upload to real OpenViking', async () => {
    // Tests against LIVE service
    // If API format changes, test fails
    result = await plugin.uploadToOV('test.md', '# Test', 'viking://...', 'test')
    expect(result.success).toBe(true)  // Only passes if REAL API works
  })
```

**Implementation:**
- Create `tests/integration/` directory for every project
- Integration tests run against real endpoints (localhost:1933, etc.)
- CI gate: Integration tests must pass before merge
- Unit tests CAN mock, integration tests CANNOT

**Detection:**
```bash
# Find test files with mock
grep -r "mockResolvedValue\|jest.fn()" tests/integration/
# Any hits = VIOLATION
```

---

### GUARDRAIL 2: Every Catch Must Log

**RULE:** No bare catch blocks. Every exception MUST be logged.

```typescript
❌ BAD (VERIFICATION THEATER):
  try {
    await fetch(url)
  } catch {
    // Silent failure - no one knows this happened
  }

✅ GOOD:
  try {
    await fetch(url)
  } catch (err) {
    log('ERROR', 'api', 'Fetch failed', { url, error: err.message })
    throw err  // Or return error result with logging
  }
```

**Implementation:**
- ESLint rule: `no-empty-catch` = ERROR
- Custom rule: `catch` without `log` call = ERROR
- Code review checklist: "Did every catch log something?"
- Automated: `grep -n "catch {" src/` to find violations

**Detection:**
```bash
# Find bare catches
grep -rn "catch {" --include="*.ts" src/ | grep -v "log("
# Any hits = VIOLATION
```

---

### GUARDRAIL 3: Pressure Test Before Handoff

**RULE:** Every build MUST be pressure tested by an independent agent before shipping.

```
PHASES:
  1. Architect: Design
  2. Coder: Implement + unit tests
  3. Reviewer: Code review  
  4. QA Agent: Pressure test against REAL infrastructure  ← MANDATORY
  5. Sign-off or Reject
```

**QA Pressure Test Checklist:**
- [ ] Run against LIVE services (not mocks)
- [ ] Kill OpenViking, verify fallback works
- [ ] Test with latency/loss (network degradation)
- [ ] Test with disk full
- [ ] Verify actual behavior matches documented behavior
- [ ] Document: what worked, what failed, what's unverified

**Implementation:**
- Add "Pressure Test" phase to build workflow
- No phase skip allowed
- QA agent must document findings
- Reject build if critical failures found

---

### GUARDRAIL 4: Failure Modes Documented

**RULE:** Every feature MUST document its failure modes.

```typescript
// ❌ BAD: No failure analysis
async function uploadToOV(...) {
  return await fetch(url, ...)  // What if fetch fails? No one knows.
}

// ✅ GOOD: Failure modes documented
/**
 * Uploads to OpenViking.
 * 
 * Failure modes:
 * - OpenViking down: Returns { success: false, localFallbackPath: ... }
 * - Network timeout: Retries once, then returns error
 * - Invalid API format: Logs error, returns { success: false }
 * 
 * @returns { success: boolean, targetUri: string, localFallbackPath?: string, error?: string }
 */
async function uploadToOV(...) { ... }
```

**PR Checklist:**
```
FAILURE MODES:
- [ ] Documented for this feature?
- [ ] All catch blocks log errors?
- [ ] Happy path AND sad path tested?
- [ ] No silent failures?
```

---

### GUARDRAIL 5: Independent Verification

**RULE:** The agent that writes code CANNOT be the agent that reviews or tests it.

```
❌ VERIFICATION THEATER:
  Agent writes code → Agent writes tests → Agent reviews → Ship

✅ INDEPENDENT VERIFICATION:
  Coder writes code → Reviewer reviews → QA tests (independent) → Sign-off
```

**Implementation:**
- Separate agents for each phase
- Coder cannot be reviewer
- Reviewer cannot be QA
- QA must document what they tested
- Human sign-off required for critical systems

---

### GUARDRAIL 6: Test Count Is Not Quality

**RULE:** A feature is NOT done just because tests pass.

```
COMPLETION CRITERIA:
  [ ] Unit tests pass (necessary but not sufficient)
  [ ] Integration tests pass against real API (mandatory)
  [ ] E2E tests pass (for user-facing features)
  [ ] Manual verification by independent agent
  [ ] Failure modes documented
  [ ] No silent catches remaining
  [ ] No "TODO" or "TBD" in code
```

**Metrics to track (and their limits):**
```
❌ MISLEADING: "373 tests passing" (no integration tests)
✅ MEANINGFUL: "41 unit tests + 3 integration tests + 1 E2E test. All pass."
✅ MEANINGFUL: "Critical bugs found: 0. High severity: 0. Medium: 2 (documented)."
```

---

## Implementation Timeline

### Phase 1: Immediate (This Week)
- [ ] Audit existing code for bare catches (`grep -rn "catch {"`)
- [ ] Document all failure modes for Hive Mind plugin
- [ ] Write integration tests for Hive Mind plugin
- [ ] Add "Pressure Test" phase to build workflow

### Phase 2: Short-term (This Month)
- [ ] ESLint rules for logging in catches
- [ ] CI gate for integration tests
- [ ] Template for failure mode documentation
- [ ] Independent verification requirement in process

### Phase 3: Medium-term (This Quarter)
- [ ] Automated catch block detection
- [ ] Dashboard for tracking failure modes
- [ ] Blameless post-mortem process
- [ ] Quality metrics beyond test count

---

## Code Review Checklist

Use this checklist for every PR:

```
QUALITY CHECKLIST:
  □ No bare catch blocks (grep check)
  □ Error paths tested (not just happy path)
  □ API integration matches ACTUAL API spec (verify against docs)
  □ Logging on all critical paths
  □ Failure modes identified and documented
  □ No TODO/TBD in code
  □ Integration tests exist and pass
  □ No mocks in integration tests

INDEPENDENT VERIFICATION:
  □ Code author: ___________
  □ Reviewer: ___________
  □ Tester (independent): ___________
  □ Critical failures found: ___
  □ Blocker issues: ___
```

---

## Metrics That Matter

| Metric | Good | Bad |
|--------|------|-----|
| Test count | Context only | "373 tests!" |
| Test types | Unit + Integration + E2E | Unit only |
| Failures documented | All severity levels | "Tests pass" |
| Verification | Independent agent | Self-certified |
| Errors caught | At test time | In production |

---

## Training: How to Pressure Test

When you're the QA agent:

### 1. Start with the Happy Path
- Does the basic feature work?

### 2. Break the Dependencies
- Kill the database
- Kill the API server
- Block network access
- Fill the disk

### 3. Test the Error Handling
- Does it log errors?
- Does it fail gracefully?
- Does it have retry logic?
- Does it fall back to alternatives?

### 4. Verify the Fixes
- After you break it, does it recover?
- Does it recover cleanly?

### 5. Document Everything
- What worked
- What failed
- What you couldn't test
- Recommendations

---

## Contact

| Role | Agent |
|------|-------|
| Document Author | Leviathan (MiniMax-M2.7) |
| Subject | Hive Mind Plugin + Spider Agent + Shark Agent |
| Build Date | 2026-04-02 |

---

*Part of: `/home/leviathan/hermes-workspace/shared/critical-failure-logs/`*
*See also: `VERIFICATION-THEATER-CATALOG.md` for documented instances*
