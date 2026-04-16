# Gap Analysis: What OpenCode-Swarm LACKS from Spider Agent OS

**Classification:** Systems that DO NOT EXIST in the swarm plugin yet  
**Purpose:** Clear mapping of missing systems that need to be wired in

---

## 1. Anti-Hallucination Validators — MISSING

### What Exists
- `placeholder_scan` detects TODO/stub patterns
- `evidence_check` verifies task evidence completeness
- `reviewer` verifies correctness

### What's Missing
- **Explicit "never claim without verifying" rules** — No mechanical enforcement that prevents agents from claiming file existence, command success, or test passage without actual verification
- **File existence validator** — No check that agents actually read files before claiming content
- **Command exit code validator** — No check that agents capture and verify exit codes
- **API response validator** — No check that agents verify actual API responses vs assumed behavior

### Why It Matters
The swarm's evidence system catches hallucination AFTER the fact (during review). Anti-hallucination validators would PREVENT it at the point of execution — catching simulated output before it enters the pipeline.

### Integration Point
Add as pre-check gates in the EXECUTE pipeline, before reviewer. Should block coder output that contains unverified claims.

---

## 2. Surgical Debug Protocol — MISSING

### What Exists
- **Retry circuit breaker** — 3 failures → sounding board → simplify
- **pre_check_batch** — Pinpoints exact failing gate
- **Structured rejection reasons** — Coder gets specific feedback

### What's Missing
- **6-step structured debug protocol:**
  1. Read the error — don't guess
  2. Read the failing code — understand the context
  3. Form a hypothesis — what specifically is wrong
  4. Make the minimal fix — one change at a time
  5. Verify the fix — run the test/command again
  6. If it fails again — new hypothesis, new approach
- **Error pattern auto-fix database** — Known error patterns with automatic fixes
- **Hypothesis tracking** — Track what hypotheses were tried and their results
- **Minimal change enforcement** — Prevent agents from making sweeping changes when a single-line fix would work

### Why It Matters
The retry circuit breaker restarts the agent but doesn't enforce a structured debugging methodology. Agents can still make wild guesses, apply broad changes, and repeat the same failed approach.

### Integration Point
Replace or enhance the coder retry protocol. Inject the 6-step debug protocol as a mandatory workflow when tests fail.

---

## 3. Stagnation Detection — PARTIAL

### What Exists
- **Loop detection** — architect_loop_detected event
- **Coder retry circuit breaker** — 3 failures → sounding board → simplify
- **max_iterations: 5** — Hard limit on retry cycles

### What's Missing
- **Consecutive identical failure counter** — No explicit tracking of "same error 3 times → switch strategy entirely"
- **Strategy switch enforcement** — No mechanical block preventing the same approach from being retried
- **Escalation protocol** — No structured escalation to lead agent after N failures with full context
- **Failure context capture** — No systematic capture of full failure state for re-planning

### Why It Matters
The circuit breaker resets the agent but doesn't prevent it from trying the same approach again. Without explicit strategy tracking, agents can loop through the same failed approaches.

### Integration Point
Enhance the retry circuit breaker with strategy tracking. After 3 identical failures, force a different approach. After 5, escalate to architect.

---

## 4. Guardian Zone Classification — MISSING

### What Exists
- **secretscan** — Detects credential leaks
- **sast_scan** — Catches security vulnerabilities
- **declare_scope** — Restricts which files coder can modify

### What's Missing
- **Explicit filesystem zone classification** — No WORKSPACE/SANDBOX/SYSTEM/PERSONAL/CONFIG zone system
- **Path-based write blocking** — No mechanical prevention of writes to ~/.ssh, /etc, etc.
- **Sandbox redirection** — No automatic redirection of unsafe writes to sandbox
- **Audit trail for file operations** — No systematic logging of all file operations with zone classification

### Why It Matters
declare_scope restricts coder to specific files but doesn't classify filesystem zones. If scope is misconfigured, there's no secondary protection against writes to sensitive paths.

### Integration Point
Add as a pre-tool-execution hook. Classify target path zone before allowing write operations.

---

## 5. Style Guide Enforcement — MISSING

### What Exists
- **lint** — Runs project linter (biome, eslint, ruff, etc.)
- **reviewer** — Catches style issues during review

### What's Missing
- **Single-word naming enforcement** — No check for multi-word identifiers
- **Technical term exceptions** — No whitelist for allowed multi-word terms (XMLHttpRequest, etc.)
- **Naming convention validation** — No pre-commit check for naming violations

### Why It Matters
This was a specific Spider requirement but is lower priority than the others. The project linter may catch some naming issues depending on configuration.

### Integration Point
Add as a pre-check gate or integrate into reviewer's checklist.

---

## 6. Repo Root Test Prevention — MISSING

### What Exists
- **test_engineer** — Runs tests through proper test framework detection
- **test_runner** — Supports multiple frameworks with proper scope

### What's Missing
- **Repo root test blocking** — No prevention of `npm test` from repo root
- **Test scope validation** — No check that tests are run against specific files/modules

### Why It Matters
Running tests from repo root can be slow and produce misleading results. The test_runner tool handles this better but there's no explicit prevention.

### Integration Point
Add as a pre-check in test_runner or as a reviewer check.

---

## 7. Documentation Validation — MISSING

### What Exists
- **placeholder_scan** — Catches TODO/FIXME patterns
- **reviewer** — Catches incomplete documentation

### What's Missing
- **Theatrical documentation detection** — No explicit check for "this would work", "in a real scenario", "for demonstration purposes"
- **Feature-existence validation** — No check that documented features actually exist in code

### Why It Matters
Agents can write documentation for features that don't exist. The reviewer may catch this but it's not a mechanical gate.

### Integration Point
Add as a pre-check gate or integrate into reviewer's checklist.

---

## 8. Dual-Brain Routing — REPLACED (Not Missing)

### What Exists
- **Per-agent model assignment** — Each agent gets its own model
- **9 specialized agents** — Replaces dual-brain with multi-brain

### Assessment
This is not missing — it's superseded. The multi-agent architecture provides better specialization than dual-brain routing. Each agent has the right model for its job.

---

## 9. Reasoning Chain Documentation — MISSING

### What Exists
- **telemetry.jsonl** — Operation logs
- **evidence bundles** — Per-task evidence
- **retro tracking** — Per-phase lessons learned

### What's Missing
- **Explicit reasoning chain** — No requirement for agents to document "Thought → Action → Result → Assessment → Self-Correction" at each step
- **Problem decomposition format** — No structured format for USER REQUEST → WHAT I KNOW → INITIAL ASSUMPTION → RESEARCH CHECK
- **Evidence hierarchy enforcement** — No mechanical distinction between strong and weak evidence

### Why It Matters
Without explicit reasoning documentation, agents can skip the thinking process and jump to conclusions. The reasoning chain forces transparency.

### Integration Point
Inject into agent system prompts as mandatory output format. Add as a reviewer check.

---

## Summary: Priority Order for Integration

| Priority | System | Effort | Impact |
|---|---|---|---|
| **P0** | Anti-hallucination validators | Medium | Critical — prevents simulated output |
| **P0** | Surgical debug protocol | Medium | Critical — prevents wild-guess debugging |
| **P1** | Stagnation detection enhancement | Low | High — prevents doom loops |
| **P1** | Guardian zone classification | Medium | High — prevents dangerous writes |
| **P2** | Reasoning chain documentation | Low | Medium — improves transparency |
| **P2** | Documentation validation | Low | Medium — prevents fake docs |
| **P3** | Style guide enforcement | Low | Low — nice to have |
| **P3** | Repo root test prevention | Low | Low — nice to have |
