# HERMES MEMORY OVERHAUL — Institutional Context Library

**Project Name:** HIVE-SKELETON v2
**Status:** Architectural Design Phase
**Lead Architect:** Hermes Agent (Synthesis)
**Target Goal:** Eliminate "Fuzzy" LLM memory leakage and implement a deterministic, mechanical, 3-tier filesystem-based memory architecture.

---

## 1. Executive Summary
The current Hermes memory system is a "slop mess" of global summaries and implicit retrieval. This project replaces it with a **Mechanical Memory** system based on the OpenViking 3-tier model and OpenCode workspace siloing.

**The Core Shift:** 
Implicit Memory (summaries in prompts) $\rightarrow$ Explicit Memory (hard paths on disk).

## 2. Core Pillars
- **Tiers over Summaries:** Every piece of knowledge has an L0 (Scent), L1 (Map), and L2 (Truth).
- **Silos over Globals:** No global `memory` or `user` targets. All project data lives in profile-isolated workspaces.
- **Addresses over Guesses:** Retrieval is a process of resolving a URI, not a semantic guess.

## 3. High-Level Navigation
- **For the Build Agent:** Start at `BUILD/BUILD_CHECKLIST.md` and follow the `IMPLEMENTATION/` phases.
- **For the Architect:** Review `ARCHITECTURE/BUILD_ARCHITECTURE.md` and `ARCHITECTURE/L0_L1_L2_SPEC.md`.
- **For the Auditor:** Check `REFERENCE/v0.6.0_Memory_Synthesis.md` to see how old systems were mapped.

---
**Last Updated:** 2026-04-09
**Maintained by:** Hermes Agent
