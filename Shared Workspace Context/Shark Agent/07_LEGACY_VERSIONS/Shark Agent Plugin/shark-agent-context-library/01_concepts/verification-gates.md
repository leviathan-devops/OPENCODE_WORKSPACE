# Verification Gates

Three independent gates run at the VERIFY phase. All must pass to unlock SHIP.

## Gate 1: Functional

**Question**: Does the code work?

**Evidence required**:
- `.shark/test-results/stage1.json` — Stage 1 (Docker sandbox) test results
- `.shark/test-results/stage2.json` — Stage 2 (local device) test results

**Pass condition**: Both stages show 100% pass rate (all tests pass)

**Stage 1 — Docker Sandbox**: Runs tests in an isolated Docker container
```json
{
  "stage": "stage1",
  "environment": "docker",
  "container": "shark-test-sandbox:latest",
  "passed": 47,
  "failed": 0,
  "total": 47,
  "duration": 12400,
  "timestamp": 1743774215000
}
```

**Stage 2 — Local Device**: Runs tests on the actual development machine
```json
{
  "stage": "stage2",
  "environment": "local",
  "device": "linux-x86_64",
  "passed": 47,
  "failed": 0,
  "total": 47,
  "duration": 8900,
  "timestamp": 1743774255000
}
```

**Failure condition**: Either stage has `failed > 0` OR evidence files don't exist

---

## Gate 2: Intent

**Question**: Did we build what was claimed?

**Evidence required**:
- `.shark/claims.json` — Claims document with all claims having `testStatus: "pass"`
- `.shark/claim-results/{claim-id}.json` — Individual test result per claim

**Pass condition**: Every claim in `claims.json` has `testStatus: "pass"`

```json
// .shark/claim-results/claim-001.json
{
  "claimId": "claim-001",
  "testFile": "tests/auth/jwt-auth.test.ts",
  "testsDefined": 5,
  "testsPassed": 5,
  "testsFailed": 0,
  "status": "pass",
  "lastRun": 1743774215000
}
```

**Failure condition**: Any claim has `testStatus: "fail"` or `testStatus: "pending"`, or a claim's test file doesn't exist

---

## Gate 3: Security

**Question**: Is it safe to ship?

**Evidence required**:
- `.shark/guardian-report.json` — Full security scan results

**Scans performed**:
1. **Secret scan**: `grep -r` for hardcoded credentials, API keys, tokens
2. **SAST scan**: Static analysis for known vulnerability patterns (SQL injection, XSS, etc.)
3. **Dependency scan**: Check `package.json` for known-vulnerable packages
4. **Guardian path scan**: Verify no writes to PROTECTED paths occurred during BUILD

```json
{
  "scannedAt": 1743774300000,
  "scans": {
    "secrets": {
      "tool": "grep",
      "paths": ["src/", "tests/"],
      "criticalFindings": 0,
      "highFindings": 0,
      "mediumFindings": 1,
      "details": [
        { "file": "src/config/development.ts", "line": 12, "pattern": "api_key", "severity": "medium" }
      ]
    },
    "sast": {
      "tool": "eslint-plugin-security",
      "criticalFindings": 0,
      "highFindings": 1,
      "mediumFindings": 0,
      "details": [
        { "file": "src/api/users.ts", "line": 45, "pattern": "eval(userInput)", "severity": "high" }
      ]
    },
    "dependencies": {
      "tool": "npm audit --json",
      "vulnerablePackages": 0
    },
    "pathProtection": {
      "violations": 0,
      "protectedWriteAttempts": 0
    }
  },
  "overallSeverity": "high",
  "passed": false
}
```

**Pass condition**: `criticalFindings = 0` AND `highFindings = 0` AND `vulnerablePackages = 0`

---

## Gate Runner

The `run_verification` tool executes all three gates and returns:

```json
{
  "workflowId": "wf_20260404_143052",
  "ranAt": 1743774400000,
  "gates": {
    "functional": { "passed": true, "stage1": "pass", "stage2": "pass" },
    "intent": { "passed": true, "passed": 3, "failed": 0, "total": 3 },
    "security": { "passed": false, "critical": 0, "high": 1, "medium": 1 }
  },
  "shipEligible": false,
  "blockingGates": ["security"],
  "blockingItems": [
    { "gate": "security", "item": "src/api/users.ts:45 — eval(userInput)", "severity": "high" }
  ]
}
```

If `shipEligible: false`, the orchestrator returns failure context to the architect and triggers a BUILD loop. After 3 loops with failures, triggers a hard reset to PLAN.
