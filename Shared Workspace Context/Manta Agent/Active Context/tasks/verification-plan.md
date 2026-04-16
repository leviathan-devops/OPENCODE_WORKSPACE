# Manta Agent - Remediation Plan

## Goal
Fix the identified architectural breaks in the gate transition logic and ensure a robust, deterministic gate chain.

## Tasks

### 1. Fix Premature Transitions (The "Aggressive Gate" Problem)
- [ ] **Fix BUILD $\rightarrow$ TEST**: Implement a check to ensure only implementation files (or a specific set of files) trigger the transition.
- [ ] **Fix TEST $\rightarrow$ VERIFY**: Ensure the transition only occurs after actual test results are detected or specific verification commands are run, not just any `ls` or `node` command.
- [ ] **Fix AUDIT $\rightarrow$ DELIVERY**: Remove the "any terminal command" trigger. Require actual SAST/audit output or a specific `audit-complete` signal.

### 2. Fix False Positive VERIFY Failures
- [ ] Refine the `verifyHasFailure` logic to be less sensitive to the word "failure" in non-error contexts.

### 3. Robustify VERIFY $\rightarrow$ AUDIT Transition
- [ ] Expand the detection patterns for the `VERIFY $\rightarrow$ AUDIT` transition to be more resilient.

### 4. End-to-End Regression Testing
- [ ] Once fixes are implemented, run the `repro_breaks.ts` script to ensure all breaks are resolved.
- [ ] Run the full `bun test` suite to ensure no regressions.
