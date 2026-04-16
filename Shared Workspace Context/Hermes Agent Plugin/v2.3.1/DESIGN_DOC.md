# HERMES AGENT PLUGIN v2.3.1 — DESIGN DOC
**Build ID**: v2.3.1-fix-2026-0405  
**Date**: 2026-04-05  
**Status**: DRAFT — PENDING EXECUTION  
**Approach**: Option B for Fix 5 (explicit supervisor tool)

---

## PURPOSE

Fix the 7 confirmed bugs in v2.3-build using mechanical enforcement. Each fix has exact file/line/change/verification. No placeholders. No ambiguity.

---

## EXECUTION PLAN

### Step 0: Create workspace
```bash
cp -r \
  "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3-build" \
  "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.1-build"
```

### Step 1: Fix 01 — secretScan CRITICAL
**File**: `src/tools/security.ts`  
**Change**: `export const secretScan=***` → `export const secretScan = tool({`  
**Verification**: `grep -n "export const secretScan = tool({" v2.3.1-build/src/tools/security.ts`

### Step 2: Fix 02 — symbols PATH TRAVERSAL HIGH
**File**: `src/tools/analysis.ts`  
**Change**: Add `resolve()` + `startsWith(allowedRoot)` containment check before `readFileSync`  
**Verification**: `grep -n "startsWith(allowedRoot)" v2.3.1-build/src/tools/analysis.ts`

### Step 3: Fix 03 — complexityHotspots PATH VALIDATION MEDIUM
**File**: `src/tools/analysis.ts`  
**Change**: Validate `target` path with `resolve()` + `startsWith(allowedRoot)` before passing to `tsc --diagnostics`  
**Verification**: `grep -n "startsWith(allowedRoot)" v2.3.1-build/src/tools/analysis.ts` (2+ occurrences)

### Step 4: Fix 04 — Delegation Gate BLOCKING HIGH
**File**: `src/hooks/delegation-gate.ts`  
**Change**: Add `(output as any).blocked = true;` before `_gate_blocked` annotation  
**Verification**: `grep -n "(output as any).blocked = true" v2.3.1-build/src/hooks/delegation-gate.ts`

### Step 5: Fix 05 — Supervisor Metadata MEDIUM (Option B)
**File**: `src/tools/supervisor.ts` (NEW) + `src/index.ts`  
**Change**: Create `getSupervisorRecommendations` tool; register in index.ts  
**Verification**: `ls v2.3.1-build/src/tools/supervisor.ts && grep "get_supervisor_recommendations" v2.3.1-build/src/index.ts`

### Step 6: Fix 06 — CLI Handlers MEDIUM
**File**: `src/config/hermes-commands.ts` (NEW) + `src/index.ts`  
**Change**: Implement `HERMES_COMMANDS` object with `status`, `agents`, `memory`, `help`; remove `/Shark` command  
**Verification**: `ls v2.3.1-build/src/config/hermes-commands.ts && grep -c "Shark" v2.3.1-build/src/index.ts` returns 0

### Step 7: Fix 07 — DevOps Path MEDIUM
**File**: `src/config/devops-manager.ts`  
**Change**: Use `HERMES_DEVOPS_CONTEXT_DIR` env var; default to relative `./context/devops-manager`; create `context/devops-manager/` directory with all 8 files  
**Verification**: `grep -c "HERMES_DEVOPS_CONTEXT_DIR" v2.3.1-build/src/config/devops-manager.ts` ≥ 2

### Step 8: Run verification suite
```bash
bash "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.1/FIX_PACKAGE/verify.sh"
```
**Must return EXIT 0** before proceeding.

### Step 9: Build
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.1-build"
bun build.ts
```
**Must exit 0** and generate `dist/index.js`.

### Step 10: Deploy
Copy `dist/index.js` to target plugin directory.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| secretScan wrapped | `grep "secretScan = tool({" src/tools/security.ts` | 1+ match |
| No `=***` | `grep "secretScan=\*" src/tools/security.ts` | NO OUTPUT |
| symbols containment | `grep "startsWith(allowedRoot)" src/tools/analysis.ts` | 2+ matches |
| delegation blocked | `grep "(output as any).blocked = true" src/hooks/delegation-gate.ts` | 1 match |
| supervisor tool | `ls src/tools/supervisor.ts` | file exists |
| CLI commands | `grep "Shark" src/index.ts` | NO OUTPUT |
| DevOps env var | `grep "HERMES_DEVOPS_CONTEXT_DIR" src/config/devops-manager.ts` | 2+ matches |
| TypeScript | `npx tsc --noEmit` | 0 errors |
| Build | `bun build.ts` | EXIT 0 |

---

## DECISIONS MADE

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Fix 5 approach | **Option B** | Explicit tool is testable; doesn't depend on undocumented SDK behavior |
| Shark command | **REMOVE** | Belongs to shark-agent-plugin, not hermes-agent-plugin |
| DevOps path | **Env var + relative** | Configurable, portable, backwards-compatible fallback |

---

## PACKAGE DEPENDENCIES

- `v2.3-build/` source files
- `FIX_PACKAGE/` in `v2.3.1/` directory (verification scripts and fix descriptions)
- `context/devops-manager/` files from `v2.3.1/context/`

---

*Document generated: 2026-04-05*
*This is a mechanical enforcement document. Follow it exactly. Show all command outputs.*
