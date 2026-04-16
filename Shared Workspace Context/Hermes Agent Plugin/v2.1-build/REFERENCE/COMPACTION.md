# COMPACTION — 5-Tier Token Management

## Purpose
Keep context under budget. Compress intelligently. Never lose decisions.

---

## Hook: `experimental.session.compacting`

**Event**: Session compaction triggered (at 70%, 80%, 90%, 95% budget)
**Action**: Transform messages to compress context while preserving decisions

---

## The 5 Tiers

### Tier 1: MicroCompact (70% budget)

**Trigger**: Every 10 tool calls
**Action**: Drop verbatim outputs of successful reads

```
REMOVED: "File contents of src/auth/login.ts (2,847 chars)"
KEPT: "Decision: Login uses bcrypt hash, JWT refresh"

[READ src/auth/login.ts] → [Understood: bcrypt + JWT pattern]
```

### Tier 2: Context Collapse (80% budget)

**Trigger**: Token budget at 80%
**Action**: Summarize spans of conversation into decisions

```
REMOVED: 47 messages of exploration, debugging, iteration
KEPT: 
## Decisions Made
- Auth: bcrypt + JWT (decided: stateless = horizontal scale)
- DB: PostgreSQL (decided: ACID compliance needed)
- API: REST over GraphQL (decided: simpler for this team)

## Current Task
- Building: User registration endpoint
- Blocked by: Nothing
- Next: Add password validation
```

### Tier 3: AutoCompact (90% budget)

**Trigger**: Token budget at 90%
**Action**: One `/compact` call — summarize everything

```
## Session Summary

**Started**: 2026-04-02 10:00
**Task**: User authentication system
**Phase**: BUILD (moving to REVIEW)

**Completed**:
- Registration endpoint
- Login endpoint
- JWT generation
- Password hashing

**In Progress**: Token refresh middleware (60%)

**Key Decisions**:
- JWT over sessions (stateless)
- bcrypt over scrypt (faster on our hardware)
- 1h token expiry (security vs UX tradeoff)

**Open Questions**:
- Should we support OAuth2 (deferred to v2)?
- Mobile app token refresh strategy (pending mobile team input)

**Context**: ~/projects/auth/
```

### Tier 4: Session Memory (proactive)

**Trigger**: After each phase completion
**Action**: Extract key context to `~/hermes-workspace/.state/`

```
Saved to: .state/sessions/ses_abc123_phase1.json
{
  "phase": "PLAN",
  "decisions": [...],
  "files": {...},
  "open_questions": [...],
  "next_phase": "BUILD"
}
```

### Tier 5: Full Compact (95% budget)

**Trigger**: Emergency, near context limit
**Action**: Summarize entire session, keep only:
- Current task
- Plan
- Open questions
- Blockers

```
## EMERGENCY COMPACT

**Session**: ses_abc123
**Compressed**: 4,000 messages → 50

### Current State
Task: User auth system
Phase: REVIEW
Blockers: None

### Plan
1. Reviewer approve → COMPLETE (pending)
2. /grill security check → 1h
3. Documentation → 30m

### What Was Learned
[See .state/sessions/ses_abc123_full.json]
```

---

## Large Tool Output Handling

From mal_shaik: Tool outputs > 8KB stored to disk, 8KB preview sent to model.

```typescript
export function createToolSummarizerHook(): NonNullable<Hooks["tool.execute.after"]> {
  return async (input, output) => {
    const { tool, output: toolOutput } = input;
    const MAX_PREVIEW = 8 * 1024; // 8KB

    if (toolOutput.length > MAX_PREVIEW) {
      const preview = toolOutput.slice(0, MAX_PREVIEW);
      const storedPath = await storeToDisk(toolOutput, {
        sessionID: input.sessionID,
        tool,
        timestamp: Date.now(),
      });
      
      output.output = `${preview}\n\n[Output truncated — full output stored to: ${storedPath}]`;
      output.metadata.truncated = true;
      output.metadata.storedPath = storedPath;
    }
  };
}
```

---

## Implementation

```typescript
export function createCompactionHook(): NonNullable<Hooks["experimental.session.compacting"]> {
  return async (input, output) => {
    const { sessionID } = input;
    const budget = getTokenBudget();
    
    if (budget < 0.70) return; // Under 70%, no compaction

    const context: string[] = [];

    // Tier 1: MicroCompact
    context.push(...microCompact(getRecentMessages(10)));

    // Tier 2: Context Collapse
    if (budget >= 0.80) {
      context.push(await contextCollapse(getAllMessages()));
    }

    // Tier 3: AutoCompact
    if (budget >= 0.90) {
      context.push(await autoCompact(sessionID));
    }

    output.context = context;
  };
}
```

---

## What Survives Each Tier

| Tier | Trigger | Survives |
|------|---------|---------|
| 0 | Normal | Everything |
| 1 | 10 tool calls | Decisions, tool summaries |
| 2 | 80% budget | Decisions, plan, open questions |
| 3 | 90% budget | Decisions (compressed), plan, blockers |
| 4 | 95% budget | Current task, plan, blockers only |
| 5 | 100% | Nothing — emergency |

---

## Anti-Rationalization

- [ ] No decision is lost — all decisions survive to Session Memory
- [ ] Compaction is triggered proactively, not reactively
- [ ] Large tool outputs don't pollute context
- [ ] Tier progression is monotonic (once compressed, stays compressed)
- [ ] Full context retrievable from `.state/` after compaction
