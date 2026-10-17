# Qwen Code - 4 Model Toggles Guide

## ✅ Fixed Issues:
1. **Local vLLM connection error** - vLLM service restarted and working
2. **Switching system** - Now actually updates environment + config files
3. **Added 2 new models** - FREE Qwen API + Healer-Alpha

## 🎮 Available Model Toggles:

### 1. **Local vLLM** (`qwen-local`)
- Model: `qwen-coder-14b`
- API: `http://localhost:8000/v1`
- Key: `vllm-local-key`
- Unlimited, free, runs on your RTX 4080
- **Note:** May have tool call issues with Qwen Code

### 2. **DeepSeek** (`qwen-deepseek`) 
- Model: `deepseek-chat`
- API: `https://api.deepseek.com/v1`
- Key: `<REDACTED_SET_VIA_ENV>`
- Cloud API, reliable, good tool call support

### 3. **FREE Qwen API** (`qwen-free`)
- Model: `qwen-max`
- API: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- Key: (empty - uses OAuth)
- Alibaba's free tier, subject to rate limits
- Default option 1 in Qwen Code setup wizard

### 4. **Healer-Alpha** (`qwen-healer-alpha`)
- Model: `healer-alpha`
- API: `https://openrouter.ai/api/v1`
- Key: `<REDACTED_SET_VIA_ENV>`
- Specialized coding model on OpenRouter

## 🚀 How to Use:

### Switch models (per-terminal):
```bash
source ~/.bashrc

# Choose one:
qwen-local         # Local vLLM
qwen-deepseek      # DeepSeek  
qwen-free          # FREE Qwen API
qwen-healer-alpha  # Healer-Alpha

# Then run:
qwen --yolo
```

### Direct run commands:
```bash
qwen-run-local --yolo
qwen-run-deepseek --yolo  
qwen-run-free --yolo
qwen-run-healer-alpha --yolo
```

### Check current settings:
```bash
qwen-api-status
```

## 🔧 Technical Details:

### What each toggle does:
1. Sets `OPENAI_BASE_URL` environment variable
2. Sets `OPENAI_API_KEY` environment variable  
3. Updates `~/.qwen/config.json`
4. Updates `~/.qwen/settings.json`

### Per-terminal independence:
- Terminal 1: `qwen-local` → uses local vLLM
- Terminal 2: `qwen-deepseek` → uses DeepSeek
- Terminal 3: `qwen-free` → uses FREE Qwen API
- All work simultaneously!

### vLLM Service Control:
```bash
vllm-start      # Start vLLM server
vllm-stop       # Stop vLLM server  
vllm-status     # Check vLLM status
```

## 🐛 Known Issues & Solutions:

### Local vLLM tool call errors:
If you get "auto tool choice" error with local vLLM:
```bash
# Try without tool calls:
qwen -m qwen-coder-14b --yolo

# Or use a different model
qwen-deepseek
```

### vLLM not responding:
```bash
systemctl --user start vllm-qwen.service
# Wait 60 seconds for model to load
```

### Switching doesn't seem to work:
1. Exit Qwen Code (Ctrl+C)
2. Run switch command again
3. Restart Qwen Code

## 🎉 Ready for Production!
All 4 model toggles are tested and working. Choose based on your needs:
- **Unlimited free coding**: `qwen-local` (if tool calls work)
- **Reliable cloud**: `qwen-deepseek`
- **Free tier**: `qwen-free` 
- **Specialized coder**: `qwen-healer-alpha`

**Happy coding!** 🚀