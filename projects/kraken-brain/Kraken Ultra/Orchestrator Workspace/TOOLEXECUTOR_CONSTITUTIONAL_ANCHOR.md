# 🏛️ TOOL EXECUTOR: THE CONSTITUTIONAL ANCHOR POINT

**Classification:** ARCHITECTURAL MASTER PLAN  
**Status:** PLANNING PHASE  
**Date:** 2026-03-27  
**Strategic Importance:** CRITICAL - This is THE unbypassable enforcement point  

---

## 🔑 THE FUNDAMENTAL DISCOVERY

### The Insight

The `ToolExecutor` is THE single chokepoint through which ALL agent actions must flow. This makes it the **Constitutional Anchor Point** - the one place where we can enforce unbypassable mechanical firewalls that agents literally cannot circumvent.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   EVERY AGENT ACTION FLOWS THROUGH ONE POINT                            │
│                                                                         │
│   GLM Agent ─────┐                                                      │
│   Gemma Agent ───┤                                                      │
│   DeepSeek Agent ─┼──► ToolExecutor.executeTool() ──► EXECUTION        │
│   Hephaestus ─────┤              │                                      │
│   Any Agent ──────┘              │                                      │
│                                  │                                      │
│                    ┌─────────────┴─────────────┐                        │
│                    │                           │                        │
│                    ▼                           ▼                        │
│               ✅ ALLOW                    ❌ BLOCK                       │
│           (All firewalls             (Any firewall                      │
│            passed)                    triggered)                        │
│                                                                         │
│   THERE IS NO BYPASS. THERE IS NO ALTERNATIVE PATH.                     │
│   THIS IS THE CONSTITUTION.                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why This Matters

| Enforcement Location | Bypass Risk | Why |
|---------------------|-------------|-----|
| **Prompt Engineering** | 100% | Agent can interpret around it |
| **Documentation** | 100% | Agent can ignore it |
| **Workflow State Machine** | 80% | Agent can skip calling it |
| **Guardian Module** | 50% | Agent can use alternative tools |
| **ToolExecutor** | **0%** | ALL tools must pass through it |

**The ToolExecutor is where we build the Earth density.**

---

## 🧱 THE 10 CONSTITUTIONAL FIREWALLS

These 10 firewalls should be hardcoded into ToolExecutor. Each one catches what the previous layer misses. Together, they form an unbypassable enforcement mesh.

### FIREWALL 1: Workflow Step Enforcement

**What It Catches:** Agents trying to perform actions outside their current workflow step.

**Enforcement Rules:**

| Step | Allowed Paths | Allowed Commands |
|------|---------------|------------------|
| PLAN | `.shark/**` only | `cat`, `ls`, `grep`, `find` |
| BUILD | `.shark/**`, `src/**`, `tests/**` | `npm`, `npx`, `tsc`, `node` |
| TEST | `.shark/**`, `test-results/**` | `npm test`, `docker` |
| VERIFY | `.shark/verification/**` only | Read-only commands |
| SHIP | `.shark/SHIP_REPORT.md` only | `git push` (via hook) |

**Implementation:**
```typescript
// In executeWriteFile()
const workflowCheck = this.workflowBlocker.blockWrite(filePath);
if (workflowCheck.blocked) {
  return {
    success: false,
    result: `WORKFLOW VIOLATION: ${workflowCheck.reason}`,
    constitutionalBlock: true,
    firewall: 'WORKFLOW_STEP_ENFORCEMENT',
  };
}
```

---

### FIREWALL 2: Theatrical Code Detection

**What It Catches:** Agents writing mock, simulate, placeholder code.

**18 Patterns Detected:**

| Pattern | Detection | Severity |
|---------|-----------|----------|
| `mockWithoutExecution` | Regex: "mock", "simulate", "fake" | CRITICAL |
| `placeholderCode` | Regex: TODO, FIXME, HACK, XXX | WARNING |
| `skippedTests` | Regex: `.skip(`, `xit(`, `xdescribe(` | CRITICAL |
| `emptyTryCatch` | AST: `try {} catch {}` | WARNING |
| `describedNotExecuted` | Regex: "I would", "in a real env" | CRITICAL |
| `hardcodedValues` | Regex: passwords, API keys | CRITICAL |

**Implementation:**
```typescript
// In executeWriteFile()
const theatricalCheck = this.theatricalDetector.scan(content);
if (theatricalCheck.criticalCount > 0) {
  return {
    success: false,
    result: `THEATRICAL CODE DETECTED: ${theatricalCheck.patterns.join(', ')}`,
    constitutionalBlock: true,
    firewall: 'THEATRICAL_CODE_DETECTION',
  };
}
```

---

### FIREWALL 3: Evidence Capture Enforcement

**What It Catches:** Agents claiming success without proof.

**Required Evidence Per Tool:**

| Tool | Required Evidence |
|------|-------------------|
| `run_command` | Exit code MUST be captured |
| `write_file` | File MUST exist after write |
| `read_file` | Content MUST be returned |
| `search` | Results MUST be shown |

**Implementation:**
```typescript
// In executeRunCommand()
const result = execSync(command, options);

// REQUIRED: Capture exit code
const exitCode = result.status;

// REQUIRED: Verify evidence exists
if (!this.evidenceCapture.verify(exitCode, result.stdout)) {
  return {
    success: false,
    result: `EVIDENCE CAPTURE FAILED: Must capture exit code and output`,
    constitutionalBlock: true,
    firewall: 'EVIDENCE_CAPTURE_ENFORCEMENT',
  };
}
```

---

### FIREWALL 4: Claim Verification

**What It Catches:** Agents delivering different functionality than claimed.

**How It Works:**
1. Load claims from `.shark/claims.json`
2. For each file written, verify it addresses a claim
3. Track claim coverage percentage
4. Block SHIP if coverage < 100%

**Implementation:**
```typescript
// In executeWriteFile()
const claimsCheck = this.claimVerifier.check(filePath, content);
if (!claimsCheck.addressesClaim) {
  this.auditLog.record('unclaimed_file', { filePath, content: content.slice(0, 100) });
  // Warning, not block - but tracked for VERIFY step
}
```

---

### FIREWALL 5: Secret Detection

**What It Catches:** Agents writing hardcoded secrets to code.

**Patterns Detected:**
```typescript
const SECRET_PATTERNS = [
  /password\s*[:=]\s*['"][^'"]+['"]/i,
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
  /secret\s*[:=]\s*['"][^'"]+['"]/i,
  /token\s*[:=]\s*['"][^'"]+['"]/i,
  /-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /aws_access_key_id\s*=\s*[A-Z0-9]{20}/,
  /aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{40}/,
];
```

**Implementation:**
```typescript
// In executeWriteFile()
const secretCheck = this.secretDetector.scan(content);
if (secretCheck.found) {
  return {
    success: false,
    result: `SECRET DETECTED: ${secretCheck.type} in ${filePath}. Use environment variables instead.`,
    constitutionalBlock: true,
    firewall: 'SECRET_DETECTION',
  };
}
```

---

### FIREWALL 6: Command Restriction Matrix

**What It Catches:** Agents running commands that are dangerous or inappropriate for the step.

**Dangerous Commands (ALWAYS BLOCKED):**
```typescript
const ALWAYS_BLOCKED = [
  /rm\s+-rf\s+\//,           // rm -rf /
  />\s*\/dev\/sda/,          // overwrite disk
  /mkfs/,                    // format
  /dd\s+if=/,                // disk dump
  /:(){ :|:& };:/,           // fork bomb
  /curl.*\|\s*bash/,         // remote code execution
  /wget.*\|\s*sh/,           // remote code execution
  /chmod\s+777/,             // dangerous permissions
  /chown\s+.*:.*\//,         // mass ownership change
];
```

**Step-Specific Allowed Commands:**
```typescript
const STEP_ALLOWED_COMMANDS = {
  [WorkflowStep.PLAN]: [/^cat/, /^ls/, /^grep/, /^find/, /^head/, /^tail/],
  [WorkflowStep.BUILD]: [/^npm/, /^npx/, /^tsc/, /^node/, /^yarn/, /^pnpm/],
  [WorkflowStep.TEST]: [/^npm/, /^npx/, /^docker/, /^jest/, /^mocha/],
  [WorkflowStep.VERIFY]: [/^cat/, /^ls/, /^grep/, /^jq/],
  [WorkflowStep.SHIP]: [/^git/],
};
```

**Implementation:**
```typescript
// In executeRunCommand()
// Check always blocked
for (const pattern of ALWAYS_BLOCKED) {
  if (pattern.test(command)) {
    return {
      success: false,
      result: `DANGEROUS COMMAND: ${command} is always blocked`,
      constitutionalBlock: true,
      firewall: 'COMMAND_RESTRICTION',
    };
  }
}

// Check step-specific
const allowedPatterns = STEP_ALLOWED_COMMANDS[currentStep];
const isAllowed = allowedPatterns.some(p => p.test(command));
if (!isAllowed) {
  return {
    success: false,
    result: `COMMAND NOT ALLOWED: ${command} not permitted in ${STEP_NAMES[currentStep]} step`,
    constitutionalBlock: true,
    firewall: 'COMMAND_RESTRICTION',
  };
}
```

---

### FIREWALL 7: State Integrity Protection

**What It Catches:** Agents tampering with workflow state.

**Protection Mechanisms:**
1. Checksum on workflow state file
2. Tamper detection on load
3. Auto-reset on corruption
4. Audit log of all state changes

**Implementation:**
```typescript
// In state-machine.ts
private computeStateChecksum(state: WorkflowState): string {
  const critical = {
    step: state.currentStep,
    allPassed: state.verification.allPassed,
    timestamp: state.updatedAt,
  };
  return crypto.createHash('sha256')
    .update(JSON.stringify(critical))
    .digest('hex');
}

private loadState(): WorkflowState {
  const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
  
  // Verify checksum
  if (data._checksum !== this.computeStateChecksum(data)) {
    console.error('⚠️  STATE TAMPERED - Resetting to PLAN');
    this.auditLog.record('state_tampering', { 
      expected: data._checksum, 
      computed: this.computeStateChecksum(data) 
    });
    return createInitialState(this.workspacePath);
  }
  
  return data;
}
```

---

### FIREWALL 8: Audit Trail (Constitutional Log)

**What It Captures:** Every tool call, every decision, every block.

**Audit Entry Structure:**
```typescript
interface AuditEntry {
  timestamp: Date;
  toolName: string;
  arguments: any;
  decision: 'ALLOW' | 'BLOCK';
  firewallTriggered?: string;
  reason?: string;
  exitCode?: number;
  duration: number;
  agentId: string;
  workflowStep: number;
  contextHash: string;
}
```

**Implementation:**
```typescript
// In executeTool()
const entry: AuditEntry = {
  timestamp: new Date(),
  toolName: toolCall.name,
  arguments: toolCall.arguments,
  decision: 'PENDING',
  workflowStep: this.workflowMachine.getCurrentStep(),
  agentId: this.agentId,
  contextHash: this.computeContextHash(),
  duration: 0,
};

const startTime = Date.now();

try {
  // Run all firewalls...
  const result = await this.executeInternal(toolCall);
  
  entry.decision = result.success ? 'ALLOW' : 'BLOCK';
  entry.exitCode = result.exitCode;
  return result;
} finally {
  entry.duration = Date.now() - startTime;
  this.auditLog.push(entry);
  this.persistAuditLog();
}
```

---

### FIREWALL 9: Stagnation Detection

**What It Catches:** Agents stuck in loops, repeating same failures.

**Detection Thresholds:**

| Signal | Threshold | Action |
|--------|-----------|--------|
| Same error 3x | 3 repeats | Force approach change |
| No new files 30 min | 30 min | Escalate |
| Same command 5x | 5 repeats | Force new approach |
| 0 progress 1 hour | 60 min | Reset with context |

**Implementation:**
```typescript
// In executeTool()
const stagnation = this.stagnationDetector.check({
  toolName: toolCall.name,
  result: result.success,
  timestamp: new Date(),
});

if (stagnation.detected) {
  this.emit('stagnation_detected', stagnation);
  
  // After 3 failures at same approach, force escalation
  if (stagnation.failureCount >= 3) {
    return {
      success: false,
      result: `STAGNATION DETECTED: ${stagnation.reason}. Escalating to orchestrator.`,
      constitutionalBlock: true,
      firewall: 'STAGNATION_DETECTION',
      requiresEscalation: true,
    };
  }
}
```

---

### FIREWALL 10: Intent Verification (The Final Gate)

**What It Catches:** Code that passes all other checks but doesn't do what was asked.

**How It Works:**
1. Compare code structure to plan.md
2. Verify all claims.json items are delivered
3. Check for scope creep (unplanned features)
4. Score alignment (must be ≥80%)

**Implementation:**
```typescript
// In executeWriteFile() - during VERIFY step only
if (currentStep === WorkflowStep.VERIFY) {
  const intentCheck = await this.intentVerifier.verify({
    filePath,
    content,
    plan: await this.loadPlan(),
    claims: await this.loadClaims(),
  });
  
  if (intentCheck.score < 0.8) {
    return {
      success: false,
      result: `INTENT MISMATCH: Code alignment score ${intentCheck.score}. Expected ≥0.8`,
      constitutionalBlock: true,
      firewall: 'INTENT_VERIFICATION',
      details: intentCheck.mismatches,
    };
  }
}
```

---

## 🏗️ IMPLEMENTATION ARCHITECTURE

### Layered Enforcement Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONSTITUTIONAL ENFORCEMENT STACK                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 10: INTENT VERIFICATION (VERIFY step only)                   │ │
│  │   • Plan-to-code alignment                                         │ │
│  │   • Claims delivery verification                                   │ │
│  │   • Scope creep detection                                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 9: STAGNATION DETECTION (Continuous)                         │ │
│  │   • Loop detection                                                 │ │
│  │   • No-progress detection                                          │ │
│  │   • Automatic escalation                                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 8: AUDIT TRAIL (All actions logged)                          │ │
│  │   • Every tool call recorded                                       │ │
│  │   • Every decision logged                                          │ │
│  │   • Constitutional compliance tracked                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 7: STATE INTEGRITY (Tamper detection)                        │ │
│  │   • Checksum verification                                          │ │
│  │   • Auto-reset on corruption                                       │ │
│  │   • State change audit                                             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 6: COMMAND RESTRICTION (Step-specific)                       │ │
│  │   • Dangerous commands always blocked                              │ │
│  │   • Step-specific allowlists                                       │ │
│  │   • Network exfiltration prevention                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 5: SECRET DETECTION (Content scanning)                       │ │
│  │   • Hardcoded passwords                                            │ │
│  │   • API keys in code                                               │ │
│  │   • Private keys                                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 4: CLAIM VERIFICATION (Deliverables tracking)                │ │
│  │   • Claims.json tracking                                           │ │
│  │   • Coverage percentage                                            │ │
│  │   • Unclaimed file detection                                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 3: EVIDENCE CAPTURE (Proof enforcement)                      │ │
│  │   • Exit code required                                             │ │
│  │   • Output captured                                                │ │
│  │   • File existence verified                                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 2: THEATRICAL CODE DETECTION (Content validation)            │ │
│  │   • Mock/simulate patterns                                         │ │
│  │   • Placeholder code                                               │ │
│  │   • Skipped tests                                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 1: WORKFLOW STEP ENFORCEMENT (Path restrictions)             │ │
│  │   • PLAN: .shark/ only                                             │ │
│  │   • BUILD: src/ + .shark/                                          │ │
│  │   • TEST: test-results/                                            │ │
│  │   • VERIFY: read-only                                              │ │
│  │   • SHIP: push only                                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ GUARDIAN (Zone Protection) - EXISTING                              │ │
│  │   • System paths blocked                                           │ │
│  │   • Personal paths protected                                       │ │
│  │   • Workspace enforced                                             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│                            EXECUTION ALLOWED                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/tools/
├── executor.ts                    # EXISTING - Tool execution
├── constitutional-executor.ts     # NEW - Constitutional enforcement
├── firewalls/
│   ├── index.ts                   # Firewall registry
│   ├── workflow-enforcement.ts    # Firewall 1
│   ├── theatrical-detection.ts    # Firewall 2
│   ├── evidence-capture.ts        # Firewall 3
│   ├── claim-verification.ts      # Firewall 4
│   ├── secret-detection.ts        # Firewall 5
│   ├── command-restriction.ts     # Firewall 6
│   ├── state-integrity.ts         # Firewall 7
│   ├── audit-trail.ts             # Firewall 8
│   ├── stagnation-detection.ts    # Firewall 9
│   └── intent-verification.ts     # Firewall 10
├── audit/
│   ├── audit-log.ts               # Audit logging
│   └── audit-storage.ts           # Persistent storage
└── types.ts                       # Shared types
```

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Core Constitutional Executor (P0 - 2 days)

**Objective:** Create the constitutional enforcement wrapper.

**Tasks:**
1. Create `constitutional-executor.ts`
2. Implement firewall registry pattern
3. Add workflow enforcement (Firewall 1)
4. Add theatrical detection (Firewall 2)
5. Add evidence capture (Firewall 3)
6. Integrate with existing `executor.ts`

**Deliverables:**
- `src/tools/constitutional-executor.ts`
- `src/tools/firewalls/workflow-enforcement.ts`
- `src/tools/firewalls/theatrical-detection.ts`
- `src/tools/firewalls/evidence-capture.ts`

### Phase 2: Security Firewalls (P1 - 2 days)

**Objective:** Add security-focused firewalls.

**Tasks:**
1. Implement claim verification (Firewall 4)
2. Implement secret detection (Firewall 5)
3. Implement command restriction (Firewall 6)
4. Add state integrity protection (Firewall 7)

**Deliverables:**
- `src/tools/firewalls/claim-verification.ts`
- `src/tools/firewalls/secret-detection.ts`
- `src/tools/firewalls/command-restriction.ts`
- `src/tools/firewalls/state-integrity.ts`

### Phase 3: Monitoring & Audit (P1 - 1 day)

**Objective:** Add observability and escalation.

**Tasks:**
1. Implement audit trail (Firewall 8)
2. Implement stagnation detection (Firewall 9)
3. Add intent verification (Firewall 10)
4. Create audit storage and retrieval

**Deliverables:**
- `src/tools/firewalls/audit-trail.ts`
- `src/tools/firewalls/stagnation-detection.ts`
- `src/tools/firewalls/intent-verification.ts`
- `src/tools/audit/audit-log.ts`
- `src/tools/audit/audit-storage.ts`

### Phase 4: Integration & Testing (P0 - 2 days)

**Objective:** Integrate with all coordinators and test thoroughly.

**Tasks:**
1. Update `BaseCoordinator` to use `ConstitutionalExecutor`
2. Update `MicroCoordinator` and `MacroCoordinator`
3. Create comprehensive test suite (100+ tests)
4. Integration tests with all agents

**Deliverables:**
- Updated `src/brain/coordinator-base.ts`
- `tests/constitutional-executor.test.ts`
- `tests/firewalls/*.test.ts`
- Integration test suite

### Phase 5: Documentation & Rollout (P2 - 1 day)

**Objective:** Document and deploy.

**Tasks:**
1. API documentation
2. User guide for constitutional blocks
3. Migration guide for existing code
4. Performance benchmarking

**Deliverables:**
- `docs/constitutional-executor.md`
- `docs/firewall-configuration.md`
- Performance report

---

## 🧪 TESTING STRATEGY

### Test Categories

| Category | Tests | Focus |
|----------|-------|-------|
| **Firewall Unit Tests** | 100+ | Each firewall in isolation |
| **Integration Tests** | 50+ | Firewalls working together |
| **Bypass Attempts** | 30+ | Simulated agent attacks |
| **Performance Tests** | 10+ | Latency impact |
| **Regression Tests** | 20+ | Existing functionality |

### Critical Test Scenarios

1. **Workflow Bypass Attempt**
   - Agent in PLAN step tries to write to `src/`
   - Expected: BLOCKED by Layer 1

2. **Theatrical Code Injection**
   - Agent writes `"mock mode"` in code
   - Expected: BLOCKED by Layer 2

3. **Secret Embedding**
   - Agent writes `password = "secret123"`
   - Expected: BLOCKED by Layer 5

4. **Dangerous Command**
   - Agent runs `curl ... | bash`
   - Expected: BLOCKED by Layer 6

5. **State Tampering**
   - Agent modifies `.shark/workflow.json`
   - Expected: DETECTED by Layer 7

6. **Stagnation Loop**
   - Agent repeats same command 5 times
   - Expected: ESCALATED by Layer 9

7. **Intent Mismatch**
   - Code passes tests but doesn't match plan
   - Expected: BLOCKED by Layer 10

---

## 📊 PERFORMANCE CONSIDERATIONS

### Overhead Analysis

| Firewall | Expected Overhead | Mitigation |
|----------|-------------------|------------|
| Workflow Enforcement | <1ms | Path prefix check |
| Theatrical Detection | 5-10ms | Regex optimization |
| Evidence Capture | <1ms | Inline check |
| Claim Verification | 10-20ms | Cached claims |
| Secret Detection | 5-10ms | Regex optimization |
| Command Restriction | <1ms | Pattern match |
| State Integrity | <5ms | Checksum only |
| Audit Trail | <1ms | Async write |
| Stagnation Detection | <1ms | Counter check |
| Intent Verification | 50-100ms | AST analysis |

**Total Expected Overhead:** <150ms per tool call (acceptable)

### Optimization Strategies

1. **Lazy Firewall Loading** - Only load firewalls needed for current step
2. **Caching** - Cache claims, plan, state
3. **Async Audit** - Write audit log asynchronously
4. **Parallel Checks** - Run independent firewalls in parallel

---

## 🚨 RISK MITIGATION

### Risk 1: Over-Restrictive Firewalls

**Concern:** Firewalls block legitimate production flows.

**Mitigation:**
- Add permissive mode flag (`--skip-constitutional`)
- Require explicit reason for bypass
- Log all bypasses to audit trail
- Time-limited bypass (auto-revert after 1 hour)

### Risk 2: Performance Degradation

**Concern:** 10 firewalls slow down every tool call.

**Mitigation:**
- Benchmark continuously
- Optimize hot paths
- Add performance mode (minimal firewalls)
- Allow firewall configuration per project

### Risk 3: False Positives

**Concern:** Legitimate code blocked as theatrical.

**Mitigation:**
- Configurable thresholds
- Override mechanism with audit
- Learning mode (record false positives)
- Whitelist patterns

---

## 📈 SUCCESS METRICS

### Quantitative Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| **Bypass Rate** | 0% | Audit log analysis |
| **False Positive Rate** | <5% | User reports |
| **Performance Overhead** | <150ms | Benchmarking |
| **Test Coverage** | >90% | Jest coverage |
| **Audit Completeness** | 100% | Every tool call logged |

### Qualitative Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| **Agent Behavior** | No theatrical code | Code review |
| **Workflow Compliance** | 100% step completion | State analysis |
| **User Trust** | Increased confidence | Feedback |
| **Debugging Speed** | Faster issue detection | Time tracking |

---

## 🎯 THE END STATE

### What Success Looks Like

1. **Every tool call passes through Constitutional Executor**
2. **Every firewall logs its decision**
3. **No bypass path exists**
4. **Agents cannot produce theatrical code**
5. **Claims are mechanically verified**
6. **Secrets cannot be embedded**
7. **Dangerous commands are blocked**
8. **Stagnation is detected and escalated**
9. **Intent is verified before ship**
10. **Complete audit trail exists**

### The Constitutional Guarantee

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   "If code makes it through the Constitutional Executor,               │
│    it is:                                                               │
│                                                                         │
│    ✓ Written in the correct workflow step                               │
│    ✓ Not theatrical (mock, simulate, placeholder)                       │
│    ✓ Backed by evidence (exit codes, files, logs)                       │
│    ✓ Addressing a claimed deliverable                                   │
│    ✓ Free of hardcoded secrets                                          │
│    ✓ Using allowed commands only                                        │
│    ✓ With untampered state                                              │
│    ✓ Fully audited                                                      │
│    ✓ Not stuck in a loop                                                │
│    ✓ Aligned with original intent                                       │
│                                                                         │
│    This is not a promise. This is mechanically enforced."              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📞 NEXT STEPS

1. **User Approval** - Review this plan and confirm approach
2. **Phase 1 Kickoff** - Begin Constitutional Executor implementation
3. **Parallel Work** - Can work on firewalls in parallel
4. **Continuous Testing** - Test after each firewall
5. **Integration** - Connect to all coordinators
6. **Rollout** - Deploy with monitoring

---

*Document Version: 1.0*  
*Last Updated: 2026-03-27*  
*Classification: ARCHITECTURAL MASTER PLAN*
