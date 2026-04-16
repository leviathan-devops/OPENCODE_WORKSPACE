# Evolution: Model-First → Algorithmic-First

## The Complete Journey of the Hermes Synthesizer

---

## Version Timeline

| Version | Date | Philosophy | Model Calls |
|---------|------|------------|-------------|
| v1 | 2026-04-02 18:13 | Model-first, rules as fallback | Every synthesis |
| v2 | 2026-04-02 18:31 | Model-first with better fallback chain | Every synthesis (then rate-limited) |
| v3 | 2026-04-02 19:00 | Algorithmic-first, model opt-in | Zero (by default) |

---

## v1: Model-First Approach

### Design Philosophy

> "Use the model to understand content, fall back to rules when the model fails."

### Code Structure (Conceptual)

```python
# v1 pseudocode
def synthesize(items):
    prompt = f"""Analyze these {len(items)} items.
    Extract: decisions, ideas, technical notes, questions.
    Format as markdown."""
    
    try:
        return call_openrouter(prompt)  # Always try model first
    except RateLimitError:
        return rule_based_fallback(items)  # Rarely used
    except ModelError:
        return rule_based_fallback(items)  # Rarely used
```

### Problems with v1

1. **Rate limits**: Free tier models hit 429s constantly
2. **Latency**: Every synthesis = 10-60s wait
3. **Cost**: Even free tier has quota limits
4. **Overkill**: Calling a model to extract "`code`" patterns that regex handles perfectly

### What v1 Got Right

- Framework for absorption + synthesis separation
- Session parsing logic
- State management

---

## v2: Better Fallback Chain

### Design Philosophy

> "Try model, but have a robust fallback ready. Log when fallback is used."

### Code Structure (Key Changes)

```python
# v2 - added model priority list and better fallback
FREE_MODELS = [
    "qwen/qwen3-coder:free",
    "qwen/qwen3.6-plus-preview:free", 
    "google/gemma-3-27b-it:free",
]

def call_model(prompt):
    for model in FREE_MODELS:
        try:
            return openrouter_call(model, prompt)
        except HTTPError as e:
            if e.code == 429:
                time.sleep(60)  # Wait and retry next model
                continue
            return None  # Other errors = give up
    return None  # All models failed

def synthesize(items):
    result = call_model(build_prompt(items))
    if result is None:
        return rule_based_synthesize(items)  # Fallback
    return result
```

### Improvements over v1

- Tried multiple free models in sequence
- Rate limit backoff between models
- Logging of fallback usage

### Problems with v2

- **Still model-first**: Tried model even for trivial extractions
- **Fallback never tested**: Since it rarely triggered, it had bugs
- **Waited 60s per 429**: Unnecessary delay
- **Fundamental inefficiency**: Why call model to extract "text in backticks"?

### The Critical Insight

> While debugging v2's rate limiting, we asked: *"What if the fallback is actually just as good? What are we even using the model for?"*

The answer: extracting patterns that regex handles perfectly.

---

## v3: Algorithmic by Default

### Design Philosophy

> "If a human can write a rule for it, write the rule. Reserve models for what rules literally cannot do."

### Code Structure (Key Changes)

```python
# v3 - algorithmic first, model is opt-in
def synthesize(items):
    # Default: algorithmic synthesis (zero model calls)
    return algorithmic_synthesize(items)

def algorithmic_synthesize(items):
    """Rule-based synthesis - no model needed."""
    
    decisions, ideas, technical, questions, urls = [], [], [], [], []
    
    for item in items:
        content = item.get("content", "")[:1500]
        role = item.get("role", "")
        
        # Questions - ends with ? or question word at start
        if re.search(r"\?$", content) or re.search(r"^(?:what|how|why|when|where|who|should|could|would)\s", content, re.I | re.M):
            questions.append(content[:150])
        
        # URLs
        for m in re.findall(r"https?://\S+", content):
            urls.append(m[:120])
        
        # Code blocks - extract anything in backticks
        for m in re.findall(r"`([^`]+)`", content):
            if 10 < len(m) < 200 and not m.startswith("#"):
                technical.append(m.strip())
        
        # File paths - regex for common extensions
        for m in re.findall(r"(?:^|[/\s])(?:[.a-zA-Z0-9_/-]+\.){1,3}(?:py|js|ts|md|yaml|json|sh|txt)(?:\.\w+)?", content, re.I):
            if len(m) > 15:
                technical.append(m.strip())
        
        # Decisions - action verbs at start of user message
        if role == "user":
            first_line = content.split("\n")[0][:100].lower()
            if re.match(r"^(we need|build|implement|create|fix|update|change|decide|choose|start|stop)", first_line):
                decisions.append(content[:150])
        
        # Ideas - substantial user content without action intent
        if role == "user" and len(content.split()) > 15:
            if not any(content[:100].lower().startswith(x) for x in ["we need", "build", "implement", "create", "fix"]):
                ideas.append(content[:150])
    
    return format_output(decisions, ideas, technical, urls, questions)

# Model is opt-in only (never called by default)
def synthesize_with_model(items):
    # ... model call code ...
```

### Results of v3

| Metric | v1/v2 | v3 |
|--------|-------|-----|
| Model calls per synthesis | 1-3 | 0 |
| Synthesis time | 10-90s | <1s |
| Rate limit errors | Frequent | None |
| Cost per synthesis | $0.001-0.01 | $0 |
| Deterministic output | No | Yes |
| Can run offline | No | Yes |

### What v3 Proves

**You don't need a model to extract patterns from text.**

Code blocks, URLs, file paths, question detection, decision classification — all of these are pure algorithmic operations. The model adds nothing except latency, cost, and non-determinism.

---

## Side-by-Side Comparison

### The Extraction Logic

| Content Type | v1/v2 Model Prompt | v3 Algorithmic |
|--------------|-------------------|----------------|
| Questions | `"Extract any questions from the text"` | `re.search(r"\?$", content)` |
| Code blocks | `"Find code snippets"` | `re.findall(r"`([^`]+)`", content)` |
| URLs | `"Find links"` | `re.findall(r"https?://\S+", content)` |
| File paths | `"Find file references"` | `re.findall(r"\.(py\|js\|md\|yaml...)", content)` |
| Decisions | `"Identify action items"` | `re.match(r"^(we need\|build\|implement...)", first_line)` |

### The Performance Math

```
v1/v2 per synthesis:
  - 1-3 model calls × 30s average = 30-90 seconds
  - $0.001-0.01 per call = $0.001-0.03
  - Rate limit retry = +60s wait
  - Total: 30-150 seconds, variable cost

v3 per synthesis:
  - Regex on 30 items × microseconds = <1 second
  - $0 per call
  - No rate limits, no waiting
  - Total: <1 second, zero cost
```

### The Reliability Math

```
v1/v2 failure modes:
  - OpenRouter 429 rate limit
  - OpenRouter 500 internal error
  - Model returns malformed output
  - Network timeout
  - API key invalid
  - All require error handling, retries, logging

v3 failure modes:
  - File not found (handle with try/except)
  - JSON parse error (handle with try/except)
  - Disk full (health check catches this)
  - That's it
```

---

## What We Learned

### The Rule of Thumb

> **If you can write the instruction as "extract X from Y" and the answer is a pattern, use regex. If the answer requires understanding context, nuance, or ambiguity, use a model.**

### Examples

| Task | Approach | Why |
|------|----------|-----|
| "Find all URLs" | Regex | Pattern matching |
| "Find all code blocks" | Regex | Pattern matching |
| "Count messages per user" | Python dict | Aggregation |
| "Classify as decision/idea/note" | Regex + keyword | Structural pattern |
| "Detect if this is a question" | Regex | Pattern matching |
| "Summarize the key themes" | Model | Requires understanding |
| "Explain why this decision was made" | Model | Requires reasoning |
| "Generate a response" | Model | Requires generation |
| "Resolve this ambiguous classification" | Model | Requires judgment |

### The Mechanical Sweet Spot

```
MECHANICAL (do these first):
  ✓ Pattern detection
  ✓ Classification by keyword/structure
  ✓ Aggregation and counting
  ✓ Routing based on rules
  ✓ Scheduling and timing
  ✓ State persistence
  ✓ Format transformation
  ✓ Deduplication
  ✓ Validation

MODEL (only for these):
  ✓ Natural language generation
  ✓ Ambiguity resolution
  ✓ Creative synthesis
  ✓ Cross-domain reasoning
  ✓ Contextual understanding
  ✓ Explanation generation
```

---

## The Transition Guide

### How to Migrate Any System from Model-First to Algorithmic-First

#### Step 1: Audit Current Model Usage

```python
# Before: Model does everything
def process(content):
    return call_model(f"Process: {content}")

# Audit question: What does the model actually DO?
# - Extracts patterns? → Algorithmic
# - Generates text? → Model
# - Classifies by content? → Algorithmic if keyword-based
# - Classifies by meaning? → Model
```

#### Step 2: Identify Mechanical Subtasks

```
Input: "This message has URLs, code, and a question"

Model does:
  1. Extract URLs → REPLACE with regex
  2. Extract code → REPLACE with regex  
  3. Detect question → REPLACE with regex
  4. Generate summary → KEEP model (or decide if needed)

Result: 3 model calls → 1 model call (or 0 if summary not needed)
```

#### Step 3: Build Algorithmic Core

```python
def algorithmic_extract(content):
    return {
        "urls": re.findall(r"https?://\S+", content),
        "code": re.findall(r"`([^`]+)`", content),
        "is_question": bool(re.search(r"\?$", content)),
        "category": classify_by_keyword(content),
    }
```

#### Step 4: Keep Model for What Matters

```python
def process(content):
    extracted = algorithmic_extract(content)
    
    # Only call model for what it uniquely provides
    if extracted["needs_human_summary"]:
        extracted["summary"] = call_model(build_summary_prompt(extracted))
    
    return extracted
```

#### Step 5: Test Both Paths

```python
def test_equivalence():
    test_cases = load_test_cases()
    
    for case in test_cases:
        algo_result = algorithmic_extract(case["content"])
        model_result = call_model(case["prompt"])
        
        # For pattern extraction: results should match
        # For generation: document differences
        compare(algo_result, model_result)
```

---

## Conclusion

The journey from v1 to v3 wasn't about "better models" or "better prompting" — it was about recognizing that **the model was solving a problem we already knew how to solve mechanically**.

The synthesizer now works like this:

```
Sessions → Regex Classification → File Storage → Regex Extraction → Structured Output
                                    ↑
                              No model calls
                              in this pipeline
```

And it works better: faster, cheaper, more reliable, deterministic, and testable.

**The model is still available** — but only for what it uniquely provides: natural language generation when you actually need it, not as a default hammer for every nail.

---

*Last updated: 2026-04-02 19:00*
*Documented: The complete evolution from model-first to algorithmic-first*