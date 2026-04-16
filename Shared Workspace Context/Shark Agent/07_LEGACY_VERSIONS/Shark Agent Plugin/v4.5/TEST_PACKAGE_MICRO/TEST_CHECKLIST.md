# Shark Micro Agent — Test Checklist

**Tester:** _________________________
**Date:** 2026-04-07
**Agent:** shark-micro
**Plugin:** shark-agent-v4.5

---

## Pre-flight Checks

| Check | Description | Verified |
|-------|-------------|----------|
| PF-01 | OpenCode is running and accessible | ☐ |
| PF-02 | shark-micro agent responds to @shark-micro | ☐ |
| PF-03 | shark-status tool accessible | ☐ |
| PF-04 | shark-gate tool accessible | ☐ |
| PF-05 | shark-evidence tool accessible | ☐ |
| PF-06 | Test project directory available | ☐ |

---

## Exercise Results

### P0 — Critical (Must Pass)

| Exercise | Component | Status | Pass/Fail |
|----------|-----------|--------|-----------|
| e001 | shark-status tool | Tool returns JSON with micro variant | ☐ |
| e002 | shark-gate criteria | All 6 gates have blocking criteria | ☐ |
| e003 | Guardian dangerous command | Hook logs warning, cannot block | ☐ |
| e005 | Gate auto-advance BUILD→TEST | Auto-advances on file write | ☐ |
| e006 | Gate auto-advance TEST→VERIFY | Auto-advances on test pass pattern | ☐ |
| e008 | Iteration loop init | V1.0, verifyAttempts=0 | ☐ |
| e012 | Gate manual evaluate | Gate marked passed | ☐ |
| e017 | Evidence collection | Evidence returned for gates | ☐ |
| e018 | Verify attempts counter | Counter increments 0→1→2→3 | ☐ |
| e019 | Gate status all | All 6 gates present | ☐ |

### P1 — Important

| Exercise | Component | Status | Pass/Fail |
|----------|-----------|--------|-----------|
| e004 | Guardian zone classification | Personal/System zones flagged | ☐ |
| e009 | Self-rejection T1 prompt | Mandatory language present | ☐ |
| e010 | Brain switch Plan Brain | Plan Brain identity confirmed | ☐ |
| e011 | Brain switch Build Brain | Build Brain identity confirmed | ☐ |
| e013 | Gate manual advance | Gate advances manually | ☐ |
| e014 | Iteration escalation detect | V1.0→V1.1 after 3 failures | ☐ |
| e015 | System transform hook | Enforcement context injected | ☐ |
| e016 | State persistence checkpoint | gate-state.json saved | ☐ |

### P2 — Complex

| Exercise | Component | Status | Pass/Fail |
|----------|-----------|--------|-----------|
| e020 | Coordinator T1 text | Coordinator role described | ☐ |

---

## Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| P0 Critical | _____ | _____ | 10 |
| P1 Important | _____ | _____ | 8 |
| P2 Complex | _____ | _____ | 1 |
| **Total** | _____ | _____ | 19 |

---

**Tester:** _________________________ Date: _________

**Reviewer:** _________________________ Date: _________