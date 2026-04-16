# Hive Mind Plugin — Deployment Runbook

---

## Prerequisites

- [ ] Bun runtime 1.3+ installed: `bun --version`
- [ ] Python 3.12+ installed: `python3 --version`
- [ ] llama.cpp built with embedding support
- [ ] Embedding model present: `/home/leviathan/models/nomic-embed-text-v1.5.Q4_K_M.gguf`
- [ ] OpenViking installed: `/home/leviathan/.local/bin/openviking-server`
- [ ] Plugin file present: `/home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts`

---

## Step 1: Deploy Embedding Server

```bash
# Kill any existing embedding server on port 8001
fuser -k 8001/tcp 2>/dev/null || true

# Create log directory
mkdir -p /var/log/hive-mind

# Start llama-server with embedding model
cd /home/leviathan
./llama.cpp/build/bin/llama-server \
  -m models/nomic-embed-text-v1.5.Q4_K_M.gguf \
  -ngl 99 \
  --port 8001 \
  --host 0.0.0.0 \
  --embeddings \
  > /var/log/hive-mind/llama-embedding.log 2>&1 &

# Verify
curl -s http://localhost:8001/v1/models
```

**Expected:** JSON with model info including "nomic"

---

## Step 2: Deploy OpenViking Server

```bash
# Kill existing OpenViking
pkill -f openviking-server 2>/dev/null || true

# Start OpenViking
/home/leviathan/.local/bin/openviking-server \
  --config /home/leviathan/.openviking/ov.conf \
  > /var/log/hive-mind/openviking.log 2>&1 &

# Verify
curl -s http://localhost:1933/health
```

**Expected:** `{"status":"ok","healthy":true,"version":"0.2.9"}`

---

## Step 3: Create Local Fallback Directory

```bash
mkdir -p /home/leviathan/.local/share/opencode/hive-mind
chmod 755 /home/leviathan/.local/share/opencode/hive-mind
```

---

## Step 4: Deploy Plugin

```bash
# Copy plugin to plugins directory
cp /path/to/hive-mind-plugin.ts \
   /home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts

# Verify plugin directory
ls -la /home/leviathan/.config/opencode/plugins/
```

---

## Step 5: Verify Deployment

```bash
# Check plugin logs for "HiveMind Plugin loaded"
tail -f /home/leviathan/.local/share/opencode/hive-mind/hive-mind-plugin.log

# Or check OpenCode logs
tail -f /home/leviathan/.local/share/opencode/log/*.log
```

**Expected:** Log entry containing "HiveMind Plugin loaded" and "Starting OpenViking health check loop"

---

## Step 6: Run Health Verification

```bash
# Check OpenViking health
curl -s http://localhost:1933/health \
  -H "X-API-Key: hive-mind-key"

# Check Embedding server
curl -s http://localhost:8001/v1/models | grep nomic

# Check local fallback
ls -la /home/leviathan/.local/share/opencode/hive-mind/
```

---

## Quick Start (All in One)

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

---

## Stop Everything

```bash
pkill -f "llama-server.*8001"
pkill -f "openviking-server"
```

---

## Configuration Files

### OpenViking Config
**File:** `/home/leviathan/.openviking/ov.conf`

```json
{
  "storage": {
    "workspace": "/home/leviathan/openviking_workspace"
  },
  "server": {
    "host": "0.0.0.0",
    "port": 1933,
    "root_api_key": "hive-mind-key"
  },
  "embedding": {
    "dense": {
      "provider": "ollama",
      "api_base": "http://localhost:8001/v1",
      "model": "nomic-embed-text-v1.5.Q4_K_M.gguf",
      "dimension": 768
    }
  }
}
```

### Plugin Config
**File:** `/home/leviathan/.config/opencode/plugins/openviking-config.json`

```json
{
  "endpoint": "http://localhost:1933",
  "apiKey": "hive-mind-key",
  "enabled": true,
  "timeoutMs": 30000,
  "autoCommit": {
    "enabled": true,
    "intervalMinutes": 5
  }
}
```

---

*Deployment v1.0 — Leviathan Agent — 2026-04-02*
