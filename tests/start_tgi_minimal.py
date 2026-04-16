#!/usr/bin/env python3
"""
MINIMAL TGI-STYLE SERVER WITH ZERO LIMITS
"""
from vllm import AsyncLLMEngine, SamplingParams
from vllm.entrypoints.openai.api_server import run_server
import asyncio
import sys

# MAXIMUM LIMITS - NO TRUNCATION
MAX_MODEL_LEN = 32768
MAX_TOKENS = 32768
MAX_BATCH = 32768

if __name__ == "__main__":
    # Run vLLM OpenAI server with MAX limits
    run_server(
        host="0.0.0.0",
        port=11434,
        model="Qwen/Qwen2.5-Coder-7B-Instruct-GGUF",
        max_model_len=MAX_MODEL_LEN,
        gpu_memory_utilization=0.95,
        enforce_eager=True,
        disable_log_requests=True,
        disable_log_stats=True,
        served_model_name="qwen2.5-coder-7b",
        max_num_batched_tokens=MAX_BATCH,
        max_num_seqs=512
    )
