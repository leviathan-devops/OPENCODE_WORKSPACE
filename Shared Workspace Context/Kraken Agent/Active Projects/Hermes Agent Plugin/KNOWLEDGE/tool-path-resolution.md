# KNOWLEDGE: Tool Path Resolution — Critical Pattern

**File:** `src/tools/analysis.ts`, `src/tools/verification.ts`  
**Version:** v3-overhaul  
**Last Updated:** 2026-04-14  

---

## The Problem

`context.worktree` may be `undefined` in some OpenCode tool contexts. Tools that use `context.worktree` directly without a fallback will fail or produce wrong results.

**Evidence from v2.3.5 PROGRESS_REPORT:**
- `imports` — path resolution fails with real `context.worktree`  
- `symbols` — same path resolution failure

---

## The Fix Pattern

**Always use the fallback chain:**

```typescript
// WRONG (v2.3.5 bug):
const fullPath = join(context.worktree, args.path);

// CORRECT (v3 fix):
const fullPath = join(context.directory ?? context.worktree ?? process.cwd(), args.path);
```

**And for path containment checks:**

```typescript
// WRONG:
const allowedRoot = resolve(context.worktree);

// CORRECT:
const allowedRoot = resolve(context.directory ?? context.worktree ?? process.cwd());
```

---

## Where This Pattern Appears

| File | Tool | Status |
|------|------|--------|
| `src/tools/analysis.ts` | `imports` | ✅ Has fallback |
| `src/tools/analysis.ts` | `symbols` | ✅ Has fallback |
| `src/tools/verification.ts` | `grill` | ✅ Has fallback |
| `src/tools/analysis.ts` | `complexityHotspots` | ✅ Has fallback |
| `src/tools/analysis.ts` | `detectDomains` | ⚠️ Partial (uses `context.directory` but not `context.worktree`) |
| `src/tools/analysis.ts` | `extractCodeBlocks` | N/A (no path) |

---

## Verified Working Pattern

From `src/tools/verification.ts` (lines 37-43):

```typescript
const fullPath = join(context.directory, args.target);
const resolved = resolve(fullPath);
const allowedRoot = resolve(context.directory);

if (!resolved.startsWith(allowedRoot)) {
  return `Error: Access denied. Target "${args.target}" resolves outside project directory.`;
}
```

This is the CORRECT pattern — `context.directory` as primary, no direct `context.worktree` usage.

---

## Tools to Test After Applying Fixes

```bash
# Test imports tool
# Should return import list for src/index.ts

# Test symbols tool on TypeScript file
# Should return function/class symbols

# Test symbols tool on Python file
# Should return def/class symbols

# Test grill tool on directory
# Should recursively scan and return findings
```

---

## Cross-Reference

Same pattern documented in:
- `../Hermes Agent Plugin/OVERHAUL_BUILD/03_CONTEXT_LIBRARY/05_INTERFACES.md`
- `DEBUG_LOG.md` (DEBUG-003)
