# INFRASTRUCTURE BUILD PLAN - V2.1.x

**Created**: Mar 26 2026
**Purpose**: Pre-build all infrastructure systems before GLM engineer deployment

---

## EXECUTION SEQUENCE

| Phase | System | Time | Status |
|-------|--------|------|--------|
| 1 | Nemotron Event-Driven Service | 2h | IN_PROGRESS |
| 2 | Anti-Hallucination Validator | 4h | PENDING |
| 3 | Surgical Debugging Protocol | 3h | PENDING |
| 4 | Cross-Module Integration Tests | 2h | PENDING |
| 5 | UI Glitch Fix | 1h | PENDING |

---

## PHASE 1: NEMOTRON EVENT-DRIVEN SERVICE

### Objective
Convert Nemotron Bridge from polling-based library to event-driven service with auto-ingestion hooks.

### Files to Create/Modify
1. `src/nemotron-bridge.ts` - Add EventEmitter pattern
2. `src/service.ts` - Singleton service wrapper
3. `src/hooks.ts` - Auto-connect hooks for opencode-ultra

### Event Types
- `agent-output` → Emitted when any agent produces output
- `orchestrator-request` → Emitted when orchestrator needs context
- `context-retrieved` → Emitted after context fetch
- `compression-complete` → Emitted after message compression
- `override-triggered` → Emitted on "more context" request

### Implementation Pattern
```typescript
import { EventEmitter } from 'events';

export class NemotronService extends EventEmitter {
  private static instance: NemotronService;
  private bridge: NemotronBridge;
  
  static getInstance(): NemotronService;
  start(): void;
  stop(): void;
  ingestAgentOutput(agentId: string, output: string): Promise<CompactedMessage>;
  requestContext(size: number): Promise<string>;
}
```

### Tests Required
- [ ] Event emission on message receipt
- [ ] 5 concurrent agents → verify compression + routing
- [ ] 100 rapid messages → no dropped events
- [ ] Override request → 24-72k context returned

---

## PHASE 2: ANTI-HALLUCINATION VALIDATOR

### Objective
Build mechanical evidence validation layer that detects theatrical code and fake outputs.

### Files to Create
1. `src/anti-hallucination/evidence-checker.ts`
2. `src/anti-hallucination/mechanical-validator.ts`
3. `src/anti-hallucination/validator-hook.ts`
4. `src/anti-hallucination/patterns.ts`

### Evidence Types
- PLAN: File exists + has testable claims
- BUILD: Code compiles + types valid
- TEST: Actual test output (not "tests pass")
- VERIFY: Clean environment results
- SHIP: Fresh install + compile

### Detection Patterns
- Mock results without real execution
- Placeholder code (TODO, FIXME, stubs)
- Code that is never imported/called
- Tests that always pass regardless of code
- Documentation for non-existent features

### Tests Required
- [ ] Feed theatrical code → must detect
- [ ] Feed valid code → must pass
- [ ] Feed partial evidence → must flag gaps

---

## PHASE 3: SURGICAL DEBUGGING PROTOCOL

### Objective
Implement on-demand debug agent injection for stuck/failing engineers.

### Files to Create
1. `src/surgical-debug/injector.ts`
2. `src/surgical-debug/debug-agents.ts`
3. `src/surgical-debug/ultra-connector.ts`
4. `src/surgical-debug/stagnation-detector.ts`

### Trigger Conditions
- Build failure > 30 minutes
- Test failure loop > 3 iterations
- No progress > 1 hour
- Explicit engineer request

### Debug Agent Types
- FreshGLM: New instance with clean context
- SpecializedDebugger: Pre-loaded error patterns
- DeepSeekChat: Alternative model opinion

### Tests Required
- [ ] Simulate stuck engineer → trigger injection
- [ ] Verify debug agent receives context
- [ ] Confirm fix merges back correctly

---

## PHASE 4: CROSS-MODULE INTEGRATION TESTS

### Objective
Validate all systems work together correctly.

### Test Scenarios
1. Nemotron → Anti-Hallucination → Block theatrical code
2. Engineer output → Nemotron ingestion → Orchestrator receives compressed
3. Stagnation detection → Surgical debug injection → Fix applied
4. Full workflow: PLAN → BUILD → TEST → VERIFY → SHIP

### Tests Required
- [ ] All 4 scenarios pass
- [ ] End-to-end validation with 3 test engineers

---

## PHASE 5: UI GLITCH FIX

### Objective
Fix terminal buffer corruption during Ralph Loop iterations.

### Root Cause
Multiple concurrent output streams without synchronization + ANSI escape sequences leaking.

### Fix Pattern
```typescript
// Add between loop iterations:
process.stdout.write('\x1b[?25h'); // Show cursor
process.stdout.write('\x1b[0m');   // Reset attributes
process.stdout.write('\x1b[J');    // Clear below

// Sanitize agent output:
const sanitizeOutput = (output: string) => {
  return output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
};
```

### Workaround
Use `spawn_agent` instead of `ralph_loop` until patched.

---

## BUILD LOG VERSION TRACKING

| Version | Phase | Description |
|---------|-------|-------------|
| v2.1.0 | - | Infrastructure plan created |
| v2.1.1 | 1 | Nemotron EventEmitter added |
| v2.1.2 | 1 | Nemotron Service wrapper |
| v2.1.3 | 1 | Auto-ingestion hooks |
| v2.1.4 | 2 | Evidence checker module |
| v2.1.5 | 2 | Mechanical validator |
| v2.1.6 | 2 | Validator hook integration |
| v2.1.7 | 3 | Stagnation detector |
| v2.1.8 | 3 | Debug agent injector |
| v2.1.9 | 3 | Ultra connector |
| v2.1.10 | 4 | Integration test suite |
| v2.1.11 | 5 | UI glitch fix |

---

## SHARK CLI ALIGNMENT

Based on Shark CLI Context analysis, these systems must align with:

### Guardian Module (from SHARK-MASTER-PROMPT.md)
- Zone classification: WORKSPACE, SANDBOX, DEVELOPMENT, SYSTEM, PERSONAL, CONFIG
- Protected paths: /bin, /sbin, /usr, /etc, ~/.ssh, ~/.aws
- Check flow: resolve → classify → check → log

### Workflow State Machine
- 5-step: PLAN → BUILD → TEST → VERIFY → SHIP
- Evidence requirements per step
- 3-failure reset mechanism

### AutoDebug Module
- 47+ error patterns
- Pattern → auto-fix mapping
- Docker, npm, TypeScript patterns

### Anti-Hallucination Detection
- Forbidden behaviors list
- Required evidence per workflow step
- Mechanical validation (no AI inference)

---

**STATUS**: Ready to execute Phase 1
