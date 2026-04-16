# swarm_plan

**Type**: Swarm tool
**Plugin**: Spider Agent
**Purpose**: Display the current execution plan

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `format?` |
| Returns | `{ plan: string | object }` |
| Errors | No plan found |

---

## Purpose

The `swarm_plan` tool displays the current execution plan in either markdown or JSON format.

---

## Arguments

### `format` (enum) — Optional

One of: `markdown`, `json`. Default: `markdown`.

---

## Returns

### Markdown Format

```markdown
# Plan

## Phase 1: Discovery
- [x] 1.1: Explore codebase structure
- [x] 1.2: Identify entry points

## Phase 2: Implementation
- [ ] 2.1: Implement feature X
- [ ] 2.2: Add tests
```

### JSON Format

```json
{
  "phases": [
    {
      "number": 1,
      "name": "Discovery",
      "tasks": [
        { "id": "1.1", "name": "Explore codebase", "status": "complete" }
      ]
    }
  ]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Any agent** | Understands current plan |
| **Architect** | Creates/updates plan |

---

## Usage Example

```
/swarm_plan
```
Markdown format.

```
/swarm_plan format=json
```
JSON format.

---

## Related Tools

- `swarm_status` — Current swarm state
- `save_plan` — Persist plan
- `update_task_status` — Update tasks
