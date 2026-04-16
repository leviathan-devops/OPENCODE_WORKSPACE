# HERMES AGENT PLUGIN — BUILD TEAM MASTER PROMPT
## OpenCode Plugin for Leviathan's 2nd-Brain Autonomous Coding Agent

---

## What You Are Building

**Hermes Agent** is a production-grade OpenCode plugin that implements a **hub-and-spoke multi-agent orchestrator** with:
- 14 specialized agents (orchestrator + 13 subagents)
- 28 lifecycle hooks for pipeline enforcement
- 6-phase workflow (Brainstorm → Plan → Build → Review → Debug → Complete)
- Graeme's 3-agent self-improving supervisor loop
- 2nd-brain memory system injected every turn
- Full/Lite model tiering per agent

**Plugin SDK**: `@opencode-ai/plugin` (v1.1.53)
**Reference repo**: `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/` (Spider Agent — 68,504 lines, the working baseline)
**Plugin SDK types**: `/home/leviathan/spider-agent-rebrand/iteration-FINAL/node_modules/@opencode-ai/plugin/dist/`

---

## Build Team Workflow

### Before Every Session

1. Read `BUILD/BUILD_START_HERE.md` — this file
2. Read `BUILD/WEEKLY_SPRINT_PLAN.md` — current sprint goals
3. Read `BUILD/PHASE_CHECKLIST.md` — what's done and what's blocked
4. Reference `SOURCE_DECODED/PLUGIN_SDK_TYPES.md` — for SDK type signatures
5. Reference `SOURCE_DECODED/SPIDER_AGENT_FORENSIC.md` — Spider Agent hook/agent patterns

### How to Use This Context Library

```
Hermes Agent Plugin/
├── BUILD/                      ← YOUR WORKSPACE (build team)
│   ├── MASTER_PROMPT.md        ← (this file) — start here
│   ├── BUILD_START_HERE.md     ← Step-by-step build instructions
│   ├── WEEKLY_SPRINT_PLAN.md   ← Current sprint priorities
│   ├── PHASE_CHECKLIST.md      ← What's implemented, what's blocked
│   ├── PROGRESS_LOG.md         ← Daily progress entries
│   └── CHANGELOG.md            ← What changed and why
│
├── REFERENCE/                  ← SPECS (don't edit)
│   ├── ARCHITECTURE.md         ← Full 14-part architecture spec
│   ├── PLUGIN_SPEC.md          ← Implementation spec (1,167 lines)
│   ├── BUILD_WORKFLOW.md       ← Merged architecture analysis
│   ├── THREAD_ANTERMS.md       ← X/Twitter research synthesis
│   └── PERMISSIONS.md          ← Permission cascade system
│
├── SOURCE_DECODED/             ← REFERENCE IMPLEMENTATIONS (read-only)
│   ├── PLUGIN_SDK_TYPES.md     ← @opencode-ai/plugin type signatures
│   ├── SPIDER_AGENT_HOOKS.md   ← All 21 Spider hook factories
│   ├── SPIDER_AGENT_STATE.md   ← Spider state machine + tool registry
│   └── AGENT_CONFIGS.md        ← Spider's 11 agent prompt configs
│
├── SKILLS/                     ← SKILL DEFINITIONS
│   ├── BRAINSTORM.md           ← Phase 0: Socratic pre-planning
│   ├── PLAN.md                 ← Phase 1: No-placeholder planning
│   ├── TDD.md                  ← Phase 2: RED-GREEN-REFACTOR
│   ├── DEBUG.md                ← Phase 4: 4-phase systematic debugging
│   ├── GRILL.md                ← Phase 3: Adversarial attack vectors
│   ├── VERIFY.md               ← Phase 5: Proof-based completion
│   ├── HEALTH.md               ← Phase 5: Project health score
│   ├── REMEMBER.md             ← 2nd-brain: /remember
│   ├── RECALL.md               ← 2nd-brain: /recall
│   └── AUTOPILOT.md            ← Autonomous iterative development
│
├── PLANS/                      ← PHASE 0/1 OUTPUTS
│   └── (design docs + plans written during build)
│
├── TOOLS/                      ← TOOL DEFINITIONS
│   ├── TOOL_INDEX.md           ← All 65+ tools catalogued
│   ├── PHASE_ENFORCEMENT.md    ← checkpoint, phase_complete, etc.
│   ├── KNOWLEDGE.md            ← hermes_recall, hermes_remember, etc.
│   ├── ANALYSIS.md             ← complexity_hotspots, co_change_analyzer
│   ├── QUALITY.md              ← lint, build_check, test_runner, etc.
│   └── VERIFICATION.md         ← grill, verify, health
│
├── HOOKS/                      ← HOOK DEFINITIONS
│   ├── HOOK_INDEX.md           ← All 28 hooks catalogued
│   ├── BRAINSTORM_GATE.md      ← HARD-GATE: no code until design approved
│   ├── PLAN_VALIDATOR.md       ← Reject plans with TBD/TODO/placeholder
│   ├── TDD_ENFORCER.md         ← Test file must exist before src change
│   ├── DELEGATION_GATE.md      ← Coder blocked without reviewer approval
│   ├── STRICT_WRITE_DISCIPLINE.md ← Verify cached context before acting
│   ├── ADVERSARIAL_CHECK.md    ← Slop/bypass detection
│   ├── ANTI_RATIONALIZATION.md  ← Exit criteria checklist
│   ├── KNOWLEDGE_INJECTOR.md   ← 2nd-brain recall every turn
│   ├── PHASE_MONITOR.md       ← Phase transition enforcement
│   ├── COMPACTION.md           ← 5-tier token management
│   ├── DEBUGGING_SPIRAL.md     ← 5 identical calls = spiral detected
│   ├── RIPPLE_CHECK.md         ← Cascading change analysis
│   ├── SUPERVISOR_INGEST.md    ← Feed supervisor loop
│   └── INTENT_MARKER.md        ← Graeme's 4-marker protocol
│
├── AGENTS/                     ← AGENT PROMPT DEFINITIONS
│   ├── AGENT_INDEX.md          ← All 14 agents catalogued
│   ├── HERMES.md               ← Orchestrator (primary)
│   ├── ANALYST.md              ← Requirements → technical specs
│   ├── PLANNER.md              ← No-placeholder adaptive planning
│   ├── TDD.md                  ← RED-GREEN-REFACTOR executor
│   ├── BUILDER.md              ← Implementation (one task at a time)
│   ├── REVIEWER.md             ← Security + performance + patterns
│   ├── QUALITY_REVIEWER.md     ← Spec compliance + readability
│   ├── GRILL.md                ← Adversarial attack testing
│   ├── RIPPLE.md               ← Cascading change analyzer
│   ├── DRIFT_VERIFIER.md       ← Phase completion verification
│   ├── EXPLORER.md             ← Codebase context mapping
│   ├── ARCHITECT.md            ← Clean Architecture / DDD advocate
│   ├── DEBUGGER.md             ← 4-phase systematic debugging
│   └── SUPERVISOR.md           ← Graeme's self-improving loop
│
└── PERSPECTIVES/               ← CONTEXT FROM OTHER SYSTEMS
    ├── SUPERPOWERS.md          ← 7-phase workflow (obra/superpowers)
    ├── SPECIALIST.md           ← 36 agents, Full/Lite variants
    ├── AURA_FROG.md           ← Memory heals itself, 3-tier compaction
    ├── MAL_SHAIK.md           ← 7 secrets from Claude Code source
    └── GRAEME.md              ← 3-agent supervisor + 4-marker protocol
```

---

## Critical Build Constraints

### 1. Plugin SDK Compatibility
Your plugin MUST export a function matching this signature:

```typescript
type Plugin = (input: PluginInput) => Promise<Hooks>;

type PluginInput = {
    client: ReturnType<typeof createOpencodeClient>;
    project: Project;
    directory: string;
    worktree: string;
    serverUrl: URL;
    $: BunShell;  // shell utility
};

type Hooks = {
    name?: string;
    agent?: Agent[];          // OpenCode agent definitions
    tool?: Record<string, ToolDefinition>;  // Custom tools
    config?: (config: Config) => Promise<void>;
    auth?: AuthHook;
    "chat.message"?: ...;
    "chat.params"?: ...;
    "tool.execute.before"?: ...;
    "tool.execute.after"?: ...;
    "experimental.chat.messages.transform"?: ...;
    "experimental.chat.system.transform"?: ...;
    "experimental.session.compacting"?: ...;
    [key: string]: any;  // Allow additional hooks
};
```

See `SOURCE_DECODED/PLUGIN_SDK_TYPES.md` for complete type signatures.

### 2. Spider Agent Is the Reference
Spider Agent is the ONLY working OpenCode plugin with this architecture. It runs in production. Before writing ANY hook or agent:
- Read the relevant Spider Agent source in `SOURCE_DECODED/`
- Copy the pattern verbatim
- Adapt to Hermes-specific behavior
- Test against Spider Agent's test cases

### 3. Hook Order Matters
When composing multiple hooks in a single handler, use `composeHandlers` (Spider pattern). Order:
1. Guardrails (first — block bad actions fast)
2. Delegation gate (block unauthorized delegation)
3. Phase monitor (enforce correct phase)
4. TDD enforcer (test-first check)
5. Strict write discipline (verify before act)
6. Knowledge injector (2nd-brain recall)
7. Activity tracker (audit log)
8. Supervisor ingest (feed supervisor loop)

### 4. State Machine Is Sacred
The phase state machine (`idle→analyze→plan→build→review→complete`) MUST advance correctly. Never skip phases. Never regress. See `HOOKS/PHASE_MONITOR.md`.

### 5. No Subagent Can Approve Its Own Output
Every completion claim must be verified by a DIFFERENT agent. Self-review hook blocks this.

### 6. Verification Protocol
Every agent MUST show actual command output before claiming "done". Not "tests pass", but `> npm test -- --testPathPattern=auth  ✓ 23 passing`. Always show the actual output.

### 7. Token Budget
Compaction hooks MUST trigger in order at 70%, 80%, 90%, 95%. See `HOOKS/COMPACTION.md`.

### 8. 3-Strike Debugging Rule
After 3 failed fix attempts on the same bug → mandatory @architect review → user must approve before continuing. See `SKILLS/DEBUG.md`.

### 9. HARD-GATE Brainstorm
No code is written until: (a) user approves design doc AND (b) plan passes anti-rationalization checklist. See `HOOKS/BRAINSTORM_GATE.md`.

---

## Implementation Order (Mandatory)

### Week 1 — Core (can run end-to-end)
1. **Plugin scaffold**: `package.json`, `tsconfig.json`, `src/index.ts`
2. **Config schema**: `~/.hermes/settings.json` loader
3. **HERMES.md system enhancer hook**: Inject Leviathan's conventions every turn
4. **6 core agents**: hermes, analyst, planner, builder, reviewer, quality-reviewer
5. **5 core hooks**: brainstorm-gate, plan-validator, tdd-enforcer, delegation-gate, phase-monitor
6. **6 core tools**: checkpoint, phase_complete, save_plan, hermes_recall, hermes_remember, hermes_context
7. **SessionDB**: Session persistence with snapshot/restore

### Week 2 — Quality (full enforcement)
8. **Remaining agents**: grill, ripple, drift-verifier, explorer, architect, debugger, supervisor
9. **Remaining enforcement hooks**: strict-write-discipline, adversarial-check, anti-rationalization, knowledge-injector, compaction, debugging-spiral, ripple-check, supervisor-ingest, intent-marker
10. **Full tool system**: All 65+ tools
11. **Supervisor loop**: Graeme 3-agent self-improving

### Week 3 — Polish (production-ready)
12. **Framework packs**: Auto-detect Next.js/React/etc.
13. **Full skill library**: All 32 skills
14. **Permission cascade**: settings.json with 5-level cascade
15. **3 execution models**: fork/teammate/worktree dispatch
16. **Testing + documentation**

---

## How to Verify Your Build

### Test 1: Brainstorm Gate
```
User: "build a login system"
Expected: Bot asks clarifying questions → produces design doc → WAITS for approval → THEN produces plan
Bad: Bot starts coding immediately
```

### Test 2: No-Placeholder Plan
```
After brainstorm approval:
Expected: Plan has exact file paths, actual code blocks, exact test commands
Bad: Plan contains TBD, TODO, placeholder, "implement X"
```

### Test 3: TDD Enforcement
```
When builder starts implementing:
Expected: Test file created BEFORE src file change
Bad: src changes without test
```

### Test 4: QA Gate
```
After builder completes:
Expected: reviewer verdict (APPROVED/NEEDS_REVISION) AND test_engineer verdict (PASS/FAIL)
Bad: Completion without both verdicts
```

### Test 5: 3-Strike Debugging
```
Same bug fixed 3 times unsuccessfully:
Expected: Architecture review triggered → user must approve before continuing
Bad: Bot keeps trying same approach
```

### Test 6: 2nd-Brain Recall
```
After session resume:
Expected: hermes_recall surfaces relevant prior context from workspace
Bad: Bot has no memory of past sessions
```

---

## Directory Structure for Built Plugin

```
~/hermes-agent/                  # Plugin root (CREATE THIS)
├── package.json                  # @opencode-ai/plugin as peer dep
├── tsconfig.json
├── build.ts                     # Compiles src/ → dist/
├── src/
│   ├── index.ts                 # Plugin entry — export default = plugin fn
│   ├── config/
│   │   ├── schema.ts           # HermesAgentConfig Zod schema
│   │   ├── loader.ts           # Config loader (user + project)
│   │   └── constants.ts        # AGENT_NAMES, QA_AGENTS, TOOL_NAMES
│   ├── agents/
│   │   ├── index.ts            # createAgents() — all 14 agents
│   │   ├── hermes.ts           # Orchestrator prompt
│   │   ├── analyst.ts
│   │   ├── planner.ts
│   │   ├── tdd.ts
│   │   ├── builder.ts
│   │   ├── reviewer.ts
│   │   ├── quality-reviewer.ts
│   │   ├── grill.ts
│   │   ├── ripple.ts
│   │   ├── drift-verifier.ts
│   │   ├── explorer.ts
│   │   ├── architect.ts
│   │   ├── debugger.ts
│   │   └── supervisor.ts
│   ├── hooks/
│   │   ├── index.ts            # All 28 hooks composed
│   │   ├── brainstorm-gate.ts
│   │   ├── plan-validator.ts
│   │   ├── tdd-enforcer.ts
│   │   ├── strict-write-discipline.ts
│   │   ├── adversarial-check.ts
│   │   ├── anti-rationalization.ts
│   │   ├── knowledge-injector.ts
│   │   ├── system-enhancer.ts
│   │   ├── phase-monitor.ts
│   │   ├── compaction.ts
│   │   ├── guardrails.ts
│   │   ├── scope-guard.ts
│   │   ├── activity.ts
│   │   ├── delegation-ledger.ts
│   │   ├── self-review.ts
│   │   ├── drift-verifier.ts
│   │   ├── knowledge-curator.ts
│   │   ├── snapshot-writer.ts
│   │   ├── tool-summarizer.ts
│   │   ├── debugging-spiral.ts
│   │   ├── adversarial-detector.ts
│   │   ├── ripple-check.ts
│   │   ├── supervisor-ingest.ts
│   │   ├── complexity-routing.ts
│   │   ├── framework-pack.ts
│   │   └── intent-marker.ts
│   ├── tools/
│   │   ├── index.ts
│   │   ├── create-tool.ts
│   │   ├── checkpoint.ts
│   │   ├── phase-complete.ts
│   │   ├── save-plan.ts
│   │   ├── hermes-recall.ts
│   │   ├── hermes-remember.ts
│   │   ├── hermes-forget.ts
│   │   ├── hermes-context.ts
│   │   ├── grill.ts
│   │   ├── verify.ts
│   │   ├── health.ts
│   │   ├── agent-dispatch.ts
│   │   ├── agent-status.ts
│   │   ├── agent-cancel.ts
│   │   └── [40 Spider tools adapted]
│   └── services/
│       ├── supervisor.ts
│       ├── plan-sync.ts
│       ├── session-db.ts
│       └── automation.ts
└── dist/
    └── index.js                 # Compiled plugin (what OpenCode loads)
```

---

## Key Files to Read Before Each Sprint

| Sprint | Must Read |
|--------|-----------|
| Week 1 | `SOURCE_DECODED/SPIDER_AGENT_HOOKS.md`, `SOURCE_DECODED/PLUGIN_SDK_TYPES.md` |
| Week 2 | `REFERENCE/ARCHITECTURE.md` (Part 3: Agents, Part 4: Hooks), `HOOKS/DELEGATION_GATE.md` |
| Week 3 | `REFERENCE/ARCHITECTURE.md` (Part 6: Token Mgmt, Part 8: Permissions), `SKILLS/AUTOPILOT.md` |

---

## Anti-Rationalization Checklist

Every implementation MUST self-certify before claiming DONE:

```
[ ] I read the Spider Agent reference for this pattern
[ ] I copied the pattern verbatim before adapting
[ ] I tested with the Brainstorm Gate test
[ ] I tested with the No-Placeholder Plan test
[ ] I tested with the TDD Enforcement test
[ ] I verified the state machine advances correctly
[ ] I verified no subagent approves its own output
[ ] I showed actual command output, not descriptions
[ ] I documented blockers rather than ignoring them
```

---

## Where to Get Help

| Problem | Resource |
|---------|----------|
| Hook not firing | Check `SOURCE_DECODED/SPIDER_AGENT_HOOKS.md` for event name |
| Tool not registering | Check `SOURCE_DECODED/SPIDER_AGENT_STATE.md` for tool definition pattern |
| Agent not routing | Check `AGENTS/INDEX.md` for agent capabilities |
| Token budget confusion | Read `REFERENCE/ARCHITECTURE.md` Part 6 |
| Permission cascade wrong | Read `REFERENCE/PERMISSIONS.md` |
| Phase state machine stuck | Read `HOOKS/PHASE_MONITOR.md` |
| 2nd-brain not recalling | Check `TOOLS/KNOWLEDGE.md` |

---

## Build Team Rules

1. **Never edit `REFERENCE/` or `SOURCE_DECODED/`** — those are the ground truth
2. **Always copy Spider patterns verbatim first**, then adapt — never rewrite from scratch
3. **Every hook needs a test** — if you can't test it, don't build it
4. **State machine is the law** — if a phase doesn't advance, the build is broken
5. **No placeholder code** — if you don't know how to implement something, say so and flag it
6. **Document every deviation** from Spider Agent's implementation
7. **Commit message format**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
8. **PR required before merge** — no direct commits to main

---

**Start**: Read `BUILD/BUILD_START_HERE.md` for step-by-step implementation instructions.
