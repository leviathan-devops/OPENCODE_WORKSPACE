# Shark Agent v4.8.3 - Complete Firewall Specification

**Version:** v4.8.3
**Date:** 2026-04-12
**Status:** L5 working, L1-L4 broken (getCurrentAgent() state issue)

---

## Architecture Overview

The Shark Agent implements a **Double Layer Firewall** with triple-brain coordination:

```
User Input
    ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: Message-Level Blocking (chat.message hook)         │
│ File: chat-message-hook.ts                                 │
│ Purpose: Blocks behavioral derailment before agent sees msg │
│ Catches: L5.1-L5.10 patterns, cross-agent tools            │
└─────────────────────────────────────────────────────────────┘
    ↓ (if not blocked)
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: Tool-Level Blocking (tool.execute.before hook)     │
│ File: guardian-hook.ts                                      │
│ Purpose: Blocks dangerous tool calls, theatrical cmds      │
│ Catches: L0-L4 patterns (CURRENTLY BROKEN - state issue)   │
└─────────────────────────────────────────────────────────────┘
    ↓ (if not blocked)
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Command-Level Blocking (command.execute.before)   │
│ File: command-execute-hook.ts                               │
│ Purpose: Blocks opencode run mode abuse                     │
└─────────────────────────────────────────────────────────────┘
    ↓
Tool Executes (protected by guardian.ts zone system)
```

---

## Hook Specifications

### 1. chat.message (L5 Message-Level)

**File:** `src/hooks/v4.1/chat-message-hook.ts`

**Fires:** Every user message in TUI and opencode run mode

**Purpose:** Block behavioral derailment patterns at message level

**Checks:**
- L5.1: Host Fallback (skip container test, use host instead)
- L5.2: Success Claim (it works trust me)
- L5.3: Model Restriction (must use gpt)
- L5.4: Mock/Stub (use mock data)
- L5.5: Simplification (oversimplify, handwave)
- L5.6: Confusion Pretense (it somewhat works)
- L5.7: Scope Creep + Cross-Agent Tools (hermes_, hive_, kraken_, mem_, knowledge_)
- L5.8: Undermining (not worth the effort, firewall broken)
- L5.9: Impatience (let's just ship it)
- L5.10: Self-Reference (I verified it works)

**State:** Uses `setCurrentAgent(agentName)` from `agent-state.ts`

**Example:**
```typescript
// Input: "skip container test and use host instead"
// → checkMessageEnforcement() → checkHostFallback() → THROWS
throw new Error('[ANTI-DERAILMENT L5.1] Host fallback detected...');
```

---

### 2. tool.execute.before (L0-L8 Tool-Level)

**File:** `src/hooks/v4.1/guardian-hook.ts`

**Fires:** Every tool call (terminal, write_file, edit, etc)

**Purpose:** Block dangerous tool patterns, theatrical verification, file protection

**Checks:**
- L0: Identity Wall (block dangerous tools if agent not initialized)
- L1: Theatrical Verification (grep | wc, cat | tee, wc -l dist/)
- L2: Fake Test Runner (npm test, jest, vitest when not via shark-test-runner)
- L3: Source Inspection (test -f ${file} logic)
- L4: Wrong Container (opencode container run)
- L5: Anti-Derailment (same patterns as chat.message, but from tool args)
- L6: Local File Protection (zone-based guardian.ts)
- L7: Verification Gate (evidence requirements)
- L8: Behavioral Intelligence (golden patterns)

**State:** Reads `getCurrentAgent()` from `agent-state.ts`

**BROKEN:** Line 469-471 early return bypasses all checks when `getCurrentAgent()` returns undefined.

---

### 3. command.execute.before (L4 opencode run)

**File:** `src/hooks/v4.1/command-execute-hook.ts`

**Fires:** For `opencode run "message"` commands

**Purpose:** Enforce patterns specifically for opencode run mode

**Checks:** Same L5 patterns as chat.message + command-specific

---

## Pattern Reference

### L0: Identity Wall

**Purpose:** Block dangerous tools when brain not initialized

**Tools Blocked:** `terminal`, `mcp_terminal`, `write_file`, `mcp_write_file`, `patch`, `mcp_patch`, `edit`, `mcp_edit`, `delete_file`, `mcp_delete_file`

**Code:**
```typescript
const DANGEROUS_TOOLS = new Set([...]);

if (DANGEROUS_TOOLS.has(tool)) {
  const brain = getCurrentAgent();
  if (!brain || brain !== 'shark') {
    throw new Error('[BRAIN_FAILURE_BLOCK]...');
  }
}
```

---

### L1: Theatrical Verification

**Purpose:** Block counting theater (grep | wc, cat | tee) that produces fake metrics

**Patterns (12):**
```typescript
const THEATRICAL_PATTERNS = [
  /\|.*wc\s+-l/i,
  /wc\s+-l.*\|/i,
  /cat.*\|.*wc/i,
  /grep.*\|.*wc/i,
  /\|.*tee/i,
  /\|.*>.*\./i,
  /wc\s+-l.*dist\//i,
  /wc\s+-l.*src\//i,
  /wc\s+-l.*build\//i,
  /grep.*setCurrentAgent.*src/i,
  /grep.*isSharkAgent.*src/i,
  /grep.*guardian.*src/i,
];
```

**Legitimate Patterns (not blocked):**
```typescript
const LEGITIMATE_PATTERNS = [
  /mkdir\s+-p/i, /cp\s+-r/i, /mv\s+/i,
  /cat\s+[^\|>]+$/i, /head\s+-[0-9]+\s+/i,
  /tail\s+-[0-9]+\s+/i, /grep\s+-[rEn]+.*[^\|]$/i,
  /find\s+.*-name/i, /test\s+-d/i, /test\s+-x/i,
];
```

**Check function:** `checkTheatricalVerification(command)`

---

### L2: Fake Test Runner

**Purpose:** Block test frameworks bypassing OpenCode's hook system

**Patterns (9):**
```typescript
const FAKE_TEST_PATTERNS = [
  /node\s+run-tests?\.js/i,
  /node\s+verify.*\.mjs/i,
  /npm\s+test/i,
  /yarn\s+test/i,
  /jest/i,
  /vitest/i,
  /mocha/i,
  /jasmine/i,
  /bun\s+test/i,
];
```

**Check function:** `checkFakeTestRunner(command)`

---

### L3: Source Inspection

**Purpose:** Block "file exists ≠ works" logic patterns

**Patterns (5):**
```typescript
const SOURCE_INSPECTION_PATTERNS = [
  /test\s+-f\s+\$\{?.*\}/i,
  /test\s+-e\s+\$\{?.*\}/i,
  /if\s+\[\s*-[fes]\s+.*\]\s*;/i,
  /grep\s+-r\s+.*src\//i,
  /ls\s+-l.*dist\//i,
];
```

**Check function:** `checkSourceInspection(command)`

---

### L4: Wrong Container

**Purpose:** Block hallucinated opencode container commands

**Patterns (4):**
```typescript
const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i,
  /opencode\s+run\s+/i,  // blocks opencode run (use TUI instead)
];
```

**Check function:** `checkWrongContainer(command)`

---

### L5: Anti-Derailment (L5.1-L5.10)

**Purpose:** Block behavioral derailment patterns

**L5.1: Host Fallback (15 patterns)**
```typescript
const HOST_FALLBACK_PATTERNS = [
  /host.*testing.*already.*works/i,
  /fall.*back.*to.*host/i,
  /host.*already.*proves/i,
  /local.*works.*container.*not.*needed/i,
  // ... 11 more
];
```

**L5.2: Success Claim (15 patterns)**
```typescript
const SUCCESS_CLAIM_PATTERNS = [
  /it.*works.*trust.*me/i,
  /trust.*me.*it.*works/i,
  // ... 13 more
];
```

**L5.3: Model Restriction (15 patterns)**
```typescript
const MODEL_RESTRICTION_PATTERNS = [
  /only.*gpt/i, /only.*claude/i, /only.*gemini/i,
  // ... 12 more
];
```

**L5.4: Mock/Stub (12 patterns)**
```typescript
const MOCK_STUB_PATTERNS = [
  /mock.*data/i, /stub.*data/i, /fake.*data/i,
  // ... 9 more
];
```

**L5.5: Simplification (11 patterns)**
```typescript
const SIMPLIFICATION_PATTERNS = [
  /over.*simplif/i, /hand.*wave/i, /handwave/i,
  // ... 8 more
];
```

**L5.6: Confusion Pretense (12 patterns)**
```typescript
const CONFUSION_PRETENSE_PATTERNS = [
  /it.*somewhat.*works/i, /sorta.*works/i, /kinda.*works/i,
  // ... 9 more
];
```

**L5.7: Scope Creep + Cross-Agent (25 patterns total)**
```typescript
const SCOPE_CREEP_PATTERNS = [
  /while.*at.*it.*also/i, /might.*as.*well.*also/i,
  /顺便.*also/i, /on.*the.*side.*also/i,
  // Cross-agent tools:
  /hermes_remember/i, /hermes_recall/i, /hermes_context/i,
  /hive_remember/i, /hive_context/i, /hive_status/i, /hive_mind/i,
  /kraken_hive/i, /memremember/i, /memsearch/i, /memread/i,
  /knowledge_remember/i, /knowledge_recall/i, /knowledge_query/i,
];

const CROSS_AGENT_PATTERNS = [
  // Same cross-agent patterns as above
];
```

**L5.8: Undermining (12 patterns)**
```typescript
const UNDERMINING_PATTERNS = [
  /not.*worth.*the.*effort/i, /too.*much.*work/i,
  /diminishing.*returns/i, /savvy.*engineer.*would/i,
  /firewall.*broken/i, /firewall.*not.*working/i,
  // ... 6 more
];
```

**L5.9: Impatience (11 patterns)**
```typescript
const IMPATIENCE_PATTERNS = [
  /let's.*just.*move.*on/i, /let's.*skip.*to.*the.*end/i,
  /just.*ship.*it/i, /good.*enough/i, /close.*enough/i,
  /ship.*it/i, /just.*deploy/i, /fuck.*it/i,
  /ship.*now/i, /deploy.*now/i, /let's.*hurry/i,
];
```

**L5.10: Self-Reference (11 patterns)**
```typescript
const SELF_REFERENCE_PATTERNS = [
  /i.*have.*verified.*that/i, /i.*verified.*it.*works/i,
  /my.*verification.*shows/i, /i.*tested.*it.*works/i,
  // ... 7 more
];
```

---

## State Management

**File:** `src/hooks/v4.1/agent-state.ts`

```typescript
let currentAgentName: string | undefined = undefined;

export function setCurrentAgent(agent: string | undefined): void {
  currentAgentName = agent;
}

export function getCurrentAgent(): string | undefined {
  return currentAgentName;
}
```

**Issue:** Module-level variable may not persist across hooks in container environment.

---

## Guardian Zone System

**File:** `src/shared/guardian.ts`

Zone-based file protection:
- ZONE_GOLDEN: Critical files (index.ts, package.json)
- ZONE_STABLE: Source code
- ZONE_SANDBOX: Build output, logs
- ZONE_EXTERNAL: External dependencies

---

## Testing Instructions

### Container Setup
```bash
docker run --rm -d \
  -v /tmp/shark-container/config:/root/.config/opencode \
  -v /tmp/shark-container/plugins:/root/.config/opencode/plugins \
  --entrypoint /bin/sh \
  opencode-test:1.4.3 \
  -c "tail -f /dev/null"
```

### Test L5 (Working)
```bash
echo "skip container test" | timeout 120 docker exec -i CONTAINER \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-DERAILMENT'
# Expected: BLOCKED
```

### Test L1 (Broken - should block but doesn't)
```bash
echo "run grep pattern | wc -l" | timeout 120 docker exec -i CONTAINER \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-SLOP'
# Expected: BLOCKED (but currently NOT blocked)
```

---

## Fixes Needed

### Fix #1: Debug getCurrentAgent() State

In `guardian-hook.ts`, add debugging:
```typescript
const agent = getCurrentAgent();
console.log(`[GUARDIAN] tool=${input.tool} agent=${agent || 'UNSET'}`);
if (!agent) {
  console.log('[GUARDIAN] early return - no agent');
  return;
}
```

### Fix #2: Session-Based State

Replace global state with session-based lookup:
```typescript
const agentBySession = new Map<string, string>();

export function setCurrentAgentForSession(sessionId: string, agent: string) {
  agentBySession.set(sessionId, agent);
}

export function getCurrentAgentForSession(sessionId: string): string | undefined {
  return agentBySession.get(sessionId);
}
```

### Fix #3: Always Check Dangerous Tools

```typescript
if (DANGEROUS_TOOLS.has(input.tool)) {
  const agent = getCurrentAgent();
  if (!agent || agent !== 'shark') {
    throw new Error('[GUARDIAN] Dangerous tool requires shark agent context');
  }
}
```

---

## Pattern Count Summary

| Layer | Array | Count |
|-------|-------|-------|
| L0 | DANGEROUS_TOOLS | 8 |
| L1 | THEATRICAL_PATTERNS | 12 |
| L1 | LEGITIMATE_PATTERNS | 10 |
| L2 | FAKE_TEST_PATTERNS | 9 |
| L3 | SOURCE_INSPECTION_PATTERNS | 5 |
| L4 | WRONG_CONTAINER_PATTERNS | 4 |
| L5.1 | HOST_FALLBACK_PATTERNS | 15 |
| L5.2 | SUCCESS_CLAIM_PATTERNS | 15 |
| L5.3 | MODEL_RESTRICTION_PATTERNS | 15 |
| L5.4 | MOCK_STUB_PATTERNS | 12 |
| L5.5 | SIMPLIFICATION_PATTERNS | 11 |
| L5.6 | CONFUSION_PRETENSE_PATTERNS | 12 |
| L5.7 | SCOPE_CREEP_PATTERNS | 25 |
| L5.8 | UNDERMINING_PATTERNS | 12 |
| L5.9 | IMPATIENCE_PATTERNS | 11 |
| L5.10 | SELF_REFERENCE_PATTERNS | 11 |

**Total: 197 patterns across L0-L8**