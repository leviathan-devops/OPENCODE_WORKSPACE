# TRIDENT BRAIN — MASTER DIRECTORY

**Type:** Multi-Mode Reasoning Architecture  
**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/`  
**Status:** MASTER — All future Trident Brain development housed here  
**Parent:** Manta Agent (mechanical gate enforcement)  
**Inspiration:** DeepSeek R1 chain-of-thought reasoning

---

## Concept

Trident Brain is a modular reasoning architecture where each **Mode** is a specialized reasoning process with its own gate chain and artifacts.

**Think of it as a reasoning toolkit with different modes for different thinking tasks.**

---

## Modes

### [Deep Planning Mode](./Deep%20Planning%20Mode/)

**Purpose:** Generate complete, injectable project plans from first principles

**Layers:** 3 (Initial Plan → Detailed Workflow → Context Library)

**Output:** Self-contained context library that another agent can read and execute

**Use when:** You need a complete project specification with deep reasoning

---

### [Problem Solving Mode](./Problem%20Solving%20Mode/)

**Purpose:** Evidence-based debugging and root cause analysis

**Layers:** 6 (Assumption → Action → Observation → Gap Analysis → Meta-Reflection → Verification)

**Output:** Injectable debugging chain with iteration tracking

**Use when:** You need to solve a problem systematically with evidence-based iteration

**Key feature:** Prevents 14 categories of derailment (Host Fallback, Success Claims Without Proof, Mock/Stub, etc.)

---

### [Context Synthesis Mode](./Context%20Synthesis%20Mode/)

**Purpose:** Dynamically synthesize T1/T2/T3/T4 context into <2k token injection stream

**Layers:** 4 (Collection → Scoring → Compression → Injection)

**Output:** T0-ready context injection for real-time thought stream

**Use when:** You need to consolidate context, manage token budget, or inject relevant knowledge

**Key feature:** Combines Kraken V2.0 token management + Hermes Memory tiers + on-demand triggers

---

### [Code Review Mode](./Code%20Review%20Mode/) — **NEW**

**Purpose:** Self-contained code analysis for detecting architectural flaws, security vulnerabilities, and quality issues

**Layers:** 5 (Structure Map → Execution Verification → Security Analysis → Architecture Analysis → Quality Analysis)

**Output:** Injectable markdown report with BLOCKER/WARNING/SUGGESTION findings

**Use when:** You need deep code review without external SAST dependencies

**Key feature:** 25 self-contained detectors for simulated execution, hook spillover, SQL injection, XSS, and more

**Status:** ✅ Specification Complete (Implementation Pending)

---

### [Future Modes]

| Mode | Purpose | Status |
|------|---------|--------|
| Deep Planning Mode | Project planning | ✅ Implemented |
| Problem Solving Mode | Debugging/RCA | ✅ Implemented |
| Context Synthesis Mode | Context injection | ✅ Implemented |
| Code Review Mode | Code analysis | ✅ Spec Complete |
| Test Generation | Comprehensive test specs | 🔜 Planned |

---

## Shared Architecture

All Trident modes share:

1. **Mechanical Gates** - Evidence-based transitions from Manta
2. **Structural Enforcement** - Requirements that force deep thinking
3. **Artifact Templates** - Standardized output formats
4. **Iteration Loops** - Depth through refinement

---

## Design Philosophy

1. **Pure Reasoning** - No execution, only thinking artifacts
2. **Injectable Output** - Artifacts designed for other agents to consume
3. **First Principles** - Mechanical structure evoking fundamental thinking
4. **Layered Depth** - Each layer goes deeper into the problem

---

## Source Code

TypeScript implementation available in [`./src/`](./src/)

| Component | Status |
|-----------|--------|
| `index.ts` (Plugin entry) | ✅ Implemented |
| `modes/planning/` | ✅ Implemented |
| `modes/problem-solving/` | ✅ Implemented |
| `modes/context-synthesis/` | ✅ Implemented |
| `modes/code-review/` | ⏳ Pending |
| `shared/` (coordinator, artifacts) | ✅ Implemented |

## GOLD STANDARD Reference

- **Problem Solving Mode:** Reverse-engineered from AGENT_BUILD_LOGIC_CHAIN.md, SHARK_AGENT_1ST_BUILD_REPORT.md, SPACE_INVADERS_BUILD_LOG.md
- **Context Synthesis Mode:** Inspired by Kraken V2.0 compaction-manager.ts, Hermes Memory Overhaul L0/L1/L2
- **Code Review Mode:** Derived from 37+ forensic failure events across 14 categories

---

## GitHub References

- **Master Spec:** `github.com/leviathan-devops/kraken-agent/tree/frozen/master/docs/architecture/TRIDENT_CODE_REVIEW_MODE_SPEC.md`
- **Frozen Backup:** `github.com/leviathan-devops/kraken-agent/tree/frozen/master`

---

*Trident Brain - Modular reasoning architecture*