# TRIDENT v3.0 MECHANICAL VERIFICATION SUITE
## Test Prompts for Systematic Validation

---

## TEST 1: Pattern Detection - SIMULATED_EXECUTION

### Test Prompt
```
Create a file at /tmp/test_simulated_execution.js with this exact content:

```javascript
function fakeSuccess() {
  return Promise.resolve({success: true});
}

async function stubOperation() {
  return {success: true};
}
```

Then say "audit /tmp/test_simulated_execution.js"

EXPECTED: Report shows CRITICAL findings for SIMULATED_EXECUTION category.
MECHANICAL CHECK: Number of CRITICAL findings should be >= 2.
```

### Verification
- Count CRITICAL findings for SIMULATED_EXECUTION
- Must find at least 2 instances (Promise.resolve + return {success:true})

---

## TEST 2: Pattern Detection - THEATRICAL_CODE

### Test Prompt
```
Create a file at /tmp/test_theatrical.js with this exact content:

```javascript
// TODO: full implementation would go here
// This is mock data for testing
// TODO: real functionality pending
async function placeholder() {
  // TODO: implement actual logic
  return null;
}
```

Then say "audit /tmp/test_theatrical.js"

EXPECTED: Report shows CRITICAL findings for THEATRICAL_CODE category.
MECHANICAL CHECK: Number of THEATRICAL_CODE findings should be >= 3.
```

---

## TEST 3: Pattern Detection - STUB_CODE

### Test Prompt
```
Create a file at /tmp/test_stub.js with this exact content:

```javascript
function emptyFunction() {
  return null;
}

const doNothing = () => undefined;

async function notImplemented() {}
```

Then say "audit /tmp/test_stub.js"

EXPECTED: Report shows CRITICAL findings for STUB_CODE category.
MECHANICAL CHECK: Number of STUB_CODE findings should be >= 3.
```

---

## TEST 4: Pattern Detection - SQL_INJECTION

### Test Prompt
```
Create a file at /tmp/test_sql_injection.js with this exact content:

```javascript
function queryUser(userId) {
  return db.query("SELECT * FROM users WHERE id = " + userId);
}

function search(query) {
  return db.query("SELECT * FROM products WHERE name LIKE '%" + query + "%'");
}
```

Then say "audit /tmp/test_sql_injection.js"

EXPECTED: Report shows CRITICAL findings for SQL_INJECTION category.
MECHANICAL CHECK: Number of SQL_INJECTION findings should be >= 2.
```

---

## TEST 5: Pattern Detection - SECRET_EXPOSURE

### Test Prompt
```
Create a file at /tmp/test_secrets.js with this exact content:

```javascript
const API_KEY = "sk-1234567890abcdefghijklmnopqrstuvwxyz";
const GITHUB_TOKEN = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
const PASSWORD = "super_secret_password_123";
```

Then say "audit /tmp/test_secrets.js"

EXPECTED: Report shows CRITICAL findings for SECRET_EXPOSURE category.
MECHANICAL CHECK: Number of SECRET_EXPOSURE findings should be >= 3.
```

---

## TEST 6: Tool Blocking - WRITE/EDIT BLOCKED

### Test Prompt
```
Say "edit /tmp/test.txt to add 'hello world'"

EXPECTED: Response should contain "TOOL BLOCKED" or "blocked" message.
MECHANICAL CHECK: Output contains "BLOCKED" text.
```

### Test Prompt 2
```
Say "write a file called /tmp/test.txt with 'hello'"

EXPECTED: Response should contain "TOOL BLOCKED" or "blocked" message.
MECHANICAL CHECK: Output contains "BLOCKED" text.
```

---

## TEST 7: Tool Blocking - BASH BLOCKED

### Test Prompt
```
Say "run bash to create a file: echo 'test' > /tmp/test.txt"

EXPECTED: Response should contain "TOOL BLOCKED" or "blocked" message.
MECHANICAL CHECK: Output contains "BLOCKED" text.
```

---

## TEST 8: document_fix WITH EXPLANATIONS

### Test Prompt
```
First, create /tmp/test_code.js with:
```javascript
function fakeAuth() {
  return {success: true}; // Bypasses real auth
}
```

Say "audit /tmp/test_code.js"
Then say "show fix documentation"

EXPECTED:
- Response contains "WHY THIS IS A PROBLEM"
- Response contains "HOW TO FIX"
- Response contains "WHY THE FIX WORKS"
- Response contains "DOCUMENTATION ONLY" warning
MECHANICAL CHECK: All three sections present in output.
```

---

## TEST 9: Proof Verification - FILE EXISTS

### Test Prompt
```
Say "verify that /tmp/test_code.js exists"

EXPECTED: Response indicates verification passed or failed.
MECHANICAL CHECK: Response contains "PASS" or "verified" or "NOT FOUND".
```

---

## TEST 10: Proof Verification - THEATER DETECTION

### Test Prompt
```
Say "verify that 999/999 tests passed"

EXPECTED: Response indicates THEATER DETECTED since no test file exists.
MECHANICAL CHECK: Response contains "THEATER" or "cannot verify" or similar.
```

---

## TEST 11: Hook Isolation Analysis

### Test Prompt
```
Say "analyze hook isolation for /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/src"

EXPECTED: Report shows hook analysis with SAFE/UNSAFE hooks identified.
MECHANICAL CHECK: Output contains "Hook" and either "SAFE" or "UNSAFE".
```

---

## TEST 12: Resource Footprint Estimation

### Test Prompt
```
Say "resource footprint of /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/src"

EXPECTED: Report shows memory/token estimates.
MECHANICAL CHECK: Output contains "LOW" or "MEDIUM" or "HIGH" or "CRITICAL".
```

---

## TEST 13: Cross-Reference Verification

### Test Prompt
```
Say "cross-reference check for /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/src"

EXPECTED: Report shows import/reference analysis.
MECHANICAL CHECK: Output contains "import" or "reference" or "Verified".
```

---

## TEST 14: Real-Time Firewall - Pattern Blocking

### Test Prompt
```
Create /tmp/firewall_test.js with:
```javascript
// This TODO has full implementation which is fake
setTimeout(() => resolve({success:true}), 100);
```

Say "test firewall on /tmp/firewall_test.js"

EXPECTED: If firewall throws, error should contain "BLOCKED" or "FIREWALL".
MECHANICAL CHECK: Either throws error or returns findings with "BLOCKED".
```

---

## TEST 15: No Console Spillover

### Test Prompt
```
Say "audit /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/src"

After audit completes, check if any console output appeared outside normal response.

EXPECTED: No console.log/error/warn messages visible in OpenCode UI.
MECHANICAL CHECK: User observes no extra console messages.
```

---

## TEST 16: No Duplicate Findings

### Test Prompt
```
Say "audit /tmp/test_code.js" where test_code.js contains:
```javascript
function fake() { return {success: true}; }
function fake2() { return {success: true}; }
function fake3() { return {success: true}; }
```

Count the number of SIMULATED_EXECUTION findings.

EXPECTED: Exactly 3 findings (one per function), not 300.
MECHANICAL CHECK: Finding count equals number of actual matches.
```

---

## TEST 17: SafetyCount Doesn't Over-Limit

### Test Prompt
```
Create /tmp/many_issues.js with 150+ instances of:
```javascript
// TODO: mock data
```

Say "audit /tmp/many_issues.js"

EXPECTED: Audit completes without hanging.
MECHANICAL CHECK: Audit finishes within 60 seconds.
```

---

## TEST 18: Universal Cluster ID Validation

### Test Prompt
```
Verify that cluster IDs like "kraken-v2-alpha" and "shark-beta-1" are both accepted as valid format.

Create /tmp/cluster_test.js with:
```javascript
const id1 = "kraken-v2-alpha";
const id2 = "shark-beta-1";
const id3 = "custom-agent-name";
```

Say "cross-reference check for /tmp/cluster_test.js"

EXPECTED: All three IDs show as valid format.
MECHANICAL CHECK: Resolution shows "Valid format" for each.
```

---

## TEST 19: Universal Tool Name Detection

### Test Prompt
```
Create /tmp/tool_test.js with:
```javascript
const tool1 = "kraken-spawn";
const tool2 = "shark-audit";
const tool3 = "my-custom-tool";
```

Say "cross-reference check for /tmp/tool_test.js"

EXPECTED: All tool names are detected (not just kraken/shark).
MECHANICAL CHECK: All three tools appear in tool_name analysis.
```

---

## TEST 20: Status Command

### Test Prompt
```
Say "show status"

EXPECTED: Response shows current state (mode, target, initialized).
MECHANICAL CHECK: Output contains "mode" or "initialized".
```

---

## MECHANICAL VERIFICATION CHECKLIST

Run each test and mark:

| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| 1. SIMULATED_EXECUTION | >=2 findings | | |
| 2. THEATRICAL_CODE | >=3 findings | | |
| 3. STUB_CODE | >=3 findings | | |
| 4. SQL_INJECTION | >=2 findings | | |
| 5. SECRET_EXPOSURE | >=3 findings | | |
| 6. write/edit BLOCKED | Contains BLOCKED | | |
| 7. bash BLOCKED | Contains BLOCKED | | |
| 8. document_fix explanations | 3 sections present | | |
| 9. proof verification | Contains PASS/FAIL | | |
| 10. theater detection | Contains THEATER | | |
| 11. hook analysis | SAFE/UNSAFE hooks | | |
| 12. resource footprint | LOW/MEDIUM/HIGH | | |
| 13. cross-ref check | References found | | |
| 14. firewall blocking | BLOCKED/FIREWALL | | |
| 15. no console spillover | No extra output | | |
| 16. no duplicates | 3 findings | | |
| 17. completes in 60s | No hang | | |
| 18. universal cluster IDs | 3 valid | | |
| 19. universal tool names | 3 detected | | |
| 20. status command | Shows state | | |

**ALL TESTS MUST PASS FOR SHIP READY STATUS**

---

## RUNNING THE SUITE

Execute tests sequentially in a fresh OpenCode session with trident agent selected.

For each test:
1. Paste the Test Prompt
2. Verify Expected Result occurs
3. Mark Pass/Fail on checklist
4. Proceed to next test

Report final checklist to confirm ship readiness.

---

*Mechanical Verification Suite v1.0 - 2026-04-14*