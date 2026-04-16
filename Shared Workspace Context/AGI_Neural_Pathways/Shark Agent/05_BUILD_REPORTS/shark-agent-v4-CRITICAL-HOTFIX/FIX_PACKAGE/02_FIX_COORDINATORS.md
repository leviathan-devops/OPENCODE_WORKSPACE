# FIX-02: Coordinators Dead Code — Wire or Remove

**Severity:** CRITICAL
**Source files:** `src/shark/micro/coordinator.ts`, `src/shark/macro/peer-dispatch.ts`, `src/index.ts`
**Audit ref:** CRITICAL-2

---

## THE PROBLEM

`MicroCoordinator` and `MacroPeerDispatch` classes exist at:
- `src/shark/micro/coordinator.ts`
- `src/shark/macro/peer-dispatch.ts`

V4.2 removed the `getMicroCoordinator()` and `getMacroDispatcher()` stub functions that threw. But the coordinator classes remain — completely disconnected, never instantiated, never called.

This is dead code. The Shark architecture describes mechanical Plan↔Build switching via these coordinators. In reality, zero brain switching occurs.

---

## TWO OPTIONS

### Option A: Remove Coordinator Classes (RECOMMENDED for V4.4)

These classes are not wired. They cannot function. Remove them to eliminate dead code and confusion. The gate-hook's `checkGateAdvance()` handles gate progression. Future iterations can re-add coordinators if/when they're properly wired.

### Option B: Wire Coordinators to Hooks (Future)

This is a significant architectural change requiring:
1. Coordinator classes refactored to be hook-compatible
2. `session.created` instantiates coordinator
3. `tool.execute.after` calls coordinator methods on relevant tool results
4. Agent switching communicated via `chat.system.transform` hook

**This is a V4.5+ item.** Not recommended for V4.4.

---

## DECISION

**Use Option A (Remove) for V4.4.**

Reasoning: The coordinator classes describe an architecture that doesn't exist. Keeping them creates false promises. V4.4 removes dead code honestly. V4.5+ can add real coordinator wiring if needed.

---

## VERIFICATION COMMANDS

Before fix — verify coordinator files exist:

```bash
test -f src/shark/micro/coordinator.ts
test -f src/shark/macro/peer-dispatch.ts
# Expected: both pass (files exist pre-removal)
```

After fix — verify coordinator files are removed:

```bash
test -f src/shark/micro/coordinator.ts && echo "FAIL" || echo "OK"
test -f src/shark/macro/peer-dispatch.ts && echo "FAIL" || echo "OK"
# Expected: both print "OK" (files removed)
```

---

## MECHANICAL CHECKLIST

- [ ] `src/shark/micro/coordinator.ts` removed
- [ ] `src/shark/macro/peer-dispatch.ts` removed
- [ ] `src/shark/micro/brains.ts` — no reference to `coordinator.ts`
- [ ] `src/shark/macro/brains.ts` — no reference to `peer-dispatch.ts`
- [ ] `src/index.ts` — no import of either coordinator class
- [ ] `src/index.ts` — `COORDINATOR_T1` variable still exists (used in agent instructions) — this is fine, it can remain as text
- [ ] `npx tsc --noEmit` passes
- [ ] `bun build` succeeds

---

## EXACT FIX

### Step 1: Remove coordinator files

```bash
rm src/shark/micro/coordinator.ts
rm src/shark/macro/peer-dispatch.ts
```

### Step 2: Verify no remaining references in source

```bash
# These should return no output after removal
grep -r "MicroCoordinator\|MacroPeerDispatch" src/ --include="*.ts" 2>/dev/null
```

### Step 3: Verify COORDINATOR_T1 still exists (it's just text)

```bash
grep -c "COORDINATOR_T1" src/shark/micro/brains.ts
# Expected: 1+ (the variable definition, not a class import)
```

### Step 4: Check for any remaining brain file references to removed files

```bash
# Should return no output
grep -r "coordinator\|peer-dispatch" src/shark/micro/ src/shark/macro/ --include="*.ts" 2>/dev/null | grep -v "COORDINATOR_T1"
```

---

## BUILD VERIFICATION

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Files removed
test ! -f src/shark/micro/coordinator.ts || { echo "FAIL: coordinator.ts not removed"; exit 1; }
test ! -f src/shark/macro/peer-dispatch.ts || { echo "FAIL: peer-dispatch.ts not removed"; exit 1; }

# No remaining imports
IMPORTS=$(grep -r "MicroCoordinator\|MacroPeerDispatch" src/ --include="*.ts" 2>/dev/null | grep -v "// " | wc -l)
if [ "$IMPORTS" -gt 0 ]; then
  echo "FAIL: $IMPORTS remaining references to removed coordinators"
  exit 1
fi

echo "PASS: Coordinator files removed, no remaining references"

# TypeScript
npx tsc --noEmit || exit 1

# Build
bun build src/index.ts --outdir dist --target bun --format esm --bundle || exit 1

echo "All checks pass"
exit 0
```

---

## NOTES

The `COORDINATOR_T1` string constant in `brains.ts` can remain — it is the coordinator's T1 prompt text that gets embedded in the shark-micro agent's instructions. Even though the coordinator class is removed, this text can describe what a coordinator would do if one existed. This is fine — it's documentation-as-prompt.

Removing the coordinator classes does NOT remove the coordinator's T1 prompt text. The T1 prompt describes the coordinator's role. The class was the implementation.

*Fix-02 complete. Dead code removed.*
