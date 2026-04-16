# FIX-04: GateName Import Wrong Rationale

**Severity:** LOW
**Source file:** `src/hooks/v4.1/gate-hook.ts`
**Audit ref:** UNRESOLVED-4

---

## THE PROBLEM

The V4.1 build report stated: "`GateName` is defined in `gates.ts` only. Fix applied: Imported `GateName` from `gates.ts`."

This is **incorrect**. The actual state:

1. `GateName` IS exported from `evidence.ts:11`
2. `gates.ts` IMPORTS `GateName` from `evidence.ts` and re-exports it
3. `gate-hook.ts` imports from `evidence.ts` — which is correct

The import works, but the build report's rationale was wrong.

**Current import in gate-hook.ts:9:**
```typescript
import { EvidenceCollector, type GateEvidence, type GateName } from '../../shark/shared/evidence.js';
```

This is **correct** — `evidence.ts` exports `GateName`.

**gates.ts:10:**
```typescript
import { EvidenceCollector, type GateName, type GateEvidence } from './evidence.js';
```

`gates.ts` imports from `evidence.ts`, it does not define `GateName`.

---

## VERIFICATION COMMANDS

Verify `GateName` definition location:

```bash
grep -n "^export type GateName" src/shark/shared/evidence.ts
# Expected: "export type GateName = 'plan' | 'build' ..."

grep -n "^export type GateName" src/shark/shared/gates.ts
# Expected: nothing (GateName NOT defined in gates.ts)
```

Verify import is from `evidence.ts` (correct):

```bash
grep -n "type GateName.*from.*evidence" src/hooks/v4.1/gate-hook.ts
# Expected: line importing from '../../shark/shared/evidence.js'
```

---

## MECHANICAL CHECKLIST

- [ ] `GateName` definition confirmed in `evidence.ts`
- [ ] `GateName` NOT defined in `gates.ts`
- [ ] `gate-hook.ts` imports from `evidence.ts` (not `gates.ts`)
- [ ] Build report rationale section updated

---

## EXACT FIX

This is a **documentation fix**, not a code fix. The code is correct.

**FIND in build report section "Critical API Discrepancies":**

```markdown
### 5. `GateName` Not Exported from Evidence Module
**Build-context said:** `GateName` could be imported from `evidence.ts`
**Actual finding:** `GateName` is defined in `gates.ts` only
**Fix applied:** Imported `GateName` from `gates.ts` in `gate-hook.ts`.
```

**REPLACE WITH:**

```markdown
### 5. `GateName` Import — Works, Rationale Was Wrong
**Build-context implied:** `GateName` could be imported from `evidence.ts`
**Actual finding:** `GateName` IS exported from `evidence.ts:11`. `gates.ts` imports and re-exports it.
**gate-hook.ts import:** Correctly imports from `evidence.ts`.
**Build report rationale:** Was incorrect — `GateName` is NOT defined in `gates.ts`. The fix worked but for the right reason, not the stated reason.
```

---

## SOURCE FILE IS ALREADY CORRECT

No source code change needed. `src/hooks/v4.1/gate-hook.ts:9` imports from `evidence.ts` which is correct.

This fix is only to correct the build report's documentation error.

---

## VERIFICATION

```bash
# Verify GateName definition is in evidence.ts
grep -c "^export type GateName" src/shark/shared/evidence.ts
# Expected: 1

# Verify GateName is NOT defined in gates.ts
grep -c "^export type GateName\|^export interface GateName" src/shark/shared/gates.ts
# Expected: 0

# Verify gate-hook imports from evidence.ts
grep "type GateName.*from.*evidence" src/hooks/v4.1/gate-hook.ts
# Expected: import { ..., type GateName } from '../../shark/shared/evidence.js'
```

---

*Fix-04 complete. Code is correct. Documentation fixed.*
