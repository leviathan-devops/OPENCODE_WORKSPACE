# Algorithmic Systems Engineering

> Building mechanical intelligence that works 100% without models — then integrates seamlessly with model ecosystems

---

## Quick Navigation

- [Core Philosophy](#core-philosophy) — Why mechanical systems belong in AI pipelines
- [Reference Architecture](#reference-architecture) — The Hermes Synthesizer as a living example
- [Pattern Library](#pattern-library) — Reusable algorithmic building blocks
- [Integration Guide](#integration-guide) — How mechanical systems talk to model-based systems

**Related Documents:**
- `algorithmic-systems_EVOLUTION.md` — Complete v1→v2→v3 journey
- `algorithmic-systems_BUILD_PLAYBOOK.md` — Step-by-step implementation guide
- `algorithmic-systems_INDEX.md` — Full library index

---

## Core Philosophy

### The Mechanical Intelligence Stack

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                       │
│           (Natural language, prompts, etc.)             │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                  MODEL ECOSYSTEM                        │
│        (LLMs, reasoning, generation, creativity)         │
└─────────────────────────┬───────────────────────────────┘
                          │ (models call mechanical systems)
┌─────────────────────────▼───────────────────────────────┐
│              ALGORITHMIC LAYER                          │
│         (Deterministic, fast, cheap, reliable)          │
│  • Pattern detection (regex, classification)            │
│  • State management (persistence, tracking)              │
│  • Scheduling (cron, intervals, debouncing)             │
│  • Data transformation (parsing, formatting, diff)       │
│  • Aggregation (counting, dedup)                        │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                 DATA LAYER                               │
│           (Files, databases, caches, queues)            │
└─────────────────────────────────────────────────────────┘
```

### Key Insight: "Model-Ready" vs "Model-Dependent"

```
MODEL-DEPENDENT: "Use a model to extract meaning from this text"
  → Expensive, slow, non-deterministic

MODEL-READY: "Use regex to classify this text, then a model 
              generates natural language summary"
  → Fast, cheap, deterministic classification
  → Model only touches the output, not every document
```

---

## Reference Architecture: Hermes Synthesizer v3

### System Diagram

```
Sessions (CLI + Telegram JSON)
         │
         ▼
┌─────────────────────────────────────────┐
│      ABSORB PHASE (every 15 min)        │
│  1. Scan for new sessions                │
│  2. Extract messages[].{role,content}    │
│  3. Classify via regex (social/links/    │
│     decisions/notes/incoming)           │
│  4. Write to category/YYYYMMDD_*.md     │
│  5. Update bridge_state.json (dedup)   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     SYNTHESIS PHASE (every 4 hours)     │
│  ALGORITHMIC BY DEFAULT (zero model      │
│  calls):                                 │
│  • Questions: regex "\?$"               │
│  • Code: regex "`([^`]+)`"              │
│  • URLs: regex "https?://\S+"           │
│  • Decisions: action verb patterns      │
│  • Deduplicate + format as Markdown     │
│  • Write to synthesis/update_*.md       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│            CONTEXT LIBRARY              │
│  ~/hermes-workspace/context/telegram/  │
│  └── library/INDEX.md ← Agent reads    │
└─────────────────────────────────────────┘

Health: Cron every 5 min restarts daemon if dead
```

### Performance Comparison

| Metric | Model-First (v1/v2) | Algorithmic-First (v3) |
|--------|---------------------|-------------------------|
| Model calls/synthesis | 1-3 | 0 |
| Synthesis time | 10-90s | <1s |
| Cost | $0.001-0.03 | $0 |
| Rate limit errors | Frequent | None |
| Deterministic output | No | Yes |
| Offline capable | No | Yes |

---

## Pattern Library

### Pattern 1: Content Classification

```python
CLASSIFIERS = [
    (r"x\.com|twitter\.com|thread", "social"),    # More specific first
    (r"https?://", "links"),
    (r"(?:do this|build it|implement)", "decisions"),
    (r"(?:remember|note to self|todo)", "notes"),
    (r"\.(jpg|png|gif|mp4)", "images"),
]

def classify(content: str) -> str:
    content_lower = content.lower()
    for pattern, category in CLASSIFIERS:
        if re.search(pattern, content_lower):
            return category
    return "incoming"
```

### Pattern 2: Deduplication Without Database

```python
def mark_processed(content_hash: str, state: dict, max_history: int = 10000):
    processed = set(state.get("processed", []))
    processed.add(content_hash)
    # Bounded FIFO
    state["processed"] = list(processed)[-max_history:]
```

### Pattern 3: Algorithmic Synthesis

```python
def algorithmic_synthesize(items: list) -> str:
    decisions, ideas, technical, questions, urls = [], [], [], [], []
    
    for item in items:
        content = item.get("content", "")[:1500]
        role = item.get("role", "")
        
        # Questions
        if re.search(r"\?$", content) or re.search(r"^(?:what|how|why)\s", content, re.I):
            questions.append(content[:150])
        
        # Code blocks
        for m in re.findall(r"`([^`]+)`", content):
            if 10 < len(m) < 200:
                technical.append(m.strip())
        
        # Decisions (action verbs)
        if role == "user":
            first_line = content.split("\n")[0][:100].lower()
            if re.match(r"^(we need|build|implement|create|fix)", first_line):
                decisions.append(content[:150])
    
    # Deduplicate
    decisions = list(dict.fromkeys(decisions))[:5]
    
    return format_markdown(decisions, ideas, technical, questions, urls)
```

---

## Integration Guide

### When to Call the Model

Only call the model when:
1. **Natural language generation is required** — responses, summaries, explanations
2. **Ambiguity resolution is required** — unclear classification
3. **Creative synthesis is required** — combining ideas in novel ways

Never call the model for: pattern matching, state tracking, scheduling, validation, counting, routing by structure.

### Model Integration Points

```
Algorithmic does: Ingestion, Classification, State, Scheduling, Transform
Model does (opt-in): Creative output, Ambiguity resolution, Generation
```

---

## The Philosophy

> **"Any operation that can be done algorithmically should be done algorithmically. Models should be reserved for what literally cannot be expressed as an algorithm — ambiguity, creativity, natural language generation. If you find yourself reaching for a model to do something a regex can do, that's a design smell."**

---

*Full documentation in: knowledge-base/algorithmic-systems/library/*
*Last updated: 2026-04-02 20:08*
