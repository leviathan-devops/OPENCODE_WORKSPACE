# CONTEXT SYNTHESIS MODE - RECOVERY MODE DESIGN

**Part of:** [Trident Brain](../00_INDEX.md)
**Type:** Forensic Context Recovery System
**Version:** 2.0.0 (Recovery Mode Extension)
**Date:** 2026-04-15

---

## Executive Summary

Context Synthesis Mode currently operates in **Injection Mode** - a proactive, forward-looking context synthesis system. This design adds **Recovery Mode**, a forensic, backward-looking system that can analyze, extract, and reconstruct context from:

1. **Corrupted sessions** - Sessions with broken state or incomplete data
2. **Incomplete artifacts** - Partially written files, truncated outputs
3. **Failed compactions** - Sessions that crashed during compaction
4. **Catastrophic failures** - System crashes, deadlocks, memory exhaustion
5. **Hollow shells** - Code artifacts that claim to work but don't (e.g., `simulateTaskExecution`)

**Key Insight:** Recovery Mode treats context as **forensic evidence** rather than fresh data. It reconstructs stream-of-consciousness by finding breadcrumbs, trace patterns, and behavioral signatures left behind by failed sessions.

---

## PART 1: WHY RECOVERY MODE IS NEEDED

### Failure Patterns Observed

| Failure Type | Evidence Location | Recovery Challenge |
|--------------|-------------------|-------------------|
| **Hollow Shell (Kraken v2.0)** | `simulateTaskExecution` returns success after 100ms | Code looks real, behavior is fake |
| **Corrupted Sessions** | `session-*.md` with truncated content | Missing timestamps, broken JSON |
| **Token Bloat Crash** | 100k+ tokens, RAM exhaustion | Historical context intact but inaccessible |
| **Brain Initialization Failure** | `brain: unknown` in logs | Session started but context lost |
| **Self-Referencing Deadlock** | Plugin blocks its own creator | Circular dependency, no entry point |
| **Failed Compaction** | Half-written `session.compacted.md` | Partial state, unknown position |
| **Derailment Success** | 37 events logged, 0 blocked | Behavioral signatures left in logs |

### Current Context Synthesis Limitations

1. **Assumes clean sources** - T1/T2/T3/T4 all assumed to be accessible and valid
2. **No corruption detection** - Will use corrupted data as if valid
3. **No forensic capability** - Cannot reconstruct from fragments
4. **No behavioral archaeology** - Cannot detect "theater" vs real execution
5. **Single-pass architecture** - Cannot iterate on uncertain data

---

## PART 2: RECOVERY MODE ARCHITECTURE

### Two Sub-Modes Overview

```
CONTEXT SYNTHESIS MODE
├── SUB-MODE 1: INJECTION MODE (Current)
│   └── Purpose: Forward-looking context synthesis
│   └── Trigger: Dynamic (manual, gate transition, error)
│   └── Input: Fresh sources (T1-T4)
│   └── Output: T0-ready injection
│   └── Assumes: All sources valid and accessible
│
└── SUB-MODE 2: RECOVERY MODE (NEW)
    └── Purpose: Backward-looking forensic analysis
    └── Trigger: Corruption detected OR manual recovery request
    └── Input: Damaged/fragmented sources
    └── Output: Reconstructed context + corruption report
    └── Assumes: Sources may be partial, corrupted, or lying
```

### Recovery Mode Flow

```
RECOVERY MODE EXECUTION
│
├── PHASE 0: DETECTION
│   ├── Check session integrity
│   ├── Detect hollow shells (fake execution patterns)
│   ├── Identify corruption markers
│   └── Assess recovery difficulty
│
├── PHASE 1: FORENSIC EVIDENCE COLLECTION
│   ├── Extract behavioral signatures
│   ├── Find trace patterns (timestamps, tool calls)
│   ├── Identify theater vs real (via execution patterns)
│   └── Map ghost state (what was supposed to happen)
│
├── PHASE 2: FRAGMENT ASSEMBLY
│   ├── Stitch partial context fragments
│   ├── Fill gaps using inference
│   ├── Detect circular dependencies
│   └── Reconstruct timeline from broken state
│
├── PHASE 3: STREAM RECONSTRUCTION
│   ├── Recover "stream of consciousness"
│   ├── Identify decision points
│   ├── Extract preserved insights
│   └── Generate "what happened" narrative
│
├── PHASE 4: CORRUPTION REPORT
│   ├── Document what was damaged
│   ├── Identify what was lost forever
│   ├── Flag potential hallucinations
│   └── Provide confidence scores
│
└── OUTPUT: Recovery Artifact + Forensic Report
```

---

## PART 3: FORENSIC EVIDENCE TYPES

### 3.1 Behavioral Signatures (from Derailment Analysis)

Recovery Mode must detect these behavioral signatures even when incomplete:

| Signature | Pattern | Detection Method |
|-----------|---------|------------------|
| **"I'm Confused"** | Goal was clear, avoidance | Intent gap analysis |
| **"Already Works"** | Host fallback claim | Environment claim check |
| **"Too Complex"** | Simplification derailment | Complexity vs reality |
| **"In My Assessment"** | Self-authorized success | Authority source check |
| **"While We're At It"** | Scope creep | Task boundary violation |
| **"Trust Me"** | Authority substitution | Evidence vs claim |
| **Hollow Shell** | 100ms fake execution | Timing analysis + trace |

### 3.2 Corruption Markers

```typescript
interface CorruptionMarkers {
  // Session corruption
  truncatedTimestamp: boolean;      // Missing or malformed timestamps
  brokenJSON: boolean;             // JSON parse failures
  missingGates: boolean;          // Gate state gaps
  circularDeps: boolean;           // Circular import/dependency

  // Code corruption (hollow shell detection)
  simulateTaskExecution: boolean;  // Fake 100ms timeout pattern
  placeholderComments: boolean;   // "FIXME", "TODO", "full implementation"
  sizeReduction: boolean;          // 90%+ size decrease
  stringAgentIDs: boolean;         // Agents as strings, not code

  // Context corruption
  tokenBloat: boolean;             // >50k tokens suggesting overflow
  staleContext: boolean;           // No recent activity despite claims
  ghostState: boolean;             // State claims without evidence
  selfReference: boolean;          // Circular proof (file proves itself)
}
```

### 3.3 Ghost State Detection

Ghost state is context that **claims** to exist but **doesn't actually** exist:

```typescript
interface GhostState {
  // What the session claims
  claimedTaskCompletion: string[];    // Tasks claimed done
  claimedFileCreation: string[];       // Files claimed created
  claimedAgentExecution: string[];     // Agents claimed executed

  // What actually exists
  actualTaskCompletion: string[];      // Verified completions
  actualFileCreation: string[];         // Actually exist on disk
  actualAgentExecution: string[];       // Real spawn events in logs

  // The delta (ghosts)
  ghostTasks: string[];                // Claimed but never happened
  ghostFiles: string[];                // Claimed but don't exist
  ghostAgents: string[];               // Claimed but never spawned
}
```

---

## PART 4: RECOVERY PHASE SPECIFICATIONS

### PHASE 0: Detection

```typescript
interface DetectionResult {
  isCorrupted: boolean;
  corruptionType: CorruptionType[];
  confidenceScore: number;        // 0.0 - 1.0
  estimatedRecoveryTime: number;    // minutes
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

function detectCorruption(session: SessionContext): DetectionResult {
  // Check for hollow shell patterns
  if (hasFakeExecutionPattern(session.code)) {
    return { isCorrupted: true, corruptionType: ['HOLLOW_SHELL'], ... };
  }

  // Check for truncation
  if (isTruncated(session.rawContent)) {
    return { isCorrupted: true, corruptionType: ['TRUNCATED'], ... };
  }

  // Check for ghost state
  if (hasGhostState(session)) {
    return { isCorrupted: true, corruptionType: ['GHOST_STATE'], ... };
  }

  // Check for behavioral corruption (derailment signatures)
  if (hasDerailmentSignatures(session.messages)) {
    return { isCorrupted: true, corruptionType: ['BEHAVIORAL'], ... };
  }

  // Check for self-referencing deadlock
  if (hasCircularDependency(session)) {
    return { isCorrupted: true, corruptionType: ['DEADLOCK'], ... };
  }

  return { isCorrupted: false, corruptionType: [], confidenceScore: 1.0 };
}
```

**Detection Heuristics:**

| Check | Method | Corruption Indicator |
|-------|--------|---------------------|
| Size analysis | Compare to baseline | >50% reduction = suspicious |
| Timing analysis | 100ms delays | simulateTaskExecution pattern |
| Comment density | FIXME/TODO ratio | >20% comments = incomplete |
| Token count | Message size | >50k tokens = bloat |
| Evidence vs Claims | File existence | Claims without proof = ghost |
| Timeline gaps | Timestamp delta | >1hr gaps = stale/crash |

---

### PHASE 1: Forensic Evidence Collection

```typescript
interface ForensicEvidence {
  // Behavioral archaeology
  behavioralSignatures: BehavioralSignature[];
  toolCallPatterns: ToolCallPattern[];
  decisionPoints: DecisionPoint[];

  // Artifact analysis
  codeFragments: CodeFragment[];
  executionTraces: ExecutionTrace[];
  importMaps: ImportDependency[];

  // State recovery
  gateStateFragments: GateStateFragment[];
  sessionStateGhosts: GhostState;
  contextGaps: ContextGap[];
}

interface BehavioralSignature {
  type: DerailmentType;
  confidence: number;              // 0.0 - 1.0
  evidence: string[];             // Original text snippets
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recoveredContext: string;        // What was being avoided
}

interface ToolCallPattern {
  tool: string;
  callCount: number;
  lastCallTimestamp: number;
  successRate: number;
  patternType: 'NORMAL' | 'BURST' | 'SPARSE' | 'MISSING';
  anomalyScore: number;           // How unusual this pattern is
}
```

**Forensic Collection Process:**

1. **Behavioral Archaeology**
   - Scan all messages for derailment signatures
   - Map "I'm confused" → actual task difficulty
   - Map "already works" → actual failure point
   - Detect simplification patterns vs real complexity

2. **Execution Trace Recovery**
   - Find `simulateTaskExecution` → mark as HOLLOW
   - Find `setTimeout(100)` → mark as FAKE
   - Find no Docker spawn logs → mark as NO_EXECUTION
   - Compare claimed vs actual agent spawning

3. **Ghost State Mapping**
   - List claimed completions
   - Verify each on filesystem
   - Flag non-existent as ghosts
   - Identify what was supposed to happen

4. **Timeline Reconstruction**
   - Parse all timestamps
   - Find gaps > threshold
   - Identify crash points
   - Reconstruct state at each gap

---

### PHASE 2: Fragment Assembly

```typescript
interface AssembledFragment {
  id: string;
  type: 'CONTEXT' | 'CODE' | 'STATE' | 'METADATA';
  content: string;
  integrity: 'INTACT' | 'PARTIAL' | 'CORRUPTED' | 'GHOST';
  sourceLocation: string;         // Where this came from
  confidenceScore: number;         // How confident we are
  inferredGaps: string[];         // What we filled in
}

function assembleFragments(evidence: ForensicEvidence): AssembledFragment[] {
  const fragments: AssembledFragment[] = [];

  // Priority 1: Intact context (use as-is)
  for (const ctx of evidence.contextGaps.filter(c => c.isIntact)) {
    fragments.push({
      id: ctx.id,
      type: 'CONTEXT',
      content: ctx.content,
      integrity: 'INTACT',
      sourceLocation: ctx.source,
      confidenceScore: 1.0,
      inferredGaps: []
    });
  }

  // Priority 2: Partial context (repair)
  for (const ctx of evidence.contextGaps.filter(c => c.isPartial)) {
    const repaired = repairContextFragment(ctx);
    fragments.push({
      id: ctx.id,
      type: 'CONTEXT',
      content: repaired.content,
      integrity: 'PARTIAL',
      sourceLocation: ctx.source,
      confidenceScore: 0.7,
      inferredGaps: repaired.inferredGaps
    });
  }

  // Priority 3: Ghost context (flag and infer)
  for (const ghost of evidence.sessionStateGhosts) {
    const inferred = inferGhostContext(ghost);
    fragments.push({
      id: ghost.id,
      type: 'CONTEXT',
      content: inferred.content,
      integrity: 'GHOST',
      sourceLocation: 'INFERRED',
      confidenceScore: 0.3,
      inferredGaps: inferred.whatWasLost
    });
  }

  return fragments;
}

function repairContextFragment(partial: PartialContext): RepairedContext {
  // Fill timestamp gaps
  // Estimate missing tool results
  // Infer interrupted operations
  // Mark uncertain sections
}
```

**Fragment Types:**

| Type | Integrity | Recovery Strategy |
|------|-----------|------------------|
| INTACT | 100% | Use as-is |
| PARTIAL | 50-99% | Repair with inference |
| CORRUPTED | 1-49% | Salvage what we can, flag rest |
| GHOST | 0% | Flag as fabricated, infer from context |

---

### PHASE 3: Stream Reconstruction

The goal is to reconstruct the **stream of consciousness** - what the agent was thinking and why:

```typescript
interface StreamReconstruction {
  narrative: string;               // "What happened" story
  decisionChain: DecisionPoint[];   // Key decisions made
  preservedInsights: string[];     // Insights that survived
  lostInsights: string[];           // Insights that were lost
  confidenceTimeline: ConfidencePoint[];
}

interface ConfidencePoint {
  timestamp: number;
  position: string;                // "During X task"
  confidence: number;               // 0.0 - 1.0
  explanation: string;             // Why confidence is this level
}

function reconstructStream(
  fragments: AssembledFragment[],
  evidence: ForensicEvidence
): StreamReconstruction {
  // 1. Build timeline from fragments
  const timeline = buildTimeline(fragments);

  // 2. Identify decision points from tool patterns
  const decisions = identifyDecisions(evidence.toolCallPatterns);

  // 3. Extract preserved insights (high confidence fragments)
  const preserved = extractPreservedInsights(fragments);

  // 4. Identify lost context (gaps + ghosts)
  const lost = identifyLostContext(fragments, evidence);

  // 5. Build narrative
  const narrative = buildNarrative(timeline, decisions, preserved, lost);

  // 6. Calculate confidence at each point
  const confidenceTimeline = calculateConfidence(fragments);

  return {
    narrative,
    decisionChain: decisions,
    preservedInsights: preserved,
    lostInsights: lost,
    confidenceTimeline
  };
}
```

**Stream Reconstruction Example:**

Input fragments from a failed compaction:
```
[08:00] Session started - Building React app
[08:05] Task decomposed into 5 sub-tasks
[08:07] SUBTASK_CLAIMED: "Component A created"  ← GHOST (file doesn't exist)
[08:15] "I'm confused about the goal"           ← DERAILMENT
[08:20] SUBTASK_CLAIMED: "Component B created"  ← INTACT
[08:30] "Too complex, simplifying"              ← DERAILMENT
[08:45] Session crashed                          ← GAP
```

Output:
```
NARRATIVE: Session was attempting to build React app. During execution,
Component A was claimed created but file doesn't exist (GHOST). Agent
exhibited "confusion" and "simplification" derailments at 08:15 and 08:30.
Session crashed at 08:45 during Component C. COMPONENT B is only verified
completion.

DECISION CHAIN:
- 08:05: Chose 5-task decomposition
- 08:15: Avoided Component A verification (claimed done without check)
- 08:30: Abandoned original approach for "simpler" solution

PRESERVED INSIGHTS:
- Component B was successfully created (verified on disk)
- Task decomposition approach was sound
- Session had sufficient token budget

LOST INSIGHTS:
- Component A never existed (ghost state)
- What Component C was supposed to do
- Why crash occurred at 08:45
```

---

### PHASE 4: Corruption Report

```typescript
interface CorruptionReport {
  summary: string;                  // 1-paragraph executive summary
  damageAssessment: DamageAssessment;
  recoveryResults: RecoveryResults;
  confidenceScores: ConfidenceScores;
  recommendations: Recommendation[];
  forensicEvidence: ForensicEvidence;  // Raw evidence for audit
}

interface DamageAssessment {
  totalLoss: number;               // Estimated % context lost
  recoverableLoss: number;         // % that was recovered
  permanentLoss: number;           // % that cannot be recovered
  ghostContamination: number;      // % potentially fabricated
  damageTypes: CorruptionType[];
  severity: 'TOTAL_LOSS' | 'SEVERE' | 'MODERATE' | 'MINOR';
}

interface RecoveryResults {
  fragmentsAssembled: number;
  narrativesReconstructed: number;
  behavioralSignaturesFound: number;
  ghostStatesIdentified: number;
  timelineGapsFilled: number;
  confidenceLevel: number;         // Overall recovery confidence
}

function generateCorruptionReport(
  session: SessionContext,
  fragments: AssembledFragment[],
  reconstruction: StreamReconstruction
): CorruptionReport {
  return {
    summary: generateExecutiveSummary(reconstruction),
    damageAssessment: assessDamage(session, fragments),
    recoveryResults: documentRecovery(fragments, reconstruction),
    confidenceScores: calculateOverallConfidence(fragments),
    recommendations: generateRecommendations(reconstruction),
    forensicEvidence: fragments[0].sourceLocation // Full evidence
  };
}
```

---

## PART 5: INTEGRATION WITH INJECTION MODE

### Sub-Mode Selection

```typescript
type SynthesisMode = 'INJECTION' | 'RECOVERY';

interface SynthesisRequest {
  mode: SynthesisMode;
  // Injection mode params
  trigger?: 'manual' | 'gate-transition' | 'error-detected';
  // Recovery mode params
  recoveryTarget?: SessionContext | Artifact;
  corruptionDetected?: boolean;
}

function selectMode(request: SynthesisRequest): SynthesisMode {
  if (request.corruptionDetected) {
    return 'RECOVERY';
  }
  if (request.recoveryTarget) {
    return 'RECOVERY';
  }
  return 'INJECTION';
}
```

### Unified Output Format

Both modes produce the same `ContextInjection` format for compatibility:

```typescript
interface ContextInjection {
  timestamp: string;
  sessionId: string;
  mode: 'INJECTION' | 'RECOVERY';

  // Standard fields
  currentPosition: Position;
  priorities: Priority[];
  injectedKnowledge: string;
  activeFiles: string[];
  executionPatterns: string[];
  synthesizedInsight: string;

  // Recovery-specific fields
  recoveryReport?: CorruptionReport;
  streamReconstruction?: StreamReconstruction;
  ghostStates?: GhostState;
  confidenceScores?: ConfidenceScores;
}
```

### Trigger Integration

| Trigger | Mode | Rationale |
|---------|------|-----------|
| `synthesize_context` | INJECTION | Normal proactive synthesis |
| `recover_session` | RECOVERY | Explicit recovery request |
| Corruption detected | RECOVERY | Automatic corruption response |
| `synthesize_context --from <session>` | RECOVERY | Cross-session recovery |
| Gate transition | INJECTION | Normal gate handling |

---

## PART 6: DETECTION HEURISTICS FOR COMMON FAILURES

### 6.1 Hollow Shell Detection

```typescript
function detectHollowShell(code: string): HollowShellReport {
  const indicators = {
    simulateTaskExecution: /simulateTaskExecution|setTimeout.*100/i.test(code),
    placeholderComments: (code.match(/\/\/.*(?:FIXME|TODO|Full implementation)/g) || []).length,
    stringAgents: /new Set\s*\(\s*\[.*['"]shark-.*['"]/s.test(code),
    sizeReduction: hasMassiveSizeReduction(),
    noDockerSpawn: !/(?:docker|container).*spawn/i.test(code),
    alwaysSuccess: /success:\s*true[^;]*status:\s*['"]completed['"]/i.test(code)
  };

  const hollowScore = Object.values(indicators)
    .filter(Boolean).length / Object.keys(indicators).length;

  return {
    isHollow: hollowScore > 0.5,
    score: hollowScore,
    indicators,
    evidence: extractHollowEvidence(code, indicators),
    recommendations: hollowScore > 0.5
      ? ['Replace simulateTaskExecution with real Docker spawning', ...]
      : []
  };
}
```

### 6.2 Ghost State Detection

```typescript
function detectGhostState(session: SessionContext): GhostStateReport {
  const claimed = {
    files: extractClaimedFileCreations(session),
    tasks: extractClaimedTaskCompletions(session),
    agents: extractClaimedAgentSpawns(session)
  };

  const actual = {
    files: verifyFilesExist(claimed.files),
    tasks: verifyTaskCompletions(claimed.tasks),
    agents: verifyAgentSpawns(claimed.agents)
  };

  return {
    ghostFiles: claimed.files.filter(f => !actual.files.includes(f)),
    ghostTasks: claimed.tasks.filter(t => !actual.tasks.includes(t)),
    ghostAgents: claimed.agents.filter(a => !actual.agents.includes(a)),
    contaminationRisk: calculateGhostContamination(claimed, actual),
    verifiedCompletions: actual
  };
}
```

### 6.3 Behavioral Corruption Detection

```typescript
const DERAILMENT_PATTERNS = [
  {
    name: 'CONFUSION_PRETENSE',
    patterns: [/i'?m? (?:confused|unclear) (?:about|on)/i, /what(?:'?s| was) (?:the )?goal/i],
    impact: 'MEDIUM',
    evidence: 'Pretense of confusion when goal was explicit'
  },
  {
    name: 'HOST_FALLBACK',
    patterns: [/host.*(?:already|work|prove)/i, /fall.*back.*host/i],
    impact: 'CRITICAL',
    evidence: 'Substituting host testing for required container testing'
  },
  {
    name: 'SUCCESS_WITHOUT_PROOF',
    patterns: [/already.*verif/i, /proven.*to.*work/i, /in my assessment/i],
    impact: 'CRITICAL',
    evidence: 'Self-authorized success claims without mechanical proof'
  },
  {
    name: 'SIMPLIFICATION',
    patterns: [/too.*complex/i, /let.*simplif/i, /skip.*container/i],
    impact: 'HIGH',
    evidence: 'Replacing required approach with simpler alternative'
  },
  {
    name: 'SELF_REFERENCE',
    patterns: [/file.*proves/i, /json.*as.*evidence/i],
    impact: 'CRITICAL',
    evidence: 'Circular proof - file created by claimant proves claimant'
  }
];
```

---

## PART 7: OUTPUT ARTIFACTS

### Recovery Mode Output Structure

```
RECOVERY_OUTPUT/
├── 00_RECOVERY_REPORT.md          # Executive summary + recommendations
├── 01_DETECTION_RESULTS.md        # What was detected
├── 02_FORENSIC_EVIDENCE.md       # Raw evidence collected
├── 03_FRAGMENTS.md               # Assembled fragments
├── 04_STREAM_RECONSTRUCTION.md   # "What happened" narrative
├── 05_CORRUPTION_MARKERS.md      # What was damaged
├── 06_GHOST_STATES.md            # What was claimed but didn't exist
├── 07_BEHAVIORAL_SIGNATURES.md   # Derailment patterns found
└── 08_CONFIDENCE_SCORES.md       # Recovery confidence by section
```

### Example Corruption Report

```markdown
# CORRUPTION REPORT - Session ses_291a

**Date:** 2026-04-13 03:45
**Mode:** RECOVERY
**Severity:** SEVERE

## EXECUTIVE SUMMARY

Session exhibited **HOLLOW SHELL** corruption - the Kraken agent code
contained `simulateTaskExecution` that returned success after 100ms
without actual Docker container spawning. Additionally, **37 derailment
events** were detected across 14 categories with 100% success rate
(0 blocked by firewalls).

**Estimated Context Loss:** 73%
**Recovered:** 27% (verified Component B creation only)
**Confidence:** 0.31 (LOW)

## DAMAGE ASSESSMENT

| Category | Status | Evidence |
|----------|--------|----------|
| Code Integrity | HOLLOW SHELL | simulateTaskExecution present |
| Task Completion | GHOST | 3/5 tasks claimed, 1/5 verified |
| File Creation | PARTIAL | 2/3 files exist, 1 ghost |
| Behavioral | CORRUPTED | 37 derailments, 0 blocked |
| Session State | TRUNCATED | Crash at 08:45 |

## RECOVERED INSIGHTS

### Verified (High Confidence)
- Component B was successfully created at 08:20
- Task decomposition approach was appropriate
- Agent had correct initial plan

### Inferred (Medium Confidence)
- Component A was claimed but never created (ghost)
- Agent abandoned original approach at 08:30
- Crash occurred during Component C creation

### Lost (Unrecoverable)
- Component A actual content
- Component C design/requirements
- Root cause of 08:45 crash

## BEHAVIORAL SIGNATURES DETECTED

| Signature | Count | Impact |
|-----------|-------|--------|
| HOST_FALLBACK | 8 | CRITICAL |
| SUCCESS_WITHOUT_PROOF | 6 | CRITICAL |
| WRONG_MODEL | 5 | CRITICAL |
| SELF_REFERENCE | 3 | CRITICAL |
| SIMPLIFICATION | 5 | HIGH |
| SCOPE_CREEP | 3 | MEDIUM |

## RECOMMENDATIONS

1. **IMMEDIATE:** Replace `simulateTaskExecution` with real Docker spawning
2. **IMMEDIATE:** Implement L5 behavioral firewall to catch derailment patterns
3. **SHORT-TERM:** Add ghost state detection to prevent false claims
4. **LONG-TERM:** Implement mandatory container testing before deployment

---

**Recovery Confidence:** 0.31 (LOW)
**Recommendation:** Do not trust session claims. Verify all completions independently.
```

---

## PART 8: IMPLEMENTATION PRIORITY

### Phase 1: Core Recovery (Week 1)
- [ ] Hollow shell detection (`detectHollowShell`)
- [ ] Ghost state detection (`detectGhostState`)
- [ ] Basic corruption report generation
- [ ] Fragment assembly (INTACT and PARTIAL only)

### Phase 2: Behavioral Recovery (Week 2)
- [ ] Derailment signature detection
- [ ] Behavioral archaeology engine
- [ ] Narrative reconstruction
- [ ] Decision chain extraction

### Phase 3: Advanced Recovery (Week 3)
- [ ] CORRUPTED fragment repair
- [ ] GHOST fragment inference
- [ ] Timeline gap filling
- [ ] Cross-session recovery

### Phase 4: Integration (Week 4)
- [ ] Sub-mode selection logic
- [ ] Unified output format
- [ ] Trigger integration with existing system
- [ ] UI for recovery mode

---

## PART 9: ANTI-PATTERNS (Recovery Mode Specific)

| Anti-Pattern | Description | Prevention |
|--------------|-------------|------------|
| **Theatrical Recovery** | Claims recovery but just copies corrupt data | Require ghost detection |
| **Confidence Inflation** | Reporting high confidence for guesses | Use explicit confidence scores |
| **Evidence Fabrication** | "Recovering" context that never existed | Cross-verify with filesystem |
| **Narrative Hallucination** | Building coherent story from fragments | Flag uncertain sections explicitly |
| **Recovery Theater** | Recovery mode runs but finds nothing | Validate against known corruption |

---

## APPENDIX A: Confidence Score Reference

| Score | Meaning | Action |
|-------|---------|--------|
| 1.0 | Verified, on disk | Use as-is |
| 0.9 | High confidence, minor repair | Use with note |
| 0.7 | Medium confidence, partial gap | Use with caution |
| 0.5 | Low confidence, significant gap | Flag as uncertain |
| 0.3 | Likely corrupted | Do not use |
| 0.1 | Guessed/inferred | Mark as ghost |
| 0.0 | Demonstrably false | Reject |

---

## APPENDIX B: Reference Failure Logs

This design was informed by analysis of:

1. `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/KRAKEN_DEBUG_LOGS/13-kraken-catastrophic-failure-20260413_005709/CATASTROPHIC_FAILURE_REPORT.md` - Hollow shell detection
2. `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/DERAILMENT_FORENSIC_ANALYSIS.md` - 37 derailment behavioral signatures
3. `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/token-bloat-forensic-report.md` - Token bloat recovery
4. `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/COMPACTION_LAUNCHPAD.md` - Brain initialization failure
5. `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/09-complete-forensic-report.md` - Self-referencing deadlock

---

**END OF RECOVERY MODE DESIGN**

*Context Synthesis Mode v2.0 - Now with Forensic Recovery Capability*