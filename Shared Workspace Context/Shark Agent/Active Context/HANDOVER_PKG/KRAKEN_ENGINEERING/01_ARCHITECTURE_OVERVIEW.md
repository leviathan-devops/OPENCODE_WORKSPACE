# Shark Agent v4.8.3 — Architecture Overview

## System Purpose

Shark Agent is an **Execution Brain** plugin for OpenCode that manages development workflows through gate-based phases:
```
PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY
```

## Core Components

### 1. Hooks (`src/hooks/v4.1/`)

| Hook | Purpose |
|------|---------|
| `session-hook.ts` | Brain initialization on session.created |
| `chat-message-hook.ts` | Agent identity detection, brain setCurrentAgent() |
| `guardian-hook.ts` | **FIREWALL** — L0-L8 pattern enforcement |
| `gate-hook.ts` | Evidence collection, gate advancement |
| `tool-summarizer-hook.ts` | Output reduction (grep→summary, ls→truncated) |
| `compacting-hook.ts` | Session state compaction |
| `system-transform-hook.ts` | System prompt injection |

### 2. State Management (`src/shared/`)

| Component | Purpose |
|-----------|---------|
| `state-store.ts` | Domain-owned state (execution-state, thinking-state, etc.) |
| `gates.ts` | GateManager — mechanical phase enforcement |
| `evidence.ts` | EvidenceCollector — mandatory proof collection |
| `guardian.ts` | Zone-based path protection |
| `messenger.ts` | Brain-to-brain communication |

### 3. Tools (`src/tools/`)

| Tool | Purpose |
|------|---------|
| `shark-status.ts` | Shows current brain, gate, iteration |
| `shark-gate.ts` | Manual gate control (advance, status) |
| `shark-evidence.ts` | View/manage evidence collection |
| `shark-test-runner.ts` | End-to-end test execution |
| `checkpoint.ts` | State snapshots for recovery |

## Firewall Architecture (L0-L8)

```
L0: IDENTITY WALL
    └── isSharkAgent() check — blocks if brain unknown
    
L1: THEATRICAL VERIFICATION (18 patterns)
    └── Blocks: grep | wc, cat | grep, counting theater
    
L2: FAKE TEST RUNNER (13 patterns)  
    └── Blocks: node run-tests.js, jest, vitest, npm test
    
L3: SOURCE INSPECTION (12 patterns)
    └── Blocks: test -f dist/, grep -r src/, file existence ≠ runtime
    
L4: WRONG CONTAINER (5 patterns)
    └── Blocks: opencode container run/start/exec
    
L5: ANTI-DERAILMENT (10 sublayers, 140+ patterns)
    ├── L5.1: Host Fallback (13)
    ├── L5.2: Success Claim (16) + mechanical evidence
    ├── L5.3: Model Restriction (15)
    ├── L5.4: Mock/Stub (12) + mechanical evidence
    ├── L5.5: Simplification (11)
    ├── L5.6: Confusion Pretend (12)
    ├── L5.7: Scope Creep (10)
    ├── L5.8: Undermining (12)
    ├── L5.9: Impatience (9)
    └── L5.10: Self-Reference (12)
    
L6: LOCAL FILE PROTECTION
    └── Zone-based blocking (SYSTEM, CONFIG, PERSONAL)
    
L7: VERIFICATION GATE
    └── Evidence file requirements
    
L8: BEHAVIORAL INTELLIGENCE
    └── Sophisticated pattern detection
```

## Hook Integration Pattern (v4.7-hotfix-v3)

```typescript
export function createSharkHooks(
  guardian: Guardian,
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector,
  peerDispatch: SharkPeerDispatch | undefined,
  stateStore: StateStore,
  messenger: SharkMessenger
): Hooks {
  return {
    event: createSessionHook(gateManager, evidenceCollector, peerDispatch, stateStore, messenger),
    'chat.message': createChatMessageHook(),
    'tool.execute.before': createGuardianHook(guardian),
    'tool.execute.after': (input, output) => {
      createToolSummarizerHook()(input, output);  // FIRST
      createGateHook(gateManager, evidenceCollector, peerDispatch)(input, output);  // SECOND
    },
    'experimental.session.compacting': createCompactingHook(gateManager),
    'experimental.chat.system.transform': createSystemTransformHook(gateManager, peerDispatch),
  };
}
```

## Critical Rules

1. **All firewall patterns go in `guardian-hook.ts`** — NOT `guardian.ts`
2. **Pattern matching checks `toolArgs` ONLY** — Not agentMessage or output
3. **Guardian returns early if not shark agent:** `if (!getCurrentAgent()) return;`
4. **Throw errors to block** — `console.log` is advisory only
5. **Preserve v4.7-hotfix-v3 micro-architecture** — Memory optimizations, session cleanup

## Session Cleanup (CRITICAL)

On `session.ended`, MUST call ALL cleanup functions:
```typescript
function handleSessionEnded(stateStore: StateStore, messenger: SharkMessenger): void {
  stateStore.cleanup();        // Clear data/versions/watchers Maps
  messenger.cleanup();          // Clear queues/pendingAcks/receivedAcks
  dirCreationAttempted = false;
  resetSystemTransformState(); // Clear lastInjectedGate
  resetGateHookState();        // Clear lastDeliveryBlocked
  setCurrentAgent(undefined);
  clearCurrentAgent();
}
```

## Checkpoint Guardian System

Checkpoints in `.checkpoints/` are protected:
- Shipped checkpoints (with `.shipped` marker) are READ-ONLY
- Only escape hatch is user explicitly prompting "OVERRIDE"
