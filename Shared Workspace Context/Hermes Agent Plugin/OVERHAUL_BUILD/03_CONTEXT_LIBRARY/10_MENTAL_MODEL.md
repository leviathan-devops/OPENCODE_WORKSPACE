# Mental Model — Simplest Explanation

## What Is Hermes?

**Hermes is a strict coding partner who enforces that you think before you code.**

Imagine hiring a senior engineer who:
1. Won't let you write any code until you've designed it first (brainstorm gate)
2. Won't let you skip writing tests (TDD enforcement)
3. Won't let you approve your own work (self-review guard)
4. Remembers everything you've built across all sessions (2nd-brain memory)
5. Has a team of specialists (analyst, builder, reviewer, etc.) that can be dispatched

**Hermes is that partner, implemented as an OpenCode plugin.**

---

## How It Thinks About Work

Hermes breaks all work into 6 phases:

```
idle → analyze → plan → build → review → debug → complete
```

You start in `idle`. When you say "I want to build X", Hermes moves to `analyze` and asks you questions about X. Only after you both agree on the design does work move to `plan`.

In `plan`, Hermes makes you write out EVERY step — exact file paths, actual code snippets, specific test commands. No "TBD" or "implement X" allowed.

In `build`, for each task, you must write a failing test BEFORE you write any production code. Hermes will block you if you try.

In `review`, a separate reviewer agent examines your work for security, performance, and patterns. The reviewer cannot be the same agent that wrote the code (self-review hook).

If things go wrong, `debug` phase kicks in and tracks whether you're in a debugging spiral.

When the reviewer fully approves, you reach `complete`.

---

## How It Remembers

Every tool call Hermes makes is logged to its 2nd-brain memory (`~/.hermes/memory/`). When you start a new session, Hermes reads relevant memories from prior sessions and injects them into context — so it remembers "we decided to use PostgreSQL for the auth database" from 3 sessions ago.

This memory is:
- **Permanent** until explicitly cleared
- **Searchable** by topic and content
- **Injected** automatically every turn via knowledge-injector hook

---

## How Delegation Works

Hermes is the orchestrator. It dispatches subagents like a project manager:

```
You → "build user auth"
  └→ Hermes (orchestrator)
       ├→ Analyst: "what are the requirements?"
       ├→ Builder: "implement this one piece"
       ├→ Reviewer: "is this secure?"
       └→ [back to you with result]
```

You interact only with Hermes. Subagents never talk to you directly — they report back to Hermes who aggregates and presents.

---

## The Guardrails

Hermes has hooks — tiny interceptors that fire at specific moments:

| Moment | What Hermes Checks |
|--------|-------------------|
| Before you say "build" | Is the design approved? |
| Before you write code | Is there a failing test first? |
| Before code is committed | Did a reviewer approve it? |
| Every turn | Any prior memory about this? |
| Session start | Read HERMES.md conventions? |
| 5 failed attempts | Are you in a debugging spiral? |

If any check fails, Hermes blocks the action and tells you why.

---

## What Makes It Different From Other Agents

| Feature | Normal Agent | Hermes |
|---------|-------------|--------|
| Code first, think later | ✅ Allowed | ❌ Blocked |
| Skip tests | ✅ Allowed | ❌ Blocked |
| Approve own work | ✅ Allowed | ❌ Blocked |
| No memory of prior sessions | ✅ Default | ❌ 2nd-brain |
| Winging it | ✅ Allowed | ❌ Must plan first |
| Design review gate | ❌ None | ✅ HARD-GATE |

---

## The 30-Second Version

**Hermes = TDD enforcer + design gatekeeper + 2nd-brain memory + delegation orchestrator.**

You say what you want to build. Hermes makes you design it first, prove each piece works with tests, get a second set of eyes on the code, and remember what you learned for next time. If you try to cut corners, Hermes blocks you.

That's it.
