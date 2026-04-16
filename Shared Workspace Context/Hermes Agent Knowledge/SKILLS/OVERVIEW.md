# Hermes Agent v3.5 — Skills Overview

**Version:** 3.5  

---

## What Are Skills?

Skills are orchestration units that chain together tools and agents. They provide reusable patterns for common workflows.

---

## 11 Built-in Skills

| Skill | File | Type | Description |
|-------|------|------|-------------|
| `/implement` | IMPLEMENT.md | orchestration | Full pipeline: plan→tdd→verify→grill |
| `/plan` | PLAN.md | fork | Collaborative interactive planning |
| `/grill` | GRILL.md | fork | Adversarial security testing |
| `/tdd` | TDD.md | thread | Test-driven development cycles |
| `/verify` | VERIFY.md | thread | Proof-based verification |
| `/debug` | DEBUG.md | thread | Systematic debugging |
| `/brainstorm` | BRAINSTORM.md | fork | Socratic requirements gathering |
| `/autopilot` | AUTOPILOT.md | orchestration | Continuous improvement loop |
| `/health` | HEALTH.md | thread | System health checks |
| `/remember` | REMEMBER.md | thread | Store to 2nd-brain memory |
| `/recall` | RECALL.md | thread | Retrieve from 2nd-brain memory |

---

## Skill Details

### /implement (orchestration)
Full implementation pipeline combining planning, TDD, verification, and adversarial testing.

```
User: "implement login"
    ↓
1. FORK /plan → collaborative plan
2. THREAD /tdd → TDD cycles
3. THREAD /verify → proof verification
4. FORK /grill → security testing
```

### /plan (fork)
Collaborative planning where user shapes the solution.

- User interacts with planner agent
- Plan evolves through dialogue
- User approves or revises
- Returns finalized plan

### /grill (fork)
Adversarial testing that probes for weaknesses.

- Tests edge cases
- Probes security flaws
- Challenges assumptions
- User reviews findings interactively

### /tdd (thread)
Test-driven development with red-green-refactor cycles.

- Write failing test
- Write minimal code
- Verify test passes
- Refactor

### /verify (thread)
Proof-based verification that criteria are met.

- Check acceptance criteria
- Verify against spec
- Return pass/fail with evidence

### /debug (thread)
Systematic 4-phase debugging.

1. Observe — Gather data
2. Hypothesize — Form theory
3. Test — Verify hypothesis
4. Iterate or resolve

### /brainstorm (fork)
Socratic exploration of requirements.

- Ask probing questions
- Challenge assumptions
- Explore edge cases
- Clarify scope

### /autopilot (orchestration)
Continuous improvement loop.

- Analyze current state
- Identify improvements
- Apply improvements
- Verify gains
- Repeat

### /health (thread)
System health check.

- Check build status
- Check test status
- Check lint status
- Return health score

### /remember (thread)
Store to 2nd-brain memory.

- Key-value storage
- Tags for organization
- Persists across sessions

### /recall (thread)
Retrieve from 2nd-brain memory.

- Semantic search
- Returns relevant memories
- Ranked by relevance

---

## Skill Loading

Skills are loaded at plugin initialization:

```typescript
const { loadSkills } = await import("./skills/index.js");
loadSkills(); // Loads all 11 skills
```

---

## Custom Skills

Additional skills can be registered via:

```typescript
skill_register({ name: "custom", type: "action", handler: ... })
```