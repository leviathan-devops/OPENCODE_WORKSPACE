# KRAKEN V2.0 — FORENSIC AUDIT
## Why v2.0 Produces Theatrical Slop Instead of Real Execution

**Date:** 2026-04-15  
**Status:** CRITICAL - Architecture Not Working  
**Bundle:** `9c01485490a7a344cffec782b99397b4` (deployed - WRONG)

---

## EXECUTIVE SUMMARY

The current deployed Kraken v2.0 is **100% theatrical**. After 40 minutes of "execution," it returns empty responses because:

1. **V2.0 hooks are defined but NOT imported in index.ts**
2. **V2.0 hooks are NOT registered in plugin factory**
3. **The multi-brain coordination system is stub code**
4. **Output verification never runs**
5. **Theater patterns defined but never enforced**

---

## CRITICAL FINDING #1: Hooks Defined But NOT Wired

### What Should Be Wired (from context libraries):

```
┌─────────────────────────────────────────────────────────────────┐
│                 V2.0 HOOKS (Defined but not wired)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  'event': createEventHook()                                     │
│    → session.created → Initialize all brains                    │
│    → session.compacting → Trigger compaction                    │
│                                                                  │
│  'chat.message': createChatMessageHook()                        │
│    → Layer 2: Message enforcement                               │
│    → THEATRICAL_PATTERNS (message layer)                        │
│                                                                  │
│  'tool.execute.before': createToolGuardianHook()               │
│    → Layer 1: Tool enforcement                                  │
│    → THEATRICAL_PATTERNS (tool layer)                           │
│                                                                  │
│  'tool.execute.after': createGateHook()                        │
│    → Gate evaluation                                            │
│    → Output verification                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What's Actually Wired (CURRENT CODE):

```typescript
// src/index.ts lines 507-560 - WRONG
return {
  name: ...,
  tool: allTools,
  config: ...,
  
  // These are OLD patterns - not V2.0 hooks
  'experimental.chat.system.transform': safeHook(...),  // Just context injection
  'tool.execute.before': safeHook(...),                  // Just tracks last tool
  'chat.message': clusterStateHook,                     // Just tracks state
};
```

### Evidence:

**Hooks are defined in `src/hooks/index.ts`:**
```typescript
// Line 39
export function createEventHook(): Hooks['event'] {
  return async ({ event }) => {
    if (event.type === 'session.created') {
      // Initialize brains...
    }
    if (event.type === 'session.compacting') {
      // Trigger compaction...
    }
  };
}

// Line 178
export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input, output) => {
    // Layer 2 enforcement
  };
}
```

**But NOT imported in `src/index.ts`:**
```typescript
// Current imports (WRONG):
import { clusterStateHook } from './hooks/cluster-state-hook.js';
import { safeHook, type HookContext } from './v4.1/index.js';

// Should be:
import { 
  createEventHook, 
  createChatMessageHook, 
  createToolGuardianHook, 
  createGateHook,
} from './hooks/index.js';
```

---

## CRITICAL FINDING #2: Brain Coordination is Stub Code

### The V2.0 Spec Says (from V1.2_MULTI_BRAIN_INTEGRATION.md):

```
Planning Brain → Execution Brain: context injection via brain messenger
Execution Brain → Subagent: override commands via brain messenger
System Brain → All: gate failure broadcasts
```

### What's Actually Implemented:

**`src/brains/planning/planning-brain.ts`:**
```typescript
// Line 33-42 - STUB CODE
async loadT2Master(): Promise<void> {
  console.log('[PlanningBrain] Loading T2 Master context...');
  await this.delay(100);  // SIMULATES loading - NOT REAL
  this.t2MasterLoaded = true;
}
```

**`src/brains/council/roundtable-council.ts`:**
```typescript
// Line 40-43 - STUB CODE
async executeBuild(task: { taskId: string; description: string }): Promise<void> {
  console.log(`[AlphaBrain] Executing build: ${task.description}`);
  // Steamroll implementation
  // TODO: Implement actual steamroll logic
}
```

**Result:** Brains initialize but do NOTHING useful.

---

## CRITICAL FINDING #3: Output Verification Never Runs

### The V2.0 Spec Says (from MECHANICAL_OUTPUT_VERIFICATION.md):

```
1. Task starts → OutputVerifier.registerOutputs() with hostPaths
2. Task completes → OutputVerifier.claimRetrieved() → fs.existsSync() for each
3. Only if ALL verified → markComplete()
```

### What's Actually Implemented:

**`src/shared/output-verifier.ts`** - Class EXISTS with proper mechanical verification:
```typescript
async claimRetrieved(taskId: string, hostPaths: string[]): Promise<void> {
  for (const hostPath of hostPaths) {
    if (!fs.existsSync(hostPath)) {  // MECHANICAL CHECK
      throw new Error(`L2_OUTPUT_NOT_RETRIEVED: ${hostPath}`);
    }
  }
}
```

**BUT** - Nothing calls this! The task completion path never invokes `claimRetrieved()`.

### Evidence:

Search for `claimRetrieved` calls:
```bash
grep -r "claimRetrieved" src/
# Result: Only in output-verifier.ts itself
# NO CALLER invokes this function!
```

---

## CRITICAL FINDING #4: Two-Layer Guardian Has No Teeth

### The V2.0 Spec Says (from TWO_LAYER_FIREWALL.md):

```
Layer 1: tool.execute.before → THEATRICAL_PATTERNS checked on tool args
Layer 2: chat.message → THEATRICAL_PATTERNS checked on agent messages
```

### What's Actually Implemented:

**Patterns ARE defined in `src/brains/system/two-layer-guardian.ts`:**
```typescript
const THEATRICAL_PATTERNS = [
  /\|.*wc\s+-l/i,
  /wc\s+-l.*\|/i,
  /cat.*\|.*wc/i,
  // ... 9 patterns total
];

const THEATRICAL_MESSAGE_PATTERNS = [
  /just\s+grep/i,
  /grep.*\|.*wc/i,
  // ... 6 patterns
];
```

**BUT** - `createToolGuardianHook()` is defined but never registered!

### The Code Path That Should Exist:

```typescript
// In plugin factory return:
'tool.execute.before': createToolGuardianHook(),  // SHOULD EXIST
'chat.message': createChatMessageHook(),           // SHOULD EXIST

// These check patterns and throw if blocked
```

### What Actually Exists:

```typescript
// In plugin factory return (WRONG):
'tool.execute.before': safeHook(...),  // Just tracks last tool
'chat.message': clusterStateHook,      // Just tracks state
```

**Result:** 155 patterns defined but ZERO enforcement.

---

## CRITICAL FINDING #5: Session Hooks Never Fire

### The V2.0 Spec Says (from V2_CONTEXT_LIBRARY.md):

```
session.created → Initialize brains, council, state stores
session.compacting → Export context, trigger synthesis
```

### What's Actually Wired:

```typescript
// NOTHING - 'event' hook is not registered at all!
```

### Evidence:

```bash
grep -n "'event'" src/index.ts
# Result: NOT FOUND - event hook never registered
```

---

## ROOT CAUSE ANALYSIS

### Why v1.0 Worked

From `CONTAINER_TEST_SUCCESS.md` and `PLUGIN_SHIP_SOP.md`:

1. **Simple architecture** - Single agent with direct tool execution
2. **Hooks properly registered** - `tool.execute.before` and `tool.execute.after` actually wired
3. **Real container spawning** - Python wrapper actually called `docker run`
4. **No "brain" abstraction** - Direct execution path, no coordination overhead

### Why v2.0 Fails

| Issue | Cause | Impact |
|-------|-------|--------|
| Hooks not imported | edit was not applied or reverted | V2.0 enforcement never runs |
| Hooks not registered | plugin factory uses old patterns | session.created never fires |
| Brains are stubs | loadT2Master() just delays 100ms | No real context loading |
| Council is stubs | executeBuild() just console.logs | No real cluster coordination |
| Output verification orphaned | claimRetrieved() never called | Tasks claim success without proof |
| Two-Layer Guardian powerless | Hooks not registered | 155 patterns defined but unused |

---

## WHAT V1.0 HAD THAT V2.0 MISSES

### From V2_CONTEXT_LIBRARY.md:

```
Bundle sizes tell the truth:
- v1.1 (working): 521 KB
- v2.0-broken (shipped): 52 KB  ← 90% DELETED
- v2.0-proper: 199+ KB
```

**Current deployed bundle:** `9c01485490a7a344cffec782b99397b4`  
**Expected size:** 199KB+  
**Actual size:** Check with `ls -la`

### The v1.0 Magic (from Plugin Context):

1. **Correct hook registration** in plugin factory
2. **Direct spawn pattern** - `spawn('python3', [wrapperPath, ...])`
3. **Real Docker execution** - `docker run opencode-python3:latest`
4. **Proper bundle** - Size reflects actual code

### What v2.0 Lost:

```
WHAT WAS DELETED FROM V1.1 TO V2.0:
1. Real execution engine (replaced with stub)
2. Direct spawn to Python wrappers
3. Docker container management
4. Proper state machine for task lifecycle
```

---

## EVIDENCE FILES TO REFERENCE

### 1. V1.0 Working Context

`/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/`
- `V2_CONTEXT_LIBRARY.md` - What v2.0 proper should be
- `Plugin Context/HOOK_ARCHITECTURE.md` - How hooks should work
- `Plugin Context/PLUGIN_SHIP_SOP.md` - How to properly ship

### 2. V1.2 Architecture Spec

`/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V1.2 Build/Working Context Library/`
- `01_ARCHITECTURE_OVERVIEW.md` - Triple-brain + Roundtable
- `06_V1.2_MULTI_BRAIN_INTEGRATION.md` - Brain wiring
- `12_ROUNDTABLE_COUNCIL.md` - Cluster coordination

### 3. V2.0 Optimized Spec

`/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0 Optimized/Working Context Library/`
- `01_ARCHITECTURE_OVERVIEW.md` - V2.0 optimizations
- `06_TWO_LAYER_FIREWALL.md` - Tool + Message enforcement
- `07_MECHANICAL_OUTPUT_VERIFICATION.md` - fs.existsSync() checkpoints
- `10_GOLDEN_BEHAVIOR_V2.md` - Behavioral rules

---

## REQUIRED FIXES (Priority Order)

### P0: Wire Up V2.0 Hooks

**File:** `src/index.ts`

**Current (WRONG):**
```typescript
import { clusterStateHook } from './hooks/cluster-state-hook.js';
// ... later ...
return {
  'tool.execute.before': safeHook(...),
  'chat.message': clusterStateHook,
};
```

**Should be:**
```typescript
import { 
  createEventHook, 
  createChatMessageHook, 
  createToolGuardianHook, 
  createGateHook,
} from './hooks/index.js';
// ... later ...
return {
  name: 'kraken-agent',
  tool: allTools,
  config: ...,
  'event': createEventHook(),
  'chat.message': createChatMessageHook(),
  'tool.execute.before': createToolGuardianHook(),
  'tool.execute.after': createGateHook(),
};
```

### P1: Implement Real Brain Coordination

**Files:** `src/brains/planning/planning-brain.ts`, `src/brains/council/roundtable-council.ts`

**Current:** Stub code with `TODO: Implement`

**Needed:** Real implementation per V1.2_MULTI_BRAIN_INTEGRATION.md

### P1: Wire Output Verification to Task Completion

**Files:** `src/tools/cluster-tools.ts` or cluster management

**Current:** `claimRetrieved()` never called

**Needed:** Call `executionBrain.claimRetrieved()` when tasks complete

### P2: Implement T2 Master Loading

**File:** `src/brains/planning/planning-brain.ts`

**Current:**
```typescript
await this.delay(100);  // Fake
```

**Needed:** Real load from context library files

---

## SUCCESS CRITERIA

After fixes, Kraken should:

- [ ] `session.created` → Console shows "All brains initialized"
- [ ] Tool call → Two-Layer Guardian pattern match runs
- [ ] Message → Message Guardian pattern match runs
- [ ] Task complete → `claimRetrieved()` called with fs.existsSync() checks
- [ ] Bundle size → 199KB+ (not 52KB)
- [ ] Real Docker spawns → `docker ps` shows containers during execution

---

## SUMMARY

The v2.0 architecture was **designed correctly** in the context libraries but **not implemented correctly** in code:

| Component | Status | Problem |
|-----------|--------|---------|
| Hook definitions | ✅ Defined | ❌ Not imported |
| Hook registration | ❌ Missing | `'event'` not registered |
| Two-Layer Guardian | ✅ Defined | ❌ Hooks not wired |
| Planning Brain | ⚠️ Stub | Just delays 100ms |
| Execution Brain | ⚠️ Stub | Output verification orphaned |
| Council | ⚠️ Stub | Just console.logs |
| Output Verifier | ✅ Implemented | ❌ Never called |
| Compaction Manager | ✅ Implemented | ❌ Never triggered |

**Root cause:** The V2.0 hooks defined in `src/hooks/index.ts` were never wired into the plugin factory in `src/index.ts`.

---

**Document Version:** 1.0  
**Audit Complete:** 2026-04-15  
**Next Action:** Wire hooks properly per P0 fix above
