# Phase State Machine

## Overview

The `WorkflowMachine` persists workflow state to `.shark/workflow.json` in the project directory. It enforces a strict phase order: no phase can be skipped, no phase can be re-entered after completion without going through the full cycle.

## Phase Order

```
PLAN ──► BUILD ──► TEST ──► VERIFY ──► SHIP
                              ▲
                              │
                    [up to 3 loops]
```

**PLAN**: Extract claims, generate plan
**BUILD**: Implement per claim, update manifest
**TEST**: Run stage1 + stage2 tests
**VERIFY**: Run 3-gate verification
**SHIP**: Deliver to user

## Phase Transitions

### PLAN → BUILD

**Entry condition**: `claims.json` exists and every claim has a `testFile` path

**What happens**: Orchestrator reads claims, delegates to execution pool

**Blocked if**: `claims.json` does not exist, or any claim lacks a `testFile`

### BUILD → TEST

**Entry condition**: `build-manifest.json` is complete (all claimed files written)

**What happens**: Execution pool stops, QA pool takes over

**Blocked if**: `build-manifest.json` shows missing files, or new files exist that aren't in manifest

### TEST → VERIFY

**Entry condition**: Stage1 (Docker sandbox) tests pass AND Stage2 (local) tests pass

**What happens**: Guardian runs security scan, claim verification begins

**Blocked if**: Either test stage fails or has no evidence file

### VERIFY → SHIP

**Entry condition**: All 3 gates pass (Functional, Intent, Security)

**What happens**: Delivery confirmation sent to user

**Blocked if**: Any gate fails

### VERIFY → BUILD (Loop)

**Entry condition**: Any gate fails, and loop count < 3

**What happens**: Execution pool re-engages with specific failure context

**Blocked if**: Loop count >= 3

### VERIFY → PLAN (Hard Reset)

**Entry condition**: All 3 gates fail after 3 loops

**What happens**: Full context capture → reset to PLAN with failure context loaded

## State Persistence

```typescript
// .shark/workflow.json
{
  "version": "1.0",
  "workflowId": "wf_20260404_143052",
  "projectDirectory": "/home/user/my-project",
  "currentPhase": "VERIFY",
  "loopCount": 2,
  "createdAt": 1743773452000,
  "updatedAt": 1743774621000,
  "phases": {
    "PLAN": { "status": "completed", "enteredAt": 1743773452000, "exitedAt": 1743773498000 },
    "BUILD": { "status": "completed", "enteredAt": 1743773498000, "exitedAt": 1743773981000 },
    "TEST": { "status": "completed", "enteredAt": 1743773981000, "exitedAt": 1743774215000 },
    "VERIFY": { "status": "in_progress", "enteredAt": 1743774215000, "exitedAt": null, "gateResults": { "functional": "pass", "intent": "fail", "security": "pass" } }
  },
  "claims": [
    { "id": "claim-001", "description": "JWT authentication", "testFile": "tests/auth.test.ts", "status": "pending" },
    { "id": "claim-002", "description": "Rate limiting", "testFile": "tests/rate-limit.test.ts", "status": "fail" }
  ],
  "manifest": ["src/auth/jwt.ts", "src/auth/middleware.ts", "src/config/rate-limit.ts"],
  "gates": {
    "functional": { "stage1": "pass", "stage2": "pass" },
    "intent": { "passed": 1, "failed": 1, "total": 2 },
    "security": { "critical": 0, "high": 0, "medium": 2 }
  }
}
```

## Loop Mechanics

- Each BUILD → TEST → VERIFY cycle increments `loopCount`
- At loop count 3 with a failed VERIFY: **hard reset**
- Hard reset: captures full failure context, writes to `.shark/failure-context/`, resets to PLAN
- The captured context is pre-loaded into the architect's context window on PLAN re-entry

## Critical Rule

**The state machine is the source of truth. The agent cannot self-report phase.**

The `phaseGateHook` checks the persisted `.shark/workflow.json` on every tool call. If the phase doesn't permit the action, the tool call is blocked with a clear error message telling the agent what phase it is in and what actions are available.

```typescript
// Phase-gated actions
const PHASE_ACTIONS: Record<string, string[]> = {
  PLAN:    ['read_file', 'write_file:plan', 'terminal:read-only', 'shark_recall', 'extract_claims'],
  BUILD:   ['read_file', 'write_file:src', 'write_file:test', 'terminal:build', 'update_manifest', 'shark_remember'],
  TEST:    ['read_file', 'terminal:test', 'run_tests', 'test_runner'],
  VERIFY:  ['read_file', 'terminal:read-only', 'run_verification', 'guardian_scan', 'capture_context'],
  SHIP:    ['read_file', 'terminal:read-only', 'deliver'],
};
```
