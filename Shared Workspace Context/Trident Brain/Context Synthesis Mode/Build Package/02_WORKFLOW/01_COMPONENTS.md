# COMPONENT DECOMPOSITION - Building Context Synthesis Mode

## Component 1: T1 Session Collector

- **Purpose:** Get session state context
- **Inputs:** None (active session)
- **Outputs:** Current gate, task, blockers
- **Priority:** HIGH

## Component 2: T2 Knowledge Collector

- **Purpose:** Get knowledge context from Hermes/Hive/Kraken
- **Inputs:** hermes_remember, hive_context, kraken_hive_search
- **Outputs:** Recent decisions, patterns, past sessions
- **Priority:** HIGH

## Component 3: T3 File Collector

- **Purpose:** Get active file context
- **Inputs:** Recently read files, active files
- **Outputs:** File relevance mapping
- **Priority:** MEDIUM

## Component 4: T4 Tool Collector

- **Purpose:** Get tool history context
- **Inputs:** Recent commands, patterns
- **Outputs:** Tool usage summary
- **Priority:** LOW

## Component 5: Scoring Engine

- **Purpose:** Score context by relevance
- **Formula:** Final = (Urgency × 0.6) + (Importance × 0.4)
- **Outputs:** Ranked context list

## Component 6: Compression Engine

- **Purpose:** Synthesize to <2k tokens
- **Rules:** Preserve decisions, summarize files, prune logs
- **Outputs:** Compressed synthesis