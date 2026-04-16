# vLLM Proxy for Qwen Code

## Problem
Qwen Code sends `max_tokens=8192` to local vLLM, but vLLM only accepts `max_model_len=4096`.

## Solution
A simple HTTP proxy that intercepts requests and caps `max_tokens` to 3072.

## Usage

### Start the proxy:
```bash
./start-vllm-proxy.sh
```

### Configure Qwen Code
Update your Qwen Code settings to use the proxy at `http://localhost:8081` instead of direct vLLM at `http://localhost:8000`.

The proxy will:
- Forward all requests to vLLM on port 8000
- Cap `max_tokens` from 8192 → 3072 automatically
- Log all capped requests to `/tmp/vllm-proxy.log`

### Test it works:
```bash
# This should work through the proxy:
curl -X POST http://localhost:8081/v1/chat/completions \
  -H "Authorization: Bearer vllm-local-key" \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen-coder-14b", "messages": [{"role": "user", "content": "Hi"}], "max_tokens": 8192}'
```

## Ports
- **8081**: Proxy (Qwen Code connects here)
- **8000**: vLLM (proxy forwards here)

## Files
- `vllm-proxy.py` - The proxy server
- `start-vllm-proxy.sh` - Startup script
