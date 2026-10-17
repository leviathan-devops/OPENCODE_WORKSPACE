# ✅ Qwen3.5-9B AI Server - PERMANENT SETUP COMPLETE

## 🎉 Your AI is Now Always Available

Your **llama.cpp Qwen3.5-9B AI server** is permanently installed and configured to:
- ✅ **Start automatically on boot**
- ✅ **Restart if it crashes**
- ✅ **Run 24/7 in the background**
- ✅ **Be available like internet connectivity**

---

## 📋 Final Configuration

| Setting | Value |
|---------|-------|
| **Model** | Qwen3.5-9B-Q4_K_M.gguf (5.3GB) |
| **Context** | 8192 tokens |
| **Batch Size** | 512 |
| **Parallel Slots** | 2 |
| **GPU Layers** | 99 (full offload) |
| **Port** | 8000 |
| **Flash Attention** | Disabled (Qwen3.5 compatibility) |
| **Service** | systemd (auto-start) |

---

## 🚀 How to Use

### Just Run Qwen Code:
```bash
qwen --yolo
```

### If You Need to Switch to Local AI:
```bash
qwen-llama    # Switch Qwen Code to local backend
qwen --yolo   # Then use as normal
```

---

## 🔧 Service Management

### Check Status
```bash
sudo systemctl status llama-qwen35
```

### View Logs (real-time)
```bash
sudo journalctl -u llama-qwen35 -f
```

### Restart (if ever needed)
```bash
sudo systemctl restart llama-qwen35
```

### Stop
```bash
sudo systemctl stop llama-qwen35
```

### Start
```bash
sudo systemctl start llama-qwen35
```

---

## 🌐 API Endpoints

| Endpoint | URL |
|----------|-----|
| Health | `http://localhost:8000/health` |
| Models | `http://localhost:8000/v1/models` |
| Chat | `http://localhost:8000/v1/chat/completions` |
| Complete | `http://localhost:8000/v1/completions` |

### Test API:
```bash
curl http://localhost:8000/health

curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"max_tokens":50}'
```

---

## 🔌 Qwen Code Configuration

- **API Base**: `http://localhost:8000/v1`
- **API Key**: `llama-cpp-key`
- **Model**: `Qwen3.5-9B`
- **Max Tokens**: 8192

---

## ⚡ Quick Commands

### Added to ~/.bash_aliases:
```bash
qwen-llama        # Switch to llama.cpp backend
qwen-local        # Switch to vLLM (alternative)
qwen-deepseek     # Switch to DeepSeek API
qwen-free         # Switch to free Qwen API
qwen-api-status   # Show current API config
```

### Server Management:
```bash
/home/leviathan/OPENCODE_WORKSPACE/llama-server-manager.sh start    # Start manually
/home/leviathan/OPENCODE_WORKSPACE/llama-server-manager.sh stop     # Stop manually
/home/leviathan/OPENCODE_WORKSPACE/llama-server-manager.sh status   # Check status
```

---

## 📊 Resource Usage

| Resource | Usage |
|----------|-------|
| **VRAM** | ~5.7GB (RTX 4080) |
| **RAM** | ~235MB |
| **CPU** | Minimal (idle when not generating) |
| **Disk** | 5.3GB (model file) |

---

## 🛠️ Troubleshooting

### Server Not Responding?
```bash
# Check status
sudo systemctl status llama-qwen35

# Restart
sudo systemctl restart llama-qwen35

# View recent logs
sudo journalctl -u llama-qwen35 -n 50
```

### API Connection Error?
```bash
# Verify server is running
curl http://localhost:8000/health

# Switch to local backend
qwen-llama

# Check config
cat ~/.qwen/config.json
```

### Context Size Error?
The server is configured for 8192 tokens. If you get context errors,
your request + conversation history exceeds this limit.

---

## 📁 File Locations

| File | Path |
|------|------|
| **Model** | `/home/leviathan/OPENCODE_WORKSPACE/models/gguf/Qwen3.5-9B-Q4_K_M.gguf` |
| **Server Binary** | `/home/leviathan/OPENCODE_WORKSPACE/llama.cpp/build/bin/llama-server` |
| **Service File** | `/etc/systemd/system/llama-qwen35.service` |
| **Logs** | `journalctl -u llama-qwen35` |
| **Qwen Config** | `/home/leviathan/OPENCODE_WORKSPACE/.qwen/config.json` |
| **Switch Script** | `/home/leviathan/OPENCODE_WORKSPACE/.qwen-switch-real.sh` |

---

## 🔄 Auto-Start Behavior

The server will automatically:
- ✅ Start on system boot
- ✅ Restart if it crashes (Restart=always)
- ✅ Run in the background (no terminal needed)
- ✅ Be available immediately after login

**No manual intervention required** - it works like internet connectivity.

---

## 🎯 Ready to Use

Your AI is now **permanently available**. Just run:

```bash
qwen --yolo
```

And start coding! 🚀

---

**Last Updated:** $(date)
**Service Status:** $(sudo systemctl is-active llama-qwen35)
**Health Check:** $(curl -s http://localhost:8000/health)
