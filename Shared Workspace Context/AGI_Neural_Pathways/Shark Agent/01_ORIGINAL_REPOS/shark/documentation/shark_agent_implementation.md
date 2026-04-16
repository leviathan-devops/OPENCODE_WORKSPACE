# SHARK AGENT IMPLEMENTATION PLAN

## CURRENT SITUATION
- No Ollama running (as requested)
- No TGI installed
- Have Qwen2.5-Coder-14B-Instruct-AWQ cached
- No DeepSeek models cached
- 12GB VRAM constraint

## IMPLEMENTATION STRATEGY

### 1. INSTALL vLLM (TGI ALTERNATIVE)
vLLM provides similar functionality to TGI:
- High-throughput inference
- Continuous batching
- Tensor parallelism
- OpenAI-compatible API

### 2. MODEL STRATEGY
Given 12GB VRAM:
- **Qwen2.5-Coder-14B-Instruct-AWQ** (already quantized, ~7-8GB)
- **DeepSeek-Coder-6.7B-Instruct** (quantized to 4-bit, ~4GB)
- Can run both simultaneously if quantized properly

### 3. ARCHITECTURE
```
┌─────────────────┐
│ User Input      │
└────────┬────────┘
         │
┌────────▼────────┐
│ Router          │───► If "plan/design" ──► Qwen 14B
│ (Python)        │───► If "debug/optimize" ──► DeepSeek 6.7B
└────────┬────────┘
         │
┌────────▼────────┐
│ vLLM Servers    │───► Port 8000: Qwen
│                 │───► Port 8001: DeepSeek
└────────┬────────┘
         │
┌────────▼────────┐
│ Execution Layer │───► Shell commands, file edits
└─────────────────┘
```

### 4. ASYNC-SAFE DISCORD BOT
- Use `aiohttp` for HTTP calls to vLLM servers
- Run blocking operations in `asyncio.to_thread()`
- No `urllib.request` anywhere

### 5. DEPLOYMENT SCRIPT
Will create a single bash script that:
1. Installs vLLM and dependencies
2. Downloads models (if not cached)
3. Starts vLLM servers
4. Creates SHARK agent Python script
5. Sets up systemd service

## CODE STRUCTURE

### shark_agent.py
```python
import asyncio
import aiohttp
import subprocess
import shlex
import os
from typing import Optional
import discord
from discord.ext import commands
```

### Key Components:
1. **vLLMClient** - Async client for vLLM OpenAI-compatible API
2. **Router** - Determines which model to use based on input
3. **SafeExecutor** - Runs shell commands safely
4. **TerminalInterface** - Interactive terminal loop
5. **DiscordBot** - Async-safe Discord bot
6. **ModelManager** - Manages vLLM server processes

## VRAM MANAGEMENT
- Start with Qwen 14B AWQ (~8GB)
- Start DeepSeek 6.7B 4-bit (~4GB)
- Total: ~12GB (fits within constraint)
- If VRAM issues, implement model swapping

## CRITICAL CONSTRAINTS ADDRESSED
1. **NO urllib.request** - Using aiohttp exclusively
2. **Async-safe** - All blocking ops in threads
3. **VRAM aware** - Quantized models, monitoring
4. **Simple routing** - Keyword-based, not overengineered
5. **Copy-paste deploy** - Single bash script

## NEXT STEPS
1. Write the deployment script
2. Test vLLM installation
3. Test model loading
4. Implement the agent
5. Set up systemd service