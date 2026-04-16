# pre_check_batch

**Type**: QA tool
**Plugin**: Spider Agent
**Purpose**: Run multiple QA checks in a single batch

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `checks?`, `files?` |
| Returns | `{ results: [], summary, passed }` |
| Errors | None |

---

## Purpose

The `pre_check_batch` tool runs multiple QA checks at once for efficiency. It combines syntax_check, lint, and other fast checks.

---

## Arguments

### `checks` (string[]) — Optional

Checks to run. Default: `["syntax", "lint"]`.

### `files` (string[]) — Optional

Files to check. Default: changed files.

---

## Returns

```typescript
{
  results: {
    check: string,
    passed: boolean,
    output?: string,
    error?: string
  }[],
  summary: {
    total: number,
    passed: number,
    failed: number
  },
  passed: boolean
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Coder** | Pre-commit self-check |
| **QA Gate** | TIER 0 batch |

---

## Usage Example

```
/pre_check_batch checks=["syntax", "lint", "secretscan"]
```

---

## Related Tools

- `syntax_check` — Single check
- `lint` — Single check
- `check_gate_status` — Gate status
