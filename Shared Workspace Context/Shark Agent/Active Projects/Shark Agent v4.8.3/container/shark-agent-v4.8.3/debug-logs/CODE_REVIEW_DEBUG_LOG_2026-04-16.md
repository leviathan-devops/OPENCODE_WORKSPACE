# SHARK AGENT v4.8.3 — COMPREHENSIVE DEBUG LOG
## Code Review Mode: Trident Brain V2.0 Analysis

**Date:** 2026-04-16
**Review Mode:** Trident Brain Code Review Mode V2.0
**Reviewer:** Code Review Mode V2.0 (35+ detectors, 7 layers)
**Target:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`
**Symlink:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Projects/Shark Agent v4.8.3` → `.../projects/shark-agent-v4/`

---

## EXECUTIVE SUMMARY

**Classification:** CRITICAL — 2 BLOCKERS, 5 WARNINGS

| Severity | Count | Issues |
|----------|-------|--------|
| BLOCKER | 2 | Package identity mismatch, duplicate state domain |
| WARNING | 5 | Hardcoded failure docs, nested src/src/, silent failures |

**Root Cause:** The codebase documents its own bugs rather than fixing them. The `compacting-hook.ts` contains 130+ lines of hardcoded "BUILD_CONTEXT" describing what's broken instead of implementing the fixes.

---

## LAYER 0: BEHAVIORAL DETECTION ⚠️ WARNING

### Finding 0.1: THEATRICAL CODE — Hardcoded Failure Documentation

**File:** `src/hooks/v4.1/compacting-hook.ts:18-135`
**Severity:** WARNING
**Pattern:** Code documents failure rather than implementing fix
**Evidence:**
```typescript
const BUILD_CONTEXT = `
# SHARK AGENT v4.8.3 BUILD CONTEXT

## STATUS: NOT SHIP READY

### What's Broken
- L1-L4 Tool-Level Blocking: getCurrentAgent() returns undefined
- Root cause: guardian-hook.ts:469-471 early return bypasses all checks

## THE BUG

In \`src/hooks/v4.1/guardian-hook.ts:469-471\`:
\`\`\`typescript
if (!getCurrentAgent()) {
  return;  // ← ALL L1-L4 checks bypassed
}
\`\`\`
```
**Analysis:** The code acknowledges the bug exists and documents it extensively, but does NOT fix it. This is theatrical bug management — appearing to address issues while leaving them intact.

**Remediation:** Remove hardcoded BUILD_CONTEXT. Implement dynamic context injection from actual state.

---

## LAYER 1: STRUCTURE MAP ⚠️ WARNING

### Finding 1.1: Nested src/src/ Directory Structure

**Location:** `/src/src/shark/macro/`
**Severity:** WARNING
**Files affected:**
- `src/src/shark/macro/brains.ts`
- `src/src/shark/macro/peer-dispatch.ts`

**Evidence:**
```
/src/
  /src/
    /shark/
      /macro/
        brains.ts
        peer-dispatch.ts
```

**Analysis:** This nested structure suggests confused build process or failed refactoring. The inner `src/src/` duplicates the outer structure.

**Remediation:**
1. Investigate why `src/src/` exists
2. If build artifact: add to .gitignore and clean
3. If intentional: document why

---

### Finding 1.2: Duplicate File Backup in src.bak/

**Location:** `/src/src.bak/`
**Severity:** WARNING
**Files:** 23+ files duplicated

**Analysis:** The `src.bak/` directory contains backup copies of all source files, increasing bundle confusion and maintenance burden.

**Remediation:** Remove `src.bak/` or move to separate backup directory outside source tree.

---

### Finding 1.3: Symlink Points Outside Project

**Location:** `dist -> /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist`
**Severity:** WARNING

**Analysis:** The `dist` symlink points to a directory outside the project, potentially causing build issues if the target doesn't exist.

**Remediation:** Ensure `dist` is built in-place or use relative symlink.

---

## LAYER 2: EXECUTION VERIFICATION ✅ PASS

### Finding 2.1: Gate Chain Correctly Implemented

**Files:**
- `src/shared/gates.ts` — GateManager with 6 gates
- `src/hooks/v4.1/gate-hook.ts` — Evidence collection

**Evidence:**
- Chain: `PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY`
- Iteration tracking with max 3 verify attempts
- Evidence archived to `.shark/evidence/{gate}/{timestamp}/`
- Container test requirement enforced at delivery gate

**Analysis:** PASS — Gate mechanism is correctly implemented.

---

## LAYER 3: SECURITY ANALYSIS ✅ PASS

### Finding 3.1: Guardian Zone-Based Protection

**File:** `src/shared/guardian.ts`
**Evidence:**
- DANGEROUS_PATTERNS includes `rm -rf /`, fork bombs, mkfs, dd if=`
- Zone classification: SANDBOX, WORKSPACE, DEVELOPMENT, PERSONAL, CONFIG, SYSTEM
- Source file exclusions defined (line 49-67)
- Default SANDBOX mode correctly configured

**Analysis:** PASS — Security mechanisms properly configured.

---

## LAYER 4: ARCHITECTURE ANALYSIS ⚠️ WARNING

### Finding 4.1: DUPLICATE State Domain Entry

**File:** `src/shared/state-store.ts:47-48`
**Severity:** BLOCKER
**Evidence:**
```typescript
export type StateDomain =
  | 'plan-state'
  | 'shark-state'
  | 'shark-context'   // ← defined once (line 12)
  | 'shark-context'   // ← DUPLICATE (line 13)
  | 'shark-workflow'
  | 'shark-quality'
  | 'shark-security';

export const DOMAIN_OWNERSHIP: Record<StateDomain, string[]> = {
  'plan-state': ['shark-plan-brain'],
  'shark-state': ['shark-execution-brain'],
  'shark-context': ['shark-reasoning-brain'],  // ← once
  'shark-context': ['shark-reasoning-brain'],  // ← DUPLICATE
  'shark-workflow': ['shark-system-brain'],
  'shark-quality': ['shark-execution-brain', 'shark-system-brain'],
  'shark-security': ['shark-system-brain'],
};
```

**Analysis:** TypeScript type aliases the duplicate to the same type, so this is a typo, not a runtime error. However, the DOMAIN_OWNERSHIP object also has duplicate keys which is problematic in JavaScript.

**Remediation:** Replace duplicate `shark-context` with `shark-quality` (line 48 and DOMAIN_OWNERSHIP line 48).

---

### Finding 4.2: Hook Isolation — CORRECT

**File:** `src/hooks/v4.1/index.ts:30-41`
**Evidence:**
```typescript
return {
  event: createSessionHook(gateManager, evidenceCollector, peerDispatch, stateStore, messenger),
  'chat.message': createChatMessageHook(),
  'command.execute.before': createCommandExecuteHook(),
  'experimental.chat.messages.transform': createMessagesTransformHook(),
  'tool.execute.before': createGuardianHook(guardian),
  'tool.execute.after': (input, output) => {
    createToolSummarizerHook()(input, output);
    createGateHook(gateManager, evidenceCollector, peerDispatch)(input, output);
  },
  'experimental.session.compacting': createCompactingHook(gateManager),
  'experimental.chat.system.transform': createSystemTransformHook(gateManager, peerDispatch),
};
```

**Analysis:** All hooks check `isSharkAgent()` first, correctly isolating Shark hooks from other agents.

---

## LAYER 5: QUALITY ANALYSIS ⚠️ WARNING

### Finding 5.1: Silent Failures

**Locations:**

**A. `src/hooks/v4.1/compacting-hook.ts:86-88`:**
```typescript
} catch (err) {
  // Silent fail - don't disrupt session
}
```

**B. `src/shared/evidence.ts:82-84`:**
```typescript
} catch {
  // Skip invalid evidence files
}
```

**C. `src/shared/state-store.ts:94-96`:**
```typescript
} catch {
  // Watcher errors are silently ignored
}
```

**Analysis:** Multiple silent catch blocks make debugging difficult. While silent fail may be intentional for non-critical operations, it hinders forensic analysis.

**Remediation:**
1. Add optional debug logging for silent catches
2. Consider using a debug flag to enable verbose error output
3. At minimum, count silent failures for post-mortem analysis

---

### Finding 5.2: Hardcoded Build Context

**File:** `src/hooks/v4.1/compacting-hook.ts:18-135`
**Size:** 130+ lines of hardcoded strings

**Analysis:** The BUILD_CONTEXT is static and describes bugs that may become stale as code changes. This creates maintenance burden and potential misinformation.

**Remediation:** Implement dynamic context gathering from actual system state.

---

## LAYER 6: INTEGRATION VERIFICATION ✅ PASS

### Finding 6.1: Dependencies Correct

**File:** `package.json`
**Evidence:**
```json
{
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.3.6"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Analysis:** PASS — Dependencies properly specified.

---

## CRITICAL BLOCKER: PACKAGE IDENTITY MISMATCH

**File:** `package.json:1-4`
**Severity:** BLOCKER
**Evidence:**
```json
{
  "name": "manta-agent",
  "version": "1.3.2",
  "description": "MANTA Agent v1.1 - Dual-brain sequential with mechanical coordinator..."
}
```

**Problem:** The project directory is named `shark-agent-v4` and contains Shark Agent code, but `package.json` declares it as `manta-agent` version `1.3.2` with MANTA Agent description.

**Analysis:** This identity mismatch will cause:
1. Wrong package name in npm listings
2. Confused debugging when logs show "manta-agent"
3. Potential installation of wrong package
4. CI/CD failures if pipeline expects "shark-agent"

**Remediation:** Update package.json:
```json
{
  "name": "shark-agent",
  "version": "4.8.3",
  "description": "SHARK Agent v4.8.3 - Triple-brain execution with mechanical gate enforcement..."
}
```

---

## THE PRIMARY BUG: L1-L4 Tool-Level Blocking Failure

### Root Cause Analysis

**The Bug:** `getCurrentAgent()` returns `undefined` in `guardian-hook.ts` even though `chat-message-hook` has already called `setCurrentAgent('shark')`.

**Architecture Flow:**
```
User Input → chat.message (L5 blocks here ✅)
         → setCurrentAgent('shark', sessionId)
         → Agent
         → tool.execute.before (L1-L4 broken ❌)
         → getCurrentAgent(sessionId) returns undefined
         → ALL L1-L4 checks BYPASSED
         → Tool
```

**Evidence from compacting-hook.ts:**
```typescript
### What's Broken
- L1-L4 Tool-Level Blocking: getCurrentAgent() returns undefined
- Root cause: guardian-hook.ts:469-471 early return bypasses all checks

## THE BUG

In `src/hooks/v4.1/guardian-hook.ts:469-471`:
if (!getCurrentAgent()) {
  return;  // ← ALL L1-L4 checks bypassed
}
```

### Current guardian-hook.ts Logic (lines 470-541):

```typescript
export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool, args, sessionID, agent } = input as { tool: string; args?: Record<string, unknown>; sessionID?: string; agent?: string };

    // L0: IDENTITY WALL — Use agent from input or session
    const inputAgent = agent;
    const sessionAgent = getCurrentAgent(sessionID);
    const currentAgent = inputAgent || sessionAgent;

    // Update session state if we have agent from input but not from session
    if (inputAgent && !sessionAgent) {
      setCurrentAgent(inputAgent, sessionID);
    }
    // ... checks ...
```

### Problem: The Code Already Has a Fix Attempt!

Looking at lines 470-482, the code:
1. Gets `inputAgent` from input
2. Gets `sessionAgent` from `getCurrentAgent(sessionID)`
3. Uses `currentAgent = inputAgent || sessionAgent`
4. Updates session state if `inputAgent` exists but `sessionAgent` doesn't

**This logic SHOULD work!** The bug description in compacting-hook.ts appears to be OUTDATED or the code has already been partially fixed.

### Possible Remaining Issues:

1. **Race Condition:** `chat.message` hook may fire AFTER `tool.execute.before` in some execution paths
2. **Session ID Mismatch:** The `sessionID` passed to hooks may not match what `chat.message` used
3. **Container Environment:** Module-level Map may not persist in containerized environment

### agent-state.ts Implementation Analysis:

```typescript
const DEFAULT_SESSION = 'default';
const agentBySession = new Map<string, AgentState>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function setCurrentAgent(agent: string | undefined, sessionId?: string): void {
  const sid = sessionId || DEFAULT_SESSION;
  agentBySession.set(sid, {
    agent,
    timestamp: Date.now()
  });
}

export function getCurrentAgent(sessionId?: string): string | undefined {
  cleanupStaleSessions();
  const sid = sessionId || DEFAULT_SESSION;
  const state = agentBySession.get(sid);
  return state?.agent;
}
```

**Analysis:** This implementation looks correct. If `sessionID` is properly passed and consistent, this should work.

### Likely Root Cause: Inconsistent sessionID

The `sessionID` passed to `tool.execute.before` may not match the `sessionID` used in `chat.message`. This could happen if:
1. Session ID format changes between hooks
2. Different sessions are created for different hook types
3. Container environment resets module state

---

## PROPOSED SOLUTIONS

### Solution 1: Add Debug Logging to Trace Session State

**File:** `src/hooks/v4.1/guardian-hook.ts`
**Approach:** Add console.log to trace where state is lost

```typescript
export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool, args, sessionID, agent } = input as { tool: string; args?: Record<string, unknown>; sessionID?: string; agent?: string };

    // DEBUG: Trace session state
    console.log(`[GUARDIAN DEBUG] tool=${tool}, sessionID=${sessionID}, agent=${agent}`);
    console.log(`[GUARDIAN DEBUG] sessionAgent=${getCurrentAgent(sessionID)}`);
    console.log(`[GUARDIAN DEBUG] allSessions=${JSON.stringify(getSessionIds())}`);

    const inputAgent = agent;
    const sessionAgent = getCurrentAgent(sessionID);
    const currentAgent = inputAgent || sessionAgent;

    console.log(`[GUARDIAN DEBUG] currentAgent=${currentAgent}`);

    if (inputAgent && !sessionAgent) {
      console.log(`[GUARDIAN DEBUG] Setting agent from input: ${inputAgent}`);
      setCurrentAgent(inputAgent, sessionID);
    }
    // ... rest of code
```

**Steps:**
1. Add debug logging to `guardian-hook.ts` lines ~470-485
2. Run test: `echo "run grep pattern | wc -l" | timeout 120 docker exec -i CONTAINER ...`
3. Check debug output for session ID mismatch

---

### Solution 2: Always Check Dangerous Tools Regardless of Agent State

**File:** `src/hooks/v4.1/guardian-hook.ts`
**Approach:** For dangerous tools (terminal, write_file, etc.), always enforce checks

**Current Code (lines 492-505):**
```typescript
if (DANGEROUS_TOOLS.has(tool)) {
  if (currentAgent && currentAgent !== 'shark' && !currentAgent.startsWith('shark_')) {
    throw new Error(...);
  }

  // L1: Theatrical Verification - ALWAYS check terminal commands
  checkTheatricalVerification(command);

  // L2: Fake Test Runner - ALWAYS check terminal commands
  checkFakeTestRunner(command);
}
```

**Proposed Fix:**
```typescript
if (DANGEROUS_TOOLS.has(tool)) {
  // ALWAYS enforce L1 and L2 for dangerous tools
  // These checks don't depend on knowing which agent is running
  checkTheatricalVerification(command);
  checkFakeTestRunner(command);

  // Only block for non-shark agents when we KNOW the agent identity
  if (currentAgent && currentAgent !== 'shark' && !currentAgent.startsWith('shark_')) {
    throw new Error(...);
  }
}
```

**Steps:**
1. Move L1 and L2 checks BEFORE the agent identity check
2. This ensures dangerous commands are always checked
3. Agent identity check becomes secondary defense

---

### Solution 3: Use Tool Name as Fallback Indicator

**File:** `src/hooks/v4.1/guardian-hook.ts`
**Approach:** If no agent state, infer from tool naming convention

**Observation:** Shark tools use `shark-` prefix: `shark-status`, `shark-gate`, `shark-evidence`, `shark-test-runner`, `checkpoint`

**Proposed Code:**
```typescript
// If no agent state, check if tool name suggests shark
const toolBasedAgent = tool.startsWith('shark-') || tool === 'checkpoint' ? 'shark' : undefined;
const currentAgent = inputAgent || sessionAgent || toolBasedAgent;

if (DANGEROUS_TOOLS.has(tool)) {
  // Check agent identity or tool-based inference
  const effectiveAgent = currentAgent || toolBasedAgent;

  if (effectiveAgent && effectiveAgent !== 'shark' && !effectiveAgent.startsWith('shark_')) {
    throw new Error(...);
  }

  checkTheatricalVerification(command);
  checkFakeTestRunner(command);
}
```

**Steps:**
1. Add tool-based agent inference after line 482
2. Use inferred agent for identity checks
3. This provides fallback when session state is unavailable

---

## IMMEDIATE DEPLOYMENT STEPS

### STEP 1: Fix Package Identity (BLOCKER)

**File:** `package.json`
**Change:**
```json
{
  "name": "shark-agent",
  "version": "4.8.3",
  "description": "SHARK Agent v4.8.3 - Execution Brain with triple-brain coordination",
  "keywords": ["opencode", "agent", "shark", "triple-brain", "gate-enforcement"]
}
```

---

### STEP 2: Fix Duplicate State Domain (BLOCKER)

**File:** `src/shared/state-store.ts`
**Lines 12-13 change:**
```typescript
export type StateDomain =
  | 'plan-state'
  | 'shark-state'
  | 'shark-context'
  | 'shark-workflow'      // was 'shark-context' duplicate
  | 'shark-quality'
  | 'shark-security';
```

**Lines 47-48 change:**
```typescript
export const DOMAIN_OWNERSHIP: Record<StateDomain, string[]> = {
  'plan-state': ['shark-plan-brain'],
  'shark-state': ['shark-execution-brain'],
  'shark-context': ['shark-reasoning-brain'],
  'shark-workflow': ['shark-system-brain'],
  'shark-quality': ['shark-execution-brain', 'shark-system-brain'],
  'shark-security': ['shark-system-brain'],
};
```

---

### STEP 3: Add Debug Logging to Guardian Hook

**File:** `src/hooks/v4.1/guardian-hook.ts`
**Add after line 481 (after setCurrentAgent call):**
```typescript
console.log(`[SHARK] Guardian hook active for tool: ${tool}, agent: ${currentAgent}`);
```

---

### STEP 4: Fix L1-L4 Check Order (PRIMARY BUG FIX)

**File:** `src/hooks/v4.1/guardian-hook.ts`
**Lines 492-505 change to:**
```typescript
if (DANGEROUS_TOOLS.has(tool)) {
  // L1 and L2 checks MUST run regardless of agent state
  // These are critical for preventing theatrical behavior
  checkTheatricalVerification(command);
  checkFakeTestRunner(command);

  // Agent identity check is secondary
  if (currentAgent && currentAgent !== 'shark' && !currentAgent.startsWith('shark_')) {
    throw new Error(
      `[BRAIN_FAILURE_BLOCK] Cannot execute "${tool}" when system brain is uninitialized. ` +
      `Brain state: ${currentAgent || 'undefined'}. Required: shark.`
    );
  }
}
```

---

### STEP 5: Clean Up Hardcoded Build Context

**File:** `src/hooks/v4.1/compacting-hook.ts`
**Action:** Remove lines 18-135 (hardcoded BUILD_CONTEXT)
**Replace with:** Dynamic context gathering from actual state

```typescript
const BUILD_CONTEXT = `
# SHARK AGENT v${VERSION} BUILD CONTEXT

## STATUS: ${gateManager.getCurrentGate().toUpperCase()}

### Current State
- Gate: ${gateManager.getCurrentGate()}
- Iteration: ${gateManager.getCurrentIteration()}
- Evidence: ${evidenceCollector.getLatestEvidence(gateManager.getCurrentGate()) ? 'PRESENT' : 'NONE'}
`;
```

---

### STEP 6: Remove src/src/ Nested Directory

**Command:**
```bash
# Move files from src/src/ to src/
mv /path/to/src/src/shark/macro/*.ts /path/to/src/shark/macro/
rmdir /path/to/src/src/shark/macro
rmdir /path/to/src/src/shark
rmdir /path/to/src/src

# Or if this is a build artifact, clean and rebuild
cd /path/to/shark-agent-v4
rm -rf src/src
npm run build
```

---

### STEP 7: Remove src.bak/ Backup Directory

**Command:**
```bash
rm -rf /path/to/shark-agent-v4/src/src.bak
```

---

## TESTING PROTOCOL

### Container Test Setup
```bash
docker run --rm -d -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins --entrypoint /bin/sh opencode-test:1.4.3 -c "tail -f /dev/null"
```

### Test L5 (Should Block)
```bash
echo "skip container test" | timeout 120 docker exec -i CONTAINER /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-DERAILMENT'
# Expected: BLOCKED with L5.1 error
```

### Test L1 (Should Block After Fix)
```bash
echo "run grep pattern | wc -l" | timeout 120 docker exec -i CONTAINER /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark --model opencode/big-pickle 2>&1 | grep 'ANTI-SLOP'
# Before fix: NO BLOCK
# After fix: BLOCKED with L1 error
```

---

## SUMMARY OF CHANGES

| Step | File | Change | Priority |
|------|------|--------|----------|
| 1 | package.json | name: "shark-agent", version: "4.8.3" | CRITICAL |
| 2 | state-store.ts | Remove duplicate shark-context domain | CRITICAL |
| 3 | guardian-hook.ts | Add debug logging | MEDIUM |
| 4 | guardian-hook.ts | Move L1/L2 checks before agent identity | CRITICAL |
| 5 | compacting-hook.ts | Remove hardcoded BUILD_CONTEXT | MEDIUM |
| 6 | (cleanup) | Remove src/src/ nested directory | MEDIUM |
| 7 | (cleanup) | Remove src.bak/ backup | LOW |

---

## RATIONALE FOR SOLUTIONS

### Why Move L1/L2 Before Agent Check?

Current flow:
1. Check agent identity
2. If dangerous tool AND not shark → block
3. L1/L2 checks only run AFTER agent check passes

Problem: If `getCurrentAgent()` returns undefined, we never reach L1/L2 checks for non-dangerous-but-suspicious tools like `terminal`.

Fixed flow:
1. For ALL dangerous tools, ALWAYS run L1/L2 checks
2. Agent identity check becomes defense-in-depth
3. Even if agent state is lost, theatrical patterns are caught

### Why Use Tool-Based Agent Inference?

If session state is lost (container restart, module reload), we lose track of which agent is running. However:
- `shark-status`, `shark-gate`, etc. are SHARK-SPECIFIC tools
- If someone is calling `shark-*` tools, they're running shark agent
- This provides fallback identity detection

### Why Remove Hardcoded Context?

The hardcoded BUILD_CONTEXT in compacting-hook.ts documents bugs that may become stale:
1. As code changes, documented bugs become inaccurate
2. The context describes symptoms, not actual system state
3. Dynamic context from actual state is always accurate
4. Hardcoded context requires manual maintenance

---

## APPENDIX: FILE REFERENCE MAP

```
shark-agent-v4/
├── src/
│   ├── index.ts                     # Plugin entry point
│   ├── hooks/
│   │   └── v4.1/
│   │       ├── index.ts            # Hook factory
│   │       ├── guardian-hook.ts    # L0-L8 firewall (PRIMARY BUG LOCATION)
│   │       ├── chat-message-hook.ts # L5 anti-derailment
│   │       ├── agent-state.ts      # Session-based agent tracking
│   │       ├── gate-hook.ts        # Evidence collection
│   │       ├── compacting-hook.ts  # BUILD_CONTEXT (hardcoded, needs removal)
│   │       └── ...
│   ├── shared/
│   │   ├── state-store.ts          # Domain ownership (DUPLICATE KEY BUG)
│   │   ├── gates.ts                # Gate chain management
│   │   ├── guardian.ts             # Zone-based path protection
│   │   ├── evidence.ts             # Evidence collection
│   │   └── messenger.ts            # Brain-to-brain messaging
│   ├── shark/
│   │   └── macro/
│   │       ├── brains.ts           # T1 prompts for triple-brain
│   │       └── peer-dispatch.ts    # Brain coordination
│   └── tools/
│       ├── shark-status.ts
│       ├── shark-gate.ts
│       ├── shark-evidence.ts
│       ├── shark-test-runner.ts
│       └── checkpoint.ts
├── package.json                     # WRONG IDENTITY (manta-agent vs shark-agent)
├── src.bak/                         # Old files (should remove)
└── src/src/                         # Nested src (should remove)
```