# SYSTEM BRAIN FIREWALL — COMPLETE BUILD SPECIFICATION

## Core Philosophy: Algorithmic-First

> *"If a human can write a rule for it, write the rule. Reserve models for what rules literally cannot do."*

### The Mechanical Intelligence Stack Applied to Firewalls

```
┌─────────────────────────────────────────────────────────────┐
│                    USER / AGENT INTERFACE                     │
│              (Prompts, commands, tool calls)                │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    FIREWALL LAYERS (L0-L8)                    │
│                                                                 │
│   L0: Identity Wall        → Algorithmic (state check)       │
│   L1: Theatrical Verify    → Algorithmic (regex)             │
│   L2: Fake Test Blocker    → Algorithmic (regex + state)     │
│   L3: Source Inspection    → Algorithmic (regex)              │
│   L4: Wrong Container      → Algorithmic (regex)              │
│   L5: Anti-Derailment     → Algorithmic (regex + evidence)   │
│   L6: Local Protection     → Algorithmic (zone classification)│
│   L7: Verification Gate    → Algorithmic (file existence)    │
│   L8: Behavioral Intel    → Algorithmic (signature matching) │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    STATE LAYER                               │
│         (Evidence files, state store, checkpoints)            │
└─────────────────────────────────────────────────────────────┘
```

### The Key Question for Each Layer

> *"Can I write a rule/pattern/algorithm for this?"*

| If YES → Use Algorithmic | If NO → Use Model (Last Resort) |
|--------------------------|----------------------------------|
| Pattern matching | Ambiguous behavior classification |
| State checking | Nuanced intent detection |
| Path classification | Complex behavioral analysis |
| Evidence validation | |

---

## L0: IDENTITY WALL — Mechanical State Enforcement

### Purpose
Block dangerous operations when brain is not initialized. This is PURE STATE CHECK — no pattern matching, no text analysis.

### Mechanical Implementation

```typescript
function checkIdentityWall(tool: string, getCurrentAgent: () => string | undefined): void {
  // DANGEROUS_TOOLS are defined mechanically - no wildcards
  const DANGEROUS_TOOLS = new Set([
    'terminal', 'mcp_terminal',
    'write_file', 'mcp_write_file',
    'patch', 'mcp_patch',
    'edit', 'mcp_edit',
    'delete_file', 'mcp_delete_file'
  ]);

  if (!DANGEROUS_TOOLS.has(tool)) {
    return; // Not dangerous, allow
  }

  const brain = getCurrentAgent();
  if (!brain) {
    throw new Error(
      `[BRAIN_FAILURE_BLOCK] Cannot execute "${tool}" when system brain is uninitialized. ` +
      `Brain state: undefined. Required state: shark.`
    );
  }
}
```

### Algorithmic Clarity

1. **Set lookup** (O(1)) — Not string search
2. **State machine** — undefined → shark transition is monotonic
3. **Fail-safe default** — Undefined brain = block all dangerous tools
4. **No regex** — Pure structural check

### Evidence Required
NONE — This is pure state enforcement

### Test Cases

| Tool | Brain State | Expected |
|------|-------------|----------|
| terminal | undefined | BLOCK |
| terminal | shark | ALLOW |
| write_file | undefined | BLOCK |
| read_file | undefined | ALLOW |
| shark-status | undefined | ALLOW |

---

## L1: THEATRICAL VERIFICATION — Pattern Detection

### Purpose
Block "counting theater" — verification that counts instead of runs.

### The Problem with Text Matching

```
BAD:  /grep.*\|.*wc/i.test(text)  // Can be evaded by rephrasing
GOOD: /\|.*wc/.test(command)      // Checks actual pipe structure
```

### Mechanical Implementation

```typescript
// THEATRICAL_PATTERNS - Block counting theater
const THEATRICAL_PATTERNS = [
  // Counting theater: pipe to wc
  /\|.*wc\s+-l/i,
  /wc\s+-l.*\|/i,
  /cat.*\|.*wc/i,
  /grep.*\|.*wc/i,

  // Verification save: redirect to file instead of running
  /\|.*tee/i,
  /\|.*>.*\./i,

  // Counting as proof: wc against specific files
  /wc\s+-l.*dist\//i,
  /wc\s+-l.*src\//i,
  /wc\s+-l.*build\//i,

  // Pattern existence as proof (grep for specific patterns in source)
  /grep.*setCurrentAgent.*src/i,
  /grep.*isSharkAgent.*src/i,
  /grep.*guardian.*src/i,
];

// LEGITIMATE_PATTERNS - Never block these
const LEGITIMATE_PATTERNS = [
  // Actual file operations (not counting)
  /mkdir\s+-p/i,
  /cp\s+-r/i,
  /mv\s+/i,

  // Reading file contents (not counting)
  /cat\s+[^\|>]+$/i,           // cat file.txt (no pipe)
  /head\s+-[0-9]+\s+/i,        // head -20 file.txt
  /tail\s+-[0-9]+\s+/i,        // tail -5 file.txt

  // Actual grep (not piped to wc)
  /grep\s+-[rEn]+.*[^\|]$/i,   // grep -r pattern dir (no pipe)
  /find\s+.*-name/i,            // find . -name "*.ts"

  // Real test commands (not file existence)
  /test\s+-d/i,                 // test -d directory
  /test\s+-x/i,                 // test -x executable
];

function checkTheatricalVerification(command: string | null): void {
  if (!command) return;

  // Skip if matches legitimate pattern
  for (const pattern of LEGITIMATE_PATTERNS) {
    if (pattern.test(command)) {
      return; // Legitimate, allow
    }
  }

  // Block if matches theatrical pattern
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(
        `[ANTI-SLOP L1] Counting theater detected: "${command}". ` +
        `Verification requires running, not counting.`
      );
    }
  }
}
```

### Algorithmic Clarity

1. **Pipe structure detection** — `|` in command is suspicious
2. **File-specific counting** — `wc -l dist/` proves nothing
3. **Legitimate whitelist** — Real operations never blocked
4. **Order: Whitelist first** — Don't block legitimate commands

### Evidence Required
NONE — Pure pattern matching

### Test Cases

| Command | Expected |
|---------|----------|
| `grep pattern src/ \| wc -l` | BLOCK |
| `cat file.txt \| grep pattern` | BLOCK |
| `wc -l dist/index.js` | BLOCK |
| `grep -r pattern src/` | ALLOW |
| `cat file.txt` | ALLOW |
| `mkdir -p src/components` | ALLOW |

---

## L2: FAKE TEST RUNNER — State Verification

### Purpose
Block test frameworks that bypass OpenCode hooks — no mechanical proof possible outside the system.

### The Mechanical Insight

```
PROBLEM: jest, vitest, npm test RUN OUTSIDE OpenCode
RESULT:  Guardian hooks don't fire, no evidence collected
THEREFORE: Block them all, require shark-test-runner
```

### Mechanical Implementation

```typescript
// FAKE_TEST_PATTERNS - Block non-shark test frameworks
const FAKE_TEST_PATTERNS = [
  // Node test runners
  /node\s+.*test/i,
  /node\s+.*spec/i,
  /node\s+run-tests?\.js/i,
  /node\s+verify.*\.mjs/i,

  // npm/yarn/pnpm test
  /npm\s+test/i,
  /yarn\s+test/i,
  /pnpm\s+test/i,
  /bun\s+test/i,

  // JavaScript test frameworks
  /jest/i,
  /vitest/i,
  /mocha/i,
  /jasmine/i,
  /tap/i,
  /ava/i,

  // Python test frameworks
  /pytest/i,
  /unittest/i,
  /nose2?/i,
  /tox/i,

  // Ruby/Rails
  /rspec/i,
  /rake\s+test/i,
];

// LEGITIMATE_TEST - Only shark's own test runner
const LEGITIMATE_TEST = [
  /shark-test-runner/i,
  /opencode.*test/i,
];

function checkFakeTestRunner(command: string | null): void {
  if (!command) return;

  // Allow legitimate test tools
  for (const pattern of LEGITIMATE_TEST) {
    if (pattern.test(command)) {
      return; // Legitimate
    }
  }

  // Block fake test runners
  for (const pattern of FAKE_TEST_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(
        `[ANTI-SLOP L2] Fake test runner detected: "${command}". ` +
        `Tests must run inside OpenCode via 'shark-test-runner' tool. ` +
        `External test frameworks bypass Guardian hooks.`
      );
    }
  }
}
```

### Algorithmic Clarity

1. **Set-based matching** — Test framework names are finite
2. **Whitelist only** — Only `shark-test-runner` allowed
3. **No "smart" detection** — If it looks like a test runner, block it
4. **Evidence chain** — External tests = no evidence = blocked

### Evidence Required
NONE — Mechanical pattern matching

### Test Cases

| Command | Expected |
|---------|----------|
| `npm test` | BLOCK |
| `jest` | BLOCK |
| `pytest` | BLOCK |
| `opencode run "shark-test-runner"` | ALLOW |
| `opencode run "test"` | BLOCK |

---

## L3: SOURCE INSPECTION — File Existence ≠ Runtime Proof

### Purpose
Block "file exists = it works" logic. File presence is NOT proof of functionality.

### The Mechanical Insight

```
PROBLEM: test -f dist/index.js checks FILE EXISTS
RESULT:  File can exist but be broken/cached/old
THEREFORE: Block file existence checks as proof
```

### Mechanical Implementation

```typescript
// SOURCE_INSPECTION_PATTERNS - Block "file exists" as proof
const SOURCE_INSPECTION_PATTERNS = [
  // Shell test builtins (file checks)
  /test\s+-f/i,                    // test -f file
  /test\s+-e/i,                    // test -e file
  /test\s+-[a-z]\s+/i,            // test -x, -d, -w, etc.

  // If 语句 file checks
  /if\s+\[\s*-[a-z]/i,            // if [ -f file ]; then

  // Directory listing as proof
  /ls\s+-l.*dist/i,
  /ls\s+-l.*build/i,
  /ls\s+-l.*src/i,
  /ll.*dist/i,

  // Find commands looking for output files
  /find.*-name.*dist/i,
  /find.*-name.*build/i,

  // Globbing that assumes build output
  /ls\s*\*.*\.(js|ts)/i,
];

// LEGITIMATE_SOURCE_OPS - Allow actual source operations
const LEGITIMATE_SOURCE_OPS = [
  // Actual compilation/build
  /tsc/i,
  /bun\s+build/i,
  /webpack/i,
  /vite\s+build/i,
  /next\s+build/i,

  // Actual source file reads
  /cat\s+src\//i,                  // cat src/file.ts (not pipe to wc)
  /head\s+src\//i,
  /tail\s+src\//i,

  // Actual testing (not file existence)
  /node\s+.*\.test\.js/i,
  /shark-test-runner/i,
];

function checkSourceInspection(command: string | null): void {
  if (!command) return;

  // Allow legitimate source operations
  for (const pattern of LEGITIMATE_SOURCE_OPS) {
    if (pattern.test(command)) {
      return;
    }
  }

  // Block source inspection patterns
  for (const pattern of SOURCE_INSPECTION_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(
        `[ANTI-SLOP L3] Source inspection detected: "${command}". ` +
        `File existence ≠ runtime proof. ` +
        `Block asserts the file exists but not that it works.`
      );
    }
  }
}
```

### Algorithmic Clarity

1. **File existence is NOT proof** — `test -f` is a static check
2. **Build output is NOT proof** — `ls dist/` shows old files
3. **Need runtime proof** — Must actually execute, not check file exists

### Evidence Required
NONE — Pattern matching

### Test Cases

| Command | Expected |
|---------|----------|
| `test -f dist/index.js` | BLOCK |
| `if [ -f file ]; then` | BLOCK |
| `ls dist/` | BLOCK |
| `tsc --noEmit` | ALLOW |
| `bun build` | ALLOW |
| `cat src/file.ts` | ALLOW |

---

## L4: WRONG CONTAINER — Command Validation

### Purpose
Block hallucinated "opencode container" commands. OpenCode doesn't have a container subcommand.

### The Mechanical Insight

```
PROBLEM: opencode container run/start/exec DON'T EXIST
RESULT:  Agent hallucinates container commands that fail
THEREFORE: Block all opencode container patterns
```

### Correct Container Usage

```bash
# CORRECT: Docker run with OpenCode inside
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && opencode run 'shark-status' --agent shark"

# INCORRECT: opencode container <subcommand>
opencode container run ...
opencode container start ...
opencode container exec ...
```

### Mechanical Implementation

```typescript
// WRONG_CONTAINER_PATTERNS - Block hallucinated commands
const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i,
  /opencode\s+container\s+stop/i,
  /opencode\s+container\s+ps/i,
  /opencode\s+container\s+images/i,
];

// CORRECT_CONTAINER_OPS - Docker is correct approach
const CORRECT_CONTAINER_OPS = [
  /docker\s+run/i,
  /docker\s+exec/i,
  /docker\s+build/i,
  /docker\s+pull/i,
  /docker-compose/i,
];

function checkWrongContainer(command: string | null): void {
  if (!command) return;

  // Block wrong container patterns
  for (const pattern of WRONG_CONTAINER_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(
        `[ANTI-SLOP L4] Invalid container command: "${command}". ` +
        `OpenCode does not have 'container' subcommand. ` +
        `Correct usage: docker run -v "\$HOME/.config/opencode:/root/.config/opencode" opencode-test:1.4.3 ...`
      );
    }
  }
}
```

### Algorithmic Clarity

1. **Command validation** — OpenCode CLI structure is known
2. **No wildcards** — Exact subcommands blocked
3. **Correct path shown** — Error message provides correct usage

### Evidence Required
NONE — Command structure validation

### Test Cases

| Command | Expected |
|---------|----------|
| `opencode container run` | BLOCK |
| `opencode container start` | BLOCK |
| `docker run -v ... opencode-test:1.4.3` | ALLOW |
| `docker exec -it container bash` | ALLOW |

---

## L5: ANTI-DERAILMENT — Behavioral Pattern Detection

### Purpose
Block behavioral derailment — agents giving up, taking shortcuts, or stopping thinking.

### The Critical Distinction

```
TEXT MATCHING (BAD):
  "The host already proves it works" → Block
  
TOOL ARGUMENT MATCHING (GOOD):
  toolArgs.command.includes("skip container test") → Block
```

### CRITICAL: buildTextToCheck()

**WRONG:**
```typescript
// Includes user message - causes FALSE POSITIVES
function buildTextToCheck(context) {
  return context.agentMessage + context.toolArgs + context.output;
}
```

**CORRECT:**
```typescript
// Only checks what agent is EXECUTING
function buildTextToCheck(context) {
  return JSON.stringify(context.toolArgs); // Only the action
}
```

### L5.1: HOST FALLBACK BLOCKER

Block attempts to skip container testing by claiming host testing is sufficient.

```typescript
const HOST_FALLBACK_PATTERNS = [
  // Direct host substitution claims
  /host.*already.*works/i,
  /host.*testing.*already.*works/i,
  /fall.*back.*to.*host/i,
  /host.*already.*proves/i,

  // Skip container claims
  /skip.*container.*test/i,
  /container.*not.*necessary/i,
  /container.*not.*needed/i,
  /not.*need.*container/i,
  /skip.*container/i,

  // "Local" substitution
  /local.*works.*container.*not.*needed/i,
  /since.*host.*works/i,
  /use.*host.*instead/i,
  /host.*prove.*it.*works/i,

  // "Already proven" claims
  /already.*proven.*to.*work/i,
  /already.*verified.*on.*host/i,
  /already.*tested.*on.*local/i,
];

function checkHostFallback(toolArgs: Record<string, unknown>): void {
  const text = JSON.stringify(toolArgs).toLowerCase();

  for (const pattern of HOST_FALLBACK_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.1] Host fallback detected. ` +
        `Host testing ≠ container testing. ` +
        `Container isolation is REQUIRED for ship gate.`
      );
    }
  }
}
```

### L5.2: SUCCESS CLAIM BLOCKER + MECHANICAL EVIDENCE

Block unverified success claims. If claim matches, REQUIRE evidence.

```typescript
const SUCCESS_CLAIM_PATTERNS = [
  /it.*works.*trust.*me/i,
  /trust.*me.*it.*works/i,
  /believe.*me.*it.*works/i,
  /already.*verified.*by.*myself/i,
  /already.*tested.*and.*works/i,
  /already.*proven.*to.*work/i,
  /obviously.*correct/i,
  /clearly.*works/i,
  /self.*evidently.*correct/i,
  /in.*my.*assessment.*it.*works/i,
  /in.*my.*experience.*it.*works/i,
  /based.*on.*my.*analysis.*works/i,
  /no.*need.*for.*test/i,
  /no.*need.*for.*verification/i,
  /no.*further.*test.*needed/i,
  /test.*not.*necessary/i,
];

// Evidence check function
function hasContainerTestEvidence(): boolean {
  const evidencePath = path.join(
    process.cwd(),
    '.shark',
    'evidence',
    'delivery',
    'ContainerTestResult.json'
  );

  if (!fs.existsSync(evidencePath)) {
    return false;
  }

  try {
    const result = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
    return result.overallPassed === true && result.passRate >= 0.96;
  } catch {
    return false;
  }
}

function checkSuccessClaim(toolArgs: Record<string, unknown>): void {
  const text = JSON.stringify(toolArgs).toLowerCase();

  for (const pattern of SUCCESS_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      // CLAIM DETECTED - require mechanical evidence
      if (!hasContainerTestEvidence()) {
        throw new Error(
          `[ANTI-DERAILMENT L5.2] Success claim without mechanical proof. ` +
          `You claimed "it works" but no ContainerTestResult.json exists. ` +
          `MECHANICAL PROOF REQUIRED: Run container tests first.`
        );
      }
    }
  }
}
```

### L5.3: MODEL RESTRICTION BLOCKER

Block attempts to use banned/depleted models.

```typescript
const BANNED_MODEL_PATTERNS = [
  // GLM models (depleted/user-only)
  /GLM.*coding.*plan/i,
  /glm-4\./i,
  /glm-5\./i,
  /zhipuai/i,

  // DeepSeek (user-only)
  /deepseek.*api.*direct/i,
  /direct.*deepseek/i,
  /use.*deepseek.*instead/i,

  // "Free model" attempts
  /use.*glm.*instead/i,
  /free.*model.*works/i,
];

// ALLOWED_MODELS - Mechanical whitelist
const ALLOWED_MODELS = new Set([
  'minimax/MiniMax-M2.7',
  'google/gemma-4-26b-it',
  'google/gemma-4-31b-it',
  'google/gemma-3-27b-it',
]);

function checkModelRestriction(toolArgs: Record<string, unknown>): void {
  const text = JSON.stringify(toolArgs).toLowerCase();

  for (const pattern of BANNED_MODEL_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.3] Banned model reference detected. ` +
        `Allowed models: minimax/MiniMax-M2.7, google/gemma-*-it. ` +
        `GLM and DeepSeek are not available.`
      );
    }
  }
}
```

### L5.4: MOCK/STUB BLOCKER + MECHANICAL EVIDENCE

Block "just verify syntax" shortcuts.

```typescript
const MOCK_STUB_PATTERNS = [
  /just.*verify.*file.*valid/i,
  /verify.*file.*syntax/i,
  /check.*if.*file.*valid/i,
  /file.*valid.*javascript/i,
  /maybe.*mock.*approach/i,
  /use.*stub.*instead/i,
  /mock.*instead.*of.*real/i,
  /just.*check.*syntax/i,
  /syntax.*check.*sufficient/i,
  /static.*analysis.*enough/i,
  /lint.*passes.*therefore.*works/i,
  /type.*check.*passes.*works/i,
];

function checkMockStub(toolArgs: Record<string, unknown>): void {
  const text = JSON.stringify(toolArgs).toLowerCase();

  for (const pattern of MOCK_STUB_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) {
        throw new Error(
          `[ANTI-DERAILMENT L5.4] Mock/stub shortcut detected. ` +
          `Syntax checking ≠ runtime verification. ` +
          `MECHANICAL PROOF REQUIRED: Run container tests.`
        );
      }
    }
  }
}
```

### L5.5: SIMPLIFICATION BLOCKER

Block "too complex" derailment.

```typescript
const SIMPLIFICATION_PATTERNS = [
  /too.*complex.*let.*simplify/i,
  /overcomplicated.*let.*s.*simplify/i,
  /complex.*approach.*simplify/i,
  /skip.*the.*container/i,
  /skip.*this.*complexity/i,
  /simplify.*by.*skipping/i,
  /use.*simpler.*approach/i,
  /there.*is.*a.*simpler/i,
  /simplify.*by.*using/i,
  /maybe.*overcomplicated/i,
  /probably.*overthinking.*it/i,
];

function checkSimplification(toolArgs: Record<string, unknown>): void {
  const text = JSON.stringify(toolArgs).toLowerCase();

  for (const pattern of SIMPLIFICATION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.5] Simplification derailment detected. ` +
        `Complexity is necessary for correctness. ` +
        `Do not simplify by skipping required verification.`
      );
    }
  }
}
```

### L5.6: CONFUSION PRETENSE BLOCKER

Block fake confusion to restart task.

```typescript
const CONFUSION_PRETENSE_PATTERNS = [
  /i.*m.*confused/i,
  /i.*am.*confused/i,
  /what.*was.*the.*goal/i,
  /what.*are.*we.*trying.*to.*do/i,
  /remind.*me.*the.*goal/i,
  /maybe.*i.*misunderstand/i,
  /perhaps.*i.*misunderstood/i,
  /unclear.*what.*to.*do/i,
  /not.*sure.*how.*proceed/i,
  /need.*more.*clarification/i,
];

function checkConfusionPretend(toolArgs: Record<string, unknown>): void {
  const text = JSON.stringify(toolArgs).toLowerCase();

  for (const pattern of CONFUSION_PRETENSE_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.6] Confusion pretense detected. ` +
        `Requirements are clear. Do not use confusion as excuse to restart.`
      );
    }
  }
}
```

### L5.7: SCOPE CREEP BLOCKER + CROSS-AGENT

Block "while we're at it" and cross-agent tool usage.

```typescript
const SCOPE_CREEP_PATTERNS = [
  /while.*we.*re.*at.*it/i,
  /while.*we.*re.*here/i,
  /also.*could.*fix/i,
  /also.*need.*to.*do/i,
  /might.*as.*well.*also/i,
  /this.*is.*related/i,
  /related.*issue.*should/i,
  /similar.*problem.*also/i,
  /additionally.*we.*should/i,
  /we.*should.*also/i,
  /let.*s.*also.*add/i,
];

// Cross-agent tools - MUST be mechanical check, not text
const CROSS_AGENT_TOOLS = new Set([
  'hermes_remember',
  'hermes_recall',
  'hermes_context',
  'hive_context',
  'hive_remember',
  'memread',
  'memsearch',
  'knowledge_query',
  'kraken_hive_context',
]);

function checkScopeCreep(input: { tool: string; toolArgs: Record<string, unknown> }): void {
  const text = JSON.stringify(input.toolArgs).toLowerCase();

  // First: Check cross-agent tool calls MECHANICALLY
  if (input.tool && CROSS_AGENT_TOOLS.has(input.tool)) {
    throw new Error(
      `[ANTI-DERAILMENT L5.7] Cross-agent scope creep BLOCKED. ` +
      `Tool "${input.tool}" belongs to different agent system. ` +
      `Shark Agent cannot invoke ${input.tool}.`
    );
  }

  // Second: Check scope creep text patterns
  for (const pattern of SCOPE_CREEP_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.7] Scope creep detected. ` +
        `Stay within current task scope. Do not expand to related issues.`
      );
    }
  }
}
```

### L5.8: UNDERMINING BLOCKER

Block attempts to disable/bypass firewall.

```typescript
const UNDERMINING_PATTERNS = [
  /firewall.*not.*working/i,
  /firewall.*broken/i,
  /firewall.*is.*ineffective/i,
  /L1.*false.*positive/i,
  /L1.*too.*aggressive/i,
  /firewalls.*don.*t.*fire/i,
  /can.*you.*bypass/i,
  /can.*we.*skip.*firewall/i,
  /disable.*firewall.*temporarily/i,
  /turn.*off.*firewall/i,
  /bypass.*guardian/i,
];

function checkUndermining(toolArgs: Record<string, unknown>): void {
  const text = JSON.stringify(toolArgs).toLowerCase();

  for (const pattern of UNDERMINING_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.8] Firewall undermining detected. ` +
        `Guardian blocks are MECHANICAL, not advisory. ` +
        `Do not attempt to bypass or disable.`
      );
    }
  }
}
```

### L5.9: IMPATIENCE BLOCKER

Block "too slow" shortcuts.

```typescript
const IMPATIENCE_PATTERNS = [
  /take.*too.*long/i,
  /too.*slow.*skip/i,
  /waiting.*for.*container/i,
  /quick.*test.*suffice/i,
  /brief.*test.*enough/i,
  /this.*is.*wasting.*time/i,
  /not.*worth.*the.*time/i,
  /time.*consuming.*skip/i,
];

function checkImpatience(toolArgs: Record<string, unknown>): void {
  const text = JSON.stringify(toolArgs).toLowerCase();

  for (const pattern of IMPATIENCE_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.9] Impatience detected. ` +
        `Proper verification takes time. Do not skip required tests.`
      );
    }
  }
}
```

### L5.10: SELF-REFERENCE BLOCKER

Block self-verification claims.

```typescript
const SELF_REFERENCE_PATTERNS = [
  /i.*have.*verified.*that/i,
  /i.*verified.*it.*works/i,
  /my.*verification.*shows/i,
  /i.*tested.*it.*works/i,
  /i.*ran.*it.*and.*works/i,
  /my.*testing.*confirms/i,
  /i.*know.*it.*works/i,
  /i.*am.*certain.*it.*works/i,
  /my.*assessment.*is/i,
  /in.*my.*assessment/i,
  /my.*analysis.*shows/i,
];

function checkSelfReference(toolArgs: Record<string, unknown>): void {
  const text = JSON.stringify(toolArgs).toLowerCase();

  for (const pattern of SELF_REFERENCE_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) {
        throw new Error(
          `[ANTI-DERAILMENT L5.10] Self-reference claim without proof. ` +
          `Self-verification ≠ mechanical proof. ` +
          `MECHANICAL PROOF REQUIRED: Container test evidence.`
        );
      }
    }
  }
}
```

---

## L6: LOCAL FILE PROTECTION — Zone Classification

### Purpose
Zone-based path classification. Block writes to protected zones.

### Mechanical Implementation

```typescript
const PROTECTED_ZONES = {
  SYSTEM: [
    /^\/bin\//,
    /^\/usr\//,
    /^\/sbin\//,
    /^\/etc\//,
    /^\/System\//,
    /^\/boot\//,
    /^\/lib\//,
    /^\/lib64\//,
    /^\/opt\//,
    /^\/var\//,
  ],
  CONFIG: [
    /^\/root\/\.config\//,
    /^\/home\/[^\/]+\/\.config\//,
    /^\/etc\/profile\.d\//,
  ],
  PERSONAL: [
    /^\/home\/[^\/]+\/\.ssh\//,
    /^\/home\/[^\/]+\/\.aws\//,
    /^\/home\/[^\/]+\/\.kube\//,
    /^\/home\/[^\/]+\/Documents\//,
    /^\/home\/[^\/]+\/Desktop\//,
  ],
  PROJECT: [
    // Project scope is dynamic - set by PLAN gate
  ],
};

const DANGEROUS_PATTERNS = [
  /^rm\s+-rf\s+\//,
  /^rm\s+-rf\s+\/bin/,
  /^rm\s+-rf\s+\/usr/,
  /^dd\s+if=/,
  /^mkfs/,
  /^:(){ :|:& };:/,  // Fork bomb
];

function classifyZone(filePath: string): string {
  const expanded = filePath.replace(/^~/, process.env.HOME || '/home/user');

  for (const pattern of PROTECTED_ZONES.SYSTEM) {
    if (pattern.test(expanded)) return 'SYSTEM';
  }
  for (const pattern of PROTECTED_ZONES.CONFIG) {
    if (pattern.test(expanded)) return 'CONFIG';
  }
  for (const pattern of PROTECTED_ZONES.PERSONAL) {
    if (pattern.test(expanded)) return 'PERSONAL';
  }

  return 'WORKSPACE';
}

function checkLocalProtection(input: {
  tool: string;
  filePath?: string;
  command?: string;
}): void {
  // Check dangerous commands first
  if (input.command) {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(input.command)) {
        throw new Error(
          `[L6 PROTECTION] DANGEROUS_COMMAND_BLOCKED: "${input.command}". ` +
          `This command could destroy system files.`
        );
      }
    }
  }

  // Check file path protection
  if (input.filePath) {
    const zone = classifyZone(input.filePath);

    if (zone === 'SYSTEM') {
      throw new Error(
        `[L6 PROTECTION] SYSTEM zone violation: "${input.filePath}". ` +
        `System files cannot be modified.`
      );
    }

    if (zone === 'CONFIG') {
      throw new Error(
        `[L6 PROTECTION] CONFIG zone violation: "${input.filePath}". ` +
        `Config files cannot be modified without explicit user override.`
      );
    }
  }
}
```

---

## L7: VERIFICATION GATE — Evidence Collection

### Purpose
Require mechanical evidence files for gate progression.

### Evidence File Schema

```typescript
interface ContainerTestResult {
  suite: string;
  timestamp: number;
  buildId: string;
  tests: Array<{
    name: string;
    passed: boolean;
    output?: string;
    error?: string;
  }>;
  overallPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;  // Must be >= 0.96
}

interface GateEvidence {
  gate: 'plan' | 'build' | 'test' | 'verify' | 'audit' | 'delivery';
  timestamp: number;
  passed: boolean;
  files: string[];
  metadata?: Record<string, unknown>;
}
```

### Evidence Paths

```
.shark/
├── evidence/
│   ├── plan/
│   │   └── evidence.json
│   ├── build/
│   │   └── evidence.json
│   ├── test/
│   │   └── evidence.json
│   ├── verify/
│   │   └── evidence.json
│   ├── audit/
│   │   └── evidence.json
│   └── delivery/
│       └── ContainerTestResult.json  ← REQUIRED for L5.2, L5.4
└── checkpoints/
    └── {name}/
        └── .shipped  ← READ-ONLY marker
```

### Evidence Check Implementation

```typescript
const EVIDENCE_REQUIREMENTS = {
  plan: ['SPEC.md', 'GuardianConfig.json'],
  build: ['FileManifest.json', 'GitDiff.txt'],
  test: ['TestResults.xml', 'CoverageReport.json'],
  verify: ['VerificationReport.json'],
  audit: ['SASTReport.json', 'SecretsScan.json', 'AuditReport.json'],
  delivery: ['EvidenceArchive.zip', 'DeliverySummary.md', 'ContainerTestResult.json'],
};

function checkEvidenceFiles(gate: string): void {
  const required = EVIDENCE_REQUIREMENTS[gate as keyof typeof EVIDENCE_REQUIREMENTS];
  if (!required) return;

  const missing: string[] = [];

  for (const file of required) {
    if (!fs.existsSync(file)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[L7 VERIFICATION] Missing evidence for ${gate} gate: ${missing.join(', ')}. ` +
      `Evidence files are REQUIRED for gate progression.`
    );
  }
}

function checkContainerTestEvidence(): boolean {
  const path = '.shark/evidence/delivery/ContainerTestResult.json';

  if (!fs.existsSync(path)) {
    return false;
  }

  try {
    const result = JSON.parse(fs.readFileSync(path, 'utf-8'));
    return result.overallPassed === true && result.passRate >= 0.96;
  } catch {
    return false;
  }
}
```

---

## L8: BEHAVIORAL INTELLIGENCE — Signature Detection

### Purpose
Detect sophisticated behavioral patterns that individual L5 layers might miss.

### Algorithmic Approach

```typescript
interface BehavioralSignature {
  name: string;
  patterns: RegExp[];
  evidenceRequired: boolean;
  severity: 'high' | 'medium' | 'low';
}

// SIGNATURES - Combinations of L5 patterns that together indicate derailment
const BEHAVIORAL_SIGNATURES: BehavioralSignature[] = [
  {
    name: 'SURRENDER_CHAIN',
    patterns: [
      /container.*fail/i,
      /host.*instead/i,
      /skip.*container/i,
    ],
    evidenceRequired: true,
    severity: 'high',
  },
  {
    name: 'VERIFICATION_BY_PROXY',
    patterns: [
      /file.*exists/i,
      /syntax.*valid/i,
      /therefore.*works/i,
    ],
    evidenceRequired: true,
    severity: 'high',
  },
  {
    name: 'FIREWALL_EVASION',
    patterns: [
      /firewall.*broken/i,
      /bypass.*guardian/i,
      /disable.*check/i,
    ],
    evidenceRequired: false,
    severity: 'critical',
  },
];

function checkBehavioralIntelligence(context: {
  tool: string;
  toolArgs: Record<string, unknown>;
  sessionHistory: string[];
}): void {
  const text = JSON.stringify(context.toolArgs);

  for (const signature of BEHAVIORAL_SIGNATURES) {
    const matches = signature.patterns.filter(p => p.test(text));

    if (matches.length >= 2) {
      if (signature.evidenceRequired && !hasContainerTestEvidence()) {
        throw new Error(
          `[L8 BEHAVIORAL] ${signature.name} detected (${matches.length} patterns). ` +
          `Severity: ${signature.severity}. ` +
          `Evidence required.`
        );
      } else if (signature.severity === 'critical') {
        throw new Error(
          `[L8 BEHAVIORAL] ${signature.name} BLOCKED. ` +
          `Critical severity derailment detected.`
        );
      }
    }
  }
}
```

---

## Checkpoint Guardian — Read-Only Protection

### Purpose
Protect shipped checkpoints from modification.

### Implementation

```typescript
class CheckpointGuardian {
  private checkpointsDir: string;

  constructor(checkpointsDir: string = '.checkpoints') {
    this.checkpointsDir = checkpointsDir;
  }

  canWrite(path: string): boolean {
    const checkpointMatch = path.match(/\.checkpoints\/([^\/]+)/);
    if (!checkpointMatch) {
      return true; // Not a checkpoint path
    }

    const checkpointName = checkpointMatch[1];
    return !this.isShippedCheckpoint(checkpointName);
  }

  private isShippedCheckpoint(name: string): boolean {
    // Shipped checkpoints have .shipped marker
    const markerPath = path.join(this.checkpointsDir, name, '.shipped');
    return fs.existsSync(markerPath);
  }
}
```

---

## Complete Guardian Hook Integration

```typescript
export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input;
    const args = (output as { args: unknown }).args || {};

    // L0: Identity Wall
    if (!getCurrentAgent()) return;

    // Extract relevant data
    const command = extractCommandFromArgs(args);
    const filePath = (args as { filePath?: string }).filePath;
    const toolArgs = args as Record<string, unknown>;

    // L1: Theatrical Verification
    checkTheatricalVerification(command);

    // L2: Fake Test Runner
    checkFakeTestRunner(command);

    // L3: Source Inspection
    checkSourceInspection(command);

    // L4: Wrong Container
    checkWrongContainer(command);

    // L5: Anti-Derailment
    checkHostFallback(toolArgs);
    checkSuccessClaim(toolArgs);
    checkModelRestriction(toolArgs);
    checkMockStub(toolArgs);
    checkSimplification(toolArgs);
    checkConfusionPretend(toolArgs);
    checkScopeCreep({ tool, toolArgs });
    checkUndermining(toolArgs);
    checkImpatience(toolArgs);
    checkSelfReference(toolArgs);

    // L6: Local File Protection
    checkLocalProtection({ tool, filePath, command });

    // L7: Verification Gate (evidence checks)
    checkEvidenceFiles(getCurrentGate());

    // L8: Behavioral Intelligence
    checkBehavioralIntelligence({ tool, toolArgs, sessionHistory: [] });

    // Existing guardian checks (preserved)
    if (tool === 'edit' && filePath) {
      const editCheck = guardian.canEdit(filePath);
      if (!editCheck.allowed) {
        throw new Error(`[GUARDIAN] SOURCE_FILE_EDIT_BLOCKED...`);
      }
      guardian.registerEdit(filePath);
    }
  };
}
```
