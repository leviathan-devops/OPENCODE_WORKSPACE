# write_drift_evidence

**Type**: Coordination tool
**Plugin**: Spider Agent
**Purpose**: Document that decision drift was analyzed and is intentional/acceptable

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `drift_type`, `original`, `actual`, `justification` |
| Returns | `{ success, path, driftId }` |
| Errors | Write failure |

---

## Purpose

The `write_drift_evidence` tool documents when implementation diverged from the original plan. This is NOT a failure — sometimes drift is necessary. The important thing is that it was intentional and reviewed.

Drift evidence is stored and flagged by `system-enhancer` hook to warn future agents.

---

## Arguments

### `drift_type` (enum) — **Required**

One of: `scope`, `technology`, `architecture`, `api`, `other`

### `original` (string) — **Required**

What was originally planned.

### `actual` (string) — **Required**

What was actually done.

### `justification` (string) — **Required**

Why the drift was necessary/acceptable.

---

## Returns

```typescript
{
  success: boolean,
  path: string,
  driftId: string
}
```

---

## Evidence File Format

```json
{
  "id": "drift-1712150400000",
  "type": "technology",
  "original": "Use Redux for state management",
  "actual": "Used Zustand instead",
  "justification": "Redux boilerplate excessive for this use case; Zustand provides same functionality with 1/3 the code",
  "timestamp": "2026-04-03T12:00:00Z",
  "approvedBy": "architect"
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Documents intentional drift |
| **system-enhancer** | Flags drift in future sessions |
| **Reviewer** | Reviews drift during review |

---

## Usage Example

```
/write_drift_evidence drift_type=technology original="Use PostgreSQL" actual="Used SQLite for simplicity" justification="Development environment, production will use PostgreSQL"
```

---

## Related Tools

- `phase_complete` — May generate drift evidence
- `system-enhancer` — Injects drift warnings
- `evidence_check` — Verifies drift was documented
