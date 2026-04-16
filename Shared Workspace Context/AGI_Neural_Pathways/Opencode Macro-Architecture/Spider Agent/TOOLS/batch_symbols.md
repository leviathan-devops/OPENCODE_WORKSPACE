# batch_symbols

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Extract symbols from multiple files at once

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `paths`, `filter?` |
| Returns | `{ files: [] }` |
| Errors | Parse failure |

---

## Purpose

The `batch_symbols` tool extracts symbols from multiple files in one call. More efficient than calling `symbols` repeatedly.

---

## Arguments

### `paths` (string[]) — **Required**

Array of file paths.

### `filter` (string) — Optional

Filter by symbol type.

---

## Returns

```typescript
{
  files: {
    path: string,
    language: string,
    symbols: Symbol[]
  }[]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Explorer** | Map multiple files |
| **Reviewer` | Review API surfaces |

---

## Usage Example

```
/batch_symbols paths=["src/index.ts", "src/auth/index.ts"]
```

---

## Related Tools

- `symbols` — Single file
- `extract_code_blocks` — Get implementations
