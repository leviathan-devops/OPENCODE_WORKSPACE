# Shark Agent v4.8.3 Build Context

**Last Updated:** 2026-04-12
**Status:** NOT SHIP READY - L1-L4 tool-level blocking broken

---

## Quick Status

| Component | Status | Notes |
|-----------|--------|-------|
| Build | ✅ PASS | 0.60 MB bundle, 102 modules |
| Pattern Counts | ✅ PASS | 15/15 arrays verified (156 total patterns) |
| L5 Message Blocking | ✅ PASS | 11/11 tests blocking correctly |
| L1-L4 Tool Blocking | ❌ FAIL | `getCurrentAgent()` not persisting |
| Memory Architecture | ✅ PASS | No nested agents |

---

## What Was Built

### Shark Agent v4.8.3 - Double Layer Firewall

**Layer 1 (Tool-level):** `tool.execute.before` hook via `guardian-hook.ts`
- L0: Identity Wall
- L1: Theatrical Verification (grep | wc patterns)
- L2: Fake Test Runner (npm test, jest, etc)
- L3: Source Inspection (test -f, etc)
- L4: Wrong Container (opencode container run)
- L5: Anti-Derailment (143 patterns for behavioral blocking)
- L6: Local File Protection
- L7: Verification Gate
- L8: Behavioral Intelligence

**Layer 2 (Message-level):** `chat.message` hook via `chat-message-hook.ts`
- Same L5 patterns for message-based enforcement
- Cross-agent tool blocking (hermes, hive, kraken, mem, knowledge)
- Works in both TUI and `opencode run` modes

**Layer 3 (Command-level):** `command.execute.before` hook
- For `opencode run` mode specifically

---

## Directory Structure

```
V4.8.3 Build/
├── README.md                           # This file
├── BUILD_STATUS.md                     # Current status and findings
├── FIREWALL_SPEC.md                    # Complete firewall specification
├── CHECKPOINT_3.0/                     # Last working build
│   ├── CHECKPOINT_MANIFEST.md
│   ├── logs/
│   └── FIREWALL_TEST_RESULTS.md
├── CHECKPOINT_3.1/                     # Audit findings (current)
│   └── FIREWALL_AUDIT.md
├── src/
│   ├── index.ts                        # Plugin entry point
│   ├── hooks/
│   │   └── v4.1/
│   │       ├── guardian-hook.ts         # L0-L8 tool-level blocking
│   │       ├── chat-message-hook.ts    # L5 message-level blocking
│   │       ├── command-execute-hook.ts # opencode run enforcement
│   │       ├── messages-transform-hook.ts
│   │       ├── gate-hook.ts
│   │       ├── session-hook.ts
│   │       ├── compacting-hook.ts
│   │       ├── system-transform-hook.ts
│   │       ├── tool-summarizer-hook.ts
│   │       ├── agent-state.ts          # getCurrentAgent/setCurrentAgent
│   │       └── utils.ts
│   ├── shared/
│   │   ├── guardian.ts                 # Zone-based file protection
│   │   ├── gates.ts                    # Gate manager
│   │   ├── evidence.ts                 # Evidence collector
│   │   ├── state-store.ts              # State management
│   │   ├── messenger.ts                # Inter-brain communication
│   │   └── agent-identity.ts           # isSharkAgent()
│   ├── shark/
│   │   └── macro/
│   │       ├── peer-dispatch.ts
│   │       └── brains.ts
│   └── tools/
│       ├── shark-status.ts
│       ├── shark-gate.ts
│       ├── shark-evidence.ts
│       ├── checkpoint.ts
│       └── shark-test-runner.ts
├── dist/
│   └── index.js                        # Built bundle (0.60 MB)
├── tests/
│   ├── test-patterns.ts                # Pattern count verification
│   ├── test-patterns.mjs
│   └── test-guardian-patterns.ts
└── logs/
```

---

## Critical Issue: L1-L4 Tool-Level Blocking Not Working

### Root Cause

In `guardian-hook.ts:469-471`:
```typescript
if (!getCurrentAgent()) {
  return;  // ← ALL L1-L4 checks bypassed
}
```

The `getCurrentAgent()` function in `agent-state.ts` returns `undefined` when called from `tool.execute.before`, even though `chat.message` has already set it via `setCurrentAgent()`.

### Why This Happens

1. `chat.message` fires → `setCurrentAgent('shark')` is called
2. Agent processes message, decides to call a tool
3. `tool.execute.before` fires → `getCurrentAgent()` returns `undefined`
4. Guardian hook returns early → no L1-L4 checks run

### Why L5 Works

The `chat.message` hook catches the message BEFORE the agent processes it. The L5 patterns are checked at this point and the message is blocked. This is why L5 message-level blocking works but L1-L4 tool-level doesn't.

### Architecture Diagram

```
User Input
    ↓
chat.message hook ← L5 blocking here (WORKS)
    ↓
Agent Receives Message
    ↓
Agent Decides to Call Tool
    ↓
tool.execute.before hook ← L1-L4 checks here (BROKEN - getCurrentAgent returns null)
    ↓
Tool Executes (UNPROTECTED)
```

---

## Pattern Reference

### L5 Anti-Derailment Patterns (11 sub-layers, 143 patterns)

| Layer | Patterns | Count | Example |
|-------|----------|-------|---------|
| L5.1 | HOST_FALLBACK_PATTERNS | 15 | skip container test, use host instead |
| L5.2 | SUCCESS_CLAIM_PATTERNS | 15 | it works trust me, clearly works |
| L5.3 | MODEL_RESTRICTION_PATTERNS | 15 | only gpt can do this, must use claude |
| L5.4 | MOCK_STUB_PATTERNS | 12 | mock data, fake api response |
| L5.5 | SIMPLIFICATION_PATTERNS | 11 | hand wave, oversimplify |
| L5.6 | CONFUSION_PRETENSE_PATTERNS | 12 | it somewhat works, kinda correct |
| L5.7 | SCOPE_CREEP_PATTERNS | 12+13 | while at it, cross-agent tools |
| L5.8 | UNDERMINING_PATTERNS | 12 | not worth the effort, firewall broken |
| L5.9 | IMPATIENCE_PATTERNS | 11 | let's just ship it, good enough |
| L5.10 | SELF_REFERENCE_PATTERNS | 11 | I verified it works, my testing confirms |

### L1-L4 Tool Patterns

| Layer | Patterns | Count | Example |
|-------|----------|-------|---------|
| L1 | THEATRICAL_PATTERNS | 12 | grep | wc, cat | tee |
| L2 | FAKE_TEST_PATTERNS | 9 | npm test, jest, vitest |
| L3 | SOURCE_INSPECTION_PATTERNS | 2 | test -f ${file} |
| L4 | WRONG_CONTAINER_PATTERNS | 4 | opencode container run |
| L0 | DANGEROUS_TOOLS | 8 | terminal, write_file, edit, etc |

---

## Container Testing Instructions

### Start Container
```bash
docker run --rm -d \
  -v /tmp/shark-container/config:/root/.config/opencode \
  -v /tmp/shark-container/plugins:/root/.config/opencode/plugins \
  --entrypoint /bin/sh \
  opencode-test:1.4.3 \
  -c "tail -f /dev/null"
```

### Config Setup
The config at `/tmp/shark-container/config/opencode.json` should point to:
```json
{
  "plugin": ["/root/.config/opencode/plugins/shark-agent-v4.8.3"]
}
```

The plugin at `/tmp/shark-container/plugins/shark-agent-v4.8.3/` should contain:
- `index.js` (built bundle)
- `package.json`

### Run Tests

**L5 Message-Level (WORKING):**
```bash
echo "skip container test" | timeout 120 docker exec -i CONTAINER \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-DERAILMENT'
```

**L1 Theatrical (BROKEN - should error but doesn't):**
```bash
echo "run grep pattern | wc -l" | timeout 120 docker exec -i CONTAINER \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-SLOP'
```

### Verify Patterns
```bash
cd V4.8.3\ Build
bun run test-patterns.ts
# Expected: 15 passed, 0 failed
```

---

## How to Fix L1-L4

### Option 1: Debug State Persistence

Add logging to `guardian-hook.ts`:
```typescript
const agent = getCurrentAgent();
console.log(`[GUARDIAN] tool=${input.tool} agent=${agent || 'UNSET'}`);
if (!agent) {
  console.log('[GUARDIAN] early return - no agent');
  return;
}
```

### Option 2: Use Session ID Instead of Global State

Replace `getCurrentAgent()` with a session-based lookup:
```typescript
// In agent-state.ts
const agentBySession = new Map<string, string>();

export function setCurrentAgentForSession(sessionId: string, agent: string) {
  agentBySession.set(sessionId, agent);
}

export function getCurrentAgentForSession(sessionId: string): string | undefined {
  return agentBySession.get(sessionId);
}
```

### Option 3: Add Agent Check at chat.message Instead

Instead of early return in guardian-hook, always process but check agent identity:
```typescript
export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    // ALWAYS run L0 identity check for dangerous tools
    if (DANGEROUS_TOOLS.has(input.tool)) {
      const agent = getCurrentAgent();
      if (!agent || agent !== 'shark') {
        throw new Error('[GUARDIAN] Dangerous tool requires shark agent context');
      }
    }
    
    // Continue with L1-L8 checks only if agent is set
    const agent = getCurrentAgent();
    if (!agent) return;
    
    // ... rest of checks
  };
}
```

---

## Session History (for debugging)

### 2026-04-12 - Checkpoint 3.1
- Full firewall audit completed
- L1-L4 broken: `getCurrentAgent()` not persisting
- L5 working: 11/11 message-level tests pass
- Root cause identified in FIREWALL_AUDIT.md

### 2026-04-12 - Checkpoint 3.0
- Added cross-agent blocking (hermes, hive, kraken, mem, knowledge)
- Expanded L5 patterns to match guardian-hook completeness
- Found architecture gap: L5 vs L1-L4 blocking different layers

### 2026-04-12 - Initial Build from Handover
- Read KRAKEN_ARCHITECTURE_AUDIT.md
- Fixed memory issues (no nested agents)
- Fixed missing extractTextFromMessage() function
- Expanded command-execute-hook.ts patterns

---

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/v4.1/guardian-hook.ts` | L0-L8 tool-level blocking (L1-L4 broken) |
| `src/hooks/v4.1/chat-message-hook.ts` | L5 message-level blocking (working) |
| `src/hooks/v4.1/agent-state.ts` | Module-level state for agent tracking |
| `src/shared/guardian.ts` | Zone-based file protection |
| `src/shared/gates.ts` | Gate manager for quality gates |

---

## Next Steps

1. **FIX**: Make `getCurrentAgent()` work correctly across hooks
2. **TEST**: Verify L1-L4 block properly in container TUI
3. **SHIP**: When L1-L4 + L5 both working, ready for production

---

## Handover Notes

If this session crashes again:
1. Check `src/hooks/v4.1/agent-state.ts` for state persistence issues
2. Check `src/hooks/v4.1/guardian-hook.ts:469-471` for early return condition
3. Run `bun run test-patterns.ts` to verify pattern integrity
4. Test L5 first (working), then L1-L4 (broken)