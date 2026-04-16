# FIX-A: Ghost File — Remove Stale Backup

**Severity:** CRITICAL
**File:** `src/index.v4.0.ts`
**Audit ref:** NEW-1

---

## THE PROBLEM

`src/index.v4.0.ts` is a stale backup file from an earlier iteration. It imports:
- `MicroCoordinator` from `./shark/micro/coordinator.js` — DELETED in V4.4
- `MacroPeerDispatch` from `./shark/macro/peer-dispatch.js` — DELETED in V4.4

The `tsconfig.json` includes `["src/**/*"]` which matches this ghost file. TypeScript tries to compile it and fails with 2 errors.

**Result:** `npx tsc --noEmit` exits 2, not 0.

---

## VERIFICATION COMMANDS

Before fix — verify ghost file exists and causes TS failure:

```bash
test -f src/index.v4.0.ts && echo "Ghost file exists"
npx tsc --noEmit 2>&1 | grep -c "error TS2307"  # Expected: 2
```

After fix — verify ghost file removed and TypeScript passes:

```bash
test -f src/index.v4.0.ts && echo "FAIL" || echo "Ghost file removed"
npx tsc --noEmit 2>&1 | grep -c "error TS2307"  # Expected: 0
```

---

## MECHANICAL CHECKLIST

- [ ] `src/index.v4.0.ts` deleted
- [ ] `npx tsc --noEmit` exits 0
- [ ] No remaining references to coordinator.js or peer-dispatch.js in TypeScript errors

---

## EXACT FIX

### Step 1: Delete the ghost file

```bash
rm /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/index.v4.0.ts
```

### Step 2: Verify TypeScript passes

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
npx tsc --noEmit
```

Expected: no errors, exit 0.

### Step 3: Verify the backup is truly gone

```bash
test -f src/index.v4.0.ts && echo "FAIL" || echo "PASS"
```

---

## BUILD VERIFICATION

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Ghost file must be gone
test ! -f src/index.v4.0.ts || { echo "FAIL: index.v4.0.ts still exists"; exit 1; }

# TypeScript must pass
TS_OUTPUT=$(npx tsc --noEmit 2>&1)
TS_EXIT=$?
echo "TypeScript output: $TS_OUTPUT"
echo "TypeScript exit: $TS_EXIT"

if [ "$TS_EXIT" -ne 0 ]; then
  echo "FAIL: TypeScript errors present"
  exit 1
fi

echo "All checks pass"
exit 0
```

---

*Fix-A complete. Ghost file removed, TypeScript passes.*