# brainstorm-gate

**Type**: Tool Before Hook
**Hook Key**: `toolBefore`
**Plugin**: Spider Agent
**Purpose**: Enforce Phase 0 (brainstorm) completion before Phase 1 (implementation)

---

## Hook Signature

```typescript
type BrainstormGateHook = (input: ToolInput) => Promise<void>;
```

---

## Trigger Conditions

Fires when:
- Tool name is `architect` AND
- Task being delegated involves implementation

This gate ensures that implementation doesn't start until Phase 0 (exploration, brainstorming) is complete.

---

## Validation

### 1. Phase Check

```typescript
// If current phase is 0 (brainstorm),
// block unless all brainstorm tasks are complete
if (currentPhase === 0) {
  const brainstormComplete = checkPhase0Completion();
  if (!brainstormComplete) {
    throw new BrainstormGateError('Complete Phase 0 before implementation');
  }
}
```

### 2. Evidence Check

```typescript
// Phase 0 must have generated:
// - Initial codebase understanding
// - Key decisions documented
// - Risks identified
const phase0Evidence = readPhase0Evidence();
if (!phase0Evidence.isComplete) {
  throw new BrainstormGateError('Phase 0 evidence incomplete');
}
```

---

## Error Message

```
Brainstorm gate: Phase 0 (brainstorm) must be complete before implementation.
Complete: exploration, decision log, risk identification.
Remaining: [list of incomplete items]
```

---

## Behavior

- **THROWS to block** — prevents implementation before planning
- **Only fires for architect delegations** during Phase 0
- **Silent pass** — passes through when Phase 0 complete

---

## State Mutations

| Read | Write | Effect |
|------|-------|--------|
| `plan.json` | None | Phase status |
| `.swarm/evidence/phase0/*.json` | None | Phase 0 completion |

---

## Related Hooks

- `delegation-gate` — General delegation validation
- `phase_complete` — Marks phase done
- `evidence_check` — Verifies phase evidence
