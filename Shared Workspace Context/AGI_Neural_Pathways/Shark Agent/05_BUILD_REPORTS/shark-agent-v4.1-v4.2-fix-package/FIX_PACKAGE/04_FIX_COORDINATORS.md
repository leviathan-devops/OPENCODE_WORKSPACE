# FIX-02: Coordinators Non-Functional Stubs

**Severity:** HIGH
**Source files:** `src/index.ts`, `src/shark/micro/coordinator.ts`, `src/shark/macro/peer-dispatch.ts`
**Audit ref:** UNRESOLVED-2

---

## THE PROBLEM

Both coordinators throw immediately if called:

```typescript
// src/index.ts lines 46-52
function getMicroCoordinator(): MicroCoordinator {
  throw new Error('Coordinator not yet wired to hooks');
}

function getMacroDispatcher(): MacroPeerDispatch {
  throw new Error('Dispatcher not yet wired to hooks');
}
```

The `MicroCoordinator` and `MacroPeerDispatch` classes exist but are unreachable. The mechanical Plan↔Build switching described in Shark's architecture does not function.

**Shark Micro expects:** Coordinator drives brain switching based on gate state.
**Reality:** No hook or agent code path calls either coordinator.

---

## VERIFICATION COMMANDS

Before fix — verify stubs exist:

```bash
grep -c "Coordinator not yet wired to hooks" src/index.ts
# Expected: 1
```

After fix — verify stubs removed:

```bash
grep -c "Coordinator not yet wired to hooks" src/index.ts
# Expected: 0
```

---

## MECHANICAL CHECKLIST

- [ ] No `throw new Error('Coordinator not yet wired')` in src/index.ts
- [ ] `getMicroCoordinator()` either works or is removed
- [ ] `getMacroDispatcher()` either works or is removed
- [ ] `npx tsc --noEmit` passes
- [ ] `bun build` succeeds

---

## OPTIONS

### Option A (Remove Stubs): Simplest Fix

Accept that coordinators are not yet wired and remove the stub functions entirely. The coordinator logic lives in the hooks (gate-hook handles gate transitions, session-hook handles initialization). The classes still exist for future wiring.

**FIND in src/index.ts (lines 42-52):**
```typescript
// V4.1: Coordinators not yet fully wired to hooks
// let microCoordinator: MicroCoordinator | null = null;
// let macroDispatcher: MacroPeerDispatch | null = null;

function getMicroCoordinator(): MicroCoordinator {
  throw new Error('Coordinator not yet wired to hooks');
}

function getMacroDispatcher(): MacroPeerDispatch {
  throw new Error('Dispatcher not yet wired to hooks');
}
```

**REPLACE WITH:**
```typescript
// V4.2: Coordinators remain unwired — gate/evidence hooks handle enforcement
// MicroCoordinator and MacroPeerDispatch classes exist but are not invoked
// TODO: Wire coordinator brain-switching logic to session.created or
//       chat.system.transform hooks for mechanical Plan↔Build switching
const _microCoordinator = null;  // placeholder — future wiring
const _macroDispatcher = null;   // placeholder — future wiring
```

**THEN remove the unused imports since they're no longer referenced:**

Find (in src/index.ts imports section):
```typescript
import { MicroCoordinator } from './shark/micro/coordinator.js';
import { MacroPeerDispatch } from './shark/macro/peer-dispatch.js';
```

Remove these two lines.

**OR keep them if other code references them — verify first:**
```bash
grep -n "MicroCoordinator\|MacroPeerDispatch" src/index.ts
# Should only show the import lines if Option A remove
```

### Option B (Wire to Hooks): Proper Fix

Wire `MicroCoordinator` into the hook system so it actually drives brain switching.

This requires:
1. Make `MicroCoordinator` constructable with dependencies (gateManager, messenger)
2. Call coordinator methods from hooks on gate transitions
3. Store coordinator instance in a way that survives across hook calls

**This is a larger change. If choosing Option B, create a separate FIX-02b document.**

---

## RECOMMENDED: Option A

Option A is the minimum viable fix for V4.2. It removes the lies (the stub functions that throw) and replaces them with honest placeholders. The coordinator classes remain for future wiring.

**After applying Option A:**

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Verify stubs gone
grep -c "Coordinator not yet wired to hooks" src/index.ts
# Expected: 0

# Verify placeholder exists
grep -c "placeholder — future wiring" src/index.ts
# Expected: 1

# Typecheck
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: 0

# Build
bun build src/index.ts --outdir dist --target bun --format esm --bundle
# Expected: exit 0
```

---

## NOTES

The Shark architecture depends on mechanical brain switching. In V4.1, this is handled (partially) by the gate-hook's `checkGateAdvance()` function which auto-advances gates. But the actual brain switching (Plan Brain → Build Brain) described in `coordinator.ts` is not wired.

For V4.2, Option A is acceptable as a "honest placeholder" fix. True coordinator wiring is a V4.3 item.

*Fix-02 complete. Stubs removed, honest placeholders in their place.*
