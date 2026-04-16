# TRIDENT BRAIN - Quick Reference Knowledge

_Injected after compaction to restore Trident Brain context_

---

## What is Trident Brain?

Multi-mode reasoning architecture using mechanical gate enforcement. Each mode is a specialized reasoning process with:
- 3+ layers of deepening reasoning
- Structural requirements (not character counts)
- Artifact output designed for injection to other agents
- Deep refinement through iteration loops

**Parent:** Manta Agent (shares mechanical gate architecture)

---

## Mode Inventory

| Mode | Purpose | Status |
|------|---------|--------|
| Deep Planning Mode | Project planning | ✅ Implemented |
| Problem Solving Mode | Debugging/RCA | 🔄 Overhauled |
| Architecture Review Mode | Codebase analysis | 🔜 Future |
| Test Generation Mode | Test specs | 🔜 Future |
| Code Review Mode | Code analysis | 🔜 Future |

---

## Problem Solving Mode Layers (Overhauled)

Reverse-engineered from GOLD STANDARD documents:

| Layer | Thinking | Requirements |
|------|----------|--------------|
| **Layer 1** | "What do I assume?" | Explicit assumption, reasoning chain, success criteria |
| **Layer 2** | "What action will I take?" | Exact command, expected output, environment state |
| **Layer 3** | "What actually happened?" | Raw evidence, logs checked, expected vs actual comparison |
| **Layer 4** | "What does the gap tell me?" | Gap analysis, updated hypothesis, next action |
| **Layer 5** | "What should I do differently?" | Pattern extraction, systemic issue identification |
| **Layer 6** | "How do I confirm the fix works?" | Target environment execution, behavior matches, no regression |

---

## Key Design Principles

1. **Structural enforcement** - Must address required thinking points
2. **Injectable output** - Artifacts designed for other agents
3. **Deepening through iteration** - V1.0 → V1.1 → V1.2 deepens each layer
4. **Restricted execution** - `write` only for output, full `read` access for synthesis

---

## GOLD STANDARD Reference Documents

- **AGENT_BUILD_LOGIC_CHAIN.md** - Mattermost integration, shows iterative debugging pattern (assumption→action→observation→adjustment→meta-reflection)
- **SHARK_AGENT_1ST_BUILD_REPORT.md** - Space Invaders, 6-stage cognitive pipeline
- **SPACE_INVADERS_BUILD_LOG.md** - 13 agent parallel execution, strategic decomposition

---

## Complete Documentation Location

```
Trident Brain/
├── Deep Planning Mode/
│   ├── ARCHITECTURE/TRIDENT_BRAIN.md (V3.0)
│   ├── SPEC/TRIDENT_SPEC.md (V3.0)
│   └── TEMPLATES/*.md
├── PROBLEM_SOLVING_MODE_DESIGN.md (overhauled)
└── COMPACTION_SURVIVAL.md (survival guide)
```

---

## Core Insight from Reverse-Engineering

Successful problem solving is NOT "try X" — each step has **evidence** supporting the next decision. Iteration pattern:

```
ASSUMPTION → ACTION → OBSERVATION → COMPARISON → ADJUSTMENT → META-REFLECTION
```

Every failure provides information for the next attempt.