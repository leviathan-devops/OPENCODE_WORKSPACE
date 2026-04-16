# Reading Session Logs

## Overview

Session logs capture the complete history of an OpenCode session including messages, tool calls, and agent reasoning.

---

## Log File Locations

```
~/.local/share/opencode/logs/
├── opencode.log              # Main application log
├── opencode-error.log        # Error log
├── session-{id}.log         # Per-session logs
└── plugins/
    └── {plugin-name}.log    # Plugin-specific logs
```

---

## Session Log Format

Each session log entry follows this structure:

```
[TIMESTAMP] [LEVEL] [COMPONENT] Message
2024-01-15 10:23:45 [INFO] [session:abc123] User: "How do I parse JSON?"
2024-01-15 10:23:46 [DEBUG] [session:abc123] Agent reasoning started
2024-01-15 10:23:47 [INFO] [session:abc123] Tool call: read_file(path="/src/data.json")
2024-01-15 10:23:48 [DEBUG] [session:abc123] Tool result: 1256 bytes read
2024-01-15 10:23:50 [INFO] [session:abc123] Agent: "Here's how to parse JSON..."
```

---

## Viewing Session Logs

### Via CLI

```bash
# View session log
opencode logs --session <session-id>

# Last 100 lines
opencode logs --session <session-id> --tail 100

# Filter by level
opencode logs --session <session-id> --level error

# Follow mode (tail -f)
opencode logs --session <session-id> --follow
```

### Direct File Access

```bash
# Find session log
ls ~/.local/share/opencode/logs/session-*.log

# View with tail
tail -f ~/.local/share/opencode/logs/session-abc123.log

# Search in session
grep "tool-call" ~/.local/share/opencode/logs/session-abc123.log
```

---

## Session Database Schema

The SQLite database stores structured session data:

```sql
-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  created_at INTEGER,
  updated_at INTEGER,
  agent_name TEXT,
  provider TEXT,
  model TEXT,
  metadata TEXT,
  archived INTEGER DEFAULT 0
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  role TEXT,  -- user, assistant, system
  content TEXT,
  created_at INTEGER
);

-- Tool calls table
CREATE TABLE tool_calls (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  message_id TEXT,
  tool TEXT,
  input TEXT,
  output TEXT,
  duration_ms INTEGER,
  success INTEGER,
  created_at INTEGER
);
```

---

## Querying Session Data

### List Recent Sessions

```bash
opencode db query "SELECT id, agent_name, created_at FROM sessions ORDER BY created_at DESC LIMIT 10"
```

### Get Session Messages

```bash
opencode db query "SELECT role, content, created_at FROM messages WHERE session_id = '<id>' ORDER BY created_at"
```

### Tool Call Statistics

```bash
opencode db query "SELECT tool, COUNT(*) as calls, AVG(duration_ms) as avg_ms FROM tool_calls GROUP BY tool"
```

### Session Timeline

```bash
opencode db query "
SELECT 
  datetime(created_at/1000, 'unixepoch') as time,
  tool,
  duration_ms
FROM tool_calls 
WHERE session_id = '<id>' 
ORDER BY created_at
"
```

---

## Exporting Session History

### Export to JSON

```bash
opencode session export <session-id> --format json --output ./export/
```

### Export to Markdown

```bash
opencode session export <session-id> --format markdown --output ./export/
```

### Export to Text

```bash
opencode session export <session-id> --format text --output ./export/
```

---

## Understanding Log Levels

| Level | Meaning | When Used |
|-------|---------|-----------|
| DEBUG | Detailed debug info | Troubleshooting, development |
| INFO | General information | Normal operation |
| WARN | Warning messages | Potential issues |
| ERROR | Error messages | Failures, exceptions |

---

## Common Log Patterns

### Tool Execution

```
[INFO] Tool call: read_file(path="/src/app.ts")
[DEBUG] Tool input: {"path": "/src/app.ts"}
[DEBUG] Tool output: {"lines": 245, "size": 8420}
[INFO] Tool completed in 23ms
```

### Agent Reasoning

```
[DEBUG] Agent reasoning started
[DEBUG] Context window: 4096 tokens (75% used)
[DEBUG] Selected approach: chain-of-thought
[INFO] Agent response: 1247 tokens
```

### Errors

```
[ERROR] Tool execution failed: read_file
[ERROR] Reason: File not found: /nonexistent/path
[WARN] Retrying tool call (attempt 2/3)
[ERROR] Tool call ultimately failed after 3 attempts
```

---

## Session Analysis

### Most Used Tools

```bash
opencode db query "
SELECT tool, COUNT(*) as count 
FROM tool_calls 
GROUP BY tool 
ORDER BY count DESC
"
```

### Average Response Time

```bash
opencode db query "
SELECT AVG(duration_ms) as avg_time 
FROM tool_calls 
WHERE success = 1
"
```

### Error Rate

```bash
opencode db query "
SELECT 
  CAST(SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as error_rate
FROM tool_calls
"
```

---

## Log Retention

### Cleanup Old Logs

```bash
# Remove logs older than 30 days
opencode logs cleanup --older-than 30d

# Remove logs older than 7 days
opencode logs cleanup --older-than 7d
```

### Archive Sessions

```bash
# Archive old sessions
opencode sessions list --archived
opencode session archive <session-id>
```

---

## Log Analysis Tips

1. **Timeline View**: Look at timestamps to understand flow
2. **Error Clustering**: Errors often point to root causes
3. **Tool Patterns**: Repeated tool calls may indicate inefficiency
4. **Token Usage**: Check context window utilization
5. **Success Rate**: Overall health indicator
