# Hermes Agent Plugin — Architecture

## High-Level Design

```
╔══════════════════════════════════════════════════════════════════════╗
║                      HERMES AGENT v3 (OpenCode Plugin)              ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  LEVIATHAN (human)                                                  ║
║       │                                                             ║
║       ▼                                                             ║
║  ┌─────────────────────────────────────────────────────────────┐     ║
║  │  ~/.hermes/HERMES.md         ← Leviathan's conventions      │     ║
║  │  ~/.hermes/settings.json     ← permissions, model tiering   │     ║
║  │  ~/.hermes/phase.json        ← persisted phase state        │     ║
║  │  ~/.hermes/memory/           ← 2nd-brain storage            │     ║
║  └─────────────────────────────────────────────────────────────┘     ║
║       │                                                             ║
║       ▼                                                             ║
║  ┌─────────────────────────────────────────────────────────────┐     ║
║  │  HERMES ORCHESTRATOR (primary agent)                         │     ║
║  │  • 6-phase workflow enforcement                             │     ║
║  │  • Brainstorm gate (HARD-GATE) — ONLY when .hermes exists  │     ║
║  │  • Routes to 18 subagents via delegation                   │     ║
║  │  • Owns 2nd-brain memory injection                         │     ║
║  └───────────────────────────┬─────────────────────────────────┘     ║
║                              │                                       ║
║       ┌──────────────────────┼──────────────────────┐                ║
║       ▼                      ▼                      ▼                ║
║  ┌──────────┐         ┌──────────────┐       ┌──────────────┐       ║
║  │ EXECUTION│         │  SUPERVISOR  │       │   2ND-BRAIN  │       ║
║  │  SPOKE   │         │    SPOKE     │       │    SPOKE     │       ║
║  │          │         │              │       │              │       ║
║  │18 agents │         │ 3-agent loop │       │ recall/      │       ║
║  │parallel │         │monitor/log/  │       │ remember/    │       ║
║  │dispatch │         │fix+Graeme 4- │       │ context      │       ║
║  │          │         │marker proto │       │ injection    │       ║
║  └──────────┘         └──────────────┘       └──────────────┘       ║
║                                                                      ║
║  ┌─────────────────────────────────────────────────────────────┐     ║
║  │  WORKSPACE/           ← Current project                    │     ║
║  │  • .hermes/phase.json ← Phase persistence                  │     ║
║  │  • src/               ← Source files                       │     ║
║  │  • tests/             ← Test files                         │     ║
║  └─────────────────────────────────────────────────────────────┘     ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Key Architectural Decisions

### Decision 1: Hub-and-Spoke Over Peer-to-Peer

**Why:** Hermes is an orchestrator, not a peer. One primary agent coordinates 18 subagents. Subagents don't communicate directly with each other — they report back to Hermes who routes outputs.

**Trade-off:** Single point of failure (Hermes dies, chain breaks). Acceptable for Leviathan's workflow — human is always in loop for phase approvals.

### Decision 2: Hook Composition Order is Sacred

**Why:** Hooks fire in composition order. Guardrails must fire BEFORE knowledge injectors. If `knowledge-injector` fires first and injects stale context, subsequent guardrails may make wrong decisions based on that context.

**Order in opencode.json:**
```
1. brainstorm-gate     (guardrail — blocks bad starts)
2. plan-validator      (guardrail — rejects incomplete plans)
3. tdd-enforcer        (guardrail — enforces TDD iron law)
4. delegation-gate     (guardrail — enforces review requirement)
5. guardrails          (guardrail — resource limits)
6. scope-guard        (guardrail — file boundaries)
7. activity           (logging — tracks tool calls)
8. phase-monitor      (monitor — tracks state)
9. self-review        (check — prevents self-approval)
10. debugging-spiral  (check — detects loops)
11. delegation-ledger (tracking)
12. drift-verifier-hook (tracking)
13. ripple-check      (tracking)
14. supervisor-ingest (tracking)
15. adversarial-check  (quality — detects slop)
16. adversarial-detector (quality)
17. anti-rationalization (quality)
18. strict-write-discipline (quality)
19. intent-marker     (inter-agent comms)
20. knowledge-curator  (memory — extracts learnings)
21. snapshot-writer    (persistence — session snapshots)
22. compaction         (memory — token management)
23. knowledge-injector (memory — injects prior context) ← LAST
24. system-enhancer   (context — HERMES.md injection)
25. framework-pack    (context — framework detection)
26. complexity-routing (routing — model selection)
27. context-budget     (routing — budget warnings)
28. hermes-command     (CLI — /Hermes routing)
29. supervisor-loop-hook (supervisor integration)
```

### Decision 3: Agent Identity Guards on All Hooks

**Why:** The brainstorm-gate bug (v2.3.5 removed from opencode.json) proved that hooks without agent identity checks fire for ALL agents in the system, not just Hermes. Every hook that should be Hermes-specific must have an explicit guard:

```typescript
function createBrainstormGateHook() {
  return {
    hook: async (input, output) => {
      // GUARD: Only fire for Hermes sessions (where .hermes/ exists)
      if (!existsSync(resolve(input.context.directory ?? process.cwd(), ".hermes"))) {
        return; // Skip — not a Hermes session
      }
      // ... rest of hook logic
    }
  };
}
```

### Decision 4: Phase State to Disk, Not Memory

**Why:** Module-level variables reset on plugin hot-reload. Phase state must persist to `.hermes/phase.json` so it survives restart. Every phase transition must:
1. Validate the transition is legal
2. Write new state to disk
3. Return updated state to caller

### Decision 5: E2E Tests + Real Integration Dual Verification

**Why:** E2E tests prove code parses and basic logic works. Real integration tests prove hooks fire in actual OpenCode sessions. Both are required — neither is sufficient alone.

---

## Component Overview

| Component | Files | Responsibility |
|-----------|-------|----------------|
| **Plugin Entry** | `src/index.ts` | Wires all components, registers agents/hooks/tools |
| **Agents** | `src/agents/*.ts` | 19 agent prompt definitions |
| **Hooks** | `src/hooks/*.ts` | 29 hook implementations |
| **Tools** | `src/tools/*.ts` | 28 tool implementations |
| **Config** | `src/config/` | Phase constants, agent registration |
| **Services** | `src/services/` | Session DB, phase persistence, memory store |

---

## Agent Taxonomy

| Agent | Mode | Role |
|-------|------|------|
| `hermes` | `primary` | Orchestrator, phase enforcement, delegation |
| `analyst` | `subagent` | Requirements → technical specs |
| `builder` | `subagent` | One-at-a-time task implementation |
| `planner` | `subagent` | No-placeholder adaptive planning |
| `tdd` | `subagent` | RED-GREEN-REFACTOR executor |
| `reviewer` | `subagent` | Security + performance + patterns |
| `quality-reviewer` | `subagent` | Spec compliance + readability |
| `grill` | `subagent` | Adversarial attack vectors |
| `ripple` | `subagent` | Cascading change analysis |
| `drift-verifier` | `subagent` | Phase completion verification |
| `explorer` | `subagent` | Codebase context mapping |
| `architect` | `subagent` | Clean Architecture / DDD advocacy |
| `debugger` | `subagent` | 4-phase systematic debugging |
| `supervisor` | `subagent` | Graeme's self-improving loop |
| `sme` | `subagent` | Subject matter expert |
| `test-engineer` | `subagent` | Test strategy + coverage |
| `docs` | `subagent` | Documentation updates |
| `critic` | `subagent` | Critical analysis |
| `memory` | `subagent` | Memory management |

---

## Hook Event Map

| Event | Hooks That Fire |
|-------|-----------------|
| `messages.transform` | brainstorm-gate, plan-validator, strict-write-discipline, adversarial-check, adversarial-detector, anti-rationalization, intent-marker |
| `tool.execute.before` | tdd-enforcer, delegation-gate, guardrails, scope-guard, activity |
| `tool.execute.after` | phase-monitor, self-review, debugging-spiral, knowledge-injector, knowledge-curator, snapshot-writer, delegation-ledger, drift-verifier-hook, ripple-check, supervisor-ingest, supervisor-loop-hook |
| `chat.system.transform` | system-enhancer, framework-pack |
| `chat.params` | complexity-routing, context-budget |
| `command.execute.before` | hermes-command |
| `session.compacting` | compaction |
