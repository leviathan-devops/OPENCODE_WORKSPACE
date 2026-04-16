# /remember — Save to 2nd-Brain

## Purpose
Store decisions, patterns, and learnings so they persist across sessions.

## When to Use
- After a design decision is made
- After discovering a pattern or workaround
- After fixing a tricky bug
- After learning something about the codebase

## What to Remember

### Decisions (always)
- "We chose X over Y because Z"
- "API uses JWT, not sessions"
- "Database schema: users table has email as unique key"

### Patterns (when useful)
- "To add a new API endpoint: create file, add route, add test"
- "Our error code format: MODULE_XXX (e.g., AUTH_001)"

### Bug Fixes (when non-obvious)
- "Bug: Race condition in auth. Fix: Move token refresh to mutex."
- "Bug: Memory leak in WebSocket handler. Fix: Clear interval on close."

### Learnings (when generalizable)
- "TypeORM findOne doesn't throw on not found — returns null"
- "Next.js API routes need explicit CORS headers"

## What NOT to Remember
- Temporary state ("user was stuck on step 3")
- Obvious things ("array.map returns new array")
- Things easily re-discovered ("npm install takes 30s")

## Format

```
# Remember: <Topic>

**Decided**: <What was decided>
**Why**: <Rationale>
**Date**: YYYY-MM-DD
**Context**: <Project or file this applies to>

## Details
<Additional context if needed>
```

## Example

```
$ hermes_remember

Topic: Database password rotation

**Decided**: Rotate passwords quarterly via environment variable
**Why**: PCI compliance requires quarterly rotation
**Date**: 2026-03-15
**Context**: All production services

## Details
- Rotation process: Update in AWS Secrets Manager → restart service
- Fallback: Old password valid for 24h during transition
- On-call contact for rotation: @ops-team
```

## Tool Usage

```
hermes_remember --topic "database-password-rotation" --content "..." --context "production" --decider "hermes" --reason "PCI compliance" --date 2026-03-15
```

## Anti-Rationalization

- [ ] This is a DECISION, not just information
- [ ] Future me would need this
- [ ] I included the WHY, not just the WHAT
- [ ] This is not easily re-discovered
