# Algorithmic Systems Engineering — Library Index

## Overview

Reference library for building mechanical intelligent systems that work 100% without models, then integrate seamlessly with model ecosystems.

**Core thesis**: If a human can write a rule for it, write the rule. Reserve models for what rules literally cannot do.

---

## Library Contents

### [README.md](README.md) — Core Documentation
- System diagram and architecture
- Why algorithmic systems belong in AI pipelines
- Separation of concerns between models and algorithms

### [EVOLUTION.md](EVOLUTION.md) — Version History  
- Complete journey from v1 (model-first) to v3 (algorithmic-first)
- Side-by-side comparisons of each approach
- Performance and reliability math
- The critical insight that triggered the shift

### [BUILD_PLAYBOOK.md](BUILD_PLAYBOOK.md) — Implementation Guide
- Phase-by-phase build process
- State management patterns
- Content classification patterns
- Time-based processing
- Health monitoring
- Model integration (opt-in)
- Testing strategy
- Deployment checklist

---

## Quick Start

### Building a New Algorithmic System

1. **Define the problem** — Write a specific, mechanical problem statement
2. **Identify mechanical vs model tasks** — Can you write a rule? Use algorithmic.
3. **Design state schema** — How does the system track what's been processed?
4. **Implement core** — absorber → classifier → processor → synthesizer
5. **Add health monitoring** — Cron-based health check + auto-restart
6. **Test thoroughly** — Unit tests for each component + integration test
7. **Deploy** — Daemon mode with log rotation and monitoring

### The Key Question

> "What would a model do here?"

| If answer is... | Use |
|----------------|-----|
| Pattern matching | Regex |
| Classification by structure | Regex + keywords |
| Counting/aggregation | Python dict/counter |
| Routing based on rules | if/elif chain |
| Scheduling | Time-based loop |
| State tracking | Files + JSON |
| Natural language generation | Model (opt-in) |
| Ambiguity resolution | Model (opt-in) |

---

## The Pattern Library (In README.md)

1. **Content Classification** — Layered regex classifiers with priority
2. **Deduplication Without Database** — Hash-based key set with bounded history
3. **Time-Based Processing** — Non-blocking intervals with fine-grained checking
4. **Algorithmic Synthesis** — Targeted extraction + structured formatting
5. **State Persistence** — Atomic write with temp file swap
6. **Session Extraction** — Normalize with truncation and validation
7. **Health Monitoring** — External cron + internal watchdog

---

## System Status

| Component | Location | Status |
|-----------|----------|--------|
| Hermes Synthesizer v3 | `~/hermes-workspace/scripts/hermes-synthesizer.py` | Running (PID 146793) |
| Health Check | `~/hermes-workspace/scripts/health-check.sh` | Cron installed (every 5 min) |
| Context Library | `~/hermes-workspace/context/telegram/` | 550+ items absorbed |
| State Files | `~/.hermes-workspace/.state/` | Active |

**Current config**: Absorb every 15min, synthesize every 4hrs, algorithmic by default.

---

## Key Metrics (v3 vs v1/v2)

| Metric | Model-First (v1/v2) | Algorithmic-First (v3) |
|--------|---------------------|-------------------------|
| Model calls/synthesis | 1-3 | 0 |
| Synthesis time | 10-90s | <1s |
| Cost | $0.001-0.03 | $0 |
| Rate limit errors | Frequent | None |
| Deterministic output | No | Yes |
| Offline capable | No | Yes |

---

## Anti-Patterns (In README.md)

- ❌ "Use model by default, fallback to rules"  
- ❌ "I need AI to decide this"
- ❌ "Rules can't handle this complexity"
- ❌ "Let me just prompt engineer around it"

---

## Further Reading

- [Hermes Conventions](../telegram/TELEGRAM_MEMORY_AUDIT.md) — The agent framework this integrates with
- [State Management Patterns](#) — Deep dive into bounded FIFO dedup (planned)

---

*Last updated: 2026-04-02 19:00*
*Built as a reference library for mechanical intelligence systems*
