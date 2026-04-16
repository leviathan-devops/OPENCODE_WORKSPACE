# Trident Problem Solving — Systematic Debugging Architecture

**Version:** v3.0  
**Inspired by:** Trident Brain V3 + Manta Agent mechanical gates  
**Purpose:** Mechanical depth enforcement for debugging the Hermes Agent Plugin overhaul

---

## When To Use This

Use Trident Problem Solving when:
- A build fails and the error message is unclear
- A hook appears to fire but produces wrong behavior
- A tool returns output but the output is wrong
- Integration tests fail but E2E tests pass
- Cross-agent interference is suspected (e.g., Hermes breaks Spider)

**Do NOT use for:**
- Simple syntax errors (TypeScript compiler catches these)
- Typographical bugs (grep finds these)
- Documentation issues (read the docs)

---

## Trident Problem Solving Process (4 Gates)

### GATE 1: Problem Discovery — "What is actually broken?"

**Principle:** The user's stated problem is usually a symptom, not the root cause. Dig deeper.

**Process:**
1. **Capture the exact error** — Full error message, not truncated
2. **Identify the surface problem** — What the user reports
3. **Identify the actual problem** — What the code is doing vs. expected
4. **Find the first moment of divergence** — When did behavior deviate from spec?

**Trident Questions for Gate 1:**
- What SPEC says should happen?
- What ACTUALLY happens?
- What is the FIRST symptom?
- What is the ROOT symptom?
- Who is affected? (Hermes only? All agents?)

**Evidence required to pass Gate 1:**
- Exact error message (copied, not paraphrased)
- Surface problem statement
- Root problem hypothesis
- First moment of divergence identified

---

### GATE 2: Root Cause Analysis — "Why did this happen?"

**Principle:** Problems have layers. Surface fix ≠ real fix. Drill to the root.

**Process:**
1. **Trace backwards** — From error to source of error to source of source
2. **Map the execution path** — What functions/data/hooks are involved?
3. **Identify guard conditions** — Which guards passed/failed?
4. **Check state consistency** — Is the state what the code thinks it is?

**Trident Questions for Gate 2:**
- What is the call chain from entry to error?
- Which guard condition is wrong/missing?
- Is the state what we think it is?
- Is this a one-time bug or a pattern?
- What else has this same pattern?

**Cross-Domain Synthesis:**
Look for isomorphic patterns across systems:
- Hermes brainstorm gate blocking Spider = Same pattern as Manta hook spillover
- sast_scan npm error = Same pattern as tool path resolution failures
- dist not rebuilt = Same pattern as verification theater

**Evidence required to pass Gate 2:**
- Complete call chain (entry → error)
- All guard conditions documented (which passed, which failed)
- State snapshot at point of error
- Root cause identified (not just symptom)
- Pattern identified (or "no pattern" stated)

---

### GATE 3: Solution Synthesis — "How do we fix it?"

**Principle:** Generate multiple fix options, evaluate trade-offs, choose the minimal fix that doesn't introduce new bugs.

**Process:**
1. **Generate 3+ fix options** — Each from a different angle
2. **Evaluate each option:**
   - Does it fix the root cause (not just symptom)?
   - Does it introduce new risks?
   - Is it minimal (avoids over-engineering)?
   - Does it maintain backward compatibility?
3. **Choose best option** — Document why others rejected
4. **Design the fix** — Exact code changes, file by file

**Fix Evaluation Matrix:**
| Fix Option | Root Cause Fixed? | Risk | Backward Compatible? | Complexity |
|-----------|------------------|------|-------------------|-------------|
| Option A | ✅ | Low | ✅ | Low |
| Option B | ✅ | HIGH | ❌ | Medium |
| Option C | ❌ | Low | ✅ | Low |

**Evidence required to pass Gate 3:**
- 3+ fix options generated
- Each option evaluated against criteria
- Best option chosen with rationale
- Exact code changes designed

---

### GATE 4: Verification — "Did the fix work?"

**Principle:** The fix is not complete until it is verified. Verification must be mechanical, not "looks good."

**Process:**
1. **Pre-flight check** — Build must be clean before fix
2. **Apply fix** — Make the code changes
3. **Rebuild dist** — `bun build.ts` — MUST verify dist mtime
4. **Run E2E baseline** — Must maintain 144+/147
5. **Run integration test** — Real session, not mock
6. **Verify hook firing** — Evidence that hook now works
7. **Regression check** — No new failures introduced

**Verification Evidence Checklist:**
```
[ ] Build exits 0
[ ] dist/index.js mtime > src/**/*.ts mtime
[ ] E2E baseline maintained (144+/147)
[ ] Specific error from GATE 1 is resolved
[ ] Hook firing evidence captured
[ ] No regression to Spider/Manta/Shark
[ ] State persistence verified
[ ] Memory system verified
```

**If any verification fails:**
- Document what failed
- Return to GATE 1 with new evidence
- The "fix" is not a fix until all gates pass

---

## Problem Solving Templates

### Template: Bug Report
```markdown
# BUG REPORT: [Short Title]

## GATE 1: Problem Discovery
**Surface Problem:** [What user reports]
**Actual Problem:** [What's actually happening]
**First Divergence:** [When did it deviate from spec?]

## GATE 2: Root Cause Analysis
**Call Chain:**
```
[entry point]
  → [function a]
  → [function b] ← ERROR HERE
  → [function c]
```
**Guard Conditions:**
- Guard A: [PASSED/FAILED] — [why]
- Guard B: [PASSED/FAILED] — [why]
**State at Error:** [JSON snapshot]
**Root Cause:** [1 sentence]
**Pattern:** [Is this a pattern? Where else?]

## GATE 3: Solution Synthesis
**Option A:** [Description]
- Pros: [...]
- Cons: [...]
**Option B:** [Description]
- Pros: [...]
- Cons: [...]
**Option C:** [Description]
- Pros: [...]
- Cons: [...]
**Chosen:** Option [X] — [rationale]
**Exact Fix:**
```typescript
// File: src/[...].ts
// Line: [n]
-[old code]
+[new code]
```

## GATE 4: Verification
**Build:** [PASS/FAIL]
**dist mtime:** [timestamp]
**E2E:** [147/147 or n/147]
**Specific Test:** [What was tested]
**Regression:** [None found / Found: ...]
```

### Template: Hook Debug Session
```markdown
# HOOK DEBUG: [Hook Name]

## GATE 1: Problem Discovery
**Hook:** [name]
**Event:** [tool.execute.before etc.]
**Expected Behavior:** [what should happen]
**Actual Behavior:** [what actually happens]
**Evidence of Firing:** [log output / no log output]

## GATE 2: Root Cause Analysis
**Hook Source (src/hooks/[name].ts):**
```typescript
[relevant code section]
```
**Guard Condition:** [isHermesAgent check?]
**State Check:** [module-level variable? disk state?]
**Is Guard Correct?** [YES/NO — if NO, found the bug]
**If No Log Output:** [hook not firing → guard blocking, order wrong, or event mismatch]

## GATE 3: Solution Synthesis
**Fix Options:**
1. [Option]
2. [Option]
3. [Option]
**Chosen:** [Option] — [rationale]

## GATE 4: Verification
**Before Fix:** [log output]
**After Fix:** [log output]
**Hook Now Fires:** [YES/NO]
```

---

## Integration with Kraken 3-Cluster Model

Use Kraken's 3 clusters for parallel problem solving:

| Cluster | Role | Use For |
|---------|------|---------|
| **Alpha** (Test) | Verification | Run E2E, integration tests, hook firing evidence |
| **Beta** (Build) | Fix application | Apply code fixes, rebuild dist, verify mtime |
| **Gamma** (Debug) | Problem solving | Deep dive on root cause, cross-domain synthesis |

**Parallel execution:**
```
Alpha: Run E2E suite, capture baseline
Beta:  Apply fix while Alpha runs
Gamma: Analyze root cause in parallel
       ↓
All converge at Gate 4: Verification
```

---

## Code Review Integration

After Trident Problem Solving produces a fix, Code Review (Section 07) must verify:
1. Fix doesn't introduce new vulnerability
2. Fix doesn't break other hooks
3. Fix maintains backward compatibility
4. Fix is minimal (no over-engineering)
5. Fix has proper error handling

**Fix is not complete until both Trident AND Code Review pass.**
