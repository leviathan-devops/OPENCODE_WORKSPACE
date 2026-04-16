# symbols

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Extract code symbols (functions, classes, interfaces) from files

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `path`, `filter?` |
| Returns | `{ symbols: [], file, language }` |
| Errors | Parse failure |

---

## Purpose

The `symbols` tool extracts structural symbols from source files — functions, classes, interfaces, types. This helps understand the API surface of a module.

---

## Arguments

### `path` (string) — **Required**

File path to analyze.

### `filter` (string) — Optional

Filter by symbol type: `function`, `class`, `interface`, `type`.

---

## Returns

```typescript
{
  file: string,
  language: string,
  symbols: {
    name: string,
    kind: 'function' | 'class' | 'interface' | 'type' | 'method',
    line: number,
    visibility: 'public' | 'private' | 'protected',
    exports: string[]
  }[]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Explorer** | Maps codebase structure |
| **Reviewer** | Identifies public API |
| **Architect** | Defines module contracts |

---

## Usage Example

```
/symbols path="src/auth/index.ts"
```

---

## Related Tools

- `extract_code_blocks` — Get symbol implementations
- `imports` — Analyze dependencies
- `diff` — Detect contract changes
