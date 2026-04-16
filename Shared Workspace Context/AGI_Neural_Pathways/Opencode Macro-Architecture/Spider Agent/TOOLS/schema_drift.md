# schema_drift

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Detect changes to data schemas (database, API, config)

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `base?`, `type?` |
| Returns | `{ drifts: [], breaking: [] }` |
| Errors | No schema files found |

---

## Purpose

The `schema_drift` tool detects changes to schemas — database tables, API schemas, config schemas. Breaking changes are flagged for review.

---

## Arguments

### `base` (string) — Optional

Base commit/ref. Default: `HEAD~1`.

### `type` (enum) — Optional

Schema type: `database`, `api`, `config`. Default: all.

---

## Returns

```typescript
{
  drifts: {
    schema: string,
    changes: {
      type: 'add' | 'remove' | 'modify',
      field: string,
      before?: string,
      after?: string
    }[]
  }[],
  breaking: {
    schema: string,
    field: string,
    reason: string
  }[]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | API/DB change review |
| **QA Gate** | Breaking changes require sign-off |

---

## Usage Example

```
/schema_drift base="main" type=api
```

---

## Related Tools

- `diff` — General diff
- `sast_scan` — Security analysis
