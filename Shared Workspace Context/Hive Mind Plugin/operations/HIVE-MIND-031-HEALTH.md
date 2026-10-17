# Hive Mind Plugin — Health Checks

---

## Health Check Script

```bash
#!/bin/bash
# health-check.sh - Run via cron every 5 minutes

LOG_FILE="/var/log/hive-mind/health-check.log"
echo "$(date) - Starting health check" >> $LOG_FILE

# Check OpenViking
if curl -s http://localhost:1933/health -H "X-API-Key: <REDACTED_SET_VIA_ENV>" | grep -q '"healthy":true'; then
    echo "$(date) - OpenViking: OK" >> $LOG_FILE
else
    echo "$(date) - OpenViking: FAILED" >> $LOG_FILE
    # Alert here (email, slack, etc.)
fi

# Check Embedding Server
if curl -s http://localhost:8001/v1/models | grep -q "nomic"; then
    echo "$(date) - Embedding: OK" >> $LOG_FILE
else
    echo "$(date) - Embedding: FAILED" >> $LOG_FILE
    # Alert here
fi

# Check local fallback directory
if [ -d "/home/leviathan/.local/share/opencode/hive-mind" ]; then
    echo "$(date) - Local fallback: OK" >> $LOG_FILE
else
    echo "$(date) - Local fallback: MISSING" >> $LOG_FILE
fi

echo "$(date) - Health check complete" >> $LOG_FILE
```

---

## Quick Health Check

```bash
# Check all services at once
curl -s localhost:1933/health && echo " OpenViking OK"
curl -s localhost:8001/v1/models | grep -q nomic && echo " Embedding OK"
[ -d /home/leviathan/.local/share/opencode/hive-mind ] && echo " Fallback OK"
```

---

## Log Locations

| Log | Location | Purpose |
|-----|----------|---------|
| Plugin logs | `/home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log` | All plugin activity |
| OpenViking logs | `/var/log/hive-mind/openviking.log` (or stdout) | OpenViking server |
| Embedding logs | `/var/log/hive-mind/llama-embedding.log` | Embedding server |

---

## Key Metrics to Watch

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| OpenViking health | Plugin logs or `/health` endpoint | Any `ERROR` in logs |
| Plugin loaded | Plugin log entry | Missing startup message |
| Hook executions | Canary counter in plugin | `totalHookCalls == 0` after 5 min |
| Upload failures | Plugin logs | Any `Upload exception` |
| Local fallback usage | Plugin logs | `Wrote to local fallback` entries |
| Embedding server | `curl localhost:8001/v1/models` | Non-200 response |
| Vector count | OpenViking `collection_meta.json` | Dimension mismatch |

---

## Plugin Log Format

Plugin logs are JSON Lines format:

```json
{"timestamp":"2026-04-02T12:00:00.000Z","level":"INFO","plugin":"HiveMind","category":"upload","message":"Successfully uploaded to OpenViking","data":{"filename":"breakthrough_architecture_123.md","targetUri":"viking://resources/...","localPath":"/home/leviathan/.local/share/opencode/hive-mind/..."}}
```

---

## Prometheus Metrics (Future)

Potential metrics to expose:

```
# HELP hive_mind_upload_total Total upload attempts
# TYPE hive_mind_upload_total counter
hive_mind_upload_total{status="success"} 123
hive_mind_upload_total{status="fallback"} 5

# HELP hive_mind_hook_invocations_total Total hook calls
# TYPE hive_mind_hook_invocations_total counter
hive_mind_hook_invocations_total 456

# HELP hive_mind_breakthrough_commits_total Total breakthroughs committed
# TYPE hive_mind_breakthrough_commits_total counter
hive_mind_breakthrough_commits_total{type="architecture"} 12
hive_mind_breakthrough_commits_total{type="error_fix"} 8
hive_mind_breakthrough_commits_total{type="file_creation"} 15
```

---

*Health v1.0 — Leviathan Agent — 2026-04-02*
