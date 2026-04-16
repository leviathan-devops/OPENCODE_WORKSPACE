# declare_done

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Mark a task as complete and clear scope

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `task_id`, `summary?` |
| Returns | `{ success, taskId }` |
| Errors | Task not found |

---

## Purpose

The `declare_done` tool marks a task as complete and clears the coder's declared scope. It's the inverse of `declare_scope` — called when work is finished.

---

## Arguments

### `task_id` (string) — **Required**

Task ID to mark complete.

### `summary` (string) — Optional

Brief summary of what was done.

---

## Returns

```typescript
{
  success: boolean,
  taskId: string
}
```

---

## Behavior

1. Updates task status to `complete` in plan
2. Clears `declaredCoderScope` from session
3. Updates plan.md checkbox

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Coder** | Marks own task complete |
| **Architect** | May declare done for coder |

---

## Usage Example

```
/declare_done task_id="2.1" summary="Implemented authentication module"
```

---

## Related Tools

- `declare_scope` — Declare scope
- `update_task_status` — Update status
- `completion_verify` — Verify completion
