---
name: brainstorm
type: interactive
description: Socratic pre-planning to convert vague requirements into concrete specifications
executionMode: fork
episodeTimeout: 600000
contextScope: isolated
triggerPatterns:
  - "^/brainstorm"
  - "brainstorm"
  - "what if we"
---

# /brainstorm — Socratic Pre-Planning

## Purpose
Phase 0 pre-work. Convert vague requirements into concrete specifications through Socratic questioning. No code is written here. No implementation is planned. Just understanding.

## When to Use
- User gives a vague request ("build something cool")
- User gives a solution instead of a problem ("add auth")
- Requirements are ambiguous or incomplete
- Multiple stakeholders with conflicting needs

## The 5 Questions (ask one at a time)

### 1. The Problem Question
"What problem does this solve?"
- If user can't answer: "Who experiences this problem?"
- Push until there's a concrete problem statement

### 2. The User Question
"Who uses this?"
- Primary user (the one who gets value)
- Secondary users (admins, viewers, etc.)
- Edge: anonymous users? bots?

### 3. The Success Question
"How do we know it worked?"
- Specific, measurable outcomes
- Not "it works" — what does "working" look like?
- Metrics: time saved, errors reduced, revenue increased

### 4. The Error Question
"What happens when X goes wrong?"
- X = network, database, user error, invalid input, race condition
- Every major path needs an error case
- "Happy path only" is incomplete

### 5. The Context Question
"Where does this fit in the existing system?"
- What does it replace?
- What depends on it?
- What does it depend on?

## Stop Asking When You Can Answer

```
WHO:    [specific users]
WHAT:   [concrete problem + solution]
WHEN:   [trigger/condition]
WHERE:  [system location]
HOW:    [technical approach outline]
WHY:    [business justification]
```

## Output: Design Doc

Write to `~/hermes-workspace/docs/plans/YYYY-MM-DD-<topic>-design.md`:

```markdown
# Design: <Feature Name>

## Problem Statement
<1-2 sentences>

## Users
- Primary: <who benefits>
- Secondary: <who else affected>

## Requirements
### Functional
- [ ] REQ-1: <specific requirement>

### Non-Functional
- Performance: <target>
- Availability: <target>

## Success Criteria
- [ ] <criterion 1>
- [ ] <criterion 2>

## Error Handling
| Case | Behavior |
|------|----------|
| <error> | <handling> |

## Integration Points
- Depends on: <X>
- Dependents: <Y>

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| <risk> | <impact> | <mitigation> |
```

## Anti-Rationalization Checklist

Before producing design doc:
- [ ] I asked at least 3 of the 5 questions
- [ ] I can answer WHO/WHAT/WHY
- [ ] Success criteria are measurable
- [ ] Error cases are enumerated
- [ ] Integration points are identified

## Examples

### Vague → Concrete

**Vague**: "Add auth"
**Questions asked**:
- Q: "What problem does auth solve?" A: "Only logged-in users should see pricing"
- Q: "Who uses this?" A: "Prospective customers"
- Q: "How do we know it worked?" A: "Unauthenticated users get 401 on API calls"
**Concrete**: "API endpoint authentication via JWT for prospective customer API calls"

### Solution-Instead-of-Problem → Problem

**Given**: "Add Redis caching"
**Questions**:
- Q: "What problem does caching solve?" A: "API is slow under load"
- Q: "How slow?" A: ">2s at 1000 concurrent users"
**Problem**: "API response time exceeds 2s at 1000 concurrent users"
**Solution (may change)**: "Caching (or other optimization)"
