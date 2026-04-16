# Hermes Agent v3.0 — Phase State Machine

## Overview

Hermes enforces a 6-phase workflow: Brainstorm → Plan → Build → Review → Debug → Complete

## Phase Definitions

| Phase | Description | Entry Condition | Exit Condition |
|-------|-------------|-----------------|----------------|
| `IDLE` | Initial state | Always | Task received |
| `BRAINSTORM` | Requirements gathering | From IDLE | Design approved |
| `PLAN` | Planning & spec | From BRAINSTORM | TDD spec written |
| `BUILD` | Implementation | From PLAN | Code complete |
| `REVIEW` | Code review | From BUILD | Approved or rejected |
| `DEBUG` | Fix issues | From REVIEW | Issues resolved |
| `COMPLETE` | Task done | From REVIEW or DEBUG | Task archived |

## State Transitions

```
         ┌──────────────────────────────────────────┐
         │                                          ▼
    ┌─────────┐    ┌────────────┐    ┌──────┐    ┌─────────┐    ┌─────────┐
    │  IDLE   │───▶│ BRAINSTORM │───▶│ PLAN │───▶│  BUILD  │───▶│ REVIEW  │
    └─────────┘    └────────────┘    └──────┘    └─────────┘    └────┬────┘
         ▲             │                                        │      │
         │             │                                        ▼      │
         │             │                                  ┌────────┐   │
         │             └──────────────────────────────────│ DEBUG  │   │
         │                                            └────────┬┘   │
         │                                                 │      │
         └─────────────────────────────────────────────────┘      ▼
                                                           ┌──────────┐
                                                           │ COMPLETE │
                                                           └──────────┘
```

## Transition Map

```typescript
const PHASE_TRANSITIONS = {
  IDLE: ['BRAINSTORM'],
  BRAINSTORM: ['PLAN'],
  PLAN: ['BUILD'],
  BUILD: ['REVIEW'],
  REVIEW: ['DEBUG', 'COMPLETE'],
  DEBUG: ['REVIEW', 'COMPLETE'],
  COMPLETE: ['IDLE']
};
```

## Valid Transitions

| From | To | Valid? |
|------|----|--------|
| IDLE | BRAINSTORM | ✅ |
| BRAINSTORM | PLAN | ✅ |
| BRAINSTORM | IDLE | ❌ (must complete) |
| PLAN | BUILD | ✅ |
| PLAN | BRAINSTORM | ❌ (can't go backward) |
| BUILD | REVIEW | ✅ |
| BUILD | PLAN | ❌ |
| REVIEW | DEBUG | ✅ (if issues found) |
| REVIEW | COMPLETE | ✅ (if approved) |
| DEBUG | REVIEW | ✅ (after fixes) |
| DEBUG | COMPLETE | ✅ |
| COMPLETE | IDLE | ✅ (for next task) |

## Phase Persistence

State is persisted to `~/.hermes/phase.json`:

```json
{
  "phase": "BUILD",
  "step": 3,
  "updated": "2026-04-14T20:30:00Z",
  "task": "implement login",
  "delegations": ["builder->reviewer"]
}
```

### Why Disk Persistence?

Module-level variables reset on hot-reload. Disk persistence ensures:
- Phase survives OpenCode restart
- Session can resume after crash
- Audit trail exists

## Phase Monitor Hook

**File:** `src/hooks/phase-monitor.ts`

Logs all phase transitions:

```typescript
export async function phaseMonitor(input: { phase: string; step: number }) {
  if (!isHermesAgent(input.agent)) return;
  
  log(`Phase: ${input.phase}, Step: ${input.step}`);
  
  // Persist to disk
  const phaseFile = join(getHermesDir(), 'phase.json');
  writeFileSync(phaseFile, JSON.stringify({
    phase: input.phase,
    step: input.step,
    updated: new Date().toISOString()
  }));
}
```

## Phase Transition Validation

```typescript
function canTransition(from: Phase, to: Phase): boolean {
  const validTargets = PHASE_TRANSITIONS[from];
  return validTargets?.includes(to) ?? false;
}
```

Illegal transitions are rejected with error message.

## Testing

Run state machine tests:

```bash
bun run TESTS/test-state-machine.ts
```

Expected output:
```
Phase transition tests:
✓ IDLE → BRAINSTORM: valid
✓ BRAINSTORM → PLAN: valid
✓ PLAN → BUILD: valid
✓ BUILD → REVIEW: valid
✓ REVIEW → DEBUG: valid
✓ REVIEW → COMPLETE: valid
✓ DEBUG → REVIEW: valid
✓ COMPLETE → IDLE: valid
✓ BRAINSTORM → BUILD: INVALID (correctly rejected)
✓ PLAN → BUILD: valid
... (all 9/12 valid transitions pass, illegal transitions rejected)
```
