---
name: verify
type: action
description: Proof-based completion verification with actual command output
executionMode: thread
episodeTimeout: 300000
contextScope: isolated
triggerPatterns:
  - "^/verify"
  - "is it done"
  - "verify"
  - "prove it"
---

# /verify — Proof-Based Completion Verification

## Purpose
Prove the feature is done. Not "looks good" or "should work." Actual proof with command output.

## Verification Checklist

### 1. Tests Pass (unit + integration)

```
$ npm test -- --coverage
✓ 47 passing
✓ Coverage: 82%

Files tested: src/auth/*.ts (14 tests)
APIs tested: POST /api/auth/login, POST /api/auth/logout
```

### 2. Build Passes

```
$ npm run build
✓ Build complete: dist/
✓ No TypeScript errors
✓ No lint errors
```

### 3. Feature Works (manual smoke test)

```
$ curl -X POST http://localhost:3000/api/auth/login \\
    -H "Content-Type: application/json" \\
    -d '{"email":"test@example.com","password":"test123"}'
{"status":"ok","token":"eyJ..."}
```

### 4. Error Handling Works

```
$ curl -X POST http://localhost:3000/api/auth/login \\
    -d '{"email":"bad","password":"wrong"}'
{"error":"Invalid credentials","code":"AUTH_001"}

$ curl -X POST http://localhost:3000/api/auth/login \\
    -d '{"email":"missing-password"}'
{"error":"Validation failed","code":"VALIDATION_001","fields":{"password":"required"}}
```

### 5. Edge Cases Handled

```
$ curl -X POST http://localhost:3000/api/auth/login \\
    -H "Content-Type: application/json" \\
    -d '{"email":"test@example.com","password":""}'
{"error":"Validation failed","fields":{"password":"min 8 characters"}}
```

### 6. Security Defenses Work

```
$ curl -X POST http://localhost:3000/api/auth/login \\
    -H "X-Forwarded-For: 1.2.3.4" \\
    -d '{"email":"test@example.com","password":"wrong"}'
{"error":"Too many attempts","retry_after":900}
```

### 7. Documentation Updated

```
README.md: ✓ Updated
API.md: ✓ Added /api/auth/* endpoints
CHANGELOG.md: ✓ Added entry
```

### 8. No Regressions

```
$ npm test -- --testPathPattern=<affected_modules>
✓ All 134 tests passing
✓ No regressions in: auth, users, billing
```

---

## What "Verified" Looks Like

```
## Verification Results

### Tests
✓ Unit tests: 23 passing, 0 failing (src/auth/*.test.ts)
✓ Integration tests: 8 passing, 0 failing (tests/integration/auth.test.ts)
✓ Coverage: 82% (target: 80%)

### Build
✓ TypeScript: 0 errors
✓ Lint: 0 errors
✓ Bundle size: 142KB (vs 138KB baseline — acceptable)

### Functional
✓ Login with valid credentials → 200 + JWT token
✓ Login with invalid credentials → 401 + error code
✓ Login with missing fields → 400 + validation errors
✓ Rate limiting after 5 failed attempts → 429 + retry_after

### Security (via /grill)
✓ XSS payload in name field → sanitized
✓ SQL injection in email field → rejected
✓ Brute force → rate limited

### Documentation
✓ README.md updated with auth section
✓ API.md created with endpoint specs
✓ CHANGELOG.md entry added

### Regressions
✓ All 134 existing tests still pass
✓ No new lint warnings

---

## What "Not Verified" Looks Like

❌ "Tests pass" (no command shown)
❌ "Should work in production" (no verification)
❌ "I tested it manually" (no evidence)
❌ "Code looks good" (not verification)
```

---

## Anti-Rationalization

- [ ] I showed actual test output with pass/fail counts
- [ ] I showed actual API responses with real curl commands
- [ ] I tested error paths, not just happy path
- [ ] I ran full regression suite
- [ ] I updated documentation
- [ ] I showed /grill results for security vectors
