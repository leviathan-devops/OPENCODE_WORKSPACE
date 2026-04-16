# gitingest

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Ingest and analyze git history for patterns

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `path?`, `since?`, `max_commits?` |
| Returns | `{ commits, authors, file_stats, patterns }` |
| Errors | Not a git repo |

---

## Purpose

The `gitingest` tool analyzes git history to extract patterns:
- Commit frequency and authorship
- File change patterns
- Bug fix patterns (commit message analysis)

---

## Arguments

### `path` (string) — Optional

Path to analyze. Default: entire repo.

### `since` (string) — Optional

Start date (ISO format or relative: "2 weeks ago").

### `max_commits` (number) — Optional

Max commits to analyze. Default: 1000.

---

## Returns

```typescript
{
  commits: {
    sha: string,
    message: string,
    author: string,
    date: string,
    files_changed: number
  }[],
  authors: { name: string, commits: number, lines_added: number }[],
  file_stats: { path: string, changes: number, authors: string[] }[],
  patterns: {
    bug_fixes: number,
    refactors: number,
    features: number
  }
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Explorer** | Analyzes project history |
| **Critic** | Identifies churn patterns |
| **Architect** | Understands project evolution |

---

## Usage Example

```
/gitingest since="2026-01-01" max_commits=500
```

---

## Related Tools

- `co_change_analyzer` — Coupling analysis
- `diff` — Current changes
- `imports` — Dependency analysis
