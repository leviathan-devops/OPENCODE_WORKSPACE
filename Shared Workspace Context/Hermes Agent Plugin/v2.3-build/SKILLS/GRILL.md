# /grill — Adversarial Attack Testing

## Purpose
Find ways to break the code. Not to be malicious — to find failure modes before users do.

## When to Use
After Phase 3 Stage 2 review (security + performance). Before marking a feature complete.

## The 6 Attack Vectors

### 1. Input Assault
- Empty input, null input, whitespace-only input
- Maximum length strings
- Unicode edge cases (zero-width chars, right-to-left override)
- SQL injection, XSS, command injection
- Malformed JSON, type confusion

### 2. Race Conditions
- Concurrent requests to same resource
- Double-submit forms
- Concurrent updates (last-write-wins vs. merge)
- Timeout and retry scenarios

### 3. State Confusion
- Session replay attacks
- JWT tampering
- Cookie poisoning
- State that should be server-side but isn't

### 4. Resource Exhaustion
- Infinite loops in user input
- Memory leaks (long sessions)
- Disk full scenarios
- CPU spike (regex catastrophic backtracking)

### 5. Dependency Failures
- API timeout scenarios
- Database connection failure
- Redis unavailable
- Third-party service returns 500

### 6. Edge Cases
- Leap year, DST transitions
- Negative time values
- Year 2038 problem
- Very large numbers (Number.MAX_SAFE_INTEGER)

## Process

### For Each Attack Vector

1. **Identify the attack surface**
   ```
   Attack Vector: Input Assault
   Surface: /api/users POST endpoint
   Input: { name: string, email: string }
   ```

2. **Execute the attack**
   ```
   Payload: { "name": "<script>alert(1)</script>", "email": "test@test.com" }
   Expected: Sanitized or rejected
   Actual: <see output>
   ```

3. **If attack succeeds**: Document as vulnerability. Fix required before completion.

4. **If attack fails (correctly blocked)**: Document as "defended".

## Output

```markdown
## Grill Report: <Feature>

### Input Assault
| Payload | Expected | Actual | Status |
|---------|----------|--------|--------|
| `<script>` | sanitized | sanitized | DEFENDED |
| `' OR 1=1--` | rejected | rejected | DEFENDED |
| 10KB name | truncated | 400 error | BUG — should be truncated |

### Race Conditions
| Scenario | Expected | Actual | Status |
|----------|----------|--------|--------|
| Concurrent update | last-write-wins | ERROR | DEFENDED |
| Double submit | idempotent | idempotent | DEFENDED |

### Vulnerabilities Found
| Severity | Issue | Fix Required |
|----------|-------|--------------|
| HIGH | XSS in name field | Yes |
| MEDIUM | No rate limit on API | Yes |

### Defended Vectors
- SQL injection: blocked by ORM
- Command injection: no shell execution
- CSRF: token validated
```

## Severity Ratings

| Severity | Criteria | Action |
|----------|----------|--------|
| CRITICAL | Remote code execution, data breach | Must fix before any release |
| HIGH | Service disruption, privilege escalation | Must fix before completion |
| MEDIUM | Information disclosure, degradation | Should fix before completion |
| LOW | Minor inconvenience | Fix in next sprint |

## Anti-Rationalization

- [ ] I tested at least 4 of 6 attack vectors
- [ ] I documented what was DEFENDED vs what was VULNERABLE
- [ ] Vulnerabilities have severity ratings
- [ ] Fixes are required for HIGH/CRITICAL before completion
- [ ] I showed actual payloads and actual responses
