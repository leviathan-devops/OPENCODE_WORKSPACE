# SUPERPOWERS — 7-Phase Workflow (obra/superpowers)

Source: https://github.com/obra/superpowers (125k stars)
Reference: `~/hermes-workspace/context/engineering/BUILD_WORKFLOW_MERGE.md`

---

## The 7 Phases

### Phase 0: Brainstorm (HARD-GATE)

**Rule**: No implementation until design approved.

```
User: "build a login system"
Bot: "What problem does auth solve?"
User: "Only logged-in users should see pricing"
Bot: "Who experiences this problem?"
[... Socratic questioning ...]
Bot: [Writes design doc]
Bot: "Design ready for approval."
User: "approved"
Bot: [Moves to Plan]
```

### Phase 1: Plan (NO-PLACEHOLDER)

**Rule**: Plan fails if any TBD/TODO/placeholder.

Every step has:
- Exact file paths
- Actual code (not "implement X")
- Exact test commands
- Acceptance criteria

### Phase 2: Build (TDD IRON LAW)

**Rule**: Test fails before src compiles.

```
@tdd agent:
RED:    Write failing test
GREEN:  Write minimal code to pass
REFACTOR: Clean up
VERIFY: Show actual command output
```

### Phase 3: Review (TWO-STAGE)

**Stage 1**: @quality-reviewer — spec compliance, readability
**Stage 2**: @reviewer — security, performance, patterns

### Phase 4: Debug (3-STRIKE RULE)

After 3 failed attempts:
- Mandatory architecture review
- User must approve before continuing

### Phase 5: Complete

- /verify: proof-based verification
- @health: project health score (0-100)
- Conventional commit
- PR creation

### Phase 6: Integrate

- Merge to main
- Deploy
- Monitor

---

## Key Superpowers Rules

### The HARD-GATE
`<HARD-GATE>` in prompts means: no code until design is approved.

### No-Placeholder Planning
If plan contains TBD/TODO/placeholder → rejected.

### TDD Iron Law
Test must fail BEFORE src compiles.

### 3-Strike Debugging
After 3 failures on same bug → architecture review.

---

## Subagent Status Protocol

When subagents report back:

```
DONE — Task complete, ready for review
NEEDS_CONTEXT — I need more information to continue
BLOCKED — I need something from another agent or user
```

---

## Source Evidence

These rules come verbatim from Superpowers prompts:
- `skills/workflow/start.md` — phase definitions
- `skills/workflow/plan.md` — no-placeholder rule
- `skills/workflow/tdd.md` — TDD iron law
- `skills/workflow/review.md` — two-stage review
- `skills/workflow/debug.md` — 3-strike rule
