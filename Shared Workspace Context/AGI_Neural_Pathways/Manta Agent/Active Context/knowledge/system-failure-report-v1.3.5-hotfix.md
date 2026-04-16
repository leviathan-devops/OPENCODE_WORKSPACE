# Manta Agent V1.3.5-hotfix — System Failure Report

**Date:** 2026-04-11  
**Version:** 1.3.5-hotfix  
**Build Status:** ❌ UNSTABLE (Architectural Gate Failures)

---

## Executive Summary

While the micro-architecture overhaul (v1.3.5-hotfix) successfully addressed the `isMantaAgent` identity bug in CLI mode, the gate transition logic remains fundamentally flawed. The current implementation of `checkGateAdvance` in `gate-hook.ts` relies on overly aggressive and brittle heuristics, leading to premature gate advancement and false positive failure detections. This undermines the entire purpose of the mechanical gate chain and the integrity of the build process.

---

## Critical Failures

### 1. Premature BUILD $\rightarrow$ TEST Transition
* **Problem:** The transition from `BUILD` to `TEST` is triggered by *any* file write operation.
* **Root Cause:** `checkGateAdvance` (Lines 172-178) only checks if the tool is in a list of write tools (`write_file`, `patch`, etc.). It does not verify if the written file is an implementation file or if the implementation is complete.
* **Impact:** The agent can enter the `TEST` gate while still in the middle of the `BUILD` phase, leading to incomplete testing and broken builds.

### 2. Premature TEST $\rightarrow$ VERIFY Transition
* **Problem:** Common terminal commands (e.g., `ls`, `node`) trigger an immediate transition to the `VERIFY` gate.
* **Root Cause:** `checkGateAdvance` (Lines 207-215) uses a broad regex pattern for `verifyCommands` that includes `ls`, `node`, etc.
* **Impact:** The agent skips the actual testing phase, moving to verification before any actual tests have been executed or results analyzed.

### 3. Weak AUDIT $\rightarrow$ DELIVERY Transition
* **Problem:** Any terminal command (e.g., `cat`, `grep`, `ls`) in the `AUDIT` gate triggers an immediate transition to `DELIVERY`.
* **Root Cause:** `checkGateAdvance` (Lines 290-292) implements a "pragmatic" advance that assumes any command in the `AUDIT` gate constitutes an audit.
* **Impact:** This is a critical security failure. The agent can bypass the entire security/audit process simply by running a trivial command, moving straight to delivery.

### 4. False Positive VERIFY Failure
* **Problem:** The `VERIFY` gate incorrectly detects failures when the word "failure" appears in non-error contexts.
* **Root Cause:** `checkGateAdvance` (Lines 71-75) uses simple string matching (`includes('fail')`) on the tool output.
* **Impact:** Triggers unnecessary iteration loops and escalation, wasting resources and causing agent confusion.

---

## Test Results (Reproduction via `repro_breaks.ts`)

| Test Case | Expected Gate | Actual Gate | Result |
| :--- | :--- | :--- | :--- |
| Premature BUILD $\rightarrow$ TEST (config.json) | `build` | `test` | ❌ FAIL |
| Premature TEST $\rightarrow$ VERIFY (ls) | `test` | `verify` | ❌ FAIL |
| Weak AUDIT $\rightarrow$ DELIVERY (cat README.md) | `audit` | `delivery` | ❌ FAIL |
| False Positive VERIFY Failure | `verify` | `verify` (with failure log) | ⚠️ FAIL (False Positive) |

---

## Remediation Roadmap

1.  **Refine Transition Triggers**: Implement file-type and content-aware triggers for `BUILD` and `TEST` transitions to ensure implementation completeness.
2.  **Secure the AUDIT Gate**: Replace the "pragmatic" `AUDIT` advance with a requirement for explicit, successful security scan results.
3.  **Robust Failure Detection**: Implement more sophisticated failure detection in the `VERIFY` gate to avoid false positives.
4.  **Regression Testing**: Use the `repro_breaks.ts` suite to verify all fixes and ensure no new regressions are introduced.
