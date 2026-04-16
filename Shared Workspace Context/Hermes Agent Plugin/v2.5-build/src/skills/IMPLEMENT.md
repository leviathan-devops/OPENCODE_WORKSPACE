---
name: implement
type: orchestration
description: Full feature implementation from plan to verify
executionMode: fork
episodeTimeout: 3600000
contextScope: isolated
triggerPatterns:
  - "^/implement"
  - "implement"
  - "build this"
  - "add feature"
chain:
  - skill: plan
    mode: fork
    inputTemplate: "{user_request}"
    captureOutput: true
  - skill: tdd
    mode: thread
    inputTemplate: "{previous.summary}"
    captureOutput: true
  - skill: verify
    mode: thread
    inputTemplate: "{previous.summary}"
    captureOutput: true
  - skill: grill
    mode: fork
    inputTemplate: "Implementation verified.\n\n{previous.summary}"
    captureOutput: true
outputTemplate: |
  ## Implementation Complete

  {verify.output.summary}

  ### Plan
  {plan.output.summary}

  ### TDD
  {tdd.output.summary}

  ### Security Review
  {grill.output.summary}
---

# /implement — Full Feature Implementation

Execute the full implementation chain: plan -> tdd -> verify -> grill

## Activation
Triggered when user says: "build this", "implement", "add feature", "/implement"

## How It Works

1. **FORK /plan** (blocking)
   - User collaborates on the plan
   - Plan must be approved before proceeding
   - No-placeholder planning with exact paths and code

2. **THREAD /tdd** (async)
   - RED-GREEN-REFACTOR cycle runs
   - User can check progress
   - TDD enforcement active

3. **THREAD /verify** (async)
   - Proof-based verification
   - Actual command output required
   - Coverage and test verification

4. **FORK /grill** (blocking)
   - Adversarial attack session
   - User probes for vulnerabilities
   - Security and edge case review

## Output
Combined completion report with all episode summaries.

## Anti-Rationalization
- [ ] Plan was approved before building
- [ ] TDD cycle completed with all tests passing
- [ ] Verification showed actual proof
- [ ] Grill found no critical vulnerabilities
