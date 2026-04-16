#!/bin/bash
# Fallback: Use standard vLLM with AWQ quantization (most stable)

# Kill existing processes
pkill -f vllm
sleep 2

# Clear GPU cache
python3 -c "import torch; torch.cuda.empty_cache()"

# Use AWQ quantized model (fits in 12GB VRAM)
vllm serve Qwen/Qwen2.5-Coder-7B-Instruct-AWQ \
    --quantization awq \
    --gpu-memory-utilization 0.9 \
    --max-model-len 4096 \
    --enable-auto-tool-choice \
    --tool-call-parser qwen2.5_coder \
    --served-model-name qwen-coder-7b \
    --port 8000 \
    --host 0.0.0.0 \
    --block-size 16 \
    --swap-space 0 \
    --max-parallel-loading-workers 1