# knowledgeRecall

**Type**: Knowledge tool
**Plugin**: Spider Agent
**Purpose**: Retrieve relevant knowledge from the persistent store

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `query`, `type?`, `limit?` |
| Returns | `{ entries: [], count }` |
| Errors | None (empty result on no match) |

---

## Purpose

The `knowledgeRecall` tool retrieves entries from the Spider Agent's knowledge store. It supports semantic search (via content matching) and filtering by type.

This enables the Spider Agent to remember past decisions, patterns, and lessons across sessions.

---

## Arguments

### `query` (string) — **Required**

Search query.

### `type` (enum) — Optional

Filter by type: `decision`, `pattern`, `context`, `lesson`

### `limit` (number) — Optional

Max entries to return. Default: 5.

---

## Returns

```typescript
{
  entries: {
    id: string,
    type: string,
    content: string,
    tags: string[],
    timestamp: string
  }[],
  count: number
}
```

---

## Search Behavior

1. **Content Matching**
   - Searches content field for query substring
   - Case-insensitive
   - Returns relevance-sorted results

2. **Type Filtering**
   - If `type` provided, filters results
   - Multiple types not supported (use multiple calls)

3. **Limiting**
   - Default 5 entries
   - Sort by timestamp descending (newest first)

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Retrieves decisions during planning |
| **system-enhancer** (hook) | Auto-injects relevant knowledge into system prompt |
| **knowledgeAdd** | Adds new entries |

---

## Usage Example

```
/knowledgeRecall query="database decisions"
```

```
/knowledgeRecall query="authentication patterns" type=pattern limit=3
```

---

## Related Tools

- `knowledgeAdd` — Add new knowledge
- `knowledgeRemove` — Delete knowledge
- `system-enhancer` (hook) — Auto-injects knowledge
