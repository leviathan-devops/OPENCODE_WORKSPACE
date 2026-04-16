# Algorithmic Systems Engineering — Reference Library

> *Building mechanical intelligence that works 100% without models — then integrates seamlessly with model ecosystems*

---

## Quick Navigation

- [The Journey](#the-journey) — How we got here, the evolution from model-everything to algorithmic-first
- [Core Thesis](#core-thesis) — Why mechanical systems belong in AI pipelines
- [Reference Architecture](#reference-architecture) — The Hermes Synthesizer as a living example
- [Pattern Library](#pattern-library) — Reusable algorithmic building blocks
- [Integration Guide](#integration-guide) — How mechanical systems talk to model-based systems
- [Build Playbook](#build-playbook) — Step-by-step for building new algorithmic systems

---

## The Journey

### Timeline

| Date | Event | Key Insight |
|------|-------|-------------|
| 2026-04-02 18:13 | Original synthesizer created | Model-first approach works but is expensive and rate-limited |
| 2026-04-02 18:31 | v2 with fallback chain | "We can fall back to rules if model fails" — but still tried model first |
| 2026-04-02 19:00 | v3 — algorithmic by default | **Breakthrough**: If rule-based works, why try model at all? |

### The Realization

```
Previous thinking: "Models are smart, rules are dumb. 
Use models by default, fallback to rules when exhausted."

New thinking: "Rules are FAST, DETERMINISTIC, CHEAP. 
Models are SLOW, EXPENSIVE, NON-DETERMINISTIC.
Use rules by default. Only call models for what rules literally cannot do."
```

The question isn't "can we fallback to rules?" — it's "why are we calling models at all for things rules can do perfectly?"

---

## Core Thesis

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
│                                                         │
│   Models excel at:                                       │
│   • Natural language understanding                     │
│   • Creative generation                                 │
│   • Ambiguous reasoning                                 │
│   • Cross-domain synthesis                              │
└─────────────────────────┬───────────────────────────────┘
                          │ (models call mechanical systems)
┌─────────────────────────▼───────────────────────────────┐
│              ALGORITHMIC LAYER                          │
│         (Deterministic, fast, cheap, reliable)          │
│                                                         │
│   Algorithms excel at:                                  │
│   • Pattern detection (regex, classification)          │
│   • State management (persistence, tracking)           │
│   • Scheduling (cron, intervals, debouncing)           │
│   • Data transformation (parsing, formatting, diff)     │
│   • Aggregation (counting, dedup, dedup)               │
│   • Routing (based on rules, not semantics)             │
│   • Validation (structure, schemas, invariants)         │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                 DATA LAYER                              │
│           (Files, databases, caches, queues)             │
└─────────────────────────────────────────────────────────┘
```

### Why This Architecture Works

1. **Separation of concerns**: Models handle ambiguity, algorithms handle determinism
2. **Cost at scale**: Algorithmic operations cost ~0 vs $0.001-0.01 per model call
3. **Latency**: Algorithmic ops complete in <100ms vs 2-30s for model calls
4. **Reliability**: No rate limits, no API downtime, no model versioning issues
5. **Testability**: Algorithmic systems produce identical outputs for identical inputs — models don't

### The Key Insight: "Model-Ready" vs "Model-Dependent"

```
MODEL-DEPENDENT: "Use a model to extract meaning from this text"
  → Expensive, slow, non-deterministic

MODEL-READY: "Use regex to classify this text, then a model 
              generates natural language summary"
  → Fast, cheap, deterministic classification
  → Model only touches the output, not every document
```

---

## Reference Architecture: Hermes Synthesizer

### System Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         HERMES SYNTHESIZER v3                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         SESSION SOURCES                           │ │
│  │   Telegram ──► Gateway ──► sessions/  (JSON)                      │ │
│  │   CLI ──────────────────────────────────────────────────────────►│ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      ABSORB PHASE (15 min)                        │ │
│  │                                                                    │ │
│  │   1. Scan sessions/ for new JSON files                           │ │
│  │   2. Extract: messages[].{role, content, timestamp}              │ │
│  │   3. Classify content via regex:                                 │ │
│  │        • "twitter.com" → social                                  │ │
│  │        • "https://"     → links                                  │ │
│  │        • "we need"      → decisions                               │ │
│  │        • "note to self" → notes                                  │ │
│  │        • default        → incoming                               │ │
│  │   4. Write to category/YYYYMMDD_sessionid_hash.md               │ │
│  │   5. Update bridge_state.json (dedup tracking)                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    SYNTHESIS PHASE (4 hours)                       │ │
│  │                                                                    │ │
│  │   1. Read last 30 absorbed files                                 │ │
│  │   2. ALGORITHMIC EXTRACTION (zero model calls):                  │ │
│  │        • Questions: regex "\?$" or "^(what|how|why|...)"        │ │
│  │        • Code: regex "`([^`]+)`"                                  │ │
│  │        • URLs: regex "https?://\S+"                              │ │
│  │        • File paths: regex for extensions                         │ │
│  │        • Decisions: action verb patterns at line start           │ │
│  │        • Ideas: long user messages without action verbs         │ │
│  │   3. Deduplicate (dict.fromkeys preserving order)               │ │
│  │   4. Format: Markdown with sections                               │ │
│  │   5. Write to synthesis/update_TIMESTAMP.md                     │ │
│  │   6. Append to library/INDEX.md                                  │ │
│  │   7. Log decisions to decisions.jsonl                            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      CONTEXT LIBRARY                              │ │
│  │                                                                    │ │
│  │   ~/hermes-workspace/context/telegram/library/                   │ │
│  │   ├── INDEX.md          ← Agent reads this for shared context    │ │
│  │   ├── update_*.md       ← Time-boxed synthesized updates         │ │
│  │   └── decisions.jsonl   ← Structured decision log                │ │
│  │                                                                    │ │
│  │   ~/hermes-workspace/context/telegram/{category}/                │ │
│  │   ├── cli/              ← 550+ raw absorbed message files        │ │
│  │   ├── incoming/        ← Telegram casual messages                │ │
│  │   ├── decisions/        ← Classified decisions                   │ │
│  │   └── ...              ← (social, links, notes, images)        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         HEALTH LOOP                               │ │
│  │                                                                    │ │
│  │   Cron (every 5 min): health-check.sh                             │ │
│  │   • Is daemon running? → Restart if not                           │ │
│  │   • Disk usage > 90%? → Warn                                      │ │
│  │   • Synthesizer log has errors? → Alert                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### File Inventory

| Path | Purpose | Size Est |
|------|---------|----------|
| `scripts/hermes-synthesizer.py` | Main daemon (650 lines) | 22KB |
| `scripts/health-check.sh` | Cron health monitoring | 200B |
| `.state/bridge_state.json` | Dedup tracking | ~100KB |
| `.state/synth_state.json` | Synthesis timing | ~1KB |
| `.state/session_snapshot.json` | Session metadata | ~5KB |
| `context/telegram/cli/*.md` | Raw absorbed (550+) | ~50KB |
| `context/telegram/synthesis/update_*.md` | Synthesized context | Growing |

---

## Pattern Library

### Pattern 1: Content Classification

**Problem**: Route incoming content to correct category without model.

**Solution**: Layered regex classifiers with priority ordering.

```python
CLASSIFIERS = [
    (r"x\.com|twitter\.com|thread", "social"),        # Check before general URLs
    (r"https?://", "links"),                            # General URL
    (r"(?:do this|build it|implement)", "decisions"),   # Action intent
    (r"(?:remember|note to self|todo)", "notes"),       # Reminders
    (r"\.(jpg|png|gif|mp4)", "images"),                 # File extensions
]

def classify_content(content: str) -> str:
    content_lower = content.lower()
    for pattern, category in CLASSIFIERS:
        if re.search(pattern, content_lower):
            return category
    return "incoming"  # Default
```

**Key insight**: Order matters. More specific patterns first.

---

### Pattern 2: Deduplication Without Database

**Problem**: Track what's been processed without a database.

**Solution**: Hash-based key set with bounded history.

```python
BRIDGE_STATE = "path/to/bridge_state.json"

def load_state():
    return json.loads(Path(BRIDGE_STATE).read_text())

def save_state(state):
    Path(BRIDGE_STATE).write_text(json.dumps(state, indent=2))

def is_processed(content_hash: str, state: dict) -> bool:
    return content_hash in state.get("processed", set())

def mark_processed(content_hash: str, state: dict):
    state["processed"] = list(set(state["processed"]) | {content_hash})[-10000:]
    # Keep last 10000 to bound memory
```

**Key insight**: Bounded FIFO set — discard oldest when exceeding limit.

---

### Pattern 3: Time-Based Processing

**Problem**: Run processes at correct intervals without blocking.

**Solution**: Compare `time.time()` against last run timestamp.

```python
ABSORB_INTERVAL = 900  # 15 minutes
last_absorb = 0

while True:
    now = time.time()
    
    if now - last_absorb >= ABSORB_INTERVAL:
        absorb_all_sessions()
        last_absorb = now
    
    # Do other work here (not blocking)
    time.sleep(30)  # Check every 30s, not blocking 15 min
```

**Key insight**: Non-blocking with coarse sleep + fine grained checking.

---

### Pattern 4: Algorithmic Synthesis

**Problem**: Summarize content without LLM.

**Solution**: Targeted extraction + structured formatting.

```python
def algorithmic_synthesize(items: list) -> str:
    decisions, ideas, technical = [], [], []
    
    for item in items:
        content = item["content"]
        role = item["role"]
        
        # Questions via regex
        if re.search(r"\?$", content):
            questions.append(content[:150])
        
        # Code via backtick extraction
        for m in re.findall(r"`([^`]+)`", content):
            if 10 < len(m) < 200:
                technical.append(m.strip())
        
        # Decisions via action verb detection
        if role == "user":
            first_line = content.split("\n")[0].lower()
            if re.match(r"^(we need|build|implement|create|fix)", first_line):
                decisions.append(content[:150])
    
    # Deduplicate preserving order
    decisions = list(dict.fromkeys(decisions))[:5]
    
    # Format output
    return f"""## Context Update

### Key Decisions
{chr(10).join(f"- {d}" for d in decisions)}

### Technical Notes
{chr(10).join(f"- `{t}`" for t in technical)}
"""
```

**Key insight**: Model the *structure* you want, not the *meaning* you want.

---

### Pattern 5: State Persistence

**Problem**: Survive restarts without losing track of progress.

**Solution**: Atomic write with temp file swap.

```python
def save_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2))
    tmp.replace(path)  # Atomic on POSIX

def load_json(path: Path) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text())
        except json.JSONDecodeError:
            pass
    return {"processed": [], "last_run": None}
```

**Key insight**: Atomic replace prevents corruption on crash.

---

### Pattern 6: Session Extraction

**Problem**: Parse session files into usable message format.

**Solution**: Normalize with truncation and validation.

```python
def extract_messages(session_data: dict) -> list:
    messages = []
    for msg in session_data.get("messages", []):
        role = msg.get("role", "")
        content = msg.get("content", "")
        
        if role not in ("user", "assistant"):
            continue
        if not content or not isinstance(content, str):
            continue
        
        # Truncate very long messages
        if len(content) > 5000:
            content = content[:5000] + "\n[TRUNCATED]"
        
        messages.append({
            "role": role,
            "content": content.strip(),
            "timestamp": msg.get("timestamp", ""),
        })
    return messages
```

**Key insight**: Truncate at boundary, mark as truncated.

---

### Pattern 7: Health Monitoring

**Problem**: Detect and recover from failures automatically.

**Solution**: External cron checks + internal watchdog.

```bash
#!/bin/bash
# health-check.sh

WORKSPACE="$HOME/hermes-workspace"
SCRIPT_DIR="$WORKSPACE/scripts"

if ! pgrep -f "hermes-synthesizer.py --watch" > /dev/null; then
    echo "[$(date)] Synthesizer not running, restarting..."
    cd "$SCRIPT_DIR"
    nohup python3 hermes-synthesizer.py --watch > "$WORKSPACE/.state/synthesizer.log" 2>&1 &
fi

# Check disk
USAGE=$(df "$WORKSPACE" | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$USAGE" -gt 90 ]; then
    echo "[$(date)] WARNING: Disk usage at ${USAGE}%"
fi
```

**Key insight**: Separate health check from main process. Cron is the watchdog.

---

## Integration Guide

### How Algorithmic Systems Integrate with Model Ecosystems

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTEGRATION POINTS                          │
│                                                                 │
│   1. INGESTION: Algorithmic → Model                            │
│      ─────────────────────────────────────────────              │
│      Raw data → classifier → structured → model (summary)       │
│      Example: 550 message files → categories → 1 summary       │
│                                                                 │
│   2. OUTPUT: Model → Algorithmic                               │
│      ───────────────────────────────────────                   │
│      Model output → parser → actions/files/state               │
│      Example: Model "write decision" → parsed → decisions.jsonl│
│                                                                 │
│   3. BRIDGING: Bidirectional                                    │
│      ─────────────────────────────────                         │
│      Algorithmic does classification/dedup/routing              │
│      Model does creative synthesis/summarization                │
│      Clean handoff at boundaries                                │
└─────────────────────────────────────────────────────────────────┘
```

### The Model's Role (Minimal Viable)

| Task | Algorithmic | Model |
|------|-------------|-------|
| "What's this content about?" | Regex classification | Never needed |
| "Route to correct folder" | File I/O | Never needed |
| "Has this been processed?" | Hash lookup | Never needed |
| "Summarize 30 files" | Regex extraction | Optional (algorithmic works) |
| "Generate response" | N/A | Required |
| "Explain ambiguity" | N/A | Required |
| "Handle edge cases" | N/A | Required |

### When to Call the Model

Only call the model when:
1. **Natural language generation is required** — responses, summaries, explanations
2. **Ambiguity resolution is required** — unclear classification
3. **Creative synthesis is required** — combining ideas in novel ways
4. **Cross-domain reasoning is required** — connecting disparate concepts

Never call the model for:
1. Pattern matching (use regex)
2. State tracking (use files/JSON)
3. Scheduling (use time-based loops)
4. Validation (use schemas)
5. Counting/aggregation (use Python dict/counter)
6. Routing based on structure (use if/elif chains)

---

## Build Playbook

### Building a New Algorithmic System

#### Step 1: Identify the Model Dependency

```
Ask: "What would a model do here?"
If: Extract patterns, classify, route, count, schedule → algorithmic
If: Generate text, resolve ambiguity, creative synthesis → model
```

#### Step 2: Define the Algorithmic Core

```python
# Pseudocode for the algorithmic core
INPUT → PARSE → CLASSIFY → TRANSFORM → OUTPUT
         │          │          │
         └──────────┴──────────┘
              All deterministic
```

#### Step 3: Design the State Schema

```python
STATE = {
    "processed": [],      # List of hashes for dedup
    "last_run": None,     # Timestamp of last execution
    "stats": {},          # Counters for monitoring
    "config": {},         # Adjustable parameters
}
```

#### Step 4: Implement with These Guarantees

```
✓ Idempotent: Running twice = running once
✓ Deterministic: Same input → same output  
✓ Bounded: Memory/time bounded
✓ Recoverable: Survives restarts
✓ Testable: Can unit test each function
```

#### Step 5: Add Health Monitoring

```bash
# Cron entry
*/5 * * * * /path/to/health-check.sh >> /path/to/health.log 2>&1
```

#### Step 6: Define Model Integration Points

```
Algorithmic system owns:
  - Ingestion (read sources)
  - Classification (regex)
  - State management (files)
  - Scheduling (intervals)
  - Data transformation (parsing)

Model owns (opt-in):
  - Summary generation (if needed)
  - Creative output (if needed)
```

---

## Anti-Patterns to Avoid

### ❌ "Use model by default, fallback to rules"

```python
# WRONG - always tries expensive path first
def process(content):
    try:
        return call_model(content)  # Expensive
    except:
        return rule_based(content)   # Rarely used, likely untested
```

### ❌ "I need AI to decide this"

```python
# WRONG - model does not belong here
def classify(content):
    return call_model(f"Classify: {content}")  # Overkill
```

### ❌ "Rules can't handle this complexity"

```python
# WRONG - underselling algorithmic systems
def extract_meaning(content):
    if "?" in content:
        return "question"  # Too simple
    return call_model(content)  # Model for everything
```

### ❌ "Let me just prompt engineer around it"

```python
# WRONG - reaches for model too quickly
def process(content):
    prompt = f"""Analyze this: {content}
    Categories: question, statement, command, idea
    Return only the category."""
    return call_model(prompt)  # Not needed
```

---

## The Philosophy

### Mechanical First, Model Second

```
Every system should be built twice:

1. First build: Completely algorithmic, no models
   - If it works 100% without models, you're done
   - If it fails edge cases, note them

2. Second build (optional): Add model for edge cases
   - Only where algorithmic fundamentally cannot work
   - Not to make the "easy" parts easier
```

### Why This Philosophy Works

1. **Reliability**: Algorithmic systems don't have bad days, rate limits, or model updates
2. **Speed**: Microseconds vs milliseconds vs seconds vs minutes
3. **Cost**: $0 vs $0.001-0.01 per operation
4. **Testability**: You can prove correctness, not just hope for it
5. **Composability**: Algorithmic pieces fit together predictably

### The Mechanical Systems Manifesto

> "Any operation that can be done algorithmically should be done algorithmically. Models should be reserved for what literally cannot be expressed as an algorithm — ambiguity, creativity, natural language generation. If you find yourself reaching for a model to do something a regex can do, that's a design smell."

---

## Appendix: Complete File Listings

### hermes-synthesizer.py — Full Source

See: `~/hermes-workspace/scripts/hermes-synthesizer.py` (v3, 650 lines)

### health-check.sh — Full Source

See: `~/hermes-workspace/scripts/health-check.sh`

### State Files

See: `~/hermes-workspace/.state/`

---

*Last updated: 2026-04-02 19:00*
*Version: 3.0 (Algorithmic by Default)*