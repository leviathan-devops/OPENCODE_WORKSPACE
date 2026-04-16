# update_task_status

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Update the status of individual tasks in the plan

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `task_id`, `status`, `message?` |
| Returns | `{ success, taskId, status, message }` |
| Errors | Invalid task_id format, task not found |

---

## Purpose

The `update_task_status` tool updates individual task statuses in the plan. It's called by agents after completing work on a specific task.

Task IDs follow a hierarchical format: `N.M` or `N.M.P` (phase.task or phase.task.subtask).

---

## Arguments

### `task_id` (string) — **Required**

Task identifier in regex: `^\d+\.\d+(\.\d+)*$`

Examples: `"1.1"`, `"2.3"`, `"3.1.2"`

### `status` (enum) — **Required**

One of: `in_progress`, `blocked`, `complete`

### `message` (string) — Optional

Optional status message or note.

---

## Returns

```typescript
{
  success: boolean,
  taskId: string,
  status: 'in_progress' | 'blocked' | 'complete',
  message?: string
}
```

---

## Behavior

1. **Task ID Validation**
   - Regex: `^\d+\.\d+(\.\d+)*$`
   - Validates task exists in plan.json

2. **Status Transition Validation**
   - Cannot update already-complete tasks
   - `in_progress` → `complete` is valid
   - `blocked` → any is valid

3. **Plan Update**
   - Updates task status in `plan.json`
   - Updates checkbox in `plan.md` (`- [ ]` → `- [x]`)

---

## Implementation Notes

Status transitions:
```
idle → in_progress (when delegation starts)
in_progress → complete (when done)
in_progress → blocked (when blocked)
blocked → in_progress (when unblocked)
complete → (terminal, cannot change)
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Updates task status after delegation |
| **Coder** | May update status to `blocked` if issues |
| **Reviewer** | Updates to `complete` after review |
| **test_engineer** | Updates to `complete` after tests pass |

---

## Usage Example

```
/update_task_status task_id="2.1" status="in_progress" message="Starting implementation"
```

```
/update_task_status task_id="2.1" status="complete" message="Implementation done, tests passing"
```

```
/update_task_status task_id="2.3" status="blocked" message="Waiting on API specs from SME"
```

---

## Related Tools

- `save_plan` — Saves entire plan
- `phase_complete` — Marks entire phase complete
- `evidence_check` — Verifies evidence for completed tasks
