# Kraken Brain V5 Build Workflow

**Classification:** Integration build plan  
**Purpose:** Port Kraken Ultra components into Agent Swarm architecture  
**Target:** Kraken Brain as the orchestration intelligence layer for the swarm

---

## Overview

Kraken Brain V5 = Agent Swarm (orchestration platform) + Kraken Ultra components (anti-hallucination validators, surgical debug protocol, Nemotron event service) as the intelligence layer.

This is distinct from Spider Agent V5. Spider is the worker OS — the mechanical enforcement layer that runs inside each worker. Kraken Brain is the orchestration intelligence — the planning, coordination, and event-driven communication layer that runs at the swarm/platform level.

**Key Distinction:**
- **Spider Agent V5** = What runs INSIDE each worker (enforcement, quality gates, debug protocol)
- **Kraken Brain V5** = What runs AT the swarm level (orchestration intelligence, event bus, cross-agent communication)

---

## Phase 1: Anti-Hallucination Validators → Swarm Judge

### Task 1.1: Port Anti-Hallucination Validators
**Source:** Kraken Ultra anti-hallucination validators (TypeScript)  
**Target:** `agent-swarm-spider/src/validators/anti-hallucination.ts`

```typescript
// Kraken Anti-Hallucination Validators
export interface ValidationResult {
  valid: boolean;
  violations: Violation[];
  confidence: number;
}

export interface Violation {
  type: 'unverified_claim' | 'simulated_output' | 'missing_evidence' | 'assumed_behavior';
  claim: string;
  evidenceRequired: string;
  evidenceFound: boolean;
}

// Validator types
export const validators = {
  fileExistenceValidator,    // Verify files exist before claiming content
  commandExitValidator,      // Verify exit codes before claiming success
  testResultValidator,       // Verify tests actually ran
  apiResponseValidator,      // Verify actual API responses
  importResolutionValidator, // Verify imports resolve
};
```

### Task 1.2: Integrate with Swarm's pre_check_batch
- Add as a gate in the existing pre_check_batch pipeline
- Runs after placeholder_scan, before lint
- Blocks output with unverified claims

### Task 1.3: Add to Swarm's Evidence System
- Extend evidence_check to include anti-hallucination validation
- Each task's evidence must pass anti-hallucination validators
- Store validation results in .swarm/evidence/{task}.json

### Acceptance Criteria
- [ ] Anti-hallucination validators ported from Kraken Ultra
- [ ] Integrated into swarm's pre_check_batch pipeline
- [ ] Evidence system includes anti-hallucination results
- [ ] Test: Simulated output is blocked
- [ ] Test: Verified output passes

---

## Phase 2: Surgical Debug Protocol → Swarm Reflexion Loop

### Task 2.1: Port Surgical Debug Protocol
**Source:** Kraken Ultra surgical debug protocol (TypeScript)  
**Target:** `agent-swarm-spider/src/debug/surgical-protocol.ts`

```typescript
// Kraken Surgical Debug Protocol
export interface DebugSession {
  error: string;
  hypothesis: string;
  fixApplied: string;
  verificationResult: 'pass' | 'fail';
  steps: DebugStep[];
  attempts: number;
}

export const PROTOCOL_STEPS = [
  'Read the exact error message',
  'Read the failing code',
  'Form a specific hypothesis',
  'Apply minimal fix',
  'Verify the fix',
  'If fail: new hypothesis',
];
```

### Task 2.2: Integrate with Swarm's Retry Circuit Breaker
- Replace current retry logic with surgical debug protocol
- Agent MUST follow 6 steps before applying any fix
- Auto-fix database for known error patterns

### Task 2.3: Add Stagnation Detection
- Track consecutive identical failures
- Force strategy switch after 3 failures
- Escalate to architect after 5 failures

### Acceptance Criteria
- [ ] Surgical debug protocol ported from Kraken Ultra
- [ ] Integrated into swarm's retry circuit breaker
- [ ] Stagnation detection tracks repeated failures
- [ ] Test: Agent follows 6-step protocol
- [ ] Test: Agent switches strategy after 3 failures

---

## Phase 3: Nemotron Event Service → Swarm Event Bus

### Task 3.1: Port Nemotron Event Service
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/projects/nemotron-communication-layer/src/`  
**Target:** `agent-swarm-spider/src/services/event-bus.ts`

```typescript
// Kraken Nemotron Event Service
export interface SwarmEvent {
  id: string;
  type: EventType;
  source: string;
  target: string;
  payload: any;
  timestamp: Date;
  classification: EventClassification;
}

export enum EventType {
  TASK_CREATED = 'task.created',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',
  GATE_PASSED = 'gate.passed',
  GATE_FAILED = 'gate.failed',
  STAGNATION_DETECTED = 'stagnation.detected',
  ESCALATION_REQUESTED = 'escalation.requested',
  MEMORY_UPDATED = 'memory.updated',
}

export enum EventClassification {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}
```

### Task 3.2: Integrate with Swarm's MCP Tools
- Add event subscription tools to MCP API
- Workers can publish events to the bus
- Lead agent can subscribe to event streams
- Dashboard can display real-time event feed

### Task 3.3: Add Token Classification
- Classify events by severity and type
- Route critical events to lead agent immediately
- Batch info events for periodic processing

### Acceptance Criteria
- [ ] Nemotron event service ported
- [ ] Integrated with swarm's MCP tools
- [ ] Dashboard displays real-time event feed
- [ ] Token classification routes events correctly
- [ ] Test: Events published by workers reach lead agent

---

## Phase 4: Fragment Injection System → Agent Config

### Task 4.1: Port Fragment System
**Source:** Spider Agent Plugin V2 fragments  
**Target:** `agent-swarm-spider/src/config/fragments.ts`

```typescript
// Kraken Fragment Injection System
export interface AgentFragment {
  name: string;
  role: string;
  instructions: string;
  constraints: string[];
  tools: string[];
}

export const FRAGMENTS = {
  hephaestus: { role: 'builder', instructions: '...', constraints: [], tools: [] },
  sisyphus: { role: 'orchestrator', instructions: '...', constraints: [], tools: [] },
  explore: { role: 'scout', instructions: '...', constraints: [], tools: [] },
  oracle: { role: 'architect', instructions: '...', constraints: [], tools: [] },
  metis: { role: 'planner', instructions: '...', constraints: [], tools: [] },
};
```

### Task 4.2: Integrate with Agent Identity System
- Fragments become part of agent identity files
- Each agent gets role-specific instructions
- Constraints enforced at runtime

### Acceptance Criteria
- [ ] Fragment system ported
- [ ] Integrated with agent identity files
- [ ] Role-specific instructions enforced
- [ ] Test: Each agent receives correct fragment

---

## Phase 5: Integration and Testing

### Task 5.1: Full Kraken Brain Integration Test
Run a complete task through the Kraken-enhanced swarm:
1. Lead agent receives task
2. Kraken Brain plans with fragment injection
3. Workers execute with anti-hallucination validators
4. Surgical debug protocol activates on errors
5. Nemotron event bus routes events
6. Stagnation detection prevents doom loops
7. Evidence system captures all validation results

### Task 5.2: Kraken-Specific Crash Tests
1. Anti-Hallucination Test: Claim without evidence → BLOCKED
2. Surgical Debug Test: Apply fix without hypothesis → BLOCKED
3. Nemotron Test: Event published → reaches subscribers
4. Fragment Test: Agent receives correct instructions → VERIFIED
5. Stagnation Test: 3 identical failures → strategy switch

### Task 5.3: Performance Benchmarks
- Measure pipeline execution time vs baseline
- Target: < 20% overhead from Kraken components
- Profile event bus latency

### Acceptance Criteria
- [ ] All Kraken components integrated
- [ ] Full pipeline test completes successfully
- [ ] Performance overhead < 20%
- [ ] No regressions in existing functionality
