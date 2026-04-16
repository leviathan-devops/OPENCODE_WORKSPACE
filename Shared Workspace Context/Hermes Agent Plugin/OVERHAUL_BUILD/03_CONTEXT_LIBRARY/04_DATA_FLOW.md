# Data Flow — How Data Moves

## Entry Points

### 1. User Message Entry
```
User types message in OpenCode
    ↓
OpenCode routes to active agent (hermes)
    ↓
Hermes orchestrator receives message
    ↓
Hook chain fires (brainstorm-gate → plan-validator → ... → knowledge-injector)
    ↓
Hermes processes message, decides to delegate or respond
    ↓
Delegation (if subagent needed) OR Direct response (if user-facing)
```

### 2. Tool Call Entry
```
Agent calls tool (checkpoint, phase_complete, hermes_recall, etc.)
    ↓
tool.execute.before hooks fire (tdd-enforcer, delegation-gate, guardrails, scope-guard)
    ↓
Tool execute function runs
    ↓
tool.execute.after hooks fire (phase-monitor, self-review, debugging-spiral, knowledge-injector, etc.)
    ↓
Result returned to agent
```

### 3. /Hermes CLI Command Entry
```
User types /Hermes [command]
    ↓
hermes-command hook intercepts at command.execute.before
    ↓
Parses command, routes to appropriate handler
    ↓
Handler executes tool or state query
    ↓
Formatted output returned to user
```

---

## Processing Pipeline

### Phase 0: Brainstorm Gate Flow
```
hermes receives: "build a login system"
    ↓
brainstorm-gate hook fires (messages.transform)
    ↓
Check: .hermes/ directory exists? → NO: skip hook entirely
    ↓
Check: phase === IDLE or ANALYZE?
    ↓
Check: message has code block/tool calls?
    ↓
YES to all: append [HARD-GATE BLOCKED]
    ↓
hermes receives blocked message, responds with questions
    ↓
User provides more details → hermes delegates to analyst
    ↓
analyst returns specs → brainstorm gate passes
    ↓
phase_complete("analyze") called → phase advances to PLAN
```

### Phase 1-2: Plan → Build Flow
```
plan-validator hook fires (messages.transform)
    ↓
Check: plan contains TBD/TODO/placeholder?
    ↓
YES: reject with specific error showing TBD location
    ↓
NO: plan passes
    ↓
tdd-enforcer hook fires on every tool call during build
    ↓
Check: write to src/ without existing test/ file?
    ↓
YES: block with TDD enforcement error
    ↓
NO: tool executes
    ↓
Phase advances to BUILD
```

### Phase 3-6: Review → Debug → Complete Flow
```
reviewer agent receives delegation
    ↓
self-review hook detects self-approval attempt → blocks
    ↓
reviewer returns findings
    ↓
delegation-gate checks: reviewer approved without coder input? → blocks
    ↓
If debug needed: phase_complete("debug") → debugging-spiral tracks failures
    ↓
If complete: phase_complete("complete") → phase state terminal
```

---

## 2nd-Brain Memory Flow

```
hermes_remember called
    ↓
Writes key+content+tags to ~/.hermes/memory/[hash].json
    ↓

hermes_recall called with query
    ↓
Searches ~/.hermes/memory/*.json for matching content
    ↓
Returns ranked results with relevance scores
    ↓

hermes_context called with topic
    ↓
Searches memory for topic
    ↓
Injects into next turn's system prompt via knowledge-injector hook
    ↓

Every tool call after:
    ↓
knowledge-injector fires (tool.execute.after)
    ↓
Reads from ~/.hermes/memory/
    ↓
Injects into next turn's context window
```

---

## Session Persistence Flow

```
Session starts (user launches OpenCode)
    ↓
snapshot-writer hook fires (tool.execute.after)
    ↓
Writes session state to ~/.hermes/sessions/[sessionID].json
    ↓

list_sessions called
    ↓
Reads ~/.hermes/sessions/*.json
    ↓
Returns session list sorted by last modified
    ↓

load_session called
    ↓
Reads ~/.hermes/sessions/[sessionID].json
    ↓
Restores context, phase, memory
    ↓

Fork session called
    ↓
Reads session state
    ↓
Clones to new session ID
    ↓
Returns forked session
```

---

## Delegation Chain Flow

```
hermes receives task
    ↓
Decides: needs analyst → delegates to analyst
    ↓
hermes calls delegate_task({ agent: "analyst", goal: task })
    ↓
Subagent runs in background (async)
    ↓
Result returned to hermes
    ↓
hermes processes result
    ↓
Decides: needs builder → delegates to builder
    ↓
... chain continues
    ↓
hermes aggregates results, presents to user
```

---

## Error Handling Flow

```
Tool call fails
    ↓
debugging-spiral detects failure pattern
    ↓
5 identical failures → spiral detected flag
    ↓
supervisor notified via supervisor-ingest hook
    ↓
supervisor logs issue
    ↓
If fixable: supervisor-ingest returns fix suggestion
    ↓
If not: escalate to architect agent
    ↓
Architect reviews → decision returned to hermes
```
