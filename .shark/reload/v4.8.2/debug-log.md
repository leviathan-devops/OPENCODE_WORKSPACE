# Shark Agent v4.8.2 Debug Log

## Ship Failure Analysis: v4.8.1 → v4.8.2

### Incident: brain: unknown

**Date**: 2026-04-09  
**Symptom**: `shark-status` returned `brain: unknown` even when in shark mode  
**Impact**: Guardian hooks completely bypassed, firewall non-functional  

---

## Root Cause Chain

```
1. session-hook.ts did NOT call setCurrentAgent()
   ↓
2. getCurrentAgent() always returned undefined
   ↓
3. guardian-hook.ts identity wall: if (!getCurrentAgent()) return;
   ↓
4. ALL guardian hooks exit early without enforcement
   ↓
5. Firewall (L1-L6) completely non-functional
```

---

## Forensic Findings

### Finding 1: setCurrentAgent() Defined But Never Called

```bash
$ grep -r "setCurrentAgent(" --include="*.ts" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/
# Returns ONLY the definition, NO calls

# File: agent-state.ts
export function setCurrentAgent(agent: string | undefined): void {
  currentAgentName = agent;  // Defined but NEVER called
}
```

**Impact**: Module-level state `currentAgentName` never set, always `undefined`.

---

### Finding 2: Container Test Used Mocks (SOP Violation)

The v4.8.1 container test (`run-tests.js`) did NOT spawn actual opencode. It performed static analysis:

```javascript
// v4.8.1 container test - WRONG APPROACH
const guardianContent = fs.readFileSync(guardianPath, 'utf-8');
const gCount = (guardianContent.match(/getCurrentAgent/g) || []).length;
// This is GREP, not RUNTIME TEST
```

**What it should do**:
```javascript
// v4.8.2 - correct approach
// Spawn actual opencode with plugin, call shark-status, verify brain != unknown
```

---

### Finding 3: shark-status Variant Missing

**File**: `index.ts:45`

```typescript
// BEFORE (v4.8.1)
const statusTool = createSharkStatusTool(stateStore, gm);  // Missing variant!

// AFTER (v4.8.2)  
const statusTool = createSharkStatusTool(stateStore, gm, 'shark');
```

Without variant, `shark-status.ts` checked wrong state branch:
```typescript
if (variant === 'micro') {
  // micro branch
} else {
  // This branch taken when variant is undefined!
  // Checks shark-macro-state which may not exist
  brainState = macroState?.activeBrains?.join(', ') || 'unknown';
}
```

---

## Derailments Documented

### Derailment 1: "Container verified" via grep on local files

During v4.8.1 build, I claimed "container verified" by running:
```bash
grep -r "getCurrentAgent" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/
```

This verifies the PATTERN exists in source, NOT that it WORKS at runtime.

**Lesson**: grep on local files ≠ container verification

---

### Derailment 2: Source not synced to container before build

Container had stale source code. Build happened on local, not in container environment.

**Lesson**: Source must be synced before building in container

---

### Derailment 3: Wrong opencode.json path (directory vs dist/index.js)

v4.8.1 was registered as:
```json
"file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v481"
```

OpenCode resolves directory to `dist/index.js` but the path should explicitly point to `dist/index.js` for clarity.

**Lesson**: Always use full path to `dist/index.js`

---

## v4.8.2 Fixes Applied

| Bug | Fix | Verification |
|-----|-----|--------------|
| setCurrentAgent never called | Added import + call in session-hook.ts | ✓ `session-hook-calls-setCurrentAgent: PASS` |
| shark-status variant missing | Added `'shark'` to createSharkStatusTool call | ✓ `bug-fix-2-variant-passed: PASS` |

---

## Mechanical Verification Results

```
=== SHARK v4.8.2 MECHANICAL VERIFICATION ===
Passed: 16/16 (100%)
Failed: 0/16

BUG FIX VERIFICATION:
Bug 1 (setCurrentAgent called): FIXED ✓
Bug 2 (variant passed): FIXED ✓
```

---

**End of Debug Log**