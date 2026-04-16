# retrieve_summary

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Get a summary of phase and task completion status

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `phase?` |
| Returns | `{ currentPhase, completedTasks, pendingTasks, summary }` |
| Errors | None |

---

## Purpose

The `retrieve_summary` tool reads the plan and generates a summary of completion status. It shows:
- Current phase
- Completed vs pending tasks
- Evidence status

---

## Arguments

### `phase` (number) — Optional

Specific phase to summarize. If not provided, returns overall summary.

---

## Returns

```typescript
{
  currentPhase: number,
  completedTasks: { id: string, name: string }[],
  pendingTasks: { id: string, name: string }[],
  phaseSummaries: {
    phase: number,
    verdict?: 'pass' | 'fail' | 'partial',
    completedTasks: number,
    totalTasks: number
  }[],
  summary: string
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Checks progress during execution |
| **Reviewer** | Verifies completion before sign-off |
| **evidence_check** | Called alongside retrieve_summary |

---

## Usage Example

```
/retrieve_summary
```
Overall summary.

```
/retrieve_summary phase=2
```
Summary for phase 2 only.

---

## Related Tools

- `evidence_check` — Detailed evidence verification
- `save_plan` — Saves plan state
- `phase_complete` — Marks phase done
