# TURBOQUANT MEMORY ENHANCEMENT - BUILD LOG

**Started**: Mar 28 2026, 23:33 +04
**Last Updated**: Mar 29 2026, 00:20 +04
**Status**: PHASE 2 COMPLETE (production config live)

---

## FINAL RESULT

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| VRAM (idle) | 10,799 MiB | 8,965 MiB | **-1,834 MiB (-17%)** |
| VRAM (32K context) | OOM | 9,323 MiB | **Now works** |
| Max Context | 32,768 tokens | 49,152 tokens | **+50%** |
| KV Cache Budget | 4.36 GiB (wasted) | 2.62 GiB (right-sized) | **-40%** |
| Free VRAM (idle) | 1,483 MiB | 2,912 MiB | **+97%** |
| Inference Speed | ~74 tok/s | ~71 tok/s | **-4% (negligible)** |

### What Actually Fixed It

The TurboQuant and Dynamic VRAM Python modules are **standalone code** — they are NOT integrated into vLLM. The real VRAM reduction came from **vLLM configuration changes only**:

1. `--kv-cache-dtype fp8` — FP8 KV cache (50% KV memory reduction during inference)
2. `--gpu-memory-utilization 0.70` — Don't pre-allocate 85% of VRAM (was wasting 4.36 GiB on empty KV cache)
3. `--max-model-len 49152` — 48K context window (up from 32K)
4. `--swap-space 8` — 8 GiB CPU RAM overflow for KV cache
5. `--max-num-seqs 5` — Reduced concurrent sequences (was 10)
6. `VLLM_ALLOW_LONG_MAX_MODEL_LEN=1` — Override model's 32K config limit

### What Didn't Work

- **TurboQuant standalone modules**: Built and tested, but NOT integrated into vLLM. Would require patching vLLM internals (C++ kernel level). The Python modules work independently (cosine sim 0.9402) but can't hook into vLLM's V1 engine without forking vLLM.
- **Dynamic VRAM standalone modules**: Same situation. vLLM has its own memory management that can't be overridden from Python wrappers.
- **vLLM's `--cpu-offload-gb`**: Available but not tested yet — could further reduce idle VRAM by offloading model weights to CPU RAM when idle.

---

## PRODUCTION CONFIG (LIVE)

**File**: `/home/leviathan/.config/systemd/user/vllm.service`

```ini
[Unit]
Description=vLLM Qwen2.5 Coder 7B AWQ Server
After=network.target

[Service]
Type=simple
Environment="HF_HOME=/home/leviathan/.cache/huggingface"
Environment="VLLM_ALLOW_LONG_MAX_MODEL_LEN=1"
ExecStart=/usr/bin/python3 -m vllm.entrypoints.openai.api_server \
    --model /home/leviathan/models/Qwen2.5-Coder-7B-Instruct-AWQ \
    --trust-remote-code \
    --dtype auto \
    --kv-cache-dtype fp8 \
    --gpu-memory-utilization 0.70 \
    --max-model-len 49152 \
    --swap-space 8 \
    --max-num-seqs 5 \
    --port 8000 \
    --enable-auto-tool-choice \
    --tool-call-parser qwen3_coder
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

### VRAM Breakdown (Live)

```
Model weights (AWQ 4-bit):    5.2 GiB  (fixed)
KV cache pre-allocation:      2.6 GiB  (FP8, supports ~48K tokens)
CUDA overhead:                 ~1.0 GiB
─────────────────────────────────────────
Total idle:                    8.8 GiB / 12 GiB (73%)
Free for display/etc:          3.0 GiB (was 1.5 GiB)
```

---

## PHASE HISTORY

### Phase 1: FP8 KV Cache ✅ COMPLETE (Mar 28, 23:33)
- Added `--kv-cache-dtype fp8` to vLLM service
- Minor idle improvement (10.7→10.5 GB) since KV cache is empty at idle
- Real savings during inference: 50% KV memory reduction

### Phase 2: vLLM Config Optimization ✅ COMPLETE (Mar 29, 00:08)
**This was the actual fix.** The problem wasn't that we needed custom compression — it was that vLLM was hoarding VRAM.

**Root Cause**: `--gpu-memory-utilization 0.85` told vLLM to grab 85% of 12 GiB = 10.2 GiB. After loading the 5.2 GiB model, it pre-allocated 4.36 GiB of KV cache that sat empty at idle.

**Fix**: Lowered to 0.70 → only grabs 8.4 GiB total. With swap-space 8 GiB on CPU RAM, KV cache overflows to system RAM when needed (64GB available).

**Changes Made**:
1. `--gpu-memory-utilization 0.85 → 0.70` (less VRAM hoarding)
2. `--max-model-len 32768 → 49152` (48K context)
3. `--swap-space 8` (CPU RAM overflow)
4. `--max-num-seqs 10 → 5` (fewer concurrent sequences)
5. `VLLM_ALLOW_LONG_MAX_MODEL_LEN=1` (override 32K config limit)

**Verification**:
- Idle VRAM: 8,965 MiB (was 10,799 MiB)
- 32K token inference: 9,323 MiB (works, 3 GiB headroom)
- Inference quality: Clean code generation at 71 tok/s
- Context recall: Correct across 15+ turns

### Phase 3: TurboQuant + Dynamic VRAM Modules ⚠️ BUILT BUT NOT INTEGRATED
- TurboQuant Python modules: 2,645 lines, core algorithm verified (cosine sim 0.9402)
- Dynamic VRAM Python modules: 2,620 lines, all components created
- **NOT integrated into vLLM** — would require forking vLLM's V1 engine
- Standalone code at `/home/leviathan/OPENCODE WORKSPACE/TurboQuant Memory Enhancement/`

---

## FUTURE IMPROVEMENTS

### Easy Wins (Not Yet Done)
1. **`--cpu-offload-gb 2`**: Offload 2 GiB of model weights to CPU RAM. Would bring idle VRAM to ~7 GiB. Tradeoff: slightly slower first-token latency.
2. **`--gpu-memory-utilization 0.60`**: Even less VRAM hoarding. 6.6 GiB total budget.
3. **Patch model config.json**: Set `max_position_embeddings: 131072` properly instead of using env var override.

### Hard Wins (Requires vLLM Fork)
1. **TurboQuant integration**: Patch vLLM's cache allocator to use 2-bit quantization. Would enable 128K+ context on 12 GiB.
2. **Dynamic VRAM**: Implement ComfyUI-style VBAR for on-demand weight loading. Would enable 13B+ models.
3. **Custom Triton kernels**: Replace vLLM's attention kernels with TurboQuant fused kernels.

---

## COMMANDS REFERENCE

```bash
# Service management
systemctl --user status vllm.service
systemctl --user restart vllm.service
journalctl --user -u vllm.service -f

# GPU monitoring
nvidia-smi --query-gpu=memory.used,memory.total,memory.free --format=csv,noheader,nounits
watch -n 1 nvidia-smi

# Test inference
curl -s http://localhost:8000/v1/models | jq .

# Test with prompt
curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"/home/leviathan/models/Qwen2.5-Coder-7B-Instruct-AWQ","messages":[{"role":"user","content":"Hello"}],"max_tokens":50}' | jq .
```

---

## FILES

### Modified
- `/home/leviathan/.config/systemd/user/vllm.service` — Production vLLM config

### Created (Standalone, Not Integrated)
- `/home/leviathan/OPENCODE WORKSPACE/TurboQuant Memory Enhancement/turboquant/` — 8 Python files
- `/home/leviathan/OPENCODE WORKSPACE/TurboQuant Memory Enhancement/dynamic_vram/` — 7 Python files
- `/home/leviathan/OPENCODE WORKSPACE/TurboQuant Memory Enhancement/test_vram_reduction.py` — VRAM calculator

### Reference Docs (Pre-existing)
- `BUILDER_QUICKSTART.md`
- `PROJECT_ARCHITECTURE.md`
- `PROJECT_ARCHITECTURE_IMPLEMENTATION.md`
- `TURBOQUANT_CONTEXT.md`
