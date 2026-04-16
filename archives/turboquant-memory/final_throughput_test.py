#!/usr/bin/env python3
"""Final throughput test: 10 concurrent agents at 32K context."""

import asyncio
import aiohttp
import time

API_URL = "http://localhost:8000/v1/chat/completions"
MODEL = "/home/leviathan/models/Qwen2.5-Coder-7B-Instruct-AWQ"
NUM_AGENTS = 10
CONTEXT_PER = 32000

FILLER = "The quick brown fox jumps over the lazy dog. " * 100


def build_prompt(context_tokens: int) -> str:
    chars = context_tokens * 4
    return (FILLER + "\n") * (chars // len(FILLER) + 1)


async def test_agent(
    session: aiohttp.ClientSession, prompt: str, agent_id: int
) -> dict:
    start = time.time()
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt + f"\n\nAgent {agent_id}: Write a brief summary.",
            }
        ],
        "max_tokens": 100,
        "temperature": 0.1,
    }
    try:
        async with session.post(API_URL, json=payload, timeout=180) as resp:
            elapsed = time.time() - start
            if resp.status == 200:
                data = await resp.json()
                return {
                    "success": True,
                    "elapsed": elapsed,
                    "output_tokens": data.get("usage", {}).get("completion_tokens", 0),
                    "input_tokens": data.get("usage", {}).get("prompt_tokens", 0),
                }
            else:
                return {"success": False, "error": f"HTTP {resp.status}"}
    except Exception as e:
        return {"success": False, "error": str(e)[:50]}


async def main():
    print(
        f"Final throughput test: {NUM_AGENTS} agents × {CONTEXT_PER // 1024}K context"
    )
    print("=" * 60)

    prompt = build_prompt(CONTEXT_PER)

    connector = aiohttp.TCPConnector(limit=NUM_AGENTS + 5)
    async with aiohttp.ClientSession(connector=connector) as session:
        start = time.time()
        tasks = [test_agent(session, prompt, i) for i in range(NUM_AGENTS)]
        results = await asyncio.gather(*tasks)
        total_time = time.time() - start

    successes = [r for r in results if r.get("success")]
    failures = [r for r in results if not r.get("success")]

    if successes:
        total_input = sum(r["input_tokens"] for r in successes)
        total_output = sum(r["output_tokens"] for r in successes)
        avg_time = sum(r["elapsed"] for r in successes) / len(successes)

        print(f"\nResults:")
        print(f"  Success:        {len(successes)}/{NUM_AGENTS}")
        print(f"  Total time:     {total_time:.1f}s")
        print(f"  Input tokens:   {total_input:,}")
        print(f"  Output tokens:  {total_output:,}")
        print(f"  Prefill speed:  {total_input / total_time:.0f} tok/s")
        print(f"  Decode speed:   {total_output / total_time:.0f} tok/s")
        print(f"  Avg per agent:  {avg_time:.1f}s")

    if failures:
        print(f"\nFailures: {len(failures)}")
        for f in failures[:3]:
            print(f"  Agent {f.get('agent_id', '?')}: {f.get('error', 'unknown')}")


if __name__ == "__main__":
    asyncio.run(main())
