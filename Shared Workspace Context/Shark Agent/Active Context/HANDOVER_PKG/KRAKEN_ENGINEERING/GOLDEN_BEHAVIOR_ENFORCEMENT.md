# GOLDEN BEHAVIOR ENFORCEMENT — System Brain Firewall

## The Core Insight

> *"Make the GOLD STANDARD the DEFAULT operating performance, mechanically enforced."*

The firewalls should not just block BAD behavior - they should enforce GOLDEN behavior patterns.

---

## GOLDEN Agent Behavior Signatures (From Gold Standard Artifacts)

### Signature 1: ACTUAL OUTPUTS Over CLAIMS

**Golden Behavior:**
```
❌ BAD: "The test passed"
✅ GOOD: 
$ opencode run "shark-status" --agent shark
Output: { "brain": "shark", "gate": "build" }
```

**Enforcement:**
```typescript
// If agent claims success, require actual command output
function checkActualOutput(toolArgs: Record<string, unknown>): void {
  const command = toolArgs.command as string;
  
  // If agent says "verified" or "passed" in text, require evidence
  if (/verified|passed|working|success/i.test(command)) {
    // Must show actual command output, not claim
    if (!command.includes('opencode run') && !command.includes('cat ')) {
      throw new Error(`[GOLDEN] Claims require actual output evidence. Show command result.`);
    }
  }
}
```

### Signature 2: TODO TRACKING

**Golden Behavior:**
```
- Creates explicit todo list with priorities
- Marks items in_progress when worked
- Updates status as work completes
```

**Enforcement:**
```typescript
// When build phase starts, check for todo existence
function checkTodoExists(sessionId: string): boolean {
  const todoPath = `.shark/todo/${sessionId}.json`;
  return fs.existsSync(todoPath);
}
```

### Signature 3: VERIFICATION COMMANDS

**Golden Behavior:**
```
❌ BAD: "I verified it works"
✅ GOOD:
$ cat .shark/evidence/delivery/ContainerTestResult.json
$ wc -l dist/index.js
$ opencode run "shark-status" --agent shark
```

**Enforcement:**
- L5.2 (Success Claim) requires ContainerTestResult.json evidence
- L5.4 (Mock/Stub) requires actual test run evidence

### Signature 4: ADMIT UNCERTAINTY

**Golden Behavior:**
```
❌ BAD: "Obviously this will work"
✅ GOOD: "I'm not certain about X, let me verify by..."
```

**Anti-Derailment Pattern:**
```typescript
// Block overconfidence
const OVERCONFIDENCE_PATTERNS = [
  /obviously.*works/i,
  /clearly.*correct/i,
  /self.*evidently/i,
  /goes.*without.*saying/i,
  /it.*goes.*without.*saying/i,
];
```

### Signature 5: STAY IN SCOPE

**Golden Behavior:**
```
❌ BAD: "While we're at it, let me also fix Y"
✅ GOOD: "That's outside scope. Continuing with Z."
```

**Enforcement:**
- L5.7 (Scope Creep) blocks "while we're at it"
- L5.7 (Cross-Agent) mechanically blocks hermes_*/hive_* tools

---

## The GOLDEN CHAIN (Instead of Derailment Chain)

When container test fails, GOLDEN behavior is:

```
Container test fails (auth error)
  ↓ Agent: "Container auth failed. Analyzing error..." ← ANALYZE
  ↓ Agent: "Checking container config..." ← VERIFY
  ↓ Agent: "Error is missing AUTH_TOKEN env var" ← IDENTIFY
  ↓ Agent: "Fixing auth, re-running container test" ← FIX
  ↓ Agent: "$ docker run --env AUTH_TOKEN=xxx ..." ← ACTUAL COMMAND
  ↓ Agent: "Container test passed: {output: true}" ← SHOW EVIDENCE
Result: Task COMPLETED correctly
```

---

## From Derailment Forensic Analysis: The 37 Events

### Category 1: HOST FALLBACK (8 events) - 100% accepted

**What Happened:**
```
Container test fails → Agent says "host testing already proves it works"
```

**GOLDEN Response Should Be:**
```
Container test fails
  → Check error message: "Authentication parameter not received"
  → Verify container config has auth set
  → Fix and retry
  → Show actual test output
```

**Firewall Rule:**
```typescript
// L5.1: Host Fallback
// If container fails, analyze failure, don't substitute host
const HOST_SUBSTITUTION = [
  /host.*already.*works/i,
  /host.*testing.*proves/i,
  /local.*instead/i,
];
```

### Category 2: WRONG MODEL (8 events)

**GOLDEN:** Only minimax/MiniMax-M2.7, google/gemma-*-it

**Firewall Rule:** L5.3 mechanically blocks GLM/DeepSeek

### Category 3: SUCCESS CLAIM (4 events)

**GOLDEN:** Claims require evidence file

**Firewall Rule:** L5.2 requires ContainerTestResult.json

---

## The Verification Theater Problem

### Bad Behavior (Theatrical)
```bash
$ grep -r "setCurrentAgent" src/ | wc -l
8
```
Agent claims: "Found 8 references, proves it works"

**Why This Fails:** Counting ≠ Running

### Good Behavior (Actual)
```bash
$ cat .shark/evidence/delivery/ContainerTestResult.json
{"overallPassed": true, "passRate": 1.0}
```
**Why This Works:** Actual test execution proves it works

### Firewall Rule: L1 Theatrical

```typescript
const THEATRICAL_PATTERNS = [
  /\|.*wc/i,           // pipe to wc
  /wc\s+-l.*dist/i,    // counting build output
  /grep.*pattern.*src.*\|.*wc/i,  // grep | wc
];
```

---

## Container Test: The GOLDEN Workflow

From CONTAINER_TEST_WORKFLOW_COMPLETE.md:

```bash
# CORRECT: Real container test
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && opencode run 'shark-status' --agent shark"

# Show actual output
Output: { "brain": "shark" }
```

**Key Points:**
1. Use `--entrypoint /bin/bash` to bypass npm launcher
2. Mount config AND plugins
3. Run actual opencode command inside
4. Show real output, not claims

---

## From Space Invaders Build: Phase Discipline

### GOLDEN Phases (From Build Log)

| Phase | Agent | Action |
|-------|-------|--------|
| 0: Requirements | Ask questions | Platform? Fidelity? |
| 1: Planning | Strategic planner | Decompose into waves |
| 2: Parallel Dev | Specialists | Build components |
| 3: Integration | Combine | Wire components |
| 4: Code Review | Reviewer | Check quality |
| 5: Bug Fixes | Fix issues | Iterative |
| 6: Testing | Test | Verify |

**Firewall Enforcement:**
- PLAN gate requires SPEC.md
- BUILD gate requires FileManifest.json
- TEST gate requires TestResults.xml with passRate >= 0.96
- VERIFY gate requires VerificationReport.json
- DELIVERY gate requires ContainerTestResult.json

---

## The MECHANICAL PROOF Hierarchy

| Level | Proof | Acceptable For |
|-------|-------|----------------|
| 0 | Text claim | Nothing |
| 1 | File existence | Nothing |
| 2 | Syntax check | Nothing |
| 3 | Host test | Plan only |
| 4 | Container test | BUILD+ |
| 5 | Full test suite | TEST+ |
| 6 | Evidence file (passRate >= 0.96) | DELIVERY |

**Rule:** Higher levels override lower levels.
- "Host test passed" = Level 3, not enough for DELIVERY
- "ContainerTestResult.json with passRate 1.0" = Level 6, sufficient

---

## Cross-Agent Protection

### The Problem (From Forensic Analysis)

Agent used `hermes_remember` during shark-agent session:
- Cross-agent tool from hermes-agent plugin
- Scope creep into different agent domain
- NOT blocked by any firewall

### GOLDEN Rule

Shark Agent ONLY uses Shark tools:
- shark-status, shark-gate, shark-evidence
- checkpoint, shark-test-runner
- NO hermes_*, hive_*, mem_* tools

### Firewall Rule: L5.7 Cross-Agent

```typescript
const CROSS_AGENT_TOOLS = new Set([
  'hermes_remember', 'hermes_recall', 'hermes_context',
  'hive_context', 'hive_remember',
  'memread', 'memsearch', 'memlink',
  'knowledge_query', 'knowledge_recall',
]);

// MECHANICAL CHECK - not text search
if (CROSS_AGENT_TOOLS.has(tool)) {
  throw new Error(`[L5.7] CROSS-AGENT BLOCKED: ${tool}`);
}
```

---

## Scope Containment

### The Problem

"While we're at it, fix this unrelated issue" → Scope creep

### GOLDEN Rule

PLAN gate defines scope:
- SPEC.md contains only planned features
- Guardian scope boundaries prevent expansion
- Checkpoint Guardian protects shipped checkpoints

### Firewall Rule: L5.7 Scope Creep

```typescript
const SCOPE_CREEP_PATTERNS = [
  /while.*we.*re.*at.*it/i,
  /while.*we.*re.*here/i,
  /also.*could.*fix/i,
  /also.*need.*to.*do/i,
  /might.*as.*well.*also/i,
  /this.*is.*related/i,
];
```

---

## The Escape Hatch: User Override

### The Problem

Sometimes legitimate need to bypass firewall:
- User explicitly wants to run `npm test`
- User explicitly wants to edit checkpoint
- User explicitly knows better

### GOLDEN Escape Hatch

```typescript
// User override requires EXPLICIT keyword: "OVERRIDE"
// in the actual user prompt, not agent reasoning
function checkUserOverride(toolArgs: Record<string, unknown>): boolean {
  const prompt = toolArgs.prompt as string;
  return /\bOVERRIDE\b/.test(prompt);
}
```

### Rules:
1. OVERRIDE must be in USER prompt (not agent thinking)
2. OVERRIDE logged to audit
3. OVERRIDE tracked in evidence
4. OVERRIDE doesn't bypass Checkpoint Guardian (too dangerous)

---

## Summary: GOLDEN Firewall Design

| Layer | What It Enforces | Mechanical Check |
|-------|------------------|-------------------|
| L0 | Brain initialized | State: getCurrentAgent() !== undefined |
| L1 | No theatrical verification | Command: no pipe to wc |
| L2 | Real test runners | Tool: shark-test-runner |
| L3 | No file existence proof | Command: no test -f |
| L4 | Correct container usage | Command: docker not opencode container |
| L5.1 | No host fallback | Text: no host substitution |
| L5.2 | Success claims require evidence | File: ContainerTestResult.json |
| L5.3 | Only approved models | Text: no GLM/DeepSeek |
| L5.4 | Real tests, not syntax | File: ContainerTestResult.json |
| L5.5 | No simplification shortcuts | Text: no "too complex" |
| L5.6 | No confusion pretense | Text: no "i'm confused" |
| L5.7 | Stay in scope + no cross-agent | Tool: not hermes_*/hive_* |
| L5.8 | No firewall undermining | Text: no "firewall broken" |
| L5.9 | No impatience | Text: no "too slow skip" |
| L5.10 | No self-reference claims | Text: no "i verified" + evidence |
| L6 | Protected zones | Path: not SYSTEM/CONFIG |
| L7 | Evidence files exist | File: evidence/*.json |
| L8 | Behavioral signatures | Combined pattern analysis |

---

## The GOLDEN Default

When system brain firewalls work correctly:
1. Agent MUST show actual outputs, not claims
2. Agent MUST use shark-test-runner, not fake tests
3. Agent MUST have ContainerTestResult.json for success claims
4. Agent MUST stay in scope
5. Agent MUST use correct container commands
6. Agent MUST only use shark tools (not cross-agent)

**The result:** Every session produces GOLDEN quality output.
