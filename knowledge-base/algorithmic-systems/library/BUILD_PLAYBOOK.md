# Build Playbook: Algorithmic Mechanical Systems

> Step-by-step guide for building production-ready algorithmic systems that integrate with model ecosystems

---

## Prerequisites

- Python 3.8+
- File system access
- No external API dependencies (for the algorithmic core)

---

## Phase 1: Design

### Step 1.1: Define the Problem

```python
# BAD: Vague problem statement
"""
We need an AI system to process customer messages.
"""

# GOOD: Specific, mechanical problem statement
"""
We need to:
1. Ingest customer messages from a JSON file structure
2. Classify each as: complaint, question, feedback, or other
3. Route to appropriate queue based on classification
4. Track processing state to survive restarts
5. Generate a daily summary of message counts by category
"""
```

**Why this matters**: The good version tells you exactly what is mechanical (1-4) and what might need a model (5).

### Step 1.2: Identify Mechanical vs Model Tasks

| Task Type | Indicators | Approach |
|-----------|------------|----------|
| **Mechanical** | Pattern matching, counting, routing, validation, scheduling | Regex, Python stdlib |
| **Model** | Natural language generation, ambiguity resolution, creative output | LLM call |

```
Ask for each task: "Can I write a rule/pattern/algorithm for this?"

If YES → Mechanical
If NO → Model (and verify model is actually needed)
```

### Step 1.3: Design State Schema

```python
STATE = {
    "processed": [],        # List[str] of content hashes for dedup
    "last_run": None,       # ISO timestamp of last execution
    "stats": {},            # Dict[str, int] counters by category
    "queues": {},           # Dict[str, List[str]] message IDs by queue
    "config": {
        "absorb_interval": 900,
        "synthesize_interval": 14400,
    }
}
```

**Design principles**:
- `processed` is a bounded FIFO list (keep last N)
- `stats` is append-only counters (reset by clearing, not reading)
- All timestamps in ISO format (timezone-aware if possible)

---

## Phase 2: Core Implementation

### Step 2.1: File Structure

```
project/
├── scripts/
│   ├── main.py              # Entry point, orchestrates phases
│   ├── absorber.py          # Phase 1: ingest and classify
│   ├── processor.py         # Phase 2: transform and route
│   ├── synthesizer.py       # Phase 3: generate summaries
│   ├── state.py             # State management utilities
│   └── health.py            # Health check and recovery
├── .state/
│   ├── state.json           # Main state file
│   └── logs/                # Execution logs
├── context/
│   ├── raw/                 # Absorbed content
│   ├── processed/           # Processed content
│   └── output/              # Generated output
└── tests/
    ├── test_absorber.py
    ├── test_processor.py
    └── test_synthesizer.py
```

### Step 2.2: Implement State Management

```python
from pathlib import Path
import json
import hashlib
import datetime

class StateManager:
    def __init__(self, state_path: Path):
        self.state_path = state_path
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
    
    def load(self) -> dict:
        if self.state_path.exists():
            try:
                return json.loads(self.state_path.read_text())
            except json.JSONDecodeError:
                return self._default_state()
        return self._default_state()
    
    def _default_state(self) -> dict:
        return {
            "processed": [],
            "last_run": None,
            "stats": {},
            "queues": {},
        }
    
    def save(self, state: dict):
        # Atomic write
        tmp = self.state_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(state, indent=2))
        tmp.replace(self.state_path)
    
    def is_processed(self, content_hash: str) -> bool:
        state = self.load()
        return content_hash in state.get("processed", [])
    
    def mark_processed(self, content_hash: str, max_history: int = 10000):
        state = self.load()
        processed = set(state.get("processed", []))
        processed.add(content_hash)
        # Bounded FIFO
        processed_list = list(processed)[-max_history:]
        state["processed"] = processed_list
        state["last_run"] = datetime.datetime.now().isoformat()
        self.save(state)
```

### Step 2.3: Implement Content Classification

```python
import re
from typing import Literal

Category = Literal["complaint", "question", "feedback", "other", "social", "links", "decisions", "notes"]

CLASSIFIERS = [
    # Order matters! More specific first.
    (r"twitter\.com|x\.com|thread", "social"),
    (r"https?://", "links"),
    (r"(?:not happy|frustrated|angry|complaint|broken)", "complaint"),
    (r"(?:\?|how do|what is|can you|could you|would you)", "question"),
    (r"(?:feedback|suggestion|idea|consider)", "feedback"),
    (r"(?:decide|need to build|must implement|task:)", "decisions"),
    (r"(?:remember|note to self|todo|remind me)", "notes"),
]

def classify(content: str) -> Category:
    content_lower = content.lower()
    for pattern, category in CLASSIFIERS:
        if re.search(pattern, content_lower):
            return category
    return "other"

# Example usage
content_hash = hashlib.md5(content[:200].encode()).hexdigest()[:12]
if not state_manager.is_processed(content_hash):
    category = classify(content)
    # ... write to category directory ...
    state_manager.mark_processed(content_hash)
```

### Step 2.4: Implement Time-Based Processing

```python
import time
from datetime import datetime

class Scheduler:
    def __init__(self, absorb_interval: int = 900, synthesize_interval: int = 14400):
        self.absorb_interval = absorb_interval
        self.synthesize_interval = synthesize_interval
        self.last_absorb = 0
        self.last_synthesize = 0
    
    def should_absorb(self) -> bool:
        return time.time() - self.last_absorb >= self.absorb_interval
    
    def should_synthesize(self) -> bool:
        return time.time() - self.last_synthesize >= self.synthesize_interval
    
    def mark_absorb_done(self):
        self.last_absorb = time.time()
    
    def mark_synthesize_done(self):
        self.last_synthesize = time.time()
    
    def run_loop(self, absorber, synthesizer, check_interval: int = 30):
        while True:
            if self.should_absorb():
                absorber.run()
                self.mark_absorb_done()
            
            if self.should_synthesize():
                synthesizer.run()
                self.mark_synthesize_done()
            
            time.sleep(check_interval)  # Non-blocking
```

### Step 2.5: Implement Algorithmic Synthesis

```python
import re
from collections import defaultdict

def algorithmic_summarize(items: list) -> str:
    """Generate structured summary without LLM."""
    
    decisions, ideas, technical, questions, urls = [], [], [], [], []
    
    for item in items:
        content = item.get("content", "")[:1500]
        role = item.get("role", "")
        
        # Questions
        if re.search(r"\?$", content) or re.search(r"^(?:what|how|why|when|where|who|should)\s", content, re.I | re.M):
            questions.append(content[:150])
        
        # URLs
        urls.extend(re.findall(r"https?://\S+", content)[:5])
        
        # Technical (code, paths, commands)
        for m in re.findall(r"`([^`]+)`", content):
            if 10 < len(m) < 200:
                technical.append(m.strip()[:100])
        
        for m in re.findall(r"(?:^|[/\s])([a-zA-Z0-9_/-]+\.(?:py|js|ts|md|yaml|json|sh|txt))(?:/\S+)?", content):
            if len(m) > 10:
                technical.append(m.strip()[:100])
        
        # Decisions (action verbs in user messages)
        if role == "user":
            first_line = content.split("\n")[0][:100].lower()
            if re.match(r"^(we need|build|implement|create|fix|update|decide|choose|start|stop)", first_line):
                decisions.append(content[:150])
        
        # Ideas (substantial non-decision user content)
        if role == "user" and len(content.split()) > 15:
            if not any(first_line.startswith(x) for x in ["we need", "build", "implement", "decide"]):
                ideas.append(content[:150])
    
    # Deduplicate
    decisions = list(dict.fromkeys(decisions))[:5]
    ideas = list(dict.fromkeys(ideas))[:6]
    technical = list(dict.fromkeys(technical))[:15]
    questions = list(dict.fromkeys(questions))[:5]
    urls = list(dict.fromkeys(urls))[:10]
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    output = f"""## Summary — {now}

### Decisions & Tasks
{chr(10).join(f"- {d}" for d in decisions) if decisions else "- (none)"}

### Ideas & Observations
{chr(10).join(f"- {i}" for i in ideas) if ideas else "- (none)"}

### Technical Notes
{chr(10).join(f"- `{t}`" for t in technical) if technical else "- (none)"}

### Questions
{chr(10).join(f"- {q}" for q in questions) if questions else "- (none)"}

### URLs
{chr(10).join(f"- {u}" for u in urls) if urls else "- (none)"}
"""
    return output
```

---

## Phase 3: Health & Recovery

### Step 3.1: Health Check Script

```bash
#!/bin/bash
# health-check.sh

SCRIPT_NAME="main.py"
WORKSPACE="$HOME/project"
LOG_FILE="$WORKSPACE/.state/health.log"

if ! pgrep -f "python.*$SCRIPT_NAME" > /dev/null; then
    echo "[$(date)] Process not running, restarting..." >> "$LOG_FILE"
    cd "$WORKSPACE/scripts"
    nohup python3 main.py --daemon >> "$WORKSPACE/.state/main.log" 2>&1 &
fi

# Disk usage check
USAGE=$(df "$WORKSPACE" | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$USAGE" -gt 90 ]; then
    echo "[$(date)] WARNING: Disk usage at ${USAGE}%" >> "$LOG_FILE"
fi
```

### Step 3.2: Cron Entry

```bash
# Add to crontab
crontab -e

# Every 5 minutes
*/5 * * * * /path/to/health-check.sh >> /path/to/.state/health.log 2>&1
```

---

## Phase 4: Model Integration (Opt-In)

### When to Add Model

Only add model synthesis if:
1. Algorithmic summary is insufficient for the use case
2. You have a clear benchmark showing algorithmic is lacking
3. The cost/latency is acceptable for your use case

### How to Add Model (Opt-In Pattern)

```python
# In main.py
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--use-model", action="store_true", help="Enable LLM synthesis")
args = parser.parse_args()

def run():
    if args.use_model:
        synthesizer = ModelSynthesizer()
    else:
        synthesizer = AlgorithmicSynthesizer()
    
    # ... rest of logic
```

### Model Synthesis Wrapper (Optional)

```python
def model_synthesize(items: list, api_key: str) -> Optional[str]:
    """LLM synthesis - opt-in only."""
    if not api_key:
        return None
    
    prompt = f"""Summarize these {len(items)} items concisely.
Format as markdown with sections."""
    
    try:
        response = call_openrouter(prompt, api_key)
        return response
    except Exception as e:
        logger.warning(f"Model synthesis failed: {e}")
        return None

def run_synthesis(use_model: bool):
    items = get_recent_items()
    
    if use_model:
        result = model_synthesize(items, API_KEY)
        if result:
            return result
    
    # Algorithmic fallback (always available)
    return algorithmic_summarize(items)
```

---

## Phase 5: Testing

### Unit Tests for Classification

```python
import pytest
from scripts.processor import classify

def test_classify_urls():
    assert classify("Check out https://example.com") == "links"

def test_classify_questions():
    assert classify("How do I fix this?") == "question"
    assert classify("What is the status?") == "question"

def test_classify_decisions():
    assert classify("We need to build a new API") == "decisions"
    assert classify("Implement the fix") == "decisions"

def test_classify_complaint():
    assert classify("I'm not happy with this") == "complaint"
    assert classify("This is broken") == "complaint"

def test_classify_default():
    assert classify("Hello there") == "other"
```

### Unit Tests for Synthesis

```python
import pytest
from scripts.synthesizer import algorithmic_summarize

def test_synthesize_questions():
    items = [{"content": "How do I fix this?", "role": "user"}]
    result = algorithmic_summarize(items)
    assert "How do I fix this?" in result

def test_synthesize_deduplication():
    items = [
        {"content": "We need to build API", "role": "user"},
        {"content": "We need to build API", "role": "user"},  # Duplicate
    ]
    result = algorithmic_summarize(items)
    # Should appear only once
    assert result.count("We need to build API") == 1
```

### Integration Test

```python
def test_full_pipeline(tmp_path):
    # Setup
    state_path = tmp_path / "state.json"
    content_dir = tmp_path / "content"
    content_dir.mkdir()
    
    # Write test content
    (content_dir / "msg1.md").write_text("Question: how do I use this?")
    
    # Run absorber
    from scripts.absorber import Absorber
    absorber = Absorber(state_path, content_dir)
    absorber.run()
    
    # Verify state
    state = json.loads(state_path.read_text())
    assert len(state["processed"]) == 1
    
    # Run synthesizer
    from scripts.synthesizer import algorithmic_summarize
    items = absorber.get_items()
    result = algorithmic_summarize(items)
    
    assert "how do I use this?" in result
```

---

## Phase 6: Deployment

### Daemon Startup

```bash
cd ~/project/scripts

# Start in background with nohup
nohup python3 main.py --daemon > ~/.state/main.log 2>&1 &

# Verify it's running
ps aux | grep "python.*main.py" | grep -v grep
```

### Log Rotation

```bash
# In crontab
0 0 * * * find ~/.state -name "*.log" -mtime +7 -delete
```

### Monitoring

```bash
# Check last run time
cat ~/.state/state.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('last_run'))"

# Check stats
cat ~/.state/state.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('stats'))"
```

---

## Checklist

Before deploying, verify:

- [ ] All regex patterns tested with edge cases
- [ ] State management survives SIGKILL (atomic writes verified)
- [ ] Health check cron installed and tested
- [ ] Log rotation configured
- [ ] Dedup bounded (last N items, not unbounded)
- [ ] Time intervals are configurable (not hardcoded)
- [ ] Can run without model (all algorithmic paths tested)
- [ ] Error handling catches file I/O errors, not just generic Exception
- [ ] Unit tests cover classification and synthesis
- [ ] Integration test verifies full pipeline

---

## Quick Reference

### Common Regex Patterns

```python
# URLs
re.findall(r"https?://\S+", content)

# Code blocks
re.findall(r"`([^`]+)`", content)

# File paths by extension
re.findall(r"\.(?:py|js|ts|md|yaml|json|sh|txt)\b", content)

# Questions
re.search(r"\?$", content) or re.match(r"^(?:what|how|why|when|where|who|should)", content, re.I)

# Action verbs (decisions)
re.match(r"^(?:we need|build|implement|create|fix|update|decide|choose|start|stop)", first_line, re.I)

# Timestamps
re.findall(r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}", content)
```

### State Schema Template

```python
{
    "processed": [],           # List[str] - bounded
    "last_run": None,           # ISO timestamp
    "last_absorb": None,        # ISO timestamp
    "last_synthesize": None,    # ISO timestamp
    "stats": {},                # Dict[str, int]
    "errors": [],               # List[str] - last N errors
}
```

### File Naming Convention

```
{date}_{session_id[:12]}_{content_hash[:8]}.md
Example: 20260402_183056_c8b587_de1a.md
```

---

*Last updated: 2026-04-02 19:00*
*Use this playbook as a template for new algorithmic systems*
