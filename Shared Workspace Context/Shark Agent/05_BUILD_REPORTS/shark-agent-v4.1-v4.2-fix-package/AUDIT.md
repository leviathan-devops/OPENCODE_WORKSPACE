# AUDIT — Shark Agent V4.1 Build Report

**Auditor:** auditing-build-reports skill
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/`
**Report:** `/home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4.1-build-report-2026-04-06.md`
**Date:** 2026-04-06

---

## VERIFICATION METHOD

Source-first, dist-secondary. Source files are authoritative. Dist is secondary — used only to understand how claims map to compiled output.

---

## BUNDLE COUNT CORRECTIONS

The V4.1 build report marked two items as `⚠️` with incorrect analysis:

| Claim | Report Said | Actual | Assessment |
|-------|-------------|--------|------------|
| GateManager in bundle | 2 (⚠️ low) | **38** | ✅ No issue — report counted source lines, not bundle |
| `shark-agent-v4` name | 0 (⚠️) | **0** | ✅ Expected — anonymous export, no self-identification |

---

## CRITICAL API DISCREPANCIES — VERIFIED

All 5 discrepancies the build correctly identified and fixed:

| # | Build-Context Said | Actual API | V4.1 Fix |
|---|--------------------|-----------|----------|
| 1 | `session.created` | `event` unified handler | ✅ Correct |
| 2 | `chat.system.transform` | `experimental.chat.system.transform` | ✅ Correct |
| 3 | Args in `input` | Args in `output` for `before`, `input` for `after` | ✅ Correct |
| 4 | Return `{ blocked: true }` | Return `void` | ✅ Correct — acknowledged |
| 5 | `zod` missing | `zod` available via `@opencode-ai/plugin` | ✅ Correct |

---

## UNRESOLVED ISSUES (Require V4.2 Fix)

These issues were NOT addressed in V4.1 and are now tracked for V4.2.

---

### UNRESOLVED-1: Guardian Cannot Block — Theater Logging Only

**Severity:** HIGH
**Source:** `src/hooks/v4.1/guardian-hook.ts:34-36`

```typescript
// Note: OpenCode plugin hooks don't support blocking directly.
// The dangerous command will be logged for audit purposes.
```

**Problem:** `guardian.isDangerousCommand()` and `guardian.canWrite()` are called and log output, but they cannot prevent execution. A `rm -rf /` command will be logged and then executed. The Guardian scope containment system is non-blocking in V4.1.

**Architectural impact:** Shark's mechanical enforcement claim depends on Guardian blocking dangerous operations. In V4.1, this is audit-only.

---

### UNRESOLVED-2: Coordinators Are Non-Functional Stubs

**Severity:** HIGH
**Source:** `src/index.ts:46-52`

```typescript
function getMicroCoordinator(): MicroCoordinator {
  throw new Error('Coordinator not yet wired to hooks');
}

function getMacroDispatcher(): MacroPeerDispatch {
  throw new Error('Dispatcher not yet wired to hooks');
}
```

**Problem:** `MicroCoordinator` and `MacroPeerDispatch` classes exist but are unreachable. Calling them throws immediately. The mechanical Plan↔Build switching described in Shark's architecture does not function.

---

### UNRESOLVED-3: TypeScript Not Verified

**Severity:** MEDIUM
**Source:** V4.1 build report does not mention `tsc --noEmit`

**Problem:** `bun build` does NOT type-check. The build can succeed with TypeScript errors. V4.1 build report claimed "complete" without verifying `npx tsc --noEmit` returns 0 errors.

---

### UNRESOLVED-4: shark-evidence Tool Imports `GateName` from Wrong Source

**Severity:** LOW (works but wrong rationale)
**Source:** `src/hooks/v4.1/gate-hook.ts:9`

```typescript
import { EvidenceCollector, type GateEvidence, type GateName } from '../../shark/shared/evidence.js';
```

**Problem:** Build report claimed `GateName` is "defined in gates.ts only" and imported from there. Reality: `GateName` IS exported from `evidence.ts:11`. The import works because `gates.ts` re-exports it, but the rationale was based on incorrect analysis.

---

## VERIFIED CORRECT

These items from V4.1 are correctly implemented:

| Item | Verification |
|------|-------------|
| All 5 hooks wired | `grep -c "event\|tool.execute.before\|tool.execute.after\|experimental.session.compacting\|experimental.chat.system.transform" src/hooks/v4.1/index.ts` → 5 |
| Evidence path `process.cwd()` | `src/index.ts:58-60` uses `path.join(process.cwd(), '.shark')` |
| Single T1 for shark-macro | `src/index.ts:108` uses only `EXECUTION_BRAIN_T1` |
| Hooks spread in return | `src/index.ts:72-73` has `...hooks,` |
| `tool.schema.enum()` used | `src/tools/shark-evidence.ts:16-18` correct |

---

## V4.2 REQUIRED FIXES

| Priority | Issue | Fix File |
|----------|-------|----------|
| HIGH | Guardian theater logging | `FIX_PACKAGE/01_FIX_GUARDIAN_BLOCKING.md` |
| HIGH | Coordinators unreachable | `FIX_PACKAGE/02_FIX_COORDINATORS.md` |
| MEDIUM | TypeScript unchecked | `FIX_PACKAGE/03_FIX_TYPESCRIPT.md` |
| LOW | GateName import rationale | `FIX_PACKAGE/04_FIX_GATENAME_IMPORT.md` |

---

*Audit complete. V4.2 fix package created.*
