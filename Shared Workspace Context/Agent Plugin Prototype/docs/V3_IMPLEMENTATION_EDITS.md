# V3 IMPLEMENTATION PLAN — EDITS FOR BUILD AGENT

**Status**: Direct execution plan. Apply these changes to `V3_IMPLEMENTATION_PLAN.md` before building.

---

## Critical Fix: Phase Ordering

### FIX 1: Swap Phase 4 and Phase 5

**Problem**: Persistence layer (Phase 5) depends on `TaskState` from State Machine (Phase 4). Current order is wrong.

**Current order**:
```
Phase 4: State Machine
Phase 5: Persistence
```

**Correct order**:
```
Phase 4: State Machine
Phase 5: Persistence
```

Wait, the plan already has State Machine (Phase 4) before Persistence (Phase 5). Let me re-check...

Actually looking at the plan again:
- Phase 4: State Machine (2 files: `state-machine.ts`, `defaults/states.ts`)
- Phase 5: Persistence (5 files)

This IS correct. The plan has them in the right order. Ignore this fix.

---

## FIX 2: Add Atomic Write Strategy to Persistence

**Location**: Section 10 (Risk Mitigation), add implementation detail.

**Add after "Use atomic writes"**:

```markdown
### Atomic Write Implementation

All file writes in persistence layer MUST use atomic write pattern:

```typescript
// BAD (can corrupt on crash)
await fs.writeFile('plan.json', JSON.stringify(data));

// GOOD (atomic)
const tmpPath = 'plan.json.tmp';
await fs.writeFile(tmpPath, JSON.stringify(data));
await fs.fsync(await fs.open(tmpPath, 'r+'));
await fs.rename(tmpPath, 'plan.json');
```

Apply this to:
- `persistence/swarm-state.ts` (plan.json, snapshot.json)
- `persistence/evidence.ts` (evidence JSON files)
- `persistence/checkpoint.ts` (checkpoint metadata)

---

## FIX 3: Add Tool Context Type Reference

**Location**: Phase 7 (Coordination Tools), add before file list.

**Add**:

```markdown
### Important: OpenCode Tool Context Type

All coordination tools must use the correct OpenCode tool context:

```typescript
import type { ToolContext } from '@opencode-ai/plugin';

interface ToolContext {
  sessionID: string;
  messageID: string;
  agent: string;
  directory: string;
  worktree: string;
  abort: AbortSignal;
  metadata(input: { title?: string; metadata?: any }): void;
  ask(input: AskInput): Promise<void>;
}
```

Tools in `coordination/tools/` receive this as their `context` parameter.

---

## FIX 4: Update composeHandlers to Handle Undefined Handlers

**Location**: Section 5.1 (Plugin Entry Point integration example), update the composeHandlers call.

**Change**:

```typescript
// FROM:
'tool.execute.before': composeHandlers(
  coordination.hooks['tool.execute.before'],
  toolBeforeHook,
),

// TO:
'tool.execute.before': composeHandlers(
  coordination.hooks['tool.execute.before'],
  toolBeforeHook,
).filter(Boolean),  // Remove undefined handlers
```

Or better, update the actual `hooks/index.ts` in the plan to handle this internally:

```typescript
export function composeHandlers<I = unknown, O = unknown>(
  ...handlers: Array<HookHandler<I, O> | undefined>
): HookHandler<I, O> {
  const validHandlers = handlers.filter((h): h is HookHandler<I, O> => h !== undefined);
  
  return async (input: I, output: O) => {
    for (const handler of validHandlers) {
      await handler(input, output);
    }
  };
}
```

---

## FIX 5: Add Zod v4 Compatibility Warning

**Location**: Section 7 (Dependencies), add note.

**Add**:

```markdown
### Zod Version Warning

This project uses Zod v4.1.8 (exact) to match `@opencode-ai/plugin`.

**DO NOT** use Zod v3 syntax or `^3.x.x` versions. They have incompatible internal structures (`_zod.version.minor: 3` vs `1`).

Common v3 → v4 breaking changes:
- `z.object({}).required()` → `z.object({})` (v4 objects are required by default)
- `z.string().optional()` → `z.string().optional()` (same)
- `z.enum(['a', 'b'])` → `z.enum(['a', 'b'])` (same)
- `z.record(z.string())` → `z.record(z.string())` (same)

If copying tool definitions from v2, update Zod schema syntax to v4.

---

## FIX 6: Add Missing Test Files

**Location**: Section 13 (Tests & Documentation), update file list.

**Change Phase 13 from**:
```markdown
36. `tests/unit/coordination/registry.test.ts`
37. `tests/unit/coordination/delegation.test.ts`
38. `tests/unit/coordination/state-machine.test.ts`
39. `tests/unit/hooks/gate-hook.test.ts`
```

**To**:
```markdown
36. `tests/unit/coordination/registry.test.ts`
37. `tests/unit/coordination/delegation.test.ts`
38. `tests/unit/coordination/state-machine.test.ts`
39. `tests/unit/hooks/gate-hook.test.ts`
40. `tests/unit/hooks/guardrail-hook.test.ts`
41. `tests/unit/hooks/slop-detector-hook.test.ts`
42. `tests/unit/persistence/swarm-state.test.ts`
43. `tests/unit/persistence/evidence.test.ts`
```

**Add test coverage requirements**:

| Component | Required Tests |
|-----------|----------------|
| `registry.ts` | getAgent, getAgentsByMode, getAgentsByCluster, isAgentAllowedTool |
| `delegation.ts` | delegate, canDelegate, getClusterAgents, gate enforcement |
| `state-machine.ts` | createTask, transition, getTask, getTasksByState, guards |
| `gate-hook.ts` | QA gate blocking, warning injection, consecutive coder detection |
| `guardrail-hook.ts` | duration limit, idle timeout, error threshold |
| `slop-detector-hook.ts` | class repetition, comment ratio, diff size |
| `swarm-state.ts` | loadPlan, savePlan, atomic writes, snapshots |
| `evidence.ts` | addEvidence, getEvidence, verifyEvidence |

---

## FIX 7: Split swarm-state.ts Into Facade + Sub-Modules

**Problem**: `swarm-state.ts` as one 150+ line file is unmaintainable.

**Location**: Phase 5 (Persistence), update file structure.

**Change Phase 5 from**:
```markdown
7. `src/coordination/persistence/swarm-state.ts`
   - createSwarmState() function
   - SwarmState interface
   - Plan/evidence/checkpoint operations
   - Phase management
   - Snapshot save/load
```

**To**:
```markdown
7. `src/coordination/persistence/swarm-state.ts`
   - Thin facade that composes plan, evidence, checkpoint
   - Provides unified SwarmState interface
   - Does NOT contain file I/O logic

7a. `src/coordination/persistence/plan-store.ts`
   - Plan file operations only (loadPlan, savePlan, syncPlan)
   - Uses atomic write pattern

7b. `src/coordination/persistence/evidence-store.ts`
   - Evidence operations only (addEvidence, getEvidence, verifyEvidence)
   - Uses atomic write pattern

7c. `src/coordination/persistence/checkpoint-store.ts`
   - Checkpoint operations only (create, restore, list)
   - Uses atomic write pattern
```

---

## Summary of Edits to Apply

| Fix | Section | Change |
|-----|---------|--------|
| FIX 1 | Phase ordering | Already correct, no change needed |
| FIX 2 | Risk Mitigation | Add atomic write implementation detail |
| FIX 3 | Phase 7 intro | Add ToolContext type reference |
| FIX 4 | Integration example | Update composeHandlers to filter undefined |
| FIX 5 | Dependencies | Add Zod v4 compatibility warning |
| FIX 6 | Tests | Add 4 missing test files + coverage table |
| FIX 7 | Phase 5 | Split swarm-state.ts into facade + 3 sub-modules |

---

## Acceptance Criteria for V3 Build

Apply all fixes above, then verify:

- [ ] Phase order: State Machine (Phase 4) before Persistence (Phase 5)
- [ ] All 5 persistence files use atomic write pattern
- [ ] `composeHandlers` handles undefined/null handlers
- [ ] Zod v4.1.8 exact pinned in package.json
- [ ] 8 test files (not 4)
- [ ] `swarm-state.ts` is thin facade, file I/O in sub-modules
- [ ] ToolContext type documented and used in coordination tools

---

**Edits Document**: 2026-04-02
**Status**: Ready for build agent execution
