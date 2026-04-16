# phase_complete

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Mark a phase as complete and generate retrospective evidence

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `phase_number`, `verdict`, `summary`, `lessons_learned?`, `blockers?` |
| Returns | `{ success, phase, summary }` |
| Errors | Invalid phase number, invalid verdict |

---

## Purpose

The `phase_complete` tool marks a phase as finished and generates retrospective evidence. It is the official mechanism for phase transitions in the Spider Agent workflow.

The architect calls this after verifying:
1. All tasks in the phase are complete
2. Evidence check passes (all required evidence exists)
3. The phase retrospective is ready to be documented

---

## Arguments

### `phase_number` (number) — **Required**

The phase number being completed (1, 2, 3, etc.).

### `verdict` (enum) — **Required**

One of: `pass`, `fail`, `partial`

### `summary` (string) — **Required**

High-level summary of what was accomplished in this phase.

### `lessons_learned` (string[]) — Optional

Array of lessons learned during this phase.

### `blockers` (string[]) — Optional

Array of blockers that occurred during this phase.

---

## Returns

```typescript
{
  success: boolean,
  phase: number,
  summary: string,
  verdict: 'pass' | 'fail' | 'partial'
}
```

---

## Behavior

1. **Verdict Validation**
   - `pass` — All tasks completed, all evidence present
   - `fail` — Phase failed (cannot proceed)
   - `partial` — Some tasks incomplete, but can proceed

2. **Evidence Generation**
   - Writes retrospective to `.swarm/evidence/retro-{phase}.json`
   - Records verdict, summary, lessons, blockers, timestamp

3. **Plan Update**
   - Updates `plan.json` to mark phase as complete
   - Sets current phase pointer to next phase

---

## Implementation Note

```typescript
// Evidence file: .swarm/evidence/retro-{phase}.json
interface PhaseRetro {
  phase: number;
  verdict: 'pass' | 'fail' | 'partial';
  summary: string;
  lessons_learned: string[];
  blockers: string[];
  completedAt: string;
  taskResults: { taskId: string; status: string }[];
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Primary caller — calls after verifying phase completion |
| **evidence_check** | Called before phase_complete to verify QA |
| **write_retro** | May be called manually instead of phase_complete |
| **Plan** | Phase status updated in plan.json |

---

## Usage Example

```
/phase_complete phase_number=2 verdict=pass summary="Successfully implemented core feature with full test coverage" lessons_learned=["TDD improves design", "Small PRs merge faster"] blockers=[]
```

---

## Related Tools

- `evidence_check` — Verify evidence before calling phase_complete
- `write_retro` — Alternative for writing retrospective only
- `update_task_status` — Update individual task statuses
