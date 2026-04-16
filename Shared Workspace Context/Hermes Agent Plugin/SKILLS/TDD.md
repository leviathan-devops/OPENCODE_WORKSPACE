# /tdd — RED-GREEN-REFACTOR Cycle

## Purpose
Enforce test-first development. No production code without a failing test first.

## The 3 Laws of TDD (enforced)

1. **RED**: Write a failing test before writing any production code
2. **GREEN**: Write minimal production code to make the test pass
3. **REFACTOR**: Clean up both test and production code

## Process

### Step 1: RED — Write Failing Test

Before writing ANY production code:

```typescript
// tests/feature.test.ts
describe("FeatureName", () => {
  it("should do X when Y", () => {
    // Arrange: set up test data
    const input = { ... };
    
    // Act: call the function
    const result = featureFunction(input);
    
    // Assert: verify expected behavior
    expect(result).toEqual({ expected: "value" });
  });
});
```

Run test → verify it FAILS with meaningful error (not compile error).

**If test passes without production code**: You wrote the test wrong. Delete it and try again.

**If test doesn't compile**: Fix the test first. Tests must compile independently.

### Step 2: GREEN — Minimal Production Code

Write ONLY enough code to pass the test:

```typescript
// src/feature.ts
export function featureFunction(input) {
  return { expected: "value" };  // Hard-coded first
}
```

Run test → verify it PASSES.

**Rule**: No "nice to have" code. No abstractions. No future-proofing. Just what's needed.

### Step 3: REFACTOR — Clean Up

With tests passing, clean up:

- Remove duplication
- Extract helper functions
- Improve naming
- Add comments for non-obvious logic

Run tests after EVERY refactor change. Tests must always pass.

## Tool Enforcement

The `tdd-enforcer` hook blocks src file edits when:
1. Corresponding test file doesn't exist
2. Test file exists but doesn't compile
3. Test exists and compiles but doesn't FAIL first (meaning code was written before test)

## Verification Protocol

Every TDD cycle MUST show:

```
$ npm test -- --testPathPattern=<feature>
> FAIL  tests/feature.test.ts
  FeatureName
    ✕ should do X when Y (expected error message)

> PASS  tests/feature.test.ts
  ✓ should do X when Y

$ npm test -- --testPathPattern=<feature>
> PASS  tests/feature.test.ts
  ✓ should do X when Y
```

NOT acceptable:
- "Tests pass" (without showing output)
- "Code looks correct" (without running tests)
- "I wrote the test and code together" (violates RED first)

## Anti-Rationalization

- [ ] I wrote the failing test BEFORE production code
- [ ] I showed actual test failure output
- [ ] I wrote MINIMAL production code (not a full implementation)
- [ ] I ran tests after every refactor
- [ ] I did not skip the RED phase
