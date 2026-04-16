# check_gate_status

**Type**: QA tool
**Plugin**: Spider Agent
**Purpose**: Check the status of QA gates for a task or phase

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `tier?`, `task_id?` |
| Returns | `{ tier, status, checks: [] }` |
| Errors | None |

---

## Purpose

The `check_gate_status` tool reports on QA gate readiness. It shows which checks have passed/failed for the current context.

---

## Arguments

### `tier` (number) — Optional

Specific tier to check (0-3). Default: all.

### `task_id` (string) — Optional

Task-specific gate check.

---

## Returns

```typescript
{
  tier: number,
  status: 'pass' | 'fail' | 'pending',
  checks: {
    name: string,
    status: 'pass' | 'fail' | 'pending',
    details?: string
  }[],
  canProceed: boolean
}
```

---

## Tier Definitions

| Tier | Checks | Blocking? |
|------|--------|-----------|
| 0 | syntax_check, lint | Yes |
| 1 | build_check, test_runner | Yes |
| 2 | secretscan, sast_scan | Yes |
| 3 | evidence_check, completion_verify | Yes |

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Checks before phase transition |
| **Reviewer** | Pre-review verification |
| **evidence_check` | Evidence verification |

---

## Usage Example

```
/check_gate_status tier=2
```

---

## Related Tools

- `evidence_check` — Verify evidence
- `test_runner` — Run tests
- `lint` — Run linters
