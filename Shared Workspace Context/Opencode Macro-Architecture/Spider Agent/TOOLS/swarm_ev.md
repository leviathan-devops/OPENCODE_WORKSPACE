# swarm_ev

**Type**: Swarm tool
**Plugin**: Spider Agent
**Purpose**: Display evidence summary for completed tasks

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `task_id?`, `phase?` |
| Returns | `{ evidence: [], completeness }` |
| Errors | None |

---

## Purpose

The `swarm_ev` tool shows evidence collected for tasks. Evidence is the QA proof that work was reviewed and tested.

---

## Arguments

### `task_id` (string) — Optional

Specific task to show evidence for.

### `phase` (number) — Optional

Show all evidence for a phase.

---

## Returns

```typescript
{
  evidence: {
    taskId: string,
    type: string,
    path: string,
    collectedAt: string,
    collectedBy: string
  }[],
  completeness: number,
  missingEvidence: {
    taskId: string,
    requiredTypes: string[]
  }[]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Collects evidence |
| **Architect** | Checks evidence before phase complete |
| **evidence_check` | Uses same evidence store |

---

## Usage Example

```
/swarm_ev
```
All evidence.

```
/swarm_ev phase=2
```
Evidence for phase 2.

---

## Related Tools

- `evidence_check` — Detailed evidence verification
- `swarm_status` — Overall state
- `swarm_plan` — Current plan
