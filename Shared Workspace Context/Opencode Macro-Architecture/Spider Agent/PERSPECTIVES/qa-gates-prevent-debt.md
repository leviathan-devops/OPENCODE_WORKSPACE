# How QA Gates Prevent Technical Debt

## What is Technical Debt?

Technical debt is the cost of quick-and-dirty solutions:
- Skipped tests → bugs later
- No documentation → onboarding slow
- Code duplication → maintenance nightmare
- Security shortcuts → vulnerabilities

## The Gate Philosophy

Spider Agent's QA gates are **mandatory checkpoints** between phases:

```
coder ──► TEST_ENGINEER ──► REVIEWER ──► COMPLETE
          │                              │
          │   ┌──────────────────────┐   │
          └──►│ QA GATES             │◄──┘
               │ 1. Syntax Check      │
               │ 2. Placeholder Scan  │
               │ 3. SAST Scan         │
               │ 4. SBOM Generate     │
               │ 5. Build Check       │
               │ 6. Quality Budget    │
               └──────────────────────┘
```

Code cannot proceed without passing all gates.

## Gate 1: Syntax Check

**What:** Parse the code, check for syntax errors

**Debt prevented:**
- No shipping code that doesn't compile
- No mysterious runtime errors from typos
- Catch errors at write-time, not user-report-time

**Fail example:**
```
✗ syntax_check failed
- Line 42: Unexpected token
- Line 43: Missing semicolon
```

## Gate 2: Placeholder Scan

**What:** Scan for TODO, FIXME, placeholder comments

**Debt prevented:**
- No "TODO: implement later" shipping to prod
- No placeholder strings in UI
- Forces completion before moving on

**Fail example:**
```
✗ placeholder_scan failed
- src/auth.js: 'TODO: implement proper hashing'
- src/api.js: 'FIXME: remove before release'
```

## Gate 3: SAST Scan

**What:** Static Application Security Testing

**Debt prevented:**
- No SQL injection vulnerabilities
- No exposed secrets in code
- No authentication bypasses
- Security issues caught in development

**Fail example:**
```
✗ sast_scan failed  
- src/api/users.js: Potential SQL injection (line 23)
- src/auth.js: Hardcoded credential (line 5)
```

## Gate 4: SBOM Generate

**What:** Software Bill of Materials generation

**Debt prevented:**
- Know your dependencies
- Track vulnerable libraries
- Audit compliance
- License compliance

**Fail example:**
```
✗ sbom_generate failed
- Dependencies not documented
- Run: npm audit --sbom
```

## Gate 5: Build Check

**What:** Compile/build the project

**Debt prevented:**
- Catch type errors
- Catch import errors
- Verify build pipeline works
- Ensure all files integrate

**Fail example:**
```
✗ build_check failed
- error TS2345: Argument of type 'string' not assignable to 'number'
- error TS2307: Module './auth' not found
```

## Gate 6: Quality Budget

**What:** Check complexity, duplication, test coverage

**Debt prevented:**
- No overly complex functions
- No copy-paste code
- Adequate test coverage
- Maintainable codebase

**Limits:**
| Metric | Max Delta | Notes |
|--------|-----------|-------|
| Complexity | +10% | Per PR/file |
| Public API | +15% | Breaking changes tracked |
| Duplication | 10% | Overall ratio |
| Test/Code | 0.3x | Min 30% coverage |

## Why Not Skip Gates?

| Reason | Long-term Cost |
|--------|----------------|
| "We'll add tests later" | 10x harder to test later |
| "SAST slows us down" | Security breach cost > slow |
| "Build works on my machine" | CI failures, wasted time |
| "Complexity is fine" | Maintenance nightmare |

## The Compound Effect

Without gates, debt compounds:

```
Week 1: Skip tests → 1 hour saved
Week 4: Bug from skipped tests → 4 hours lost
Week 12: More bugs, no tests → 16 hours lost
Week 24: Rewrite section → 80 hours lost
```

With gates, debt is prevented:

```
Week 1: Must write tests → 1 hour spent
Week 4: Tests catch bug → 10 minutes fix
Week 12: Good coverage → 2 hours for new feature
Week 24: Stable base → 4 hours for new feature
```

## Turbo Mode and Gates

Turbo mode relaxes some gates:
- SAST skipped (⚠ security risk)
- Quality budget relaxed
- Placeholder scan skipped

**Trade-off:** Speed up front, potential debt later.

Use Turbo for:
- Prototypes
- Spike/exploration code
- Not-production code

Don't use Turbo for:
- Security-critical paths
- Long-lived features
- Public APIs

## Evidence and Audit Trail

Each gate writes evidence:
```
.Spider/evidence/
├── task-3.2/
│   ├── syntax_check.json
│   ├── sast_scan.json
│   ├── build_check.log
│   └── quality_metrics.json
```

This creates:
- Audit trail for compliance
- Historical record of code quality
- Proof of gate pass/fail
- Debugging information

## Result

QA gates ensure:
- **No shortcuts** - everything must be complete
- **Security** - vulnerabilities caught early
- **Quality** - complexity and coverage tracked
- **Maintainability** - debt doesn't compound
- **Confidence** - code is production-ready when it completes
