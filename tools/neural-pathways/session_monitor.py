#!/usr/bin/env python3
"""
Phase 6: Session Monitor Daemon
Polls opencode.db every 60 seconds for ended sessions (20min inactivity),
generates a T1 overview, and writes to OpenViking.
"""

import json
import os
import sqlite3
import time
import httpx
import tempfile
from datetime import datetime, timezone

OPENVIKING_URL = "http://localhost:1933"
API_KEY = os.environ.get("OPENVIKING_API_KEY", "hive-mind-key")
DB_PATH = os.path.expanduser("~/.local/share/opencode/opencode.db")
STATE_FILE = os.path.join(os.path.dirname(__file__), "monitor_state.json")
TARGET_BASE = "viking://resources/hive-mind/shared/sessions"
POLL_INTERVAL = 60  # seconds
INACTIVITY_THRESHOLD_MS = 20 * 60 * 1000  # 20 minutes


def load_state() -> dict:
    """Load monitor state from disk."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"processed_sessions": [], "last_check": None}


def save_state(state: dict) -> None:
    """Persist state to disk."""
    state["last_check"] = datetime.now(timezone.utc).isoformat()
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def get_session_details(sid: str) -> dict:
    """Load full session data including messages and parts."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Session row
    cur.execute(
        """
        SELECT id, title, parent_id, directory,
               summary_diffs, time_created, time_updated
        FROM session WHERE id=?
    """,
        (sid,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        return None

    session = dict(row)

    # Count messages
    cur.execute("SELECT COUNT(*) FROM message WHERE session_id=?", (sid,))
    session["message_count"] = cur.fetchone()[0]

    # Count parts
    cur.execute("SELECT COUNT(*) FROM part WHERE session_id=?", (sid,))
    session["part_count"] = cur.fetchone()[0]

    # Get tools used from parts
    cur.execute(
        """
        SELECT data FROM part
        WHERE session_id=? AND data LIKE '%"tool"%'
        ORDER BY time_created
    """,
        (sid,),
    )
    tools = set()
    for (data,) in cur.fetchall():
        try:
            d = json.loads(data)
            if d.get("tool"):
                tools.add(d["tool"])
        except (json.JSONDecodeError, TypeError):
            pass
    session["tools"] = sorted(tools)

    # category is not in session table — mark as unknown for monitor
    session["category"] = "unknown"

    # Get text content from parts (last 20 messages for context)
    cur.execute(
        """
        SELECT p.data FROM part p
        JOIN message m ON p.message_id = m.id
        WHERE p.session_id=? AND p.data LIKE '%"text"%'
        ORDER BY m.time_created DESC
        LIMIT 100
    """,
        (sid,),
    )
    texts = []
    for (data,) in cur.fetchall():
        try:
            d = json.loads(data)
            if d.get("type") == "text" and d.get("text"):
                texts.append(d["text"][:500])
        except (json.JSONDecodeError, TypeError):
            pass
    session["texts"] = texts[-20:]  # last 20

    conn.close()
    return session


def get_ended_sessions(state: dict) -> list[dict]:
    """Query opencode.db for sessions that appear to have ended."""
    cutoff = time.time() * 1000 - INACTIVITY_THRESHOLD_MS
    processed = set(state.get("processed_sessions", []))

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            s.id as session_id,
            s.title,
            s.parent_id,
            s.directory,
            s.time_created,
            s.time_updated
        FROM session s
        WHERE s.time_updated < ?
        AND s.time_updated > 0
        ORDER BY s.time_updated DESC
    """,
        (cutoff,),
    )
    rows = cur.fetchall()
    conn.close()

    sessions = []
    for row in rows:
        sid = row["session_id"]
        if sid not in processed:
            sessions.append(dict(row))

    return sessions


def build_t1_overview(session: dict) -> str:
    """Generate a T1 lightweight overview from session data."""
    sid = session.get("session_id", "unknown")
    title = session.get("title", "Untitled")
    category = session.get("category") or "planning"
    parent_id = session.get("parent_id") or "root"
    tc = session.get("time_created", 0)
    tu = session.get("time_updated", 0)

    start_dt = (
        datetime.fromtimestamp(tc / 1000, tz=timezone.utc).isoformat()
        if tc
        else "unknown"
    )
    end_dt = (
        datetime.fromtimestamp(tu / 1000, tz=timezone.utc).isoformat()
        if tu
        else "unknown"
    )
    duration_min = (tu - tc) // 60000 if tc and tu else 0

    msg_count = session.get("message_count", 0)
    part_count = session.get("part_count", 0)
    directory = session.get("directory") or "unknown"
    tools = session.get("tools", [])
    texts = session.get("texts", [])

    tools_str = ", ".join(tools) if tools else "none"

    # Build context snippet from texts
    context_parts = []
    for t in texts[-5:]:
        snippet = t[:200].replace("\n", " ")
        context_parts.append(f"> {snippet}...")
    context_str = "\n".join(context_parts) if context_parts else "(no message content)"

    return f"""# SESSION T1: {title}

**ID:** `{sid}`
**Category:** {category}
**Parent:** {parent_id or "root"}
**Timeline:** {start_dt} → {end_dt}
**Duration:** {duration_min} min
**Messages:** {msg_count} | **Parts:** {part_count}
**Working Dir:** `{directory}`

## TOOLS USED
{tools_str}

## RECENT CONTEXT
{context_str}

## STATUS
Ended (inactive >20 min)

---
*T1 Overview | {datetime.now(timezone.utc).isoformat()} | Source: opencode.db | Phase 6 Hive Mind OS*
"""


def upload_to_openviking(content: str, sid: str, title: str) -> bool:
    """Upload T1 overview to OpenViking via temp file flow."""
    safe_title = "".join(c if c.isalnum() or c in " -_" else "_" for c in title)[:50]
    filename = f"T1_{sid[:16]}_{safe_title}.md"

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".md", delete=False, encoding="utf-8"
    ) as f:
        f.write(content)
        tmp_path = f.name

    try:
        with httpx.Client(timeout=60.0) as client:
            # Step 1: temp upload
            with open(tmp_path, "rb") as f:
                files = {"file": (filename, f, "text/markdown")}
                r = client.post(
                    f"{OPENVIKING_URL}/api/v1/resources/temp_upload",
                    headers={
                        "X-API-Key": API_KEY,
                        "X-OpenViking-Account": "default",
                        "X-OpenViking-User": "hive-mind",
                    },
                    files=files,
                )
            if r.status_code != 200:
                print(f"    Temp upload failed: {r.status_code} {r.text[:150]}")
                return False
            temp_id = r.json()["result"]["temp_file_id"]

            # Step 2: add resource
            target_uri = f"{TARGET_BASE}/{sid[:16]}_{safe_title}/T1_OVERVIEW.md"
            r = client.post(
                f"{OPENVIKING_URL}/api/v1/resources",
                headers={
                    "X-API-Key": API_KEY,
                    "X-OpenViking-Account": "default",
                    "X-OpenViking-User": "hive-mind",
                    "Content-Type": "application/json",
                },
                json={
                    "temp_file_id": temp_id,
                    "to": target_uri,
                    "reason": "Phase 6 Session Monitor T1 overview",
                },
            )
            if r.status_code != 200:
                print(f"    Add resource failed: {r.status_code} {r.text[:150]}")
                return False
            return True
    finally:
        os.unlink(tmp_path)


def poll_once(state: dict) -> int:
    """Single poll cycle. Returns number of new sessions processed."""
    sessions = get_ended_sessions(state)
    if not sessions:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] No new ended sessions")
        return 0

    print(
        f"[{datetime.now().strftime('%H:%M:%S')}] Found {len(sessions)} ended session(s)"
    )
    processed = 0

    for session_row in sessions:
        sid = session_row.get("session_id", "")
        title = session_row.get("title", "Untitled")[:50]

        print(f"  Processing: {sid[:16]} — {title}...")
        try:
            session = get_session_details(sid)
            if not session:
                print(f"    ✗ Session not found in DB")
                continue

            overview = build_t1_overview(session)
            if upload_to_openviking(overview, sid, title):
                state["processed_sessions"].append(sid)
                print(f"    ✓ T1 overview uploaded")
                processed += 1
            else:
                print(f"    ✗ OpenViking upload failed")
        except Exception as e:
            print(f"    ✗ Error: {e}")

    save_state(state)
    return processed


def main():
    print(f"=" * 60)
    print(f"SESSION MONITOR DAEMON — Phase 6 Hive Mind OS")
    print(f"=" * 60)
    print(f"DB: {DB_PATH}")
    print(f"Target: {TARGET_BASE}/")
    print(f"Poll interval: {POLL_INTERVAL}s")
    print(f"Inactivity threshold: 20 min")
    print(f"State file: {STATE_FILE}")
    print(f"=" * 60)
    print()

    state = load_state()
    print(
        f"Loaded state: {len(state.get('processed_sessions', []))} sessions already processed"
    )
    print()

    # Immediate first poll
    poll_once(state)

    print()
    print(f"Entering poll loop... (Ctrl-C to stop)")

    while True:
        time.sleep(POLL_INTERVAL)
        try:
            poll_once(state)
        except KeyboardInterrupt:
            print("\nStopping monitor...")
            break
        except Exception as e:
            print(f"Poll error: {e}")
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
