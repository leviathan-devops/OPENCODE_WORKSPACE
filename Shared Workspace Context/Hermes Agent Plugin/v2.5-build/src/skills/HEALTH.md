---
name: health
type: action
description: Project health score 0-100 with prioritized improvement recommendations
executionMode: thread
episodeTimeout: 300000
contextScope: isolated
triggerPatterns:
  - "^/health"
  - "health check"
  - "project health"
---

# /health — Project Health Score (0-100)

## Purpose
Give a holistic health score. Find the weakest link. Prioritize what to fix.

## Scoring Categories

### 1. Test Coverage (0-20 points)

| Score | Coverage | Points |
|-------|----------|--------|
| 0 | <50% | 0 |
| 5 | 50-70% | 5 |
| 10 | 70-80% | 10 |
| 15 | 80-90% | 15 |
| 20 | 90%+ | 20 |

### 2. Test Quality (0-15 points)

- Tests are isolated (no shared state): +5
- Tests have meaningful assertions (not just "no throw"): +5
- Tests test behavior, not implementation: +5
- Tests missing: -5 per major untested module

### 3. Code Quality (0-20 points)

- No TODO/FIXME/HACK comments: +5
- No lint errors: +5
- No TypeScript errors: +5
- Code review passed: +5

### 4. Security (0-15 points)

- No hardcoded secrets: +5
- Input validation on all endpoints: +5
- Auth/permissions tested: +5
- /grill passed (no HIGH/CRITICAL): -10 if failed

### 5. Documentation (0-10 points)

- README exists and accurate: +3
- API docs complete: +3
- Changelog updated: +2
- Inline comments for complex logic: +2

### 6. Performance (0-10 points)

- Build time <60s: +3
- Bundle size within target: +3
- No N+1 queries: +4
- Bundle size >150% target: -5

### 7. Dependencies (0-10 points)

- All dependencies up to date: +3
- No known CVEs: +4
- No unused dependencies: +3
- Outdated + vulnerable: -5

---

## Health Report Template

```markdown
## Health Report: <Project>

**Overall Score: X/100** (<grade>)

### Test Coverage — X/20
- Coverage: 82%
- Tests: 47 passing
- Missing coverage: src/billing/stripe.ts (critical)

### Test Quality — X/15
✓ Tests are isolated
✓ Meaningful assertions
✓ Behavior-tested

### Code Quality — X/20
✓ 0 lint errors
✓ 0 TypeScript errors
✓ No TODO comments
✓ Code review passed

### Security — X/15
✓ No hardcoded secrets
✓ Input validation complete
✓ Auth tested
✓ /grill: 0 HIGH, 0 CRITICAL

### Documentation — X/10
✓ README accurate
✓ API docs complete
✓ Changelog updated

### Performance — X/10
✓ Build: 45s
✓ Bundle: 142KB (target: 150KB)
✓ No N+1 detected

### Dependencies — X/10
✓ 0 known CVEs
✓ 2 outdated (minor)

---

## Priority Fixes

| Priority | Issue | Impact | Fix Effort |
|----------|-------|--------|------------|
| 1 | Missing tests for billing | Regression risk | 2h |
| 2 | Outdated dependency | Security | 15min |
| 3 | No N+1 in reports | Performance | 4h |

## Grade Scale

| Score | Grade | Meaning |
|-------|-------|---------|
| 90-100 | A | Excellent — production ready |
| 80-89 | B | Good — minor fixes needed |
| 70-79 | C | Acceptable — work in progress |
| 60-69 | D | Poor — significant issues |
| 0-59 | F | Failing — do not ship |
```

---

## Anti-Rationalization

- [ ] I ran actual test coverage tool
- [ ] I verified each security check
- [ ] I ran lint and TypeScript checks
- [ ] I showed actual numbers, not estimates
- [ ] I prioritized by impact, not effort
