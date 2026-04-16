# vLLM Qwen2.5-Coder Setup for RTX 4080

## Problem Analysis
Your previous setup failed due to:
1. **Multiple vLLM instances** fighting for port 8000
2. **CPU offloading** wasting RAM instead of using GPU
3. **No clean switching** between APIs
4. **Wrapper script spaghetti**

## Clean Solution

### 1. Install vLLM
```bash
pip install vllm
```

### 2. Setup Systemd Service
```bash
chmod +x ~/vllm-qwen-setup.sh
~/vllm-qwen-setup.sh
systemctl --user daemon-reload
systemctl --user enable vllm-qwen.service
```

### 3. Start vLLM Server
```bash
vllm-start
# Check logs: vllm-logs
# Check status: qwen-status
```

### 4. Switch Between APIs
```bash
# Switch to local vLLM
qwen-local

# Switch back to DeepSeek
qwen-deepseek

# Switch to OpenRouter (set your key first)
export OPENROUTER_KEY="sk-or-v1-..."
qwen-openrouter
```

## Configuration Details

### vLLM Service (optimized for RTX 4080 12GB)
- Model: `Qwen/Qwen2.5-Coder-14B-Instruct-AWQ`
- Port: `8000`
- GPU Memory: `85%` utilization (10.2GB)
- Quantization: `AWQ` (4-bit)
- Max tokens: `8192`
- API Key: `vllm-local-key`

### For 4-6 Concurrent Terminals
- vLLM handles concurrent requests automatically
- Each Qwen Code instance connects to `localhost:8000/v1`
- Systemd service has increased file/process limits

## Aliases Available
- `qwen-local` / `qwen-deepseek` / `qwen-openrouter` - Switch APIs
- `vllm-start` / `vllm-stop` / `vllm-restart` - Control vLLM
- `vllm-logs` - View logs
- `qwen-status` - Check API status

## Model Alternatives
If 14B is too tight:
```bash
# Use 7B model (better fit for 12GB VRAM)
vllm serve Qwen/Qwen2.5-Coder-7B-Instruct \
  --port 8000 \
  --gpu-memory-utilization 0.9 \
  --max-model-len 16384
```

## Troubleshooting
1. **Port 8000 in use**: `sudo lsof -i :8000` then kill process
2. **Out of memory**: Reduce `--gpu-memory-utilization` to `0.8`
3. **Service won't start**: Check `journalctl --user -u vllm-qwen.service`
4. **Slow responses**: Monitor GPU usage with `nvidia-smi`

## Switching Workflow
1. When you want unlimited local usage: `qwen-local`
2. When you need better model: `qwen-deepseek`
3. All Qwen Code terminals use the same endpoint
4. Restart terminals after switching