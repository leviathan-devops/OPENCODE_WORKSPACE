# TurboQuant Integration - Quick Start Guide

**For Builder Agent**: Start here when implementing TurboQuant integration into Shark Agent.

---

## 🎯 Where to Start

**First File to Create**: `src/utils/vram-monitor.ts`

This is the foundational piece that all other components depend on.

---

## 📋 Implementation Order

### Step 1: VRAM Monitor (Foundation)
Create `src/utils/vram-monitor.ts`
- Monitors GPU VRAM via `nvidia-smi`
- Provides alerts and recommendations
- Tests: `npm run test:vram`

### Step 2: Local Execution Brain (Core)
Create `src/brain/local.ts`
- Connects to vLLM on localhost:8000
- OpenAI-compatible API interface
- VRAM-aware execution
- Tests: `npm run test:local`

### Step 3: TurboQuant Bridge (Integration)
Create `src/brain/turboquant-bridge.ts`
- Python/TypeScript bridge
- Calls TurboQuant Python scripts
- Manages compression lifecycle

### Step 4: Python Modules (TurboQuant)
Create `turboquant/` directory with:
- `core.py` - Lloyd-Max quantization
- `kv_cache.py` - KV cache compression
- `attention.py` - Fused attention
- `enable_vllm.py` / `disable_vllm.py` - Scripts

### Step 5: Integration Tests
Create `tests/unit/brain/local.test.ts`
- Test VRAM monitoring
- Test local brain execution
- Test TurboQuant bridge

### Step 6: Coordinator Integration
Modify `src/brain/coordinator-base.ts`
- Add local brain initialization
- Add enable/disable flags
- Add fallback logic

### Step 7: CLI Updates
Modify `src/cli.ts`
- Add `--local` flag
- Add `--turboquant` flag
- Route to local brain when enabled

---

## 🚀 Quick Commands

```bash
# After each step
npm run build

# Run tests
npm run test:local

# Check VRAM
npm run test:vram

# Run local brain (when ready)
shark --local --turboquant "your task here"
```

---

## ⚠️ Common Pitfalls

1. **vLLM not running**: Start vLLM first:
   ```bash
   vllm serve Qwen/Qwen2.5-Coder-7B-Instruct-AWQ \
     --port 8000 \
     --dtype auto \
     --gpu-memory-utilization 0.85 \
     --max-model-len 32768
   ```

2. **Python path**: Ensure Python 3.10+ is installed
   ```bash
   python3 --version
   ```

3. **CUDA available**: Check CUDA is installed
   ```bash
   nvidia-smi
   ```

4. **Triton not installed**: Install with
   ```bash
   pip install triton>=3.6.0
   ```

---

## 📊 Success Criteria for Each Step

| Step | Success Metric |
|------|---------------|
| VRAM Monitor | Returns correct VRAM stats from nvidia-smi |
| Local Brain | Connects to vLLM and executes tasks |
| TurboQuant Bridge | Calls Python scripts successfully |
| Python Modules | Core quantization produces >0.94 cosine similarity |
| Tests | All tests pass with exit code 0 |
| Coordinator | Initializes local brain with flag |
| CLI | `--local` flag routes to local brain |

---

## 🔍 Debugging

**VRAM Monitor fails**:
```bash
nvidia-smi --query-gpu=memory.total,memory.used,memory.free --format=csv,noheader,nounits
```

**Local Brain fails**:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/v1/models
```

**TurboQuant Bridge fails**:
```bash
python3 turboquant/core.py
```

---

## 📚 Reference Documents

- `PROJECT_ARCHITECTURE_IMPLEMENTATION.md` - Full implementation details
- `TURBOQUANT_CONTEXT.md` - Original TurboQuant context
- `PROJECT_ARCHITECTURE.md` - High-level architecture

---

*Start with VRAM Monitor and work through the list in order. Each step builds on the previous one.*
