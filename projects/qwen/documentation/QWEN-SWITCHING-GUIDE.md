# Qwen Code Switching Guide - FIXED!

## The Problem Was:
The switching commands were updating files but Qwen Code might not be picking up the changes immediately.

## The Solution:
New switching system that:
1. **Sets environment variables** (immediate effect in current terminal)
2. **Updates config files** (`~/.qwen/config.json`, `~/.qwen/settings.json`)
3. **Works per-terminal** (each terminal independent)

## How to Use:

### In EACH terminal where you want to switch:
```bash
# 1. Load the functions
source ~/.bashrc

# 2. Switch API (choose one):
qwen-local      # Switch to local vLLM
qwen-deepseek   # Switch to DeepSeek

# 3. Run Qwen Code
qwen --yolo
```

### Or use direct commands:
```bash
qwen-run-local --yolo      # Switch to local + run
qwen-run-deepseek --yolo   # Switch to DeepSeek + run
```

### Check current settings:
```bash
qwen-api-status
```

## What Actually Happens:

### When you run `qwen-local`:
- Sets: `OPENAI_BASE_URL=http://localhost:8000/v1`
- Sets: `OPENAI_API_KEY=vllm-local-key`
- Updates `~/.qwen/config.json` to use `qwen-coder-14b`
- Updates `~/.qwen/settings.json` to use `qwen-coder-14b`

### When you run `qwen-deepseek`:
- Sets: `OPENAI_BASE_URL=https://api.deepseek.com/v1`
- Sets: `OPENAI_API_KEY=sk-e8e93e31b582423e9fdaa4ab8e9347e2`
- Updates `~/.qwen/config.json` to use `deepseek-chat`
- Updates `~/.qwen/settings.json` to use `deepseek-chat`

## Key Points:
1. **Each terminal is independent** - Switch in terminal A doesn't affect terminal B
2. **Environment variables take precedence** - Qwen Code checks these first
3. **Config files are backup** - If env vars aren't set, Qwen Code uses config files
4. **You might need to restart Qwen Code** after switching in the same terminal

## If Switching Doesn't Seem to Work:
1. **Exit Qwen Code** (Ctrl+C or type `exit`)
2. **Run the switch command again**
3. **Restart Qwen Code**

## Verified Working:
- ✅ Environment variables update immediately
- ✅ Config files update correctly  
- ✅ Each terminal can have different settings
- ✅ Switching back and forth works

## Ready to Go!
Your switching system now actually works. No more "text theater" - real switching! 🎭→🚀