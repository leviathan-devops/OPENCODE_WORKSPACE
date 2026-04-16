# Surface Analysis — Recovery Mode

## Problem Statement

When OpenCode compacts a session or a session crashes, the agent loses its "stream of consciousness" - the in-flight reasoning, loaded context, and mental position. The agent wakes up with no memory of what they were doing.

## What Recovery Mode Is

A **stream-of-consciousness recovery system** that reconstructs the agent's cognitive state at the moment of interruption:

- **Input:** Pre-compaction session artifacts, tool call history, last message
- **Output:** CognitiveSnapshot with reasoning chain, action chain, intent chain, working memory
- **Purpose:** Allow the agent to resume exactly where they left off

## What Recovery Mode Is NOT

- **NOT behavioral forensics** — Not about catching bad behavior (that's Code Review)
- **NOT derailment detection** — Not about detecting failures
- **NOT corruption detection per se** — The interruption creates incomplete data, but we're recovering from it, not auditing it
- **NOT blame assignment** — We don't care who/what caused the interruption

## Scope

### In Scope
- Interruption point detection (compaction vs crash)
- Tool sequence analysis (read→write patterns)
- Intent inference from last message
- Working memory recovery
- Cognitive snapshot generation
- Stream reconstruction narrative

### Out of Scope
- Behavioral audit (Code Review handles this)
- Derailment detection
- Corruption prevention
- Session repair (we recover context, not fix sessions)

## Success Criteria

1. **Position Recovery:** Where was the agent (gate, task, file)?
2. **Reasoning Recovery:** What was the agent thinking?
3. **Intent Recovery:** What was about to happen?
4. **Memory Recovery:** What was loaded in context?
5. **Confidence Scoring:** How confident are we in the recovery?

## Mental Model

**Stream of Consciousness = Think-Doing-About to Do**

The agent's mind has three parallel tracks:
1. **Reasoning chain** — "I was analyzing X because Y"
2. **Action chain** — "I was reading A, then B, then modifying A"
3. **Intent chain** — "I was about to write to file X at line Y"

Recovery Mode reconstructs all three from:
- Tool call sequences (what was being done)
- Last message patterns (what was about to happen)
- Session state (what was loaded)

## Key Insight

An LLM agent's thought stream can be partially recovered from **tool call ordering patterns**:

```
read(A) → write(A)        = "Had A loaded, was about to modify it"
read(A) → read(B) → write(A) = "Comparing A and B before editing A"
test → test → test        = "Was debugging"
read → [gap] → write      = "Mid-research when interrupted"
```

The sequence reveals the thought process.