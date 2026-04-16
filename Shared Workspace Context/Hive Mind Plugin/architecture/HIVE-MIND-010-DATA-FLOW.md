# Hive Mind Plugin — Data Flow

---

## High-Level Data Flow

```
1. SESSION START
   └─> Plugin loads → Starts health check loop → Starts canary monitoring

2. SESSION ACTIVITY (hooks fire on messages)
   └─> 'experimental.chat.messages.transform' hook fires
       └─> analyzeMessageForPatterns()
           ├─> File write detected (>2000 chars)?
           │   └─> Check for architecture signals
           │       └─> Score >= 3? → commitBreakthrough()
           ├─> Error detected in command output?
           │   └─> Within 5-min window + fix seen?
           │       └─> commitBreakthrough('error_fix')
           └─> 3+ substantial files written?
               └─> commitBreakthrough('file_creation')

3. SESSION END ('experimental.session.compacting' hook)
   └─> commitSessionOverview()
   └─> commitBreakthrough() for any remaining activity
   └─> cleanupActivity()

4. ON-DEMAND (tool calls)
   └─> hive_context: searchInOV() → fetchFromOV()
   └─> hive_status: health check + status
   └─> hive_remember: uploadToOV() with local fallback
   └─> memread_session: query opencode.db
   └─> memlink_parent: link sessions in OpenViking
```

---

## Storage Locations

| Data Type | Primary Location | Fallback Location |
|-----------|-----------------|-------------------|
| Breakthrough commits | OpenViking (viking://resources/hive-mind/) | Local disk |
| Session overviews | OpenViking | Local disk |
| Plugin logs | Console + plugin log file | N/A |
| Local fallback | N/A | `/home/leviathan/.local/share/opencode/hive-mind/` |

---

## Upload Flow (uploadToOV)

```
┌─────────────────────────────────────────────────────────────┐
│                    uploadToOV(key, content)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Write to local fallback FIRST                                │
│    /home/leviathan/.local/share/opencode/hive-mind/           │
│    └── memories/{key}.md                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. temp_upload: POST /content/upload                          │
│    Body: { content: "...", mimeType: "text/markdown" }        │
│    Response: { temp_path: "/tmp/..." }  ⚠️ NOT temp_file_id  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. resources/commit: POST /resources/commit                   │
│    Body: { path: temp_path, to: targetUri, reason: "..." }   │
│    ⚠️ Use 'path' NOT 'temp_file_id'                          │
│    Response: { temp_uri: "viking://temp/..." }               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Return { success: true, targetUri, localFallbackPath }     │
└─────────────────────────────────────────────────────────────┘
```

---

## Search Flow (hive_context)

```
┌─────────────────────────────────────────────────────────────┐
│                    searchInOV(query, limit)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Generate embedding: POST /v1/embeddings                  │
│    Body: { model: "nomic-...", input: query }               │
│    Response: { embedding: [0.123, ...] }                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Search: POST /resources/search                            │
│    Body: { query_vector: [...], limit: N }                   │
│    Response: { result: { resources: [...] } }               │
│    ⚠️ Returns 'result.resources' NOT 'result.memories'       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Extract results: result.resources || result.memories || [] │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Return results[] with uri, score, content                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Breakthrough Detection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 analyzeMessageForPatterns()                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Check: File write > 2000 chars?                              │
│    └─> Check architecture signals:                           │
│        interface\s+\w+         (+1)                         │
│        export\s+(class|fn|...) (+1)                         │
│        : Array< | : xxxArray<   (+1)                         │
│        import\s+{               (+1)                         │
│        (public|private)        (+1)                         │
│        ...                                              │
│    └─> Score >= 3? → commitBreakthrough('architecture')     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Check: Error in output?                                     │
│    └─> Start 5-min window                                   │
│    └─> If "fixed"/"resolved" seen → commitBreakthrough('error_fix') │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Check: 3+ substantial files (>2000 chars)?                  │
│    └─> commitBreakthrough('file_creation')                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Health Check Flow

```
┌─────────────────────────────────────────────────────────────┐
│            Health Check Loop (every 60 seconds)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ GET /health                                                 │
│ Headers: X-API-Key, X-OpenViking-Account, X-OpenViking-User │
│ Timeout: 5 seconds                                          │
└─────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           │                                     │
           ▼                                     ▼
┌──────────────────────┐           ┌──────────────────────┐
│ Response: healthy=true│           │ Timeout/Error        │
│                      │           │                      │
│ consecutiveFailures=0│           │ consecutiveFailures++│
│ openVikingConnected=true│        │ > 3? → openVikingConnected=false │
└──────────────────────┘           └──────────────────────┘
```

---

*Data Flow v1.0 — Leviathan Agent — 2026-04-02*
