# v2.3.1 FIX PACKAGE — README

## What is this?

A mechanical enforcement package for fixing the 7 confirmed bugs in Hermes Agent Plugin v2.3.

v2.3 was declared "PRODUCTION READY" by the build report. It is NOT. The build report is verification theater.

This package tells a build agent EXACTLY what to fix, EXACTLY how to fix it, and EXACTLY how to verify the fix — with no ambiguity, no placeholders, and no wiggle room.

---

## Quick Start

```bash
# 1. Copy source to fresh directory
cp -r /path/to/v2.3-build /path/to/v2.3.1-build

# 2. Apply all fixes (or let a build agent use the FIX_PACKAGE files)
cd /path/to/v2.3.1-build

# 3. Run verification
bash /path/to/FIX_PACKAGE/verify.sh

# 4. If all pass → ship
# If any fail → DO NOT PROCEED
```

---

## The 7 Bugs (Priority Order)

| # | Bug | Severity | File | Problem |
|---|-----|----------|------|---------|
| 1 | secretScan | CRITICAL | `src/tools/security.ts:64` | `=***` placeholder never replaced — runtime crash |
| 2 | symbols | HIGH | `src/tools/analysis.ts:121` | Path traversal — can read `../../etc/passwd` |
| 3 | complexityHotspots | MEDIUM | `src/tools/analysis.ts:13` | Unvalidated path to `tsc --diagnostics` |
| 4 | delegation gate | HIGH | `src/hooks/delegation-gate.ts:21` | Gate annotates but doesn't block |
| 5 | supervisor metadata | MEDIUM | `src/hooks/supervisor-loop-hook.ts:22` | `output.metadata` never reaches agent |
| 6 | CLI handlers | MEDIUM | `src/index.ts:319` | `/Hermes` and `/Shark` commands have no handlers |
| 7 | devops path | MEDIUM | `src/config/devops-manager.ts:4` | Hardcoded Leviathan path — fails silently for others |

---

## Package Contents

```
FIX_PACKAGE/
├── 00_INDEX.md          # This manifest
├── 01_BUG_SECRETSCAN.md           # CRITICAL fix
├── 02_BUG_SYMBOLS_TRAVERSAL.md    # HIGH fix
├── 03_BUG_COMPLEXITY_PATH.md      # MEDIUM fix
├── 04_FIX_DELEGATION_GATE.md      # HIGH fix
├── 05_FIX_SUPERVISOR_METADATA.md  # MEDIUM fix (Option B chosen)
├── 06_FIX_CLI_HANDLERS.md        # MEDIUM fix
├── 07_FIX_DEVOPS_PATH.md          # MEDIUM fix
├── 08_VERIFICATION_SUITE.md      # All verification commands
├── 09_BUILD_STEPS.md              # Step-by-step build
├── verify.sh                      # Mechanical verification script
└── README.md                      # This file
```

---

## How to Use

### Option A: Let a Build Agent Execute

Point a build agent at this directory. Tell it:
> "Use the FIX_PACKAGE files to fix all 7 bugs in v2.3.1. Run verify.sh after each fix. Do not ship until verify.sh returns EXIT 0."

### Option B: Manual Execution

```bash
# Step 0: Create workspace
cp -r ../v2.3-build ../v2.3.1-build
cd ../v2.3.1-build

# Step 1-7: Apply fixes in order (see 09_BUILD_STEPS.md)
# Or run the shell commands from each FIX_*.md file

# Step 8: Run verification
bash ../FIX_PACKAGE/verify.sh

# Step 9: If verify.sh exits 0, run build
bun build.ts

# Step 10: Deploy
# (see 09_BUILD_STEPS.md STEP 11)
```

### Option C: Let an Agent Execute STEP BY STEP

For each fix file (01-07):
1. Agent reads the fix file
2. Agent applies the exact change described
3. Agent runs the verification commands from the fix file
4. If verification passes → next fix
5. If verification fails → STOP and report

---

## Key Design Decisions

### Option B for Fix 5 (Supervisor Metadata)

Fix 5 (supervisor metadata) uses Option B — creating a new `getSupervisorRecommendations` tool that the agent must explicitly call — rather than Option A (wiring through `output.metadata`).

**Rationale**: Option A depends on undocumented OpenCode SDK behavior. Option B is explicit, testable, and works regardless of SDK support.

### Shark Command Removed

The `/Shark` command in v2.3 was cross-contamination. Shark belongs to shark-agent-plugin, not hermes-agent-plugin. It has been removed.

### Context Directory Included

The `context/devops-manager/` directory with 8 markdown files (MENTAL_MODEL.md, INDEX.md, etc.) is included so the plugin works out of the box without depending on Leviathan's specific workspace paths.

---

## Failure Protocol

If `verify.sh` returns EXIT 1:

1. **STOP** — do not apply more fixes
2. **IDENTIFY** — which fix failed
3. **REPORT** — exact command that failed, expected vs actual
4. **AWAIT** — human instruction

**Do NOT:**
- Apply multiple fixes to "catch up"
- Skip the failing verification
- Mark as complete with known failures
- Proceed to the build step

---

## What the Build Report Got Wrong

The v2.3 build report declared the build **98.0% pass rate (144/147)** and **PRODUCTION READY**.

Reality:
- 31 TypeScript errors (ignored by `bun build.ts`)
- 1 CRITICAL bug (`secretScan =***`) that would crash at runtime
- 1 HIGH bug (path traversal in `symbols`)
- 4 MEDIUM bugs (gates that don't gate, features that don't wire, commands that don't command)
- E2E tests pass but don't exercise `secretScan` or path traversal

The 98% pass rate is real — the conclusion of "PRODUCTION READY" is false. The tests don't test the broken code paths.

---

## Verification vs Theater

**Verification theater**: A feature exists, runs without error, produces output, but doesn't actually achieve its goal.

**Mechanical enforcement**: A check exists, is exercised, fails if criteria aren't met, and blocks progress if the check fails.

v2.3 has verification theater in:
- `supervisor-loop-hook` — generates recommendations that go nowhere
- `delegation-gate` — annotates but doesn't block
- `/Hermes` and `/Shark` commands — registered but no handlers
- `output.metadata` — set but never consumed

v2.3.1 fixes these by either:
1. Actually wiring the feature (supervisor tool)
2. Implementing the missing piece (CLI handlers)
3. Setting the `blocked` flag that was never set (delegation gate)

---

## Contact

This package was generated from pressure-test audit of v2.3-build.

For questions or issues with this fix package, review the audit in the parent directory.
