# Hive Mind Plugin — Operations Quick Reference

---

## Critical Paths

### Start Everything (in order)
```bash
# 1. Embedding server (port 8001)
cd /home/leviathan && ./llama.cpp/build/bin/llama-server \
  -m models/nomic-embed-text-v1.5.Q4_K_M.gguf \
  -ngl 99 --port 8001 --host 0.0.0.0 --embeddings &

# 2. OpenViking (port 1933)
/home/leviathan/.local/bin/openviking-server \
  --config /home/leviathan/.openviking/ov.conf &

# 3. Verify
curl -s localhost:1933/health
curl -s localhost:8001/v1/models
```

### Stop Everything
```bash
pkill -f "llama-server.*8001"
pkill -f "openviking-server"
```

---

## Health Checks

```bash
# Check all services at once
curl -s localhost:1933/health && echo " OpenViking OK"
curl -s localhost:8001/v1/models | grep -q nomic && echo " Embedding OK"
[ -d /home/leviathan/.local/share/opencode/hive-mind ] && echo " Fallback OK"
```

---

## Common Issues & Fixes

| Problem | Command to Diagnose | Fix |
|---------|-------------------|-----|
| Search returns inf errors | `cat ov.conf \| grep dimension` | Dimension mismatch - recreate vectordb |
| All uploads to fallback | `curl localhost:1933/health` | OpenViking down - restart |
| Hooks not firing | `grep canary hive-mind-plugin.log` | Check OpenCode version |
| Embedding errors | `curl localhost:8001/v1/embeddings -d '{"input":"test"}'` | Restart with --embeddings |

---

## Log Locations

```
/home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log  # Plugin
/tmp/ov.log  # OpenViking (if redirected)
/tmp/llama-embed.log  # Embedding server
```

---

## Key Metrics to Watch

- `hive_mind_upload_total{status="fallback"}` should be 0 or rare
- `hive_mind_hook_invocations_total` should increase during active sessions
- OpenViking vector DB dimension must be 768 (not 1024)

---

## Key Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `ARCHITECTURE_SIGNAL_THRESHOLD` | 3 | Score needed for breakthrough |
| `GOLD_STANDARD_MIN_CHARS` | 2000 | Min file size |
| `ERROR_FIX_WINDOW_MS` | 300000 | Error→fix window (5 min) |
| `BREAKTHROUGH_COOLDOWN_MS` | 600000 | Breakthrough cooldown (10 min) |
| `HEALTH_CHECK_INTERVAL_MS` | 60000 | Health check interval (1 min) |

---

## Critical API Quirks

1. `temp_upload` returns `temp_path` (NOT `temp_file_id`)
2. `resources/commit` expects `path` field (NOT `temp_file_id`)
3. Search returns `result.resources[]` (NOT `result.memories[]`)

---

*Quick Reference v1.0 — Leviathan Agent — 2026-04-02*
