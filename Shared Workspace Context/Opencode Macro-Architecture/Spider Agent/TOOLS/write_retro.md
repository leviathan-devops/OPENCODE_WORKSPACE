# write_retro

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Document lessons learned from a task or phase

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `context`, `lessons`, `phase?`, `task_id?` |
| Returns | `{ success, path, retroId }` |
| Errors | Write failure |

---

## Purpose

The `write_retro` tool documents retrospective insights after completing a task or phase. These retrospectives are stored in the knowledge base and injected into future sessions as relevant context.

This supports the Spider Agent's learning mechanism — lessons from previous work inform future planning.

---

## Arguments

### `context` (string) — **Required**

Brief description of what was done.

### `lessons` (string[]) — **Required**

Array of lessons learned.

### `phase` (number) — Optional

Phase number this retro belongs to.

### `task_id` (string) — Optional

Task ID this retro belongs to.

---

## Returns

```typescript
{
  success: boolean,
  path: string,
  retroId: string
}
```

---

## Knowledge Entry Format

```json
{
  "type": "lesson",
  "context": "Refactored authentication module",
  "lessons": [
    "Breaking up large modules reduces complexity",
    "Tests should cover edge cases first"
  ],
  "phase": 2,
  "taskId": "2.3",
  "timestamp": "2026-04-03T12:00:00Z"
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Writes retros after phase completion |
| **Coder** | Writes retros after difficult implementations |
| **Reviewer** | Writes retros on review patterns found |

---

## Usage Example

```
/write_retro context="Completed auth module refactor" lessons=["Dependency injection improves testability", "Interface segregation reduces coupling"] phase=2 task_id=2.1
```

---

## Related Tools

- `phase_complete` — Marks phase done with retro
- `knowledgeAdd` — Adds to knowledge store
- `knowledgeRecall` — Retrieves relevant lessons
