#!/usr/bin/env python3
"""Stress test: 10 concurrent agents with 96K context each."""

import asyncio
import aiohttp
import time
import json

API_URL = "http://localhost:8000/v1/chat/completions"
NUM_AGENTS = 10
CONTEXT_TOKENS = 96000

FILLER = """
The quick brown fox jumps over the lazy dog. This is filler text to pad the context window.
We need approximately 4 characters per token, so we repeat this sentence many times.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
""".strip()


def build_long_prompt(target_tokens: int) -> str:
    chars_needed = target_tokens * 4
    filler_chars = len(FILLER)
    repetitions = (chars_needed // filler_chars) + 1
    return (FILLER + "\n") * repetitions


LONG_CONTEXT = build_long_prompt(CONTEXT_TOKENS)


async def test_agent(session: aiohttp.ClientSession, agent_id: int) -> dict:
    start = time.time()
    payload = {
        "model": "/home/leviathan/models/Qwen2.5-Coder-7B-Instruct-AWQ",
        "messages": [
            {
                "role": "user",
                "content": LONG_CONTEXT
                + f"\n\nAgent {agent_id}: Summarize the above in one sentence.",
            }
        ],
        "max_tokens": 50,
        "temperature": 0.1,
    }
    try:
        async with session.post(API_URL, json=payload, timeout=300) as resp:
            if resp.status == 200:
                data = await resp.json()
                elapsed = time.time() - start
                output_tokens = data.get("usage", {}).get("completion_tokens", 0)
                return {
                    "agent_id": agent_id,
                    "success": True,
                    "elapsed": elapsed,
                    "output_tokens": output_tokens,
                }
            else:
                text = await resp.text()
                return {
                    "agent_id": agent_id,
                    "success": False,
                    "error": f"HTTP {resp.status}: {text[:200]}",
                }
    except Exception as e:
        return {"agent_id": agent_id, "success": False, "error": str(e)}


async def main():
    print(
        f"Starting stress test: {NUM_AGENTS} agents × {CONTEXT_TOKENS} context tokens each"
    )
    print(f"Total context: ~{NUM_AGENTS * CONTEXT_TOKENS:,} tokens")
    print("-" * 60)

    connector = aiohttp.TCPConnector(limit=NUM_AGENTS + 5)
    async with aiohttp.ClientSession(connector=connector) as session:
        start_all = time.time()
        tasks = [test_agent(session, i) for i in range(NUM_AGENTS)]
        results = await asyncio.gather(*tasks)
        total_time = time.time() - start_all

    successes = [r for r in results if r.get("success")]
    failures = [r for r in results if not r.get("success")]

    print(f"\nResults:")
    print(f"  Success: {len(successes)}/{NUM_AGENTS}")
    print(f"  Failed:  {len(failures)}/{NUM_AGENTS}")
    print(f"  Total time: {total_time:.1f}s")

    if successes:
        total_output = sum(r["output_tokens"] for r in successes)
        avg_time = sum(r["elapsed"] for r in successes) / len(successes)
        print(f"  Total output tokens: {total_output}")
        print(f"  Avg time per agent: {avg_time:.1f}s")
        print(f"  Aggregate throughput: {total_output / total_time:.1f} tok/s")

    if failures:
        print(f"\nFailures:")
        for f in failures[:3]:
            print(f"  Agent {f['agent_id']}: {f['error'][:100]}")


if __name__ == "__main__":
    asyncio.run(main())
