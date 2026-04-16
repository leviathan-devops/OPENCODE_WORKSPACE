# doc_scan

**Type**: QA tool
**Plugin**: Spider Agent
**Purpose**: Check documentation coverage for code

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `threshold?`, `files?` |
| Returns | `{ coverage: number, undocumented: [], filesChecked: number }` |
| Errors | None |

---

## Purpose

The `doc_scan` tool measures documentation coverage. It checks for:
- JSDoc comments on functions/classes
- README files in directories
- API documentation

---

## Arguments

### `threshold` (number) — Optional

Minimum coverage percentage to pass. Default: 80.

### `files` (string[]) — Optional

Files to scan. Default: entire project.

---

## Returns

```typescript
{
  coverage: number,
  undocumented: {
    path: string,
    symbol: string,
    kind: string
  }[],
  filesChecked: number,
  passed: boolean
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Documentation review |
| **QA Gate** | Coverage must meet threshold |

---

## Usage Example

```
/doc_scan threshold=90
```

---

## Related Tools

- `placeholder_scan` — Find TODOs
- `lint` — Code quality
- `build_check` — Build verification
