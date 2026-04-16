# co_change_analyzer

**Type**: Analysis tool
**Plugin**: Spider Agent
**Purpose**: Detect files that should change together based on historical patterns

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `path` |
| Returns | `{ co_changes: [], uncoupled_standalone: [] }` |
| Errors | Git history not available |

---

## Purpose

The `co_change_analyzer` tool analyzes git history to detect files that historically change together. This helps identify:
- Hidden coupling not visible in code
- Files that should be refactored together
- Unintended coupling across domains

---

## Arguments

### `path` (string) — **Required**

Path to analyze (file or directory).

---

## Returns

```typescript
{
  co_changes: {
    path: string,
    commitCount: number,
    avgTimeBetween: number,
    reason: string
  }[],
  uncoupled_standalone: string[]
}
```

---

## Algorithm

1. **Commit History Analysis**
   - Find all commits affecting `path`
   - Find all other files changed in same commits
   - Count co-occurrence frequency

2. **Threshold Detection**
   - Files changed together >30% of time = coupled
   - High coupling across domain boundaries = architectural smell

3. **Output**
   - Sorted by coupling strength
   - Includes reason (e.g., "Changed together in 8/20 commits")

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Uses for refactoring planning |
| **Critic** | Flags unintended cross-domain coupling |

---

## Usage Example

```
/co_change_analyzer path="src/auth"
```

---

## Related Tools

- `detect_domains` — Identify domain boundaries
- `imports` — Analyze import coupling
- `diff` — Show file changes
