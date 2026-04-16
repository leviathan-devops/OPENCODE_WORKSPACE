# CONTEXT SYNTHESIS MODE - RECOVERY MODE DESIGN

**Part of:** [Trident Brain](../00_INDEX.md)
**Type:** Stream of Consciousness Recovery System
**Version:** 2.0.0 (Recovery Mode Extension)
**Date:** 2026-04-15

---

## Executive Summary

Context Synthesis Mode currently operates in **Injection Mode** - a proactive, forward-looking context synthesis system. This design adds **Recovery Mode** - a stream-of-consciousness recovery system that reconstructs the agent's cognitive state at the moment of interruption.

**What Recovery Mode Is:**
- A "mental checkpoint recovery" tool
- Reconstructs what the agent was **thinking and doing** before interruption
- Answers: "Where was I? What was I working on? What was about to happen?"
- The output is a **cognitive snapshot** - a "I was at X, working on Y, about to do Z" narrative

**What Recovery Mode Is NOT:**
- NOT a behavioral audit (that's Code Review Mode's job)
- NOT a derailment detector (that's a separate concern)
- NOT forensic evidence collection for blame/audit
- NOT corruption detection per se (though interruption creates incomplete data)

**Key Insight:** When a session compacts or crashes, the agent loses its "stream of consciousness" - the in-flight reasoning, loaded context, and mental position. Recovery Mode reconstructs this so the agent can pick up exactly where they left off, not start from scratch.

---

## PART 1: WHY RECOVERY MODE IS NEEDED

### The Compaction Problem

When OpenCode compacts a session (typically at 85% token threshold):

```
Before Compaction:
[08:00] Thinking about how to implement the auth system
[08:01] Reading the existing user model to understand structure
[08:02] "I see the user model has these fields..."
[08:03] Now I need to add password hash field
[08:04] About to modify user.ts when → COMPACTION TRIGGERS

After Compaction:
[Empty] Agent has no idea what they were doing
[Empty] Must re-read files to figure out context
[Empty] Lost 4 minutes of productive thinking
```

The compaction dumps the in-flight reasoning. The agent wakes up with no memory of the last 4 minutes.

### Session Crash Problem

When a session crashes mid-task:

```
Last message: "Now I'll add the password field to the model"
Next action: Should be "write to user.ts"
Crash occurs

After restart:
Agent sees:
- user.ts unchanged (action never happened)
- No memory of what they were about to do
- Must re-parse their own last message to figure it out
```

### The Stream-of-Consciousness Gap

What the agent loses:

| Lost Element | What It Was | Why It Matters |
|--------------|-------------|----------------|
| **In-flight reasoning** | "I was analyzing the auth flow" | Can't continue thought chain |
| **Loaded context** | Files read, decisions made | Must re-read and re-decide |
| **Mental position** | "About to write to X" | Must re-establish intent |
| **Decision state** | "I decided to use bcrypt" | Must re-make decisions |
| **Emotional markers** | Frustration/confidence signals | Can't calibrate approach |

---

## PART 2: WHAT RECOVERY MODE RECONSTRUCTS

### The Cognitive Snapshot

Recovery Mode produces a **CognitiveSnapshot** that answers:

```
RECOVERY OUTPUT - COGNITIVE SNAPSHOT
=====================================
Timestamp: 08:04:32 (2 seconds before compaction)
Position: Mid-sentence, about to take action
-----------------------------------------
WHAT I WAS THINKING:
- Analyzing the password hash implementation
- Realized bcrypt is already imported in auth.ts
- Need to add hashPassword() call to user model

WHAT I WAS DOING:
- Reading user.ts (had it open in context)
- Reviewing the createUser function
- About to modify the password field handling

WHAT HAPPENED NEXT:
- Was about to execute write to user.ts
- Had the exact line numbers ready
- Had the exact code to insert prepared

WHAT WAS LOADED IN MIND:
- user.ts: lines 45-67
- auth.ts: lines 12-15 (bcrypt import)
- The decision that password should be hashed before storage

WHAT WAS LEFT INCOMPLETE:
- password field modification to user.ts
- Adding hashPassword() call in createUser
- Writing tests for the new field

CONFIDENCE: 0.85 (5 seconds of recent context recovered)
```

### Stream Reconstruction vs Forensics

| Aspect | Stream Reconstruction | Forensic Analysis |
|--------|----------------------|-------------------|
| **Goal** | "What was the agent thinking?" | "What went wrong?" |
| **Output** | Cognitive snapshot | Damage report |
| **Focus** | Forward continuity | Backward accountability |
| **User** | Agent resuming work | Debugger/reviewer |
| **Timeframe** | Last 5-30 seconds before | Entire session history |

---

## PART 3: RECOVERY MODE ARCHITECTURE

### Core Concept: Thought Stream Recovery

The fundamental insight is that an LLM agent's "stream of consciousness" can be partially recovered from:

1. **Tool call patterns** - What was being done (reads before writes, edits before tests)
2. **Temporal proximity** - Recent context is most recoverable
3. **Incomplete actions** - What the last message was about to do
4. **State commitments** - Decisions made that imply next steps

### Two Sub-Modes (Revised)

```
CONTEXT SYNTHESIS MODE
├── SUB-MODE 1: INJECTION MODE (Current)
│   └── Purpose: Forward-looking context synthesis
│   └── Trigger: Manual, gate transition, error
│   └── Input: Fresh sources (T1-T4)
│   └── Output: T0-ready injection
│
└── SUB-MODE 2: RECOVERY MODE (NEW)
    └── Purpose: Backward-looking stream recovery
    └── Trigger: Compaction, crash, manual recovery request
    └── Input: Pre-compaction artifacts, session fragments
    └── Output: Cognitive snapshot + stream narrative
```

### Recovery Flow

```
RECOVERY MODE EXECUTION
│
├── PHASE 1: LOCATE INTERRUPTION POINT
│   ├── Find the gap/disruption in session
│   ├── Identify timestamp of last known state
│   ├── Detect what was in-flight (uncompleted actions)
│   └── Assess recovery feasibility
│
├── PHASE 2: RECOVER THOUGHT STREAM
│   ├── Parse recent tool call sequence
│   ├── Reconstruct "about to happen" from last message
│   ├── Infer mental context from tool patterns
│   └── Build temporal chain of reasoning
│
├── PHASE 3: GENERATE COGNITIVE SNAPSHOT
│   ├── What was being thought (reasoning chain)
│   ├── What was being done (action chain)
│   ├── What was about to happen (intent chain)
│   ├── What was loaded in context (working memory)
│   └── What was left incomplete (gaps)
│
├── PHASE 4: VERIFY RECOVERABILITY
│   ├── Can we verify this against artifacts?
│   ├── Cross-reference with filesystem state
│   ├── Flag uncertain inferences
│   └── Calculate confidence score
│
└── OUTPUT: CognitiveSnapshot
    ├── streamNarrative: string
    ├── lastKnownPosition: Position
    ├── inFlightActions: IncompleteAction[]
    ├── recoveredContext: WorkingMemory
    ├── confidenceScore: number
    └── verificationNotes: string[]
```

---

## PART 4: RECOVERY PHASES (DETAILED)

### PHASE 1: Locate Interruption Point

```typescript
interface InterruptionPoint {
  timestamp: number;
  type: 'COMPACTION' | 'CRASH' | 'MANUAL' | 'UNKNOWN';
  lastMessageId: string;
  lastToolCall: ToolCall | null;
  incompleteAction: IncompleteAction | null;
  gapDuration: number;          // Seconds between last state and now
  recoveryFeasibility: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

function locateInterruption(
  preCompaction: SessionArtifact,
  postCompaction: SessionArtifact
): InterruptionPoint {
  // Find the gap
  const gapStart = preCompaction.messages.slice(-1)[0]?.timestamp;
  const gapEnd = postCompaction.messages[0]?.timestamp;

  // What was the last thing happening?
  const lastMessage = preCompaction.messages.slice(-1)[0];
  const lastToolCall = findLastToolCall(preCompaction);

  // Was it about to do something?
  const incompleteAction = detectIncompleteAction(lastMessage);

  return {
    timestamp: gapStart,
    type: detectInterruptionType(preCompaction, postCompaction),
    lastMessageId: lastMessage.id,
    lastToolCall,
    incompleteAction,
    gapDuration: gapEnd - gapStart,
    recoveryFeasibility: assessFeasibility(lastMessage, incompleteAction)
  };
}
```

**Detection Heuristics:**

| Signal | What It Means | Interruption Type |
|--------|---------------|-------------------|
| `session.compacted.md` exists | Scheduled compaction | COMPACTION |
| `session-*.md` truncated | Crash mid-write | CRASH |
| Gap in `messages[]` timestamps | Something interrupted | UNKNOWN |
| Last message ends mid-sentence | About to act | COMPACTION |
| Last message = tool result | Action was executing | CRASH |
| No session artifacts | Full session lost | NONE |

---

### PHASE 2: Recover Thought Stream

The key insight is that an LLM agent's thought stream can be partially reconstructed from **tool call ordering patterns**.

```typescript
interface ThoughtStream {
  reasoningChain: ReasoningFragment[];  // "I was thinking X"
  actionChain: ActionFragment[];        // "I was doing Y"
  intentChain: IntentFragment[];         // "I was about to Z"
  workingMemory: WorkingMemory;           // "Files/data loaded"
}

function recoverThoughtStream(
  session: SessionArtifact,
  interruption: InterruptionPoint
): ThoughtStream {
  // 1. Reconstruct from tool call patterns
  const toolSequence = session.toolCalls.slice(-10); // Last 10 calls

  // Tool patterns that reveal thought state:
  // - read(x) → read(y) → write(x) = "Was analyzing before modifying"
  // - read(x) → grep(x) → edit(x) = "Was searching before editing"
  // - test → test → test = "Was debugging"
  // - read → read → read → write = "Was researching before implementing"

  const reasoningChain = inferReasoningFromToolPattern(toolSequence);
  const actionChain = reconstructActionChain(toolSequence);
  const intentChain = inferNextAction(interruption.lastMessage);

  // 2. Recover working memory (what was loaded)
  const workingMemory = recoverWorkingMemory(session, toolSequence);

  return {
    reasoningChain,
    actionChain,
    intentChain,
    workingMemory
  };
}
```

**Tool Pattern Recognition:**

| Pattern | Indicates | Recoverable Thought |
|---------|-----------|---------------------|
| `read(A)` → `read(B)` → `write(A)` | Researching before modifying | "I was understanding A and B before changing A" |
| `read(A)` → `grep(A)` → `edit(A)` | Searching before editing | "I was finding the right spot in A" |
| `read(A)` → `write(A)` | Just read it, about to change | "I had A loaded and was about to modify it" |
| `read(A)` → `read(A)` (re-read) | Didn't understand, re-reading | "I was confused about A" |
| `test` → `test` → `test` | Debugging loop | "I was debugging something" |
| `read(A)` → `test` → `read(A)` | Triage testing | "I ran a test on A to understand it" |
| `write(A)` → `write(B)` | Sequential writes | "I was writing to multiple files" |
| NO writes after reads | Research only | "I was still in analysis phase" |

**Intent Inference from Last Message:**

```typescript
function inferIntentFromLastMessage(
  lastMessage: Message
): IntentFragment[] {
  const fragments: IntentFragment[] = [];

  // Parse incomplete sentences
  const text = lastMessage.content;
  const lastLine = text.split('\n').slice(-1)[0];

  // Detect "about to" patterns
  if (/^About to /i.test(lastLine)) {
    fragments.push({
      type: 'IMMINENT_ACTION',
      content: extractAction(lastLine),    // "write to user.ts"
      confidence: 0.9
    });
  }

  // Detect "Now I'll" patterns
  if (/^Now I('ll| will) /i.test(lastLine)) {
    fragments.push({
      type: 'PLANNED_ACTION',
      content: extractAction(lastLine),      // "add password field"
      confidence: 0.85
    });
  }

  // Detect "I need to" patterns
  if (/I need to /i.test(lastLine)) {
    fragments.push({
      type: 'RECOGNIZED_REQUIREMENT',
      content: extractRequirement(lastLine), // "add validation"
      confidence: 0.7
    });
  }

  // Detect "I'm going to" patterns
  if (/I('m| am going to) /i.test(lastLine)) {
    fragments.push({
      type: 'INTENDED_ACTION',
      content: extractAction(lastLine),       // "run the tests"
      confidence: 0.8
    });
  }

  // Detect trailing code (was typing when interrupted)
  if (/```\w*$/.test(text)) {
    fragments.push({
      type: 'INCOMPLETE_CODE',
      content: extractTrailingCode(text),     // The half-written code
      confidence: 0.95
    });
  }

  return fragments;
}
```

---

### PHASE 3: Generate Cognitive Snapshot

```typescript
interface CognitiveSnapshot {
  // When
  recoveredAt: number;
  interruptionTimestamp: number;
  gapDuration: number;

  // Where (position)
  lastKnownPosition: {
    gate: string;
    taskId: string;
    fileBeingEdited: string | null;
    lineNumber: number | null;
  };

  // What was happening
  streamNarrative: string;           // "I was analyzing X, about to do Y"
  reasoningChain: string[];         // ["Reading A to understand B", ...]
  actionChain: string[];            // ["read user.ts", "read auth.ts", ...]

  // What was about to happen
  pendingActions: PendingAction[];  // "Write to user.ts line 47"
  pendingDecisions: string[];       // "Whether to use bcrypt or scrypt"

  // What was loaded
  workingMemory: {
    filesOpen: string[];            // Files that were read recently
    dataLoaded: string[];           // Data structures that were loaded
    conceptsActive: string[];       // Concepts being considered
  };

  // What was incomplete
  incompleteCode: string | null;     // Half-written code, if any
  incompleteThought: string | null;  // Half-finished sentence

  // Confidence
  confidenceScore: number;           // 0.0 - 1.0
  uncertainElements: string[];       // What we guessed at
  verifiedElements: string[];        // What we confirmed against artifacts
}

interface PendingAction {
  action: string;                    // "write", "edit", "test", etc.
  target: string;                   // "user.ts"
  details: string;                  // "line 47, add password_hash field"
  code?: string;                    // Exact code if available
  confidence: number;
}

function generateCognitiveSnapshot(
  session: SessionArtifact,
  interruption: InterruptionPoint,
  stream: ThoughtStream
): CognitiveSnapshot {
  // Build the narrative
  const narrative = buildStreamNarrative(stream, interruption);

  // Identify pending actions
  const pending = inferPendingActions(
    interruption.lastMessage,
    stream.actionChain
  );

  // Recover working memory
  const memory = recoverWorkingMemory(session, stream);

  return {
    recoveredAt: Date.now(),
    interruptionTimestamp: interruption.timestamp,
    gapDuration: interruption.gapDuration,
    lastKnownPosition: extractPosition(session, stream),
    streamNarrative: narrative,
    reasoningChain: stream.reasoningChain.map(r => r.content),
    actionChain: stream.actionChain.map(a => a.description),
    pendingActions: pending,
    pendingDecisions: stream.intentChain
      .filter(i => i.type === 'RECOGNIZED_REQUIREMENT')
      .map(i => i.content),
    workingMemory: memory,
    incompleteCode: extractIncompleteCode(interruption.lastMessage),
    incompleteThought: extractIncompleteThought(interruption.lastMessage),
    confidenceScore: calculateConfidence(stream, interruption),
    uncertainElements: stream.reasoningChain
      .filter(r => r.confidence < 0.7)
      .map(r => r.content),
    verifiedElements: stream.reasoningChain
      .filter(r => r.confidence >= 0.9)
      .map(r => r.content)
  };
}
```

---

### PHASE 4: Verify Recoverability

```typescript
interface VerificationResult {
  canVerify: boolean;
  verifiedClaims: VerifiedClaim[];     // "user.ts exists, was last modified at X"
  unverifiedClaims: UnverifiedClaim[]; // "file was supposed to be created"
  conflictDetected: Conflict[];        // "claimed to write but file unchanged"
  finalConfidence: number;
}

interface VerifiedClaim {
  claim: string;                        // "user.ts was open"
  evidence: string[];                   // ["read user.ts in tool calls"]
  verificationMethod: 'FILE_EXISTS' | 'TIMESTAMP' | 'CONTENT_MATCH';
}

interface Conflict {
  type: 'CLAIM_VS_REALITY' | 'CLAIM_VS_TIMESTAMP' | 'MUTUAL_EXCLUSION';
  description: string;
  claimed: string;
  actual: string;
}

function verifyRecoverability(
  snapshot: CognitiveSnapshot,
  session: SessionArtifact
): VerificationResult {
  const verified: VerifiedClaim[] = [];
  const unverified: UnverifiedClaim[] = [];
  const conflicts: Conflict[] = [];

  // Verify working memory (files claimed open)
  for (const file of snapshot.workingMemory.filesOpen) {
    if (fileExists(file)) {
      const lastRead = session.toolCalls
        .filter(c => c.tool === 'read' && c.path === file)
        .slice(-1)[0];

      verified.push({
        claim: `${file} was open in context`,
        evidence: [`read ${file} at ${lastRead?.timestamp}`],
        verificationMethod: 'FILE_EXISTS'
      });
    } else {
      unverified.push({
        claim: `${file} was open`,
        reason: 'File does not exist'
      });
    }
  }

  // Verify pending actions
  for (const pending of snapshot.pendingActions) {
    if (pending.action === 'write' || pending.action === 'edit') {
      if (fileExists(pending.target)) {
        // Check if modification happened after interruption
        const fileModified = getFileModifiedTime(pending.target);
        if (fileModified > snapshot.interruptionTimestamp) {
          // Action completed!
          verified.push({
            claim: `Write to ${pending.target} completed`,
            evidence: [`File modified at ${fileModified}`],
            verificationMethod: 'TIMESTAMP'
          });
        } else {
          // Action was pending at interruption
          verified.push({
            claim: `Write to ${pending.target} was pending`,
            evidence: [`No modification after ${snapshot.interruptionTimestamp}`],
            verificationMethod: 'TIMESTAMP'
          });
        }
      } else {
        // File was supposed to be created
        unverified.push({
          claim: `Create ${pending.target}`,
          reason: 'File does not exist - may have been lost in interruption'
        });
      }
    }
  }

  // Calculate final confidence
  const finalConfidence = Math.min(
    snapshot.confidenceScore,
    1 - (conflicts.length * 0.2),
    verified.length / Math.max(snapshot.pendingActions.length, 1)
  );

  return {
    canVerify: verified.length > 0,
    verifiedClaims: verified,
    unverifiedClaims: unverified,
    conflictDetected: conflicts,
    finalConfidence
  };
}
```

---

## PART 5: STREAM RECONSTRUCTION EXAMPLES

### Example 1: Compaction Mid-Edit

**Session State Before Compaction:**
```
[08:04:30] Now I understand the user model structure
[08:04:31] I need to add a password_hash field
[08:04:32] I'll add it after the email field on line
[08:04:33] About to write the change when compaction triggers

Tool calls in last 30 seconds:
- read user.ts (lines 40-60)
- read auth.ts (lines 1-20)
- grep password user.ts (0 matches)
```

**Recovery Output:**
```
COGNITIVE SNAPSHOT
==================
Interrupted: 08:04:33 (compaction)
Position: About to edit user.ts

WHAT I WAS THINKING:
- Understood the user model structure
- Recognized need to add password_hash field
- Was locating the right insertion point (after email field)

WHAT I WAS DOING:
- Researching user.ts structure (read lines 40-60)
- Checking existing password handling (grep - none found)
- Confirming bcrypt is available (read auth.ts)

WHAT WAS ABOUT TO HAPPEN:
- Write to user.ts after line 45 (after email field)
- Add: password_hash: string (with bcrypt hash on create)
- Add validation for password field

WHAT WAS LOADED:
- Files: user.ts (lines 40-60), auth.ts (lines 1-20)
- Decision: Use bcrypt (already imported in auth.ts)

INCOMPLETE:
- Code change to user.ts (was mid-sentence)

CONFIDENCE: 0.88
VERIFIED: user.ts exists, bcrypt imported in auth.ts
```

---

### Example 2: Crash Mid-Test

**Session State Before Crash:**
```
[08:15:42] Let me run the tests to see if auth works
[08:15:43] *runs npm test*
[08:15:44] Test is taking a while...
[Connection lost - crash]

Tool calls:
- write auth.test.ts (just completed)
- exec npm test (running when crashed)
- read auth.ts (before test)
```

**Recovery Output:**
```
COGNITIVE SNAPSHOT
==================
Interrupted: 08:15:44 (crash during test)
Position: Awaiting test results

WHAT I WAS THINKING:
- Just finished writing auth.test.ts
- Was about to verify the tests pass
- Test was running (take a long time indicates it didn't crash immediately)

WHAT I WAS DOING:
- Executing: npm test
- Was waiting for results (hadn't seen output yet)
- Had just completed write to auth.test.ts

WHAT WAS ABOUT TO HAPPEN:
- Receive test output
- If pass: continue to next feature
- If fail: debug and fix auth.test.ts

WHAT WAS LOADED:
- Files: auth.test.ts (just written), auth.ts (recently read)
- Expected: Tests should pass (wrote them carefully)

PENDING:
- Test results not yet received
- No failure to debug yet

CONFIDENCE: 0.75
NOTE: Test results unknown - check if test ran to completion
```

---

### Example 3: Multi-File Refactor Interruption

**Session State Before Compaction:**
```
[08:30:01] Now I'll refactor the API layer
[08:30:02] Moving user endpoints to separate controller
[08:30:03] Already updated routes/index.ts to import new controller
[08:30:04] About to update the controller tests when → COMPACTION

Tool sequence:
- read routes/index.ts
- write routes/userController.ts (new file)
- read old user routes
- edit routes/index.ts
```

**Recovery Output:**
```
COGNITIVE SNAPSHOT
==================
Interrupted: 08:30:04 (compaction mid-refactor)
Position: About to update controller tests

WHAT I WAS THINKING:
- Refactoring user routes into separate controller
- Already migrated routes/index.ts imports
- Next step: update tests to use new controller

WHAT I WAS DOING:
- Moving user endpoints from routes/index.ts to routes/userController.ts
- Just completed: routes/index.ts update
- Was about to work on test updates

WHAT WAS COMPLETED:
✓ Created routes/userController.ts
✓ Updated routes/index.ts to import new controller
○ Updated tests (PENDING)

WHAT WAS ABOUT TO HAPPEN:
- read routes/userController.test.ts (existing tests)
- Update test imports to use new controller
- Run tests to verify refactor didn't break anything

WHAT WAS LOADED:
- Files: routes/index.ts (just edited), routes/userController.ts (just created)
- Context: Test file exists at routes/userController.test.ts

FILES CREATED (verify existence):
- routes/userController.ts (should exist)

FILES MODIFIED (verify changes):
- routes/index.ts (should have new import)

CONFIDENCE: 0.82
VERIFIED: userController.ts exists, index.ts modified
UNVERIFIED: test file update (was about to do)
```

---

## PART 6: INTEGRATION WITH INJECTION MODE

### Unified Output Format

Both modes produce the same `ContextInjection` interface for compatibility:

```typescript
interface ContextInjection {
  timestamp: string;
  sessionId: string;
  mode: 'INJECTION' | 'RECOVERY';

  // Standard fields (used by both modes)
  currentPosition: Position;
  priorities: Priority[];
  injectedKnowledge: string;
  activeFiles: string[];
  executionPatterns: string[];
  synthesizedInsight: string;

  // Recovery-specific fields (populated when mode=RECOVERY)
  recoveryData?: {
    cognitiveSnapshot: CognitiveSnapshot;
    interruptionPoint: InterruptionPoint;
    streamReconstruction: ThoughtStream;
    verificationResult: VerificationResult;
  };
}
```

### Sub-Mode Selection

```typescript
type SynthesisMode = 'INJECTION' | 'RECOVERY';

function selectMode(request: SynthesisRequest): SynthesisMode {
  // Explicit recovery request
  if (request.mode === 'RECOVERY') {
    return 'RECOVERY';
  }

  // Compaction detected - recovery mode
  if (request.trigger === 'post-compaction') {
    return 'RECOVERY';
  }

  // Crash recovery
  if (request.trigger === 'post-crash') {
    return 'RECOVERY';
  }

  // Manual recovery
  if (request.trigger === 'recover-session') {
    return 'RECOVERY';
  }

  // Default to injection
  return 'INJECTION';
}
```

### Trigger Types

| Trigger | Mode | Use Case |
|---------|------|----------|
| `synthesize_context` | INJECTION | Normal proactive synthesis |
| `synthesize_context --recover` | RECOVERY | Explicit recovery |
| Post-compaction | RECOVERY | After scheduled compaction |
| Post-crash | RECOVERY | After unexpected termination |
| `synthesize_context --from <session>` | RECOVERY | Cross-session recovery |

---

## PART 7: OUTPUT ARTIFACTS

### Recovery Output Structure

```
session-ses_XXXX_recovery/
├── 00_COGNITIVE_SNAPSHOT.md     # Main recovery output
├── 01_INTERRUPTION_ANALYSIS.md  # What caused the gap
├── 02_STREAM_RECONSTRUCTION.md  # Thought chain recovery
├── 03_WORKING_MEMORY.md         # What was loaded
├── 04_PENDING_ACTIONS.md        # What was about to happen
├── 05_VERIFICATION.md           # Cross-reference with reality
└── 06_CONFIDENCE_REPORT.md      # How confident we are
```

### Example Cognitive Snapshot Output

```markdown
# COGNITIVE SNAPSHOT - Session Recovery

**Recovered:** 2026-04-15 10:30:45
**Interrupted:** 2026-04-15 08:04:33 (compaction)
**Gap Duration:** 2h 26m 12s

---

## WHERE I WAS

**Gate:** BUILD
**Task:** Add password hashing to user model
**Position:** About to write to `user.ts`

---

## WHAT I WAS THINKING

1. Understood the user model structure (read user.ts lines 40-60)
2. Recognized password_hash field was missing
3. Confirmed bcrypt is available in auth.ts
4. Was locating insertion point (after email field, line 45)

---

## WHAT I WAS DOING

- Research phase: Reading and understanding existing code
- Tool sequence: read user.ts → read auth.ts → grep password → [interrupted]
- Was in analysis phase, about to transition to implementation

---

## WHAT WAS ABOUT TO HAPPEN

1. **Write to `user.ts` after line 45**
   - Add: `password_hash: string`
   - Add: Pre-save hook to hash password

2. **Update `createUser` function**
   - Call `hashPassword()` before storing

3. **If time: Update tests**

---

## WHAT WAS LOADED

**Files in working memory:**
- `src/models/user.ts` (lines 40-60)
- `src/auth.ts` (lines 1-20)

**Decisions made:**
- Use bcrypt (already imported)

**Concepts active:**
- Password hashing
- User model structure

---

## WHAT WAS INCOMPLETE

**Code (was mid-typing):**
```typescript
// About to add:
password_hash: string,
// After email field on line 45
```

**Thought (was mid-sentence):**
```
"I need to add the password"
```

---

## VERIFICATION

✓ `src/models/user.ts` exists
✓ `src/auth.ts` exists, bcrypt imported
✗ `password_hash` field NOT present (was about to add)
○ Tests not yet updated

---

## CONFIDENCE

**Overall:** 0.82 (HIGH)

| Element | Confidence | Verified |
|---------|------------|----------|
| Position (BUILD gate) | 0.95 | ✓ |
| Task (password hashing) | 0.90 | ✓ |
| Pending action (write user.ts) | 0.85 | Partial |
| Exact line number | 0.70 | ✗ |
| Decision (bcrypt) | 0.95 | ✓ |

---

## RECOVERY NOTES

1. **High confidence** that task was adding password hashing
2. **Medium confidence** on exact line number (was locating)
3. **Low confidence** on test update intention (was "if time")
4. **No evidence** of any code written after interruption

**Recommendation:** Resume at user.ts line 45, add password_hash field.
```

---

## PART 8: IMPLEMENTATION PRIORITIES

### Phase 1: Core Recovery (Week 1)
- [ ] Interruption point detection
- [ ] Tool sequence analysis
- [ ] Basic cognitive snapshot generation
- [ ] Simple intent inference from last message

### Phase 2: Stream Recovery (Week 2)
- [ ] Tool pattern recognition (read→write, etc.)
- [ ] Reasoning chain reconstruction
- [ ] Working memory recovery
- [ ] Incomplete code detection

### Phase 3: Verification (Week 3)
- [ ] Filesystem cross-reference
- [ ] Timestamp verification
- [ ] Conflict detection
- [ ] Confidence scoring

### Phase 4: Polish (Week 4)
- [ ] Multi-file refactor recovery
- [ ] Long-gap recovery (hours old context)
- [ ] Integration with compaction system
- [ ] Confidence calibration

---

## PART 9: ANTI-PATTERNS

| Anti-Pattern | Description | Prevention |
|--------------|-------------|------------|
| **Recovery Hallucination** | Making up context that wasn't there | Only infer from tool patterns, not guesses |
| **Confidence Inflation** | Overclaiming recovery quality | Explicit confidence scores, verified vs inferred |
| **Intent Assumption** | Claiming "about to" when uncertain | Flag speculative intents separately |
| **State Fabrication** | Creating memories from whole cloth | Cross-reference with filesystem |
| **Recovery Theater** | Running recovery but adding no value | Validate against actual gap |

---

## APPENDIX A: Confidence Score Calibration

| Score | Meaning | Use Case |
|-------|---------|----------|
| 0.95-1.0 | Exact match | Use freely |
| 0.85-0.94 | High confidence | Use with minor note |
| 0.70-0.84 | Medium confidence | Use, note uncertainty |
| 0.50-0.69 | Low confidence | Use as hints, not facts |
| 0.30-0.49 | Speculative | Use for debugging only |
| <0.30 | Guess | Do not use |

---

## APPENDIX B: Tool Pattern Reference

| Pattern | Meaning | Recovery |
|---------|---------|----------|
| `read(A) → write(A)` | Analyzed, then modifying same file | Was editing A |
| `read(A) → read(B) → write(A)` | Comparing, then editing A | Was updating A based on B |
| `read(A) → read(A)` | Re-reading A | Was confused about A |
| `write(A) → test` | Just created A, testing it | Was testing new A |
| `test → test → test` | Debugging | Was in test-debug loop |
| `read → grep → read → edit` | Search → Understand → Modify | Was finding spot to edit |
| `edit → edit → edit` | Sequential edits | Was making multiple changes |
| `read → [gap] → write` | Research, interrupted, resumed | Was mid-research |

---

**END OF RECOVERY MODE DESIGN**

*Context Synthesis Mode v2.0 - Stream of Consciousness Recovery*