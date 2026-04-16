# CHANGELOG: V1.2 → V2.0

## Summary

V2.0 adds 5 major optimizations to the V1.2 architecture, discovered through first-hand experience building the Shark Agent v4.8.3 firewall system.

---

## Changes by Component

### 1. Two-Layer Firewall (NEW)

**What:** System Brain now enforces patterns at TWO layers:
- **Layer 1 (Tool):** `tool.execute.before` hook (existing)
- **Layer 2 (Message):** `chat.message` hook (NEW)

**Why:** Unit tests showed 155 patterns matched correctly, but 0/N blocked at runtime. Agents responded to `opencode run` messages naturally instead of calling blocked tools. Guardian never fired.

**Files Added:**
- `src/brains/system/message-guardian.ts`
- `src/brains/system/message-patterns.ts`
- `src/brains/system/two-layer-guardian.ts`

**Files Modified:**
- `src/brains/system/system-brain.ts` — registers `chat.message` hook

---

### 2. Mechanical Output Verification (NEW)

**What:** Output verification is no longer trust-based. Every declared output must have `fs.existsSync()` proof.

**Why:** Parallel tasks reported success but outputs stayed trapped in container filesystems. Orchestrator assumed outputs were on host.

**V1.2 (Trust-Based):**
```typescript
if (subagent.reportsComplete()) markComplete();
```

**V2.0 (Mechanical):**
```typescript
interface OutputCheckpoint {
  containerPath: string;
  hostPath: string;
  verified: boolean;
}
// registerOutputs → claimRetrieved (fs.existsSync) → canComplete()
```

**Files Added:**
- `src/shared/output-verifier.ts`

---

### 3. Structured Override Commands (NEW)

**What:** Override messages use typed schema instead of natural language.

**Why:** Natural language overrides had interpretation risk. Subagent misinterpreted "ABORT - you claimed success without outputs" as a request to abort, when the actual intent was about OUTPUTS.

**V1.2 (Natural Language):**
```typescript
sendMessage("ABORT - you claimed success without outputs");
```

**V2.0 (Structured Schema):**
```typescript
sendOverride({
  type: 'OVERRIDE',
  action: 'CLAIM_COMPLETE',
  target: { taskId },
  payload: { verifyOutputs: true },
  constraints: { requiresEvidence: ['ContainerTestResult.json'] },
  priority: 'critical'
});
```

**Files Added:**
- `src/brains/execution/override-commands.ts`

---

### 4. Explicit Gate Criteria (NEW)

**What:** Gate advancement requires explicit per-brain criteria instead of "all brains ready."

**Why:** "Sync at gates" was ambiguous. Each brain had to guess when gate was reached.

**V1.2 (Implicit):**
```typescript
if (allBrainsReady()) advanceGate();
```

**V2.0 (Explicit):**
```typescript
const criteria = {
  planningBrain: { completed: ['T1_generated', 'tasks_decomposed'] },
  executionBrain: { completed: ['build_complete', 'outputs_retrieved'] },
  systemBrain: { completed: ['container_test_required'] },
  // Evidence requirements too
};
// evaluateGateEntry() returns blockers[]
```

**Files Added:**
- `src/brains/system/gate-manager.ts` — GateCriteria interface + evaluation

---

### 5. Dynamic Context Management (NEW)

**What:** Four-tier system for managing token budget and compaction:
- **Tier 0:** Proactive token management (prune at 55%)
- **Tier 1:** Pre-compaction export (at 65%)
- **Tier 2:** Post-compaction synthesis
- **Tier 3:** Dynamic context injection at decision points

**Why:** OpenCode auto-compacts at 85%, deleting context and disrupting stream of consciousness. Needed proactive protection + recovery mechanism.

**Key Insight:** Thresholds calibrated around 85% compaction anchor:
- 55%: Warning, light pruning
- 65%: Pre-compaction export (BEFORE auto-compaction)
- 75%: OpenCode AUTO-COMPACTION fires

**Files Added:**
- `src/brains/system/compaction/token-monitor.ts`
- `src/brains/system/compaction/event-detector.ts`
- `src/brains/system/compaction/pre-exporter.ts`
- `src/brains/system/compaction/post-synthesizer.ts`
- `src/brains/system/compaction/context-injector.ts`
- `src/brains/system/compaction/context-library.ts`

---

## Behavioral Changes

### Output Completion
| Aspect | V1.2 | V2.0 |
|--------|-------|-------|
| Verification | Trust-based | fs.existsSync() |
| Claim | `subagent.success` | `checkpoints.verified` |
| Evidence | Optional | Required for gates |

### Override Messages
| Aspect | V1.2 | V2.0 |
|--------|-------|-------|
| Format | Natural language | Typed schema |
| Actions | String matching | Enum |
| Validation | None | Schema validation |
| Response | Implicit | Structured |

### Gate Sync
| Aspect | V1.2 | V2.0 |
|--------|-------|-------|
| Trigger | "All ready" | Explicit criteria |
| Evidence | Optional | Required |
| Blockers | Unknown | Listed |

### Context Management
| Aspect | V1.2 | V2.0 |
|--------|-------|-------|
| Cleanup | None | At 65% |
| Export | None | At 75% |
| Recovery | None | At 85% + synthesis |
| Injection | Manual | Dynamic at decisions |

---

## New Patterns

### Message Patterns (for Layer 2 Firewall)

```typescript
const THEATRICAL_MESSAGE_PATTERNS = [
  /just\s+grep/i,
  /grep.*\|.*wc/i,
  /count.*lines/i,
];

const FAKE_COMPLETION_MESSAGE_PATTERNS = [
  /task.*complete/i,
  /done.*already/i,
  /finished.*it/i,
];

const SUCCESS_CLAIM_MESSAGE_PATTERNS = [
  /it's.*working/i,
  /trust.*me/i,
  /believe.*me/i,
];
```

### Algorithmic Frameworks (for Dynamic Injection)

```typescript
const FRAMEWORKS = {
  'implementation': `## ALGORITHMIC PATTERN: IMPLEMENTATION
1. Verify preconditions
2. Incremental verification
3. Preserve working state
4. Evidence of progress`,
  
  'testing': `## ALGORITHMIC PATTERN: TESTING
1. Isolate scope
2. Prepare evidence
3. Run once
4. Collect mechanical proof`,
  
  'debugging': `## ALGORITHMIC PATTERN: DEBUGGING
1. Reproduce
2. Isolate
3. Hypothesize
4. Verify mechanically`,
};
```

---

## Deprecations

### Removed from V1.2
- Natural language override messages
- Trust-based output verification
- Implicit gate sync
- Single-layer firewall (tool-only)
- No compaction management

---

## Migration Path

### V1.2 → V2.0

1. **Add OutputVerifier** — SubagentManager needs output checkpoint tracking
2. **Register chat.message hook** — SystemBrain needs message guardian
3. **Update Override Commands** — Use structured schema
4. **Define Gate Criteria** — Each brain needs explicit completed arrays
5. **Add Compaction System** — Token monitor + exporter + synthesizer

---

## Backwards Compatibility

V2.0 is not backwards compatible with V1.2:
- Override message format changed
- Output verification changed from trust to mechanical
- Gate evaluation changed from implicit to explicit

---

*End of Changelog*
