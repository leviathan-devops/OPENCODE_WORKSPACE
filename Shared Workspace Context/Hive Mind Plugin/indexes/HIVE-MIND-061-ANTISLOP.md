# Anti-Slop Guardrails — Hive Mind Plugin Context

**Document ID:** ANTI-SLOP-HIVE-MIND-001  
**Date:** 2026-04-02  
**Author:** Leviathan Agent  

---

## The Problem: Verification Theater

The Hive Mind plugin (Spider Agent build) passed **41/41 unit tests** but had **3 critical API bugs** that would cause complete functional failure.

**This is verification theater:** Tests pass but core functionality is broken.

---

## Anti-Patterns Found

### Pattern 1: The Mock Trap
```typescript
// VERIFICATION THEATER:
test('should upload', async () => {
  const mockOV = { upload: jest.fn().mockResolvedValue({ success: true }) }
  result = await plugin.uploadToOV(mockOV, ...)
  expect(result.success).toBe(true)  // PASSES
})
// Reality: API expects 'path' not 'temp_file_id'
```

### Pattern 2: Silent Catch
```typescript
// VERIFICATION THEATER:
try {
  await fetch(url)
} catch {
  // Silent failure - no one knows
}
```

### Pattern 3: Self-Certification
```
Coder writes code → Coder writes tests → Coder reviews → Ship
```

---

## Guardrails to Implement

### GUARDRAIL 1: No Mocks in Integration Tests
```
RULE: Integration tests MUST test against real services.
- No mocking OpenViking API
- Real errors must surface
```

### GUARDRAIL 2: Every Catch Must Log
```
RULE: No bare catch blocks. Every catch MUST log.
PATTERN:
  try {
    // ...
  } catch (err) {
    log('ERROR', 'category', 'Operation failed', { error: err.message })
    throw err
  }
```

### GUARDRAIL 3: Pressure Test Before Handoff
```
RULE: Every build MUST be pressure tested by an independent agent.
MANDATORY CHECKS:
  - Run against LIVE services (not mocks)
  - Kill OpenViking, verify fallback works
  - Test with disk full
  - Verify actual behavior matches documented behavior
```

### GUARDRAIL 4: Failure Modes Documented
```
RULE: Every feature MUST document failure modes.
TEMPLATE:
  ## Failure Modes
  - OpenViking down: [what happens, how recovery works]
  - Network timeout: [what happens, retry logic]
  - Invalid API format: [what happens, error handling]
```

### GUARDRAIL 5: Independent Verification
```
RULE: The agent that writes code CANNOT be the agent that reviews or tests it.
Coder → Reviewer → QA (independent) → Sign-off
```

### GUARDRAIL 6: Test Count Is Not Quality
```
RULE: A feature is NOT done just because tests pass.
COMPLETION CRITERIA:
  - [ ] Unit tests pass
  - [ ] Integration tests pass (mandatory)
  - [ ] E2E tests pass
  - [ ] Independent verification
  - [ ] Failure modes documented
  - [ ] No silent catches
```

---

## Code Review Checklist

```
QUALITY CHECKLIST:
  □ No bare catch blocks (grep check)
  □ Error paths tested (not just happy path)
  □ API integration matches ACTUAL API spec
  □ Logging on all critical paths
  □ Failure modes identified and documented
  □ Integration tests exist and pass
  □ No mocks in integration tests

INDEPENDENT VERIFICATION:
  □ Code author: ___________
  □ Reviewer: ___________
  □ Tester (independent): ___________
  □ Critical failures found: ___
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

*Anti-Slop v1.0 — Leviathan Agent — 2026-04-02*
