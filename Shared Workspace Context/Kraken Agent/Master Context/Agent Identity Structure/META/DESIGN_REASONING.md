# Design Reasoning — Agent Identity Structure

## Why This System Exists

### The Problem Discovered

During Kraken v1.2 build, the primary agent (designated as "Kraken orchestrator") failed to use ANY of its parallel delegation tools across a 2-hour session:

- `spawn_shark_agent` — 0 calls
- `run_parallel_tasks` — 0 calls
- `spawn_manta_agent` — 0 calls

Instead, it wrote 10+ files sequentially, acting as a vanilla build agent despite being designated as an orchestrator.

### Root Cause Analysis

The agent had the **TOOLS** but not the **IDENTITY**. Without explicit identity reinforcement:

1. Agent defaults to "path of least resistance" (doing it myself)
2. No awareness that delegation is EXPECTED behavior
3. No reminder that parallel execution is the norm, not the exception

### The Insight

> "An agent cannot exhibit role-appropriate behavior without first internalizing role identity. Tools alone are insufficient — the agent must KNOW it IS an orchestrator."

---

## Design Decisions

### Decision: File-Based Identity

**Alternatives considered:**
1. Generated identity (LLM generates its own identity statement)
2. Hardcoded identity (identity in plugin source code)
3. File-based identity (load from pre-written .md files)

**Why file-based was chosen:**

| Approach | Pros | Cons |
|----------|------|------|
| Generated | Flexible | Non-deterministic, hallucinates |
| Hardcoded | Fast | Not reviewable, can't update without redeploy |
| File-based | Reviewable, auditable, updateable | Requires upfront authoring |

**Decision:** File-based identity with fallback to generated minimal identity if files missing.

---

### Decision: 4-File Structure

**Alternatives considered:**
1. Single identity.md with everything
2. 2-file structure (SOUL + IDENTITY)
3. 4-file structure (SOUL + IDENTITY + EXECUTION + SPIDER)

**Why 4-file:**

| Structure | Flexibility | Complexity |
|-----------|-------------|------------|
| Single file | Low | Simple |
| 2-file | Medium | Medium |
| 4-file | High | Higher |

**Decision:** 4-file structure allows separation of:
- Core identity (SOUL) — rarely changes
- Role definition (IDENTITY) — medium frequency
- Execution behavior (EXECUTION) — changes with workflow
- Quality enforcement (SPIDER) — changes with process

---

### Decision: Hook-Based Injection

**Alternatives considered:**
1. Single injection at session start
2. Periodic re-injection
3. Hook-based injection (session.started, tab.toggle)

**Why hook-based:**

| Approach | Identity Persistence | Implementation Complexity |
|----------|---------------------|--------------------------|
| Single injection | Degrades over time | Low |
| Periodic re-injection | Maintained | Medium |
| Hook-based | Maintained + event-driven | Medium |

**Decision:** Hook-based with session.started as primary and tab.toggle for reinforcement.

---

### Decision: Follow Existing Pattern (Spider/Agent-Swarm)

**Why follow Spider pattern:**
1. Proven to work in production
2. User already familiar with it
3. Reduces new conceptual load

**Decision:** Mimic Spider's identity structure exactly, adapting for Kraken's specific roles.

---

## Key Insights

### Insight 1: Identity Precedes Behavior

Agents don't need more tools — they need to KNOW WHEN to use existing tools. Identity provides the "when."

### Insight 2: Context Decay is Real

System prompts degrade over long sessions. Identity must be reinforced, not just injected once.

### Insight 3: Orchestrators Must Delegate

By definition, an orchestrator's value comes from coordination, not direct work. An orchestrator that doesn't delegate has failed at its core purpose.

### Insight 4: File > Generated

Pre-written identity files are deterministic and reviewable. Generated identity is subject to the same hallucination risks as generated code.

---

## Anti-Patterns Avoided

### Anti-Pattern: "We have tools, that's enough"

**Why it's wrong:** Tools without identity guidance = default to "I'll do it myself"

**Solution:** Always pair tools with identity

### Anti-Pattern: "Inject once at start"

**Why it's wrong:** Context decays, especially in long sessions

**Solution:** Multiple injection points (start, tab toggle, compaction recovery)

### Anti-Pattern: "Let the agent figure it out"

**Why it's wrong:** Agents default to path of least resistance without explicit guidance

**Solution:** Explicit identity files tell the agent WHO IT IS

---

## Relationship to Trident Brain

This system was designed using Trident Brain's 3-layer reasoning:

- **Layer 1 (What is this?):** Identity = persistent self-awareness for agents
- **Layer 2 (How does it decompose?):** Files + Injection + Verification
- **Layer 3 (Can I explain it to another agent?):** This full context library

The structure mirrors Trident Brain's mechanical enforcement with structural requirements rather than quantitative metrics.

---

## Future Considerations

### Potential Extensions

1. **Identity versioning:** Track changes to identity files over time
2. **Identity inheritance:** Orchestrator identity builds on base agent identity
3. **Identity metrics:** Dashboard showing identity effectiveness
4. **Identity testing:** Automated behavioral tests for identity verification

### Lessons Learned

1. Tools alone are insufficient — identity is a prerequisite
2. Single injection is not enough — reinforcement is required
3. File-based is better than generated — deterministic > random