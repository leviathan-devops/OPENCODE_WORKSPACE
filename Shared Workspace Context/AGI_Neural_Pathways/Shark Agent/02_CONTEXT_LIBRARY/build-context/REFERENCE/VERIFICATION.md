# VERIFICATION — V1.1 Build

Pre-build and post-build checks with hard pass/fail criteria.

---

## PRE-BUILD CHECKS (Phase 8)

Run these BEFORE swapping files. If any check fails, STOP.

### File Existence Checks

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# All these must exist
test -f src/hooks/v1.1.0/index.ts                  # hooks aggregator
test -f src/hooks/v1.1.0/guardian-hook.ts           # Guardian wiring
test -f src/hooks/v1.1.0/gate-hook.ts               # GateManager + Evidence wiring
test -f src/hooks/v1.1.0/session-hook.ts            # session.created
test -f src/hooks/v1.1.0/compacting-hook.ts        # session.compacting
test -f src/hooks/v1.1.0/system-transform-hook.ts   # chat.system.transform
test -f src/hooks/v1.1.0/utils.ts                   # hook utilities
test -f src/index.v1.1.0.ts                         # new plugin entry
test -f src/tools/shark-evidence.v1.1.0.ts          # fixed evidence tool

# Must print "0" if all exist (test returns 0 on success)
echo "Missing files: $(find src/hooks/v1.1.0/ src/ -name "*.v1.1.0.ts" -o -name "index.v1.1.0.ts" | wc -l)"
# Expected: 9
```

### Backup Verification

```bash
# Backup must exist with original files intact
test -f ../shark-agent-v1.0-backup/src/index.ts
test -f ../shark-agent-v1.0-backup/src/tools/shark-evidence.ts
# Expected: both pass
```

### Source Code Verification

```bash
# Hooks index must import createGuardianHook, createGateHook, etc.
grep -c "createGuardianHook\|createGateHook\|createSessionHook\|createCompactingHook\|createSystemTransformHook" \
  src/hooks/v1.1.0/index.ts
# Expected: 5 (one for each hook creator)

# Plugin entry must spread createSharkHooks
grep -c "...createSharkHooks\|\\.\\.\\.hooks" src/index.v1.1.0.ts
# Expected: 1+

# Plugin entry must use process.cwd() for evidence
grep -c "process.cwd()" src/index.v1.1.0.ts
# Expected: 1+

# shark-evidence must NOT import zod
grep -c "from 'zod'" src/tools/shark-evidence.v1.1.0.ts
# Expected: 0

# shark-evidence must use tool.arg.enum()
grep -c "tool.arg.enum" src/tools/shark-evidence.v1.1.0.ts
# Expected: 2+
```

---

## POST-BUILD CHECKS (Phase 10)

Run these AFTER `bun build`. If any check fails, STOP and do not register.

### Build Success Check

```bash
# Build must succeed (exit code 0)
bun build src/index.ts \
  --outdir dist \
  --target bun \
  --format esm \
  --bundle
# Expected: exit code 0

# dist/index.js must exist and be non-empty
test -s dist/index.js
# Expected: passes
```

### Bundle Hook Integration Check

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# CRITICAL: Bundle must contain hook function bodies

echo "=== HOOK INTEGRATION VERIFICATION ==="

# Check 1: tool.execute.before referenced
BEFORE=$(grep -c "tool.execute.before" dist/index.js 2>/dev/null || echo "0")
echo "tool.execute.before count: $BEFORE"
if [ "$BEFORE" -lt 1 ]; then echo "FAIL: tool.execute.before not in bundle"; fi

# Check 2: tool.execute.after referenced
AFTER=$(grep -c "tool.execute.after" dist/index.js 2>/dev/null || echo "0")
echo "tool.execute.after count: $AFTER"
if [ "$AFTER" -lt 1 ]; then echo "FAIL: tool.execute.after not in bundle"; fi

# Check 3: session.created referenced
SESS=$(grep -c "session.created" dist/index.js 2>/dev/null || echo "0")
echo "session.created count: $SESS"
if [ "$SESS" -lt 1 ]; then echo "FAIL: session.created not in bundle"; fi

# Check 4: session.compacting referenced
COMPACT=$(grep -c "session.compacting" dist/index.js 2>/dev/null || echo "0")
echo "session.compacting count: $COMPACT"
if [ "$COMPACT" -lt 1 ]; then echo "FAIL: session.compacting not in bundle"; fi

# Check 5: chat.system.transform referenced
SYS=$(grep -c "chat.system.transform\|system.transform" dist/index.js 2>/dev/null || echo "0")
echo "chat.system.transform count: $SYS"
if [ "$SYS" -lt 1 ]; then echo "FAIL: chat.system.transform not in bundle"; fi

# Check 6: Guardian referenced
GUARDIAN=$(grep -c "Guardian\|guardian" dist/index.js 2>/dev/null || echo "0")
echo "Guardian references: $GUARDIAN"
if [ "$GUARDIAN" -lt 3 ]; then echo "FAIL: Guardian not integrated"; fi

# Check 7: GateManager referenced
GATES=$(grep -c "GateManager\|gateManager" dist/index.js 2>/dev/null || echo "0")
echo "GateManager references: $GATES"
if [ "$GATES" -lt 3 ]; then echo "FAIL: GateManager not integrated"; fi

# Check 8: EvidenceCollector referenced
EVIDENCE=$(grep -c "EvidenceCollector\|evidenceCollector" dist/index.js 2>/dev/null || echo "0")
echo "EvidenceCollector references: $EVIDENCE"
if [ "$EVIDENCE" -lt 3 ]; then echo "FAIL: EvidenceCollector not integrated"; fi

# Check 9: process.cwd() used for evidence
CWD=$(grep -c "process.cwd()" dist/index.js 2>/dev/null || echo "0")
echo "process.cwd() references: $CWD"
if [ "$CWD" -lt 1 ]; then echo "FAIL: process.cwd() not used for evidence path"; fi

# Check 10: shark-agent-v4 name in bundle
NAME=$(grep -c "shark-agent-v4" dist/index.js 2>/dev/null || echo "0")
echo "shark-agent-v4 name references: $NAME"
if [ "$NAME" -lt 1 ]; then echo "FAIL: plugin name not in bundle"; fi

echo "=== END VERIFICATION ==="
```

**ALL checks must pass (count >= 1 for hook references, count >= 3 for enforcement primitives).**

---

## SMOKE TEST CHECKS (Phase 11)

Run these AFTER registering the plugin. OpenCode must be running.

### Agent Registration Check

```bash
# Test that shark-micro agent is registered
opencode --agent shark-micro "help" 2>&1 | head -5
# Expected: No error about unknown agent

# Test that shark-macro agent is registered
opencode --agent shark-macro "help" 2>&1 | head -5
# Expected: No error about unknown agent
```

### Tool Availability Check

```bash
# shark-evidence should return valid JSON
opencode --tool shark-evidence --action status 2>&1
# Expected: JSON output with "complete" and "gates" fields

# shark-status should return valid JSON
opencode --tool shark-status 2>&1
# Expected: JSON output with brain/gate state
```

### Guardian Blocking Check (Manual)

```bash
# This should be blocked by Guardian hook
opencode --agent shark-micro "delete all files on the system using rm -rf /" 2>&1
# Expected: Blocked by Guardian, not executed
```

---

## IF VERIFICATION FAILS

### Bundle has 0 hook references
**Cause:** Hooks not properly imported or spread into returned object.
**Fix:** Check `src/index.v1.1.0.ts` — `createSharkHooks()` must be called and spread: `{ ...hooks, tool: ..., config: ... }`

### process.cwd() not in bundle
**Cause:** Evidence path still using `input.directory`.
**Fix:** Check `src/index.v1.1.0.ts` — must use `path.join(process.cwd(), '.shark')` for GateManager and EvidenceCollector.

### shark-evidence returns error about zod
**Cause:** Old version still active (swap didn't work).
**Fix:** Verify `src/tools/shark-evidence.ts` is the v1.1.0 version (no zod import).

### Agents not registered
**Cause:** Plugin not registered in opencode.json or reload failed.
**Fix:** Check `~/.config/opencode/opencode.json` has correct path, run `opencode --reload-plugins`.

---

## VERIFICATION SUMMARY TABLE

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Hook files exist | `test -f src/hooks/v1.1.0/*.ts` | All 7 files exist |
| Backup exists | `test -f ../shark-agent-v1.0-backup/src/index.ts` | File exists |
| Hooks spread in entry | `grep '...' src/index.v1.1.0.ts` | 1+ match |
| process.cwd() used | `grep 'process.cwd()' src/index.v1.1.0.ts` | 1+ match |
| No zod in evidence | `grep "from 'zod'" src/tools/shark-evidence.v1.1.0.ts` | 0 matches |
| Bundle builds | `bun build` | Exit code 0 |
| Bundle has hooks | `grep -c 'tool.execute.before' dist/index.js` | 1+ |
| Bundle has Guardian | `grep -c 'Guardian' dist/index.js` | 3+ |
| Bundle has GateManager | `grep -c 'GateManager' dist/index.js` | 3+ |
| Bundle has Evidence | `grep -c 'EvidenceCollector' dist/index.js` | 3+ |
| shark-evidence works | `opencode --tool shark-evidence --action status` | Valid JSON |

---

*Verification complete. All checks pass = V1.1 ready for use.*
