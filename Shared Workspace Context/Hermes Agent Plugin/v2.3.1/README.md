# HERMES AGENT PLUGIN v2.3.1

**Build ID**: v2.3.1-fix-2026-0405
**Status**: FIX PACKAGE READY
**Based on**: v2.3-build (BROKEN)

---

## What Changed from v2.3

v2.3 was declared "PRODUCTION READY" by the build report. It is NOT.

v2.3.1 is a fix package that addresses all 7 confirmed bugs in v2.3.

### Bugs Fixed

| # | Bug | Severity | Status in v2.3 |
|---|-----|----------|-----------------|
| 1 | `secretScan` broken (`=***` placeholder) | CRITICAL | Not fixed — same corruption as v2.1/v2.2 |
| 2 | `symbols` path traversal | HIGH | New vulnerability — missed in v2.3 audit |
| 3 | `complexityHotspots` unvalidated path | MEDIUM | Same pattern as Bug 2 |
| 4 | `delegation-gate` doesn't block | HIGH | Only annotates, doesn't enforce |
| 5 | `supervisor-loop` metadata never reaches agent | MEDIUM | Theatrical — generates orphan output |
| 6 | CLI commands have no handlers | MEDIUM | `/Hermes` and `/Shark` templates with no code |
| 7 | Hardcoded Leviathan path | MEDIUM | `devops-manager.ts` fails silently for others |

---

## Directory Structure

```
v2.3.1/
├── README.md                  # This file
├── AUDIT_v2.3.md              # Full audit of v2.3 (what's broken and why)
├── FIX_PACKAGE/               # Mechanical fix enforcement package
│   ├── 00_INDEX.md            # Manifest and execution order
│   ├── 01_BUG_SECRETSCAN.md           # CRITICAL
│   ├── 02_BUG_SYMBOLS_TRAVERSAL.md    # HIGH
│   ├── 03_BUG_COMPLEXITY_PATH.md      # MEDIUM
│   ├── 04_FIX_DELEGATION_GATE.md      # HIGH
│   ├── 05_FIX_SUPERVISOR_METADATA.md  # MEDIUM (Option B)
│   ├── 06_FIX_CLI_HANDLERS.md        # MEDIUM
│   ├── 07_FIX_DEVOPS_PATH.md          # MEDIUM
│   ├── 08_VERIFICATION_SUITE.md      # Verification commands
│   ├── 09_BUILD_STEPS.md             # Build execution steps
│   ├── verify.sh                      # Mechanical verification script
│   └── README.md                      # How to use this package
├── context/                          # DevOps Manager context files
│   └── devops-manager/
│       ├── MENTAL_MODEL.md
│       ├── INDEX.md
│       ├── AUDIT_FRAMEWORK.md
│       ├── PATTERNS.md
│       ├── VERIFICATION.md
│       ├── ESCALATION.md
│       ├── HERMES_AGENT_PLUGIN.md
│       └── README.md
└── src/                              # Source code (copied from v2.3-build)
    ├── index.ts
    ├── tools/
    ├── hooks/
    ├── services/
    ├── agents/
    ├── config/
    └── ...
```

---

## How to Build v2.3.1

### Step 1: Copy Source

```bash
cp -r /path/to/v2.3-build /path/to/v2.3.1-build
```

### Step 2: Apply Fixes

Either:
- **Let a build agent use FIX_PACKAGE** (point it at the directory and say "fix all 7 bugs")
- **Run manually**: Follow `FIX_PACKAGE/09_BUILD_STEPS.md` step by step
- **Run verification only**: `bash FIX_PACKAGE/verify.sh` after each fix

### Step 3: Verify

```bash
cd v2.3.1-build
bash ../FIX_PACKAGE/verify.sh
```

If all pass → build is ready.
If any fail → DO NOT PROCEED.

### Step 4: Build

```bash
bun build.ts
```

### Step 5: Deploy

```bash
# Copy dist to deployment
cp -r dist /path/to/hermes-plugins/hermes-agent/v2.3.1/
cp -r context /path/to/hermes-plugins/hermes-agent/v2.3.1/
```

---

## Key Design Decisions in v2.3.1

### Option B for Fix 5 (Supervisor Metadata)

Fix 5 (supervisor recommendations) uses **Option B** — a new `getSupervisorRecommendations` tool that the agent must explicitly call — rather than Option A (wiring through `output.metadata`).

**Rationale**: `output.metadata` is set but there's no evidence OpenCode's SDK actually surfaces it to the agent. Option B is explicit, testable, and doesn't depend on undocumented SDK behavior.

### Shark Command Removed

The `/Shark` command was cross-contamination. Shark belongs to `shark-agent-plugin`, not `hermes-agent-plugin`. It has been removed from v2.3.1.

### Context Directory Included

The `context/devops-manager/` directory with 8 markdown files is included so the plugin works out of the box. The path is configurable via `HERMES_DEVOPS_CONTEXT_DIR` environment variable.

---

## What the v2.3 Build Report Got Wrong

| Build Report Claim | Reality |
|-------------------|---------|
| "secretScan already fixed in v2.2" | FALSE — `=***` placeholder still there |
| "98.0% E2E pass rate" | TRUE — but tests don't exercise broken code |
| "Production Ready" | FALSE — critical runtime crash waiting |
| "31 TypeScript errors are acceptable" | FALSE — `secretScan` would crash at runtime |

**Root cause**: The build report measures what it can measure (test pass rates, build exit codes) without auditing source code correctness or runtime behavior.

---

## For Build Agents

Use this package as follows:

1. Read `FIX_PACKAGE/00_INDEX.md` for the manifest
2. For each fix (01-07):
   - Read the fix file
   - Apply the exact change described
   - Run the verification commands in the fix file
   - If verification fails → STOP and report
3. After all fixes applied → run `FIX_PACKAGE/verify.sh`
4. If all pass → run `bun build.ts`
5. If build succeeds → ship

**Do NOT:**
- Skip fixes or change order
- Proceed past a failing verification
- Mark as complete with known failures
- Vary from the exact changes described

This is mechanical enforcement. Follow it exactly.

---

## For Humans

If you're reviewing this as a human:

1. Read `AUDIT_v2.3.md` to understand what broke in v2.3 and why
2. Review `FIX_PACKAGE/README.md` for the philosophy behind the fix package
3. Run `FIX_PACKAGE/verify.sh` against your built v2.3.1 to confirm all fixes landed
4. Review `FIX_PACKAGE/09_BUILD_STEPS.md` if you want to see the exact build procedure

The fix package is designed so a build agent can execute it without human intervention. But humans should audit the audit (`AUDIT_v2.3.md`) to understand the gap between what the v2.3 build report claimed and what the code actually does.
