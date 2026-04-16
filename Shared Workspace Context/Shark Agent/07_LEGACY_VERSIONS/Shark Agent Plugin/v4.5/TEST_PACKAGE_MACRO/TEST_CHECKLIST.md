# Shark Macro Agent — Test Checklist

**Tester:** _________________________
**Date:** 2026-04-07
**Agent:** shark-macro
**Plugin:** shark-agent-v4.5

---

## Pre-flight Checks

| Check | Description | Verified |
|-------|-------------|----------|
| PF-01 | OpenCode is running and accessible | ☐ |
| PF-02 | shark-macro agent responds to @shark-macro | ☐ |
| PF-03 | shark-status tool accessible | ☐ |
| PF-04 | shark-gate tool accessible | ☐ |
| PF-05 | shark-evidence tool accessible | ☐ |

---

## Exercise Results

### P0 — Critical (Must Pass)

| Exercise | Component | Status | Pass/Fail |
|----------|-----------|--------|-----------|
| e001 | shark-status tool (macro) | Tool returns JSON with macro variant | ☐ |
| e002 | shark-gate criteria | All 6 gates have blocking criteria | ☐ |
| e003 | Guardian dangerous command | Hook logs warning, cannot block | ☐ |
| e005 | Gate auto-advance BUILD→TEST | Auto-advances on file write | ☐ |
| e006 | Gate auto-advance TEST→VERIFY | Auto-advances on test pass pattern | ☐ |
| e008 | Iteration loop init | V1.0, verifyAttempts=0 | ☐ |
| e011 | Gate manual evaluate | Gate marked passed | ☐ |
| e016 | Evidence collection | Evidence returned for gates | ☐ |
| e017 | Verify attempts counter | Counter increments 0→1→2→3 | ☐ |
| e018 | Gate status all | All 6 gates present | ☐ |

### P1 — Important

| Exercise | Component | Status | Pass/Fail |
|----------|-----------|--------|-----------|
| e004 | Guardian zone classification | Personal/System zones flagged | ☐ |
| e009 | Self-rejection T1 prompt | Mandatory language present | ☐ |
| e010 | Execution Brain role | Execution Brain identity confirmed | ☐ |
| e012 | Gate manual advance | Gate advances manually | ☐ |
| e013 | Iteration escalation detect | V1.0→V1.1 after 3 failures | ☐ |
| e014 | System transform hook | Enforcement context injected | ☐ |
| e015 | State persistence checkpoint | gate-state.json saved | ☐ |
| e019 | Guardrails enforcement | Scope violations flagged | ☐ |
| e020 | Error handling complete | Failure recorded, recovery possible | ☐ |

---

## Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| P0 Critical | _____ | _____ | 10 |
| P1 Important | _____ | _____ | 10 |
| **Total** | _____ | _____ | 20 |

---

**Tester:** _________________________ Date: _________

**Reviewer:** _________________________ Date: _________