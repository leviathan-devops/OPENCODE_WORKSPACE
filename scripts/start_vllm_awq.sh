#!/bin/bash
# Fallback to AWQ if FP8 fails

# Kill existing processes
pkill -f vllm
pkill -f python.*vllm
sleep 2

# Clear GPU cache
python3 -c "import torch; torch.cuda.empty_cache()"

# Use AWQ quantization - more stable in standard vLLM
# Revert to standard vLLM first
pip install --break-system-packages vllm==0.17.1 -q

# Start vLLM with AWQ quantization
vllm serve Qwen/Qwen2.5-Coder-7B-Instruct-AWQ \
  --host 0.0.0.0 \
  --port 8000 \
  --quantization awq \
  --gpu-memory-utilization 0.8 \
  --max-model-len 4096 \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder \
  --block-size 16 \
  --swap-space 0 \
  --served-model-name Qwen2.5-Coder-7B-AWQ