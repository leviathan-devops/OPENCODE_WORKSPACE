# GOLDEN BEHAVIOR ENFORCEMENT — V2.0

## Core Rules (V2.0)

### Rule 1: MECHANICAL OVER TRUST

```
V1.2: "Subagent must retrieve outputs" (trust-based)
V2.0: "Every declared output must fs.existsSync() on host" (mechanical)

Evidence: fs.existsSync(path) only
```

### Rule 2: TWO-LAYER ENFORCEMENT

```
V1.2: Firewall watches tool.execute.before only
V2.0: Firewall watches tool.execute.before AND chat.message

Reason: Agents interpret messages naturally, may not call tools directly
```

### Rule 3: STRUCTURED OVER NATURAL

```
V1.2: Override messages in natural language
V2.0: Override commands with typed schema

OverrideCommand {
  type: 'OVERRIDE'
  action: ABORT | CLAIM_COMPLETE | RETRIEVE_OUTPUTS | REASSIGN
  constraints: { requiresEvidence: [...] }
}
```

### Rule 4: EXPLICIT OVER IMPLICIT

```
V1.2: "Sync at gates"
V2.0: "Gate criteria: A complete AND B complete AND C evidence exists"

Each brain declares: completed: ['A', 'B'], evidence: [{path, check}]
```

### Rule 5: VERIFIED OVER ASSUMED

```
V1.2: Message interpretation assumed correct
V2.0: Message parsed, confidence >= 0.8 required

interface VerifiedMessage {
  verified: boolean;
  confidence: number;
  verificationError?: string;
}
```

---

## Behavioral Rules by Brain (V2.0)

### Planning Brain

| Rule | Description |
|------|-------------|
| MUST | Generate T2 Master context before PLAN gate |
| MUST | Generate T1 from SPEC.md dynamically |
| MUST | Decompose tasks for cluster assignment |
| MUST | Declare outputs for every task (V2.0 NEW) |
| MUST | Register completions to GateManager |
| MUST NOT | Assign tasks without output declarations |
| MUST NOT | Skip domain designation |

### Execution Brain

| Rule | Description |
|------|-------------|
| MUST | Verify outputs mechanically (V2.0 CHANGED) |
| MUST | Use structured override commands (V2.0 CHANGED) |
| MUST | Track momentum via OutputVerifier |
| MUST | Send override BEFORE marking complete (V2.0 NEW) |
| MUST NOT | Trust "success" without checkpoints verified |
| MUST NOT | Use natural language overrides |

### System Brain

| Rule | Description |
|------|-------------|
| MUST | Enforce Two-Layer Firewall (V2.0 NEW) |
| MUST | Evaluate Gate Criteria explicitly (V2.0 CHANGED) |
| MUST | Collect evidence for every gate |
| MUST | Block if evidence constraints not met |
| MUST NOT | Assume "ready" means "complete" |
| MUST NOT | Trust tool-layer-only enforcement |

### Alpha Brain

| Rule | Description |
|------|-------------|
| MUST | Focus on steamroll tasks (build, feature, implement) |
| MUST | Report build progress with checkpoints (V2.0) |
| MUST | Get Gamma approval before declaring done |
| MUST NOT | Attempt precision tasks |
| MUST NOT | Claim success without output retrieval |

### Beta Brain

| Rule | Description |
|------|-------------|
| MUST | Focus on precision tasks (debug, fix, refactor) |
| MUST | Isolate root causes mechanically |
| MUST | Provide minimal targeted fixes |
| MUST NOT | Attempt steamroll tasks |
| MUST NOT | Guess at root cause without evidence |

### Gamma Brain

| Rule | Description |
|------|-------------|
| MUST | Focus on testing tasks |
| MUST | Enforce all gate criteria (V2.0 EXPLICIT) |
| MUST | Verify evidence files mechanically |
| MUST | Check passRate >= 0.96 for TEST gate |
| MUST NOT | Approve without evidence |
| MUST NOT | Accept "trust me" as proof |

### Subagent-Manager

| Rule | V1.2 | V2.0 |
|------|------|------|
| Retrieve outputs | Trust-based | **Mechanical fs.existsSync()** |
| Report completion | "success" | **Checkpoint verified** |
| Handle override | Natural language | **Structured command schema** |
| Accept task | Any task | **Must have output declarations** |

---

## Output Verification Rules

### V1.2: Trust-Based

```typescript
// WRONG - V1.2
if (subagent.reportsSuccess()) {
  markComplete();
}
```

### V2.0: Mechanical

```typescript
// CORRECT - V2.0
interface OutputCheckpoint {
  containerPath: string;
  hostPath: string;
  verified: boolean;
}

// 1. Register outputs BEFORE task starts
outputVerifier.register(taskId, [
  { containerPath: '/app/dist/index.js', hostPath: '/host/dist/index.js' }
]);

// 2. Retrieve outputs
await subagent.retrieveOutputs(paths);

// 3. MECHANICAL VERIFICATION
for (const path of paths) {
  if (!fs.existsSync(path)) {
    throw new Error(`L2_OUTPUT_NOT_RETRIEVED: ${path}`);
  }
}

// 4. Only then mark complete
markComplete();
```

---

## Override Command Rules

### V1.2: Natural Language

```typescript
// WRONG - V1.2
sendMessage("ABORT - you claimed success without outputs");
```

### V2.0: Structured Schema

```typescript
// CORRECT - V2.0
sendOverride({
  type: 'OVERRIDE',
  action: 'CLAIM_COMPLETE',
  target: { taskId },
  payload: { verifyOutputs: true },
  constraints: { requiresEvidence: ['ContainerTestResult.json'] },
  priority: 'critical'
});
```

---

## Gate Criteria Rules

### V1.2: Implicit

```typescript
// WRONG - V1.2
if (allBrainsReady()) {
  advanceGate();
}
```

### V2.0: Explicit

```typescript
// CORRECT - V2.0
const criteria = TEST_GATE_CRITERIA;

// Planning
planning.completed: ['T1_generated', 'test_plan_generated']

// Execution
execution.completed: ['build_complete', 'outputs_retrieved']
execution.evidence: [{ path: 'dist/index.js', type: 'file' }]

// System
system.completed: ['container_test_required']
system.evidence: [{ 
  path: 'ContainerTestResult.json', 
  type: 'file',
  check: 'passRate >= 0.96'
}]

// ONLY advance when ALL criteria met
if (allCriteriaMet(criteria)) {
  advanceGate();
}
```

---

## Message Interpretation Rules

### V1.2: Assumed Correct

```typescript
// WRONG - V1.2
message = receive();
process(message);  // Assumed valid interpretation
```

### V2.0: Verified

```typescript
// CORRECT - V2.0
message = receive();
parsed = parseStructured(message);

if (!parsed.success && parsed.confidence < 0.8) {
  throw new Error(`INTERPRETATION_UNCERTAIN: ${parsed.confidence}`);
}
```

---

## Pattern Enforcement (L0-L8)

### L0: Identity Wall (Unchanged)

```typescript
if (!krakenAgent && dangerousTool && krakenPath) {
  throw new Error('KRAKEN_L0: Non-kraken cannot write to Kraken paths');
}
```

### L1: Orchestration Theater (Unchanged)

```typescript
if (patternMatch(text, ORCHESTRATION_THEATER_PATTERNS)) {
  throw new Error('L1: Task assigned ≠ Task complete');
}
```

### L2: False Completion (V2.0 ENHANCED)

```typescript
// V2.0: MECHANICAL enforcement
if (claimsComplete && !allCheckpointsVerified(taskId)) {
  throw new Error('L2: Cannot claim complete - outputs not verified');
}
```

### L3: Output Inspection (V2.0 CHANGED)

```typescript
// V2.0: Output Checkpoint System
outputVerifier.register(taskId, outputs);
outputVerifier.claimRetrieved(taskId, hostPaths);  // fs.existsSync() for each
outputVerifier.canComplete(taskId);  // ALL must be verified
```

### L4: Wrong Cluster (Unchanged)

```typescript
if (task.type === 'debug' && cluster !== 'beta') {
  throw new Error('L4: Debug tasks must use Beta precision cluster');
}
```

### L5: Macro Derailment (Unchanged patterns, V2.0 enhanced)

```typescript
// Same patterns as V1.2, but:
// V2.0: System Brain has TWO enforcement layers
systemBrain.checkTool(tool, args);     // Layer 1
systemBrain.checkMessage(message);      // Layer 2 (NEW)
```

### L6: Kraken Protection (Unchanged)

```typescript
if (writeToSystemZone) {
  throw new Error('L6: SYSTEM zone is read-only');
}
```

### L7: Coordination Gates (V2.0 EXPLICIT)

```typescript
// V2.0: Explicit criteria per gate
const criteria = getGateCriteria(currentGate);
if (!allCriteriaMet(criteria)) {
  throw new Error(`L7: Gate blocked - ${getBlockers(criteria)}`);
}
```

### L8: Behavioral Intelligence (V2.0 NEW - Message Layer)

```typescript
// V2.0: Message enforcement for L5+ patterns
const THEATRICAL_MESSAGE_PATTERNS = [
  /just\s+grep/i,
  /grep.*\|.*wc/i,
  /count.*lines/i,
];

if (patternMatch(message, THEATRICAL_MESSAGE_PATTERNS)) {
  throw new Error('L8: Theatrical intent detected in message');
}
```

---

## Summary: V1.2 vs V2.0 Differences

| Aspect | V1.2 | V2.0 |
|--------|------|------|
| Output verification | Trust-based | Mechanical fs.existsSync() |
| Firewall | Tool layer only | Two-layer (tool + message) |
| Overrides | Natural language | Structured schema |
| Gate sync | "All ready" | Explicit criteria |
| Message verification | Assumed | Confidence >= 0.8 |
| Completion claim | subagent.success | checkpoints.verified |
| Evidence | Optional | Required for gates |

---

*End of Golden Behavior V2.0*