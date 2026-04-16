# SKILL STACKING PATTERNS — Reference Spec
## Source: Slate's "Agents with Language is All You Need" Article

**Source File:** `../../context/telegram/library/ARTICLES_ANALYZED.md`
**Date Documented:** 2026-04-02
**Purpose:** Reference copy of Slate's skill stacking patterns for Hermes v2.5 implementation

---

## 1. THREE EXECUTION PRIMITIVES

### 1.1 Thread (Background Task)

```
Definition: Async, non-blocking subagent call
Orchestrator: Does NOT wait — continues immediately
Context: Isolated per episode — clears on exit
UI: Normal orchestrator chat
Persistence: Episode output stored when done
Cancellation: Can be cancelled mid-execution
```

**Slate's Definition:**
- A Thread is an **episode** — a bounded context window that begins when a skill activates and ends when it completes
- Thread context does NOT persist after episode ends
- This is a key difference from continuous chat — episodes have **definite boundaries**
- Threads are good for: analysis, research, background work, parallel tasks

**When to use Thread:**
- Task is self-contained and doesn't need user interaction
- Task takes a while and user doesn't need to wait
- Multiple independent tasks that can run in parallel
- When you want to maintain orchestrator context (don't want Fork to take over UI)

### 1.2 Fork (Blocking Interactive)

```
Definition: Synchronous, blocking subagent call
Orchestrator: WAITS — blocked until Fork completes
Context: Takes over UI — continuous chat with user during Fork
UI: User interacts directly with Fork, not orchestrator
Persistence: Cannot be continued — returns compressed episode output
Cancellation: Cannot cancel — must complete or timeout
```

**Slate's Definition:**
- A Fork is a **continuous episode** — it takes over the chat interface
- User talks directly to the Fork, not the orchestrator
- Fork is not resumable — when it completes, it returns a compressed episode output
- This is fundamentally different from Thread — Fork is like handing the microphone to another agent

**Key constraint:** Only ONE Fork can be active at a time. If a new Fork is requested while one is active, the old Fork is auto-completed with partial output.

**When to use Fork:**
- Interactive tasks that need back-and-forth with user
- Planning sessions (user needs to approve, modify, iterate)
- Code review where user needs to see and respond to output
- Any task where user conversation is part of the skill execution

### 1.3 Teammate (Persistent Worker)

```
Definition: Long-running persistent process
Orchestrator: Communication via file-based mailbox
Context: Own persistent context window
UI: No direct interaction — logs to file
Persistence: Lives beyond episode boundaries
Cancellation: Explicit cancel — owns its own lifecycle
```

**Slate's Definition:**
- A Teammate is a **persistent worker** — it outlives the episode
- Used for long-running tasks: builds, test suites, background jobs
- Communicates with orchestrator via file-based messages
- Does NOT take over chat UI

**When to use Teammate:**
- Long builds or test runs
- Background workers that need to persist
- Tasks that might outlive a single session

---

## 2. EPISODE OUTPUT CHAINING

### 2.1 What is Episode Output?

When a skill completes (or times out), it returns an **episode output**:

```typescript
interface EpisodeOutput {
  summary: string;           // Max ~2KB compressed summary
  artifacts: string[];       // Files created, resources allocated
  decisions: Decision[];     // Key decisions made during episode
  blockers: Blocker[];        // Issues that weren't resolved
  nextAction?: string;       // Recommended next step
}
```

### 2.2 How Output Chaining Works

In an orchestration chain, each step's output is captured and fed into the next step:

```
/implement (orchestration)
  |
  +-- FORK /plan
  |     Input: "{user_request}"
  |     Output: { summary: "Plan for auth system", artifacts: ["plan.md"], ... }
  |       |
  |       v
  |
  +-- THREAD @builder
  |     Input: "{previous.summary}"
  |     Output: { summary: "Auth implemented", artifacts: ["auth.ts", "login.ts"], ... }
  |       |
  |       v
  |
  +-- FORK /review
        Input: "{previous.summary}\n\nArtifacts:\n{previous.artifacts}"
        Output: { summary: "Code looks good", ... }
```

The key is the **inputTemplate** in each orchestration step — it defines how the previous output is formatted into the next step's input.

### 2.3 Compression on Exit

Episode outputs are **compressed** when the episode ends:
- Full context window (~100K tokens) → compressed summary (~2KB)
- Only summary, artifacts, decisions, blockers are preserved
- This prevents context pollution in the orchestrator

The orchestrator only sees the compressed output, not the full episode context.

---

## 3. SKILL LIFECYCLE

### 3.1 Skill States

```
UNINITIALIZED
    |
    v
INITIALIZED (loaded from disk)
    |
    v
READY (registered, can be invoked)
    |
    +---> ACTIVE (currently executing)
    |       |
    |       +---> WAITING_INPUT (Fork waiting for user)
    |       |
    |       +---> COMPLETING (episode ending)
    |       |
    |       v
    |     COMPLETED (output stored)
    |
    +---> TIMEOUT (episode exceeded time limit)
    |
    +---> ERROR (episode threw exception)
    |
    v
DORMANT (not recently used, kept in memory)
```

### 3.2 Skill Activation Triggers

A skill can be activated by:

1. **Explicit invocation:** User types `/skillname` or `use skillname`
2. **Pattern match:** User message matches `triggerPatterns` regex
3. **Orchestration chain:** Previous skill in chain invokes next skill
4. **API call:** `orchestration_invoke` tool called with skill name

### 3.3 Episode Boundaries

An **episode** is the execution context for a skill activation:

- Episode starts when skill activates
- Episode ends when skill completes (or times out)
- Episode context clears on exit (for Threads)
- Episode output is compressed and stored
- For Forks: episode ends when Fork completes, context does NOT return to orchestrator (only compressed output)

---

## 4. CONDITIONAL ACTIVATION

### 4.1 Step Conditions

In an orchestration chain, steps can have conditions:

```yaml
chain:
  - skill: debugger
    mode: thread
    captureOutput: true
  - skill: architect-review
    mode: fork
    condition: "{previous.failure_count} >= 3"
    inputTemplate: "Bug failed {previous.failure_count} times"
    captureOutput: true
```

The condition is a JavaScript expression evaluated against the previous output context.

### 4.2 Condition Examples

```yaml
# Skip security scan if no new code
condition: "{builder.artifacts.length} > 0"

# Only run performance review for large features
condition: "{plan.complexity} == 'high'"

# Escalate to architect after 3 failures
condition: "{debugger.failure_count} >= 3"

# Run additional tests if coverage < 80%
condition: "{verify.coverage} < 80"
```

### 4.3 Early Termination

An orchestration chain can stop early:
- If a `verify` step fails (blockers found), the chain stops
- If a condition never becomes true (SKIP pattern), the step is skipped
- If user cancels (Fork only), partial output is returned

---

## 5. FORK-SPECIFIC BEHAVIORS

### 5.1 Fork Lifecycle

```
Orchestrator invokes skill as Fork
    |
    v
Fork takes over UI (user sees Fork output)
    |
    v
User interacts with Fork (messages go to Fork)
    |
    +---> User approves/done
    |       |
    |       v
    |     Fork completes
    |       |
    |       v
    |     Compressed output returned to orchestrator
    |
    +---> User requests cancel
    |       |
    |       v
    |     Fork returns partial output
    |
    +---> Timeout (default 5 min)
            |
            v
          Fork returns partial output
```

### 5.2 Auto-Complete on Stale Fork

If a new Fork is requested while one is active:
- Old Fork is auto-completed with partial output
- A blocker is added: `reason: "auto_complete"`
- New Fork starts immediately

This prevents deadlocks where the orchestrator is waiting for a Fork that will never complete.

### 5.3 Fork vs Thread Decision

Use **Fork** when:
- User needs to participate in the skill execution
- Interactive conversation is required
- User approval is needed before proceeding
- Plan, review, brainstorming, debugging discussions

Use **Thread** when:
- Task can complete without user interaction
- Background work that doesn't need monitoring
- Parallel independent tasks
- Verification and testing that just needs to run

---

## 6. ORCHESTRATION SKILL EXAMPLE

### 6.1 `/implement` Full Walkthrough

**User says:** "implement user authentication"

**Step 1:** Orchestrator recognizes as orchestration skill invocation
**Step 2:** Orchestration engine loads `/implement` skill
**Step 3:** Chain begins

**FORK /plan (Step 1)**
- Orchestrator BLOCKS
- Fork takes over UI
- User collaborates: "add password reset", "use JWT", "support OAuth"
- User says "looks good, approve"
- Fork completes with plan document
- Compressed output: `{ summary: "Auth plan approved", artifacts: ["plan.md"] }`

**THREAD @builder (Step 2)**
- Orchestrator continues (non-blocking)
- Builder starts implementing
- User can ask "how's it going?" and orchestrator responds
- Builder completes, output: `{ summary: "Auth implemented", artifacts: ["auth.ts", "jwt.ts"] }`

**FORK /review (Step 3)**
- Orchestrator BLOCKS
- Fork takes over UI
- User reviews code
- User says "needs tests for password reset"
- User says "approve"
- Fork completes

**FORK /grill (Step 4)**
- Orchestrator BLOCKS
- Fork takes over UI
- User attacks: "what if token is expired?", "SQL injection in login?"
- User says "no major issues"
- Fork completes

**THREAD /verify (Step 5)**
- Orchestrator continues (non-blocking)
- Verification runs
- Output: `{ summary: "All tests pass, build clean", blockers: [] }`

**Final:** Orchestration engine combines all outputs using outputTemplate

### 6.2 Partial Failure Handling

If `/review` finds critical issues:
- User can say "fail" or "reject"
- Fork completes with blocker
- Orchestration sees blocker in output
- Chain can either: stop, or loop back to builder

```yaml
chain:
  - skill: review
    mode: fork
    captureOutput: true
  - skill: builder
    mode: thread
    condition: "{review.output.blockers.length} > 0"
    inputTemplate: "Fix these issues:\n{review.blockers}"
    captureOutput: true
```

---

## 7. CONTEXT ISOLATION

### 7.1 Thread Context

Thread episodes have **isolated context**:
- Episode starts with clean context
- Episode uses context during execution
- Episode ends → context compressed → only output stored
- Orchestrator does NOT inherit episode's full context

This prevents context pollution from long-running or complex skills.

### 7.2 Fork Context

Fork episodes also have isolated context, but:
- User interacts during Fork, adding to Fork's context
- On completion, only compressed output returns to orchestrator
- Orchestrator never sees the full Fork context (just the compressed output)

### 7.3 Shared Context (rare)

Some skills might need `contextScope: "shared"`:
- Skill output is NOT compressed
- Full context is returned to orchestrator
- Risk of context pollution — use sparingly

---

## 8. SKILL DEFINITION SCHEMA

```yaml
---
name: string                    # Required: unique skill identifier
type: action | interactive | orchestration  # Required
description: string            # Required: human-readable description
executionMode: thread | fork | teammate  # How skill runs
triggerPatterns:               # Optional: regex patterns that auto-activate
  - string
chain:                         # Required for orchestration type
  - skill: string              # Skill name to invoke
    mode: thread | fork       # Execution mode for this step
    inputTemplate: string      # How to format previous output
    condition: string          # Optional: JS condition
    captureOutput: boolean     # Store output for chaining?
    timeout: number            # Optional: override default timeout
episodeTimeout: number         # Default: 300000 (5 min)
contextScope: isolated | shared  # Does it pollute orchestrator?
outputTemplate: string        # For orchestration: combine outputs
---
# Skill body (markdown instructions)
[Full instructions for how this skill executes...]
```

---

## 9. ERROR HANDLING

### 9.1 Episode Errors

If a skill throws during execution:
- Episode status = "error"
- Partial output stored with error information
- Orchestration chain can check `blockers` for errors
- Optionally retry (if skill supports retry)

### 9.2 Timeout Handling

If episode exceeds `episodeTimeout`:
- Episode status = "timeout"
- Partial output stored
- Fork: returns partial to orchestrator
- Thread: can be retried or skipped
- User notified of timeout

### 9.3 Retry Logic

```yaml
# Example: retry debug up to 3 times
chain:
  - skill: debugger
    mode: thread
    captureOutput: true
  - skill: debugger
    mode: thread
    condition: "{previous.status} == 'error'"
    inputTemplate: "Retry: {previous.error}"
    captureOutput: true
```

---

## 10. IMPLEMENTATION NOTES FOR HERMES

### 10.1 Fork Blocking Implementation

The key challenge: How does the orchestrator **block** while waiting for Fork?

**Approach 1:** Promise-based polling
```typescript
const fork = forkManager.startFork(skill, input);
return new Promise((resolve) => {
  const poll = setInterval(() => {
    if (!forkManager.isActive()) {
      clearInterval(poll);
      resolve(forkManager.getOutput(fork.id));
    }
  }, 500);
});
```

**Approach 2:** Async iteration (if supported)
```typescript
while (forkManager.isActive()) {
  await sleep(500);
}
return forkManager.getOutput(forkId);
```

Both require the orchestrator to yield — the runtime must support blocking in execute functions.

### 10.2 UI Takeover for Fork

When Fork is active, messages should route to Fork, not orchestrator:
- All user messages during Fork go to Fork's conversation
- Orchestrator is frozen (no tool calls except fork_feedback)
- Only fork_complete or timeout releases the Fork

### 10.3 Episode Store Persistence

Episode history should persist across sessions:
- Store episodes to disk (`~/.hermes/episodes/`)
- Load on startup
- Prune old episodes based on `maxHistory`

### 10.4 Thread Cleanup

Threads that are still running when session compacts:
- Record as active episode
- Can be resumed in next session (if Teammate mode)
- Or cancelled with partial output

---

*End of SKILL_STACKING_SPEC.md*
*This document is a reference copy of patterns from Slate's article, adapted for Hermes v2.5 implementation.*
