#!/usr/bin/env python3
"""
Neural Pathways - Session Extractor
Phase 1 of the Hive Mind OS neural pathway pipeline.

Extracts sessions from OpenCode's SQLite database, deletes noise sessions,
classifies remaining sessions, and outputs a JSON Lines file.
"""

import sqlite3
import json
import os
from typing import Optional, Any


DATABASE_PATH = "/home/leviathan/.local/share/opencode/opencode.db"
OUTPUT_PATH = "/home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways/extracted_sessions.jsonl"


def safe_json_parse(json_text: Optional[str]) -> Any:
    """Safely parse JSON text, returning None on failure."""
    if json_text is None:
        return None
    try:
        return json.loads(json_text)
    except (json.JSONDecodeError, TypeError):
        return None


def classify_session(title: str) -> str:
    """Classify a session based on its title."""
    title_lower = title.lower()
    
    # Check in order of specificity
    if any(kw in title_lower for kw in ["space invader", "gold standard", "omnicoder"]):
        return "gold_standard"
    if any(kw in title_lower for kw in ["shark", "guardian", "firewall", "plugin", "opencode-swarm"]):
        return "architecture"
    if any(kw in title_lower for kw in ["build", "implement", "workflow"]):
        return "build"
    if any(kw in title_lower for kw in ["explore", "forensic", "analyze"]):
        return "investigation"
    if any(kw in title_lower for kw in ["swarm", "migration", "adapter", "hive mind"]):
        return "orchestration"
    if any(kw in title_lower for kw in ["review", "reviewer"]):
        return "review"
    if any(kw in title_lower for kw in ["failed", "error", "permission denied"]):
        return "failure"
    if any(kw in title_lower for kw in ["glm", "qwen", "deepseek", "openviking", "vllm"]):
        return "integration"
    
    # Default category
    return "planning"


def is_noise_session(title: str, message_count: int, part_count: int) -> bool:
    """Determine if a session is noise that should be deleted."""
    title_lower = title.lower()
    
    # Rule 1: Title contains "2+2" or "calculation"
    if "2+2" in title_lower or "calculation" in title_lower:
        return True
    
    # Rule 2: Title is "Test message" with fewer than 3 messages
    if title == "Test message" and message_count < 3:
        return True
    
    # Rule 3: Title starts with "New session" with fewer than 3 messages AND fewer than 5 parts
    if title.startswith("New session") and message_count < 3 and part_count < 5:
        return True
    
    return False


def extract_parts_for_message(cursor: sqlite3.Cursor, message_id: str) -> list:
    """Extract all parts for a given message."""
    cursor.execute(
        "SELECT id, data FROM part WHERE message_id = ? ORDER BY time_created",
        (message_id,)
    )
    parts = []
    for part_row in cursor.fetchall():
        part_id = part_row[0]
        part_data = safe_json_parse(part_row[1]) or {}
        
        part_obj = {
            "part_id": part_id,
            "type": part_data.get("type", "text"),
            "text": part_data.get("text"),
            "tool": part_data.get("tool"),
            "tool_input": part_data.get("tool_input"),
            "tool_output": part_data.get("tool_output"),
            "state": part_data.get("state"),
        }
        parts.append(part_obj)
    
    return parts


def extract_messages_for_session(cursor: sqlite3.Cursor, session_id: str) -> tuple:
    """Extract all messages (with parts) for a given session. Returns (messages, part_count)."""
    cursor.execute(
        "SELECT id, data FROM message WHERE session_id = ? ORDER BY time_created",
        (session_id,)
    )
    messages = []
    total_parts = 0
    
    for msg_row in cursor.fetchall():
        message_id = msg_row[0]
        msg_data = safe_json_parse(msg_row[1]) or {}
        
        parts = extract_parts_for_message(cursor, message_id)
        total_parts += len(parts)
        
        msg_obj = {
            "message_id": message_id,
            "role": msg_data.get("role", "user"),
            "summary": msg_data.get("summary"),
            "agent": msg_data.get("agent"),
            "model": msg_data.get("model"),
            "parts": parts,
        }
        messages.append(msg_obj)
    
    return messages, total_parts


def extract_session(cursor: sqlite3.Cursor, session_row: tuple) -> dict:
    """Extract full session data including messages and parts."""
    (
        session_id, project_id, parent_id, slug, directory, title,
        version, share_url, summary_additions, summary_deletions,
        summary_files, summary_diffs, revert, permission,
        time_created, time_updated, time_compacting, time_archived,
        workspace_id
    ) = session_row
    
    # Extract messages and parts
    messages, part_count = extract_messages_for_session(cursor, session_id)
    message_count = len(messages)
    
    # Parse JSON fields
    permission_ruleset = safe_json_parse(permission)
    summary_diffs_parsed = safe_json_parse(summary_diffs)
    
    # Classify session
    category = classify_session(title or "")
    
    session_obj = {
        "session_id": session_id,
        "title": title or "",
        "parent_id": parent_id,
        "category": category,
        "time_created": time_created or 0,
        "time_updated": time_updated or 0,
        "directory": directory or "",
        "message_count": message_count,
        "part_count": part_count,
        "permission_ruleset": permission_ruleset,
        "summary_diffs": summary_diffs_parsed,
        "messages": messages,
    }
    
    return session_obj


def main():
    """Main extraction function."""
    # Ensure output directory exists
    output_dir = os.path.dirname(OUTPUT_PATH)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Connect to database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Get all sessions
    cursor.execute("""
        SELECT id, project_id, parent_id, slug, directory, title,
               version, share_url, summary_additions, summary_deletions,
               summary_files, summary_diffs, revert, permission,
               time_created, time_updated, time_compacting, time_archived,
               workspace_id
        FROM session
        ORDER BY time_created
    """)
    
    session_rows = cursor.fetchall()
    total_sessions = len(session_rows)
    
    # Track statistics
    noise_deleted = 0
    meaningful_sessions = []
    category_counts = {
        "gold_standard": 0,
        "architecture": 0,
        "build": 0,
        "investigation": 0,
        "orchestration": 0,
        "review": 0,
        "failure": 0,
        "integration": 0,
        "planning": 0,
    }
    
    # Process each session
    for session_row in session_rows:
        session_id = session_row[0]
        title = session_row[5] or ""
        
        # Begin transaction for extraction and potential deletion
        cursor.execute("BEGIN")
        
        try:
            # Extract full session data
            session_obj = extract_session(cursor, session_row)
            
            # Check if this is a noise session
            if is_noise_session(title, session_obj["message_count"], session_obj["part_count"]):
                # Delete noise session from database
                cursor.execute("DELETE FROM session WHERE id = ?", (session_id,))
                noise_deleted += 1
                cursor.execute("COMMIT")
            else:
                # Keep this session
                meaningful_sessions.append(session_obj)
                category_counts[session_obj["category"]] += 1
                cursor.execute("COMMIT")
        except Exception:
            # Rollback on error and continue
            cursor.execute("ROLLBACK")
            continue
    
    # Write output JSON Lines file
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        for session_obj in meaningful_sessions:
            f.write(json.dumps(session_obj, ensure_ascii=False) + "\n")
    
    # Close database connection
    conn.close()
    
    # Print verification summary
    print("EXTRACTION COMPLETE")
    print(f"Total sessions found: {total_sessions}")
    print(f"Noise sessions deleted: {noise_deleted}")
    print(f"Meaningful sessions extracted: {len(meaningful_sessions)}")
    print("By category:")
    for category, count in category_counts.items():
        print(f"  {category}: {count}")
    print(f"Output: extracted_sessions.jsonl ({len(meaningful_sessions)} lines)")


if __name__ == "__main__":
    main()
