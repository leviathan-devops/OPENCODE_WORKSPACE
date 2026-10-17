# Qwen Code + Local vLLM Workaround

## Problem:
Qwen Code sends `tool_choice: "auto"` but vLLM with Qwen2.5-Coder-14B doesn't properly handle it, even with `--enable-auto-tool-choice` and `--tool-call-parser`.

## Root Cause:
1. Qwen2.5-Coder-14B generates tool calls in XML format (`<tools>...</tools>`)
2. vLLM parsers (`qwen3_coder`, `qwen3_xml`) don't parse these into `tool_calls` array
3. Qwen Code expects `tool_calls` array to be populated

## Workaround Options:

### Option 1: Use different model
Use a model with better tool call support (e.g., Qwen2.5-Coder-7B, which might have different tool call behavior)

### Option 2: Patch Qwen Code
Modify Qwen Code to handle XML-formatted tool calls from vLLM

### Option 3: Use vLLM without tool calls
Configure Qwen Code to not use tool calls with local vLLM

### Option 4: Use different backend
Use Ollama or another backend that handles Qwen tool calls better

## Current Status:
- ✅ vLLM server running with Qwen2.5-Coder-14B
- ✅ Basic completions working
- ✅ Model responding with XML tool calls
- ❌ vLLM not parsing XML into `tool_calls` array
- ❌ Qwen Code expecting `tool_calls` array

## Quick Test:
```bash
# Test basic completion (works):
curl -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" \
     -H "Content-Type: application/json" \
     -d '{"model": "qwen-coder-14b", "messages": [{"role": "user", "content": "Hello"}], "max_tokens": 50}' \
     http://localhost:8000/v1/chat/completions

# Test with tools (generates XML but not parsed):
curl -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" \
     -H "Content-Type: application/json" \
     -d '{"model": "qwen-coder-14b", "messages": [{"role": "user", "content": "List files"}], "tools": [...], "tool_choice": "auto", "max_tokens": 100}' \
     http://localhost:8000/v1/chat/completions
```

## Recommendation:
Try using **Qwen2.5-Coder-7B-Instruct-AWQ** instead. 7B models often have better tool call support and might work with vLLM's parsers.

Or, if you just need basic coding assistance without tool calls, configure Qwen Code to use a simpler mode with local vLLM.