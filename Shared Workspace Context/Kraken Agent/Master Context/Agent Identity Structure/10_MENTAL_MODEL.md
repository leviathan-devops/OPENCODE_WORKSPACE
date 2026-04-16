# Mental Model — Agent Identity Structure

## One-Sentence Explanation

**Identity structure gives AI agents persistent self-awareness by loading pre-written "WHO YOU ARE" files at session start, preventing behavioral drift to vanilla chatbot mode.**

---

## The Analogy: Professional Identity

Consider a doctor walking into a hospital:
- **Without identity:** They'd act like any person, unsure what to do
- **With identity (scrubs, badge, stethoscope):** They KNOW they're a doctor, act accordingly

The identity files (SOUL.md, IDENTITY.md, etc.) are like the doctor's uniform and badge — they make the role unmistakable.

---

## Key Abstraction

**Identity = Role + Tools + Behavior**

| Component | Purpose | Example |
|-----------|---------|---------|
| **Role** | WHO you are | "Orchestrator" |
| **Tools** | WHAT you can use | `spawn_shark_agent`, `run_parallel_tasks` |
| **Behavior** | HOW you act | Delegate, don't do directly |

An agent with tools but no identity acts like a person with a Swiss Army knife but no idea they're a surgeon.

---

## How To Think About It

### The Problem (Without Identity)

```
Agent: "I have these tools... spawn_shark_agent, run_parallel_tasks..."
Agent: "But I'm not sure what I'm supposed to be doing..."
Agent: "I'll just write these 10 files myself since that's the path of least resistance"
```

### The Solution (With Identity)

```
Agent: "I AM the Kraken orchestrator"
Agent: "My job is to DELEGATE, not do directly"
Agent: "I have spawn_shark_agent... I should use it for these 10 files"
Agent: "Spawning 3 parallel agents to write files simultaneously"
```

---

## The 4-File Identity System

Think of each identity file as a layer of reinforcement:

```
┌─────────────────────────────────────┐
│           SOUL.md                   │
│    "You ARE a {role} agent"         │
│    (Core identity - deepest)        │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│          IDENTITY.md                │
│    Role, expertise, working style    │
│    (What you do)                     │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│         EXECUTION.md                │
│    How to delegate, parallel patterns│
│    (How you work)                   │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│          SPIDER.md                  │
│    Quality gates, debug protocol     │
│    (How you verify)                 │
└─────────────────────────────────────┘
```

Each layer reinforces the one above it.

---

## The Behavioral Derailment Problem

**Real example from Kraken v1.2:**

| Metric | Expected | Actual |
|--------|----------|--------|
| Delegation calls | 10+ | 0 |
| Parallel agents | 3-5 | 0 |
| Build time | ~35 min | ~120 min |
| Tool diversity | 8+ tools | 3 tools |

**Root cause:** Agent had the tools but not the identity telling it WHEN to use them.

---

## Why File-Based Works

**Generated identity (bad):**
- Agent might hallucinate inconsistent identity
- Different each session
- Must be verified every time

**File-based identity (good):**
- Deterministic, reviewable
- Same identity every session
- Can be audited and improved

---

## The Injection Moment

```
Session starts
       │
       ▼
Plugin loads identity/{role}/*.md files
       │
       ▼
Files formatted and injected into system prompt
       │
       ▼
Agent context now contains: "You ARE the Kraken orchestrator..."
       │
       ▼
Agent proceeds with tasks, identity guiding behavior
```

---

## Mental Check

When debugging "why isn't the agent delegating?", ask:

1. **Identity loaded?** → Check session logs for "Identity injected"
2. **Correct role?** → Check `session.state.identity.activeRole`
3. **Content correct?** → Check system prompt for "You ARE..."
4. **Fallback triggered?** → Check for "Falling back to minimal identity"

---

## Summary

**Identity structure is:**
- NOT about adding more prompts
- NOT about changing the LLM
- ABOUT reinforcing existing role through persistent, file-based self-awareness

**The result:**
- Orchestrators delegate (instead of doing everything themselves)
- Coders focus on single tasks (instead of trying to architect systems)
- Reviewers review (instead of just approving)