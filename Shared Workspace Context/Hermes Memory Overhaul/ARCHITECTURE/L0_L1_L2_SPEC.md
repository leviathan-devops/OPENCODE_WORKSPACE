# L0/L1/L2 Mechanical Memory Specification

This document defines the exact a-priori requirements for the 3-tier memory structure.

## 1. The L0 Layer (The Scent)
- **Filename:** `.abstract.md`
- **Size Limit:** $\sim$100 tokens.
- **Purpose:** Vector indexing. It is the "hook" that allows a vector DB (OpenViking) to find the right directory.
- **Content:** A concise, one-sentence summary of the folder/file's a-priori essence.

## 2. The L1 Layer (The Map)
- **Filename:** `.overview.md`
- **Size Limit:** $\sim$1k tokens.
- **Purpose:** Navigation and Reranking. It tells the agent *what* is inside the L2 and *where* it is.
- **Content:** 
    - High-level summary of the L2 content.
    - A list of "Key Pointers" (L2 filenames) and their purpose.
    - Instructions on how to read the L2 (e.g., "Read `specs.md` for the API, `logs.md` for the history").

## 3. The L2 Layer (The Truth)
- **Filename:** `original_filename.md` (or binary).
- **Size Limit:** Unlimited.
- **Purpose:** Ground Truth. This is the only layer where actual decision-making data resides.
- **Content:** The raw, unfiltered, complete documentation/log/code.

---

## 4. Retrieval Logic (The Mechanical Loop)

The agent MUST follow this chain for every "memory" request:
1. `Query` $\rightarrow$ `OpenViking Search` $\rightarrow$ `L0 Abstract` $\rightarrow$ `URI`.
2. `URI` $\rightarrow$ `read_file(.overview.md)` $\rightarrow$ `L1 Map`.
3. `L1 Map` $\rightarrow$ `Select L2 File` $\rightarrow$ `read_file(L2_FILE)`.

**Forbidden:** Jumping from L0 directly to L2 without reading L1. This ensures the agent understands the *context* of the truth it is about to read.
