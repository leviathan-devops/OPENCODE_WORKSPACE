# syntax_check

**Type**: QA tool
**Plugin**: Spider Agent
**Purpose**: Fast syntax validation without full linting

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `files?` |
| Returns | `{ valid: boolean, errors: [], filesChecked: number }` |
| Errors | Parse errors |

---

## Purpose

The `syntax_check` tool performs fast syntax validation on files. Unlike `lint`, it doesn't check code quality or style — only whether the code is syntactically valid.

This is used for TIER 0 QA gate — the fastest possible check before more expensive tests run.

---

## Arguments

### `files` (string[]) — Optional

Files to check. If not provided, checks project default.

---

## Returns

```typescript
{
  valid: boolean,
  errors: {
    path: string,
    line: number,
    column: number,
    message: string
  }[],
  filesChecked: number
}
```

---

## Behavior

Uses language-specific parsers:
- JavaScript/TypeScript: Babel parser
- Python: ast.parse
- Rust: syn (rustc crates)
- Go: go/parser

Stops at first error by default.

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Coder** | Self-check before marking done |
| **QA Gate** | TIER 0 - fastest check |

---

## Usage Example

```
/syntax_check files=["src/index.ts", "src/utils.ts"]
```

---

## Related Tools

- `lint` — Full linting with style checks
- `build_check` — Verify build succeeds
- `test_runner` — Run tests
