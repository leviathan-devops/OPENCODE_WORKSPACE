# search

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Search for text patterns in codebase

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `query`, `path?`, `file_glob?` |
| Returns | `{ matches: [] }` |
| Errors | None |

---

## Purpose

The `search` tool performs regex search across the codebase. It's a convenient wrapper around ripgrep for finding patterns.

---

## Arguments

### `query` (string) — **Required**

Regex pattern to search for.

### `path` (string) — Optional

Path to search in. Default: entire project.

### `file_glob` (string) — Optional

File filter (e.g., `*.ts`).

---

## Returns

```typescript
{
  matches: {
    path: string,
    line: number,
    content: string,
    context: string[]
  }[],
  count: number
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Any agent** | Finding patterns |
| **Reviewer` | Finding specific code |

---

## Usage Example

```
/search query="TODO" file_glob="*.ts"
```

---

## Related Tools

- `symbols` — Find by symbol
- `imports` — Find dependencies
