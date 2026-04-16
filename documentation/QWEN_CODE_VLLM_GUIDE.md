# 🚀 Qwen Code + vLLM Local Setup - COMPLETE

## ✅ SETUP COMPLETE!

Your Qwen Code is now configured to use local vLLM with Qwen 2.5 Coder 14B.

## 📋 WHAT WAS SET UP

### 1. vLLM Server (Max Performance)
- **Service**: `vllm-qwen-multi` (systemd)
- **Port**: 8000
- **Model**: Qwen 2.5 Coder 14B AWQ (4-bit quantized)
- **GPU**: 85% utilization (10.2GB of 12GB)
- **CPU Offloading**: 4GB for overflow
- **Concurrency**: 12 concurrent sequences
- **Context**: 4096 tokens
- **Auto-restart**: Enabled

### 2. Qwen Code Configuration
- **Environment Variables**:
  - `OPENAI_BASE_URL=http://localhost:8000/v1`
  - `OPENAI_API_KEY=no-key-required-local-vllm`
  - `OPENAI_MODEL=qwen2.5-coder-14b-awq`
- **Alias**: `qwen-vllm` for easy use
- **Wrapper Script**: `~/qwen-vllm-wrapper.sh`

### 3. Management Commands
- `vllm-start` - Start vLLM server
- `vllm-status` - Check vLLM status and GPU usage
- `vllm-restart` - Restart vLLM server

## 🎯 HOW TO USE

### Single Terminal:
```bash
# Method 1: Using alias
qwen-vllm "Write Python code to parse JSON"

# Method 2: Using wrapper script
~/qwen-vllm-wrapper.sh "Create a React component"

# Method 3: Direct with env vars (already set)
qwen "Write a Dockerfile for Node.js"
```

### Multiple Terminals (2-3 recommended, 4-6 possible):
1. Open Terminal 1:
   ```bash
   qwen-vllm "Work on backend API"
   ```

2. Open Terminal 2:
   ```bash
   qwen-vllm "Work on database schema"
   ```

3. Open Terminal 3:
   ```bash
   qwen-vllm "Work on frontend components"
   ```

### Test Multi-Terminal Setup:
```bash
~/test-multi-qwen.sh
```

## ⚡ PERFORMANCE

### Hardware Utilization:
- **GPU**: 85% VRAM (10.2GB/12GB) - Max performance
- **CPU**: 4GB offloading buffer
- **RAM**: 20GB limit for vLLM
- **Concurrency**: 2-3 terminals smoothly, 4-6 with tuning

### Speed:
- **First request**: 5-15 seconds (model warmup + CUDA graph compilation)
- **Subsequent requests**: 2-5 seconds
- **Tokens/second**: ~30-50 tokens/sec (4-bit AWQ on RTX 4080)

### Cost Savings:
- **Before**: Qwen API costs + rate limits
- **Now**: $0 local inference
- **Tokens/month**: Unlimited
- **Privacy**: 100% local

## 🔧 TROUBLESHOOTING

### vLLM Not Starting:
```bash
# Check logs
sudo journalctl -u vllm-qwen-multi -n 50

# Restart service
sudo systemctl restart vllm-qwen-multi

# Check GPU memory
nvidia-smi
```

### Qwen Code Can't Connect:
```bash
# Test vLLM directly
curl http://localhost:8000/health

# Check environment variables
echo $OPENAI_BASE_URL
echo $OPENAI_MODEL

# Run with explicit flags
qwen --openai-base-url "http://localhost:8000/v1" --openai-api-key "no-key" --model "qwen2.5-coder-14b-awq" "test"
```

### Out of Memory:
- Reduce concurrent terminals
- Check `nvidia-smi` for GPU memory usage
- Restart vLLM to clear cache

## 📊 MONITORING

```bash
# Check vLLM status
vllm-status

# Follow vLLM logs
sudo journalctl -u vllm-qwen-multi -f

# Monitor GPU
watch -n 1 nvidia-smi

# Check model info
curl http://localhost:8000/v1/models
```

## 🎉 CONGRATULATIONS!

You now have:
- ✅ Local Qwen 2.5 Coder 14B running at max performance
- ✅ Qwen Code using local inference (no API costs)
- ✅ Support for 2-3 terminals (4-6 with tuning)
- ✅ Full hardware utilization (AI engineering dedicated machine)
- ✅ Hermes Agent compatibility (leaves room for its operations)

**Next Steps:**
1. Open a terminal and run `qwen-vllm` to test
2. Open 2-3 terminals for "junior engineer" workflow
3. Use Hermes as "senior engineer" for production-grade work

Enjoy your unlimited, local Qwen Code! 🚀
