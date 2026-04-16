# HERMES AGENT PLUGIN v2.3.1 — BUILD AUDIT
## Build Instructions for v2.3.2 Iteration

**Audit ID**: v2.3.1-audit-2026-0406
**Date**: 2026-04-06
**Source**: v2.3.1-build/ (untouched original)
**Status**: AUDIT COMPLETE — Spider Agent Must Apply 2 Fixes to Create v2.3.2
**Auditor**: DevOps Manager

---

## EXECUTIVE SUMMARY

v2.3.1-build passed all functional tests and spec compliance checks. HOWEVER, two hooks added during v2.3 development are missing `isHermesAgent()` spillover guards. Without these guards, Hermes hooks will pollute vanilla OpenCode agent sessions — the exact class of bug documented in:

`/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/hermes-context-spillover-fix.md`

This document provides complete build instructions for the spider agent to create a ship-ready v2.3.2 iteration.

---

## THE 2 BUGS — EXACTLY WHAT TO FIX

### Bug 1 — `src/hooks/hermes-command.ts` Missing Guard

**Hook type**: `command.execute.before`
**Risk**: HIGH — Intercepts `/Hermes` commands from ALL agents. Without the guard, a vanilla `plan` agent typing `/Hermes status` gets Hermes responses.

**File**: `src/hooks/hermes-command.ts`

**Current broken code** (lines 1-10):
```typescript
import type { Hooks } from "@opencode-ai/plugin";
import { executeHermesCommand } from "../config/hermes-commands.js";

export function createHermesCommandHook(): NonNullable<Hooks["command.execute.before"]> {
  return async (input, output) => {
    // Only handle /Hermes commands
    const command = input.command?.toLowerCase();
    if (command !== "hermes") return;
```

**Required fix — add import at line 3**:
```typescript
import { isHermesAgent } from "../config/agent-identity.js";
```

**Required fix — add as first line inside the async function**:
```typescript
if (!isHermesAgent(input.agent)) return;
```

**After fix, file should look like**:
```typescript
import type { Hooks } from "@opencode-ai/plugin";
import { executeHermesCommand } from "../config/hermes-commands.js";
import { isHermesAgent } from "../config/agent-identity.js";

export function createHermesCommandHook(): NonNullable<Hooks["command.execute.before"]> {
  return async (input, output) => {
    if (!isHermesAgent(input.agent)) return;
    // Only handle /Hermes commands
    const command = input.command?.toLowerCase();
    if (command !== "hermes") return;
```

---

### Bug 2 — `src/hooks/self-review.ts` Missing Guard

**Hook type**: `chat.messages.transform`
**Risk**: MEDIUM — Transforms ALL agent messages containing "approved" or "looks good". Without the guard, vanilla agents get spurious self-review warnings injected.

**File**: `src/hooks/self-review.ts`

**Current broken code** (lines 1-10):
```typescript
import type { Hooks } from "@opencode-ai/plugin";

export function createSelfReviewHook(): NonNullable<
  Hooks["experimental.chat.messages.transform"]
> {
  return async (input, output) => {
    const messages = output?.messages;
    if (!messages || messages.length === 0) return;
```

**Required fix — add import at line 2**:
```typescript
import { isHermesAgent } from "../config/agent-identity.js";
```

**Required fix — add as first line inside the async function**:
```typescript
if (!isHermesAgent(input.agent)) return;
```

**After fix, file should look like**:
```typescript
import type { Hooks } from "@opencode-ai/plugin";
import { isHermesAgent } from "../config/agent-identity.js";

export function createSelfReviewHook(): NonNullable<
  Hooks["experimental.chat.messages.transform"]
> {
  return async (input, output) => {
    if (!isHermesAgent(input.agent)) return;
    const messages = output?.messages;
    if (!messages || messages.length === 0) return;
```

---

## SPIDER AGENT — EXACT BUILD STEPS

Do these steps in order. Do not deviate.

### Step 1 — Create v2.3.2-build Directory

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin"
cp -r v2.3.1-build v2.3.2-build
```

### Step 2 — Verify Pre-Fix State

Confirm the two files are missing guards (should show 0):

```bash
grep -c "isHermesAgent" v2.3.2-build/src/hooks/hermes-command.ts
# Expected: 0

grep -c "isHermesAgent" v2.3.2-build/src/hooks/self-review.ts
# Expected: 0
```

### Step 3 — Apply Fix 1 (hermes-command.ts)

**Option A — Manual edit**:

Open `v2.3.2-build/src/hooks/hermes-command.ts` and make these exact changes:

1. Add after line 2 (`import { executeHermesCommand ...`):
   ```
   import { isHermesAgent } from "../config/agent-identity.js";
   ```

2. Add after line 5 (`return async (input, output) => {`):
   ```
       if (!isHermesAgent(input.agent)) return;
   ```

**Option B — Automated patch**:

```bash
cd v2.3.2-build

# Add import after line 2
sed -i '2 a import { isHermesAgent } from "../config/agent-identity.js";' src/hooks/hermes-command.ts

# Add guard after line 5 (the "return async" line)
sed -i '5 a\    if (!isHermesAgent(input.agent)) return;' src/hooks/hermes-command.ts
```

**Verification**:
```bash
grep -n "isHermesAgent" src/hooks/hermes-command.ts
# Expected output:
# 3:import { isHermesAgent } from "../config/agent-identity.js";
# 7:if (!isHermesAgent(input.agent)) return;
```

### Step 4 — Apply Fix 2 (self-review.ts)

**Option A — Manual edit**:

Open `v2.3.2-build/src/hooks/self-review.ts` and make these exact changes:

1. Add after line 1 (`import type { Hooks } ...`):
   ```
   import { isHermesAgent } from "../config/agent-identity.js";
   ```

2. Add after line 6 (`return async (input, output) => {`):
   ```
       if (!isHermesAgent(input.agent)) return;
   ```

**Option B — Automated patch**:

```bash
cd v2.3.2-build

# Add import after line 1
sed -i '1 a import { isHermesAgent } from "../config/agent-identity.js";' src/hooks/self-review.ts

# Add guard after line 6 (the "return async" line)
sed -i '6 a\    if (!isHermesAgent(input.agent)) return;' src/hooks/self-review.ts
```

**Verification**:
```bash
grep -n "isHermesAgent" src/hooks/self-review.ts
# Expected output:
# 2:import { isHermesAgent } from "../config/agent-identity.js";
# 8:if (!isHermesAgent(input.agent)) return;
```

### Step 5 — Full Hook Guard Audit

Run this and confirm no output (all hooks must have guard):

```bash
cd v2.3.2-build
for f in src/hooks/*.ts; do
  if ! grep -q "isHermesAgent" "$f" 2>/dev/null; then
    echo "MISSING GUARD: $f"
  fi
done
# Expected: (empty — no output)
```

### Step 6 — Build

```bash
cd v2.3.2-build
bun build.ts
# Expected: "Built: dist/index.js" (EXIT 0)
```

### Step 7 — E2E Test

```bash
cd v2.3.2-build
bun test-e2e.ts
# Expected: 144 passed, 3 failed (same as v2.3.1)
# DO NOT attempt to fix the 3 failures — they are pre-existing test bugs, not plugin bugs
```

### Step 8 — Deploy

**Step 8a — Copy dist to plugins directory**:

```bash
cp "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.2-build/dist/index.js" \
   "/home/leviathan/OPENCODE_WORKSPACE/plugins/hermes-agent/dist/index.js"
```

**Step 8b — Update opencode.json**:

Edit `~/.opencode/opencode.json` and change the plugin array:

```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.2-build/dist/index.js"
]
```

### Step 9 — Live Verification (optional but recommended)

```bash
mkdir -p /tmp/verify-$$
cd /tmp/verify-$$

opencode run "/Hermes status"
# Expected: Status output from Hermes agent

opencode run "call get_supervisor_recommendations"
# Expected: Supervisor status output

opencode run "call grill target=/tmp/../../../etc/passwd"
# Expected: "Access denied. Target resolves outside project directory."
```

---

## VERIFICATION CHECKLIST

Run these checks after applying fixes:

| Check | Command | Expected |
|-------|---------|----------|
| hermes-command.ts has guard | `grep -n "isHermesAgent" src/hooks/hermes-command.ts` | Lines 3 and 7 |
| self-review.ts has guard | `grep -n "isHermesAgent" src/hooks/self-review.ts` | Lines 2 and 8 |
| All hooks guarded | `for f in src/hooks/*.ts; do grep -q isHermesAgent "$f" || echo MISSING; done` | Empty output |
| Build succeeds | `bun build.ts` | "Built: dist/index.js" EXIT 0 |
| E2E pass rate | `bun test-e2e.ts` | 144/147 pass |
| `isHermesAgent` in dist | `grep -c "isHermesAgent" dist/index.js` | ~60+ occurrences |

---

## WHAT NOT TO TOUCH

These are correct in v2.3.1-build. Do NOT modify:

| File | Why |
|------|-----|
| `src/config/agent-identity.ts` | Already has `isHermesAgent()` function |
| `src/config/loader.ts` | Already has `workspace: null` |
| `src/hooks/tdd-enforcer.ts` | Already has guard |
| `src/hooks/brainstorm-gate.ts` | Already has guard |
| `src/hooks/plan-validator.ts` | Already has guard |
| `src/hooks/delegation-gate.ts` | Already has guard |
| `src/hooks/supervisor-loop-hook.ts` | Already has guard |
| `src/hooks/drift-verifier-hook.ts` | Already has guard |
| `src/tools/analysis.ts` | Path containment already fixed |
| `src/tools/security.ts` | secretScan and sast_scan already fixed |
| `src/config/hermes-commands.ts` | Already has handlers |
| `src/config/devops-manager.ts` | Already has env var fallback |

---

## LESSONS LEARNED

1. **New hooks need guards immediately**: When creating a new hook, add `isHermesAgent()` guard as part of the initial implementation — not after.

2. **Spillover audit must cover new hooks**: Every new hook added to the plugin must have the guard, even if existing hooks are verified.

3. **`command.execute.before` hooks need guarding**: They intercept command input for ALL agents.

4. **`chat.messages.transform` hooks need guarding**: They modify message content for ALL agents.

---

## FILE STRUCTURE AFTER BUILD

```
v2.3.2-build/
├── BUILD-AUDIT-v2.3.2.md    ← This document
├── src/
│   ├── hooks/
│   │   ├── hermes-command.ts  ← FIXED: isHermesAgent guard added at line 7
│   │   ├── self-review.ts    ← FIXED: isHermesAgent guard added at line 8
│   │   └── [26 other hooks] ← UNCHANGED: already have guards
│   ├── config/
│   │   └── agent-identity.ts ← UNCHANGED: exports isHermesAgent
│   ├── tools/                ← UNCHANGED
│   └── index.ts              ← UNCHANGED
├── dist/
│   └── index.js              ← REBUILT with fixes
└── test-e2e.ts                ← UNCHANGED
```

---

## DOCUMENT LOCATIONS

| Document | Path |
|----------|------|
| **This audit** | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.2-build/BUILD-AUDIT-v2.3.2.md` |
| **Context spillover fix (reference)** | `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/hermes-context-spillover-fix.md` |
| **v2.3.1 source (untouched)** | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.1-build/` |
| **Plugin workspace** | `/home/leviathan/OPENCODE_WORKSPACE/plugins/hermes-agent/` |
