# SHIP FAIL REPORT: Shark Agent v4.8.1

**Date**: 2026-04-09  
**Status**: SHIP FAILURE - REVERTED TO v4.7  
**Plugin**: shark-agent

---

## Executive Summary

v4.8.1 deployment FAILED. The plugin was registered but the System Brain firewalls were completely non-functional due to critical initialization bugs. Container test used mocks, providing false confidence. Reverting to v4.7.

---

## Root Cause Analysis

### BUG 1: Agent State Never Initialized (CRITICAL)

| File | Line | Issue |
|------|------|-------|
| `agent-state.ts` | 10 | `setCurrentAgent()` defined but **NEVER CALLED** |
| `guardian-hook.ts` | 79 | `getCurrentAgent()` always returns `undefined` |
| `gate-hook.ts` | 36 | Same issue - exits early |

**Evidence**:
```
$ grep -r "setCurrentAgent(" --include="*.ts" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/
# Returns: ONLY the definition, NO calls
```

**Impact**: ALL guardian hooks exit early without enforcement. The entire firewall system (L1-L6) was completely bypassed.

---

### BUG 2: Container Test Used Mocks (VIOLATION)

**SOP Violation**: Container test must be an **exact replica** of live operation. Mocks are banned.

The container test mocked `setCurrentAgent()`:
```typescript
// Container test likely does:
setCurrentAgent('shark-alpha-1');  // Mock initializes correctly
```

But in **live operation**, `setCurrentAgent()` is never called, so `getCurrentAgent()` returns `undefined` and all guardian hooks exit early.

**Contradiction**:
- Container test: PASSED 100% (10/10)
- Live system: `brain: unknown`, hooks don't fire
- Root cause: Mocked initialization vs. real initialization

---

### BUG 3: shark-status Tool Missing Variant Parameter

| File | Line | Issue |
|------|------|-------|
| `index.ts` | 45 | `createSharkStatusTool(stateStore, gm)` - missing variant |
| `shark-status.ts` | 19-26 | Without variant, checks `shark-macro-state` which may not exist yet |

When `variant` is undefined, `shark-status` falls into the wrong branch and returns `'unknown'` for brain state.

---

## The Disconnect: UI Shark Mode vs. Brain State

| Concept | Reality |
|---------|---------|
| **UI "shark mode"** | User selected shark agent in dropdown - this is set at CONVERSATION level |
| **Brain state "unknown"** | Internal `agent-state.ts` module variable - this is NEVER set |

The guardian hooks check **brain state** via `getCurrentAgent()`, not UI mode. Since brain state is never initialized, hooks think no shark agent is running and exit early without enforcement.

---

## Violations of MASTER CONTEXT

1. **Container test must be exact replica** - Mock is banned
2. **All initialization must happen in live flow** - `setCurrentAgent()` was never called
3. **Ship requires actual opencode spawning** - Container test ran standalone runner

---

## Deliverables That Were Generated (And Are Now Invalid)

| Artifact | Status | Notes |
|----------|--------|-------|
| `ContainerTestResult.json` | INVALID | Used mocks, not real initialization |
| `EvidenceArchive.zip` | INVALID | Based on false-passing container test |
| `DeliverySummary.md` | INVALID | Premature delivery |
| `changelog.md` | KEEP | Version history |
| `build-log.md` | KEEP | Architecture docs |
| `debug-log.md` | KEEP | Derailments logged |

---

## Fix Required (For Future v4.8.2)

### Fix 1: Call `setCurrentAgent()` in session-hook.ts

**File**: `session-hook.ts`

**Add import**:
```typescript
import { setCurrentAgent } from './agent-state.js';
```

**In `handleSessionCreated()`**:
```typescript
case 'session.created':
  setCurrentAgent(event.agent);  // ADD THIS
  await handleSessionCreated(event.sessionId || 'unknown', gateManager, peerDispatch);
  break;
```

### Fix 2: Pass variant parameter to createSharkStatusTool

**File**: `index.ts`

**Line 45 change**:
```typescript
// BEFORE:
const statusTool = createSharkStatusTool(stateStore, gm);

// AFTER:
const statusTool = createSharkStatusTool(stateStore, gm, 'shark');
```

### Fix 3: Container test must spawn actual opencode

No mocks. No standalone runner. Must spawn opencode with plugin and verify hooks fire.

---

## Revert Action

Reverted opencode.json to point to v4.7:
```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v47/dist/index.js",
  ...
]
```

Removed v4.8.1 from registration.

---

## Lessons Learned

1. **Container test with mocks is NOT container test** - Must be exact replica
2. **grep on local files != container verification** - Actually spawn opencode in container
3. **brain: unknown means hooks don't fire** - Initialization must happen in live flow
4. **SOPs exist for a reason** - Violating them produces false confidence

---

## Files Involved

```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/
├── hooks/v4.1/
│   ├── agent-state.ts      # Bug: setCurrentAgent never called
│   ├── guardian-hook.ts    # Bug: exits early when getCurrentAgent() is undefined
│   ├── gate-hook.ts       # Bug: same issue
│   └── session-hook.ts    # Fix: add setCurrentAgent(event.agent)
├── tools/
│   └── shark-status.ts    # Bug: variant parameter missing
└── index.ts               # Bug: createSharkStatusTool called without variant
```

---

**Report Generated**: 2026-04-09  
**Next Action**: Fix bugs and rebuild for v4.8.2