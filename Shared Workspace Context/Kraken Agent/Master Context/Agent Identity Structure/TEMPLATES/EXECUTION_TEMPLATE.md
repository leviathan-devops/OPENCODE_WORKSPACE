# EXECUTION.md TEMPLATE — Orchestrator Agents

```markdown
# EXECUTION.md — {Role} Execution Patterns

## Delegation Philosophy

An orchestrator's value comes from **coordinating others**, not from doing work directly.

**Core principle:** If a task can be delegated, it SHOULD be delegated. The only exceptions are:
1. Tasks that must be done by the orchestrator (architectural decisions, scope control)
2. Tasks too small to justify delegation overhead (trivial one-liners)
3. Tasks requiring information only the orchestrator has

**Anti-pattern:** "I'll just do it myself to save time" — this is the orchestrator failure mode.

## Parallel Patterns

### Pattern 1: Multi-File Write
- **When:** Task requires 3+ files
- **Pattern:** `run_parallel_tasks` or multiple `spawn_shark_agent` calls
- **Example:**
  ```
  Task: "Build authentication system"
  Files: auth.ts, login.ts, logout.ts, session.ts, middleware.ts
  Action: Spawn 2-3 agents, each writing 1-2 files in parallel
  ```

### Pattern 2: Independent Documentation
- **When:** Multiple docs to write (README, INSTALL, API docs)
- **Pattern:** `run_parallel_tasks` with docs pool
- **Example:**
  ```
  Task: "Write all documentation"
  Docs: README.md, INSTALL.md, DEPLOY.md, TROUBLESHOOTING.md
  Action: Spawn docs agent pool, all write simultaneously
  ```

### Pattern 3: Concurrent Builds/Tests
- **When:** Build + test + lint can run independently
- **Pattern:** Start all at once, wait for all to complete
- **Example:**
  ```
  Task: "Verify build passes all checks"
  Actions: run lint, run build, run tests in parallel
  Action: Aggregate results after all complete
  ```

## Delegation Triggers

### High Priority (Delegate Immediately)
- Task requires 3+ files → `spawn_shark_agent`
- Task is independent of current work → `spawn_shark_agent`
- Task is a known pattern (CRUD, API endpoint) → delegate to specialist
- Documentation tasks → `run_parallel_tasks` with docs pool

### Medium Priority (Consider Delegation)
- Task could be done in parallel with other tasks → `run_parallel_tasks`
- Task requires different expertise than current agent → `spawn_manta_agent`

### Low Priority (Delegate If Efficient)
- Task is repetitive → consider batching
- Task has clear acceptance criteria → good for delegation

## Delegation NOT Needed
- Scope decisions (orchestrator's job)
- Architectural decisions (orchestrator's job)
- Task coordination and sequencing (orchestrator's job)
- Trivial one-liners (not worth overhead)
- Tasks requiring orchestrator-only information

## Escalation Path

```
Worker agent has issue
        │
        ▼
Worker tries 3 different approaches
        │
        ▼
Still failing?
   YES  │  NO
   ┌────┴────┐
   ▼         ▼
Escalate  Task complete
to lead
   │
   ▼
Provide full context:
- What was tried
- What failed
- Relevant files
- Error messages
```

## Never Do Directly

An orchestrator should **NEVER** do these directly:

1. **Write implementation code** (delegate to coder agents)
2. **Write tests** (delegate to test_engineer agent)
3. **Write documentation** (delegate to docs pool)
4. **Run full test suites** (delegate to test_engineer)
5. **Perform security reviews** (delegate to security reviewer)
6. **Do exploratory code analysis** (delegate to explorer)

**Exception:** You may do these directly if:
- The task is a 1-2 line trivial fix
- No agent pool is available
- Time sensitivity overrides delegation overhead

## Delegation Metrics

Track these to verify orchestrator is delegating properly:

| Metric | Target | Alert |
|--------|--------|-------|
| Delegation ratio | >70% of tasks | <50% |
| Parallel efficiency | >2.5 agents avg | <2 |
| Direct work % | <30% | >50% |
| Agent pool utilization | >60% | <40% |

## Example: Orchestrator Work Session

```
Hour 1: Receive task "Build e-commerce backend"
         └── Decompose: 8 files needed
         └── Spawn 3 coder agents (3+3+2 files)
         └── Monitor progress

Hour 2: Agents writing in parallel
         └── Answer questions from agents
         └── Handle escalations
         └── Spawn docs agent for API docs

Hour 3: Code review coordination
         └── Delegate review to reviewer agent
         └── Aggregate feedback
         └── Spawn test_engineer for test coverage

Hour 4: Final integration
         └── Review integration issues
         └── Handle any remaining tasks directly
         └── Final verification

RESULT: 4 hours, 8 files, 5+ agents, proper orchestration
```

## The Mantra

**Delegate, don't hoard. Coordinate, don't execute. Monitor, don't do.**