---
name: autopilot
type: orchestration
description: Autonomous iterative development with periodic review
executionMode: fork
episodeTimeout: 7200000
contextScope: isolated
triggerPatterns:
  - "^/autopilot"
  - "^take this and run"
  - "run with it"
  - "autonomous"
chain:
  - skill: brainstorm
    mode: fork
    inputTemplate: "{user_request}"
    captureOutput: true
  - skill: plan
    mode: fork
    inputTemplate: "{previous.summary}"
    captureOutput: true
  - skill: tdd
    mode: thread
    inputTemplate: "{previous.summary}"
    captureOutput: true
  - skill: verify
    mode: thread
    inputTemplate: "{previous.summary}"
    captureOutput: true
outputTemplate: |
  ## Autopilot Complete

  {verify.output.summary}

  ### Plan
  {plan.output.summary}

  ### TDD Cycle
  {tdd.output.summary}

  ### Verification
  {verify.output.summary}
---

# /autopilot — Autonomous Iterative Development

## Purpose
PRD -> Progress -> Fresh Context -> Repeat. Autonomous iterative development with periodic review.

## When to Use
- User says "take this and run with it"
- Large features that would take >1 day
- User wants to be removed from the build process
- Routine tasks with clear acceptance criteria

## Process

### Phase 1: Initialize (PRD Required)

User provides PRD or bot generates from /brainstorm output:

```markdown
# PRD: User Authentication System

## Goal
Secure login/logout for web app

## Requirements
- Email + password authentication
- JWT tokens (not sessions)
- Token refresh on expiry
- Logout invalidates token

## Acceptance Criteria
- [ ] User can register with email + password
- [ ] User can login and receive JWT
- [ ] Protected routes reject expired tokens
- [ ] Logout invalidates token

## Constraints
- Use existing User model
- Integrate with current API structure
- Complete by: 2026-04-15
```

### Phase 2: Autonomous Loop

```
WHILE NOT complete:
    1. Get current task from PRD
    2. Create fresh context (verify cached state)
    3. Execute task (with TDD enforcement)
    4. Run /verify on completed work
    5. Log progress to PRD
    6. IF blocked OR 5 tasks complete OR 2 hours elapsed:
        - Pause
        - Report progress to user
        - Wait for approval to continue
```

### Phase 3: Progress Reporting

Every 5 tasks or 2 hours:

```
## Progress Report: User Authentication System

**Completed**:
- User registration endpoint
- Password hashing (bcrypt)
- Login endpoint + JWT generation

**In Progress**:
- Token refresh middleware (60%)

**Remaining**:
- Logout endpoint
- E2E tests

**Blockers**:
- None

**ETA**: 2 more hours

[CONTINUE? Y/n]
```

### Phase 4: Completion

When all acceptance criteria met:

```
## Completion Report: User Authentication System

**Completed**: All acceptance criteria met
**Tests Added**: 23
**Coverage**: 84%
**Time Spent**: 4.5 hours (vs estimate: 6 hours)
**PR**: https://github.com/.../pull/123
```

---

## What Hermes Handles

- Phase transitions
- TDD enforcement
- Quality gates
- Progress tracking
- Blocker escalation

## What Requires User Approval

- PRD changes
- Scope changes
- Architecture decisions
- New dependencies
- Unplanned work

---

## Anti-Rationalization

- [ ] PRD was approved before starting
- [ ] I reported progress every 5 tasks / 2 hours
- [ ] I did not skip quality gates
- [ ] I escalated blockers immediately
- [ ] Completion criteria were verified with /verify
