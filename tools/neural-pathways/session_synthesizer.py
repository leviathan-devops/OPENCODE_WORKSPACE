#!/usr/bin/env python3
"""
Neural Pathways - Session Synthesizer
Phase 2 of the Hive Mind OS neural pathway pipeline.

Reads extracted_sessions.jsonl, synthesizes T2 Macro Context per session using MiniMax M2.7,
and outputs to knowledge-base/AGI_Neural_Pathways/T2_SYNTHESIZED/.
"""

import json
import os
import time
import httpx
from pathlib import Path
from datetime import datetime

# Configuration
INPUT_PATH = (
    "/home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways/extracted_sessions.jsonl"
)
OUTPUT_BASE = "/home/leviathan/OPENCODE_WORKSPACE/knowledge-base/AGI_Neural_Pathways/T2_SYNTHESIZED"
MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "")
MAX_TOKENS = 10240
DELAY_BETWEEN_CALLS = 1.0  # 1 second for paid tier (500 RPM)
# Token Plan uses Anthropic-compatible endpoint: https://api.minimaxi.com/anthropic/v1/messages

# System prompt for synthesis
SYNTHESIS_SYSTEM = """You are a context-synthesis expert. Create a rich T2 macro-context document from the provided OpenCode session.

Output format (Markdown):
# SESSION: {title}

**ID:** {session_id}
**Category:** {category}
**Timeline:** {start_datetime} → {end_datetime}
**Duration:** {duration_minutes} minutes
**Parent:** {parent_id or "root"}

## GOAL
What the user asked for in this session.

## WHAT HAPPENED
Step-by-step narrative of the session:
1. {step 1}
2. {step 2}
...

## KEY BREAKTHROUGHS
- **{breakthrough title}**: {explanation}

## PATTERNS OBSERVED
- {pattern 1}
- {pattern 2}

## FAILURE MODES
- **{failure}**: {what went wrong}, {resolution or not}

## TOOL USAGE
- `{tool_name}`: {when/how used}, {outcome}

## FILES CHANGED
- `{filepath}`: {what changed}

## LESSONS
- {lesson 1}
- {lesson 2}

## CONNECTIONS
- Child sessions: {session_ids or "none"}
- Related sessions: {session_ids or "none"}

Be thorough. Capture the actual content of messages, tool calls, and outcomes.
Do not summarize away the specifics."""


def call_minimax(session_id: str, prompt: str) -> str:
    """Call MiniMax M2.7 API for synthesis using Token Plan Anthropic-compatible endpoint."""
    if not MINIMAX_API_KEY:
        raise RuntimeError("MINIMAX_API_KEY environment variable not set")

    headers = {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": MINIMAX_API_KEY,
    }

    body = {
        "model": "MiniMax-M2.7",
        "max_tokens": MAX_TOKENS,
        "temperature": 1.0,
        "messages": [
            {"role": "system", "content": SYNTHESIS_SYSTEM},
            {"role": "user", "content": prompt},
        ],
    }

    with httpx.Client(timeout=120.0) as client:
        response = client.post(
            "https://api.minimaxi.com/anthropic/v1/messages",
            headers=headers,
            json=body,
        )
        if response.status_code != 200:
            raise RuntimeError(
                f"MiniMax API error {response.status_code}: {response.text}"
            )

        data = response.json()
        content = data.get("content", [])
        if not content:
            raise RuntimeError(f"No content in Anthropic response: {data}")

        # Parse text blocks (ignore thinking blocks)
        text_parts = []
        for block in content:
            if block.get("type") == "text":
                text_parts.append(block.get("text", ""))
        if text_parts:
            return "\n".join(text_parts)

        # No text block found — return thinking as fallback
        for block in content:
            if block.get("type") == "thinking":
                return f"[Thinking]\n{block.get('thinking', '')}"
        raise RuntimeError(f"No text or thinking block in response: {data}")


def build_prompt(session: dict) -> str:
    """Build synthesis prompt from session data."""
    title = session.get("title", "Untitled")
    sid = session.get("session_id", "unknown")
    category = session.get("category", "planning")
    parent_id = session.get("parent_id", None)

    # Timestamps
    tc = session.get("time_created", 0)
    tu = session.get("time_updated", 0)
    start_dt = datetime.fromtimestamp(tc / 1000).isoformat() if tc else "unknown"
    end_dt = datetime.fromtimestamp(tu / 1000).isoformat() if tu else "unknown"
    duration = (tu - tc) // 60000 if tc and tu else 0

    # Message content
    messages = session.get("messages", [])
    message_texts = []
    for msg in messages:
        role = msg.get("role", "user")
        summary = msg.get("summary", "")
        parts = msg.get("parts", [])

        # Collect text from parts
        texts = []
        for part in parts:
            if part.get("type") == "text" and part.get("text"):
                texts.append(part["text"][:2000])  # Truncate long text

        if texts:
            content = " ".join(texts)[:3000]
        elif summary:
            content = f"[Summary] {summary}"
        else:
            continue

        message_texts.append(f"[{role.upper()}]\n{content[:2000]}")

    # Tool usage
    tools = []
    for msg in messages:
        for part in msg.get("parts", []):
            if part.get("tool"):
                tool_name = part["tool"]
                tool_input = part.get("tool_input") or ""
                tool_output = (
                    part.get("tool_output", "")[:500] if part.get("tool_output") else ""
                )
                tools.append(
                    f"- `{tool_name}`: input={str(tool_input)[:200]}, output={tool_output[:300]}"
                )

    # Files changed
    diffs = session.get("summary_diffs") or []
    files = []
    for diff in diffs[:20]:  # Limit
        if isinstance(diff, dict):
            f = diff.get("file", "unknown")
            files.append(f"- `{f}`")

    # Build prompt
    messages_str = "\n\n".join(message_texts[-10:])  # Last 10 messages
    tools_str = "\n".join(tools[-20:])  # Last 20 tools
    files_str = "\n".join(files[:20]) if files else "  (none)"

    prompt = f"""Session ID: {sid}
Title: {title}
Category: {category}
Parent: {parent_id or "root"}
Timeline: {start_dt} → {end_dt}
Duration: {duration} minutes
Message Count: {len(messages)}
Part Count: {session.get("part_count", 0)}

---
MESSAGES (last 10):
{messages_str}

---
TOOL CALLS (last 20):
{tools_str}

---
FILES CHANGED (from diffs):
{files_str}

---
INSTRUCTIONS: Create a rich T2 macro-context document from this session. Capture the actual content, not just summaries. Identify breakthroughs, patterns, failures, and lessons."""

    return prompt


def synthesize_session(session: dict, output_dir: Path) -> bool:
    """Synthesize a single session to a Markdown file."""
    sid = session.get("session_id", "unknown")
    title = session.get("title", "Untitled")
    category = session.get("category", "planning")
    parent_id = session.get("parent_id", None)

    # Build safe filename
    safe_title = "".join(c if c.isalnum() or c in " -_" else "_" for c in title)[:60]
    filename = f"{sid[:16]}_{safe_title}.md"
    filepath = output_dir / category / filename

    # Skip if already exists
    if filepath.exists():
        print(f"  SKIP: {filepath.name} (exists)")
        return True

    try:
        prompt = build_prompt(session)
        print(f"  Calling MiniMax M2.7 for: {title[:50]}...")
        result = call_minimax(sid, prompt)

        # Write output
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"# SESSION: {title}\n\n")
            f.write(result)
            f.write(
                f"\n\n---\n*Synthesized: {datetime.now().isoformat()} | Session: {sid} | Category: {category}*\n"
            )

        print(f"  WROTE: {filepath.name}")
        return True

    except Exception as e:
        print(f"  ERROR: {sid[:16]}: {e}")
        return False


def main():
    """Main synthesis function."""
    # Ensure output directories exist
    categories = [
        "gold_standard",
        "architecture",
        "build",
        "investigation",
        "orchestration",
        "review",
        "failure",
        "integration",
        "planning",
    ]
    for cat in categories:
        (Path(OUTPUT_BASE) / cat).mkdir(parents=True, exist_ok=True)

    # Read input
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: Input file not found: {INPUT_PATH}")
        return

    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        sessions = [json.loads(line) for line in f]

    print(f"SYNTHESIS START")
    print(f"Input: {INPUT_PATH} ({len(sessions)} sessions)")
    print(f"Output: {OUTPUT_BASE}")
    print(f"Model: MiniMax-M2.7 (api.minimax.io/anthropic/v1)")
    print()

    success = 0
    failed = 0

    for i, session in enumerate(sessions, 1):
        sid = session.get("session_id", "?")[:16]
        title = session.get("title", "Untitled")[:50]
        category = session.get("category", "planning")

        print(f"[{i}/{len(sessions)}] {category}: {title}...")

        if synthesize_session(session, Path(OUTPUT_BASE)):
            success += 1
        else:
            failed += 1

        # Rate limiting
        if i < len(sessions):
            time.sleep(DELAY_BETWEEN_CALLS)

    print()
    print(f"SYNTHESIS COMPLETE")
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print(f"Output: {OUTPUT_BASE}/[category]/")

    # List output files
    total_files = sum(1 for _ in Path(OUTPUT_BASE).rglob("*.md"))
    print(f"Total T2 files created: {total_files}")


if __name__ == "__main__":
    main()
