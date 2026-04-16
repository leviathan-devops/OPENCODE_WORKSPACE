# Build Prompt: Split Shark Agent V4.5 into Two Standalone Plugins — MANTA and SHARK

**Created:** 2026-04-07
**Requester:** leviathan
**Priority:** CRITICAL
**Source Audit:** shark-agent-v4 current codebase

---

## BUG REPORT — Root Cause Analysis

### BUG 1: Shared StateStore Singleton (CRITICAL)

**Symptom:** Both shark-micro and shark-macro see identical state. MicroCoordinator and MacroPeerDispatch both initialize, even for the wrong agent.

**Root Cause:** In `src/index.ts`, lines 37-39:

```typescript
// MODULE-LEVEL — shared across ALL plugin invocations
const stateStore = createStateStore();
const messenger = createBrainMessenger();
const guardian = new Guardian({ level: 'SANDBOX' });
```

When OpenCode loads a plugin, it evaluates the module once. This means ONE instance of stateStore, messenger, and guardian is created and shared across ALL agent sessions and ALL agent types.

Additionally, the `createSharkHooks()` and coordinator creation happens inside the exported function but ALL sessions share the SAME state store namespace.

**Fix Required:** Each agent plugin must have its own isolated state store, messenger, and guardian instance.

---

### BUG 2: Both Coordinators Initialize for Both Agents (CRITICAL)

**Symptom:** User sees "MicroCoordinator Initialized with Plan Brain" AND "MacroPeerDispatch Triple-brain initialized" in BOTH shark-micro AND shark-macro sessions.

**Root Cause:** In `session-hook.ts`, the `handleSessionCreated()` function:

```typescript
// Initialize coordinators if provided
if (microCoordinator) {
  microCoordinator.initialize();  // ← Always runs
}
if (macroDispatch) {
  macroDispatch.initialize();     // ← Always runs
}
```

Since ONE plugin instance creates BOTH coordinators via the shared stateStore, BOTH coordinators are initialized for EVERY session regardless of which agent is active.

**Fix Required:** Separate plugins with separate coordinator initialization.

---

### BUG 3: shark-status Default Returns Macro Variant (HIGH)

**Symptom:** When shark-micro calls `shark-status` (not `shark-status-micro`), it gets macro variant output.

**Root Cause:** In `src/index.ts`:

```typescript
tool: {
  'shark-status': statusToolMacro,  // Default is MACRO
  'shark-status-micro': statusToolMicro,
  'shark-status-macro': statusToolMacro,
}
```

The `shark-status` default is hardcoded to macro. When an agent calls the generic `shark-status` tool, it gets macro output.

**Fix Required:** Each plugin should have ONE status tool with the correct variant as the default.

---

### BUG 4: Console Logs Expose Internal State to User UI (MEDIUM)

**Symptom:** User sees "MicroCoordinator Initialized with Plan Brain", "MacroPeerDispatch Triple-brain initialized", "[Shark] Session created: unknown" in the OpenCode UI.

**Root Cause:** `session-hook.ts` uses `console.log()` for initialization messages:

```typescript
console.log(`[Shark] Session created: ${sessionID}`);
console.log('[MicroCoordinator] Initialized with Plan Brain');
console.log('[MacroPeerDispatch] Triple-brain initialized: Execution + Reasoning + System');
```

These appear in the OpenCode UI console output visible to users.

**Fix Required:** Use `console.error()` for internal state OR remove entirely. Internal logs should go to stderr, not stdout (which OpenCode displays).

---

### BUG 5: session.created Event Has No Agent Identification (MEDIUM)

**Symptom:** Session created logs always show "Session created: unknown".

**Root Cause:** In `session-hook.ts`:

```typescript
const event = input.event as { type?: string; sessionId?: string };
// No agent field available in the event object
```

The session.created event doesn't include which agent is initializing.

**Fix Required:** Agent identification must come from elsewhere (agent config callback, or accept this limitation).

---

### BUG 6: State Domain Collision (MEDIUM)

**Symptom:** Both agents write to `execution-state:micro-state` and `execution-state:macro-state` in the same state store.

**Root Cause:** Even if we separate plugins, the state store uses domain prefixes that are similar (`micro-state` vs `macro-state` in same `execution-state` domain). This could cause confusion in debugging.

**Fix Required:** Completely separate state stores per plugin with distinct domain names.

---

## SOLUTION: Two Standalone Plugins

### Architecture

```
CURRENT (BUGGY):
┌─────────────────────────────────────────────────────────┐
│            shark-agent-v4 (SINGLE PLUGIN)               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Shared StateStore (singleton)                    │   │
│  │ Shared Messenger (singleton)                     │   │
│  │ Shared Guardian (singleton)                     │   │
│  └─────────────────────────────────────────────────┘   │
│           Both coordinators, both agents mixed          │
└─────────────────────────────────────────────────────────┘

PROPOSED (CORRECT):
┌─────────────────────────────────────────────────────────┐
│              manta-agent (PLUGIN 1)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Isolated StateStore (manta-state domain)        │   │
│  │ Isolated Messenger                              │   │
│  │ Isolated Guardian                               │   │
│  │ MicroCoordinator (only)                         │   │
│  │ shark-status (micro variant)                    │   │
│  │ shark-gate, shark-evidence, checkpoint          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              shark-agent (PLUGIN 2)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Isolated StateStore (shark-state domain)        │   │
│  │ Isolated Messenger                              │   │
│  │ Isolated Guardian                               │   │
│  │ MacroPeerDispatch (only)                        │   │
│  │ shark-status (macro variant)                    │   │
│  │ shark-gate, shark-evidence, checkpoint          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## REQUIREMENTS

### 1. Create MANTA Agent (formerly shark-micro)

**Plugin Name:** `manta-agent`
**Plugin Directory:** `/home/leviathan/OPENCODE_WORKSPACE/projects/manta-agent/`
**Agent Name:** `manta`
**Color:** Midnight Purple — `#4B0082` (indigo/dark purple)
**Tab UI Color:** Dark purple for the tab toggle

**Components:**
- MicroCoordinator (mechanical Plan↔Build switching)
- shark-status tool returning `variant: 'manta'`
- shark-gate, shark-evidence, checkpoint tools
- System transform hook for enforcement context
- Session hook for coordinator initialization

**State Domain:** `manta-state` (NOT `execution-state`)

**Instructions:** T1 prompts from `shark/micro/brains.ts` — Plan Brain T1 + Coordinator T1

---

### 2. Create SHARK Agent (formerly shark-macro)

**Plugin Name:** `shark-agent`
**Plugin Directory:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/`
**Agent Name:** `shark`
**Color:** Royal Blue — `#4169E1`
**Tab UI Color:** Royal blue for the tab toggle

**Components:**
- MacroPeerDispatch (triple-brain coordination)
- shark-status tool returning `variant: 'shark'`
- shark-gate, shark-evidence, checkpoint tools
- System transform hook for enforcement context
- Session hook for coordinator initialization

**State Domain:** `shark-state` (NOT `execution-state`)

**Instructions:** T1 prompt from `shark/macro/brains.ts` — Execution Brain T1 only

---

### 3. Extract Shared Code into Common Library

**Shared Components:**
- `shark/shared/state-store.ts` → copy to both plugins
- `shark/shared/messenger.ts` → copy to both plugins
- `shark/shared/guardian.ts` → copy to both plugins
- `shark/shared/gates.ts` → copy to both plugins
- `shark/shared/evidence.ts` → copy to both plugins
- `hooks/v4.1/utils.ts` → copy to both plugins
- `hooks/v4.1/guardian-hook.ts` → copy to both plugins
- `hooks/v4.1/gate-hook.ts` → copy to both plugins
- `hooks/v4.1/compacting-hook.ts` → copy to both plugins

**Copies Must:**
- Remove domain collision (each copy uses its own domain)
- Remove console.log that exposes internal state
- Be self-contained (no shared module-level singletons)

---

### 4. File Structure

```
manta-agent/
├── src/
│   ├── index.ts              # Plugin entry, registers 'manta' agent
│   ├── manta/
│   │   ├── coordinator.ts    # MicroCoordinator
│   │   └── brains.ts        # T1 prompts (Plan, Build, Coordinator)
│   ├── shared/              # COPIES of shared code
│   │   ├── state-store.ts
│   │   ├── messenger.ts
│   │   ├── guardian.ts
│   │   ├── gates.ts
│   │   └── evidence.ts
│   ├── tools/
│   │   ├── shark-status.ts
│   │   ├── shark-gate.ts
│   │   ├── shark-evidence.ts
│   │   └── checkpoint.ts
│   └── hooks/
│       ├── index.ts
│       ├── session-hook.ts
│       ├── guardian-hook.ts
│       ├── gate-hook.ts
│       ├── compacting-hook.ts
│       ├── system-transform-hook.ts
│       └── utils.ts
├── dist/
│   └── index.js             # Built bundle
├── package.json
└── tsconfig.json

shark-agent/
├── src/
│   ├── index.ts              # Plugin entry, registers 'shark' agent
│   ├── shark/
│   │   ├── peer-dispatch.ts # MacroPeerDispatch
│   │   └── brains.ts        # T1 prompts (Execution)
│   ├── shared/              # COPIES of shared code
│   │   ├── state-store.ts
│   │   ├── messenger.ts
│   │   ├── guardian.ts
│   │   ├── gates.ts
│   │   └── evidence.ts
│   ├── tools/
│   │   ├── shark-status.ts
│   │   ├── shark-gate.ts
│   │   ├── shark-evidence.ts
│   │   └── checkpoint.ts
│   └── hooks/
│       ├── index.ts
│       ├── session-hook.ts
│       ├── guardian-hook.ts
│       ├── gate-hook.ts
│       ├── compacting-hook.ts
│       ├── system-transform-hook.ts
│       └── utils.ts
├── dist/
│   └── index.js
├── package.json
└── tsconfig.json
```

---

### 5. State Store Domain Isolation

**manta-agent state-store.ts:**
```typescript
// Use 'manta-state' domain only
export type StateDomain =
  | 'manta-state'
  | 'manta-context'
  | 'manta-quality';

// Coordinator state stored under 'manta-state:micro-state'
// No 'execution-state', 'thinking-state', etc.
```

**shark-agent state-store.ts:**
```typescript
// Use 'shark-state' domain only
export type StateDomain =
  | 'shark-state'
  | 'shark-context'
  | 'shark-quality';

// Peer dispatch state stored under 'shark-state:macro-state'
// No 'execution-state', etc.
```

---

### 6. Tool Naming and Registration

**manta-agent tools:**
```typescript
tool: {
  'manta-status': createMantaStatusTool(...),  // variant: 'manta'
  'manta-gate': createSharkGateTool(...),
  'manta-evidence': createSharkEvidenceTool(...),
  'checkpoint': createCheckpointTool(...),
}
```

**shark-agent tools:**
```typescript
tool: {
  'shark-status': createSharkStatusTool(...),  // variant: 'shark'
  'shark-gate': createSharkGateTool(...),
  'shark-evidence': createSharkEvidenceTool(...),
  'checkpoint': createCheckpointTool(...),
}
```

**Agent Registration:**
```typescript
// manta-agent config
config: async (cfg) => {
  cfg.agent['manta'] = {
    name: 'manta',
    description: 'MANTA — Dual-brain sequential (Plan ↔ Build) with mechanical coordinator',
    instructions: `${PLAN_BRAIN_T1}\n\n${COORDINATOR_T1}`,
    mode: 'primary',
    permission: { task: 'allow' },
    color: '#4B0082',  // Midnight Purple
  };
}

// shark-agent config
config: async (cfg) => {
  cfg.agent['shark'] = {
    name: 'shark',
    description: 'SHARK — Execution Brain with triple-brain coordination',
    instructions: `${EXECUTION_BRAIN_T1}`,
    mode: 'primary',
    permission: { task: 'allow' },
    color: '#4169E1',  // Royal Blue
  };
}
```

---

### 7. Remove Console.log State Exposure

**BEFORE (session-hook.ts):**
```typescript
console.log('[Shark] Session created: ${sessionID}');
console.log('[MicroCoordinator] Initialized with Plan Brain');
console.log('[MacroPeerDispatch] Triple-brain initialized: ...');
```

**AFTER:**
```typescript
// Use stderr for internal debugging logs — these won't appear in user UI
console.error('[Manta:session] created: ${sessionID}');
console.error('[Manta:coordinator] init');
// OR remove entirely — these logs serve no user purpose
```

**原则:** If a log message is only for developer debugging and serves no user-facing purpose, remove it entirely OR route to stderr.

---

### 8. Color Palette

| Agent | Name | Hex Code | Description |
|-------|------|----------|-------------|
| MANTA | Midnight Purple | `#4B0082` | Indigo/dark purple — tab UI |
| SHARK | Royal Blue | `#4169E1` | Royal blue — tab UI |

---

## EXECUTION STEPS

1. **Audit current code** — Confirm all shared dependencies
2. **Create manta-agent project** — Copy structure, rename
3. **Create shark-agent project** — Copy structure, rename
4. **Fix state-store domains** — `manta-state` vs `shark-state`
5. **Fix tool variants** — `manta-status` vs `shark-status`
6. **Fix agent names** — `manta` vs `shark` in config
7. **Fix colors** — `#4B0082` for manta, `#4169E1` for shark
8. **Remove console.log exposure** — Remove or stderr-route
9. **Build both plugins** — `bun run build` for each
10. **Update tui.jsonc** — Point to both plugin dist paths
11. **Test manta standalone** — Verify no MacroPeerDispatch logs
12. **Test shark standalone** — Verify no MicroCoordinator logs

---

## VERIFICATION CHECKLIST

After build, verify:

- [ ] `opencode run "@manta manta-status"` shows `variant: 'manta'`, `Brain: plan`
- [ ] `opencode run "@shark shark-status"` shows `variant: 'shark'`, `Brain: execution, reasoning, system`
- [ ] manta session shows ONLY `[Manta:coordinator]` logs, NOT `[Shark:peer-dispatch]`
- [ ] shark session shows ONLY `[Shark:peer-dispatch]` logs, NOT `[Manta:coordinator]`
- [ ] manta tab UI is purple (`#4B0082`)
- [ ] shark tab UI is royal blue (`#4169E1`)
- [ ] Both agents can run in same workspace without state collision
- [ ] Gate system works independently for each agent

---

## OPEN QUESTIONS

1. Should checkpoint tool have agent-specific naming (`manta-checkpoint` vs `shark-checkpoint`) or shared?
2. Should the `.shark` directory be renamed to `.manta` and `.shark` respectively?
3. What should happen when both manta and shark are active in the same workspace? (Currently they share .shark dir)

---

## RELATED BUGS FOUND DURING AUDIT

### Bug A: shark-status reads wrong domain on initial call

**File:** `src/tools/shark-status.ts`

The tool reads state at execution time, but if coordinator hasn't initialized yet, it returns 'unknown' for brain. This is expected behavior (lazy initialization), but the tool should return a more informative message.

### Bug B: handleVerifyFailure structured output format

**File:** `src/hooks/v4.1/gate-hook.ts`

```typescript
console.log(`[SHARK STATE] iteration=${escalatedIteration} gate=plan verifyAttempts=0`);
```

This structured output is good but is only visible in logs, not returned to agent. Consider returning this as part of the tool result.

### Bug C: process.cwd() called multiple times

**Files:** `src/index.ts`, `src/hooks/v4.1/session-hook.ts`

Workspace path resolution should be cached once, not called multiple times.

---

## DELIVERABLES

1. `/home/leviathan/OPENCODE_WORKSPACE/projects/manta-agent/` — Complete working plugin
2. `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/` — Complete working plugin
3. Updated `/home/leviathan/.opencode/tui.jsonc` pointing to both plugins
4. This build prompt annotated with completion checkmarks
5. Smoke test results for both agents showing isolated behavior
