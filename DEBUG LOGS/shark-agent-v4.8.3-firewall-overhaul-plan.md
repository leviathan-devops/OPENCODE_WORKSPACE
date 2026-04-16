# SHARK AGENT v4.8.3 - FIREWALL OVERHAUL PLAN (KRAKEN ARCHITECTURE)

**Created:** 2026-04-14  
**Status:** IN PROGRESS  
**Checkpoint:** cp_1776181825790  
**Architecture:** Two-Layer GOLDEN Behavior Enforcement

---

## PROBLEM ANALYSIS

### Current Test Results: NOT SHIP APPROVED

| Layer | Test Coverage | Status | Issue |
|-------|--------------|--------|-------|
| L1 Theatrical | 3 tests | ⚠️ 80% | Allows `cat \| grep` without `wc` |
| L2 Fake Test Runners | 8 tests | ✅ 100% | Working |
| L3 Dangerous/Source | 6 tests | ⚠️ 67% | Allows source inspection via text |
| L4 Wrong Container | 0 tests | ⚠️ PARTIAL | Not tested |
| L5.6 Confusion Pretense | 17 tests | ⚠️ 94% | Misses "basically", "somewhat" |
| Legitimate Commands | 4 tests | ✅ 100% | Working |

### Root Cause Analysis

**Architecture Gap (Known - Doc'd in BUILD_REPORT.md Section 6):**

```
opencode run "command" → Message to AGENT → Agent responds naturally
                                    ↓
                    Guardian ONLY sees tool.execute.before
                                    ↓
                    Agent text response NEVER triggers guardian
```

**But there's a SECOND issue we just discovered:**

The `chat.message` hook currently checks **AGENT OUTPUT** (what the agent says), but NOT **USER INPUT** (what the user asks). This is why:
- `basically done` - NOT BLOCKED (agent's response wasn't checked properly)
- `somewhat working` - NOT BLOCKED (agent's response wasn't caught)

The hook needs to check BOTH:
1. User message content (can block BEFORE agent responds)
2. Agent response content (can block AFTER agent responds)

---

## TWO-LAYER ARCHITECTURE (KRAKEN DESIGN)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KRAKEN FIREWALL                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LAYER 1: Message-Based Enforcement (INPUT)                        │
│  ─────────────────────────────────────────                          │
│  Hook:      chat.message (BEFORE agent processes)                  │
│  Checks:    input.message (user's request)                          │
│  Purpose:    Block requests BEFORE agent sees them                  │
│  Status:     ❌ BROKEN - not checking input properly                 │
│                                                                      │
│  LAYER 2: Message-Based Enforcement (OUTPUT)                         │
│  ──────────────────────────────────────────                         │
│  Hook:      chat.message (AFTER agent responds)                      │
│  Checks:    output.message (agent's response)                        │
│  Purpose:    Block agent responses that contain slop                  │
│  Status:     ⚠️ PARTIAL - only checks agent output                   │
│                                                                      │
│  LAYER 3: Tool-Based Enforcement ( guardian-hook.ts )               │
│  ───────────────────────────────────────────────────                 │
│  Hook:      tool.execute.before                                      │
│  Checks:    tool args (structured tool calls)                        │
│  Purpose:    Block dangerous tool calls                              │
│  Status:     ✅ WORKING                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## FIX REQUIREMENTS

### 1. L1 Theatrical - Fix Pattern Matching

**Current:** `/cat.*\|.*wc/i` blocks ALL cat|wc combinations
**Problem:** Legitimate `cat file | grep pattern` gets blocked
**Fix:** Make THEATRICAL_PATTERNS more specific - only block counting theater

```typescript
const THEATRICAL_PATTERNS = [
  // Counting theater - wc at the end
  /\|.*wc\s+-l/i,           // ANY | wc -l (counting)
  /wc\s+-l.*\|/i,          // wc -l | (counting output)
  /cat.*\|.*wc/i,          // cat | wc (counting cat output)
  /grep.*\|.*wc/i,         // grep | wc (counting grep output)
  
  // Build verification without running
  /wc\s+-l.*dist\//i,
  /wc\s+-l.*src\//i,
  /wc\s+-l.*build\//i,
  
  // Source inspection as proof
  /ls\s+-l.*dist\//i,
];
```

### 2. L3 Source Inspection - Check USER INPUT

**Current:** Only checks tool calls
**Problem:** When user says "grep -r pattern src/" the agent may respond in text
**Fix:** Add SOURCE_INSPECTION_PATTERNS to chat.message hook (input check)

### 3. L5.6 Confusion Pretense - Add More Patterns

**Current:** Missing some variants
**Fix:** Add:
```typescript
/basically.*done/i,
/basically.*working/i,
/mostly.*done/i,
/sorta.*done/i,
/kinda.*done/i,
```

### 4. L4 Wrong Container - Test and Fix

**Pattern:** `/opencode\s+(container|run)\s+/i`
**Fix:** Test in container, ensure message-based version exists

---

## IMPLEMENTATION TASKS

### Task 1: Fix chat-message-hook.ts - Check BOTH Input and Output

**File:** `src/hooks/v4.1/chat-message-hook.ts`

**Current (BROKEN):**
```typescript
// ONLY checks agent output
const agentText = extractTextFromParts(output?.message?.parts) + ' ' + extractTextFromParts(output?.parts);
if (trimmed && trimmed.length > 0) {
  checkMessageEnforcement(trimmed);  // ← Only checks output
}
```

**FIXED:**
```typescript
// Check USER INPUT (BEFORE agent processes)
const userText = extractTextFromMessage(input) || '';
const userTrimmed = userText.trim();
if (userTrimmed && userTrimmed.length > 0) {
  checkMessageEnforcement(userTrimmed, 'INPUT');  // ← Block bad requests
}

// Check AGENT OUTPUT (AFTER agent responds)
const agentText = extractTextFromParts(output?.message?.parts) + ' ' + extractTextFromParts(output?.parts);
const agentTrimmed = agentText.trim();
if (agentTrimmed && agentTrimmed.length > 0) {
  checkMessageEnforcement(agentTrimmed, 'OUTPUT');  // ← Block bad responses
}
```

### Task 2: Add Source Inspection to Message Hook

Add to `chat-message-hook.ts`:
```typescript
const SOURCE_INSPECTION_PATTERNS = [
  /test\s+-f\s+\$\{?.*\}/i,
  /test\s+-e\s+\$\{?.*\}/i,
  /if\s+\[\s*-[fes]\s+.*\]\s*;/i,
  /grep\s+-r\s+.*src\//i,
  /ls\s+-l.*dist\//i,
];

// In checkMessageEnforcement:
checkSourceInspection(text);
```

### Task 3: Add L1 Theatrical to Message Hook

Add to `chat-message-hook.ts`:
```typescript
const THEATRICAL_PATTERNS = [
  /\|.*wc\s+-l/i,
  /wc\s+-l.*\|/i,
  /cat.*\|.*wc/i,
  /grep.*\|.*wc/i,
  /wc\s+-l.*dist\//i,
  /wc\s+-l.*src\//i,
  /wc\s+-l.*build\//i,
];

function checkTheatricalVerification(text: string): void {
  // Check legitimate first
  for (const pattern of LEGITIMATE_PATTERNS) {
    if (pattern.test(text)) return;
  }
  // Check theatrical
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`[ANTI-SLOP L1] Counting theater detected...`);
    }
  }
}
```

### Task 4: Add L4 Wrong Container to Message Hook

Add to `chat-message-hook.ts`:
```typescript
const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i,
  /opencode\s+run\s+/i,
];
```

### Task 5: Fix L5.6 Patterns

Add to `CONFUSION_PRETENSE_PATTERNS`:
```typescript
/basically.*done/i,
/basically.*working/i,
/mostly.*done/i,
/sorta.*done/i,
/kinda.*done/i,
/essentially.*done/i,
```

---

## FILES TO MODIFY

1. `src/hooks/v4.1/chat-message-hook.ts` - Main overhaul
   - Add user input checking (Layer 1)
   - Add L1 Theatrical patterns
   - Add L3 Source Inspection patterns
   - Add L4 Wrong Container patterns
   - Fix L5.6 confusion pretense patterns

2. `src/hooks/v4.1/guardian-hook.ts` - Verify tool-based still working

3. `src/hooks/v4.1/command-execute-hook.ts` - Already has checkMessageEnforcement, verify it uses correct patterns

---

## CONTAINER TEST PROTOCOL

After each fix, run these tests:

```bash
# L1 Tests
docker exec -i shark-v483 opencode run "cat /etc/passwd | grep root" --agent shark
docker exec -i shark-v483 opencode run "ls | wc -l" --agent shark

# L3 Tests
docker exec -i shark-v483 opencode run "test -f /tmp/something && echo exists" --agent shark
docker exec -i shark-v483 opencode run "grep -r 'pattern' src/" --agent shark

# L4 Tests
docker exec -i shark-v483 opencode run "opencode container run echo test" --agent shark

# L5.6 Tests
docker exec -i shark-v483 opencode run "basically done" --agent shark
docker exec -i shark-v483 opencode run "somewhat working" --agent shark

# Legitimate Tests (should NOT be blocked)
docker exec -i shark-v483 opencode run "cat /etc/passwd | head -5" --agent shark
docker exec -i shark-v483 opencode run "mkdir -p /tmp/test" --agent shark
```

---

## SUCCESS CRITERIA

1. ✅ L1: `cat /etc/passwd | grep root` PASSES (legitimate)
2. ✅ L1: `ls | wc -l` BLOCKED (theatrical)
3. ✅ L3: `grep -r pattern src/` BLOCKED
4. ✅ L3: `test -f && echo` BLOCKED
5. ✅ L4: `opencode container run` BLOCKED
6. ✅ L5.6: `basically done` BLOCKED
7. ✅ L5.6: `somewhat working` BLOCKED
8. ✅ Legitimate: `cat file | head` PASSES
9. ✅ Legitimate: `mkdir -p` PASSES

---

## BUILD SEQUENCE

1. Modify `chat-message-hook.ts` with all fixes
2. Run `bun build src/index.ts --outdir dist --target bun --format esm --bundle`
3. Copy to container: `docker cp dist/index.js shark-v483:/root/.config/opencode/plugins/shark-agent-v4.8.3/`
4. Run container tests
5. Repeat until all 28 tests pass

---

**Status:** Awaiting implementation