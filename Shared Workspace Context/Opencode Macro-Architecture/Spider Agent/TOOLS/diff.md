# diff

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Show git diff with contract change detection

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `base?`, `paths?` |
| Returns | `{ files, contractChanges, hasContractChanges, summary, astDiffs? }` |
| Context | Includes `ctx?: ToolContext` |

---

## Purpose

The `diff` tool shows changes between commits, with intelligent detection of API/interface contract changes. This helps the reviewer understand what changed and whether it might break consumers.

---

## Arguments

### `base` (string) — Optional

Base commit/ref. Default: `HEAD`

### `paths` (string[]) — Optional

Specific paths to diff.

---

## Returns

```typescript
{
  files: { path: string, additions: number, deletions: number }[],
  contractChanges: string[],
  hasContractChanges: boolean,
  summary: string,
  astDiffs?: ASTDiffResult[]
}
```

---

## Behavior

1. **Numstat**: `git diff --numstat` for line counts
2. **Diff**: `git diff -U3` for patch content
3. **Contract Detection**: Detects exported function/interface changes
4. **AST Diff**: Uses tree-sitter if available for structural diff

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Primary caller — reviews changes |
| **Architect** | Reviews contract changes |
| **QA Gate** | Contract changes may trigger review |

---

## Usage Example

```
/diff
```
All changes from HEAD.

```
/diff base="main" paths=["src/auth/"]
```
Changes in auth directory from main.

---

## Related Tools

- `co_change_analyzer` — Analyze coupling
- `complexity_hotspots` — Find complex areas changed
