# extract_code_blocks

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Extract code blocks with context from source files

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `path`, `symbols?`, `context?` |
| Returns | `{ blocks: [], file }` |
| Errors | File not found |

---

## Purpose

The `extract_code_blocks` tool extracts specific functions/classes with surrounding context. Unlike `symbols` which lists declarations, this tool retrieves the actual implementation code.

---

## Arguments

### `path` (string) — **Required**

File path to extract from.

### `symbols` (string[]) — Optional

Specific symbol names to extract.

### `context` (number) — Optional

Lines of context before/after. Default: 3.

---

## Returns

```typescript
{
  file: string,
  blocks: {
    name: string,
    kind: string,
    line: number,
    code: string,
    context: { before: string[], after: string[] }
  }[]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Reviews implementation details |
| **Architect** | Reviews code structure |
| **Critic** | Examines specific implementations |

---

## Usage Example

```
/extract_code_blocks path="src/auth/login.ts" symbols=["authenticateUser"]
```

---

## Related Tools

- `symbols` — List available symbols
- `imports` — Analyze dependencies
- `diff` — Show changes
