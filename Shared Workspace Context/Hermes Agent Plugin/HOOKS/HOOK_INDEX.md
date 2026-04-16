# HOOK INDEX — All 28 Lifecycle Hooks

Each hook is defined as a separate file. This index maps hook name → file → source → purpose.

---

## Hook Architecture

Hooks are composed using `composeHandlers()` (Spider Agent pattern). Order matters:

1. Guardrails (block bad actions fast)
2. Delegation gate (block unauthorized delegation)
3. Phase monitor (enforce correct phase)
4. TDD enforcer (test-first check)
5. Strict write discipline (verify before act)
6. Knowledge injector (2nd-brain recall)
7. Activity tracker (audit log)
8. Supervisor ingest (feed supervisor loop)

---

## Phase Enforcement Hooks

| # | Hook | File | Source | Purpose |
|---|------|------|--------|---------|
| 1 | brainstorm-gate | `brainstorm-gate.ts` | Superpowers | HARD-GATE: no code until design approved |
| 2 | plan-validator | `plan-validator.ts` | Superpowers | Reject plans with TBD/TODO/placeholder |
| 3 | tdd-enforcer | `tdd-enforcer.ts` | Superpowers | Test file must exist before src change |
| 4 | phase-monitor | `phase-monitor.ts` | Spider | Phase transition enforcement |
| 5 | delegation-gate | `delegation-gate.ts` | Spider | Coder blocked without reviewer approval |

---

## Quality Enforcement Hooks

| # | Hook | File | Source | Purpose |
|---|------|------|--------|---------|
| 6 | strict-write-discipline | `strict-write-discipline.ts` | Aura Frog | Verify cached context before acting |
| 7 | adversarial-check | `adversarial-check.ts` | Specialist | Slop/bypass detection |
| 8 | anti-rationalization | `anti-rationalization.ts` | Specialist | Exit criteria checklist |
| 9 | self-review | `self-review.ts` | Spider | Agent cannot approve own output |
| 10 | debugging-spiral | `debugging-spiral.ts` | Spider | 5 identical calls = spiral detected |

---

## Knowledge & Memory Hooks

| # | Hook | File | Source | Purpose |
|---|------|------|--------|---------|
| 11 | knowledge-injector | `knowledge-injector.ts` | Spider | 2nd-brain recall every turn |
| 12 | system-enhancer | `system-enhancer.ts` | Spider | HERMES.md injection |
| 13 | knowledge-curator | `knowledge-curator.ts` | Spider | Extract learnings from phases |
| 14 | snapshot-writer | `snapshot-writer.ts` | Spider | Session snapshots on events |

---

## Token Management Hooks

| # | Hook | File | Source | Purpose |
|---|------|------|--------|---------|
| 15 | compaction | `compaction.ts` | mal_shaik | 5-tier token management |
| 16 | tool-summarizer | `tool-summarizer.ts` | Spider | Truncate large outputs to 8KB |

---

## Agent Management Hooks

| # | Hook | File | Source | Purpose |
|---|------|------|--------|---------|
| 17 | guardrails | `guardrails.ts` | Spider | Per-agent resource limits |
| 18 | scope-guard | `scope-guard.ts` | Spider | File permission boundaries |
| 19 | activity | `activity.ts` | Spider | Tool call tracking |
| 20 | delegation-ledger | `delegation-ledger.ts` | Spider | Delegation chain state |
| 21 | drift-verifier | `drift-verifier.ts` | Spider | Phase completion verification |
| 22 | adversarial-detector | `adversarial-detector.ts` | Spider | Gate bypass pattern detection |

---

## Supervisor & Analysis Hooks

| # | Hook | File | Source | Purpose |
|---|------|------|--------|---------|
| 23 | ripple-check | `ripple-check.ts` | Specialist | Cascading change analysis |
| 24 | supervisor-ingest | `supervisor-ingest.ts` | Graeme | Feed supervisor loop |
| 25 | complexity-routing | `complexity-routing.ts` | Aura Frog | Auto-route by task complexity |
| 26 | framework-pack | `framework-pack.ts` | Aura Frog | Framework auto-detection |
| 27 | intent-marker | `intent-marker.ts` | Graeme | 4-marker protocol enforcement |
| 28 | context-budget | `context-budget.ts` | mal_shaik | Trigger compaction at 70% budget |

---

## Hook Event Mapping

| OpenCode Event | Hooks That Subscribe |
|----------------|----------------------|
| `chat.message` | `knowledge-injector` |
| `chat.params` | `complexity-routing` |
| `chat.headers` | `system-enhancer` |
| `tool.execute.before` | `tdd-enforcer`, `delegation-gate`, `guardrails`, `scope-guard`, `activity` |
| `tool.execute.after` | `phase-monitor`, `knowledge-curator`, `snapshot-writer`, `tool-summarizer`, `debugging-spiral`, `ripple-check`, `supervisor-ingest` |
| `experimental.chat.messages.transform` | `brainstorm-gate`, `plan-validator`, `strict-write-discipline`, `adversarial-check`, `anti-rationalization`, `adversarial-detector`, `intent-marker` |
| `experimental.chat.system.transform` | `system-enhancer`, `framework-pack` |
| `experimental.session.compacting` | `compaction` |
| `command.execute.before` | `scope-guard` |
| `permission.ask` | `guardrails` |

---

## Hook Implementation Template

```typescript
import type { Hooks } from "@opencode-ai/plugin";

export function createHookNameHook(): NonNullable<Hooks["hook.event"]> {
  return async (input, output) => {
    // input: hook-specific parameters
    // output: mutable output object to modify
    
    // Check conditions
    if (someCondition) {
      // Modify output or inject blocking message
      output.modifiedField = newValue;
    }
  };
}
```

---

## Testing Hooks

Each hook needs a test. Hook tests verify:
1. Hook fires at the correct event
2. Hook blocks/transforms correctly when conditions are met
3. Hook allows through correctly when conditions are NOT met
4. Hook doesn't crash on edge cases

```typescript
// Example: brainstorm-gate.test.ts
describe("brainstormGateHook", () => {
  it("blocks code in idle phase", async () => {
    const hook = createBrainstormGateHook();
    const output = { messages: [{ parts: [{ type: "text", text: "```js\ncode```" }] }] };
    await hook({ phase: "idle" }, output);
    expect(output.messages[0].parts[1].text).toContain("HARD-GATE BLOCKED");
  });
  
  it("allows code in build phase", async () => {
    const hook = createBrainstormGateHook();
    const output = { messages: [{ parts: [{ type: "text", text: "```js\ncode```" }] }] };
    await hook({ phase: "build" }, output);
    expect(output.messages[0].parts.length).toBe(1); // no blocking message
  });
});
```
