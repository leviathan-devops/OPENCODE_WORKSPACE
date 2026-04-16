# Hermes Agent v3.0 — Hook Architecture

## Overview

Hermes Agent has **29 hooks** that enforce the 6-phase workflow and protect against common failure modes.

## Hook Categories

### Phase Enforcement Hooks

| Hook | Phase | Purpose |
|------|-------|---------|
| `brainstorm-gate` | Brainstorm | Blocks code until design is approved |
| `tdd-enforcer` | Build | Blocks build without test first |
| `plan-validator` | Plan | Rejects TBD/placeholder content |
| `phase-monitor` | All | Tracks phase transitions |

### Delegation Hooks

| Hook | Purpose |
|------|---------|
| `delegation-gate` | Blocks coder without reviewer |
| `delegation-ledger` | Records all delegation decisions |

### Security Hooks

| Hook | Purpose |
|------|---------|
| `scope-guard` | Prevents task hijacking |
| `guardrails` | Anti-slop patterns |
| `adversarial-check` | Detects prompt injection |
| `adversarial-detector` | Session-level adversarial tracking |

### Memory Hooks

| Hook | Purpose |
|------|---------|
| `knowledge-injector` | Injects 2nd-brain context every turn |
| `knowledge-curator` | Stores learned patterns |
| `snapshot-writer` | Saves session state |

### Self-Improvement Hooks

| Hook | Purpose |
|------|---------|
| `supervisor-loop-hook` | Graeme's 3-agent improvement loop |
| `self-review` | Blocks self-approval |
| `anti-rationalization` | Prevents rationalization of bad decisions |

### State Management Hooks

| Hook | Purpose |
|------|---------|
| `compaction` | Context compaction |
| `context-budget` | Token budget tracking |
| `system-enhancer` | System prompt enhancement |

## Agent Identity Guards

All 29 Hermes hooks have `isHermesAgent()` guards:

```typescript
import { isHermesAgent } from '../config/agent-identity.ts';

if (!isHermesAgent(agentId)) {
  return; // Skip — only fire for Hermes agents
}
```

This ensures Hermes hooks don't interfere with Spider Agent, Kraken, or other plugins.

## Hook Execution Order

Hooks fire in registration order. For Hermes + Spider coexistence:

1. Spider's global hooks (guardrails, anti-slop)
2. Hermes-specific hooks (only fire when `isHermesAgent()`)

## Critical Hook: brainstorm-gate

**File:** `src/hooks/brainstorm-gate.ts`

This is the most critical hook — it was the cause of v2.3.5's removal from opencode.json.

### Guard Logic

```typescript
// PRIMARY GUARD: Only fire when Hermes session is active
const baseDir = input.directory ?? process.cwd();
if (!existsSync(join(baseDir, ".hermes"))) {
  return; // Skip — not a Hermes session
}

// SECONDARY GUARD: Only fire for Hermes agents
if (!isHermesAgent(agentId)) {
  return;
}
```

### Why Two Guards?

1. `.hermes/` directory check: Prevents firing in non-Hermes sessions entirely
2. `isHermesAgent()` check: Double-protection for Hermes-specific behavior

## Phase Transition Map

```typescript
const PHASE_TRANSITIONS = {
  IDLE: ['BRAINSTORM'],
  BRAINSTORM: ['PLAN'],
  PLAN: ['BUILD'],
  BUILD: ['REVIEW'],
  REVIEW: ['DEBUG', 'COMPLETE'],
  DEBUG: ['REVIEW', 'COMPLETE'],
  COMPLETE: ['IDLE']
};
```

## Hook Verification

All 29 hooks verified in `HOOK_VERIFICATION_LOG.md`:

```
grep -r "isHermesAgent" src/hooks/ | wc -l
# Output: 58 (29 hooks × 2 lines each = import + guard)
```
