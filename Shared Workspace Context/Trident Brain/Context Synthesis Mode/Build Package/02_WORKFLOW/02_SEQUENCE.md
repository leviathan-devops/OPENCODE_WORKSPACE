# EXECUTION SEQUENCE - Building Context Synthesis Mode

## Phase 1: Trigger Detection

**When:** Continuous monitoring
**What:** Detect manual/gate/error/threshold/stale triggers
**Who:** Trigger Manager

## Phase 2: Layer 1 Collection

**When:** Trigger detected
**What:** Collect T1-T4 context
**Who:** Context Collectors

## Phase 3: Layer 2 Scoring

**When:** Collection complete
**What:** Score and rank all context
**Who:** Relevance Scorer

## Phase 4: Layer 3 Compression

**When:** Scoring complete
**What:** Compress to <2k, preserve decisions
**Who:** Compression Engine

## Phase 5: Layer 4 Injection

**When:** Compression complete
**What:** Format as T0-ready stream
**Who:** Injection Formatter

## Phase 6: Output

**When:** Layer 4 complete
**What:** Inject into thought stream
**Who:** Trident Brain host