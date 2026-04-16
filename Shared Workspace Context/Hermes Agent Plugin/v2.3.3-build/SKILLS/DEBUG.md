# /debug — 4-Phase Systematic Debugging

## Purpose
Hypothesis-driven debugging. Not brute-force trial-and-error. Not "I'll just try this." Systematic isolation to find root cause.

## The 4 Phases

### Phase 1: Reproduce

**Goal**: Create a reliable way to see the bug.

Requirements:
- Exact steps to reproduce
- Expected behavior vs actual behavior
- Environment (OS, version, config)

Template:
```
## Reproduction

**Steps**:
1. Run `X`
2. Do Y
3. See Z

**Expected**: <expected>
**Actual**: <actual>

**Environment**:
- OS: <os>
- Version: <version>
```

**Rule**: If you can't reproduce it, you can't debug it. Don't proceed until you can.

### Phase 2: Isolate

**Goal**: Find the smallest possible reproduction.

Techniques:
- Binary search on code path
- Remove code until bug disappears
- Narrow down by commenting sections
- Check if bug exists in minimal case

**Rule**: Isolate until removing ANY more would make the bug unreproducible.

### Phase 3: Hypothesis

**Goal**: State the root cause as a testable hypothesis.

NOT acceptable:
- "Probably a race condition"
- "Maybe memory leak"
- "Could be a bug in the library"

ACCEPTABLE:
- "The callback is called twice because setTimeout is not cleared in the cleanup function"
- "The null value in response.data.auth is caused by the token not being passed to the API call"

**Test the hypothesis**: Can you create a test that fails if the hypothesis is wrong and passes if it's right?

### Phase 4: Fix

**Goal**: Smallest possible fix that addresses the root cause.

Rules:
- Fix the cause, not the symptom
- Don't add code that "might help"
- Add a test that would have caught this bug

After fix:
```
## Verification

Fixed in: <commit hash>
Test added: <test file>

$ npm test -- --testPathPattern=<affected>
✓ All tests passing
```

---

## 3-Strike Rule

After 3 failed fix attempts on the same bug:

1. Stop attempting fixes
2. Escalate to @architect for mandatory review
3. @architect must approve before you continue

**Why**: Repeating the same approach 3 times = different approach needed. @architect brings fresh perspective.

---

## Debugging Spiral Detection

If you see the same debugging behavior pattern repeated:
- Same 3 commands in same order
- Same failed fix applied multiple times
- Same question asked multiple ways

This is a "debugging spiral" — you're going in circles.

**Action**: Stop. Document what you've tried. Escalate to @architect.

---

## Anti-Rationalization

- [ ] I can reproduce the bug reliably
- [ ] I isolated to smallest reproduction
- [ ] My hypothesis is specific and testable
- [ ] My fix addresses the root cause, not symptoms
- [ ] I did not apply the same fix 3 times
- [ ] I have a test that would have caught this

## Example

**Bug**: "API returns 500 after 10 requests"

**Reproduce**:
```
1. Run `npm run dev`
2. Send 10 GET /api/users requests
3. 11th request returns 500
✓ Reproduced 100%
```

**Isolate**:
- Remove all code except /api/users handler → still 500
- Remove handler entirely → 404 (so router works)
- Narrow to: something in /api/users handler causes leak

**Hypothesis**: "Connection pool exhausted because connections aren't returned to pool after errors"

**Test hypothesis**: Add pool status logging → pool size maxed at request 10

**Fix**: Add try/finally to return connections to pool

**Verification**:
```
$ k6 run --vus 20 --duration 60s load-test.js
✓ 10,000 requests, 0 errors
✓ Pool size stays at 5
```
