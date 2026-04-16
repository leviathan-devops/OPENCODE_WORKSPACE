# Hive Mind Plugin — OpenViking API Reference

**CRITICAL: These quirks were discovered via pressure testing, not documentation.**

---

## OpenViking API Quirks

The OpenViking API has several quirks that caused critical bugs:

### Quirks Discovered

| # | Issue | Expected | Actual | Impact |
|---|-------|---------|--------|--------|
| 1 | `temp_upload` response field | `temp_file_id` | `temp_path` | All uploads failed |
| 2 | `resources/commit` body field | `temp_file_id` | `path` | All commits failed |
| 3 | `resources/commit` response | Direct URI | `temp_uri` first | Content not readable |
| 4 | `content/read` parameter | `root_uri` | `temp_uri` | Read fails |
| 5 | `content/overview` parameter | `temp_uri` | `root_uri` | Overview fails |
| 6 | Search response structure | `result.memories` | `result.resources` | All searches empty |

---

## API Endpoints

### Health Check

```http
GET /health
Headers:
  X-API-Key: hive-mind-key
  X-OpenViking-Account: default
  X-OpenViking-User: hive-mind
```

**Response:**
```json
{
  "status": "ok",
  "healthy": true,
  "version": "0.2.9"
}
```

---

### Content Upload (Two-Step)

#### Step 1: temp_upload

```http
POST /content/upload
Headers:
  X-API-Key: hive-mind-key
  X-OpenViking-Account: default
  X-OpenViking-User: hive-mind
  Content-Type: application/json
Body:
{
  "content": "# Memory content...",
  "mimeType": "text/markdown"
}
```

**Response:**
```json
{
  "temp_path": "/tmp/ov_temp_abc123"
}
```

⚠️ **NOTE:** Returns `temp_path` NOT `temp_file_id`

---

#### Step 2: resources/commit

```http
POST /resources/commit
Headers:
  X-API-Key: hive-mind-key
  X-OpenViking-Account: default
  X-OpenViking-User: hive-mind
  Content-Type: application/json
Body:
{
  "path": "/tmp/ov_temp_abc123",
  "to": "viking://resources/hive-mind/shared/memory/{key}.md",
  "reason": "hive_remember"
}
```

⚠️ **NOTE:** Use `path` NOT `temp_file_id`

**Response:**
```json
{
  "temp_uri": "viking://temp/abc123",
  "uri": "viking://resources/hive-mind/shared/memory/{key}.md"
}
```

---

### Content Read

```http
GET /content/read?uri={temp_uri}
Headers:
  X-API-Key: hive-mind-key
  X-OpenViking-Account: default
  X-OpenViking-User: hive-mind
```

⚠️ **NOTE:** Use `temp_uri` from commit response, NOT `uri`

---

### Content Overview

```http
GET /content/overview?uri={root_uri}
Headers:
  X-API-Key: hive-mind-key
  X-OpenViking-Account: default
  X-OpenViking-User: hive-mind
```

⚠️ **NOTE:** Use `uri` (root_uri) for overview, NOT `temp_uri`

---

### Semantic Search

```http
POST /resources/search
Headers:
  X-API-Key: hive-mind-key
  X-OpenViking-Account: default
  X-OpenViking-User: hive-mind
  Content-Type: application/json
Body:
{
  "query_vector": [0.123, -0.456, ...],  // 768-dim embedding
  "limit": 5
}
```

**Response:**
```json
{
  "result": {
    "resources": [  // ⚠️ NOTE: 'resources' NOT 'memories'
      {
        "uri": "viking://resources/hive-mind/shared/memory/...",
        "score": 0.95,
        "content": "Memory content..."
      }
    ]
  }
}
```

⚠️ **NOTE:** Extract from `result.resources[]` NOT `result.memories[]`

---

### Embedding Generation

```http
POST /v1/embeddings
Headers:
  Content-Type: application/json
Body:
{
  "model": "nomic-embed-text-v1.5.Q4_K_M.gguf",
  "input": "text to embed"
}
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, ...]  // 768-dim vector
}
```

---

## Common Errors

### 422 Unprocessable Entity

**Cause:** Wrong field name in `resources/commit`

```json
{
  "error": "Invalid temp_file_id format"
}
```

**Fix:** Use `path` instead of `temp_file_id`

---

### 404 Not Found

**Cause:** Wrong URI type for endpoint

```
GET /content/read?uri=viking://resources/...  ← Wrong (use temp_uri)
GET /content/overview?uri=viking://temp/...  ← Wrong (use root_uri)
```

---

### Empty Search Results

**Cause:** Wrong response path

```javascript
// ❌ WRONG
const results = data.result.memories || []

// ✅ CORRECT
const results = data.result.resources || data.result.memories || []
```

---

## Plugin Code References

### uploadToOV (line 529)
```typescript
body: JSON.stringify({ path: tempId, to: targetUri, reason })
// ⚠️ Fixed: was 'temp_file_id' before
```

### searchInOV (line 390-392)
```typescript
const result = data.result || {}
const results = result.resources || result.memories || []
// ⚠️ Fixed: was 'data.memories' before
```

---

*API Reference v1.0 — Leviathan Agent — 2026-04-02*
