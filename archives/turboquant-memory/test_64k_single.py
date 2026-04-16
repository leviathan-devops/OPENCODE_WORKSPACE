#!/usr/bin/env python3
"""Test single agent with 64K context."""

import requests
import time

API_URL = "http://localhost:8000/v1/chat/completions"
MODEL = "/home/leviathan/models/Qwen2.5-Coder-7B-Instruct-AWQ"
CONTEXT_TOKENS = 40000

FILLER = "The quick brown fox jumps over the lazy dog. " * 100


def build_prompt(context_tokens: int) -> str:
    chars = context_tokens * 4
    return (FILLER + "\n") * (chars // len(FILLER) + 1)


prompt = build_prompt(CONTEXT_TOKENS)
print(f"Testing 1 agent × {CONTEXT_TOKENS // 1024}K context ({CONTEXT_TOKENS} tokens)")

payload = {
    "model": MODEL,
    "messages": [
        {"role": "user", "content": prompt + "\n\nSummarize in one sentence."}
    ],
    "max_tokens": 50,
    "temperature": 0.1,
}

try:
    start = time.time()
    resp = requests.post(API_URL, json=payload, timeout=120)
    elapsed = time.time() - start

    if resp.status_code == 200:
        data = resp.json()
        print(f"PASS - {elapsed:.1f}s")
        print(f"  Input tokens: {data['usage']['prompt_tokens']}")
        print(f"  Output tokens: {data['usage']['completion_tokens']}")
    else:
        print(f"FAIL - HTTP {resp.status_code}")
        print(f"  {resp.text[:300]}")
except Exception as e:
    print(f"FAIL - {e}")
