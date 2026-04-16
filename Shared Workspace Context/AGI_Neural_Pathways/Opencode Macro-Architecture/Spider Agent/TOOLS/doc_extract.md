# doc_extract

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Extract documentation from code (JSDoc, docstrings)

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `path?` |
| Returns | `{ docs: [] }` |
| Errors | None |

---

## Purpose

The `doc_extract` tool extracts documentation comments from code files. It parses JSDoc, docstrings, and other documentation formats.

---

## Arguments

### `path` (string) — Optional

File or directory to extract from.

---

## Returns

```typescript
{
  docs: {
    path: string,
    symbol: string,
    doc: string,
    line: number
  }[]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Check documentation |
| **doc_scan` | Coverage measurement |

---

## Usage Example

```
/doc_extract path="src/auth"
```

---

## Related Tools

- `doc_scan` — Coverage check
- `symbols` — List documented symbols
