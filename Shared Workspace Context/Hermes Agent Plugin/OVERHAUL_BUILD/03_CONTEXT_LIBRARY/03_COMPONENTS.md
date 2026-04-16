# Components — Parts and Jobs

## Component: Plugin Entry (`src/index.ts`)

- **Purpose:** Wire all components together, register agents/hooks/tools with OpenCode SDK
- **Inputs:** Agent definitions, hook definitions, tool definitions, SDK config
- **Outputs:** Plugin export (`export default { agent: {...}, hooks: {...}, tools: {...} }`)
- **Boundaries:** Starts at `bun build.ts`, ends at `dist/index.js`
- **Key constraints:**
  - `agent` must be OBJECT keyed by name, NOT ARRAY
  - `mode: "primary"` on hermes, `mode: "subagent"` on all others
  - Hooks composed via Spider Agent's `composeHandlers()` pattern

---

## Component: Agents (`src/agents/*.ts`)

### hermes.ts
- **Purpose:** Primary orchestrator, phase enforcement, delegation routing, 2nd-brain injection
- **Inputs:** User message, current phase, session context
- **Outputs:** Delegation commands, phase transitions, memory injection
- **Boundaries:** Only Hermes agent; other agents are subagents

### analyst.ts
- **Purpose:** Validate requirements are concrete enough for implementation
- **Inputs:** User-stated requirements
- **Outputs:** 2-3 approaches with trade-offs + recommendation, requirements → specs
- **Triggered by:** Phase 0 (brainstorm gate) delegation from hermes

### builder.ts
- **Purpose:** One task at a time implementation following TDD
- **Inputs:** Task spec from analyst, test fixture
- **Outputs:** Implementation code, test-first approach
- **Triggered by:** Phase 2 (build) delegation from hermes

### reviewer.ts
- **Purpose:** Security + performance + patterns review
- **Inputs:** Built code from builder
- **Outputs:** Approval/rejection with specific findings
- **Triggered by:** Phase 3 (review) delegation from hermes

### supervisor.ts
- **Purpose:** Graeme's 3-agent self-improving loop (monitor→supervisor→auditor)
- **Inputs:** Tool call logs, failure patterns, 4-marker intent markers
- **Outputs:** Improvements logged, escalations to architect
- **Triggered by:** Every tool call via supervisor-ingest hook

### tdd.ts
- **Purpose:** RED-GREEN-REFACTOR executor
- **Inputs:** Task description
- **Outputs:** Failing test (RED), minimal code (GREEN), refactored (REFACTOR)
- **Triggered by:** Build phase via delegation

### All Other Agents (12)
- **Pattern:** Receive task via delegation → return result to hermes
- **Common inputs:** Task description, context
- **Common outputs:** DONE / NEEDS_CONTEXT / BLOCKED status

---

## Component: Hooks (`src/hooks/*.ts`)

### brainstorm-gate.ts
- **Purpose:** HARD-GATE: No code until design approved
- **Inputs:** Message content, current phase
- **Outputs:** `[HARD-GATE BLOCKED]` appended to message, or passes through
- **Critical guard:** `.hermes/` directory existence check (fix from DEBUG log)
- **Fails if:** Phase is IDLE/ANALYZE and message has code block — without the guard

### plan-validator.ts
- **Purpose:** Reject plans with TBD/TODO/placeholder content
- **Inputs:** Plan message content
- **Outputs:** Error message with specific TBD location, or passes
- **Fails if:** Plan contains any TBD/TODO/stub without actual paths/code

### tdd-enforcer.ts
- **Purpose:** TDD iron law — test file must exist before src change
- **Inputs:** Tool name, tool args
- **Outputs:** Blocked tool error, or passes
- **Fails if:** `write` tool targets `src/` without corresponding `test/` file existing

### delegation-gate.ts
- **Purpose:** Coder blocked without reviewer approval
- **Inputs:** Tool name, agent identity
- **Outputs:** Blocked error, or passes
- **Fails if:** Agent is "coder" and no reviewer approval in delegation ledger

### phase-monitor.ts
- **Purpose:** Track phase transitions, enforce legal transitions
- **Inputs:** Tool output after phase_complete call
- **Outputs:** Updated `.hermes/phase.json`, error if illegal transition
- **Persistence:** Writes to disk on every transition

### knowledge-injector.ts
- **Purpose:** Inject 2nd-brain context every turn
- **Inputs:** Tool output from any tool call
- **Outputs:** Hermès context injected into next turn's system prompt
- **Storage reads from:** `~/.hermes/memory/`

### system-enhancer.ts
- **Purpose:** Inject HERMES.md every session start
- **Inputs:** Session start signal
- **Outputs:** HERMES.md content prepended to system prompt
- **Storage reads from:** `~/.hermes/HERMES.md`

### self-review.ts
- **Purpose:** Agent cannot approve own output
- **Inputs:** Tool output after any review/approval action
- **Outputs:** Self-review flag + error, or passes
- **Fails if:** Reviewer agent tries to approve its own work

### debugging-spiral.ts
- **Purpose:** 5 identical failed calls = spiral detected
- **Inputs:** Tool output, tool args, failure count
- **Outputs:** Spiral detected warning, or reset failure count
- **Fails if:** Same tool with same args fails 5 times consecutively

### All Other Hooks (20)
- **Pattern:** Intercept at hook event → transform/validate/block → pass through
- **Common failure modes:** Guard conditions silently skip, wrong order with other hooks

---

## Component: Tools (`src/tools/*.ts`)

### checkpoint.ts
- **Purpose:** Create git stash + session state savepoint
- **Inputs:** `message: string`
- **Outputs:** `{ checkpointId, path, status }`
- **Storage writes to:** `.hermes/checkpoints/`

### phase_complete.ts
- **Purpose:** Advance phase state machine
- **Inputs:** `phase: "analyze" | "plan" | "build" | "review" | "debug" | "complete"`
- **Outputs:** `{ previousPhase, currentPhase, persisted: boolean }`
- **Persistence:** Writes `.hermes/phase.json`
- **Validates:** Transition is legal per PHASE_TRANSITIONS map

### hermes_recall.ts
- **Purpose:** Retrieve memory from prior sessions
- **Inputs:** `query: string`, `limit?: number`
- **Outputs:** `{ memories: Array<{ key, content, session, relevance }> }`
- **Storage reads from:** `~/.hermes/memory/`

### hermes_remember.ts
- **Purpose:** Store learning to memory
- **Inputs:** `key: string`, `content: string`, `tags?: string[]`
- **Outputs:** `{ stored: boolean, key }`
- **Storage writes to:** `~/.hermes/memory/`

### lint.ts
- **Purpose:** Run ESLint with fallback for missing config
- **Inputs:** `path?: string`, `fix?: boolean`
- **Outputs:** `{ stdout, stderr, exitCode, fixed }`
- **Fix applied in v2.3.5:** Combined stdout+stderr for ESLint 10 compatibility

### grill.ts
- **Purpose:** Security vulnerability scan
- **Inputs:** `target: string` (file or directory)
- **Outputs:** `{ vulnerabilities: Array<{ file, line, pattern, severity }> }`
- **Fix applied:** Directory scan with recursive file iteration

### complexity_hotspots.ts
- **Purpose:** Detect algorithmic complexity (O(n²) patterns)
- **Inputs:** `path: string`, `minComplexity?: number`
- **Outputs:** `{ hotspots: Array<{ file, line, pattern, complexity }> }`
- **Fix applied:** 8 pattern-based detectors (nested loops, chained filters, double sort)

### symbols.ts
- **Purpose:** Extract function/class symbols from source
- **Inputs:** `path: string`
- **Outputs:** `{ symbols: Array<{ name, type, line, file }> }`
- **Fix applied:** Python def/class detection alongside JS/TS

### sast_scan.ts
- **Purpose:** Security vulnerability scan via ESLint plugin
- **Inputs:** `target: string`
- **Outputs:** `{ findings: Array<{ rule, message, line, severity }> }`
- **Fix needed:** Bundle eslint-plugin-security locally, use explicit path

### All Other Tools (19)
- **Pattern:** Tool definition with Zod schema + execute function
- **Common fix needed:** Path resolution with `context.directory ?? context.worktree ?? process.cwd()`

---

## Component: Services

### Session DB (`src/services/session-db.ts`)
- **Purpose:** Persistent session storage for list/load/fork operations
- **Storage:** `~/.hermes/sessions/` (JSON files per session)
- **Fix applied:** Worktree fallback for context.worktree undefined

### Phase Persistence (`src/config/constants.ts` + hooks)
- **Purpose:** Survive hot-reload via `.hermes/phase.json`
- **Files:** `.hermes/phase.json`
- **Key functions:** `loadPhaseFromDisk()`, `savePhaseToDisk()`

### Memory Store (`src/services/memory-store.ts`)
- **Purpose:** 2nd-brain memory read/write
- **Storage:** `~/.hermes/memory/` (keyed JSON files)
- **Operations:** hermes_recall (search), hermes_remember (write), hermes_context (inject)
