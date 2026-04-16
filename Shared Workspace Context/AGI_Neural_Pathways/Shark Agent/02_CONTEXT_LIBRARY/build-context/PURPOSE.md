# PURPOSE — SHARK AGENT V4 V1.1 BUILD

## Mission

Transform Shark Agent V4 from V1.0 (inert TypeScript — zero OpenCode hook integration) into V1.1 (functional mechanical enforcement via OpenCode's hook system).

## What V1.0 Built

V1.0 registered an OpenCode plugin that:
- Returns `{ tool: {...}, config: async ... }` — valid plugin shape
- Creates instances of Guardian, GateManager, EvidenceCollector, StateStore, BrainMessenger
- Defines brain T1 prompts for shark-micro and shark-macro agents
- **But never wires any of these into OpenCode's hook system**

The result: 119 lines in `src/index.ts`, 85 bundled modules, 478KB — all completely inert.

## What V1.1 Must Build

V1.1 must add **OpenCode hook integration** so that:

```
OpenCode Tool Call
     ↓
tool.execute.before hook fires
     ↓
Guardian.canWrite(path) → BLOCK if violation
Guardian.isDangerousCommand(cmd) → BLOCK if dangerous
     ↓
Tool executes
     ↓
tool.execute.after hook fires
     ↓
EvidenceCollector.collectEvidence() → Stamp work done
GateManager.transitionTo() → Advance gates
     ↓
chat.system.transform hook fires
     ↓
Enforcement context injected into system prompt
     ↓
Agent sees current gate, iteration, blocking criteria
```

## Constraints

### Constraint 1: NEVER OVERWRITE
- Original V1.0 source must be preserved as `src/index.v1.0.ts`, `src/tools/shark-evidence.v1.0.ts`, etc.
- All changes go into new files with version suffixes
- New files are swapped in only after verification passes

### Constraint 2: EXACT FILE PATHS
- New hooks file: `src/hooks/v1.1.0/index.ts`
- New plugin entry: `src/index.v1.1.0.ts`
- New shark-evidence: `src/tools/shark-evidence.v1.1.0.ts`
- All paths verified before swap

### Constraint 3: VERIFY BEFORE BUILD
- Pre-build checks must pass before `bun build`
- Bundle must contain hook function names (grep verification)
- Typecheck must pass

### Constraint 4: EVIDENCE PATH
- Evidence must go to `{workspace}/.shark/`, not plugin directory
- Use `process.cwd()` since OpenCode sets cwd = user's workspace
- NOT `input.directory` (that's the plugin install path)

## What NOT To Build

- Do not build new enforcement logic — the logic already exists in V1.0
- Do not modify Guardian, GateManager, EvidenceCollector classes
- Do not modify brain T1 prompts
- Only wire existing code into OpenCode hooks

## Success Criteria

V1.1 is complete when:
1. `bun build src/index.ts` produces bundle
2. Bundle contains `tool.execute.before`, `tool.execute.after`, `session.created`
3. `opencode --agent shark-micro "help"` shows shark-micro tab
4. `opencode --tool shark-evidence --action status` returns valid JSON
5. Evidence files appear in `{cwd}/.shark/evidence/` after agent use

## Why This Matters

Without V1.1, Shark Agent V4 is a shell project — it looks like a working plugin but does nothing. The mechanical enforcement that makes Shark "Shark" (Guardian blocking, GateManager transitions, EvidenceCollector proof) only exists when wired into OpenCode's hook system. V1.1 is the difference between a plugin that claims to enforce and one that actually does.
