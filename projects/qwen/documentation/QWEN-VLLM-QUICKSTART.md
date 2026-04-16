# Qwen vLLM Quick Start Guide

## Problem Fixed:
Qwen Code was trying to use model `deepseek-chat` but your vLLM server was serving `qwen-coder-14b`.

## Solution Applied:
vLLM now serves the model as `deepseek-chat` to match Qwen Code's expectations.

## How to Use:

### In EACH terminal where you want local vLLM:
```bash
# 1. Load the aliases/functions
source ~/.bashrc

# 2. Switch to local vLLM (this terminal only)
qwen-local

# 3. Run Qwen Code
qwen --yolo
```

### To switch back to DeepSeek API:
```bash
qwen-deepseek
qwen --yolo
```

### To check current API:
```bash
qwen-api-status
```

## Key Points:
1. **Each terminal is independent** - one can use local vLLM, another DeepSeek
2. **No model name conflicts** - vLLM serves as `deepseek-chat`
3. **No need to restart terminals** - just switch APIs and run `qwen`
4. **vLLM handles 4-6 concurrent requests** - perfect for multiple terminals

## Verification:
- vLLM server: ✓ Running on port 8000
- Model name: ✓ `deepseek-chat` 
- API endpoint: ✓ `http://localhost:8000/v1`
- Authentication: ✓ API key `vllm-local-key`
- Completions: ✓ Working (tested with curl)

## Troubleshooting:
If you still see "model deepseek-chat does not exist":
1. Check vLLM is running: `systemctl --user status vllm-qwen.service`
2. Verify model name: `curl -H "Authorization: Bearer vllm-local-key" http://localhost:8000/v1/models`
3. Make sure you ran `qwen-local` in that terminal

## Ready to Go!
Your local Qwen2.5-Coder-14B is now set up as a drop-in replacement for DeepSeek API. Unlimited free coding assistance! 🚀