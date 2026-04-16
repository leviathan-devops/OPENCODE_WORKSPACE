# Hive Mind Plugin — Storage

---

## Local Fallback

**Base Path:** `/home/leviathan/.local/share/opencode/hive-mind/`

Always written FIRST before any OpenViking upload attempt.

### Directory Structure
```
/home/leviathan/.local/share/opencode/hive-mind/
├── memories/
│   ├── {key}.md           # hive_remember contents
│   └── ...
├── breakthroughs/
│   ├── {session_id}/
│   │   ├── overview.md     # Session overview
│   │   ├── breakthrough_{type}_{timestamp}.md
│   │   └── ...
│   └── ...
├── session_overviews/
│   └── {session_id}.md
└── hive-mind-plugin.log   # Plugin logs
```

### When Used
1. **Always** — Local fallback written before OpenViking upload
2. **OpenViking down** — Upload redirected to local storage
3. **Upload failure** — Content stays in local fallback

### Recovery
When OpenViking recovers:
1. Health check detects recovery
2. Local files remain (for manual sync if needed)
3. New uploads go to OpenViking

---

## OpenViking Storage

**Endpoint:** `localhost:1933`  
**Base URI:** `viking://resources/hive-mind/`

### Memory Structure
```
viking://resources/hive-mind/shared/
├── memory/
│   └── {key}.md                    # hive_remember contents
├── breakthroughs/
│   └── {session_id}/
│       ├── overview.md             # Session summary
│       ├── breakthrough_architecture_{timestamp}.md
│       ├── breakthrough_error_fix_{timestamp}.md
│       └── breakthrough_file_creation_{timestamp}.md
├── sessions/
│   └── {session_id}/
│       └── session.md              # Session data
└── knowledge/
    └── ...                        # Generated knowledge
```

---

## OpenViking API Endpoints

### Content Upload Flow

**Step 1: temp_upload**
```
POST /content/upload
Headers:
  X-API-Key: hive-mind-key
  X-OpenViking-Account: default
  X-OpenViking-User: hive-mind
Body:
{
  "content": "# Memory content...",
  "mimeType": "text/markdown"
}
Response:
{
  "temp_path": "/tmp/ov_temp_xxx"   ← NOTE: temp_path NOT temp_file_id
}
```

**Step 2: resources/commit**
```
POST /resources/commit
Headers:
  X-API-Key: hive-mind-key
  X-OpenViking-Account: default
  X-OpenViking-User: hive-mind
Body:
{
  "path": "/tmp/ov_temp_xxx",        ← NOTE: path NOT temp_file_id
  "to": "viking://resources/hive-mind/shared/memory/test.md",
  "reason": "hive_remember"
}
Response:
{
  "temp_uri": "viking://temp/...",
  "uri": "viking://resources/hive-mind/shared/memory/test.md"
}
```

### Search Flow
```
POST /resources/search
Headers: (same as above)
Body:
{
  "query_vector": [0.123, ...],    ← 768-dim embedding
  "limit": 5
}
Response:
{
  "result": {
    "resources": [                  ← NOTE: resources NOT memories
      { "uri": "...", "score": 0.95, "content": "..." },
      ...
    ]
  }
}
```

### Read Content
```
GET /content/read?uri={temp_uri}
Headers: (same as above)

Note: Use temp_uri (from commit response) for content/read
      Use root_uri for content/overview
```

---

## Vector Database

**Dimension:** 768 (critical — must match embedding model)

### Embedding Model
- **Model:** `nomic-embed-text-v1.5.Q4_K_M.gguf`
- **Location:** `/home/leviathan/models/`
- **Server:** `llama-server` on port 8001
- **Endpoint:** `POST /v1/embeddings`

### Dimension Check
```bash
# Check vectordb dimension
cat /home/leviathan/openviking_workspace/vectordb/context/collection_meta.json | grep Dimension

# If mismatch (e.g., 1024 vs 768):
# Vector DB needs recreation
```

---

## Session Database (opencode.db)

**Location:** OpenCode's session storage  
**Purpose:** Query session metadata for session overviews

### Schema (approximate)
```sql
SELECT 
  session_id,
  title,
  category,
  created_at,
  message_count,
  token_usage,
  tools_used
FROM sessions
WHERE session_id = ?
```

---

*Storage v1.0 — Leviathan Agent — 2026-04-02*
