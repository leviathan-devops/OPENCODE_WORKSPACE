# OpenCode File Locations

## Overview

OpenCode stores configuration, data, sessions, and logs in standard locations depending on your OS.

---

## Default Directories

### Linux/macOS

| Type | Path |
|------|------|
| Config | ~/.config/opencode/ |
| Data | ~/.local/share/opencode/ |
| Cache | ~/.cache/opencode/ |
| Logs | ~/.local/share/opencode/logs/ |
| Sessions | ~/.local/share/opencode/sessions/ |

### Windows

| Type | Path |
|------|------|
| Config | %APPDATA%\opencode\ |
| Data | %LOCALAPPDATA%\opencode\ |
| Cache | %TEMP%\opencode\ |
| Logs | %LOCALAPPDATA%\opencode\logs\ |
| Sessions | %LOCALAPPDATA%\opencode\sessions\ |

---

## Key Files

### Configuration

```
~/.config/opencode/
├── opencode.config.yaml      # Main config
├── opencode.credentials.yaml # API keys (optional, encrypted)
└── plugins.yaml              # Plugin registry
```

### Data

```
~/.local/share/opencode/
├── sessions/                 # Session data
│   ├── sessions.db          # SQLite database
│   └── sessions/            # Individual session files
├── plugins/                  # Installed plugins
│   └── plugin-name/
│       └── plugin-data.json
└── cache/                    # Cached data
    └── provider-cache/
```

### Logs

```
~/.local/share/opencode/logs/
├── opencode.log             # Main log
├── opencode-error.log       # Error log
├── plugin-name.log          # Per-plugin logs
└── session-{id}.log         # Per-session logs
```

---

## SQLite Database

### Location
~/.local/share/opencode/sessions/sessions.db

### Schema

```sql
-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  agent_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  metadata TEXT,  -- JSON
  archived INTEGER DEFAULT 0
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,  -- user, assistant, system
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Tool calls table
CREATE TABLE tool_calls (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  input TEXT NOT NULL,  -- JSON
  output TEXT,
  duration_ms INTEGER,
  success INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

### Accessing Directly

```bash
# Open database
sqlite3 ~/.local/share/opencode/sessions/sessions.db

# List tables
sqlite> .tables

# Query sessions
sqlite> SELECT id, agent_name, created_at FROM sessions;

# Query messages for session
sqlite> SELECT * FROM messages WHERE session_id = 'session-id';

# Check tool usage
sqlite> SELECT tool, COUNT(*) FROM tool_calls GROUP BY tool;
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| OPENCODE_CONFIG_DIR | ~/.config/opencode | Config directory |
| OPENCODE_DATA_DIR | ~/.local/share/opencode | Data directory |
| OPENCODE_CACHE_DIR | ~/.cache/opencode | Cache directory |
| OPENCODE_LOG_LEVEL | info | Logging level |
| OPENCODE_DB_PATH | (auto) | SQLite database path |

---

## Custom Locations

Override defaults via config or environment:

```yaml
# In opencode.config.yaml
configDir: "/etc/opencode"
dataDir: "/var/lib/opencode"
```

```bash
# Via environment
export OPENCODE_CONFIG_DIR="/custom/config"
export OPENCODE_DATA_DIR="/custom/data"
```

---

## File Permissions

### Linux/macOS

```bash
# Config (user-only read/write)
chmod 600 ~/.config/opencode/opencode.config.yaml

# Data directory
chmod 700 ~/.local/share/opencode

# Session database
chmod 600 ~/.local/share/opencode/sessions/sessions.db
```

### Session Tokens

Session tokens are stored encrypted at rest. Key location:
- Linux: ~/.local/share/opencode/sessions/.key
- macOS: ~/Library/Application Support/opencode/sessions/.key

---

## Cleanup

### Remove old sessions

```bash
# Remove sessions older than 30 days
opencode sessions cleanup --older-than 30d

# Remove archived sessions
opencode sessions cleanup --archived

# Vacuum database
sqlite3 ~/.local/share/opencode/sessions/sessions.db "VACUUM;"
```

### Clear cache

```bash
# Clear all cache
opencode cache clear

# Clear specific cache
opencode cache clear --provider anthropic
```

---

## Directory Tree

```
~/.config/opencode/
├── opencode.config.yaml         # Main configuration
├── opencode.credentials.yaml    # Encrypted credentials
├── plugins.yaml                 # Plugin registry
└── hooks.yaml                   # Hook configurations

~/.local/share/opencode/
├── sessions/
│   ├── sessions.db              # SQLite database
│   ├── sessions/                # Session metadata
│   │   └── {session-id}/
│   │       ├── config.json
│   │       └── state.json
│   └── encrypted/               # Encrypted session data
├── plugins/
│   ├── plugin-name/
│   │   ├── manifest.json
│   │   └── data/
│   └── another-plugin/
├── cache/
│   ├── provider-responses/      # Cached API responses
│   └── tool-results/            # Cached tool results
└── logs/
    ├── opencode.log
    ├── opencode-error.log
    └── plugins/
        └── plugin-name.log
```
