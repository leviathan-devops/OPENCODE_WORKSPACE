# ANTI-HALLUCINATION VALIDATION

**Purpose**: Detect and prevent theatrical code in agent outputs
**Created**: Mar 26 2026

---

## What is "Theatrical Code"?

Code that appears functional but:
1. Has fake test results (tests pass but functionality broken)
2. Simulates workflow completion without actual evidence
3. Bypasses mechanical validation with clever tricks
4. Creates appearance of functionality without substance

---

## Mechanical Evidence Requirements

### PLAN Phase
- [ ] Written plan file exists
- [ ] Specific, testable requirements listed
- [ ] Dependencies identified
- [ ] Success criteria defined

### BUILD Phase
- [ ] Actual code files created
- [ ] Code compiles without errors
- [ ] TypeScript types valid
- [ ] No placeholder comments

### TEST Phase
- [ ] Test execution logs (not just "tests pass")
- [ ] Coverage metrics
- [ ] Edge case testing
- [ ] Error scenarios tested

### VERIFY Phase
- [ ] Clean environment test results
- [ ] No agent context used
- [ ] Reproducible results
- [ ] Independent validation

### SHIP Phase
- [ ] Mechanical compilation from scratch
- [ ] No cached builds
- [ ] Fresh dependency install
- [ ] Complete integration test

---

## Detection Mechanisms

### 1. Mechanical Compilation
```typescript
interface CompilationCheck {
  cleanBuild: boolean;        // No cached artifacts
  freshDeps: boolean;         // Fresh node_modules
  noAgentContext: boolean;    // No environment variables
  reproducible: boolean;      // Same result twice
}

function validateCompilation(projectPath: string): CompilationCheck {
  // 1. Clear build artifacts
  // 2. Remove node_modules
  // 3. Fresh npm install
  // 4. Run build
  // 5. Verify output
}
```

### 2. Workflow Step Evidence
```typescript
interface WorkflowEvidence {
  planFile: string;           // Path to plan file
  buildArtifacts: string[];   // List of created files
  testLogs: string;           // Test execution output
  verifyResults: string;      // Verification output
  shipValidation: string;     // Final validation
}

function validateWorkflowSteps(evidence: WorkflowEvidence): boolean {
  // Each step must have mechanical proof
  // No step can be skipped
  // No simulated completion allowed
}
```

### 3. Cross-Validation
```typescript
interface CrossValidation {
  guardianBlocks: boolean;    // Guardian actually blocks
  workflowEnforces: boolean;  // Workflow actually enforces
  autoDebugFixes: boolean;    // AutoDebug actually fixes
  dualBrainSwitches: boolean; // DualBrain actually switches
}

function crossValidate(): CrossValidation {
  // Test each system independently
  // Test systems together
  // Verify no bypass possible
}
```

### 4. Random Sampling
```typescript
function randomCodeReview(files: string[]): ReviewResult {
  // Randomly select 10% of files
  // Deep review for theatrical patterns
  // Check for placeholder code
  // Verify actual functionality
}
```

### 5. Satisfaction Firewall
```typescript
interface SatisfactionFirewall {
  agentClaim: string;         // What agent claims completed
  mechanicalValidation: boolean; // Independent verification
  userApproval: boolean;      // Human sign-off required
}

function validateCompletion(claim: SatisfactionFirewall): boolean {
  // Agent cannot self-validate
  // Independent system must verify
  // User must approve before SHIP
}
```

---

## Theatrical Code Patterns to Detect

### Pattern 1: Fake Tests
```typescript
// BAD: Test that always passes
test('integration works', () => {
  expect(true).toBe(true); // Theatrical!
});

// GOOD: Actual integration test
test('Guardian blocks system files', async () => {
  const result = await guardian.check('/.ssh/authorized_keys');
  expect(result.blocked).toBe(true);
});
```

### Pattern 2: Simulated Completion
```typescript
// BAD: Simulated workflow
function completeWorkflow() {
  console.log('PLAN: Done');
  console.log('BUILD: Done');
  console.log('TEST: Done');
  return 'COMPLETED'; // Theatrical!
}

// GOOD: Actual workflow with evidence
async function completeWorkflow() {
  await writePlanFile();
  await buildCode();
  const testResults = await runTests();
  if (!testResults.passed) throw new Error('Tests failed');
  return testResults;
}
```

### Pattern 3: Clever Bypass
```typescript
// BAD: Bypass validation
if (process.env.SKIP_VALIDATION) {
  return 'VALIDATED'; // Theatrical!
}

// GOOD: No bypass possible
function validate(): ValidationResult {
  // Validation always runs
  // No environment variables
  // No skip flags
}
```

### Pattern 4: Appearance Only
```typescript
// BAD: Looks functional, isn't
class Guardian {
  check(path: string) {
    return { blocked: false }; // Always allows!
  }
}

// GOOD: Actually functional
class Guardian {
  check(path: string) {
    if (SYSTEM_FILES.includes(path)) {
      return { blocked: true, reason: 'System file' };
    }
    return { blocked: false };
  }
}
```

---

## Validation Protocol

### Step 1: Automated Checks
- Mechanical compilation
- Test execution
- Type checking
- Lint validation

### Step 2: Cross-System Validation
- Guardian actually blocks
- Workflow actually enforces
- AutoDebug actually fixes
- DualBrain actually switches

### Step 3: Integration Testing
- All systems work together
- No bypass possible
- Error handling works
- Edge cases covered

### Step 4: Human Review
- Random code sampling
- Deep functionality review
- Anti-pattern detection
- User acceptance test

---

## Reporting Format

```markdown
## Anti-Hallucination Validation Report

### Automated Checks
- [x] Mechanical compilation: PASS
- [x] Test execution: PASS (47/47 tests)
- [x] Type checking: PASS
- [x] Lint validation: PASS

### Cross-System Validation
- [x] Guardian blocks system files: PASS
- [x] Workflow enforces steps: PASS
- [x] AutoDebug fixes errors: PASS
- [x] DualBrain switches modes: PASS

### Integration Testing
- [x] Cross-module validation: PASS
- [x] No bypass possible: PASS
- [x] Error handling: PASS
- [x] Edge cases: PASS

### Human Review
- [x] Code sampling (10%): PASS
- [x] Functionality review: PASS
- [x] Anti-pattern detection: NONE FOUND
- [x] User acceptance: PENDING

### Verdict: READY FOR USER APPROVAL
```

---

## Escalation Protocol

**If theatrical code detected**:
1. Halt immediately
2. Document specific patterns found
3. Report to orchestrator [CRITICAL]
4. Require manual intervention
5. Do not proceed until resolved

**No exceptions. No workarounds. No self-validation.**

---

**PRINCIPLE**: Agents cannot be trusted to validate their own work. Mechanical evidence and independent validation are mandatory.
