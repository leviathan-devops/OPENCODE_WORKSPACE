# /recall — Query 2nd-Brain

## Purpose
Retrieve past decisions, patterns, and learnings relevant to the current task.

## When to Use
- Before starting new work on a feature
- When encountering something you might have solved before
- During debugging — "have we seen this error?"
- During planning — "what did we decide about X?"

## Process

### Step 1: Query with Context
```
hermes_recall --query "authentication JWT"
```

### Step 2: Review Results
Results are scored by relevance. Top results shown first.

### Step 3: Apply and Update
- If recall is relevant: Apply it and mark as used
- If recall is outdated: Update it with /remember
- If recall is wrong: Flag it with /forget

## Output Format

```markdown
## Recall Results: "authentication JWT"

### Score 0.95 — Auth Architecture Decision
**Decided**: API uses JWT, not sessions
**Why**: Stateless = easier to scale horizontally
**Date**: 2026-02-20
**Context**: All API services

**Used?**: ✓ Applied to current task

---

### Score 0.72 — Token Refresh Bug
**Decided**: Race condition in token refresh
**Fix**: Mutex around refresh call
**Date**: 2026-03-01
**Context**: Mobile app

**Used?**: Not relevant — desktop-only issue
```

---

## Search Patterns

| Query | Finds |
|-------|-------|
| `auth` | All auth-related decisions |
| `auth JWT` | JWT specifically |
| `"we chose"` | Decisions with "we chose X over Y" |
| `error AUTH_001` | Specific error code |
| `bug:memory` | Memory-related bug fixes |

---

## Caching Behavior

2nd-brain uses Strict Write Discipline:
- Cached context is a HINT, not truth
- Always verify against actual files
- Update cached info after confirmed success

---

## Anti-Rationalization

- [ ] I queried 2nd-brain before starting this task
- [ ] I reviewed all relevant results
- [ ] I applied and marked used recalls
- [ ] I updated outdated recalls
- [ ] I flagged wrong recalls for removal
