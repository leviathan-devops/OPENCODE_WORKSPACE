# Claims System — Anti-Hallucination via Verifiable Claims

## The Core Insight

Instead of asking the agent "is the task complete?", Shark asks "which claims have passing tests?". This transforms completion from a subjective self-assessment into an objective evidence check.

## What Is a Claim?

A claim is an observable, testable statement about what the system does. Every claim must be:
1. **Specific**: "The user can authenticate with JWT" not "auth works"
2. **Testable**: Must have an automated test that can pass or fail
3. **Evidenced**: Must have a test file that exists and passes

## Claims Document Format

Generated at PLAN phase, stored at `.shark/claims.json`:

```json
{
  "version": "1.0",
  "workflowId": "wf_20260404_143052",
  "claims": [
    {
      "id": "claim-001",
      "description": "User can authenticate with a valid JWT token",
      "testFile": "tests/auth/jwt-auth.test.ts",
      "testStatus": "pending",
      "createdAt": 1743773452000,
      "completedAt": null
    },
    {
      "id": "claim-002",
      "description": "API rate limits requests to 100/min per IP",
      "testFile": "tests/api/rate-limit.test.ts",
      "testStatus": "fail",
      "failureReason": "Returns 429 after 50 reqs, not 100",
      "createdAt": 1743773452000,
      "completedAt": null
    },
    {
      "id": "claim-003",
      "description": "Configuration reloads without restart",
      "testFile": "tests/config/hot-reload.test.ts",
      "testStatus": "pass",
      "createdAt": 1743773452000,
      "completedAt": 1743774215000
    }
  ]
}
```

## Claim Lifecycle

```
[PLAN] claim created → status: pending
    ↓
[BUILD] test file created → claim.testStatus: "tested"
    ↓
[TEST] test passes → claim.testStatus: "pass"
[TEST] test fails → claim.testStatus: "fail"
    ↓
[VERIFY] all pass → claim.testStatus: "verified"
[VERIFY] any fail → loop back to BUILD for that claim
```

## Claim Extraction

During PLAN phase, `extract_claims` tool parses user intent and generates `claims.json`:

```
Input: "I need a REST API with JWT auth, rate limiting at 100 req/min, and hot config reload"

Output (claims.json):
- claim-001: JWT authentication (test: tests/auth/jwt-auth.test.ts)
- claim-002: Rate limiting at 100/min (test: tests/api/rate-limit.test.ts)
- claim-003: Hot config reload (test: tests/config/hot-reload.test.ts)
```

## TDD Enforcement: Test Before Code

During BUILD phase, the `tddEnforcerHook` enforces:

1. Before writing any `src/**/*.ts` file, the corresponding `testFile` must exist
2. The claim's test file must have at least one test case defined
3. If the test file doesn't exist, the `write_file` call is blocked

This means: **the agent writes the test first, then writes the code to make the test pass**.

## Claim Verification

During VERIFY phase, `run_verification` tool checks:

1. For each claim in `claims.json`:
   - Does `testFile` exist?
   - Does the test pass?
   - Is there a test result file at `.shark/claim-results/{claim-id}.json`?
2. If all claims have `testStatus: "pass"` → Intent gate passes
3. If any claim has `testStatus: "fail"` or `testStatus: "pending"` → Intent gate fails

## Why Claims Prevent Hallucination

Traditional completion checking:
```
Agent: "The task is complete."
User/Reviewer: "How do you know?"
Agent: "I'm confident it works."
```

Claims-based completion:
```
Agent: "claim-001: pass (test output: 5/5 tests passed)"
Agent: "claim-002: fail (test output: Expected 100, got 50)"
Agent: "claim-003: pass (test output: Config reloaded in 234ms)"
```

The agent cannot claim completion without presenting test evidence. The `antiHallucinationHook` scans tool outputs for completion claims and flags any that lack corresponding test result files.

## No Claim = No Build

**Critical rule**: The agent cannot write any `src/` file until `claims.json` exists with at least one claim that has a `testFile` path.

The `phaseGateHook` blocks `write_file` calls to `src/**` during PLAN phase.
The `tddEnforcerHook` blocks `write_file` calls to `src/**` during BUILD if the corresponding test doesn't exist.
