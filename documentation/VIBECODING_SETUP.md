# 🚀 vLLM Multi-Agent Vibecoding Setup

## ✅ CURRENT STATUS: vLLM IS RUNNING!

**Server**: `http://localhost:8000`  
**Model**: `qwen2.5-coder-14b-awq` (Qwen 2.5 Coder 14B, 4-bit AWQ quantized)  
**GPU Usage**: 9.4GB/12GB VRAM (78% utilization)  
**CPU Offloading**: 6.4GB to RAM  
**Concurrent Capacity**: 5+ terminals easily  

## 🖥️ HOW TO USE 5 TERMINALS FOR VIBECODING

### Terminal 1-5: Each running this command pattern:

```bash
# Basic curl request (any terminal)
curl -X POST http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-coder-14b-awq",
    "prompt": "Write Python code to sort a list of dictionaries by key:",
    "max_tokens": 512,
    "temperature": 0.7,
    "top_p": 0.95
  }'
```

### Python Client (for each terminal):

```python
# Save as ~/vibecode_client.py in each terminal
import requests
import json

def code_with_qwen(prompt, max_tokens=512):
    url = "http://localhost:8000/v1/completions"
    headers = {"Content-Type": "application/json"}
    
    data = {
        "model": "qwen2.5-coder-14b-awq",
        "prompt": prompt,
        "max_tokens": max_tokens,
        "temperature": 0.7,
        "top_p": 0.95
    }
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        result = response.json()
        return result["choices"][0]["text"]
    else:
        return f"Error: {response.status_code}"

# Use in terminal:
# print(code_with_qwen("Write a React component for a button"))
```

### Bash Alias (add to ~/.bashrc in each terminal):

```bash
# Add to ~/.bashrc
vibecode() {
    curl -X POST http://localhost:8000/v1/completions \
      -H "Content-Type: application/json" \
      -d "{\"model\":\"qwen2.5-coder-14b-awq\",\"prompt\":\"$1\",\"max_tokens\":512,\"temperature\":0.7}" | \
      jq -r '.choices[0].text'
}

# Then in terminal: vibecode "Write Python function to parse JSON"
```

## ⚡ PERFORMANCE OPTIMIZATIONS

### For Faster Responses (reduce from 18s to 2-3s):

1. **Enable CUDA Graphs** (remove `--enforce-eager`):
   ```bash
   # Edit service: sudo nano /etc/systemd/system/vllm-qwen-multi.service
   # Remove: --enforce-eager
   # Then: sudo systemctl restart vllm-qwen-multi
   ```

2. **Reduce Context Length** (if you don't need 8K):
   ```bash
   # Change: --max-model-len 4096
   ```

3. **Pre-warm the model** (run a few requests first):
   ```bash
   # Run this once:
   for i in {1..5}; do
     curl -X POST http://localhost:8000/v1/completions \
       -H "Content-Type: application/json" \
       -d '{"model":"qwen2.5-coder-14b-awq","prompt":"test","max_tokens":10}' &
   done
   ```

## 📊 MONITORING

### Check GPU Usage:
```bash
watch -n 1 nvidia-smi
```

### Check vLLM Logs:
```bash
sudo journalctl -u vllm-qwen-multi -f
```

### Check Server Health:
```bash
curl http://localhost:8000/health
```

## 🔧 TROUBLESHOOTING

### Server Not Responding:
```bash
sudo systemctl restart vllm-qwen-multi
sudo journalctl -u vllm-qwen-multi -n 50
```

### Out of Memory (if adding more terminals):
1. Reduce `--max-num-seqs` from 32 to 16
2. Reduce `--max-num-batched-tokens` from 2048 to 1024
3. Reduce `--gpu-memory-utilization` from 0.80 to 0.70

### Slow Responses:
1. Check GPU temperature: `nvidia-smi`
2. Check CPU usage: `htop`
3. Pre-warm with a few requests

## 🎯 EXAMPLE WORKFLOWS FOR 5 TERMINALS

### Terminal 1: Python Backend
```bash
vibecode "Write FastAPI endpoint for user authentication with JWT"
```

### Terminal 2: React Frontend
```bash
vibecode "Create React TypeScript component for data table with pagination"
```

### Terminal 3: Database/SQL
```bash
vibecode "Write SQL schema for e-commerce platform with users, products, orders"
```

### Terminal 4: DevOps
```bash
vibecode "Create Docker Compose file for Postgres + Redis + Node.js app"
```

### Terminal 5: Scripting
```bash
vibecode "Write bash script to deploy to AWS with rolling updates"
```

## 💰 COST SAVINGS

**Before**: Qwen API costs + rate limits  
**Now**: $0 local inference  
**Concurrent users**: 5+ terminals simultaneously  
**Tokens/month**: Unlimited  
**Latency**: ~2-5s after warmup  

## 🚀 QUICK START COMMANDS

```bash
# 1. Start vLLM (already running)
sudo systemctl start vllm-qwen-multi

# 2. Test one terminal
curl -X POST http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-coder-14b-awq","prompt":"Hello","max_tokens":50}'

# 3. Open 5 terminals and start vibecoding!
```

## 🎉 CONGRATULATIONS!

You now have a fully local, unlimited, multi-agent Qwen 2.5 Coder 14B setup. No API costs, no rate limits, just pure vibecoding power across 5+ terminals!

**Next**: Consider adding:
1. Load balancing for 10+ terminals
2. Model switching (DeepSeek, CodeLlama, etc.)
3. Web UI for easier access
4. Integration with VS Code/IDEs