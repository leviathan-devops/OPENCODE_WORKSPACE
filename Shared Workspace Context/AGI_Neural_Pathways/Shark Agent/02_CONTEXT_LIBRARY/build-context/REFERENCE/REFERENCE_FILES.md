# REFERENCE FILES — Shark V4 V1.1 Build

Exact file paths and line references for all source material.

---

## V1.0 Source Files (Read-Only Reference)

These files exist in V1.0 and are NOT modified. V1.1 hooks INTO them.

### Plugin Entry Point

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | 119 | Plugin export — returns `{ tool, config }`. V1.1 copies this as `src/index.v1.1.0.ts` and adds hooks spread. |

### Shared Enforcement Primitives (NOT modified)

| File | Lines | Purpose |
|------|-------|---------|
| `src/shark/shared/state-store.ts` | 156 | Domain ownership state. V1.1 hooks read from this. |
| `src/shark/shared/messenger.ts` | ~109 | Priority messaging between brains. V1.1 hooks read from this. |
| `src/shark/shared/guardian.ts` | 150 | Scope containment. V1.1 tool.execute.before MUST call `guardian.canWrite()` and `guardian.isDangerousCommand()`. |
| `src/shark/shared/gates.ts` | 220 | 6-gate chain manager. V1.1 tool.execute.after MUST call `gateManager.transitionTo()`. |
| `src/shark/shared/evidence.ts` | ~112 | Evidence collection. V1.1 tool.execute.after MUST call `evidenceCollector.collectEvidence()`. |

### Micro Variant

| File | Lines | Purpose |
|------|-------|---------|
| `src/shark/micro/coordinator.ts` | 147 | Mechanical Plan↔Build switch. V1.1: currently inert, hooks not wired. |
| `src/shark/micro/brains.ts` | 68 | Plan Brain T1 + Build Brain T1 prompts. NOT modified. |

### Macro Variant

| File | Lines | Purpose |
|------|-------|---------|
| `src/shark/macro/peer-dispatch.ts` | 147 | Triple-brain race coordinator. V1.1: currently inert, hooks not wired. |
| `src/shark/macro/brains.ts` | 132 | Execution + Reasoning + System + Plan brain T1 prompts. V1.1: shark-macro instructions simplified to EXECUTION_BRAIN_T1 only. |

### Tools

| File | Lines | Problem | Fix |
|------|-------|---------|-----|
| `src/tools/shark-status.ts` | 35 | None known | None needed |
| `src/tools/shark-gate.ts` | 41 | None known | None needed |
| `src/tools/shark-evidence.ts` | 64 | Uses `z` from zod but zod not imported | V1.1: `src/tools/shark-evidence.v1.1.0.ts` using `tool.arg.enum()` |

---

## V4 Boilerplate Reference Files

These show the correct OpenCode hook integration pattern. Shark V4 V1.1 must follow the same pattern.

### Boilerplate Hooks

| File | Path | Shows |
|------|------|-------|
| `tool-before-after.ts` | `/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Agent-Factory-Edition/src/hooks/tool-before-after.ts` | `tool.execute.before` and `tool.execute.after` hook pattern with `safeHook()` wrapper |
| `chat-system-transform.ts` | `/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Agent-Factory-Edition/src/hooks/chat-system-transform.ts` | `chat.system.transform` hook pattern |
| `utils.js` (in hooks/) | `/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Agent-Factory-Edition/src/hooks/utils.js` | `safeHook()` wrapper implementation |

### Boilerplate State

| File | Path | Shows |
|------|------|-------|
| `state.ts` | `/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Agent-Factory-Edition/src/state.ts` | Per-session state management, `session.created` pattern |
| `types.ts` | `/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Agent-Factory-Edition/src/factory/types.ts` | TypeScript interfaces for hooks |

### Boilerplate Factory Components (Copied to Shark V4)

| Boilerplate Source | Shark V4 Destination | Status |
|-------------------|---------------------|--------|
| `src/factory/StateStore.ts` | `src/shark/shared/state-store.ts` | Copied in V1.0 |
| `src/factory/BrainMessenger.ts` | `src/shark/shared/messenger.ts` | Copied in V1.0 |
| `src/factory/types.ts` | Referenced | Type defs only |

---

## shark-context Library Files

These are NOT modified. They are shark-context — the operational reference for the agent at runtime.

| File | Path | Purpose |
|------|------|---------|
| `INDEX.md` | `shark-context/INDEX.md` | Entry point |
| `MENTAL_MODEL.md` | `shark-context/MENTAL_MODEL.md` | T1: thinking process |
| `PURPOSE.md` | `shark-context/PURPOSE.md` | T1: identity |
| `ARCHITECTURE.md` | `shark-context/REFERENCE/ARCHITECTURE.md` | T2: component map |
| `BRAIN_MODELS.md` | `shark-context/REFERENCE/BRAIN_MODELS.md` | T2: brain config |
| `BUILD_WORKFLOW.md` | `shark-context/REFERENCE/BUILD_WORKFLOW.md` | T2: methodology |
| `ESCALATION.md` | `shark-context/REFERENCE/ESCALATION.md` | T2: escalation protocol |
| `PATTERNS.md` | `shark-context/REFERENCE/PATTERNS.md` | T2: pattern catalog |
| `SHARK_VARIANTS.md` | `shark-context/REFERENCE/SHARK_VARIANTS.md` | T2: Micro vs Macro |
| `VERIFICATION.md` | `shark-context/REFERENCE/VERIFICATION.md` | T2: claim verification |

---

## V1.1 New Files (Created From This Build)

All new files must follow the iteration protocol — created as new files, not edits to existing.

### Hook Files

| File | Purpose |
|------|---------|
| `src/hooks/v1.1.0/utils.ts` | Helper functions for hook inputs |
| `src/hooks/v1.1.0/guardian-hook.ts` | `tool.execute.before` → Guardian blocking |
| `src/hooks/v1.1.0/gate-hook.ts` | `tool.execute.after` → GateManager + Evidence |
| `src/hooks/v1.1.0/session-hook.ts` | `session.created` → initialization |
| `src/hooks/v1.1.0/compacting-hook.ts` | `session.compacting` → state snapshot |
| `src/hooks/v1.1.0/system-transform-hook.ts` | `chat.system.transform` → context injection |
| `src/hooks/v1.1.0/index.ts` | Master aggregator — `createSharkHooks()` |

### Updated Plugin Entry

| File | Changes from V1.0 |
|------|-------------------|
| `src/index.v1.1.0.ts` | Spreads `createSharkHooks()`, uses `process.cwd()` for evidence, shark-macro uses only EXECUTION_BRAIN_T1 |

### Updated Tools

| File | Changes from V1.0 |
|------|-------------------|
| `src/tools/shark-evidence.v1.1.0.ts` | Removed zod, uses `tool.arg.enum()` |

---

## Evidence and State Paths

### V1.0 (WRONG)
```typescript
const gm = new GateManager(directory);  // directory = plugin install path
const ec = new EvidenceCollector(directory);
// Archives to: ~/.opencode/plugins/shark-agent-v4/.shark/
```

### V1.1 (CORRECT)
```typescript
import * as path from 'node:path';
const workspacePath = process.cwd();  // OpenCode sets cwd = workspace
const gm = new GateManager(path.join(workspacePath, '.shark'));
const ec = new EvidenceCollector(path.join(workspacePath, '.shark'));
// Archives to: {workspace}/.shark/
```

---

## Import Path Reference

For new hook files, use these import paths relative to `src/`:

```
src/
└── hooks/
    └── v1.1.0/
        ├── index.ts
        ├── guardian-hook.ts
        ├── gate-hook.ts
        ├── session-hook.ts
        ├── compacting-hook.ts
        ├── system-transform-hook.ts
        └── utils.ts

# Imports from index.ts:
import { Guardian } from '../../shark/shared/guardian.js';
import { GateManager } from '../../shark/shared/gates.js';
import { EvidenceCollector } from '../../shark/shared/evidence.js';

# For src/index.v1.1.0.ts:
import { createSharkHooks } from './hooks/v1.1.0/index.js';
```

---

## OpenCode Plugin Type Imports

```typescript
// Correct import for Hooks type
import type { Hooks } from '@opencode-ai/plugin';

// Correct import for tool builder
import { tool } from '@opencode-ai/plugin';
```

---

*Reference files documented. Build agent has all paths.*
