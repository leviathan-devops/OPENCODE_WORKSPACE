#!/bin/bash
source ~/vllm-venv/bin/activate
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-Coder-14B-Instruct-AWQ \
  --host 0.0.0.0 \
  --port 8000 \
  --gpu-memory-utilization 0.85 \
  --max-model-len 4096 \
  --tensor-parallel-size 1 \
  --quantization awq \
  --served-model-name qwen2.5-coder-14b-awq \
  --max-num-batched-tokens 8192 \
  --max-num-seqs 32 \
  --disable-log-stats \
  --disable-uvicorn-access-log \
  --enforce-eager