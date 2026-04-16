# BUILD ARCHITECTURE: HERMES HIVE-SKELETON v2
## Mechanical Memory Overhaul Specification

**Status:** ARCHITECTURAL SPECIFICATION
**Target Execution:** Build Agent (Fresh Instance)
**Objective:** Replace fuzzy, implicit LLM-based memory with a deterministic, 3-tier mechanical filesystem architecture.

---

## 1. SYSTEM PHILOSOPHY
The core failure of current memory is "Fuzzy Retrieval" (summaries in prompts). This architecture implements **"Positional Memory"**. 
Knowledge is not "remembered"; it is **addressed**.

**Core Constraints:**
- **No Global Memory:** Abolish the use of `memory` and `user` tool targets for project data.
- **Hard Siloing:** All data must be stored in profile-specific directories.
- **Path-Based Truth:** The only source of truth is the file on disk. L0 and L1 are merely indices to L2.

---

## 2. FILESYSTEM SPECIFICATION

The Build Agent must implement the following directory hierarchy exactly.

### 2.1 Profile Workspace (Siloed)
`~/.hermes/profiles/{profile_name}/`
├── `.config/`                # Isolated profile configuration
├── `sessions/`               # L1 Session State
│   └── `{session_id}/`
│       ├── `state.json`      # Active variables/goals
│       ├── `events.jsonl`    # Immutable tool/response log
│       └── `plan.md`         # Living session roadmap
└── `workspace/`              # L2 Project Memory
    └── `{project_id}/`       # Project-specific namespace
        ├── `.abstract.md`    # L0: Vector scent (~100 tokens)
        ├── `.overview.md`    # L1: Navigation map (~1k tokens)
        ├── `00_OVERVIEW.md`  # Mission / High-level architecture
        ├── `01_STATUS.md`    # Current Delta / Progress
        ├── `02_BLOCKERS.md`  # Critical Failure Log
        ├── `CONTEXT_LIBRARY.md` # Master Index (Keyword -> Path)
        └── `docs/`           # L2 Detailed Content
            └── `{topic}/`
                ├── `.abstract.md`  # Topic L0
                ├── `.overview.md`  # Topic L1
                └── `{file}.md`     # L2 Ground Truth

### 2.2 Institutional Core (Shared)
`~/.hermes/institutional/`
├── `skills/`                 # Procedural memory (How-to)
├── `failures/`               # Global "Never Do This Again" registry
└── `canonical_T2/`           # High-level synthesized truths

---

## 3. THE 3-TIER RETRIEVAL PROTOCOL

The Build Agent must configure the agent's core loop to follow this exact sequence for all memory retrieval:

### Tier 0: The Scent (L0)
- **Format:** `.abstract.md`
- **Purpose:** Quick relevance check via vector search (OpenViking).
- **Constraint:** Max 100 tokens.
- **Action:** `OpenViking.search() -> returns L0 text + URI`.

### Tier 1: The Map (L1)
- **Format:** `.overview.md`
- **Purpose:** Understand content scope and find the specific L2 path.
- **Constraint:** Max 1k tokens.
- **Action:** `read_file(URI + ".overview.md") -> resolve L2 filename`.

### Tier 2: The Truth (L2)
- **Format:** Original file (Markdown/JSON/etc).
- **Purpose:** Detailed information extraction.
- **Constraint:** Unlimited.
- **Action:** `read_file(L2_PATH)`.

---

## 4. OPERATIONAL PROTOCOLS (The "Mechanics")

### 4.1 The "Check-In" Protocol
Before any project-related action, the agent must:
1. Identify the `project_id`.
2. Verify the existence of the `workspace/{project_id}/` directory.
3. Read `01_STATUS.md` to synchronize current state.

### 4.2 The "Silo Guardrail"
The Build Agent must implement a tool-level check:
- **Rule:** Any `read_file` or `write_file` call must be validated against the current active profile path.
- **Forbidden:** Any access to `~/.hermes/profiles/{other_profile}/`.

### 4.3 The "Session Receipt"
Upon session termination or context compression:
1. Generate a `receipt.json` containing:
    - Summary of changes to L2 files.
    - Updated `01_STATUS.md` delta.
    - New L0/L1 abstracts for created content.
2. Upload `receipt.json` to OpenViking for cross-session indexing.

---

## 5. INTEGRATION WITH OPENVIKING

The memory system must interface with OpenViking as follows:
- **Local First:** All writes go to the filesystem (L2) first.
- **Asynchronous Indexing:** A background process (or hook) must generate L0/L1 and upload them to OpenViking.
- **Pointer-Only Retrieval:** OpenViking must be configured to return **URIs**, not summaries. The agent is forbidden from trusting OpenViking's text; it must use the URI to read the file.

---

## 6. VERIFICATION CHECKLIST FOR BUILD AGENT

The build is successful ONLY if:
- [ ] `~/.hermes/profiles/{profile}/workspace/` is created and populated.
- [ ] Global `memory` and `user` tool targets are disabled/ignored.
- [ ] A test query for a known keyword resolves as: `Scent (L0) -> Map (L1) -> Truth (L2)`.
- [ ] Cross-profile access attempts are blocked by the guardrail.
- [ ] Session receipts are successfully written to disk and indexed.
