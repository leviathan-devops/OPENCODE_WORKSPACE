# Hive Mind Plugin — Feature Breakdown

---

## 1. Session Activity Tracker

**Module:** In-memory per-session state  
**Lines:** 93-138

Tracks activity within a session:
- `filesWritten`: Files created/modified this session
- `errorsEncountered`: Errors seen
- `fixesApplied`: Fixes detected
- `lastBreakthroughTime`: For cooldown management
- `pendingBreakthrough`: What triggered the breakthrough

### States
```typescript
interface SessionActivity {
  sessionId: string;
  filesWritten: Map<string, { size: number; path: string }>;
  errorsEncountered: ErrorEntry[];
  fixesApplied: FixEntry[];
  lastBreakthroughTime: number;
  pendingBreakthrough: BreakthroughTrigger | null;
}
```

---

## 2. OpenViking API Client

**Module:** `fetchFromOV`, `searchInOV`, `uploadToOV`  
**Lines:** 285-566

### uploadToOV
- Uploads content to OpenViking via `temp_upload` → `resources/commit` flow
- Writes to local fallback FIRST, then attempts OpenViking upload
- Returns `{ success, targetUri, localFallbackPath }`

### searchInOV
- Semantic search against OpenViking vector DB
- Returns `result.resources[]` (NOT `result.memories[]`)
- Handles empty results gracefully

### fetchFromOV
- Fetches content by URI
- Handles `temp_uri` format for committed content
- Falls back to local if OpenViking unavailable

### ⚠️ CRITICAL API QUIRKS (Found via pressure test)

1. `temp_upload` returns `temp_path` (not `temp_file_id`)
2. `resources/commit` expects `path` field (not `temp_file_id`)
3. `resources/commit` returns `temp_uri` pointing to actual content
4. `content/read` works with `temp_uri`, `content/overview` works with `root_uri`
5. Search returns `result.resources[]` not `memories[]`

See: `03-api-reference/HIVE-MIND-020-OV-API.md`

---

## 3. Pattern Detection

**Module:** Architecture signals, error→fix, batch detection  
**Lines:** 569-902

### Architecture Signal Detection
Detects when agent creates substantial architectural work:

**Patterns (score = 1 each):**
- `interface\s+\w+` — TypeScript interfaces
- `export\s+(class|function|const|type|interface)` — Exports
- `:\s*\w+Array<` or `: Array<` — Collection types
- `import\s+type\s+{` or `import\s+{` — ES modules
- `^\s*(public|private|protected)\s+` — Access modifiers
- `^\s*#\s*(include|define|pragma)` — C preprocessor
- `^\s*(pub|fn|struct|enum|impl|mod)` — Rust
- `^\s*class\s+\w+.*\(.*\)\s*{` — Class definitions

**Threshold:** Score >= `ARCHITECTURE_SIGNAL_THRESHOLD` (3)

### Error→Fix Detection
- Tracks errors encountered in commands
- When error appears, starts 5-min window
- If same/similar error is mentioned as "fixed" or "resolved" within window → breakthrough

### Batch Detection
- Tracks files > 2000 chars written
- 3+ substantial files → breakthrough trigger

---

## 4. Breakthrough Commit

**Module:** `commitBreakthrough`  
**Lines:** 629-734

Commits session data to OpenViking:
1. Extracts session info from opencode.db
2. Builds comprehensive content including:
   - Session overview
   - Files created/modified
   - Errors and fixes
   - Activity timeline
3. Uploads via `uploadToOV` (with local fallback)
4. Resets session state

### Trigger Types
- `architecture`: Architecture signals detected
- `error_fix`: Error was fixed within window
- `file_creation`: 3+ substantial files created

---

## 5. Session Overview

**Module:** `commitSessionOverview`, `querySessionDB`  
**Lines:** 905-941

Queries opencode.db for session metadata:
- Session title
- Category
- Tools used
- Message count
- Token usage

Used to build comprehensive session documentation for OpenViking.

---

## 6. Health Monitoring

**Module:** Health check loop  
**Lines:** 944-1043

Continuously monitors OpenViking health:
- Pings `/health` endpoint every 60 seconds
- Tracks consecutive failures
- Sets `openVikingConnected = false` after 3 consecutive failures
- Recovers `openVikingConnected = true` on successful ping

---

## 7. Canary Monitoring

**Module:** Hook execution verification  
**Lines:** 1144-1191

Verifies experimental hooks are actually firing:
- Tracks `totalHookCalls` counter
- Logs canary entries every 60 seconds
- Used to detect if hooks are silently not firing

---

## 8. Plugin Tools (Commands)

Registered via OpenCode plugin system:

### `hive_remember`
Upload a memory to OpenViking with local fallback.

```typescript
args: {
  key: string;      // Memory key/name
  content: string; // Memory content
}
returns: {
  success: boolean;
  targetUri?: string;
  localFallbackPath?: string;
  error?: string;
}
```

### `hive_context`
Search for relevant memories in OpenViking.

```typescript
args: {
  query: string;   // Search query
  limit?: number;  // Max results (default 5)
}
returns: {
  results: Array<{
    uri: string;
    score: number;
    content?: string;
  }>;
}
```

### `hive_status`
Get plugin health and status.

```typescript
returns: {
  plugin: string;
  version: string;
  openViking: { connected: boolean; lastCheck: number };
  localFallback: { enabled: boolean; path: string };
  canary: { totalHookCalls: number; lastCanary: number };
}
```

### `memread_session`
Read session data from opencode.db.

```typescript
args: {
  sessionId: string;
}
returns: {
  sessionId: string;
  title: string;
  category: string;
  tools: string[];
  // ... more session metadata
}
```

### `memlink_parent`
Link current session to parent session in OpenViking.

```typescript
args: {
  parentSessionId: string;
}
returns: {
  success: boolean;
  uri?: string;
}
```

---

## 9. Hook Handlers

### `experimental.chat.messages.transform`
Fires on each message. Analyzes for:
- File writes (via command output parsing)
- Errors in command output
- Fix patterns

### `experimental.session.compacting`
Fires on session end. Triggers:
- `commitSessionOverview()`
- `commitBreakthrough()` for remaining activity
- `cleanupActivity()`

---

*Features v1.0 — Leviathan Agent — 2026-04-02*
