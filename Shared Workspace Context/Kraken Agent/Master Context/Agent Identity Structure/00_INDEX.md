# Agent Identity Structure — Context Library

**Part of:** Kraken Agent Master Context
**Version:** 1.0
**Date:** 2026-04-16
**Classification:** Architectural Knowledge Base

---

## What Is This Library?

This library documents the **Agent Identity Structure** — a system for giving AI agents persistent self-awareness of their role, capabilities, and behavioral mandates within a multi-agent orchestration framework.

**Core Problem Solved:**
Without identity injection, agents default to "vanilla chatbot" behavior regardless of their designed role. An orchestrator agent will act as a solo builder. A coder agent won't delegate. Identity structure prevents this by explicitly reinforcing "WHO YOU ARE" on every session.

---

## The Behavioral Derailment Problem

During Kraken v1.2 build, the primary agent (designated as "Kraken orchestrator") failed to use ANY of its parallel delegation tools:
- `spawn_shark_agent` — used 0 times
- `run_parallel_tasks` — used 0 times
- `spawn_manta_agent` — used 0 times

Instead, it wrote 10+ files sequentially over ~2 hours. A properly identity-aware orchestrator would have delegated to 3 parallel agents and completed in 30-40 minutes.

**Root Cause:** No identity reinforcement. The agent had Kraken's tools but not Kraken's identity.

---

## How To Use This Library

Read these files in order. They build on each other:

| File | Purpose |
|------|---------|
| `01_SURFACE_ANALYSIS.md` | What problem identity solves |
| `02_ARCHITECTURE.md` | How the system fits together |
| `03_COMPONENTS.md` | Parts and their jobs |
| `04_DATA_FLOW.md` | How identity flows into agent |
| `05_INTERFACES.md` | Contracts between agent and harness |
| `06_STATE_MANAGEMENT.md` | Session state with identity |
| `07_ERROR_HANDLING.md` | When identity fails |
| `08_TESTING.md` | Verifying identity works |
| `09_DEPLOYMENT.md` | Deploying identity system |
| `10_MENTAL_MODEL.md` | Simplest explanation |

---

## Quick Start

To give any agent identity awareness:

1. Create `identity/{role}/` directory
2. Write `SOUL.md` — "You ARE a {role} agent..."
3. Write `IDENTITY.md` — Role, expertise, working style
4. Write `EXECUTION.md` — How to do the job (delegation patterns for orchestrators)
5. Write `SPIDER.md` — Quality gates and debug protocol
6. Inject via session.started hook or tab-toggle event

---

## Key Files

| Path | Purpose |
|------|---------|
| `ARCHITECTURE/AGENT_IDENTITY_SYSTEM.md` | Complete architecture |
| `META/DESIGN_REASONING.md` | Why identity works |
| `META/AUDIT_LOG.md` | Change history |
| `SPEC/IDENTITY_SPEC.md` | Technical specification |
| `TEMPLATES/NEW_AGENT_TEMPLATE.md` | Template for new agents |

---

## The Trident Brain Connection

This library was created using **Trident Brain Deep Planning Mode** — a 3-layer reasoning system:

- **Layer 1:** What is this really? (First principles)
- **Layer 2:** How does it decompose? (Components, flows)
- **Layer 3:** Can I explain it to another agent? (Context library output)

The identity structure itself implements similar depth: SOUL (core essence), IDENTITY (role), EXECUTION (behavior), SPIDER (quality gates).

---

## Evidence of Problem

From Kraken v1.2 build session:

| Metric | Expected (with identity) | Actual (without identity) |
|--------|------------------------|--------------------------|
| Parallel delegations | 10+ | 0 |
| Files written via agents | 15+ | 0 |
| Build time | ~35 min | ~120 min |
| Tool usage diversity | 5+ tools | 3 tools (write, read, edit) |

---

*Context library created: 2026-04-16*
*Next update: When identity injection is implemented in kraken-agent