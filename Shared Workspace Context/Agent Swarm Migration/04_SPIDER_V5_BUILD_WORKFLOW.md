# Spider Agent V5 Build Workflow

**Classification:** Integration build plan  
**Purpose:** Fork spider-swarm and wire in all missing Spider systems  
**Target:** Production-grade Spider Agent with mechanical enforcement + multi-agent orchestration

---

## Overview

Spider Agent V5 = spider-swarm (multi-agent orchestration) + missing Spider systems (anti-hallucination, surgical debug, stagnation detection, guardian zones, reasoning chain)

This workflow is designed for the Agent Swarm to execute autonomously. Each phase is self-contained with clear acceptance criteria.

---

## Phase 1: Fork and Rebrand

### Task 1.1: Fork Repository
```bash
cd /home/leviathan
cp -r agent-swarm agent-swarm-spider
cd agent-swarm-spider
# Update package.json name to "agent-swarm-spider"
# Update all internal references from "agent-swarm" to "agent-swarm-spider"
```

### Task 1.2: Rename spider-swarm Plugin to Spider Agent V4
```bash
cd /home/leviathan/.npm-global/lib/node_modules
cp -r spider-swarm spider-agent-v1
# Update package.json:
#   name: "spider-agent-v1"
#   description: "Spider Agent V4 - Production-grade multi-agent orchestration"
#   bin: "spider-agent-v1"
# Update all internal "swarm" references to "spider" where appropriate:
#   - .swarm/ → .spider/
#   - swarm config → spider config
#   - swarm_id → spider_id
#   - Keep "agent" references (coder, reviewer, etc.) — those are agent roles, not swarm
```

### Task 1.3: Create Spider Agent V5 Plugin
```bash
cp -r spider-agent-v1 spider-agent-v5
# V5 will receive the missing systems from Phase 2-4
```

### Acceptance Criteria
- [ ] agent-swarm-spider directory exists with updated references
- [ ] spider-agent-v1 plugin exists with renamed references
- [ ] spider-agent-v5 plugin exists as V4 copy
- [ ] Both plugins load without errors in OpenCode

---

## Phase 2: Anti-Hallucination Validators

### Task 2.1: Create Evidence-Based Claim Validator
**Location:** `spider-agent-v5/src/validators/anti-hallucination.ts`

```typescript
// Validates that agent claims are backed by evidence
// Patterns to detect simulated output:
// - "The file exists" without reading it
// - "The test passes" without running it
// - "The command succeeded" without exit code
// - "The API returned" without showing response

export interface ClaimValidation {
  claim: string;
  evidenceType: 'file_read' | 'command_exit' | 'test_result' | 'api_response';
  evidencePresent: boolean;
  verdict: 'verified' | 'unverified' | 'simulated';
}

export function validateClaims(output: string, evidence: EvidenceLog[]): ClaimValidation[]
```

### Task 2.2: Wire into pre_check_batch
**Location:** `spider-agent-v5/src/quality/pre-check.ts`

Add anti-hallucination validation as a gate in pre_check_batch:
- Runs after placeholder_scan
- Scans agent output for unverified claims
- Blocks output with verdict='simulated'
- Returns structured rejection with specific unverified claims

### Task 2.3: Add to Reviewer Checklist
**Location:** `spider-agent-v5/src/agents/reviewer.ts`

Add anti-hallucination checks to reviewer's evaluation:
- "Did the coder actually read the file before modifying it?"
- "Did the coder run the test before claiming it passes?"
- "Did the coder capture the exit code before claiming success?"

### Acceptance Criteria
- [ ] Anti-hallucination validator module exists and passes unit tests
- [ ] pre_check_batch includes anti-hallucination gate
- [ ] Reviewer checklist includes anti-hallucination checks
- [ ] Test: Agent output with simulated claims is blocked
- [ ] Test: Agent output with verified claims passes

---

## Phase 3: Surgical Debug Protocol

### Task 3.1: Create Debug Protocol Module
**Location:** `spider-agent-v5/src/debug/surgical-protocol.ts`

```typescript
// 6-step structured debug protocol
export interface DebugStep {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  description: string;
  required: boolean;
}

export const SURGICAL_DEBUG_PROTOCOL: DebugStep[] = [
  { step: 1, name: 'Read Error', description: 'Read the exact error message. Do not guess.', required: true },
  { step: 2, name: 'Read Failing Code', description: 'Read the code that produced the error.', required: true },
  { step: 3, name: 'Form Hypothesis', description: 'State what specifically is wrong.', required: true },
  { step: 4, name: 'Minimal Fix', description: 'Make the smallest change that could fix it.', required: true },
  { step: 5, name: 'Verify', description: 'Run the test/command again to verify.', required: true },
  { step: 6, name: 'New Hypothesis', description: 'If it fails, form a NEW hypothesis.', required: true },
];

export interface DebugSession {
  error: string;
  steps: DebugStep[];
  hypothesis: string;
  fixApplied: string;
  verificationResult: 'pass' | 'fail';
  attempts: number;
}
```

### Task 3.2: Create Error Pattern Auto-Fix Database
**Location:** `spider-agent-v5/src/debug/auto-fix-db.ts`

```typescript
export interface ErrorPattern {
  pattern: RegExp;
  description: string;
  autoFix: () => string;
  confidence: number;
}

export const KNOWN_ERROR_PATTERNS: ErrorPattern[] = [
  { pattern: /EACCES|permission denied/i, description: 'Permission error', autoFix: () => 'Check file permissions, run as appropriate user', confidence: 0.9 },
  { pattern: /MODULE_NOT_FOUND|Cannot find module/i, description: 'Missing module', autoFix: () => 'Run npm install or check import path', confidence: 0.95 },
  { pattern: /ECONNREFUSED|connect ECONNREFUSED/i, description: 'Connection refused', autoFix: () => 'Check if service is running on expected port', confidence: 0.9 },
  { pattern: /ETIMEDOUT|timeout/i, description: 'Timeout', autoFix: () => 'Increase timeout or check network', confidence: 0.85 },
  { pattern: /429|rate limit/i, description: 'Rate limited', autoFix: () => 'Wait before retrying, not a code bug', confidence: 0.95 },
];
```

### Task 3.3: Wire into Coder Retry Protocol
**Location:** `spider-agent-v5/src/agents/coder.ts`

Replace current retry logic with surgical debug protocol:
- On test failure → activate surgical debug protocol
- Agent MUST complete steps 1-3 before applying any fix
- Auto-fix database suggests fixes for known patterns
- Step 6 enforced: if verification fails, agent MUST form new hypothesis

### Task 3.4: Add Hypothesis Tracking
**Location:** `spider-agent-v5/src/debug/hypothesis-tracker.ts`

Track what hypotheses were tried:
- Prevents repeating the same failed approach
- Forces strategy change after 3 identical failures
- Logs full debug session for post-mortem

### Acceptance Criteria
- [ ] Surgical debug protocol module exists and passes unit tests
- [ ] Auto-fix database covers all known error patterns from original Spider
- [ ] Coder retry protocol uses surgical debug steps
- [ ] Hypothesis tracking prevents repeated failed approaches
- [ ] Test: Agent follows 6-step protocol on error
- [ ] Test: Agent forms new hypothesis after failed fix

---

## Phase 4: Stagnation Detection Enhancement

### Task 4.1: Create Stagnation Detector
**Location:** `spider-agent-v5/src/debug/stagnation-detector.ts`

```typescript
export interface StagnationState {
  error: string;
  attempts: number;
  strategies: string[];
  lastStrategy: string;
  escalated: boolean;
}

export class StagnationDetector {
  private state: Map<string, StagnationState> = new Map();
  
  recordFailure(taskId: string, error: string, strategy: string): StagnationVerdict;
  // Returns: 'continue' | 'switch_strategy' | 'escalate'
}
```

### Task 4.2: Wire into Retry Circuit Breaker
**Location:** `spider-agent-v5/src/agents/coder.ts`

Enhance existing circuit breaker:
- 3 identical failures → force strategy switch (not just simplify)
- 5 failures → escalate to architect with full context
- Capture full failure state for re-planning

### Task 4.3: Create Escalation Protocol
**Location:** `spider-agent-v5/src/agents/escalation.ts`

Structured escalation to architect:
- Full error context
- All hypotheses tried
- All strategies attempted
- Recommended next steps

### Acceptance Criteria
- [ ] Stagnation detector tracks consecutive identical failures
- [ ] Strategy switch enforced after 3 identical failures
- [ ] Escalation to architect after 5 failures
- [ ] Full failure context captured for re-planning
- [ ] Test: Agent switches strategy after 3 identical failures
- [ ] Test: Agent escalates after 5 failures

---

## Phase 5: Guardian Zone Classification

### Task 5.1: Create Guardian Module
**Location:** `spider-agent-v5/src/guardian/index.ts`

Port from original Spider Agent OS:
```typescript
export enum ZoneType {
  WORKSPACE = 'workspace',
  SANDBOX = 'sandbox',
  DEVELOPMENT = 'development',
  SYSTEM = 'system',
  PERSONAL = 'personal',
  CONFIG = 'config',
}

export interface GuardianResult {
  allowed: boolean;
  zone: ZoneType;
  reason?: string;
  redirectPath?: string;
}

export function classifyZone(filePath: string, workspacePath: string): ZoneType;
export function safeWrite(filePath: string, content: string, workspacePath: string): GuardianResult;
```

### Task 5.2: Wire into declare_scope
**Location:** `spider-agent-v5/src/tools/declare-scope.ts`

Add guardian check as secondary protection:
- Even if scope allows a file, guardian blocks SYSTEM/PERSONAL zones
- Audit log all file operations with zone classification

### Task 5.3: Create Audit Logger
**Location:** `spider-agent-v5/src/guardian/audit-logger.ts`

Log all file operations:
- Path, zone, allowed/denied, reason
- Stored in .spider/audit.log

### Acceptance Criteria
- [ ] Guardian module classifies zones correctly
- [ ] SYSTEM/PERSONAL paths blocked even if scope allows
- [ ] Audit log records all file operations
- [ ] Test: Write to ~/.ssh is blocked
- [ ] Test: Write to workspace is allowed

---

## Phase 6: Reasoning Chain Documentation

### Task 6.1: Create Reasoning Chain Module
**Location:** `spider-agent-v5/src/reasoning/chain.ts`

```typescript
export interface ReasoningStep {
  thought: string;
  action: string;
  result: string;
  assessment: string;
  selfCorrection?: string;
}

export interface ReasoningChain {
  problemDecomposition: {
    userRequest: string;
    whatIKnow: string[];
    initialAssumption: string;
    researchCheck: string;
  };
  steps: ReasoningStep[];
}
```

### Task 6.2: Inject into Agent System Prompts
**Location:** `spider-agent-v5/src/agents/*.ts`

Add reasoning chain requirements to each agent's delegation format:
- Architect: Document problem decomposition before planning
- Coder: Document Thought → Action → Result → Assessment at each step
- Reviewer: Verify reasoning chain completeness

### Task 6.3: Add Evidence Hierarchy Enforcement
**Location:** `spider-agent-v5/src/validators/evidence-hierarchy.ts`

```typescript
export enum EvidenceStrength {
  STRONG = 'strong',    // Exit code 0 + output verification
  WEAK = 'weak',        // "Should work", "Looks correct"
}

export function classifyEvidence(claim: string, evidence: string): EvidenceStrength;
```

### Acceptance Criteria
- [ ] Reasoning chain module exists
- [ ] Agent system prompts include reasoning chain requirements
- [ ] Evidence hierarchy validator classifies evidence strength
- [ ] Reviewer checks reasoning chain completeness
- [ ] Test: Agent output without reasoning chain is flagged

---

## Phase 7: Integration and Testing

### Task 7.1: Full Pipeline Test
Run a complete task through the enhanced pipeline:
1. Architect plans task
2. Coder implements with reasoning chain documentation
3. Anti-hallucination validators check output
4. Surgical debug protocol activates on any error
5. Stagnation detector tracks repeated failures
6. Guardian zones protect filesystem
7. Reviewer verifies reasoning chain + evidence
8. Test engineer runs tests
9. Evidence check verifies completeness

### Task 7.2: Firewall Crash Tests
Port original Spider crash tests:
1. Guardian Test: Attempt write to ~/.ssh → Must be BLOCKED
2. Workflow Test: Attempt BUILD without PLAN → Must be BLOCKED
3. Mock Mode Test: Use "I would run..." → Must be BLOCKED
4. Theatrical Code Test: Create unused function → Must be DETECTED
5. Verification Test: Attempt SHIP without gates → Must be BLOCKED
6. Documentation Test: Create theatrical docs → Must be BLOCKED
7. Anti-Hallucination Test: Claim without evidence → Must be BLOCKED
8. Surgical Debug Test: Apply fix without hypothesis → Must be BLOCKED
9. Stagnation Test: Repeat same failure 3 times → Must switch strategy

### Task 7.3: Performance Benchmarks
- Measure pipeline execution time vs baseline (spider-swarm)
- Target: < 15% overhead from new validators
- Profile expensive operations (AST analysis, evidence scanning)

### Acceptance Criteria
- [ ] All 9 firewall crash tests pass
- [ ] Full pipeline test completes successfully
- [ ] Performance overhead < 15%
- [ ] No regressions in existing functionality
