#!/bin/bash
# Start vLLM with Qwen2.5-Coder-14B optimized for RTX 4080 12GB

set -e

echo "Starting vLLM Qwen2.5-Coder-14B server..."
echo "GPU: RTX 4080 12GB VRAM"
echo "RAM: 30GB total, 6GB allocated for CPU offload"

# Kill any existing vLLM processes
pkill -f "vllm serve" 2>/dev/null || true
sleep 2

# Start vLLM with CPU offload
source ~/vllm-venv/bin/activate

vllm serve Qwen/Qwen2.5-Coder-14B-Instruct-AWQ \
  --port 8000 \
  --host 0.0.0.0 \
  --gpu-memory-utilization 0.85 \
  --cpu-offload-gb 6 \
  --max-model-len 4096 \
  --quantization awq \
  --served-model-name qwen-coder-14b \
  --api-key vllm-local-key \
  --max-num-seqs 8 \
  --max-num-batched-tokens 1024 \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_xml \
  --disable-log-requests \
  --disable-log-stats

# Alternative 7B command (uncomment if 14B fails):
# vllm serve Qwen/Qwen2.5-Coder-7B-Instruct \
#   --port 8000 \
#   --host 0.0.0.0 \
#   --gpu-memory-utilization 0.90 \
#   --max-model-len 8192 \
#   --served-model-name qwen-coder-7b \
#   --api-key vllm-local-key \
#   --max-num-seqs 16 \
#   --max-num-batched-tokens 2048