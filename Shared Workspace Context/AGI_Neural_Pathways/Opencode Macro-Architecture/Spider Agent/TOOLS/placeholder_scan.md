# placeholder_scan

**Type**: QA tool
**Plugin**: Spider Agent
**Purpose**: Detect placeholder code (TODO, FIXME, HACK, placeholder implementations)

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `severity?`, `files?` |
| Returns | `{ placeholders: [], severity_summary }` |
| Errors | None |

---

## Purpose

The `placeholder_scan` tool finds placeholder code that should be replaced before shipping:
- `TODO` — Incomplete implementation
- `FIXME` — Known bug
- `HACK` — Temporary workaround
- `XXX` — Warning
- Stub implementations (empty functions returning null/0)

---

## Arguments

### `severity` (enum) — Optional

Filter: `critical`, `high`, `medium`, `low`.

### `files` (string[]) — Optional

Files to scan. Default: entire project.

---

## Returns

```typescript
{
  placeholders: {
    path: string,
    line: number,
    type: 'TODO' | 'FIXME' | 'HACK' | 'XXX' | 'STUB',
    content: string,
    severity: 'critical' | 'high' | 'medium' | 'low'
  }[],
  severity_summary: { critical: number, high: number, medium: number, low: number }
}
```

---

## Severity Guidelines

| Type | Default Severity |
|------|-----------------|
| `FIXME` | High |
| `HACK` | Medium |
| `TODO` | Medium |
| `XXX` | Low |
| `STUB` | High |

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Pre-release check |
| **QA Gate** | No critical/high placeholders for release |

---

## Usage Example

```
/placeholder_scan
```

```
/placeholder_scan severity=high
```

---

## Related Tools

- `lint` — Code quality
- `syntax_check` — Syntax validation
- `doc_scan` — Documentation coverage
