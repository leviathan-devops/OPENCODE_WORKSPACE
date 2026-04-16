# vLLM Qwen2.5-Coder Setup - Complete Solution

## Problem Analysis & Solution

### What Went Wrong Before:
1. **Multiple vLLM instances** fighting for port 8000
2. **14B model too large** for 12GB VRAM without CPU offload
3. **CPU offload misconfigured** - wasted RAM instead of helping
4. **No switching mechanism** between APIs
5. **Wrapper script spaghetti**

### Solution Implemented:

## 1. Optimal Configuration for RTX 4080 12GB

**Model**: `Qwen/Qwen2.5-Coder-14B-Instruct-AWQ` (9.4GB weights)
**Strategy**: GPU + CPU Offload
- GPU: 85% utilization (10.2GB)
- CPU Offload: 6GB RAM
- KV Cache: 5.93GB available
- Max tokens: 4,096
- Concurrent requests: 8

## 2. Files Created

### Core Configuration:
- `~/.config/systemd/user/vllm-qwen.service` - Optimized systemd service
- `~/.config/systemd/user/vllm-qwen-optimized.service` - 14B with CPU offload
- `~/.config/systemd/user/vllm-qwen-7b.service` - 7B fallback

### Scripts:
- `~/start-vllm-qwen.sh` - Manual startup script
- `~/vllm-monitor.sh` - Monitoring script
- `~/setup-vllm-complete.sh` - Complete setup script
- `~/.qwen-switch.sh` - API switching script

### Aliases (`~/.bash_aliases`):
- `qwen-local` / `qwen-deepseek` - Switch APIs
- `vllm-start` / `vllm-stop` / `vllm-restart` - Control vLLM
- `vllm-logs` - View logs
- `vllm-monitor` - Check status
- `qwen-status` - Test API

## 3. Setup Instructions

```bash
# Complete setup
~/setup-vllm-complete.sh

# Or manual setup:
systemctl --user daemon-reload
systemctl --user enable vllm-qwen.service
systemctl --user start vllm-qwen.service
qwen-local
```

## 4. Usage

### For 4-6 Terminals:
1. Start vLLM: `vllm-start`
2. Switch to local: `qwen-local`
3. Open terminals: `qwen --yolo`
4. All terminals share the same vLLM backend

### Switching APIs:
```bash
qwen-local      # Unlimited free local usage
qwen-deepseek   # Switch to DeepSeek API
qwen-status     # Check which API is active
```

### Monitoring:
```bash
vllm-monitor    # Check server status
vllm-logs       # View real-time logs
nvidia-smi      # Check GPU usage
```

## 5. Technical Details

### Why CPU Offload is Necessary:
- 14B AWQ model: 9.38GB GPU memory
- RTX 4080: 12GB total VRAM
- Without offload: No KV cache memory (-1.29GB available)
- With 6GB CPU offload: 5.93GB KV cache available

### Performance:
- KV Cache: 32,384 tokens
- Max concurrency: ~8 requests
- Response time: Optimized for coding tasks
- Supports 4-6 terminals simultaneously

## 6. Troubleshooting

### Common Issues:
1. **Port 8000 in use**: `sudo lsof -i :8000` then kill
2. **Out of memory**: Reduce `--cpu-offload-gb` to 4
3. **Slow responses**: Check `vllm-monitor` and `nvidia-smi`
4. **Model won't load**: Try 7B fallback service

### Logs:
```bash
journalctl --user -u vllm-qwen.service -f
~/vllm-monitor.sh
```

## 7. Verification

Test that everything works:
```bash
# 1. Start vLLM
vllm-start

# 2. Wait 1-2 minutes for model load
sleep 60

# 3. Check status
qwen-status

# 4. Test with Qwen Code
qwen --yolo
```

## 8. Benefits Achieved

1. **Single vLLM instance** - No port conflicts
2. **Proper GPU utilization** - 85% VRAM + 6GB CPU offload
3. **Easy API switching** - Toggle between local/cloud
4. **Multi-agent ready** - Supports 4-6 concurrent terminals
5. **Systemd managed** - Auto-restart, proper logging
6. **No Ollama** - Pure vLLM for multi-agent capability

## Ready for Vibe Coding! 🚀

Your local Qwen2.5-Coder-14B is now set up as a dedicated API backend.
Unlimited free usage for heavy token tasks, with easy switching to cloud APIs when needed.