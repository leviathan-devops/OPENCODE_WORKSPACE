# HOOK VERIFICATION LOG — Hermes v3

**Build ID:** hermes-v3-overhaul  
**Date:** 2026-04-14  
**Verified:** 29/29 hooks in source  

---

## Executive Summary

All 29 hooks exist in `src/hooks/` and have been verified in SOURCE REVIEW. Real OpenCode session hook firing verification requires loading the plugin in actual OpenCode runtime — this document captures source-level verification as Phase 2 proxy.

---

## Hook Verification Matrix

| # | Hook | Event | File | Guard Type | Source Verified | Notes |
|---|------|-------|------|------------|-----------------|-------|
| 1 | brainstorm-gate | messages.transform | brainstorm-gate.ts | `.hermes/` dir + isHermesAgent | ✅ | PRIMARY fix applied |
| 2 | plan-validator | messages.transform | plan-validator.ts | isHermesAgent | ✅ | |
| 3 | tdd-enforcer | tool.execute.before | tdd-enforcer.ts | isHermesAgent | ✅ | |
| 4 | delegation-gate | tool.execute.before | delegation-gate.ts | isHermesAgent | ✅ | |
| 5 | phase-monitor | tool.execute.after | phase-monitor.ts | isHermesAgent | ✅ | |
| 6 | strict-write-discipline | messages.transform | strict-write-discipline.ts | isHermesAgent | ✅ | |
| 7 | adversarial-check | messages.transform | adversarial-check.ts | isHermesAgent | ✅ | |
| 8 | anti-rationalization | messages.transform | anti-rationalization.ts | isHermesAgent | ✅ | |
| 9 | self-review | tool.execute.after | self-review.ts | isHermesAgent | ✅ | |
| 10 | debugging-spiral | tool.execute.after | debugging-spiral.ts | isHermesAgent | ✅ | |
| 11 | knowledge-injector | tool.execute.after | knowledge-injector.ts | isHermesAgent | ✅ | |
| 12 | system-enhancer | chat.system.transform | system-enhancer.ts | isHermesAgent | ✅ | |
| 13 | knowledge-curator | tool.execute.after | knowledge-curator.ts | isHermesAgent | ✅ | |
| 14 | snapshot-writer | tool.execute.after | snapshot-writer.ts | isHermesAgent | ✅ | |
| 15 | compaction | session.compacting | compaction.ts | isHermesAgent | ✅ | |
| 16 | guardrails | tool.execute.before | guardrails.ts | isHermesAgent | ✅ | |
| 17 | scope-guard | tool.execute.before | scope-guard.ts | isHermesAgent | ✅ | |
| 18 | activity | tool.execute.before | activity.ts | isHermesAgent | ✅ | |
| 19 | delegation-ledger | tool.execute.after | delegation-ledger.ts | isHermesAgent | ✅ | |
| 20 | drift-verifier-hook | tool.execute.after | drift-verifier-hook.ts | isHermesAgent | ✅ | |
| 21 | adversarial-detector | messages.transform | adversarial-detector.ts | isHermesAgent | ✅ | |
| 22 | ripple-check | tool.execute.after | ripple-check.ts | isHermesAgent | ✅ | |
| 23 | supervisor-ingest | tool.execute.after | supervisor-ingest.ts | isHermesAgent | ✅ | |
| 24 | complexity-routing | chat.params | complexity-routing.ts | isHermesAgent | ✅ | |
| 25 | framework-pack | chat.system.transform | framework-pack.ts | isHermesAgent | ✅ | |
| 26 | intent-marker | messages.transform | intent-marker.ts | isHermesAgent | ✅ | |
| 27 | context-budget | chat.params | context-budget.ts | isHermesAgent | ✅ | |
| 28 | hermes-command | command.execute.before | hermes-command.ts | isHermesAgent | ✅ | |
| 29 | supervisor-loop-hook | tool.execute.after | supervisor-loop-hook.ts | isHermesAgent | ✅ | |

---

## Source Verification Method

Each hook was verified by:
1. File existence check (`src/hooks/{hook}.ts`)
2. Agent identity guard presence (`isHermesAgent` or `.hermes/` check)
3. Correct event mapping (`messages.transform`, `tool.execute.before/after`, etc.)

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

---

## Real Session Testing Required

Full hook firing verification requires:
1. Hermes plugin loaded in OpenCode
2. Real multi-turn session with actual delegation
3. Hook firing logs captured via console.log traces
4. Evidence that each hook fires at the correct moment

**Known limitation:** This build runs source-level verification only. Real session testing is deferred to post-build container ship phase.

---

## Guard Pattern Summary

All Hermes hooks follow the same guard pattern:

```typescript
export function create[HookName]Hook(): NonNullable<Hooks["[event]"]> {
  return async (input, output) => {
    // GUARD 1: Agent identity (skip if not Hermes agent)
    if (!isHermesAgent(input.agent)) {
      return;
    }
    // ... rest of hook logic
  };
}
```

**Critical note:** The brainstorm-gate hook has an ADDITIONAL primary guard:
```typescript
if (!existsSync(join(baseDir, ".hermes"))) {
  return; // Skip — not a Hermes session
}
```

This prevents cross-agent interference when Hermes is loaded alongside other plugins.

---

## Phase 2 Completion

**Status:** ✅ SOURCE VERIFICATION COMPLETE  
**Hook Count:** 29/29 verified in source  
**Real Session Testing:** Deferred to container ship phase  

**Next:** Move to Phase 3 (Delegation) and Phase 7 (Container Ship) for real session verification.
