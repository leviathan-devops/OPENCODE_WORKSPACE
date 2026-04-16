# Implementation Roadmap: HIVE-SKELETON v2

This directory contains the step-by-step execution plans for the Build Agent.

## Phase 1: The Great Migration (The Purge)
**Goal:** Move from fuzzy globals to mechanical silos.
1. **Audit:** Identify all `memory` and `user` tool entries in the current profile.
2. **Triage:** Categorize each entry as "Project X", "Institutional", or "User Profile".
3. **Siloing:** Create the workspace directories and write the data as L2 files.
4. **Purge:** Clear the global memory targets to ensure no "leakage" during testing.

## Phase 2: The Indexing Engine
**Goal:** Create the L0/L1 map.
1. **L0 Generation:** Run a script to generate `.abstract.md` for every L2 file.
2. **L1 Generation:** Generate `.overview.md` for every directory.
3. **Viking Sync:** Upload all L0/L1 content to OpenViking.
4. **Index Mapping:** Create the `MASTER_INDEX.md` mapping keywords to paths.

## Phase 3: The Guardrail Installation
**Goal:** Enforce the mechanical boundary.
1. **Path Validation:** Implement a wrapper for `read_file` and `write_file`.
2. **Profile Lock:** Ensure the agent cannot access other profiles' workspaces.
3. **State Sync:** Implement the "Check-In" protocol (`01_STATUS.md` read on start).

## Phase 4: Validation & Stress Test
**Goal:** Prove the "Sloppiness" is gone.
1. **Keyword Test:** Query a keyword $\rightarrow$ Verify L0 $\rightarrow$ L1 $\rightarrow$ L2 path.
2. **Leakage Test:** Attempt to access "Researcher" data from "Developer" profile $\rightarrow$ Verify BLOCK.
3. **Temporal Test:** Verify the la- la land of "yesterday vs. 2 weeks ago" via `01_STATUS.md` deltas.
