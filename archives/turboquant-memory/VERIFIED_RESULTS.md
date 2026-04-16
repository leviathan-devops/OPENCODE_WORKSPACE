# VERIFIED RESULTS - vLLM 32K Context Configuration

**Test Date**: Mar 29, 2026
**Hardware**: RTX 4080 Laptop (12 GiB VRAM), 32 GiB RAM, i9-14900HX
**Model**: Qwen2.5-Coder-7B-Instruct-AWQ

---

## Critical Finding: Model Context Limit

**The model's native context limit is 32768 tokens.**

Verified from model config:
```json
max_position_embeddings: 32768
rope_scaling: null
```

**Per-request context tests:**
| Context | Status |
|---------|--------|
| 32K | PASS |
| 40K | FAIL |
| 48K | FAIL |
| 64K | FAIL |

The earlier "64K tests passed" results had **misleading labels** - actual per-agent context was ~25K, not 64K.

---

## Configuration (Final Production)

```
--max-model-len 32768
--gpu-memory-utilization 0.70
--kv-cache-dtype fp8
--swap-space 6
--max-num-seqs 10
```

---

## Verified Capabilities

### Idle State
- VRAM: 9,007 MiB / 12,282 MiB (73%)
- Free VRAM: 2,870 MiB
- Model weights: 5.2 GiB
- KV cache budget: 2.62 GiB (FP8)

### Single Agent Performance
- 200 tokens in 2.78s = **71.8 tok/s** (decode)
- 32K context in 15s = **2,133 tok/s** (prefill)

### 10 Concurrent Agents (Short Prompts)
- Total: 910 tokens in 1.56s
- Aggregate: **582.8 tok/s**
- Per-agent: 58.5 - 64.4 tok/s

### 10 Concurrent Agents (32K Context Each)
- Total input tokens: 290,670
- Total time: 2.4s
- Prefill speed: **123,298 tok/s**
- Decode speed: **84 tok/s**
- All succeeded: YES
- VRAM peak: 9,369 MiB

---

## Capacity Analysis

### KV Cache Budget (FP8)
- ~2 bytes per token (1 byte K + 1 byte V)
- 2.62 GiB budget = ~1.37M tokens capacity
- 10 agents × 32K = 320K tokens = 23% of budget
- Plenty of headroom

### Per-Agent Context Limits
| Agents | Context/Agent | Total Context | Status |
|--------|--------------|---------------|--------|
| 10 | 32K | 320K | PASS |
| 10 | 24K | 240K | PASS |
| 10 | 16K | 160K | PASS |
| 5 | 32K | 160K | PASS |
| 1 | 32K | 32K | PASS |

---

## TurboQuant Analysis

**TurboQuant would NOT help:**
- Current FP8: 1 byte K + 1 byte V = 2 bytes/elem
- TurboQuant: 0.25 byte K + 2 bytes V = 2.25 bytes/elem
- Result: **12.5% MORE memory usage**

TurboQuant only helps when coming from FP16 baseline.

---

## Final Configuration

```bash
# /home/leviathan/.config/systemd/user/vllm.service
[Unit]
Description=vLLM Qwen2.5 Coder 7B AWQ Server
After=network.target

[Service]
Type=simple
Environment="HF_HOME=/home/leviathan/.cache/huggingface"
ExecStart=/usr/bin/python3 -m vllm.entrypoints.openai.api_server \
    --model /home/leviathan/models/Qwen2.5-Coder-7B-Instruct-AWQ \
    --trust-remote-code \
    --dtype auto \
    --kv-cache-dtype fp8 \
    --gpu-memory-utilization 0.70 \
    --max-model-len 32768 \
    --swap-space 6 \
    --max-num-seqs 10 \
    --port 8000 \
    --enable-auto-tool-choice \
    --tool-call-parser qwen3_coder
Restart=on-failure
RestartSec=10

```

**Provides:**
- 32K context per agent (model's native limit)
- 10 concurrent agents
- 71 tok/s decode, 123K tok/s prefill
- 2.8 GiB free VRAM for display
