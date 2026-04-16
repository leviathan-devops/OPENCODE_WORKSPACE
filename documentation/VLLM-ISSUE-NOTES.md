# vLLM Memory Issue on 12GB GPU

## Problem Summary

**vLLM v0.17.1** has a critical memory management bug that prevents it from running on 12GB GPUs, regardless of `--gpu-memory-utilization` settings.

## Error Details

```
torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 130.00 MiB. 
GPU 0 has a total capacity of 11.60 GiB of which 21.81 MiB is free. 
Including non-PyTorch memory, this process has 11.56 GiB memory in use. 
Of the allocated memory 11.33 GiB is allocated by PyTorch
```

## Root Cause

vLLM v0.17.1 ignores `--gpu-memory-utilization` parameter and allocates ~11.33GB regardless of settings:

| Setting Tried | Actual Allocation | Result |
|--------------|-------------------|--------|
| `--gpu-memory-utilization 0.90` | 11.33 GB | OOM |
| `--gpu-memory-utilization 0.85` | 11.33 GB | OOM |
| `--gpu-memory-utilization 0.75` | 11.33 GB | OOM |
| `--gpu-memory-utilization 0.60` | 11.33 GB | OOM |

## Tested Configurations (All Failed)

```bash
# Qwen2.5-Coder-14B-Instruct-AWQ (quantized)
--gpu-memory-utilization 0.85 --max-model-len 16384
# Result: OOM at 11.33GB allocated

# Qwen2.5-Coder-7B-Instruct (smaller model)
--gpu-memory-utilization 0.60 --max-model-len 8192 --kv-cache-dtype fp8
# Result: OOM at 11.33GB allocated

# With PYTORCH_ALLOC_CONF=expandable_segments:True
# Result: Still OOM
```

## Comparison: Ollama Works Perfectly

| Framework | VRAM Usage | GPU Offload | Status |
|-----------|------------|-------------|--------|
| **Ollama 0.17.4** | 9.5 GB | 100% GPU | ✅ Working |
| **vLLM 0.17.1** | 11.33 GB | N/A (crashes) | ❌ Broken |

## Recommended Solutions

### Option 1: Use Ollama (Current Solution)
Ollama handles memory correctly on 12GB GPUs:
```bash
ollama serve
ollama run qwen2.5-coder:14b
```

### Option 2: Wait for vLLM Fix
Monitor vLLM releases for memory management fix. Try:
- vLLM v0.18.x or later
- Check GitHub issues for "gpu-memory-utilization ignored"

### Option 3: Use Older vLLM Version
Try vLLM v0.16.x which may not have this bug:
```bash
pip install vllm==0.16.0
```

### Option 4: Upgrade GPU
For vLLM multi-agent features, consider:
- RTX 4090 (24GB) - ~$1600
- RTX 6000 Ada (48GB) - ~$6800
- Dual GPU setup

## Current Working Setup

```bash
# Ollama (working)
export OPENAI_API_KEY="ollama"
export OPENAI_BASE_URL="http://localhost:11434/v1"
export OPENAI_MODEL="qwen2.5-coder:14b"

# VRAM Usage: 9.5GB / 12GB (79%)
# GPU Offload: 100%
# Context: 4096 tokens
```

## Files Modified

- `~/.bashrc` - Environment variables for Ollama
- `~/.config/systemd/user/voice-dictation.service` - Disabled (frees 2GB VRAM)
- Ollama snap - Enabled and running

## Future: Phase 2 Models

When vLLM is fixed or GPU is upgraded, download these for smart cycling:

```bash
# Qwen2.5 32B (18GB Q4) - needs 18GB+ VRAM for full GPU
ollama pull qwen2.5:32b

# Qwen2.5 72B (40GB Q4) - needs 40GB+ VRAM for full GPU
ollama pull qwen2.5:72b

# DeepSeek-Coder 33B (18GB Q4) - coding specialized
ollama pull deepseek-coder:33b
```

---

**Document Created:** March 18, 2026
**Status:** Ollama working, vLLM blocked by memory bug
