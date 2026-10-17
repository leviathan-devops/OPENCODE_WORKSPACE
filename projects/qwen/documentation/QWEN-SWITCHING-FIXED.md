# Qwen API Switching - Fixed!

## Problem:
`qwen-local` was only changing environment variables, not updating Qwen Code's settings.json file.

## Solution:
Created `qwen-switch-proper.sh` that:
1. Updates environment variables (OPENAI_BASE_URL, OPENAI_API_KEY)
2. Updates Qwen Code's settings.json model name
3. Works per-terminal (each terminal can have different settings)

## How It Works:

### Switching to Local vLLM:
```bash
qwen-local
```
- Sets: `OPENAI_BASE_URL=http://localhost:8000/v1`
- Sets: `OPENAI_API_KEY=vllm-local-key`
- Updates settings.json: `"model": {"name": "qwen-coder-14b"}`

### Switching to DeepSeek:
```bash
qwen-deepseek
```
- Sets: `OPENAI_BASE_URL=https://api.deepseek.com/v1`
- Sets: `OPENAI_API_KEY=<REDACTED_SET_VIA_ENV>`
- Updates settings.json: `"model": {"name": "deepseek-chat"}`

### Checking Status:
```bash
qwen-api-status
```
Shows current API endpoint and Qwen Code model name.

## Verification:
- ✅ vLLM server: `qwen-coder-14b` (correct model name)
- ✅ Settings.json updates correctly
- ✅ Environment variables set
- ✅ Each terminal independent

## To Use:
1. **In terminal where you want local vLLM:**
   ```bash
   source ~/.bashrc
   qwen-local
   qwen --yolo
   ```

2. **In terminal where you want DeepSeek:**
   ```bash
   source ~/.bashrc
   qwen-deepseek
   qwen --yolo
   ```

3. **Both can run simultaneously!** No conflicts.

## Files Created:
- `~/.qwen-switch-proper.sh` - Main switching script
- Updated `~/.bash_aliases` - Functions for `qwen-local`, `qwen-deepseek`, `qwen-api-status`
- Updated vLLM service - Serving model as `qwen-coder-14b`

## Ready for Vibe Coding! 🚀
Your switching system now properly updates both environment AND Qwen Code settings. No more "model does not exist" errors!