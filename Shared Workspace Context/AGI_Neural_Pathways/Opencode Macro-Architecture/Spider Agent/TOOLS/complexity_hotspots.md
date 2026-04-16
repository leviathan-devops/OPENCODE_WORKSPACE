# complexity_hotspots

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Identify areas of high complexity in the codebase

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | None |
| Returns | `{ hotspots: { path, complexity, functions: [] }[], summary }` |
| Errors | Analysis failure |

---

## Purpose

The `complexity_hotspots` tool analyzes the codebase to identify files and functions with high cyclomatic complexity. These are areas that are difficult to test, understand, and modify safely.

The explorer agent calls this during the discovery phase to focus the architect's attention on areas needing refactoring or careful review.

---

## Returns

```typescript
{
  hotspots: {
    path: string,
    complexity: number,
    line: number,
    function: string,
    reason: string
  }[],
  summary: {
    totalFiles: number,
    highComplexityFiles: number,
    avgComplexity: number
  }
}
```

---

## Complexity Thresholds

| Complexity | Rating | Action |
|------------|--------|--------|
| 1-10 | Low | Normal |
| 11-20 | Medium | Consider refactoring |
| 21-50 | High | Should refactor |
| 51+ | Very High | Must refactor |

---

## Behavior

1. **AST Analysis**
   - Parses source files into AST
   - Calculates cyclomatic complexity per function
   - Tracks nesting depth, parameters, return paths

2. **Complexity Calculation**
   ```
   Complexity = edges - nodes + 2
   or equivalently:
   Complexity = decision points + 1
   ```

3. **Hotspot Identification**
   - Sorts by complexity descending
   - Returns top 20 hotspots
   - Groups by file

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Explorer** | Primary caller — runs during discovery |
| **Architect** | Reviews hotspots for planning |
| **Reviewer** | Uses hotspots to focus review |

---

## Usage Example

```
/complexity_hotspots
```

---

## Related Tools

- `detect_domains` — Identify domain boundaries
- `symbols` — Extract code symbols
- `extract_code_blocks` — Get code context
