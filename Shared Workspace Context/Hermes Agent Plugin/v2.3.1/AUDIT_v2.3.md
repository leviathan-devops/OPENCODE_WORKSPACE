# HERMES AGENT PLUGIN v2.3 — PRESSURE TEST AUDIT
**Audit Date**: 2026-04-05
**Source**: v2.3-build
**Auditor**: Claude (pressure test against build report claims)

---

## EXECUTIVE SUMMARY

v2.3 build report declares: **PRODUCTION READY** (98.0% E2E pass rate)

**Reality: NOT PRODUCTION READY**

The build report is **verification theater** — tests pass because they don't exercise the broken code paths. The build passes because `bun build.ts` doesn't type-check. The code compiles to JavaScript that would crash at runtime.

| Claim | Reality |
|-------|---------|
| "secretScan already fixed in v2.2" | **FALSE** — `=***` placeholder still present |
| "98.0% pass rate" | **TRUE** — but tests don't test broken code paths |
| "Production ready" | **FALSE** — critical runtime crash waiting to happen |
| "TypeScript compilation succeeds" | **TRUE** — but TypeScript errors are ignored by bun |

---

## CRITICAL BUGS (Must fix before any deployment)

### 🔴 BUG 1: `secretScan` — STILL BROKEN (CRITICAL)

**File**: `src/tools/security.ts:64`
**Status**: NOT FIXED — same corruption as v2.1, v2.2

```typescript
export const secretScan=***
  description: "Detect secrets/credentials in code",
  args: {
    path: tool.schema.string().optional().describe("Path to scan"),
  },
  execute: async (args, context) => {
```

The `=***` was a placeholder in v2.1. The v2.2 CHANGELOG claimed "Fix 1 — secretScan Hard Corruption" was fixed. It was NOT. The `args` object and `execute` function are orphaned outside any `tool({...})` call.

**Runtime behavior**: Calling `secretScan(...)` tries to call `***` (a comment) as a function → immediate crash.

**Why build passes**: `bun build.ts` compiles valid JavaScript. The JSDoc comment is syntactically legal. TypeScript errors (31 of them) are ignored.

**Why tests pass**: No test actually calls `secretScan`.

---

### 🟠 BUG 2: `symbols` — PATH TRAVERSAL (HIGH)

**File**: `src/tools/analysis.ts:121`
**Status**: NEW VULNERABILITY — same class as v2.2's `imports` bug

```typescript
const fullPath = join(context.directory, args.path);
const content = readFileSync(fullPath, "utf-8");  // NO validation
```

No `resolve()` + `startsWith()` containment check. An agent could pass `../../etc/passwd` to read arbitrary files.

The v2.3 plan said to fix path traversal in `imports` — and that WAS fixed. But `symbols` was missed. Same vulnerability class, different function.

---

### 🟠 BUG 3: `complexityHotspots` — UNVALIDATED PATH (MEDIUM)

**File**: `src/tools/analysis.ts:13`
**Status**: Same pattern as BUG 2

The `target` path is passed to `tsc --diagnostics` and `grep` without path validation. While these are read-only commands, malformed paths could cause unexpected behavior.

---

## THEATRICAL CODE ISSUES

### 🔴 FIX 4: `delegation-gate` — DOES NOT BLOCK

**File**: `src/hooks/delegation-gate.ts:21-31`
**Status**: Plan spec says `output.blocked = true`, implementation only annotates

Plan spec:
```typescript
if (task?.metadata?.reviewerApproved !== true) {
  output.blocked = true;  // ← SPEC
  output.message = `[DELEGATION GATE]...`;
}
```

Actual code:
```typescript
output.args = {
  ...args,
  _gate_blocked: { gate: "reviewer_approval", message: "..." },
};
// NO output.blocked = true
```

The gate annotates with `_gate_blocked` but does NOT block. An agent could ignore the annotation and proceed anyway.

---

### 🔴 FIX 5: `supervisor-loop-hook` — `output.metadata` NEVER REACHES AGENT

**File**: `src/hooks/supervisor-loop-hook.ts:22-26`
**Status**: Feature exists, runs without error, produces output that goes nowhere

```typescript
output.metadata = {
  ...output.metadata,
  supervisor_recommendation: recommendation,
  supervisor_issue_id: issue.id,
};
```

There is no evidence OpenCode's plugin API surfaces `output.metadata` back to the agent. If the SDK doesn't consume this field, this entire feature is theater — recommendations are generated but never delivered.

This is the same class as "DeepSeek R1 supervision available but not called" in Shark Agent.

---

### 🟠 FIX 6: `/Hermes` and `/Shark` CLI — REGISTERED BUT NO HANDLERS

**File**: `src/index.ts:319-329`
**Status**: Command templates registered, no handler functions exist

```typescript
opencodeConfig.command = {
  Hermes: { template: "/Hermes $ARGUMENTS", ... },
  Shark: { template: "/Shark $ARGUMENTS", ... },
};
```

No handler function exists. `/Hermes status`, `/Hermes agents`, `/Shark audit` all do nothing.

**Note**: `/Shark` is cross-contamination. Shark belongs to shark-agent-plugin, not hermes-agent-plugin.

---

### 🟠 FIX 7: `devops-manager.ts` — HARDCODED LEVIATHAN PATH

**File**: `src/config/devops-manager.ts:4`
**Status**: Works for Leviathan, silently fails for everyone else

```typescript
const DEVOPS_CONTEXT_DIR = resolve("/home/leviathan/hermes-workspace/context/devops-manager");
```

If this path doesn't exist, the DevOps Manager prompt becomes `[Context file not found: MENTAL_MODEL.md]`. The plugin builds successfully but the agent identity is silently degraded.

---

## V2.3 PLAN vs IMPLEMENTATION MISMATCHES

| Plan Spec | Actual | Gap |
|-----------|--------|-----|
| `secretScan` fixed | Still broken (`=***`) | FAILED |
| `grill` path validation | Fixed ✅ | OK |
| `sast_scan` npx check | Fixed ✅ | OK |
| TDD enforcer: `output.blocked = true` | Implemented ✅ | OK |
| Plan validator: schema + claims | Implemented ✅ | OK |
| Brainstorm gate blocks without design.md | Implemented ✅ | OK |
| Delegation gate: `output.blocked = true` | **Only annotates** | GAP |
| Supervisor loop wired | Hook exists but `output.metadata` may not reach agent | THEATRICAL |
| CLI commands wired | Templates registered, no handlers | GAP |
| DevOps identity injected | Hardcoded path, silently fails | GAP |

---

## ROOT CAUSE ANALYSIS

### Why the build passes with 31 TypeScript errors

`bun build.ts` compiles TypeScript to JavaScript. It does not type-check. `npx tsc --noEmit` shows 31 errors but those are never run as part of the build pipeline.

The build script needs:
```bash
npx tsc --noEmit || exit 1
```

### Why tests pass with broken `secretScan`

No test calls `secretScan` directly. The tool is exported and registered but never exercised. The test suite doesn't test tool implementation correctness — it tests that the plugin loads and responds to known inputs.

### Why the build report says "Production Ready"

The report is based on test pass rates and build exit codes. It doesn't audit:
1. Source code correctness
2. TypeScript error counts
3. Runtime behavior of edge cases
4. Whether wired features actually connect to their targets

---

## RECOMMENDATION

v2.3 is NOT production ready. Fix all 7 bugs in FIX_PACKAGE before deployment.

Use the FIX_PACKAGE directory for mechanical enforcement:
- Each fix has exact file, exact line, exact change, exact verification command
- `verify.sh` runs all checks and returns EXIT 0 only if all pass
- Build does not ship until verification passes

---

## FILES IN THIS DIRECTORY

```
v2.3.1/
├── AUDIT_v2.3.md           # This audit
├── FIX_PACKAGE/            # Mechanical fix package
│   ├── 00_INDEX.md         # Manifest
│   ├── 01_BUG_SECRETSCAN.md
│   ├── 02_BUG_SYMBOLS_TRAVERSAL.md
│   ├── 03_BUG_COMPLEXITY_PATH.md
│   ├── 04_FIX_DELEGATION_GATE.md
│   ├── 05_FIX_SUPERVISOR_METADATA.md
│   ├── 06_FIX_CLI_HANDLERS.md
│   ├── 07_FIX_DEVOPS_PATH.md
│   ├── 08_VERIFICATION_SUITE.md
│   ├── 09_BUILD_STEPS.md
│   ├── verify.sh
│   └── README.md
└── context/                # Placeholder context files
    └── devops-manager/
        ├── MENTAL_MODEL.md
        ├── INDEX.md
        ├── AUDIT_FRAMEWORK.md
        ├── PATTERNS.md
        ├── VERIFICATION.md
        ├── ESCALATION.md
        ├── HERMES_AGENT_PLUGIN.md
        └── README.md
```
