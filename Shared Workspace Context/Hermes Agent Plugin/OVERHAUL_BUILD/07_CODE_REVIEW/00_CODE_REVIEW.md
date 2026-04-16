# Code Review — Mechanical Quality Verification

**Version:** v3.0  
**Inspired by:** Trident Brain Code Review Mode + Spider Agent patterns  
**Purpose:** Systematic quality verification for Hermes Agent Plugin code

---

## When To Use This

Code Review is MANDATORY after:
- Any fix applied via Trident Problem Solving
- Any new hook implementation
- Any tool implementation
- Any state management change
- Before moving to container ship phase

**Do NOT skip for:**
- "Small" changes (small changes break things too)
- "Obvious" fixes (obvious ≠ correct)
- Time pressure (skipping review causes future time pressure)

---

## Code Review Gates

### GATE 1: Correctness — "Does it do what it says?"

**Checks:**
- [ ] Function signature matches usage
- [ ] Return type matches documentation
- [ ] All code paths return or throw (no silent undefined)
- [ ] Guard conditions are correct
- [ ] State transitions are valid

**Correctness Questions:**
- What is this function supposed to do?
- Does every line of this function contribute to that?
- If this function is called with X, does it return Y?
- If this function is called with invalid input, does it fail safely?

**Evidence:** Full function annotated with correctness notes

---

### GATE 2: Security — "Can this be exploited?"

**Checks:**
- [ ] No injection vulnerabilities (user input not executed as code)
- [ ] No path traversal (user cannot access `/../` files)
- [ ] No command injection (user input not passed to shell)
- [ ] Permissions properly scoped
- [ ] No secrets logged or exposed

**Security Patterns:**
```typescript
// DANGEROUS: user input passed to shell
exec(`ls ${userInput}`);

// SAFE: validate path, no shell execution
const safePath = resolve(baseDir, userInput);
if (!safePath.startsWith(baseDir)) throw new Error("Path traversal");
exec([..."ls", safePath]); // Array form, no shell
```

**Evidence:** Full function annotated with security notes

---

### GATE 3: Performance — "Will this scale?"

**Checks:**
- [ ] No N+1 query patterns
- [ ] No blocking I/O in hot paths
- [ ] Large file handling has streaming/chunking
- [ ] Memory allocations bounded
- [ ] Regex patterns compiled once, not per call

**Performance Patterns:**
```typescript
// BAD: Compiled every call
const regex = new RegExp(userPattern);

// GOOD: Compiled once, reused
const compiledRegex = new RegExp(PATTERN);

// BAD: Reading entire file into memory
const content = readFileSync(path);

// GOOD: Streaming for large files
for await (const line of readFileLines(path)) { ... }
```

**Evidence:** Performance notes for any O(n²) or worse patterns

---

### GATE 4: Maintainability — "Can others understand this?"

**Checks:**
- [ ] No magic numbers (named constants)
- [ ] Clear function names (verb-noun pattern)
- [ ] Complex logic has comments explaining WHY
- [ ] Error messages are actionable
- [ ] No dead code or commented-out code

**Maintainability Questions:**
- Could a new developer understand this in 30 seconds?
- If this breaks in production, is the error message actionable?
- Are there tests that document intent?

**Evidence:** Function annotated with maintainability notes

---

### GATE 5: Hook Integrity — "Does this integrate correctly?"

**Checks:**
- [ ] Hook has agent identity guard if Hermes-specific
- [ ] Hook has trace logging for debugging
- [ ] Hook doesn't assume module-level state (use disk state)
- [ ] Hook doesn't interfere with other hooks
- [ ] Hook order documented if order matters

**Hook-Specific Patterns:**
```typescript
// CORRECT hook pattern:
export function createBrainstormGateHook() {
  return {
    hook: async (input, output) => {
      // GUARD: Agent identity check
      if (!isHermesAgent(input.agent)) {
        console.log(`[brainstorm-gate] SKIP: agent=${input.agent} is not hermes`);
        return;
      }
      // GUARD: Directory scope check
      if (!existsSync(resolve(input.context.directory, ".hermes"))) {
        console.log(`[brainstorm-gate] SKIP: no .hermes directory`);
        return;
      }
      // ... rest of hook logic
    }
  };
}
```

**Evidence:** Hook annotated with guard and order notes

---

## Code Review Checklist

### For Tool Fixes
```
[ ] Tool args schema matches actual usage
[ ] Path resolution uses fallback chain (directory/worktree/cwd)
[ ] Error handling returns specific errors, not generic ones
[ ] No process.cwd() without fallback
[ ] Worktree undefined case handled
[ ] ESLint output parsing handles both stdout and stderr
[ ] SAST scan bundles plugin locally, doesn't rely on npm exec
[ ] grill directory scan is recursive
[ ] complexity patterns detect O(n²) correctly
[ ] symbols Python regex is correct
[ ] No secrets in tool output
```

### For Hook Fixes
```
[ ] Agent identity guard present (if Hermes-specific)
[ ] .hermes/ directory guard present (if phase-dependent)
[ ] Trace logging present for debugging
[ ] Module-level state has disk-backed fallback
[ ] Hot-reload survival verified
[ ] Hook order doesn't conflict with other hooks
[ ] No interference with Spider/Manta/Shark hooks
[ ] Guard conditions are correct (not overly permissive)
```

### For State Management
```
[ ] Phase state written to .hermes/phase.json
[ ] Phase state loaded from disk on init
[ ] Module-level variables have disk-backed fallbacks
[ ] Session state persists to ~/.hermes/sessions/
[ ] Memory state persists to ~/.hermes/memory/
[ ] Concurrent sessions don't bleed state
[ ] Hot-reload doesn't lose state
```

### For Delegation
```
[ ] delegate_task tool is functional
[ ] Result returned to hermes correctly
[ ] Delegation ledger updated
[ ] Timeout handling present
[ ] Error handling returns specific errors
[ ] No circular delegation (A→B→A)
```

---

## Review Output Format

```markdown
# CODE REVIEW: [File/Component]

## Summary
[1 sentence: what this is, what was changed]

## GATE 1: Correctness
**Status:** [PASS/FAIL]
**Issues:** [None / List of issues]
**Notes:** [Rationale]

## GATE 2: Security
**Status:** [PASS/FAIL]
**Issues:** [None / List of issues with CVSS-like rating]
**Notes:** [Rationale]

## GATE 3: Performance
**Status:** [PASS/FAIL]
**Issues:** [None / List of issues]
**Notes:** [Rationale]

## GATE 4: Maintainability
**Status:** [PASS/FAIL]
**Issues:** [None / List of issues]
**Notes:** [Rationale]

## GATE 5: Hook Integrity
**Status:** [PASS/FAIL/NA]
**Issues:** [None / List of issues]
**Notes:** [Rationale]

## Overall Verdict
[APPROVE / REQUEST_CHANGES / REJECT]

## Specific Changes Required
[If REQUEST_CHANGES:]
1. [Issue 1] → [Fix]
2. [Issue 2] → [Fix]
```

---

## Review Triggers

| Trigger | Review Type | Reviewer |
|---------|-------------|----------|
| Tool fix applied | Full tool checklist | Kraken architect |
| Hook guard added | Hook checklist | Kraken architect |
| State management change | State checklist | Kraken architect |
| Delegation change | Delegation checklist | Kraken architect |
| Any change to opencode.json hook order | Full system review | Kraken architect |
| Pre-SHIP gate | Complete review of all components | Kraken + Shark |

---

## Integration with Build Flow

```
Trident Problem Solving → Code Review → (If APPROVED) Continue
                         → (If REQUEST_CHANGES) Return to Trident
                         → (If REJECT) Escalate to architect
```

**No exceptions:** No code goes to container ship without Code Review approval.
