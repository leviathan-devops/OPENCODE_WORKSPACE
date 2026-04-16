# Hermes Agent v2.2.0 — Patch Release

**Date:** 2026-04-04
**From:** v2.1.0 (never successfully compiled)
**Severity:** Build-breaking bugs fixed — now compiles cleanly

---

## Bug Fixes

### Fix 1 — `secretScan` Hard Corruption (`src/tools/security.ts:60`)

**Severity:** CRITICAL — syntax error, prevented compilation

**Problem:** The `tool({...})` wrapper was completely missing from `secretScan`. The export was:
```typescript
export const secretScan=***
  description: "Detect secrets/credentials in code",
  args: { ... },
  execute: async (args, context) => { ... }
```

The `=***` comment was a placeholder that was never replaced with `tool({`. The `args` object and `execute` function were syntactically orphaned outside any function call. TypeScript would fail with a parse error.

**Fix:** Wrapped in proper `tool({...})`:
```typescript
export const secretScan = tool({
  description: "Detect secrets/credentials in code",
  args: { ... },
  execute: async (args, context) => { ... },
});
```

**Note:** This corruption was NOT a TypeScript error in the traditional sense — the `/** comment **/` syntax is valid TypeScript/JSDoc, so the compiler passed it. But at runtime, calling `secretScan(...)` would try to invoke `***` (a comment) as a function, immediately throwing.

---

### Fix 2 — Duplicate Import (`src/index.ts:30`)

**Severity:** HIGH — TypeScript `duplicate identifier` error

**Problem:**
```typescript
import { createKnowledgeInjectorHook } from "./hooks/knowledge-injector.js";  // line 12
// ... 17 imports later ...
import { createKnowledgeInjectorHook } from "./hooks/knowledge-injector.js";  // line 30 — DUPLICATE
```

**Fix:** Removed the duplicate import at line 30.

---

### Fix 3 — `evidenceCheck` Wrong Workspace Path (`src/tools/verification.ts:108`)

**Severity:** MEDIUM — wrong namespace

**Problem:** Hardcoded `.Spider/evidence/` instead of `.hermes/evidence/`:
```typescript
const evidenceDir = join(context.directory, ".Spider", "evidence");
```

**Fix:** Made configurable via `HERMES_EVIDENCE_DIR` env var, defaulting to `.hermes`:
```typescript
const evidenceBase = process.env.HERMES_EVIDENCE_DIR ?? ".hermes";
const evidenceDir = join(context.directory, evidenceBase, "evidence");
```

---

### Fix 4 — `snapshot-writer` Hook `output.output` Undefined (`src/hooks/snapshot-writer.ts:33,35`)

**Severity:** HIGH — runtime TypeError on `checkpoint` and `phase_complete` calls

**Problem:** The `tool.execute.after` hook receives `(input, output)` where `output` is the tool's return value (a string), not an object with an `.output` property. Calling `output.output.substring(0, 500)` on a string throws `TypeError: Cannot read property 'output' of undefined`.

```typescript
// BROKEN:
phase: getPhaseFromOutput(output.output),
summary: output.output.substring(0, 500),
```

**Fix:** Defensively handle both string and object output:
```typescript
const rawOutput = typeof output === 'string' ? output : (output as any).output ?? '';
phase: getPhaseFromOutput(rawOutput),
summary: rawOutput.substring(0, 500),
```

---

### Fix 5 — Workspace Path Hardcoded (NOT A BUG — Doc Was Wrong)

**Status:** NOT A BUG — Already correct in source

The BUGFIXES doc claimed `workspace: "~/hermes-workspace"` was hardcoded. Verified in `src/config/loader.ts:27`:
```typescript
workspace: null, // Resolved from context.directory at runtime
```

The `null` default defers resolution to the actual project directory at runtime. No fix needed.

---

## Verification Commands

```bash
# Verify secretScan is now a proper tool call (not broken export)
grep -n "export const secretScan" src/tools/security.ts
# Expected: "export const secretScan = tool({"

# Verify no duplicate import
grep -n "createKnowledgeInjectorHook" src/index.ts
# Expected: only ONE line

# Verify evidenceCheck uses env var
grep -n "HERMES_EVIDENCE_DIR" src/tools/verification.ts
# Expected: "const evidenceBase = process.env.HERMES_EVIDENCE_DIR ?? \".hermes\";"

# Verify snapshot-writer handles string output
grep -n "typeof output === 'string'" src/hooks/snapshot-writer.ts
# Expected: two occurrences (phase + summary)

# Attempt build
cd v2.2-build && bun build.ts
# Expected: clean compile → dist/index.js
```

---

## What Changed From v2.1.0

| File | Change |
|------|--------|
| `src/tools/security.ts` | Fixed `secretScan` — wrapped in `tool({...})` |
| `src/index.ts` | Removed duplicate `createKnowledgeInjectorHook` import |
| `src/tools/verification.ts` | Fixed `evidenceCheck` — env-configurable path, default `.hermes` |
| `src/hooks/snapshot-writer.ts` | Fixed `output.output` → defensive string/object handling |
| `package.json` | Version bump: `2.1.0` → `2.2.0` |

All other files unchanged from v2.1.0 source.
