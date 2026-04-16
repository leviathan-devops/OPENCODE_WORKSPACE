# suggest_patch

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Suggest code patches for issues found by linters or analyzers

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `issue`, `context` |
| Returns | `{ patch, confidence }` |
| Errors | Cannot generate patch |

---

## Purpose

The `suggest_patch` tool generates a code patch for an issue found by linting or analysis. It uses the LLM to understand the issue and generate an appropriate fix.

---

## Arguments

### `issue` (string) — **Required**

Issue description (lint error, warning, etc).

### `context` (string) — **Required**

Code context around the issue.

---

## Returns

```typescript
{
  patch: string,
  confidence: number,
  explanation: string
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Coder** | Fix issues found |
| **Reviewer` | Suggest fixes |

---

## Usage Example

```
/suggest_patch issue="Unused variable 'x' in line 42" context="function foo() { let x = 1; return 2; }"
```

---

## Related Tools

- `lint` — Find issues
- `syntax_check` — Validate fixes
