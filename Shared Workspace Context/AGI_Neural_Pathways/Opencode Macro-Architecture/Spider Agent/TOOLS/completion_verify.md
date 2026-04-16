# completion_verify

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Verify a task is truly complete with all requirements met

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `task_id`, `checks?` |
| Returns | `{ verified: boolean, checks: [], gaps: [] }` |
| Errors | Task not found |

---

## Purpose

The `completion_verify` tool performs a final verification that a task is genuinely complete. It checks:
- Tests pass
- Lint passes
- Evidence exists
- No blocking issues

---

## Arguments

### `task_id` (string) — **Required**

Task ID to verify (e.g., "2.1").

### `checks` (string[]) — Optional

Specific checks to run. Default: all.

---

## Returns

```typescript
{
  verified: boolean,
  taskId: string,
  checks: {
    name: string,
    passed: boolean,
    details?: string
  }[],
  gaps: {
    check: string,
    issue: string
  }[]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Coder** | Self-verification before marking done |
| **Reviewer** | Final verification before sign-off |
| **evidence_check** | Part of completion verification |

---

## Usage Example

```
/completion_verify task_id="2.1"
```

---

## Related Tools

- `evidence_check` — Verify evidence exists
- `test_runner` — Run tests
- `lint` — Run linters
