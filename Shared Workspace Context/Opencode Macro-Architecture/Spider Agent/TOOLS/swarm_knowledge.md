# swarm_knowledge

**Type**: Swarm tool
**Plugin**: Spider Agent
**Purpose**: Query the knowledge base

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `query`, `type?` |
| Returns | `{ entries: [] }` |
| Errors | None |

---

## Purpose

The `swarm_knowledge` tool queries the persistent knowledge store. It's a convenience wrapper around `knowledgeRecall` with swarm-specific formatting.

---

## Arguments

### `query` (string) — **Required**

Search query.

### `type` (enum) — Optional

Filter by type: `decision`, `pattern`, `context`, `lesson`.

---

## Returns

```typescript
{
  entries: {
    id: string,
    type: string,
    content: string,
    tags: string[],
    timestamp: string,
    relevance: number
  }[]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Any agent** | Queries knowledge |
| **system-enhancer` | Auto-injects knowledge |

---

## Usage Example

```
/swarm_knowledge query="authentication"
```

---

## Related Tools

- `knowledgeRecall` — Core retrieval
- `knowledgeAdd` — Add entries
