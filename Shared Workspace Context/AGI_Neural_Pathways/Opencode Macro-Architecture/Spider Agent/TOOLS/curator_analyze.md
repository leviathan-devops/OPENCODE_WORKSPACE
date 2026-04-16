# curator_analyze

**Type**: Knowledge tool
**Plugin**: Spider Agent
**Purpose**: Analyze code to extract knowledge (patterns, decisions) for storage

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `path?` |
| Returns | `{ candidates: [] }` |
| Errors | Parse failure |

---

## Purpose

The `curator_analyze` tool analyzes code to identify potential knowledge entries:
- Design patterns used
- Architectural decisions evident in code
- Interesting implementation approaches

---

## Arguments

### `path` (string) — Optional

Path to analyze. Default: entire project.

---

## Returns

```typescript
{
  candidates: {
    type: 'pattern' | 'decision' | 'context',
    content: string,
    evidence: string,
    confidence: number
  }[]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Review patterns found |
| **knowledgeAdd` | Add selected candidates |

---

## Usage Example

```
/curator_analyze path="src/core"
```

---

## Related Tools

- `knowledgeAdd` — Store knowledge
- `symbols` — Analyze structure
