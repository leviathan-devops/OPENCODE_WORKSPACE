# INCIDENT LOG — Shark Agent v4.8.3 Firewall Build

## Date: 2026-04-12

---

## INCIDENT 001: Parallel Task Output Retrieval Failure

**Date:** 2026-04-11  
**Phase:** Build

### What Happened
1. Spawned 5 parallel tasks to implement L0-L8 firewall patterns
2. Tasks reported `success: true, status: "completed"`
3. Did NOT retrieve actual file outputs from the tasks
4. Assumed outputs were merged to host filesystem
5. **RESULT:** Patterns were trapped in container filesystems, host files unchanged

### Root Cause
- `spawn_shark_agent` runs tasks in isolated container environments
- Task file writes stay in those containers, NOT automatically copied to host
- Orchestrator must explicitly retrieve and merge outputs
- "completed" status means task finished its work, NOT that outputs reached host

### Lesson Learned
**Parallel task completion ≠ outputs on host filesystem.**

Orchestrator responsibilities:
1. Spawn tasks
2. Track task outputs
3. Retrieve outputs from containers
4. Merge into host filesystem
5. Verify merged result

### Correct Pattern (For Future)
```typescript
// Instead of:
spawn_shark_agent(task)
// Then forgetting about it

// Do:
const result = spawn_shark_agent(task)
if (result.success) {
  // READ the actual output
  const output = readFileFromTask(result.taskId)
  // MERGE into host
  mergeIntoHost(output)
}
```

---

## INCIDENT 002: Orchestrator Passive Observer Pattern

**Date:** 2026-04-11  
**Phase:** Build

### What Happened
- Spawned 5 tasks and treated them as fire-and-forget
- Did not actively monitor, retrieve, or merge results
- Waited passively for completion signals
- Never followed up on actual file contents

### Root Cause
- Didn't understand role as **System Brain** (active enforcer)
- Treated parallel execution as magic bullet
- Didn't read task outputs before considering job done

### Lesson Learned
**Orchestrator = Active enforcement, not passive observer.**

System Brain responsibilities:
1. Monitor all spawned tasks
2. Retrieve outputs actively
3. Ensure merge to host
4. Verify merged results
5. Escalate if tasks don't produce expected outputs

---

## INSIGHT 001: Context Library as Source of Truth

**Date:** 2026-04-11

### What Worked
- Built 14-file context library with complete pattern specifications
- Library contained ALL 170+ patterns with implementation code
- When parallel tasks failed to merge, used context library to rebuild manually

### Lesson
Context library should be:
1. Written BEFORE spawning parallel work
2. Used as authoritative spec
3. Preserved even if parallel work succeeds (backup)

---

## INSIGHT 002: Mechanical Enforcement > Text Matching

**Date:** 2026-04-11

### What We Learned
- Cross-agent tools should use `CROSS_AGENT_TOOLS.has(tool)` NOT regex on text
- buildTextToCheck should only use `JSON.stringify(toolArgs)` NOT agentMessage
- Evidence gating requires actual file existence, not pattern matching

### Why This Matters
- Text matching can be evaded by rephrasing
- Mechanical checks are deterministic
- Agent messages can cause false positives

---

## INSIGHT 003: /tmp Builds Are Always Safe

**Date:** 2026-04-11

### Critical Rule
```
ALLOWED: bun build --outdir /tmp/shark-build
BLOCKED: bun build --outdir ./dist (project directory)
```

### Rationale
- `/tmp` builds are isolated testing environments
- Project directory builds modify actual source
- Firewall should NOT block isolated testing

---

## What Was Built

### guardian-hook.ts: 572 lines
| Layer | Patterns | Count |
|-------|----------|-------|
| L0: Identity Wall | DANGEROUS_TOOLS set | 9 tools |
| L1: Theatrical | THEATRICAL_PATTERNS | 18 |
| L2: Fake Test | FAKE_TEST_PATTERNS | 13 |
| L3: Source Inspection | SOURCE_INSPECTION_PATTERNS | 12 |
| L4: Wrong Container | WRONG_CONTAINER_PATTERNS | 5 |
| L5.1: Host Fallback | HOST_FALLBACK_PATTERNS | 13 |
| L5.2: Success Claim | SUCCESS_CLAIM_PATTERNS | 16 |
| L5.3: Model Restriction | MODEL_RESTRICTION_PATTERNS | 15 |
| L5.4: Mock/Stub | MOCK_STUB_PATTERNS | 12 |
| L5.5: Simplification | SIMPLIFICATION_PATTERNS | 11 |
| L5.6: Confusion | CONFUSION_PRETENSE_PATTERNS | 12 |
| L5.7: Scope Creep | SCOPE_CREEP_PATTERNS + CROSS_AGENT_TOOLS | 10 + set |
| L5.8: Undermining | UNDERMINING_PATTERNS | 12 |
| L5.9: Impatience | IMPATIENCE_PATTERNS | 9 |
| L5.10: Self-Reference | SELF_REFERENCE_PATTERNS | 12 |

**Total: 170+ patterns**

---

## INCIDENT 003: terminal Tool Misrouting — OPENCODE CORE ISSUE

**Date:** 2026-04-12  
**Phase:** Testing

### What Happened
```bash
$ opencode run "terminal" --command "echo test"
Error: Command not found: "echo test". Available commands: init, review, Hermes
```

### ROOT CAUSE: opencode run Architecture

**`opencode run` sends MESSAGES to agents, NOT direct tool invocations.**

The CLI syntax suggests direct tool calling, but it's actually:
1. Sends message "terminal" to agent
2. Agent interprets the text
3. OpenCode checks if it's a registered command
4. "terminal" isn't a command → Error

### Proof (Even --pure fails)
```bash
opencode run "terminal" --command "echo test" --pure
→ Error: Command not found: "echo test". Available commands: init, review
```
(No plugins loaded, error still appears → OpenCode core)

### What Was Disabled
- spider-agent — Commented out
- hermes-agent — Commented out

### Resolution
Use container testing or interactive sessions instead of `opencode run` for tool testing.

### Related Files
- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/06-system-failures/TERMINAL_TOOL_MISROUTING.md`

---

## INSIGHT 002: Mechanical Enforcement > Text Matching

**Date:** 2026-04-12  
**Phase:** Testing

### What Happened
```bash
$ opencode run "terminal" --command "echo test"
Error: Command not found: "echo test". Available commands: init, review, Spider, Spider-status...
```

The `terminal` tool does NOT execute shell commands via `opencode run` — it maps to Spider command router.

### Root Cause
**`opencode run` is a message-sending interface, NOT a direct tool invoker.**

```
opencode run "terminal" --command "echo test"
→ Sends message "terminal" to agent
→ Agent interprets the message
→ Spider agent (loaded as orchestrator) intercepts "terminal" as its own command
→ Routes to Spider command router instead of calling terminal tool
→ Firewall never sees the actual terminal tool call
```

The `--command` flag becomes an argument to the agent, not a shell command.

### Impact
Cannot test L1-L5 firewall patterns via CLI because:
1. No direct terminal tool call happens
2. Message goes to agent, agent decides what to do
3. If agent calls Spider commands, firewall never fires
4. Guardian-hook only sees tools when they're actually called

### Resolution
Testing requires:
1. **Interactive session** - Type commands directly in opencode TUI
2. **Container testing** - Docker environment with correct terminal tool behavior
3. **Direct plugin testing** - Unit test the guardian hook directly

### Related Files
- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/06-system-failures/TERMINAL_TOOL_MISROUTING.md`

---

## What Still Needs Verification

### Container Test
- Haven't run actual container test with Docker
- L5.2/L5.4 require `ContainerTestResult.json` passRate >= 0.96
- Need to verify firewall actually blocks in container environment

### Cross-Agent Mechanical Check
- L5.7 uses `CROSS_AGENT_TOOLS.has(tool)` (mechanical set lookup)
- Need to verify `hermes_remember` etc. are actually blocked

### Integration Test
- Need to verify all layers work together
- Need to verify no false positives on legitimate commands

---

## Next Steps for Completion

1. **Container test** — Run docker container with plugin, verify L1-L5 blocking
2. **Merge verification** — Confirm patterns are in deployed plugin
3. **Evidence collection** — Create ContainerTestResult.json for ship gate
4. **Checkpoint** — Save working build state

---

## TESTING RESULTS: 2026-04-12

### Pattern Tests (direct-test.mjs)
All core patterns verified working:

| Layer | Pattern | Test | Result |
|-------|---------|------|--------|
| L1 | THEATRICAL_PATTERNS | `grep \| wc` | ✅ BLOCK |
| L1 | LEGITIMATE_PATTERNS | `mkdir -p` | ✅ ALLOW |
| L2 | FAKE_TEST_PATTERNS | `npm test`, `jest` | ✅ BLOCK |
| L4 | WRONG_CONTAINER_PATTERNS | `opencode container run` | ✅ BLOCK |
| L4 | (legit) | `docker run` | ✅ ALLOW |
| L5.1 | HOST_FALLBACK_PATTERNS | `skip container test` | ✅ BLOCK |
| L5.7 | CROSS_AGENT_TOOLS | `hermes_remember` | ✅ BLOCK |
| L5.7 | (legit) | `terminal` | ✅ ALLOW |
| L5.9 | IMPATIENCE_PATTERNS | `just ship it` | ✅ BLOCK |

**Total: 17 passed, 0 failed**

### Container Testing
- **BLOCKED**: Spider agent's "DEBUGGING SPIRAL DETECTED" fires on repeated docker commands
- Root cause: Spider spiral detection in container with mounted HOME
- Workaround: Need interactive container testing or unit tests

### Build Verification
- `bun build src/index.ts` succeeds
- 172 modules bundled
- 1MB output
