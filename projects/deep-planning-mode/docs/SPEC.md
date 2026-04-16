# DEEP PLANNING MODE - Mode Specification

**Version:** 1.0.0  
**Type:** Planning/Analysis Mode  
**Based On:** Trident Brain v3.0 Architecture  
**Date:** 2026-04-14  
**Purpose:** Comprehensive multi-phase planning for complex engineering tasks

---

## EXECUTIVE SUMMARY

Deep Planning Mode (DPM) performs comprehensive upfront analysis of complex engineering tasks before execution. It decomposes requirements, maps dependencies, identifies risks, and produces validated project plans with checkpoint milestones.

Unlike reactive modes (Trident audits existing code), Deep Planning is **proactive** - it analyzes future work and produces actionable execution plans.

---

## CORE PRINCIPLES

### Principle 1: Plans are Proofs, Not Guesses

Every plan assertion must be verifiable:
- "This dependency exists" → File check or API ping
- "This task takes 2 hours" → Decomposed to 15-min increments
- "This is risky" → Root cause + probability + impact stated

### Principle 2: Decompose Until Actionable

Plans break down until every step has:
- Owner (agent/human/system)
- Verifiable completion criteria
- Time estimate (<4 hours per step)
- Rollback option

### Principle 3: Dependency Graphs are Sacred

Circular dependencies are automatically detected and flagged as CRITICAL blockers. No plan proceeds with unresolved circular deps.

---

## PURPOSE

**What this mode does:**
- Analyzes complex engineering tasks and produces validated project plans
- Maps all dependencies (internal, external, human)
- Identifies risks with probability, impact, and mitigation strategies
- Creates checkpoint milestones for progress tracking
- Validates constraints (time, scope, resources)

**What this mode does NOT do:**
- Execute the plan (other modes handle execution)
- Write code directly
- Make irreversible decisions without confirmation

---

## TARGET USERS

| User | Use Case |
|------|----------|
| Senior Engineers | Complex multi-component projects |
| Team Leads | Cross-team dependency planning |
| Architects | Technical design validation |
| Mentees | Learning systematic planning |

---

## NATURAL LANGUAGE COMMANDS

| Command | Action |
|---------|--------|
| `plan this` | Start deep planning analysis |
| `deep plan <task>` | Analyze specific task deeply |
| `analyze deps` | Map dependencies only |
| `what could go wrong` | Risk analysis mode |
| `checkpoint` | Create milestone checkpoint |
| `validate plan` | Verify plan completeness |
| `risky` | Highlight high-risk items |
| `constraints` | Show constraint analysis |
| `dependencies` | Show full dependency graph |

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    PLUGIN ENTRY (index.ts)                  │
├─────────────────────────────────────────────────────────────┤
│  Natural Language Parser                                    │
│  ├── trigger detection (plan this, deep plan, etc.)         │
│  └── action routing                                         │
│                                                              │
│  Command Handlers                                           │
│  ├── handleDeepPlan()                                       │
│  ├── handleDependencyAnalysis()                             │
│  ├── handleRiskAnalysis()                                   │
│  └── handleCheckpointCreation()                             │
│                                                              │
│  Hooks                                                      │
│  ├── tool.execute.before (block execution during planning)  │
│  └── chat.message (context extraction)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 PLANNING CORE (planning-core.ts)            │
├─────────────────────────────────────────────────────────────┤
│  PATTERNS                                                   │
│  ├── REQUIREMENT_PATTERNS (user needs, constraints)          │
│  ├── DEPENDENCY_PATTERNS (files, APIs, services)             │
│  ├── RISK_PATTERNS (failure modes, blockers)                 │
│  ├── CHECKPOINT_PATTERNS (milestones, deliverables)         │
│  └── CONSTRAINT_PATTERNS (time, scope, resources)           │
│                                                              │
│  CLASSES                                                    │
│  ├── RequirementExtractor - Parse requirements from text    │
│  ├── DependencyMapper - Build dependency graph              │
│  ├── RiskAnalyzer - Identify and quantify risks             │
│  ├── ConstraintValidator - Verify plan meets constraints    │
│  ├── PlanBuilder - Construct validated plan                 │
│  ├── CheckpointManager - Manage milestone state              │
│  └── PlanVerifier - Proof-based plan validation             │
│                                                              │
│  OUTPUT                                                     │
│  ├── PlanReport - Markdown-formatted plan                   │
│  ├── DependencyGraph - Visual/text dependency map           │
│  ├── RiskRegister - Risk items with mitigations             │
│  └── CheckpointTimeline - Milestone timeline                │
└─────────────────────────────────────────────────────────────┘
```

---

## PATTERN DEFINITIONS

### REQUIREMENT_PATTERNS

```typescript
export const REQUIREMENT_PATTERNS = {
  FEATURE: [
    { regex: /feature:\s*(.+)/gi, severity: SEVERITY.HIGH, note: 'Explicit feature' },
    { regex: /should\s+(.+)/gi, severity: SEVERITY.MEDIUM, note: 'User expectation' },
    { regex: /needs?\s+(.+)/gi, severity: SEVERITY.MEDIUM, note: 'Stated need' },
  ],
  CONSTRAINT: [
    { regex: /must\s+(.+)/gi, severity: SEVERITY.HIGH, note: 'Hard constraint' },
    { regex: /can't\s+(.+)/gi, severity: SEVERITY.HIGH, note: 'Negative constraint' },
    { regex: /only\s+(.+)/gi, severity: SEVERITY.MEDIUM, note: 'Scope constraint' },
    { regex: /within\s+(\d+)\s*(hour|day|week)/gi, severity: SEVERITY.HIGH, note: 'Time constraint' },
  ],
  DELIVERABLE: [
    { regex: /deliverable:\s*(.+)/gi, severity: SEVERITY.HIGH, note: 'Explicit deliverable' },
    { regex: /end\s+result\s+is\s+(.+)/gi, severity: SEVERITY.MEDIUM, note: 'Outcome statement' },
  ],
} as const;
```

### DEPENDENCY_PATTERNS

```typescript
export const DEPENDENCY_PATTERNS = {
  FILE_DEP: [
    { regex: /depends?\s+on\s+[`'"]?([\w./-]+)[`'"]?/gi, severity: SEVERITY.CRITICAL, note: 'File dependency' },
    { regex: /import\s+from\s+[`'"]?([\w./-]+)[`'"]?/gi, severity: SEVERITY.HIGH, note: 'Import statement' },
    { regex: /requires?\s+[`'"]?([\w./-]+)[`'"]?/gi, severity: SEVERITY.HIGH, note: 'Require statement' },
  ],
  API_DEP: [
    { regex: /api:\s*(\w+)/gi, severity: SEVERITY.HIGH, note: 'API dependency' },
    { regex: /calls?\s+(\w+)\s*API/gi, severity: SEVERITY.HIGH, note: 'API call' },
    { regex: /endpoint:\s*(\/\S+)/gi, severity: SEVERITY.MEDIUM, note: 'Endpoint reference' },
  ],
  SERVICE_DEP: [
    { regex: /service:\s*(\w+)/gi, severity: SEVERITY.HIGH, note: 'Service dependency' },
    { regex: /uses?\s+(\w+)\s+service/gi, severity: SEVERITY.MEDIUM, note: 'Service usage' },
  ],
  HUMAN_DEP: [
    { regex: /needs?\s+(\w+)\s+(to|from)\s+(\w+)/gi, severity: SEVERITY.MEDIUM, note: 'Human dependency' },
    { regex: /coordinate\s+with\s+(\w+)/gi, severity: SEVERITY.MEDIUM, note: 'Coordination needed' },
  ],
} as const;
```

### RISK_PATTERNS

```typescript
export const RISK_PATTERNS = {
  FAILURE_MODE: [
    { regex: /might\s+fail/gi, severity: SEVERITY.HIGH, note: 'Stated failure possibility' },
    { regex: /could\s+break/gi, severity: SEVERITY.HIGH, note: 'Breakage risk' },
    { regex: /race\s+condition/gi, severity: SEVERITY.CRITICAL, note: 'Concurrency risk' },
    { regex: /deadlock/gi, severity: SEVERITY.CRITICAL, note: 'Critical concurrency risk' },
  ],
  BLOCKER: [
    { regex: /blocked\s+by/gi, severity: SEVERITY.HIGH, note: 'Stated blocker' },
    { regex: /waiting\s+on/gi, severity: SEVERITY.MEDIUM, note: 'Pending dependency' },
    { regex: /circular\s+dependency/gi, severity: SEVERITY.CRITICAL, note: 'Critical blocker' },
  ],
  UNCERTAINTY: [
    { regex: /unknown\s+if/gi, severity: SEVERITY.MEDIUM, note: 'Uncertainty flagged' },
    { regex: /not\s+sure\s+if/gi, severity: SEVERITY.LOW, note: 'Minor uncertainty' },
    { regex: /might\s+need\s+(.+)/gi, severity: SEVERITY.MEDIUM, note: 'Potential requirement' },
  ],
} as const;
```

### CHECKPOINT_PATTERNS

```typescript
export const CHECKPOINT_PATTERNS = {
  MILESTONE: [
    { regex: /^##\s*Step\s+(\d+):\s*(.+)/gm, severity: SEVERITY.INFO, note: 'Explicit step' },
    { regex: /^###\s*(.+?)\s*\((\d+)h\)/gm, severity: SEVERITY.INFO, note: 'Timed substep' },
  ],
  DELIVERABLE: [
    { regex: /^\s*-\s*\[\s*\]\s*(.+)/gm, severity: SEVERITY.INFO, note: 'Unchecked deliverable' },
    { regex: /^\s*-\s*\[x\]\s*(.+)/gm, severity: SEVERITY.INFO, note: 'Completed deliverable' },
  ],
} as const;
```

---

## OUTPUT FORMATS

### PlanReport Structure

```markdown
# Deep Plan: [Task Name]

## Executive Summary
[Brief description of what this plan accomplishes]

## Requirements
### Functional Requirements
- [Req 1]
- [Req 2]

### Constraints
- **Time:** [Max duration]
- **Scope:** [Boundaries]
- **Resources:** [Available resources]

## Dependency Graph
```
[A] ──► [B] ──► [C]
 │              │
 ▼              ▼
[D] ──────────► [E]
```

## Risk Register
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | High | High | [Mitigation] |

## Checkpoint Timeline
| Checkpoint | Criteria | Time | Owner |
|------------|----------|------|-------|
| CP1: [Name] | [Criteria] | 2h | agent |

## Execution Steps
### Step 1: [Name] (~2h)
**Owner:** agent
**Completion Criteria:**
- [ ] [Criteria 1]
- [ ] [Criteria 2]

**Rollback:** [How to undo]

---
*Generated by Deep Planning Mode v1.0*
```

---

## SUCCESS CRITERIA

| Criterion | Measurement |
|-----------|-------------|
| Breaks task into <10 steps | Step count ≤ 10 |
| All dependencies mapped | Dependency count = actual deps |
| Risks identified | Risk count ≥ 1 per 3 steps |
| Checkpoints created | ≥ 1 checkpoint per 3 steps |
| Time estimates provided | All steps have estimates |
| Rollback defined | All steps have rollback |
| Constraints validated | No constraint violations |

---

## VERIFICATION TESTS (Pre-Ship)

### Mechanical Tests (7 required)

1. **Pattern Detection:** Requirements extracted correctly
2. **No Duplicates:** 3 deps → 3 findings (not 300)
3. **SafetyCount:** 200 deps complete in <5s
4. **Line Accuracy:** Line numbers match source
5. **Evidence Real:** Evidence is actual code/text
6. **Constraint Validation:** Invalid constraints rejected
7. **Circular Detection:** Circular deps caught and flagged

### Integration Tests

- `deep plan this` triggers planning flow
- `analyze deps` triggers dependency mapping
- `what could go wrong` triggers risk analysis
- `checkpoint` creates milestone
- `validate plan` verifies completeness

---

## FOLDER STRUCTURE

```
deep-planning-mode/
├── src/
│   ├── index.ts              # Plugin entry, hooks, commands
│   └── planning-core.ts      # Core logic, patterns, engines
├── dist/                      # Built output (~150KB)
├── pkg/
│   ├── package.json          # v1.0.0
│   └── tsconfig.json
├── tests/
│   ├── patterns.test.ts       # Pattern detection tests
│   ├── planning.test.ts       # Plan building tests
│   └── integration.test.ts   # Full flow tests
├── docs/
│   ├── SPEC.md               # This spec
│   └── TROUBLESHOOTING.md     # Common issues
├── context-library/
│   ├── patterns.ts           # Pattern library
│   ├── lessons.ts            # Lessons learned (from Trident)
│   └── templates.ts          # Plan templates
├── scripts/
│   ├── build.sh              # Build script
│   ├── test.sh               # Test script
│   └── deploy.sh             # Deploy script
└── README.md                  # Quick start
```

---

## BUILD WORKFLOW

### Phase 1: PLAN (1 day)
- [ ] Define planning grammar
- [ ] Design pattern categories
- [ ] Create SPEC.md

### Phase 2: BUILD (2-3 days)
- [ ] Implement index.ts with hooks
- [ ] Implement planning-core.ts
- [ ] Add all pattern categories
- [ ] Build plan generator
- [ ] Build checkpoint manager

### Phase 3: TEST (1-2 days)
- [ ] Run mechanical tests (7/7 pass)
- [ ] Run integration tests
- [ ] Manual verification

### Phase 4: SHIP (1 day)
- [ ] npm run build clean
- [ ] Deploy to plugins
- [ ] Create git tag v1.0.0
- [ ] Update context library

---

## CRITICAL IMPLEMENTATION RULES

| Rule | Description |
|------|-------------|
| 1 | Model ONLY reads - no behavioral AI decisions |
| 2 | ALL detection is algorithmic (regex patterns) |
| 3 | Every loop needs safetyCount (maxMatches=100) |
| 4 | Regex MUST have global flag for multiple matches |
| 5 | No console.log in production (use output.blockReason) |
| 6 | Tool enforcement hook blocks execution during planning |
| 7 | Plans are documentation, never execution |
| 8 | Plans must be actionable - each step verifiable |
| 9 | Dependency graphs must be acyclic (detect circular) |
| 10 | Plans must have rollback for each step |

---

## LESSONS INCORPORATED FROM TRIDENT v3.0

### Bug 1: Non-Global Regex Duplicate
**Fix:** Always add global flag if not present:
```typescript
const flags = pattern.regex.flags.includes('g') 
  ? pattern.regex.flags 
  : pattern.regex.flags + 'g';
```

### Bug 2: Missing SafetyCount
**Fix:** Every while loop needs safetyCount:
```typescript
let safetyCount = 0;
while ((match = regex.exec(content)) !== null && safetyCount < maxMatches) {
  safetyCount++;
}
```

### Bug 3: Console Spillover
**Fix:** Remove all console.log. Use output.blockReason for feedback.

### Bug 4: Hardcoded Agent Names
**Fix:** Make patterns universal, no shark/manta hardcoding.

### Bug 5: Hardcoded File Paths
**Fix:** Use relative paths, configurable base directory.

---

**Author:** Kraken Multi-Agent System  
**Based On:** Trident Brain v3.0 Development Experience  
**License:** MIT
