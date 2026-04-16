# knowledgeRemove

**Type**: Knowledge tool
**Plugin**: Spider Agent
**Purpose**: Remove an entry from the knowledge store

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `id`, `reason?` |
| Returns | `{ success, id }` |
| Errors | Entry not found |

---

## Purpose

The `knowledgeRemove` tool deletes a knowledge entry. Used when:
- Entry is outdated
- Entry was incorrectly added
- Knowledge was superseded by better understanding

---

## Arguments

### `id` (string) — **Required**

Knowledge entry ID to remove.

### `reason` (string) — Optional

Why the entry is being removed.

---

## Returns

```typescript
{
  success: boolean,
  id: string
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Removes outdated decisions |
| **knowledgeRecall** | Retrieves entries before removal |

---

## Usage Example

```
/knowledgeRemove id="decision-1712150400000" reason="Superseded by ADR-005"
```

---

## Related Tools

- `knowledgeAdd` — Add entries
- `knowledgeRecall` — Query entries
