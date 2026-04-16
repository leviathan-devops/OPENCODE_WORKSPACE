# detect_domains

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Identify domain boundaries and module dependencies

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | None |
| Returns | `{ domains: { name, path, dependencies: [], files: [] }[], coupling: number }` |
| Errors | Analysis failure |

---

## Purpose

The `detect_domains` tool analyzes the codebase structure to identify domain boundaries and coupling between modules. This helps the architect understand the natural architecture of the codebase.

High coupling between domains indicates areas that need architectural attention before making changes.

---

## Returns

```typescript
{
  domains: {
    name: string,
    path: string,
    dependencies: string[],
    files: string[],
    exports: number,
    imports: number
  }[],
  coupling: {
    score: number,
    tightCouples: { from: string, to: string }[]
  }
}
```

---

## Domain Detection Heuristics

1. **Directory Structure** — Top-level directories often represent domains
2. **Import Patterns** — Groups that import each other heavily are coupled
3. **Export Counts** — High exports with low imports = cohesive domain
4. **File Naming** — `types.ts`, `constants.ts` often indicate domain boundaries

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Explorer** | Primary caller — runs during discovery |
| **Architect** | Uses domain map for planning |
| **Critic** | Reviews domain structure for coupling issues |

---

## Usage Example

```
/detect_domains
```

---

## Related Tools

- `complexity_hotspots` — Identify complex areas
- `imports` — Analyze import relationships
- `symbols` — Extract domain exports
