# imports

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Analyze import relationships in the codebase

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `path?`, `depth?` |
| Returns | `{ imports: [], exports: [], coupling }` |
| Errors | Parse failure |

---

## Purpose

The `imports` tool analyzes import and export relationships to understand module coupling. It helps identify:
- Circular dependencies
- Unintended coupling across domains
- Missing or dead exports

---

## Arguments

### `path` (string) — Optional

Path to analyze. Default: entire project.

### `depth` (number) — Optional

Max traversal depth. Default: 3.

---

## Returns

```typescript
{
  imports: {
    file: string,
    imported: string[],
    from: string[]
  }[],
  exports: {
    file: string,
    exported: string[]
  }[],
  coupling: {
    score: number,
    circularDeps: string[][]
  }
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Explorer** | Analyzes module structure |
| **Architect** | Identifies coupling issues |
| **Critic** | Flags circular dependencies |

---

## Usage Example

```
/imports path="src/domain"
```

---

## Related Tools

- `detect_domains` — Domain boundary detection
- `symbols` — Export analysis
- `co_change_analyzer` — Historical coupling
