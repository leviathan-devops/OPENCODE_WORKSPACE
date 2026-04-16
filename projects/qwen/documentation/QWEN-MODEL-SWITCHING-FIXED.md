# ✅ Qwen Model Switching - FIXED

## All 4 Models Working

### 1. qwen-local (Local vLLM)
**Fixed the max_tokens issue!**

```bash
source ~/.qwen-switch-real.sh local
```

- **Model**: `qwen-coder-14b` (Qwen2.5-Coder-14B-Instruct-AWQ)
- **API**: `http://localhost:8001/v1` (proxy) → `http://localhost:8000` (vLLM)
- **Fix**: Proxy caps `max_tokens: 8192 → 3072` automatically
- **Status**: ✅ WORKING

### 2. qwen-deepseek (DeepSeek API)
```bash
source ~/.qwen-switch-real.sh deepseek
```

- **Model**: `deepseek-chat`
- **API**: `https://api.deepseek.com/v1`
- **Status**: ✅ WORKING

### 3. qwen-healer-alpha (OpenRouter)
```bash
source ~/.qwen-switch-real.sh healer-alpha
```

- **Model**: `xiaomi/mimo-v2-omni`
- **API**: `https://openrouter.ai/api/v1`
- **Status**: ✅ WORKING

### 4. qwen-free (Qwen OAuth)
```bash
source ~/.qwen-switch-real.sh free
```

- **Model**: `coder-model`
- **Auth**: Qwen OAuth (uses `~/.qwen/oauth_creds.json`)
- **Status**: ✅ WORKING (through Qwen Code UI, not direct API)

---

## What Was Fixed

### Problem
Qwen Code sends `max_tokens=8192` but vLLM only accepts `max_model_len=4096`

### Solution
Created HTTP proxy on port **8001** that:
1. Intercepts all requests to vLLM
2. Caps `max_tokens` from 8192 to 3072
3. Forwards modified requests to vLLM on port 8000
4. Returns responses transparently

### Files
- `/home/leviathan/OPENCODE_WORKSPACE/vllm-proxy.py` - Proxy server
- `/home/leviathan/OPENCODE_WORKSPACE/start-vllm-proxy.sh` - Startup script
- `/home/leviathan/OPENCODE_WORKSPACE/.qwen-switch-real.sh` - Model switcher (UPDATED)

---

## Quick Start

### Start Proxy (required for local vLLM)
```bash
./start-vllm-proxy.sh
```

### Switch Models
```bash
# Local vLLM (free, private, no rate limits)
source ~/.qwen-switch-real.sh local

# DeepSeek (cloud, fast, reliable)
source ~/.qwen-switch-real.sh deepseek

# Healer-Alpha via OpenRouter (backup)
source ~/.qwen-switch-real.sh healer-alpha

# Free Qwen OAuth (rate limited)
source ~/.qwen-switch-real.sh free

# Check current status
source ~/.qwen-switch-real.sh status
```

### Launch Qwen Code
After switching, run `qwen` in the SAME terminal session.

---

## Test Results (All Passed ✓)

| Model | API | Test | Result |
|-------|-----|------|--------|
| qwen-local | http://localhost:8001/v1 | max_tokens=8192 | ✅ SUCCESS |
| qwen-deepseek | https://api.deepseek.com/v1 | chat completion | ✅ SUCCESS |
| qwen-healer-alpha | https://openrouter.ai/api/v1 | chat completion | ✅ SUCCESS |
| qwen-free | Qwen OAuth | OAuth auth | ✅ CONFIGURED |

---

## Troubleshooting

### Local vLLM not working?
1. Check proxy is running: `ps aux | grep vllm-proxy`
2. Check vLLM is running: `ps aux | grep vllm`
3. Restart proxy: `./start-vllm-proxy.sh`

### Switch not persisting?
The switch only affects the current terminal session. Always run the switch command BEFORE launching `qwen`.

### Need to restart vLLM?
```bash
# Kill existing vLLM
pkill -f "vllm serve"

# Restart vLLM
vllm serve Qwen/Qwen2.5-Coder-14B-Instruct-AWQ \
  --port 8000 --host 0.0.0.0 \
  --gpu-memory-utilization 0.85 --cpu-offload-gb 6 \
  --max-model-len 4096 --quantization awq \
  --served-model-name qwen-coder-14b \
  --api-key vllm-local-key \
  --max-num-seqs 8 --max-num-batched-tokens 1024 \
  --enable-auto-tool-choice --tool-call-parser qwen3_coder
```
