# Shark Agent — Build Specification

**Type:** OpenCode Plugin Agent
**Architecture:** Dual-Brain Autonomous DevOps Engineer
**Phase:** Build from scratch on v4 boilerplate scaffold

---

## What Shark Agent Is

A tab-toggle OpenCode plugin agent that functions as a **mechanically-enforced autonomous full-stack DevOps engineer**. It enforces build discipline through a state machine that acts as a brick wall — the agent literally cannot skip steps, bypass gates, or ship without passing every verification checkpoint.

The core anti-hallucination mechanism: **separate the brain that THINKS from the brain that DOES**. DeepSeek R1 (or equivalent reasoning model) plans. A separate execution model acts as a mechanical executor that cannot make autonomous decisions. Quality gates are enforced by code, not by the model's self-assessment.

---

## Design Principles

1. **Mechanical enforcement, not persuasion.** The agent is blocked by code, not warned by prompts.
2. **Claims over assertions.** Every feature claim must be paired with a test file path at planning time.
3. **Evidence over confidence.** Completion requires evidence files, not model self-reports.
4. **State machine is the source of truth.** The phase/step state is persisted and enforced on every tool call.
5. **Guardian is always active.** Path protection is enforced at the hook layer, not at the tool layer.
6. **No hallucinations possible on critical paths.** Ship gate cannot be passed without all three verification gates passing.

---

## Architecture Overview

```
OpenCode Plugin Entry
├── src/index.ts                          — Plugin export, tab registration
├── src/shark/
│   ├── agents/                            — Shark agent prompt definitions
│   ├── hooks/                             — Shark-specific hook implementations
│   ├── tools/                             — Shark-specific tools
│   ├── guardian/                          — Guardian path protection
│   ├── state-machine/                     — Phase/state machine enforcement
│   └── brain/                             — Dual-brain coordination logic
└── src/v4-integration/                   — Glue to v4 boilerplate factory
```

### Agent Tab Registration

- **Tab name:** `shark`
- **Icon:** 🦈 (via color theme or emoji in description)
- **Primary agent:** `shark-orchestrator` (mode: `"primary"`)
- **Color:** `#1DA0C3` (Shark blue — configurable)

### Agent Roster

| Agent | Mode | Role |
|-------|------|------|
| `shark-orchestrator` | primary | Owns state machine, enforces gates, delegates to brains |
| `shark-architect` | subagent | DeepSeek R1 planning brain — intent → claims |
| `shark-coder` | subagent | Execution brain — implements per-claim |
| `shark-reviewer` | subagent | QA brain — runs verification gates |
| `shark-debugger` | subagent | Auto-debug engine — mechanical error fixes |
| `shark-explorer` | subagent | Codebase context mapping |

---

## Phase State Machine

Persisted at `.shark/workflow.json` in the project directory.

### Phases (Strict Order)

```
PLAN → BUILD → TEST → VERIFY → SHIP
  ↑                           │
  └──── Reset after 3 loops ───┘
```

### Phase Rules

| Phase | Entry Requirements | Exit Requirements | Blocked Actions |
|-------|-------------------|-------------------|-----------------|
| PLAN | None | `plan.md` + `claims.json` exist | Writing src/ files |
| BUILD | Claims document | `build-manifest.json` updated per file | Advancing without manifest update |
| TEST | Build manifest | Stage1 + Stage2 test results exist and pass | Advancing without test evidence |
| VERIFY | Both test stages pass | All 3 gates pass | Any write to src/ without justification |
| SHIP | All gates pass | Delivery confirmation | None |

### Loop Mechanics

- Phases BUILD → TEST → VERIFY loop up to 3 times
- After 3 failed verification attempts: reset to PLAN with full failure context captured
- Context capture includes: plan content, all code files, test results, verification failures, action log

### Claims Document

Every plan produces a `claims.json`:

```json
{
  "claims": [
    {
      "id": "claim-001",
      "description": "User can authenticate with JWT",
      "testFile": "tests/auth.test.ts",
      "status": "pending"
    }
  ]
}
```

Each claim must have a `testFile` path. No claim = no build. No test = no ship.

---

## Guardian System

Zone classification enforced at the hook layer on every file operation.

### Zones

| Zone | Examples | Default Policy |
|------|----------|----------------|
| WORKSPACE | Project dir + subdirs | ALLOW |
| SANDBOX | `/tmp/shark-sandbox/` | ALLOW (redirected writes) |
| DEVELOPMENT | `~/Projects`, `~/code`, `~/repos` | ALLOW (BALANCED) |
| PERSONAL | `~/.ssh`, `~/.aws`, `~/.gcloud`, `~/.env` | DENY |
| CONFIG | `/etc`, systemd units | DENY |
| SYSTEM | `/bin`, `/sbin`, `/usr/bin`, `/proc`, `/sys` | DENY (absolute) |

### Protection Levels

| Level | Workspace | Dev Dirs | Personal | Config | System |
|-------|-----------|----------|----------|--------|--------|
| STRICT | ✓ Write | ✗ | ✗ | ✗ | ✗ |
| BALANCED | ✓ Write | ✓ Write | ✗ | ✗ | ✗ |
| PERMISSIVE | ✓ Write | ✓ Write | ✗ | ✗ | ✗ |
| SANDBOX | ✓ Write | ✗ | ✗ | ✗ | ✗ (all → sandbox) |

### Guardian Hook

`createGuardianGateHook()` on `tool.execute.before`:
- Intercepts `write_file`, `patch`, `edit_file`, `terminal` (for `rm`, `mv`, `cp`)
- Classifies target path
- Denies or redirects based on protection level
- Logs all decisions to audit log

---

## Verification Gates

Three independent gates at the VERIFY phase. All must pass to unlock SHIP.

### Gate 1: Functional

- Stage 1 (Docker sandbox) test results pass
- Stage 2 (local device) test results pass
- Evidence: `.shark/test-results/stage1.json` and `stage2.json`

### Gate 2: Intent

- Every claim in `claims.json` has a passing test
- Evidence: `.shark/claim-results/{claim-id}.json` per claim
- Missing test file for any claim = gate fails

### Gate 3: Security

- Guardian scan shows no critical/high vulnerabilities
- No hardcoded secrets detected
- Evidence: `.shark/guardian-report.json`

---

## Tool Suite

### Shark-Specific Tools

| Tool | Purpose | Phase |
|------|---------|-------|
| `phase_status` | Current phase + blockers + available actions | All |
| `advance_phase` | Attempt phase transition (blocked by state machine) | All |
| `extract_claims` | Parse user intent into `claims.json` | PLAN |
| `update_manifest` | Record a built file to `build-manifest.json` | BUILD |
| `guardian_classify` | Classify a path and return modification decision | All |
| `guardian_scan` | Full security scan → `guardian-report.json` | VERIFY |
| `run_verification` | Execute all 3 gates, return gate results | VERIFY |
| `auto_debug` | Pattern-match error, suggest/apply mechanical fixes | BUILD/TEST |
| `shark_health` | Project health score 0-100 | All |
| `capture_context` | Save failure context on 3rd verification loop | VERIFY |
| `reset_workflow` | Reset to PLAN with captured context | VERIFY |

### Quality Tools (from v2.1, fixed)

| Tool | Source | Status |
|------|--------|--------|
| `lint` | v2.1 quality.ts | Working |
| `diff` | v2.1 quality.ts | Working |
| `build_check` | v2.1 quality.ts | Working |
| `syntax_check` | v2.1 quality.ts | Working |
| `test_runner` | v2.1 security.ts | Working |
| `placeholder_scan` | v2.1 security.ts | Working |
| `sast_scan` | v2.1 security.ts | Working |
| `secret_scan` | v2.1 security.ts | **NEEDS FIX** — corruption |

### Session/Memory Tools (from v2.1)

| Tool | Purpose |
|------|---------|
| `checkpoint` | Session checkpoint |
| `phase_complete` | Phase completion marker |
| `save_plan` | Persist plan to disk |
| `list_sessions` | List saved sessions |
| `load_session` | Load a session |
| `fork_session` | Fork from a snapshot |
| `create_snapshot` | Create session snapshot |
| `shark_recall` | Query memory store |
| `shark_remember` | Store to memory |
| `shark_context` | Inject memory context |

---

## Hook Stack

### `tool.execute.before` (ordered)

1. **`createGuardianGateHook`** — Path zone classification + modification decision. Blocks DENY decisions. Redirects SANDBOX_REDIRECT decisions.
2. **`createPhaseGateHook`** — State machine enforcement. Blocks phase-skipping. Blocks src writes during VERIFY without justification.
3. **`createTddEnforcerHook`** — During BUILD: blocks src file writes without corresponding test file created first.
4. **`createScopeGuardHook`** — Dangerous commands: `rm -rf /`, format string attacks, `/etc/hosts` modifications.

### `tool.execute.after` (ordered)

1. **`createBuildManifestHook`** — During BUILD: after `write_file`, update `.shark/build-manifest.json`.
2. **`createClaimTrackerHook`** — After writes: check if a claim's test file was created. Mark claim status.
3. **`createQualityGateHook`** — After TEST phase: enforce stage1 + stage2 evidence before advancing.
4. **`createAntiHallucinationHook`** — After any tool: scan output for completion claims without evidence, placeholder patterns, rationalization language.

### `experimental.chat.system.transform`

1. **`createSharkBrainInjectHook`** — Inject current phase, blocked actions, available actions, Guardian status, active claims into system prompt.
2. **`createClaimContextHook`** — Inject active claims + their status so agent always knows what's being built.

### `experimental.chat.messages.transform`

1. **`createIntentMarkerHook`** — Mark user messages with extracted claim IDs.
2. **`createAntiRationalizationHook`** — Block completion claims that lack test evidence.
3. **`createContextBudgetHook`** — Token budget warnings.

---

## V4 Boilerplate Integration

Shark Agent uses the v4 boilerplate as its foundation:

1. **Factory pattern** — `ArchitectureFactory` creates agents from Shark's `shark-config.ts`
2. **State store** — Shark uses `createStateStore()` for cross-brain coordination state
3. **Brain messenger** — Shark uses `createBrainMessenger()` for architect ↔ executor handoffs
4. **Cluster factory** — Shark's pools (research, execution, qa) created via `ClusterFactory`
5. **Validator pipeline** — Shark runs `architectureValidators` on its config

### Shark Config (`shark-config.ts`)

```typescript
export const sharkConfig: ArchitectureConfig = {
  name: 'shark',
  version: '1.0.0',
  description: 'Dual parallel orchestrator: Architect (planning) + Executor (execution)',
  brain: {
    type: 'dual',
    name: 'shark-brain',
    syncMode: 'shared-state',
    orchestrators: {
      architect: 'shark-architect',
      executor: 'shark-orchestrator',
    },
    workflows: {
      architect: {
        name: 'The Architect',
        description: 'Long-term planning, claims extraction, intent verification',
        owns: ['plan-state', 'claims'],
        delegatesTo: ['research-pool'],
        gates: ['plan-gate'],
      },
      executor: {
        name: 'The Executor',
        description: 'Execution tracking, QA gate enforcement, state machine',
        owns: ['execution-state', 'quality-state', 'workflow-state'],
        delegatesTo: ['execution-pool', 'qa-pool'],
        gates: ['qa-gate', 'test-gate', 'verify-gate'],
      },
    },
  },
  clusters: [
    { id: 'research-pool', name: 'Research Pool', agents: ['shark-explorer', 'sme'], ... },
    { id: 'execution-pool', name: 'Execution Pool', agents: ['shark-coder'], ... },
    { id: 'qa-pool', name: 'QA Pool', agents: ['shark-reviewer', 'shark-debugger'], ... },
  ],
  agents: {
    'shark-orchestrator': { ... },
    'shark-architect': { ... },
    'shark-coder': { ... },
    'shark-reviewer': { ... },
    'shark-debugger': { ... },
    'shark-explorer': { ... },
  },
  delegation: {
    allowCrossCluster: true,
    requireGateApproval: true,
    maxHops: 2,
  },
};
```

---

## Directory Structure

```
shark-agent/
├── src/
│   ├── index.ts                    — Plugin entry, tab registration
│   ├── shark/
│   │   ├── agents/
│   │   │   ├── orchestrator.ts     — Primary agent prompt
│   │   │   ├── architect.ts         — Planning brain prompt
│   │   │   ├── coder.ts            — Execution brain prompt
│   │   │   ├── reviewer.ts         — QA brain prompt
│   │   │   ├── debugger.ts         — Auto-debug prompt
│   │   │   └── explorer.ts         — Context mapping prompt
│   │   ├── hooks/
│   │   │   ├── guardian-gate.ts    — Guardian path protection hook
│   │   │   ├── phase-gate.ts       — State machine enforcement hook
│   │   │   ├── tdd-enforcer.ts     — TDD enforcement hook
│   │   │   ├── scope-guard.ts      — Dangerous command hook
│   │   │   ├── build-manifest.ts   — Manifest tracking hook
│   │   │   ├── claim-tracker.ts    — Claim status tracking hook
│   │   │   ├── quality-gate.ts     — Quality gate enforcement hook
│   │   │   ├── anti-hallucination.ts — Anti-hallucination hook
│   │   │   ├── shark-brain-inject.ts — Brain context injection hook
│   │   │   └── claim-context.ts    — Claim context injection hook
│   │   ├── tools/
│   │   │   ├── phase-status.ts     — Phase status tool
│   │   │   ├── advance-phase.ts    — Phase transition tool
│   │   │   ├── extract-claims.ts   — Claims extraction tool
│   │   │   ├── update-manifest.ts  — Build manifest tool
│   │   │   ├── guardian-classify.ts — Path classification tool
│   │   │   ├── guardian-scan.ts    — Security scan tool
│   │   │   ├── run-verification.ts — 3-gate runner tool
│   │   │   ├── auto-debug.ts       — Auto-debug tool
│   │   │   ├── shark-health.ts     — Health score tool
│   │   │   ├── capture-context.ts  — Context capture tool
│   │   │   └── reset-workflow.ts   — Workflow reset tool
│   │   ├── guardian/
│   │   │   ├── index.ts           — Guardian class (ported from shark-frankenstein)
│   │   │   ├── zones.ts           — Zone classification
│   │   │   └── audit.ts           — Audit logging
│   │   ├── state-machine/
│   │   │   ├── workflow.ts         — WorkflowMachine class
│   │   │   ├── types.ts           — WorkflowState, WorkflowStep types
│   │   │   ├── gates.ts           — Verification gate runners
│   │   │   └── claims.ts          — Claims document handling
│   │   └── brain/
│   │       ├── coordinator.ts      — Dual-brain handoff logic
│   │       └── types.ts           — BrainMessage types
│   └── v4-integration/
│       ├── index.ts               — V4 factory integration
│       └── shark-config.ts        — Shark ArchitectureConfig
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
├── .npmrc
└── README.md
```

---

## Implementation Priority

### Phase 1: Plugin Shell + Guardian
- [ ] `src/index.ts` — Plugin entry, tab registration (follow HOTFIX_LOG pattern)
- [ ] `src/shark/guardian/index.ts` — Guardian class ported from shark-frankenstein
- [ ] `src/shark/hooks/guardian-gate.ts` — Guardian hook on `tool.execute.before`
- [ ] `src/shark/hooks/scope-guard.ts` — Dangerous command hook
- [ ] Verify Guardian path protection works on `write_file`, `terminal`

### Phase 2: State Machine + Phase Enforcement
- [ ] `src/shark/state-machine/types.ts` — WorkflowState, WorkflowStep, claims types
- [ ] `src/shark/state-machine/workflow.ts` — WorkflowMachine class
- [ ] `src/shark/state-machine/claims.ts` — Claims document handling
- [ ] `src/shark/hooks/phase-gate.ts` — State machine hook
- [ ] `src/shark/tools/phase-status.ts`
- [ ] `src/shark/tools/advance-phase.ts`
- [ ] Verify state machine blocks phase skips

### Phase 3: Shark Agents + Prompts
- [ ] `src/shark/agents/orchestrator.ts` — Primary agent prompt
- [ ] `src/shark/agents/architect.ts` — Planning brain prompt
- [ ] `src/shark/agents/coder.ts` — Execution brain prompt
- [ ] `src/shark/agents/reviewer.ts` — QA brain prompt
- [ ] `src/shark/agents/debugger.ts` + `src/shark/tools/auto-debug.ts`
- [ ] `src/shark/agents/explorer.ts`
- [ ] V4 factory integration: `src/v4-integration/shark-config.ts`

### Phase 4: Quality Gates + Build Tracking
- [ ] `src/shark/hooks/build-manifest.ts` — Manifest tracking hook
- [ ] `src/shark/hooks/claim-tracker.ts` — Claim status hook
- [ ] `src/shark/hooks/tdd-enforcer.ts` — TDD enforcement
- [ ] `src/shark/tools/extract-claims.ts`
- [ ] `src/shark/tools/update-manifest.ts`
- [ ] `src/shark/tools/shark-health.ts`
- [ ] `src/shark/state-machine/gates.ts` — Verification gate runners
- [ ] `src/shark/tools/run-verification.ts`

### Phase 5: Brain Coordination + Context Injection
- [ ] `src/shark/brain/coordinator.ts` — Architect ↔ Executor handoff
- [ ] `src/shark/hooks/shark-brain-inject.ts` — Brain context injection
- [ ] `src/shark/hooks/claim-context.ts` — Claim context injection
- [ ] `src/shark/hooks/anti-hallucination.ts` — Output scanning
- [ ] `src/shark/tools/capture-context.ts`
- [ ] `src/shark/tools/reset-workflow.ts`

### Phase 6: Memory + Session
- [ ] `src/shark/tools/shark-recall.ts`
- [ ] `src/shark/tools/shark-remember.ts`
- [ ] `src/shark/tools/shark-context.ts`
- [ ] `src/shark/tools/guardian-scan.ts`
- [ ] Fix and integrate v2.1 quality tools (`secret_scan` fix)
- [ ] Session tools integration

---

## Critical Constraints

1. **Do not use `context.worktree`** — always use `context.directory` for file operations. `worktree` can point to the wrong directory.
2. **All hooks must check agent identity** — use `isSharkAgent()` guard at the top of every hook. Shark hooks must not run for vanilla OpenCode agents.
3. **Secret scan must be fixed** — v2.1 `secretScan=***` corruption must be corrected before the tool can be used.
4. **Phase state is source of truth** — never trust the agent to self-report phase. The state machine is the authoritative source.
5. **Guardian runs before everything** — Guardian gate must be the first `tool.execute.before` hook to prevent any protected file access.
6. **Claims must be extracted before BUILD** — the agent must not write any src file until claims.json exists and every claim has a test file path.
