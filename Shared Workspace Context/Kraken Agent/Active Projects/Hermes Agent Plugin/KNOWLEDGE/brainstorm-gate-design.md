# KNOWLEDGE: Brainstorm Gate — Critical Design Decision

**File:** `src/hooks/brainstorm-gate.ts`  
**Version:** v3-overhaul (this build)  
**Last Updated:** 2026-04-14  

---

## What This Hook Does

The brainstorm gate is a **HARD-GATE** that prevents code generation in early phases. In `idle`, `analyze`, and `plan` phases, it blocks attempts to write files or make edits until a `design.md` exists at project root with `[APPROVED]` marker.

---

## The Critical Bug (v2.3.5)

**Bug:** Hook fired for ALL agents when `.hermes/` directory doesn't exist, blocking Spider Agent's coder subagent.

**Root Cause:** No directory existence guard. The hook used `isHermesAgent(input.agent)` check BUT this returns true for Hermes subagents (analyst, builder, etc.) which Spider Agent's coder might share context with.

**Evidence:** DEBUG-HERMES-BRAINSTORM-GATE-BLOCKS-SPIDER-CODER-2026-04-08.md (full forensic)

**Impact:** Spider Agent coder reported success (`toolCalls: 0` — no actual tools called) but no file was created.

---

## The Fix Applied

**Decision:** Add `.hermes/` directory existence check as PRIMARY guard.

**Rationale:** The `.hermes/` directory is created by Hermes when it initializes. If it doesn't exist, Hermes isn't active in this session — no other agent should be gated.

```typescript
// Line 47-48 in src/hooks/brainstorm-gate.ts
export function createBrainstormGateHook() {
  return async (input, output) => {
    // PRIMARY GUARD: Only fire when Hermes session is active
    if (!existsSync(join(input.directory ?? ".", ".hermes"))) {
      console.log(`[brainstorm-gate] SKIP: no .hermes directory — not a Hermes session`);
      return;
    }
    
    // SECONDARY GUARD: Agent identity
    if (!isHermesAgent(input.agent)) {
      console.log(`[brainstorm-gate] SKIP: agent=${input.agent} is not Hermes`);
      return;
    }
    // ... rest of hook
  };
}
```

**Note:** The existing `isHermesAgent(input.agent)` at line 48 is now the SECONDARY guard. The `.hermes/` directory check is the PRIMARY guard that fires first.

---

## Phase State Flow

```
Session Start
    ↓
Hermes initializes
    ↓
Creates ~/.hermes/ directory
    ↓
Phase: IDLE
    ↓
User says "build X"
    ↓
Brainstorm gate fires (phase=IDLE, .hermes/ exists → gate active)
    ↓
[BLOCKED] until design.md created + [APPROVED] marker
    ↓
Phase: ANALYZE (after user approves brainstorm)
    ↓
Phase: PLAN (after save_plan)
    ↓
Phase: BUILD (after phase_complete("build"))
    ↓
Brainstorm gate is NOW INACTIVE (phase not in IDLE/ANALYZE/PLAN)
```

---

## Design Doc Validation

The gate checks for design.md in two ways:

1. **Design doc exists?** — If not, append `[BRAINSTORM GATE]` block to message
2. **Design doc approved?** — If exists but no `[APPROVED]` marker, append approval required message

Only when BOTH conditions are met does the gate allow code to pass through.

---

## Trace Logging

Every guard condition should log for debugging:

```typescript
console.log(`[brainstorm-gate] agent=${input.agent} phase=${phase} hasCodeBlocks=${hasCodeBlocks}`);
```

This allows debugging when the gate fires or doesn't fire unexpectedly.

---

## Files Involved

| File | Role |
|------|------|
| `src/hooks/brainstorm-gate.ts` | Main hook implementation |
| `src/config/agent-identity.ts` | `isHermesAgent()` function |
| `src/config/constants.ts` | `PHASES` constants |
| `src/config/constants.ts` | `PHASE_TRANSITIONS` map |

---

## Verification Commands

```bash
# Verify guard exists in source
grep -n ".hermes" src/hooks/brainstorm-gate.ts

# Verify hook fires for Hermes session
# (test in real OpenCode session)

# Verify hook does NOT fire for Spider when Hermes is loaded
# (test Spider coder subagent — should not be blocked)
```
