# HERMES AGENT v3 — DEBUG LOG
**Build ID:** hermes-v3-overhaul  
**Started:** 2026-04-14  
**Last Updated:** 2026-04-14 (Session 4 - hermes-command.ts guard fix)  

---

## ACTIVE ISSUES

### DEBUG-001: Brainstorm Gate — Cross-Agent Interference (CRITICAL)
**Discovered:** 2026-04-08  
**Status:** ✅ FIXED — dist rebuilt (Session 4)
**Severity:** CRITICAL — blocked Spider Agent coder delegation  

**Problem:**  
`src/hooks/brainstorm-gate.ts` fired for ALL agents when `.hermes/` directory doesn't exist.  
When Spider Agent's coder subagent tried to write files, Hermes brainstorm gate (phase=IDLE) detected code blocks and appended `[HARD-GATE BLOCKED]` — this interfered with tool execution flow, causing `toolCalls: 0`.

**Root Cause:**  
No agent identity guard. Hook fired globally for every agent's `messages.transform` event.

**Fix Applied (2026-04-08):**  
```typescript
// Added to src/hooks/brainstorm-gate.ts
if (!existsSync(resolve(context.directory, ".hermes"))) {
  console.log(`[brainstorm-gate] SKIP: no .hermes directory`);
  return; // Guard — skip entirely for non-Hermes sessions
}
```

**Verification Needed:**  
- [x] Source has the guard (verify) ✅
- [x] dist rebuilt (`bun build.ts`) ✅
- [x] BUILD_VERIFY.sh passes ✅
- [ ] Spider coder not blocked in real session (requires OpenCode session)
- [ ] Brainstorm gate STILL fires for Hermes sessions (requires OpenCode session)

**Evidence:** `DEBUG-HERMES-BRAINSTORM-GATE-BLOCKS-SPIDER-CODER-2026-04-08.md` (full forensic)

---

### DEBUG-001b: hermes-command.ts — Missing Agent Guard (AUDIT FINDING)
**Discovered:** 2026-04-14 (Session 4 audit)
**Status:** ✅ FIXED — dist rebuilt
**Severity:** HIGH — non-Hermes agents could fire `/Hermes` commands

**Problem:**  
`src/hooks/hermes-command.ts` had no `isHermesAgent()` guard. Any agent (Spider, Kraken, etc.) could trigger Hermes command processing.

**Root Cause:**  
Missing guard check - hook fired on any `chat.messages.transform` event.

**Fix Applied (Session 4):**  
```typescript
import { isHermesAgent } from '../config/agent-identity.ts';

// Guard: Only respond to Hermes agents
if (!isHermesAgent(agentId)) {
  return;
}
```

**Verification:**  
- [x] Source has guard ✅
- [x] dist rebuilt ✅
- [x] BUILD_VERIFY.sh passes ✅
- [ ] Non-Hermes agents blocked in real session (requires OpenCode session)

---

### DEBUG-002: sast_scan — npm Executable Not Found (CRITICAL)
**Discovered:** v2.3.5 PROGRESS_REPORT  
**Status:** SOURCE FIXED, UNVERIFIED  
**Severity:** HIGH  

**Problem:**  
`npm error could not determine executable to run`  
Tool crashes because npm can't find the eslint-plugin-security package at runtime.

**Root Cause:**  
Tool uses `npm exec` or similar which requires network + package resolution at runtime.

**Fix Applied:**  
Source was updated to bundle eslint-plugin-security locally. But v2.3.5 dist was NEVER rebuilt after the fix.

**Verification Needed:**  
- [ ] Source `src/tools/security.ts` has local plugin bundling
- [ ] `bun build.ts` succeeds
- [ ] Run `sast_scan` against hermes-agent source
- [ ] Output contains actual findings (not error)

**Fix Plan if Reverted:**  
Use `npx eslint-plugin-security` with bundled plugin path, or use basic regex-based security scan as fallback.

---

### DEBUG-003: imports/symbols — Path Resolution (MEDIUM)
**Discovered:** v2.3.5 PROGRESS_REPORT  
**Status:** SOURCE FIXED, UNVERIFIED  
**Severity:** MEDIUM  

**Problem:**  
Path resolution fails with real `context.worktree` (may be undefined). Tools returned empty output or wrong results.

**Root Cause:**  
Code used `context.worktree` directly without null check.

**Fix Applied:**  
```typescript
const baseDir = context.directory ?? context.worktree ?? process.cwd();
```

**Verification Needed:**  
- [ ] Source has fallback chain
- [ ] `imports` runs against `src/index.ts` and returns import list
- [ ] `symbols` runs against Python file and returns def/class list

---

### DEBUG-004: grill — Fix State Ambiguous (UNCLEAR)
**Discovered:** v2.3.5 BUILD_REPORT vs BUILD_LOG contradiction  
**Status:** NEEDS VERIFICATION  
**Severity:** MEDIUM  

**Problem:**  
BUILD_REPORT.md claims grill is fixed at line 15325.  
BUILD_LOG.md (still referencing v2.1) shows it as NEEDS FIX.

**Root Cause:**  
Documentation conflict. Source vs dist state unclear.

**Fix Plan:**  
1. Read `src/tools/verification.ts` directly
2. Check if `statSync` check exists for directory scanning
3. If not, apply fix
4. Rebuild dist
5. Verify against directory target

---

## HISTORICAL ISSUES (Resolved)

### HIST-001: Wrong Build Command (RESOLVED)
**Discovered:** v2.3.3 session  
**Status:** DOCUMENTED — discipline established  

**Problem:**  
BUILD_PROMPT.md told agents to run `bun build dist/index.ts` (WRONG) instead of `bun build.ts`.  
The v2.3.3 dist/index.js was NEVER rebuilt from v2.3.3 source.

**Fix:**  
Established `BUILD_VERIFY.sh` as CI gate. Will run after every build.

---

### HIST-002: ESLint 10 Config Error (RESOLVED)
**Discovered:** v2.3.3 session  
**Status:** FIXED in v2.3.5 source  

**Problem:**  
ESLint 10 puts config error messages in stdout, not stderr.  
Fallback check only checked stderr, so it never triggered.

**Fix:**  
```typescript
const combinedOutput = (result.stdout || "") + (result.stderr || "");
```

---

### HIST-003: Phase Persistence Hot-Reload (RESOLVED)
**Discovered:** v2.3.3 session  
**Status:** FIXED in v2.3.5 source  

**Problem:**  
Phase stored in module-level variable `_currentPhase` resets on plugin hot-reload.

**Fix:**  
Added `loadPhaseFromDisk()` / `savePhaseToDisk()` using `.hermes/phase.json`.

---

## DEBUG TEMPLATES

### Hook Debug Template
```markdown
### DEBUG-[NNN]: [Hook Name] — [Issue]

**Hook:** [name]
**Event:** [tool.execute.before / messages.transform / etc.]
**Expected:** [what should happen]
**Actual:** [what happens]
**Evidence:** [log output / error message]

**Root Cause:** [1-2 sentences]

**Fix Applied:** [code change]

**Verification:** [what to verify after fix]
```

### Tool Debug Template
```markdown
### DEBUG-[NNN]: [Tool Name] — [Issue]

**Tool:** [name]
**Expected Output:** [what should return]
**Actual Output:** [what returns]
**Error:** [if any]

**Root Cause:** [1-2 sentences]

**Fix Applied:** [code change]

**Verification:** [test to run]
```
