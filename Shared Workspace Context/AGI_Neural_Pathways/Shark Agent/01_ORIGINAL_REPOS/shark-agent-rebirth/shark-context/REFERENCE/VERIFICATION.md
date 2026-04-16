# SHARK AGENT V4 — Verification Reference

**Purpose:** T2 reference for claim verification techniques
**Usage:** Loaded on-demand via read_file, zero prompt overhead

---

## The Verification Principle

**"I tested it" means nothing without proof. Evidence is not optional.**

Every claim in Shark must be verified with concrete evidence. The difference between "tested" and "verified" is the difference between broken software and working software.

---

## Gate Verification

### Gate 1: Architect Verification

**Claim:** "SPEC.md is complete and valid"

**Verification checklist:**
```
□ Project name defined
□ Functional requirements listed
□ Acceptance criteria defined
□ Critical path identified
□ Gate definitions present
□ Guardian zones configured
□ Scope boundaries clear
□ No ambiguous requirements
```

**Evidence required:**
- `SPEC.md` exists and is parseable
- `guardian-config.json` exists with zone definitions
- `.shark/plan.md` contains the spec

**Verification commands:**
```bash
# Verify SPEC.md exists
test -f SPEC.md

# Verify it has required sections
grep -q "## Functional Requirements" SPEC.md
grep -q "## Acceptance Criteria" SPEC.md
grep -q "## Critical Path" SPEC.md

# Verify Guardian config
test -f .shark/guardian-config.json
```

---

### Gate 2: Coding Verification

**Claim:** "Implementation matches SPEC.md"

**Verification checklist:**
```
□ All specified files created
□ No unspecified files created
□ File contents match spec
□ Directory structure matches spec
□ No Guardian zone violations
□ No scope creep detected
```

**Evidence required:**
- File list from git
- Directory tree output
- Guardian log showing no violations

**Verification commands:**
```bash
# List all created files
git ls-files

# Compare to SPEC.md file list
diff <(grep "^### " SPEC.md | sed 's/^### //') <(git ls-files)

# Verify no files outside workspace
grep -v "^./" .shark/guardian.log || echo "No violations"
```

---

### Gate 3: Test Verification

**Claim:** "All tests pass with adequate coverage"

**Verification checklist:**
```
□ Test files exist
□ Tests run successfully
□ Coverage ≥ 80%
□ No weak assertions (toBeTruthy, toBeFalsy)
□ All spec requirements tested
```

**Evidence required:**
- Test runner output (JSON/JUnit format)
- Coverage report (lcov/coverage.json)
- Assertion quality check

**Verification commands:**
```bash
# Run tests and capture output
npm test -- --coverage --reporter json > test-output.json

# Check coverage threshold
node -e "const c = require('./coverage/coverage.json'); \
  const lineCov = c.total.lines.pct; \
  if (lineCov < 80) process.exit(1); \
  console.log('Coverage:', lineCov + '%');"

# Check for weak assertions
grep -r "toBeTruthy\|toBeFalsy" tests/ && echo "WEAK ASSERTIONS FOUND"
```

---

### Gate 4: Build Verification

**Claim:** "Code compiles and lint is clean"

**Verification checklist:**
```
□ Build completes without errors
□ Lint passes with zero warnings
□ Type checking passes
□ Artifact produced
□ No security warnings in build output
```

**Evidence required:**
- Build output log
- Lint report (eslint, ruff, etc.)
- Type check output
- Artifact file exists

**Verification commands:**
```bash
# Build
npm run build 2>&1 | tee build.log

# Check exit code
test ${PIPESTATUS[0]} -eq 0

# Lint
npm run lint 2>&1 | tee lint.log
test ${PIPESTATUS[0]} -eq 0

# Type check
npx tsc --noEmit 2>&1 | tee type-check.log
test ${PIPESTATUS[0]} -eq 0
```

---

### Gate 5: Review Verification

**Claim:** "Code is security-clean"

**Verification checklist:**
```
□ SAST scan completed
□ SAST: 0 critical/high findings
□ Secrets scan: 0 findings
□ Dependencies audited
□ No critical vulnerabilities
□ License compliance verified
```

**Evidence required:**
- SAST scan report (semgrep, bandit, etc.)
- Secrets scan output (trufflehog, gitleaks)
- Dependency audit report (npm audit, safety)
- No blocked commits

**Verification commands:**
```bash
# SAST scan
semgrep --json --config=auto . > sast-report.json

# Check for critical/high
jq '.results | map(select(.severity == "critical" or .severity == "high")) | length' sast-report.json
# Must be 0

# Secrets scan
trufflehog filesystem . --json > secrets-report.json
jq 'length' secrets-report.json
# Must be 0

# Dependency audit
npm audit --json > audit-report.json
jq '.metadata.totalDependencies' audit-report.json
jq '.vulnerabilities.critical // 0' audit-report.json
# Must be 0 critical
```

---

### Gate 6: Delivery Verification

**Claim:** "Build is ready for delivery"

**Verification checklist:**
```
□ All previous gates passed (evidence exists)
□ Checkpoint created
□ Evidence archived
□ Delivery summary generated
□ Task marked complete
```

**Evidence required:**
- All gate evidence directories
- Git checkpoint ref
- Delivery summary document
- State marked complete

**Verification commands:**
```bash
# Verify all evidence exists
for gate in architect coding test build review; do
  test -d ".shark/evidence/$gate" || exit 1
done

# Verify checkpoint
git rev-parse HEAD
git tag -l "shark-delivery-*"

# Verify delivery summary
test -f .shark/delivery-summary.md
```

---

## Evidence Collection

### Evidence File Structure

```
.shark/evidence/{gate-id}/{timestamp}/
├── gate-evidence.json     # Gate criteria + pass/fail
├── command-output.log     # Raw command output
├── reports/              # Additional reports
│   ├── coverage.json
│   ├── lint-report.json
│   ├── sast-report.json
│   └── audit-report.json
└── checksum.sha256       # Immutable proof
```

### Evidence JSON Schema

```json
{
  "gate": "test-gate",
  "timestamp": "2026-04-05T10:24:00Z",
  "status": "PASSED",
  "criteria": {
    "testsExist": true,
    "testsPass": true,
    "coverageFloor": 80,
    "actualCoverage": 87.3
  },
  "evidence": [
    {
      "type": "test-output",
      "path": "test-output.json",
      "checksum": "sha256:abc123..."
    },
    {
      "type": "coverage-report", 
      "path": "coverage/coverage.json",
      "checksum": "sha256:def456..."
    }
  ],
  "verified_by": "shark-system-brain",
  "verified_at": "2026-04-05T10:24:05Z"
}
```

---

## Claim Verification Loop

```
CLAIM: "Tests pass"
         │
         ▼
DEMAND EVIDENCE
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Does test output file exist?     │
│ 2. Does output show PASS?           │
│ 3. Is coverage ≥ 80%?              │
│ 4. Are assertions strong?          │
└─────────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    ▼         ▼
 PASSED   FAIL GATE
    │         │
    │         ▼
    │    Auto-fix or
    │    Escalate
```

---

## Verification Anti-Patterns

### Anti-Pattern: Self-Verification

**Bad:** "I wrote tests and they pass" (agent verifies own work)

**Good:** System Brain (independent) verifies Execution Brain output

**Why:** Self-verification is confirmation bias. Independent verification catches errors.

---

### Anti-Pattern: Weak Assertion Detection

**Bad:** Tests that use `toBeTruthy()` — passes for `1`, `true`, `"yes"`

**Good:** Tests that use exact equality `toBe(42)` or precise matchers

**How to detect:**
```bash
grep -r "toBeTruthy\|toBeFalsy\|toBeDefined" tests/
# Flag these for review
```

---

### Anti-Pattern: Coverage Theater

**Bad:** 80% coverage but tests don't actually test anything

**Good:** Coverage + strong assertions + spec coverage mapping

**How to detect:**
```bash
# Run tests with coverage
npm test -- --coverage

# Also check assertion density
grep -c "expect(" tests/**/*.test.js
# Divide by coverage lines — should be reasonable ratio
```

---

*Verification Reference*
*Shark Agent V4 — T2 Reference*
