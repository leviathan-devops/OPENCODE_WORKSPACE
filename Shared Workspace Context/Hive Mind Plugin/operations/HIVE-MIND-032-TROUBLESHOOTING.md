# Hive Mind Plugin — Troubleshooting

---

## Issue: Plugin Not Loading

**Symptoms:**
- No "HiveMind Plugin loaded" in logs
- Tools not appearing in OpenCode

**Diagnosis:**
```bash
# Check OpenCode plugin logs
ls -la /home/leviathan/.local/share/opencode/log/
tail -100 /home/leviathan/.local/share/opencode/log/*.log | grep -i hive

# Check plugin file exists
ls -la /home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts
```

**Resolution:**
1. Verify file exists and is valid TypeScript
2. Check OpenCode configuration for plugin path
3. Restart OpenCode

---

## Issue: All Uploads Fail with 422

**Symptoms:**
- Uploads go to local fallback
- Plugin logs show "Upload exception" or "422" errors

**Diagnosis:**
```bash
# Check if using correct field name
grep -n "temp_file_id\|path:" /home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts | head -5
```

**Resolution:**
1. Verify line 529 uses `path:` not `temp_file_id:`
2. Restart plugin

**Fix Applied (2026-04-02):**
```typescript
// Before (WRONG):
body: JSON.stringify({ temp_file_id: tempId, to: targetUri, reason })

// After (CORRECT):
body: JSON.stringify({ path: tempId, to: targetUri, reason })
```

---

## Issue: All Searches Return Empty

**Symptoms:**
- `hive_context` returns empty results
- OpenViking has memories but search finds nothing

**Diagnosis:**
```bash
# Check response parsing
grep -n "result.memories\|result.resources" /home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts
```

**Resolution:**
1. Verify line 390-392 extracts from `result.resources`
2. Restart plugin

**Fix Applied (2026-04-02):**
```typescript
// Before (WRONG):
const results = data.result.memories || []

// After (CORRECT):
const result = data.result || {}
const results = result.resources || result.memories || []
```

---

## Issue: Hooks Not Firing

**Symptoms:**
- `totalHookCalls` stays at 0
- Breakthrough detection never triggers

**Diagnosis:**
```bash
# Check canary entries
grep canary /home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log

# Check hook registration
grep -i "hook\|Hook" /home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log
```

**Possible Causes:**
1. OpenCode version doesn't support experimental hooks
2. Hook names changed
3. Plugin not properly registered

---

## Issue: Search Returns Infinity Errors

**Symptoms:**
- Search fails with "inf" errors
- Vector dimension mismatch

**Diagnosis:**
```bash
cat /home/leviathan/openviking_workspace/vectordb/context/collection_meta.json | grep Dimension
```

**Resolution:**
- If dimension is 1024 instead of 768: Vector DB needs recreation

---

## Issue: Embedding Errors

**Symptoms:**
- Embedding requests fail
- Search doesn't work

**Diagnosis:**
```bash
curl -s -X POST http://localhost:8001/v1/embeddings \
  -d '{"input":"test"}'
```

**Resolution:**
1. Verify llama-server started with `--embeddings` flag
2. Restart embedding server

---

## Common Issues Table

| Problem | Command to Diagnose | Fix |
|---------|-------------------|-----|
| Search returns inf errors | `cat ov.conf | grep dimension` | Dimension mismatch - recreate vectordb |
| All uploads to fallback | `curl localhost:1933/health` | OpenViking down - restart |
| Hooks not firing | `grep canary hive-mind-plugin.log` | Check OpenCode version |
| Embedding errors | `curl localhost:8001/v1/embeddings -d '{"input":"test"}'` | Restart with --embeddings |

---

## Restart Procedures

### Restart Embedding Server
```bash
fuser -k 8001/tcp 2>/dev/null || true
cd /home/leviathan && ./llama.cpp/build/bin/llama-server \
  -m models/nomic-embed-text-v1.5.Q4_K_M.gguf \
  -ngl 99 --port 8001 --host 0.0.0.0 --embeddings &
```

### Restart OpenViking
```bash
pkill -f openviking-server
sleep 2
/home/leviathan/.local/bin/openviking-server \
  --config /home/leviathan/.openviking/ov.conf &
```

### Restart Plugin
```bash
# Restart OpenCode to reload plugin
pkill -f opencode
opencode &
```

---

*Troubleshooting v1.0 — Leviathan Agent — 2026-04-02*
