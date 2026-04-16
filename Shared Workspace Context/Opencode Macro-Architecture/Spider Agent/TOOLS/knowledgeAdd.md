# knowledgeAdd

**Type**: Knowledge tool
**Plugin**: Spider Agent
**Purpose**: Add an entry to the persistent knowledge store

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `type`, `content`, `tags?`, `phase?` |
| Returns | `{ success, id, path }` |
| Errors | Write failure, invalid type |

---

## Purpose

The `knowledgeAdd` tool adds entries to the Spider Agent's persistent knowledge store. Entries are stored in `.swarm/knowledge/` and retrieved by `knowledgeRecall` during future sessions.

Knowledge types:
- `decision` — Architectural decisions
- `pattern` — Reusable code patterns
- `context` — Project context
- `lesson` — Retrospective lessons

---

## Arguments

### `type` (enum) — **Required**

One of: `decision`, `pattern`, `context`, `lesson`

### `content` (string) — **Required**

The knowledge content.

### `tags` (string[]) — Optional

Tags for categorization.

### `phase` (string) — Optional

Phase this knowledge relates to.

---

## Returns

```typescript
{
  success: boolean,
  id: string,
  path: string
}
```

---

## File Format

```json
{
  "id": "decision-1712150400000",
  "type": "decision",
  "content": "Use repository pattern for data access",
  "tags": ["architecture", "data-layer"],
  "phase": "1",
  "timestamp": "2026-04-03T12:00:00Z"
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Records architectural decisions |
| **Reviewer** | Records patterns found |
| **knowledgeRecall** | Retrieves stored knowledge |

---

## Usage Example

```
/knowledgeAdd type=decision content="Chose PostgreSQL over MongoDB for transaction support" tags=["database", "architecture"]
```

---

## Related Tools

- `knowledgeRecall` — Retrieve knowledge
- `knowledgeRemove` — Delete knowledge
- `write_retro` — Write retrospective lessons
