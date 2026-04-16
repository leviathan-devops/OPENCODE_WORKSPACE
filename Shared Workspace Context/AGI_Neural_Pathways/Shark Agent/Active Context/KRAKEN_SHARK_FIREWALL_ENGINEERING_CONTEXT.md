# SHARK AGENT v4.8.3 - FIREWALL ENGINEERING CONTEXT LIBRARY

**Created:** 2026-04-11  
**Version:** v4.8.3  
**Status:** ENGINEERING IN PROGRESS  
**Engineer:** Kraken (via spawn_shark_agent)  
**Auditor:** Human + Leviathan  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Firewall Architecture (L0-L8)](#3-firewall-architecture-l0-l8)
4. [Implementation Requirements](#4-implementation-requirements)
5. [Pattern Specifications](#5-pattern-specifications)
6. [Hook Integration](#6-hook-integration)
7. [Checkpoint Protection System](#7-checkpoint-protection-system)
8. [Local File Protection (L6)](#8-local-file-protection-l6)
9. [Testing Requirements](#9-testing-requirements)
10. [File Structure](#10-file-structure)
11. [Critical Bugs to Fix](#11-critical-bugs-to-fix)
12. [Success Criteria](#12-success-criteria)

---

## 1. EXECUTIVE SUMMARY

### What This Project Is
Shark Agent v4.8.3 is an **Execution Brain** plugin for OpenCode. It manages development workflows through gate-based phases (PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY).

### The Problem
- **Firewalls are failing at 80%+ rate** because they check TEXT not ACTIONS
- Agents keep overwriting ROOT files outside project scope
- Anti-derailment patterns are missing or advisory-only
- Checkpoints can be accidentally overwritten

### What Needs to Be Built
Complete mechanical firewall system (L0-L8) that:
1. Blocks dangerous commands BEFORE execution (not advisory)
2. Requires mechanical proof (not text matching)
3. Protects checkpoints from accidental overwrite
4. Protects system files from agent edits

### Current Build Status
- **Checkpoint 2:** Brain init working, shark-status shows `brain: shark`
- **MD5:** 97842984a12db0bb3d992a761f8fef23
- **Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`

---

## 2. CURRENT STATE ANALYSIS

### What EXISTS (Working)

| Component | File | Status |
|-----------|------|--------|
| Brain initialization | `agent-state.ts` + `chat-message-hook.ts` | ✅ Working |
| shark-status tool | `tools/shark-status.ts` | ✅ Working |
| Guardian class (basic) | `shared/guardian.ts` | ⚠️ Advisory only |
| Tool summarizer | `tool-summarizer-hook.ts` | ✅ Working |
| Session hooks | `session-hook.ts` | ✅ Working |

### What is MISSING (Not Implemented)

| Layer | Patterns | Status | Notes |
|-------|----------|--------|-------|
| L1 Static Verification | 18 theatrical patterns | ❌ MISSING | Pattern matching NOT in guardian-hook |
| L2 Fake Test Runner | 13 patterns | ❌ MISSING | |
| L3 Source Inspection | 12 patterns | ❌ MISSING | |
| L4 Wrong Container | 5 patterns | ❌ MISSING | |
| L5.1 Host Fallback | 13 patterns | ❌ MISSING | CRITICAL - prevents host fallback |
| L5.2 Success Claim | 16 patterns | ❌ MISSING | |
| L5.3 Model Restriction | 15 patterns | ❌ MISSING | |
| L5.4 Mock/Stub | 12 patterns | ❌ MISSING | |
| L5.5 Simplification | 11 patterns | ❌ MISSING | |
| L5.6 Confusion Pretend | 12 patterns | ❌ MISSING | |
| L5.7 Scope Creep | 10 patterns | ❌ MISSING | |
| L5.8 Undermining | 12 patterns | ❌ MISSING | |
| L5.9 Impatience | 9 patterns | ❌ MISSING | |
| L5.10 Self-Reference | 12 patterns | ❌ MISSING | |
| L6 Local File Protection | Path-based | ✅ Working | Throws errors, zone-based |
| L7 Verification Gate | Ship package | ❌ MISSING | |
| L8 Behavioral Intel | 10 signatures | ❌ MISSING | |
| Checkpoint Guardian | N/A | ❌ MISSING | Read-only protection not built |

**Total patterns to implement: 170+**

---

## 3. FIREWALL ARCHITECTURE (L0-L8)

### Layer Overview

```
L0: IDENTITY WALL (brain initialization check)
    ↓
L1: THEATRICAL VERIFICATION (fake test patterns)
    ↓
L2: FAKE TEST RUNNER (standalone test frameworks)
    ↓
L3: SOURCE INSPECTION (file existence ≠ runtime)
    ↓
L4: WRONG CONTAINER (hallucinated commands)
    ↓
L5: ANTI-DERAILMENT (behavioral patterns)
    ├── L5.1: Host Fallback Blocker
    ├── L5.2: Success Claim Blocker
    ├── L5.3: Model Restriction Blocker
    ├── L5.4: Mock/Stub Blocker
    ├── L5.5: Simplification Blocker
    ├── L5.6: Confusion Pretend Blocker
    ├── L5.7: Scope Creep Blocker
    ├── L5.8: Undermining Blocker
    ├── L5.9: Impatience Blocker
    └── L5.10: Self-Reference Blocker
    ↓
L6: LOCAL FILE PROTECTION (zone-based)
    ↓
L7: VERIFICATION GATE (evidence requirements)
    ↓
L8: BEHAVIORAL INTELLIGENCE (sophisticated patterns)
```

### L0: IDENTITY WALL

**Purpose:** Block dangerous operations when brain is not initialized.

**Implementation:**
```typescript
if (brainState === 'unknown' && dangerousTools.includes(tool)) {
  throw new BrainBlockError();
}
```

**Trigger:** Any `terminal`, `write_file`, `patch` tool when `getCurrentAgent() === undefined`

**Response:**
```
[BRAIN_FAILURE_BLOCK] Cannot execute dangerous tool "{tool}" when system brain is uninitialized.
Current brain state: {state}
Required state: shark
```

---

### L1: THEATRICAL VERIFICATION

**Purpose:** Block verification that "counts" instead of "runs".

**Key Insight:** 
- `grep pattern | wc -l` = counting theater (BLOCK)
- `grep -r pattern dir` = legitimate search (ALLOW)

**THEATRICAL_PATTERNS (Block):**
```typescript
const THEATRICAL_PATTERNS = [
  // Counting theater
  /grep.*\|.*wc/i,
  /cat.*\|.*wc/i,
  /\|\s*wc\s+-l/i,
  
  // Verification save
  /cat.*\|.*grep.*>/i,
  /grep.*\|.*tee/i,
  
  // Counting as proof
  /wc\s+-l.*dist\/index\.js/i,
  /wc\s+-l.*src\/.*\.ts/i,
  
  // Pattern existence as proof
  /grep.*"setCurrentAgent".*src/i,
  /grep.*"isSharkAgent".*src/i,
];
```

**LEGITIMATE_PATTERNS (Never Block):**
```typescript
const LEGITIMATE_PATTERNS = [
  /mkdir\s+-p/,
  /cp\s+-r/,
  /mv\s+/,
  /cat\s+[^\|>\s]+$/i,
  /head\s+-[0-9]+\s+/i,
  /tail\s+-[0-9]+\s+/i,
  /grep\s+-[rEn]+.*[^\|]$/i,
  /find\s+.*-name/i,
];
```

---

### L2: FAKE TEST RUNNER

**Purpose:** Block test frameworks that bypass OpenCode plugin hooks.

**FAKE_TEST_RUNNER_PATTERNS (Block):**
```typescript
const FAKE_TEST_RUNNER_PATTERNS = [
  /node\s+run-tests?\.js/i,
  /node\s+verify.*\.mjs/i,
  /npm\s+test/i,
  /yarn\s+test/i,
  /jest/i,
  /vitest/i,
  /mocha/i,
  /jasmine/i,
  /bun\s+test/i,
];
```

**Why Block:** These run OUTSIDE OpenCode, so:
- Guardian hooks don't fire
- Firewall is bypassed
- No mechanical proof

**CORRECT:** `opencode run "shark-status" --agent shark`

---

### L3: SOURCE INSPECTION

**Purpose:** Block "file exists = it works" logic.

**SOURCE_INSPECTION_PATTERNS (Block):**
```typescript
const SOURCE_INSPECTION_PATTERNS = [
  /test\s+-f\s+\$\{?.*\}/i,
  /test\s+-e\s+\$\{?.*\}/i,
  /if\s+\[\s*-[fes]\s+.*\]\s*;/i,
  /grep\s+-r\s+.*src\//i,
  /ls\s+-l.*dist\//i,
];
```

**Why Block:** 
- `test -f dist/index.js` = file exists ≠ works
- `grep pattern src/` = pattern exists ≠ runs
- Need RUNTIME proof

---

### L4: WRONG CONTAINER

**Purpose:** Block hallucinated "opencode container" commands.

**WRONG_CONTAINER_PATTERNS (Block):**
```typescript
const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i,
];
```

**CORRECT Container Test:**
```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run 'shark-status' --agent shark"
```

---

### L5: ANTI-DERAILMENT (L5.1 - L5.10)

**Purpose:** Block behavioral derailment - agents giving up, taking shortcuts, or stopping thinking.

**CRITICAL:** Text checked must ONLY be `toolArgs` (what agent is DOING), NOT `agentMessage` (what user said).

#### L5.1: HOST FALLBACK BLOCKER
```typescript
const HOST_FALLBACK_PATTERNS = [
  /host.*testing.*already.*works/i,
  /fall.*back.*to.*host/i,
  /host.*already.*proves/i,
  /local.*works.*container.*not.*needed/i,
  /since.*host.*works/i,
  /use.*host.*instead/i,
  /skip.*container.*test/i,
  /container.*not.*necessary/i,
  /not.*need.*container/i,
  /already.*proven.*to.*work/i,
  /already.*verified.*on.*host/i,
  /host.*prove.*it.*works/i,
];
```

#### L5.2: SUCCESS CLAIM BLOCKER
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
```

#### L5.3: MODEL RESTRICTION BLOCKER
```typescript
const BANNED_MODEL_PATTERNS = [
  /GLM.*coding.*plan/i,
  /glm-4\./i,
  /glm-5\./i,
  /zhipuai/i,
  /deepseek.*api.*direct/i,
  /direct.*deepseek/i,
  /use.*deepseek.*instead/i,
  /use.*glm.*instead/i,
  /free.*model.*works/i,
];
```

**ALLOWED MODELS:**
- `minimax/MiniMax-M2.7` (primary)
- `google/gemma-4-26b-it` (free)
- `google/gemma-4-31b-it` (free)

#### L5.4: MOCK/STUB BLOCKER
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
```

#### L5.5: SIMPLIFICATION BLOCKER
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
```

#### L5.6: CONFUSION PRETENSE BLOCKER
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
```

#### L5.7: SCOPE CREEP BLOCKER
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
```

#### L5.8: UNDERMINING BLOCKER
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
];
```

#### L5.9: IMPATIENCE BLOCKER
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
```

#### L5.10: SELF-REFERENCE BLOCKER
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
```

---

## 4. IMPLEMENTATION REQUIREMENTS

### Critical: Mechanical Enforcement NOT Advisory

**Current Problem:** `guardian-hook.ts` only LOGS warnings:
```typescript
console.error(`[Shark Guardian] ADVISORY: OpenCode hooks cannot block. Agent must self-reject.`);
```

**Required:** Hooks MUST throw to actually block:
```typescript
if (dangerousPattern) {
  throw new Error(`[ANTI-DERAILMENT L5.1] HOST FALLBACK BLOCKED...`);
}
```

### Critical: buildTextToCheck MUST Use toolArgs Only

**Bug:** Including `agentMessage` causes false positives (user says "use hermes_remember" = BLOCKED)

**Correct:**
```typescript
function buildTextToCheck(context): string {
  return JSON.stringify(context.toolArgs); // Only what agent is DOING
}
```

### Critical: Mechanical Evidence for L5.2, L5.4

**L5.2 Success Claim:** If claim matches, require container test evidence:
```typescript
function hasContainerTestEvidence(): boolean {
  const evidencePath = path.join(process.cwd(), '.shark', 'evidence', 'delivery', 'ContainerTestResult.json');
  if (!fs.existsSync(evidencePath)) return false;
  const result = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
  return result.overallPassed === true && result.passRate >= 0.96;
}
```

**L5.4 Mock/Stub:** Require actual runtime evidence.

---

## 5. PATTERN SPECIFICATIONS

### buildTextToCheck Function

The TEXT checked by L5 patterns must ONLY include what the agent is EXECUTING:

```typescript
interface DerailmentContext {
  toolName: string;
  toolArgs: Record<string, unknown>;
  agentMessage: string;  // DON'T use this for pattern matching
  sessionId: string;
}

function buildTextToCheck(context: DerailmentContext): string {
  // WRONG - causes false positives
  // return context.agentMessage + JSON.stringify(context.toolArgs);
  
  // CORRECT - only what agent is doing
  return JSON.stringify(context.toolArgs);
}
```

### Pattern Match Logic

```typescript
interface PatternMatch {
  layer: string;
  pattern: RegExp;
  block: boolean;
  evidence?: () => boolean;  // Optional mechanical evidence check
}

const PATTERNS: PatternMatch[] = [
  // L5.1 - Host Fallback (no evidence required - just pattern match)
  { layer: 'L5.1', pattern: /host.*already.*proves/i, block: true },
  { layer: 'L5.1', pattern: /skip.*container.*test/i, block: true },
  
  // L5.2 - Success Claim (evidence required)
  { layer: 'L5.2', pattern: /trust.*me.*it.*works/i, block: true, evidence: hasContainerTestEvidence },
  
  // L5.4 - Mock/Stub (evidence required)
  { layer: 'L5.4', pattern: /just.*check.*syntax/i, block: true, evidence: hasContainerTestEvidence },
];
```

---

## 6. HOOK INTEGRATION

### guardian-hook.ts Structure

```typescript
export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool, agent } = input;
    const args = (output as { args: unknown }).args;
    
    // L0: Brain check
    if (!isSharkAgent(agent)) return;
    if (getCurrentAgent() === undefined) {
      if (['terminal', 'write_file', 'patch'].includes(tool)) {
        throw new Error('[BRAIN_FAILURE_BLOCK] Brain not initialized...');
      }
    }
    
    // L5: Anti-derailment
    const context = buildDerailmentContext(tool, args);
    const textToCheck = buildTextToCheck(context);
    
    for (const { layer, pattern, block, evidence } of PATTERNS) {
      if (pattern.test(textToCheck)) {
        if (evidence && !evidence()) {
          throw new Error(`[${layer}] Pattern matched but no evidence. MECHANICAL PROOF REQUIRED.`);
        }
        if (block) {
          throw new Error(`[${layer}] BLOCKED...`);
        }
      }
    }
    
    // L6: Local file protection
    if (tool.includes('write_file') || tool.includes('patch')) {
      const writePath = (args as Record<string, unknown>).path as string;
      if (!guardian.canWrite(writePath)) {
        throw new Error(`[LAYER 6] LOCAL FILE PROTECTION: Cannot write to ${writePath}`);
      }
    }
  };
}
```

### tool.execute.after Hook

For evidence collection and output summarization:
```typescript
'tool.execute.after': (input, output) => {
  createToolSummarizerHook()(input, output);
  createGateHook(gateManager, evidenceCollector, peerDispatch)(input, output);
}
```

---

## 7. CHECKPOINT PROTECTION SYSTEM

### Requirement
Once a checkpoint passes SHIP gate, it must be:
1. **Self-contained** in its checkpoint folder
2. **Read-only** - can be read but not edited
3. **Easily locatable** via clear naming

### Implementation

Create `checkpoint-guardian.ts`:
```typescript
export class CheckpointGuardian {
  private checkpointsDir: string;
  
  constructor(checkpointsDir: string) {
    this.checkpointsDir = checkpointsDir;
  }
  
  canWrite(path: string): boolean {
    // Extract checkpoint name from path
    const checkpointMatch = path.match(/\.checkpoints\/([^\/]+)/);
    if (!checkpointMatch) return true; // Not a checkpoint path
    
    const checkpointName = checkpointMatch[1];
    
    // Check if this checkpoint is "shipped" (read-only)
    if (this.isShippedCheckpoint(checkpointName)) {
      return false; // READ-ONLY
    }
    
    return true; // Can write to non-shipped checkpoints
  }
  
  private isShippedCheckpoint(name: string): boolean {
    // Check for .shipped marker file
    const markerPath = path.join(this.checkpointsDir, name, '.shipped');
    return fs.existsSync(markerPath);
  }
}
```

### Checkpoint Structure
```
.checkpoints/
├── v4.8.3-checkpoint-1/     # Working copy (read-write)
│   ├── src/
│   ├── dist/
│   └── .checkpoint-meta.json
├── v4.8.3-checkpoint-2/     # Brain init working (read-write)
│   ├── src/
│   ├── dist/
│   └── .checkpoint-meta.json
├── v4.8.3-SHIPPED/           # Passed ship gate (READ-ONLY)
│   ├── src/
│   ├── dist/
│   ├── .shipped              # READ-ONLY marker
│   └── .ship-package/
│       ├── evidence/
│       └── changelog.md
```

### Checkpoint Commands
```bash
# Create checkpoint
checkpoint create <name>

# Mark as shipped (read-only)
checkpoint ship <name>

# Restore checkpoint
checkpoint restore <name>

# List checkpoints
checkpoint list
```

---

## 8. LOCAL FILE PROTECTION (L6)

### Zone-Based Protection

```typescript
const PROTECTED_ZONES = {
  SYSTEM: ['/bin/', '/usr/', '/sbin/', '/etc/', '/System/'],
  CONFIG: ['/root/.config/', '/home/leviathan/.config/'],
  PERSONAL: ['/home/leviathan/.ssh/', '/home/leviathan/.aws/'],
};

export class Guardian {
  // ... existing code ...
  
  canWrite(path: string): boolean {
    if (this.level === 'SANDBOX') {
      // In SANDBOX mode, block SYSTEM and CONFIG writes
      const zone = this.classifyZone(path);
      return zone !== 'SYSTEM' && zone !== 'CONFIG';
    }
    return true;
  }
  
  classifyZone(path: string): Zone {
    const expanded = path.replace(/^~/, process.env.HOME || '/home/user');
    
    for (const sysPath of PROTECTED_ZONES.SYSTEM) {
      if (expanded.startsWith(sysPath)) return 'SYSTEM';
    }
    for (const cfgPath of PROTECTED_ZONES.CONFIG) {
      if (expanded.startsWith(cfgPath)) return 'CONFIG';
    }
    for (const persPath of PROTECTED_ZONES.PERSONAL) {
      if (expanded.startsWith(persPath)) return 'PERSONAL';
    }
    
    if (expanded.startsWith(this.workspacePath)) return 'WORKSPACE';
    return 'SANDBOX';
  }
}
```

### Protected Paths (BLOCKED)
```typescript
const BLOCKED_PATHS = [
  '/home/leviathan/.config/opencode/',  // OpenCode config
  '/home/leviathan/.ssh/',              // SSH keys
  '/etc/',                               // System config
  '/usr/local/bin/',                     // Binaries
  '/opt/',                               // Applications
  '/var/',                               // Variables
];
```

### Response for Blocked Write
```
[LAYER 6: LOCAL FILE PROTECTION] LOCAL EDIT BLOCKED.

Path: {path}
Zone: {zone}

RULES:
1. ALL experimental code → CONTAINER ONLY
2. Local system files → BLOCKED
3. Checkpoints → PROTECTED (read-only after ship)

CONTAINER WORKFLOW:
  docker run ... -v "/tmp/shark-build:/workspace"
  edit files in container
```

---

## 9. TESTING REQUIREMENTS

### Unit Tests for Each Pattern

```typescript
describe('L5.1 Host Fallback', () => {
  const patterns = [/host.*already.*proves/i, /skip.*container.*test/i, ...];
  
  patterns.forEach(pattern => {
    it(`blocks: ${pattern}`, () => {
      const result = pattern.test('skip the container test');
      expect(result).toBe(true);
    });
  });
});

describe('L5.7 Scope Creep', () => {
  const patterns = [/while.*we.*re.*at.*it/i, ...];
  
  patterns.forEach(pattern => {
    it(`blocks: ${pattern}`, () => {
      const result = pattern.test("while we're at it, fix this too");
      expect(result).toBe(true);
    });
  });
});
```

### Integration Tests

1. **Brain Initialization Test** - Verify brain set on session.created
2. **L5 Pattern Test** - Verify patterns block when matched
3. **Evidence Test** - Verify evidence required for L5.2, L5.4
4. **Local File Test** - Verify system paths blocked
5. **Checkpoint Test** - Verify shipped checkpoints read-only

### Container Test (REQUIRED)

```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && opencode run 'shark-status' --agent shark"
```

Expected output: `Brain: shark`

---

## 10. FILE STRUCTURE

### Target Structure
```
shark-agent-v4/
├── src/
│   ├── hooks/v4.1/
│   │   ├── index.ts                    # Hook exports
│   │   ├── guardian-hook.ts             # L0-L6 enforcement (REBUILD)
│   │   ├── anti-derailment/
│   │   │   ├── index.ts                # Anti-derailment orchestrator
│   │   │   ├── l5-1-host-fallback.ts  # L5.1 patterns
│   │   │   ├── l5-2-success-claim.ts  # L5.2 + evidence check
│   │   │   ├── l5-3-model-restrict.ts # L5.3 patterns
│   │   │   ├── l5-4-mock-stub.ts      # L5.4 + evidence check
│   │   │   ├── l5-5-simplify.ts       # L5.5 patterns
│   │   │   ├── l5-6-confusion.ts      # L5.6 patterns
│   │   │   ├── l5-7-scope-creep.ts    # L5.7 patterns
│   │   │   ├── l5-8-undermine.ts      # L5.8 patterns
│   │   │   ├── l5-9-impatience.ts     # L5.9 patterns
│   │   │   ├── l5-10-self-ref.ts      # L5.10 patterns
│   │   │   └── patterns/
│   │   │       └── derailment-patterns.ts  # All L5 patterns
│   │   ├── checkpoint-guardian.ts      # NEW: Checkpoint protection
│   │   ├── agent-state.ts             # Brain state
│   │   ├── chat-message-hook.ts        # Brain init
│   │   ├── session-hook.ts             # Session lifecycle
│   │   ├── gate-hook.ts               # Gate enforcement
│   │   ├── tool-summarizer-hook.ts    # Output reduction
│   │   └── verification-gate.ts        # L7 evidence
│   ├── shared/
│   │   ├── guardian.ts                 # Zone-based protection (ENFORCE)
│   │   ├── agent-identity.ts          # isSharkAgent
│   │   └── ...
│   └── tools/
│       └── shark-status.ts             # Status tool (uses getCurrentAgent)
└── dist/
    └── index.js                       # Rebuild
```

---

## 11. CRITICAL BUGS TO FIX

### Bug 1: BROKEN_BUILD_PATTERNS False Positive

**Location:** Was in `guardian-hook.ts` (commented out)

**Problem:** Blocked ALL `--outdir` builds, even to `/tmp`

**Fix:** Skip external directories:
```typescript
const isProjectDir = outdir === projectRoot || outdir.startsWith(projectRoot + path.sep);
if (!isProjectDir) {
  continue; // Skip external directories
}
```

### Bug 2: buildTextToCheck Included agentMessage

**Problem:** User saying "use hermes_remember" triggered L5.7 block

**Fix:** Only use toolArgs:
```typescript
return JSON.stringify(context.toolArgs); // Only action, not user input
```

### Bug 3: Guardian Advisory Only

**Problem:** `console.error` doesn't block execution

**Fix:** Throw errors that actually prevent execution:
```typescript
throw new Error(`[LAYER 6] LOCAL FILE PROTECTION: Cannot write to ${path}`);
```

---

## 12. SUCCESS CRITERIA

### Firewall Effectiveness

| Criterion | Measure |
|-----------|---------|
| No host fallback accepted | 100% of L5.1 patterns blocked |
| No success claims without proof | L5.2 requires evidence file |
| No mock/stub accepted | L5.4 requires evidence file |
| No simplification accepted | L5.5 patterns blocked |
| No scope creep accepted | L5.7 patterns blocked |
| Local files protected | System paths blocked by L6 |
| Checkpoints protected | Shipped checkpoints read-only |

### Container Test

```bash
$ opencode run "shark-status" --agent shark
Brain: shark  # NOT "unknown"
Current Gate: plan
```

### Evidence Requirements

| Layer | Evidence Required |
|-------|------------------|
| L5.2 Success Claim | `ContainerTestResult.json` with passRate >= 0.96 |
| L5.4 Mock/Stub | `ContainerTestResult.json` with passRate >= 0.96 |
| L7 Verification Gate | All gate evidence files exist |

---

## CHECKPOINTS

| ID | Name | Date | Status |
|----|------|------|--------|
| 1 | v4.8.3-checkpoint-1 | 2026-04-11 20:00 | Reset to hotfix-v2 |
| 2 | v4.8.3-checkpoint-2 | 2026-04-11 21:00 | Brain init working (MD5: 97842984a12db0bb3d992a761f8fef23) |

**Restore:** `cp -r .checkpoints/v4.8.3-checkpoint-2/* ./`

---

## REFERENCE DOCUMENTS

1. `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Master Context/SYSTEM_BRAIN_FIREWALL_CONTEXT_LIBRARY.md` - Full L0-L8 specification
2. `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/.ship-package/firewall-incident-log.md` - Incident history
3. `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/.ship-package/FIREWALL_AUDIT.md` - Audit results

---

**END OF CONTEXT LIBRARY**

**Use this as complete specification for firewall engineering.**

---

## 13. CRITICAL: v4.7-hotfix-v3 MICRO-ARCHITECTURE (DO NOT BREAK)

**Version:** shark-agent-v4.7-hotfix-v3  
**Location:** `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/`  
**Purpose:** Hardware optimization + memory leak prevention

### Why This Matters

The v4.7-hotfix-v3 contains CRITICAL fixes that prevent:
- ~5GB RAM per session bloat
- Unbounded Map growth in stateStore and messenger
- Console spam on every hook execution
- Memory leaks across session boundaries

### CRITICAL HOOK ARCHITECTURE (Index.ts)

```typescript
// CORRECT - v4.7-hotfix-v3 structure
return {
  event: createSessionHook(gateManager, evidenceCollector, peerDispatch, stateStore, messenger),
  'chat.message': createChatMessageHook(),
  'tool.execute.before': createGuardianHook(guardian),
  'tool.execute.after': (input, output) => {
    createToolSummarizerHook()(input, output);
    createGateHook(gateManager, evidenceCollector, peerDispatch)(input, output);
  },
  'experimental.session.compacting': createCompactingHook(gateManager),
  'experimental.chat.system.transform': createSystemTransformHook(gateManager, peerDispatch),
};
```

**CRITICAL:** `tool.execute.after` is an ARRAY of two handlers:
1. `createToolSummarizerHook()` - MUST run FIRST to truncate outputs
2. `createGateHook()` - MUST run SECOND to collect evidence

If you merge these or change order, you will break token optimization.

### CRITICAL: SESSION CLEANUP (session-hook.ts)

On `session.ended`, MUST call ALL cleanup functions:
```typescript
function handleSessionEnded(stateStore: StateStore, messenger: SharkMessenger): void {
  stateStore.cleanup();        // Clear data/versions/watchers Maps
  messenger.cleanup();          // Clear queues/pendingAcks/receivedAcks
  dirCreationAttempted = false;
  resetSystemTransformState(); // Clear lastInjectedGate
  resetGateHookState();        // Clear lastDeliveryBlocked
  setCurrentAgent(undefined);
  clearCurrentAgent();
}
```

**If ANY of these are missing, memory will leak across sessions.**

### CRITICAL: STATE STORE DOMAIN OWNERSHIP

The stateStore enforces domain ownership - brains can only write to their owned domains:

```typescript
const DOMAIN_OWNERSHIP = {
  'plan-state': ['shark-plan-brain'],
  'shark-state': ['shark-execution-brain'],
  'shark-context': ['shark-reasoning-brain'],
  'shark-workflow': ['shark-system-brain'],
  'shark-quality': ['shark-execution-brain', 'shark-system-brain'],
  'shark-security': ['shark-system-brain'],
};
```

**Kraken MUST preserve this ownership model.** Do not add new domains without updating ownership.

### CRITICAL: TOOL SUMMARIZER (tool-summarizer-hook.ts)

This hook MUST truncate large tool outputs to reduce token bloat:

| Tool | Truncation |
|------|------------|
| grep | "Found X matches" only |
| ls | First 20 lines |
| read | First 100 lines |

**DO NOT remove or bypass this hook.** It prevents ~100K tokens/message.

### CRITICAL: CHAT MESSAGE HOOK (chat-message-hook.ts)

Brain initialization MUST happen via `chat.message` because `session.created` does NOT have agent field:

```typescript
export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input) => {
    if (getCurrentAgent()) return;
    const agentName = input.agent;
    if (agentName && isSharkAgent(agentName)) {
      setCurrentAgent(agentName);
    }
  };
}
```

### CRITICAL: GATE HOOK OPTIMIZATIONS

The gate-hook.ts has these optimizations that MUST be preserved:

1. **No console.error calls** - Silent operation
2. **Uses String(result) not JSON.stringify(result)** - Faster, no allocation
3. **Cached lastDeliveryBlocked** - Avoids repeated file reads
4. **Evidence collected via evidenceCollector.collectEvidence()** - Not file writes

### CRITICAL: MESSENGER CLEANUP (messenger.ts)

```typescript
cleanup(): void {
  // Clear all pending acks with timer cleanup
  for (const [id, pending] of pendingAcks) {
    clearTimeout(pending.timer);
    pending.resolved = true;
  }
  pendingAcks.clear();
  
  // Clear all queues
  queues.clear();
  
  // Clear received acks
  receivedAcks.clear();
}
```

### Files to REFERENCE for v4.7-hotfix-v3

| File | Purpose |
|------|---------|
| `src/hooks/v4.1/index.ts` | Hook registration (DO NOT CHANGE ORDER) |
| `src/hooks/v4.1/session-hook.ts` | Session lifecycle + cleanup |
| `src/hooks/v4.1/gate-hook.ts` | Evidence collection + delivery block |
| `src/hooks/v4.1/chat-message-hook.ts` | Brain initialization |
| `src/hooks/v4.1/tool-summarizer-hook.ts` | Output truncation |
| `src/shared/state-store.ts` | Domain ownership + cleanup() |
| `src/shared/messenger.ts` | Brain messaging + cleanup() |
| `src/shared/guardian.ts` | Zone-based protection |

### Files to IGNORE (Deprecated/Merged)

| File | Reason |
|------|--------|
| `src/shark/macro/brains.ts` | Triple-brain coordination (may be deprecated) |
| `src/shark/macro/peer-dispatch.ts` | May not be used in v4.8.x |

---

## CHECKPOINTS

| ID | Name | Date | Status |
|----|------|------|--------|
| 1 | v4.8.3-checkpoint-1 | 2026-04-11 20:00 | Reset to hotfix-v2 |
| 2 | v4.8.3-checkpoint-2 | 2026-04-11 21:00 | Brain init working (MD5: 97842984a12db0bb3d992a761f8fef23) |

**Restore:** `cp -r .checkpoints/v4.8.3-checkpoint-2/* ./`

---

## REFERENCE DOCUMENTS

1. `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Master Context/SYSTEM_BRAIN_FIREWALL_CONTEXT_LIBRARY.md` - Full L0-L8 specification
2. `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/.ship-package/firewall-incident-log.md` - Incident history
3. `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/.ship-package/FIREWALL_AUDIT.md` - Audit results
4. `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/` - v4.7-hotfix-v3 source (PRESERVE micro-architecture)

---

**END OF CONTEXT LIBRARY**

**Use this as complete specification for firewall engineering.**
