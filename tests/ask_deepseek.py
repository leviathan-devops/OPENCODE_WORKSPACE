#!/usr/bin/env python3
import sys
import os

# Add the brain bridge to path
sys.path.insert(0, '/tmp/brain')

PROBLEM = """Qwen Code sends max_tokens=8192 to local vLLM, but vLLM only accepts max_model_len=4096. Error: "max_tokens=8192 cannot be greater than max_model_len=max_total_tokens=4096. Please request fewer output tokens."

We have vLLM running Qwen/Qwen2.5-Coder-14B-Instruct-AWQ with max_model_len=4096.
Qwen Code is hardcoded to send max_tokens=8192 (not reading settings.json).
We need to make it work without changing models or inference engines."""

ATTEMPTS = """1. Tried setting max_tokens=3072 in ~/.qwen/settings.json - Qwen Code ignores it
2. Tried creating HTTP proxies to intercept and modify max_tokens (8192 -> 3072):
   - Flask proxy (doesn't start properly)
   - Simple HTTP server proxy (doesn't handle requests)
3. Tried patching vLLM's params.py to not raise error when max_tokens > max_model_len
   - Modified __post_init__ to log warning instead of raising VLLMValidationError
   - But vLLM still returns the error (validation might happen elsewhere)
4. Tried different ports, restarting services
5. Verified vLLM is running and accessible on port 8000
6. The model works fine with max_tokens=3072 when tested directly with curl
7. Qwen Code works with other APIs (DeepSeek, FREE Qwen, Healer-Alpha) - only local vLLM has this issue"""

question = f"""Problem: {PROBLEM}
Attempted solutions: {ATTEMPTS}

Provide exact step-by-step fix. Be specific with code changes, file paths, and commands.
Focus on making local vLLM work with Qwen Code's max_tokens=8192 requirement."""

print("Question for DeepSeek:")
print("=" * 80)
print(question)
print("=" * 80)
print("\n")

# Try to import and use the bridge
try:
    from deepseek_brain_bridge import DeepSeekBrainBridge
    bridge = DeepSeekBrainBridge()
    print("DeepSeek response:")
    print("=" * 80)
    print(bridge.think(question))
    print("=" * 80)
except Exception as e:
    print(f"Error using brain bridge: {e}")
    print("\nFalling back to manual analysis...")
    
    # Manual analysis
    print("\n" + "=" * 80)
    print("MANUAL ANALYSIS:")
    print("=" * 80)
    print("""
The core issue: Qwen Code sends max_tokens=8192, vLLM rejects it with max_model_len=4096.

Root causes:
1. Qwen Code has max_tokens=8192 hardcoded or cached
2. vLLM validates max_tokens against max_model_len and raises error
3. Our patch to params.py might not be enough - validation could be elsewhere

Solutions to try:
1. FIND WHERE VLLM VALIDATES max_tokens:
   - Search for all validation logic in vLLM
   - Patch ALL validation points, not just params.py

2. MAKE VLLM ACCEPT 8192 BUT USE 4096:
   - Patch vLLM to modify max_tokens in request before validation
   - Or patch to increase max_model_len to 8192 (but model can't actually handle it)

3. FIX THE PROXY PROPERLY:
   - Use a working proxy like mitmproxy or nginx with Lua
   - Or write a simple Python proxy that actually works

4. PATCH QWEN CODE:
   - Find where Qwen Code sets max_tokens
   - Modify it to send 3072 instead of 8192 for local vLLM

Let me try solution #1 first: Find ALL validation in vLLM.""")