# Hermes Agent v3.0 — Agent Delegation

## Overview

Hermes uses a **hub-and-spoke** delegation model where the Hermes orchestrator delegates to specialized agents.

## Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        HERMES (orchestrator)                 │
└─────────────────────────────────────────────────────────────┘
         │           │           │           │           │
         ▼           ▼           ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ ANALYST │ │ BUILDER │ │ REVIEWER│ │ DEBUGGER│ │  DOCS   │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
         │           │           │                         │
         ▼           ▼           ▼                         ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐             ┌─────────┐
    │ARCHITECT│ │   TDD   │ │QUALITY  │             │DESIGNER │
    └─────────┘ └─────────┘ │REVIEWER │             └─────────┘
                             └─────────┘
```

## 19 Agents

| Agent | Role | Delegation |
|-------|------|------------|
| `hermes` | Orchestrator | Delegates to analyst, builder, reviewer, debugger, docs |
| `analyst` | Requirements | Delegates to architect, sme |
| `architect` | System design | Delegates to builder |
| `builder` | Code generation | Delegates to reviewer, tdd |
| `reviewer` | Code review | Delegates to debugger |
| `debugger` | Issue resolution | Delegates to reviewer |
| `docs` | Documentation | Stands alone |
| `designer` | UI/UX | Stands alone |
| `supervisor` | Self-improvement | Uses supervisor-loop-hook |
| `quality-reviewer` | Quality gates | Uses tdd-enforcer |
| `sme` | Subject matter | Stands alone |
| `explorer` | Context discovery | Stands alone |
| `grill` | Adversarial testing | Stands alone |
| `critic` | Risk assessment | Stands alone |
| `ripple` | Impact analysis | Stands alone |
| `memory` | Memory management | Uses knowledge-injector |
| `planner` | Planning | Uses plan-validator |
| `tdd` | Test-driven | Uses tdd-enforcer |
| `drift-verifier` | Consistency | Uses drift-verifier-hook |

## Delegation Chain

```
User Task → hermes → analyst → architect → builder → reviewer → debugger → complete
                                              ↓
                                           [BLOCKED if no test]
```

### Chain Verification

Each step has a gate:

1. **hermes** receives task → fires brainstorm-gate
2. **analyst** analyzes → delegates to architect if valid
3. **architect** designs → delegates to builder if plan approved
4. **builder** writes code → MUST have test (tdd-enforcer)
5. **reviewer** reviews → can delegate to debugger if issues
6. **debugger** fixes → returns to reviewer
7. **complete** → phase transitions to COMPLETE

## Delegation Gate

**File:** `src/hooks/delegation-gate.ts`

Prevents direct delegation chain violations:

```typescript
// Guard: Only respond to Hermes agents
if (!isHermesAgent(agentId)) return;

// Check delegation is valid
if (!isValidDelegation(from, to)) {
  return { blocked: true, reason: 'Invalid delegation' };
}
```

## Delegation Ledger

**File:** `src/hooks/delegation-ledger.ts`

Records all delegation decisions for audit:

```typescript
interface DelegationRecord {
  timestamp: string;
  from: string;
  to: string;
  task: string;
  approved: boolean;
}
```

## Self-Improvement Loop

**File:** `src/hooks/supervisor-loop-hook.ts`

Graeme's 3-agent supervisor pattern:

```
Builder writes code
     ↓
Supervisor reviews
     ↓
Reviewer critiques
     ↓
Supervisor synthesizes
     ↓
Builder improves
```

## Anti-Rationalization

**File:** `src/hooks/anti-rationalization.ts`

Prevents agents from rationalizing bad decisions:

```
Agent: "I approve my own code"
     ↓
anti-rationalization: BLOCKED
     ↓
Must involve reviewer
```

## File Structure

```
src/agents/
├── hermes.ts           # Orchestrator prompt
├── analyst.ts          # Requirements agent
├── architect.ts        # Design agent
├── builder.ts          # Code generation
├── reviewer.ts         # Code review
├── debugger.ts        # Issue resolution
├── docs.ts            # Documentation
├── designer.ts        # UI/UX
├── supervisor.ts      # Self-improvement
├── quality-reviewer.ts # Quality gates
├── sme.ts             # Subject matter
├── explorer.ts        # Context discovery
├── grill.ts           # Adversarial testing
├── critic.ts          # Risk assessment
├── ripple.ts          # Impact analysis
├── memory.ts          # Memory management
├── planner.ts         # Planning
├── tdd.ts             # Test-driven
└── drift-verifier.ts  # Consistency
```
