# AUDIT — V1.0 SOURCE CODE FINDINGS

**Audited:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/`
**Build Report:** `/home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4-build-report-2026-04-05.md`
**Date:** 2026-04-06

---

## FATAL FINDINGS

These are architectural failures. The plugin does not work as specified.

---

### FATAL-1: Zero OpenCode Hooks Wired

**File:** `src/index.ts` (lines 75-118)

**What It Does:**
```typescript
return {
  tool: { ... },
  config: async ...,
};
```

**What OpenCode Actually Requires:**
```typescript
// From @opencode-ai/plugin type Hooks:
interface Hooks {
  name?: string;
  version?: string;
  'tool.execute.before'?: (input: ToolInput, output: unknown) => Promise<ToolOutput | void>;
  'tool.execute.after'?: (input: ToolInput, output: unknown) => Promise<void>;
  'session.created'?: (input: SessionInput) => Promise<void>;
  'session.compacting'?: (input: SessionInput) => Promise<void>;
  'chat.system.transform'?: (input: ChatInput, output: ChatOutput) => Promise<void>;
  event?: (event: string, data: unknown) => Promise<void>;
}
```

**Source Proof:** V4 boilerplate (`Agent-Factory-Edition/src/`) defines hooks like `toolBeforeHook`, `toolAfterHook`, `systemEnhancerHook`. Shark V4 defines none.

**Impact:** Guardian cannot block. GateManager cannot advance. EvidenceCollector cannot collect. All enforcement is inert.

---

### FATAL-2: Guardian Never Invoked

**File:** `src/shark/shared/guardian.ts` (lines 1-150)

**What Exists:**
- `Guardian` class with `canWrite()`, `isDangerousCommand()`, `classifyZone()`
- `DANGEROUS_PATTERNS` regex array (blocks `rm -rf /`, `dd if=`, `mkfs`, fork bombs)
- `PERSONAL_PATHS` and `SYSTEM_PATHS` blocking

**What Is Missing:**
- Nothing in the plugin calls `guardian.canWrite()` or `guardian.isDangerousCommand()`
- No `tool.execute.before` hook to intercept terminal commands
- Guardian exists as a singleton but no code path reaches it

**Impact:** Dangerous commands pass through without blocking.

---

### FATAL-3: GateManager.transitionTo() Never Called

**File:** `src/shark/shared/gates.ts` (lines 83-220)

**What Exists:**
- `GateManager` class with `canTransition()`, `transitionTo()`, `passCurrentGate()`, `failCurrentGate()`
- Full 6-gate chain: plan → build → test → verify → audit → delivery
- Iteration tracking: `verifyAttempts` counter, escalation to next V1.N

**What Is Missing:**
- Nothing calls `gateManager.transitionTo()`
- No `tool.execute.after` hook to detect gate-relevant tool completion
- Gate advancement only possible if agent calls `shark-gate --action advance` on itself

**Impact:** Gate system cannot enforce sequencing. Agent can declare "done" at any point.

---

### FATAL-4: EvidenceCollector.collectEvidence() Never Called

**File:** `src/shark/shared/evidence.ts`

**What Exists:**
- `EvidenceCollector` class with `collectEvidence()`, `getGateEvidence()`, `getIterationLogs()`
- Archives to `.shark/evidence/{gate}/{timestamp}/`
- `hasCompleteEvidence()` validation

**What Is Missing:**
- Nothing calls `evidenceCollector.collectEvidence()`
- No `tool.execute.after` hook to detect work-product creation
- Evidence system is entirely passive — it stores data but nothing populates it

**Impact:** No proof of work exists. Cannot verify what was built.

---

### FATAL-5: Evidence Path Uses Wrong Base Directory

**File:** `src/index.ts` (lines 66-67)

**Current (V1.0 — BROKEN):**
```typescript
const gm = new GateManager(directory);      // input.directory = plugin install path
const ec = new EvidenceCollector(directory); // e.g., ~/.opencode/plugins/shark-agent-v4/
```

**Required (V1.1 — FIXED):**
```typescript
import * as path from 'node:path';
const workspacePath = process.cwd();         // OpenCode sets cwd = workspace
const gm = new GateManager(path.join(workspacePath, '.shark'));
const ec = new EvidenceCollector(path.join(workspacePath, '.shark'));
```

**Impact:** Evidence archives to plugin install dir, not workspace. Agent cannot see it.

---

### FATAL-6: 4 T1 Prompts Concatenated Into One Confused Agent

**File:** `src/index.ts` (line 107)

**Current:**
```typescript
instructions: `${EXECUTION_BRAIN_T1}\n\n${REASONING_BRAIN_T1}\n\n${SYSTEM_BRAIN_T1}\n\n${PLAN_BRAIN_MACRO_T1}`
```

**Problem:** Each brain T1 starts with "You are the [X] Brain". Four conflicting directives. The agent receives instructions from 4 different personalities with competing priorities:
- Execution Brain: "aggressive steamroll, no hesitation"
- Reasoning Brain: "context bridge, auto-debug, monitor for gaps"
- System Brain: "watchdog + enforcer, verify + audit + ship enforcement"
- Plan Brain: "background spec watchdog, active on escalation"

**Impact:** shark-macro is not triple-brain racing. It is one agent with 4 contradictory operational mandates.

---

### FATAL-7: shark-evidence.ts Uses zod But zod Not Imported

**File:** `src/tools/shark-evidence.ts` (line 8)

**Current:**
```typescript
import { z } from 'zod';   // ← zod not in package.json!
...
action: z.enum(['status', 'gate-evidence', 'iteration-logs', 'complete'])
```

**Fix:** Use OpenCode's built-in `tool.arg.enum()` instead of z.enum(). No zod import needed.

---

## HIGH FINDINGS

### HIGH-1: shark-context Not Accessible at Runtime

**File:** `src/index.ts` — shark-context copied to plugin directory

**Problem:** shark-context lives at `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/shark-context/`. When the agent runs, its working directory is the user's workspace (not the plugin directory). The agent's `read_file` tool cannot reach into the plugin directory by default.

**Fix:** Deploy shark-context to `{workspace}/.shark/shark-context/` on `session.created` hook, or reference it via a path the agent can access.

---

### HIGH-2: State Dies on Context Compression

**File:** `src/index.ts` — no `session.compacting` hook

**Problem:** If OpenCode compresses context (removes old messages), GateManager state in memory is lost. No snapshot/restore mechanism is wired.

**Fix:** Add `session.compacting` hook that calls `gateManager.getState()` and writes to `{workspace}/.shark/sessions/{sessionID}/gate-state.json`.

---

### HIGH-3: Coordinators Instantiated But Never Called

**Files:** `src/index.ts` (lines 45-60), `src/shark/micro/coordinator.ts`, `src/shark/macro/peer-dispatch.ts`

**Problem:** `getMicroCoordinator()` and `getMacroDispatcher()` are defined but never called from any hook. The MicroCoordinator and MacroPeerDispatch classes exist but do nothing.

**Fix:** Either wire coordinators into hooks OR accept that coordinator switching is prose-only and handled via shark-gate tool.

---

## MEDIUM FINDINGS

### MEDIUM-1: build-context Library Not Created

**Problem:** The shark-context library was copied verbatim but a build-context library (this library) did not exist before now. The build agent had no structured instructions.

**Status:** This file (build-context/REFERENCE/AUDIT.md) is the first artifact addressing this.

---

## BOILERPLATE REFERENCE

The V4 boilerplate at `/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Agent-Factory-Edition/src/` shows the correct hook integration pattern:

| Boilerplate File | What It Shows |
|-----------------|---------------|
| `hooks/tool-before-after.ts` | `tool.execute.before` and `tool.execute.after` pattern |
| `hooks/chat-system-transform.ts` | `chat.system.transform` pattern |
| `state.ts` | Per-session state management with `session.created` |
| `factory/types.ts` | Type definitions for hooks |

**The boilerplate does NOT implement Guardian/GateManager/EvidenceCollector** — those are Shark V4's own additions. But the **hook wiring pattern** is correct and must be copied.

---

## SUMMARY TABLE

| Finding | File | Line(s) | Severity | Fix Required |
|---------|------|---------|----------|--------------|
| No hooks wired | src/index.ts | 75-118 | FATAL | Add hook wiring |
| Guardian never called | src/shark/shared/guardian.ts | all | FATAL | Wire in tool.execute.before |
| GateManager never advances | src/shark/shared/gates.ts | all | FATAL | Wire in tool.execute.after |
| Evidence never collected | src/shark/shared/evidence.ts | all | FATAL | Wire in tool.execute.after |
| Wrong evidence path | src/index.ts | 66-67 | FATAL | Use process.cwd() |
| 4 T1s concatenated | src/index.ts | 107 | FATAL | Fix macro instructions |
| zod not imported | src/tools/shark-evidence.ts | 8 | FATAL | Use tool.arg.enum() |
| shark-context not accessible | src/index.ts | n/a | HIGH | Deploy on session.created |
| State dies on compaction | src/index.ts | none | HIGH | Add session.compacting hook |
| Coordinators inert | src/index.ts | 45-60 | HIGH | Wire or document |

---

*Audit source: /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/*
*Audit date: 2026-04-06*
