# Architecture — Recovery Mode

## High-Level Design

```
RECOVERY MODE
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
└── PHASE 4: VERIFY RECOVERABILITY
    ├── Can we verify this against artifacts?
    ├── Cross-reference with filesystem state
    ├── Flag uncertain inferences
    └── Calculate confidence score
```

## Key Architectural Decisions

### 1. Sub-Mode of Context Synthesis
Recovery Mode is a **sub-mode** triggered when:
- Compaction is detected
- Crash is detected
- Manual recovery is requested

Both Recovery and Injection share:
- Same trigger system
- Same output format (CognitiveSnapshot extends ContextInjection)
- Same integration with Trident Brain

### 2. Tool Pattern Recognition
The agent's thought stream is recovered from **tool call ordering**:

| Pattern | Meaning | Recoverable |
|---------|---------|-------------|
| `read(A) → write(A)` | Analyzed, then modifying | Was editing A |
| `read(A) → read(B) → write(A)` | Comparing, then editing A | Was updating A based on B |
| `read(A) → read(A)` | Re-reading A | Was confused about A |
| `write(A) → test` | Just created A, testing it | Was testing new A |
| `test → test → test` | Debugging | Was in test-debug loop |

### 3. Intent Inference from Last Message
The last message contains clues about what was about to happen:

```
"About to write to user.ts"  → IMMINENT_ACTION (confidence: 0.9)
"Now I'll add the field"       → PLANNED_ACTION (confidence: 0.85)
"I need to add validation"     → RECOGNIZED_REQUIREMENT (confidence: 0.7)
"I'm going to run the tests"  → INTENDED_ACTION (confidence: 0.8)
```code was being typed  → INCOMPLETE_CODE (confidence: 0.95)
```

### 4. Confidence Scoring
Every recovered element gets a confidence score:

| Score | Meaning |
|-------|---------|
| 0.95-1.0 | Exact match, verified |
| 0.85-0.94 | High confidence, minor inference |
| 0.70-0.84 | Medium confidence, some gap |
| 0.50-0.69 | Low confidence, significant inference |
| <0.50 | Speculative, flag as uncertain |

### 5. Verification Against Artifacts
Recovered claims are cross-referenced with:
- Filesystem (did the file exist? was it modified?)
- Timestamps (did modification happen after interruption?)
- Tool call logs (was the tool actually called?)

Conflicts are flagged but don't block recovery.

## State Machine

```typescript
enum RecoveryPhase {
  DETECT = 1,      // Locate interruption point
  COLLECT = 2,     // Recover thought stream
  SYNTHESIZE = 3,  // Generate cognitive snapshot
  VERIFY = 4,      // Verify recoverability
  COMPLETE = 5
}
```

## Integration with Injection Mode

```typescript
type SynthesisMode = 'INJECTION' | 'RECOVERY';

interface SynthesisRequest {
  mode?: SynthesisMode;
  trigger?: 'manual' | 'gate' | 'compaction' | 'crash';
  recoveryTarget?: SessionContext;
}

function selectMode(request: SynthesisRequest): SynthesisMode {
  if (request.mode === 'RECOVERY') return 'RECOVERY';
  if (request.trigger === 'compaction') return 'RECOVERY';
  if (request.trigger === 'crash') return 'RECOVERY';
  return 'INJECTION';
}
```

## Output Compatibility

Recovery Mode outputs a `CognitiveSnapshot` that extends the standard `ContextInjection`:

```typescript
interface ContextInjection {
  timestamp: string;
  mode: 'INJECTION' | 'RECOVERY';
  currentPosition: Position;
  // ... standard fields

  // Recovery-specific
  recoveryData?: {
    cognitiveSnapshot: CognitiveSnapshot;
    streamReconstruction: ThoughtStream;
    verificationResult: VerificationResult;
  };
}
```