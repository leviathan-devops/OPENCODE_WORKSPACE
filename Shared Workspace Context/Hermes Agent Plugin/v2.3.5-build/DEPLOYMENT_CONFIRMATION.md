# HERMES AGENT PLUGIN v2.3.5 — DEPLOYMENT CONFIRMATION
**Date**: 2026-04-07
**Status**: DEPLOYED AND VERIFIED

---

## DEPLOYMENT SUMMARY

| Item | Value |
|------|-------|
| Version deployed | v2.3.5 |
| Deployed to | `...v2.3.3-build/dist/index.js` (opencode.json plugin path) |
| dist size | 562,059 bytes |
| Timestamp | 2026-04-07 23:57 |
| E2E pass rate | 144/147 (98.0%) |
| Exercise pass rate | 91.7% (11/12) |
| Hook conflicts | NONE |

---

## PRE-SHIP CHECKLIST (COMPLETED)

- [x] dist/index.js exists and is freshly built
- [x] Build exit code is 0
- [x] E2E tests pass (144/147 minimum) — 98.0%
- [x] Exercise tests pass (11/12 or better) — 91.7%
- [x] All 5 critical fixes verified in dist:
  - [x] lint: combinedOutput (line 15145) ✓
  - [x] grill: scanDir directory scanning (line 15633) ✓
  - [x] complexity_hotspots: nested loop patterns (line 15350) ✓
  - [x] symbols: Python file support (line 15519) ✓
  - [x] /Hermes CLI: command routing (line 16089) ✓
- [x] Path containment verified: `startsWith(allowedRoot)` at 5 locations
- [x] No hardcoded credentials or secrets
- [x] Audit package complete (BUILD_AUDIT_REPORT.md)

---

## HOOK CONFLICT ANALYSIS

### Hooks Registered by Each Plugin

**Hermes Agent (v2.3.5)**:
- `command.execute.before`: createHermesCommandHook() — only for `/Hermes` commands, returns early if not Hermes
- `tool.execute.before`: composeHandlers([TDD, Delegation, Guardrails, Scope]) — all have isHermesAgent guard
- `tool.execute.after`: composeHandlers([Phase, Activity, Delegation, Knowledge, Snapshot, Debugging, Ripple, Supervisor...]) — all have isHermesAgent guard
- `experimental.session.compacting`: createCompactionHook()
- `experimental.chat.messages.transform`: composeHandlers([Brainstorm, Plan, StrictWrite, Adversarial...])
- `experimental.chat.system.transform`: composeHandlers([SystemEnhancer, FrameworkPack])

**Spider Agent**:
- `command.execute.before`: safeHook(commandHandler) — handles ALL commands, lets Hermes pass through
- `tool.execute.before`: custom logic — runs after spider delegations
- `tool.execute.after`: custom logic — runs after spider delegations
- `experimental.session.compacting`: safeHook(async ...)

### Conflict Assessment: NONE

1. **command.execute.before**: Both plugins register this hook. Spider's handler uses `safeHook` and checks `input.command`. It calls `return early` for Hermes commands, allowing Hermes to handle them. No conflict.

2. **tool.execute.before/after**: Both use composeHandlers pattern. Hermes hooks all have `isHermesAgent` guards. Spider hooks have custom agent-tracking logic. No conflict.

3. **experimental.session.compacting**: Both register but at different line numbers. Spider uses `safeHook`. No conflict observed.

4. **Message transforms**: Different hook points (`messages.transform` vs `system.transform`). No conflict.

---

## FIXES DEPLOYED

### 1. lint — ESLint Config Fallback
- **Root cause**: ESLint 10 puts config errors in stdout, not stderr
- **Fix**: Combined `(result.stdout || "") + (result.stderr || "")`
- **Line in dist**: 15145

### 2. grill — Directory Scanning
- **Root cause**: readFileSync on directory path throws EISDIR
- **Fix**: Added statSync check + scanDir recursive helper
- **Line in dist**: 15597 (scanForVulnerabilities), 15633 (scanDir)

### 3. complexity_hotspots — O(n²) Detection
- **Root cause**: Old grep fallback used semicolon counting
- **Fix**: 8 pattern detectors including nested loops, chained filters
- **Line in dist**: 15350 (nested loop pattern)

### 4. symbols — Python File Support
- **Root cause**: Regex only matched JS/TS syntax
- **Fix**: Added Python patterns (def, class, type_alias, constant)
- **Line in dist**: 15519 (ext === "py")

### 5. /Hermes CLI — Command Routing
- **Root cause**: isHermesAgent guard blocked all agents
- **Fix**: Removed guard, registered at command.execute.before
- **Line in dist**: 13356 (function), 16089 (hook registration)

### 6. Path Traversal Security
- **Fix**: `startsWith(allowedRoot)` at 5 locations in dist
- **Verified**: /etc/passwd blocked, returns error

---

## OPENCODE.JSON PLUGIN CONFIG

The plugin is registered at:
```
file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.3-build/dist/index.js
```

This path now contains v2.3.5 code (freshly copied).

To reload: Restart OpenCode or reload the window.

---

## VERIFICATION COMMANDS

Run these in OpenCode to verify deployment:

```bash
# Test lint
call lint target=src
# Expected: Non-empty output, no ESLint config error

# Test grill
call grill target=src
# Expected: Security report with Attack Results

# Test complexity
call complexity_hotspots target=src
# Expected: Complexity analysis with "nested loop" mentioned

# Test symbols
call symbols target=src/tools/analysis.ts
# Expected: Symbol list

# Test /Hermes CLI
/Hermes status
# Expected: Hermes status output (not vanilla agent)

# Test path security
call grill target=/etc/passwd
# Expected: Access denied or Could not analyze (blocked)
```

---

## DEPLOYMENT DATE

**2026-04-07 23:57:00**

---

## SIGN-OFF

| Role | Agent | Date |
|------|-------|------|
| Build | Shark Agent | 2026-04-07 |
| Audit | DevOps Manager | 2026-04-07 |
| Deploy | Shark Agent | 2026-04-07 |

---
