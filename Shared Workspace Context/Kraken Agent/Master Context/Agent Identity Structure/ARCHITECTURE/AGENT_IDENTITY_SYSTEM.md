# AGENT IDENTITY SYSTEM — Trident Brain Architecture

**Version:** 1.0
**Type:** Deep Planning Architecture
**Inspiration:** Deep reasoning about identity injection, behavioral reinforcement

---

## META: Design Alignment

This architecture was designed through deep reasoning about:

1. **Input:** Why do AI agents with orchestration tools fail to use them? (The Kraken v1.2 behavioral derailment)
2. **Key insight:** Tools alone are insufficient — agents need identity reinforcement
3. **Enforcement philosophy:** Structural requirements (MUST contain X) not quantitative (wrote Y chars)
4. **Pattern recognition:** The Spider/agent-swarm pattern works because of identity injection

---

## Core Concept

The Agent Identity System forces **persistent self-awareness** through mechanical injection enforcement. An agent cannot forget WHO IT IS because identity is reinforced through multiple injection points.

```
AGENT IDENTITY SYSTEM
│
├── GATE 1: IDENTITY FILES
│   └── STRUCTURE: "What files must exist?"
│       - SOUL.md (core identity)
│       - IDENTITY.md (role definition)
│       - EXECUTION.md (behavior patterns)
│       - SPIDER.md (quality gates)
│       - TOOLS.md (tool access)
│
├── GATE 2: INJECTION MECHANISM
│   └── ENFORCEMENT: "How does identity enter the agent?"
│       - session.started hook (primary)
│       - tab.toggle event (reinforcement)
│       - compaction recovery (persistence)
│
└── GATE 3: BEHAVIORAL VERIFICATION
    └── VERIFICATION: "Did identity work?"
        - Delegation metrics
        - Tool usage diversity
        - Build time comparison
```

---

## The 3 Gates with Enforcement

### GATE 1: IDENTITY FILES

**Thinking Purpose:** "What files must exist to define an identity?"

**Enforcement:**
- File existence check (all 5 files required for full identity)
- Content validation (required sections, minimum directives)
- Format validation (markdown structure, required headers)

**Required Files:**

| File | Purpose | Minimum Content |
|------|---------|----------------|
| **SOUL.md** | Core identity | Identity statement, 3+ directives, mantra |
| **IDENTITY.md** | Role definition | Role, expertise, working style |
| **EXECUTION.md** | Behavior (orchestrators) | Delegation triggers, patterns |
| **SPIDER.md** | Quality enforcement | Quality gates, debug protocol |
| **TOOLS.md** | Tool access | Tool list with descriptions |

**Cannot advance until you can answer:**
- What files are required?
- What minimum content must each contain?
- What happens if a file is missing?

---

### GATE 2: INJECTION MECHANISM

**Thinking Purpose:** "How does identity flow from files into the agent?"

**Enforcement:**
- Hook registration validation
- Injection timing verification
- Context modification check

**Injection Points:**

| Event | Purpose | Timing |
|-------|---------|--------|
| `session.started` | Primary injection | Session init |
| `tab.toggle` | Reinforcement | Context switch |
| `compaction.before` | Snapshot | Pre-compaction |
| `compaction.after` | Recovery | Post-compaction |

**Cannot advance until you can answer:**
- When does injection happen?
- How is identity preserved across compaction?
- What triggers re-injection?

---

### GATE 3: BEHAVIORAL VERIFICATION

**Thinking Purpose:** "How do we know identity worked?"

**Enforcement:**
- Delegation metrics (did orchestrator delegate?)
- Tool usage tracking
- Build time comparison

**Success Metrics:**

| Metric | Without Identity | With Identity |
|--------|-----------------|---------------|
| Delegation calls | 0 | 10+ |
| Parallel agents | 0 | 3-5 |
| Build time | ~120 min | ~35 min |
| Tool diversity | 3 tools | 8+ tools |

**Cannot advance until you can answer:**
- How do we measure identity success?
- What are the failure modes?
- How do we detect behavioral drift?

---

## Mechanical Enforcement

### Structural Requirements

| Requirement | What It Enforces |
|------------|------------------|
| All 5 files exist | Complete identity definition |
| SOUL.md has identity statement | Core identity established |
| SOUL.md has 3+ directives | Behavioral mandates |
| EXECUTION.md has 3+ triggers | Delegation criteria |
| SPIDER.md has quality gates | Verification standards |
| TOOLS.md lists tools | Tool awareness |

### Behavioral Requirements

| Requirement | What It Enforces |
|------------|------------------|
| Orchestrator delegates 3+ file tasks | Role-appropriate behavior |
| Agent uses 5+ different tools | Full capability utilization |
| No sequential writing of parallelizable tasks | Parallel thinking |

---

## Artifact Structure

### Layer 1: Identity Specification (this file)
- What identity structure is
- Why it matters
- How the 3 gates work

### Layer 2: Implementation Specification (SPEC/)
- Detailed file formats
- Interface contracts
- Error codes

### Layer 3: Context Library (main docs)
- How to use identity system
- How to deploy
- How to test

---

## Key Design Decisions

### Decision 1: File-Based vs. Generated

**Choice:** File-based identity

**Why:** Deterministic, reviewable, auditable. Generated identity is subject to hallucination.

**Enforcement:** Pre-flight check validates all files exist before session starts.

---

### Decision 2: 4-File vs. Single File

**Choice:** 4-file structure (SOUL, IDENTITY, EXECUTION, SPIDER)

**Why:** Separation of concerns allows:
- Rare changes to core identity (SOUL)
- Medium frequency role updates (IDENTITY)
- Frequent workflow changes (EXECUTION)
- Process changes (SPIDER)

**Enforcement:** Each file has specific required content.

---

### Decision 3: Hook-Based Injection

**Choice:** Multiple hooks (session.started primary, tab.toggle reinforcement)

**Why:** Single injection decays over long sessions. Multiple reinforcement points maintain identity.

**Enforcement:** Log each injection event, track reinforcement count.

---

## Anti-Patterns

### Anti-Pattern 1: Identity Without Enforcement
```
Problem: Files exist but aren't injected
Solution: Hook registration check in pre-flight
```

### Anti-Pattern 2: Injection Without Verification
```
Problem: Identity injected but no behavior change
Solution: Behavioral metrics tracking
```

### Anti-Pattern 3: Single Injection Point
```
Problem: Identity decays over long sessions
Solution: Reinforcement via tab.toggle and periodic injection
```

---

## The Spider/Agent-Swarm Reference

The Spider agent swarm successfully implements this pattern:

```
projects/agent-swarm-fork/identity/
├── spider-agent.json     # Model routing
├── coder/
│   ├── SOUL.md          # ✓ Exists
│   ├── IDENTITY.md      # ✓ Exists
│   ├── SPIDER.md        # ✓ Exists
│   └── TOOLS.md         # ✓ Exists
├── reviewer/
│   └── ...              # ✓ Same structure
└── lead/
    └── ...              # ✓ Same structure
```

**Result:** When user selects Spider, agent KNOWS it's the orchestrator.

---

## The Kraken Problem (Why We Needed This)

```
kraken-agent/
├── (NO identity/ directory)
└── src/
    └── index.ts        # (No identity loading)
```

**What happened:** Agent had tools but no identity. Defaulted to vanilla behavior.

**Solution:** Add identity/ directory and identity loading.

---

## Iteration Plan

```
V1.0: Identity structure spec (THIS FILE)
    └── What files, what hooks, what metrics

V1.1: Identity files created
    └── SOUL.md, IDENTITY.md, etc. for orchestrator + brains

V1.2: Identity injection implemented
    └── Hook registration, loader, injector

V1.3: Behavioral verification
    └── Tests pass, delegation metrics improve

V1.4: Full deployment
    └── Identity in production, monitoring active
```