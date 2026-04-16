# Components - Context Synthesis Mode

## Component: Context Collector

- **Purpose:** Gather context from T1-T4 sources
- **Inputs:** Source types (T1/T2/T3/T4)
- **Outputs:** Raw context from each source
- **Boundaries:** READ operations only

## Component: Relevance Scorer

- **Purpose:** Score context by urgency × importance
- **Inputs:** Raw context items
- **Outputs:** Scored and ranked context
- **Boundaries:** Scoring only, no collection

## Component: Compression Engine

- **Purpose:** Synthesize context to <2k tokens
- **Inputs:** Scored context
- **Outputs:** Compressed synthesis
- **Boundaries:** Compression only, no scoring

## Component: Injection Formatter

- **Purpose:** Format as T0-ready thought stream
- **Inputs:** Compressed synthesis
- **Outputs:** T0-ready markdown injection
- **Boundaries:** Formatting only

## Component: Trigger Manager

- **Purpose:** Detect when synthesis should fire
- **Inputs:** System state, tool results
- **Outputs:** Synthesis trigger signal
- **Boundaries:** Detection only, no collection