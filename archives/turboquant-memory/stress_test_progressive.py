#!/usr/bin/env python3
"""Progressive stress test: Find the concurrent context limit."""

import asyncio
import aiohttp
import time

API_URL = "http://localhost:8000/v1/chat/completions"
MODEL = "/home/leviathan/models/Qwen2.5-Coder-7B-Instruct-AWQ"
NUM_AGENTS = 10

FILLER = "The quick brown fox jumps over the lazy dog. " * 100


def build_prompt(context_tokens: int) -> str:
    chars = context_tokens * 4
    return (FILLER + "\n") * (chars // len(FILLER) + 1)


async def test_agent(
    session: aiohttp.ClientSession, agent_id: int, prompt: str
) -> dict:
    start = time.time()
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt + f"\n\nAgent {agent_id}: Reply OK."}
        ],
        "max_tokens": 10,
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
                    "tokens": data.get("usage", {}).get("completion_tokens", 0),
                }
            else:
                return {"success": False, "error": f"HTTP {resp.status}"}
    except Exception as e:
        return {"success": False, "error": str(e)[:50]}


async def run_test(context_per_agent: int) -> dict:
    prompt = build_prompt(context_per_agent)
    connector = aiohttp.TCPConnector(limit=15)
    async with aiohttp.ClientSession(connector=connector) as session:
        start = time.time()
        tasks = [test_agent(session, i, prompt) for i in range(NUM_AGENTS)]
        results = await asyncio.gather(*tasks)
        total_time = time.time() - start

    successes = [r for r in results if r.get("success")]
    return {
        "context_per": context_per_agent,
        "total_context": context_per_agent * NUM_AGENTS,
        "success": len(successes),
        "failed": NUM_AGENTS - len(successes),
        "time": total_time,
    }


async def main():
    print(f"Progressive stress test: {NUM_AGENTS} concurrent agents")
    print("=" * 60)

    for ctx in [32000, 36000, 40000, 42000, 44000, 46000]:
        print(
            f"\nTesting {ctx // 1024}K context × {NUM_AGENTS} agents ({ctx * NUM_AGENTS // 1024}K total)..."
        )
        result = await run_test(ctx)
        status = (
            "PASS"
            if result["success"] == NUM_AGENTS
            else f"FAIL ({result['success']}/{NUM_AGENTS})"
        )
        print(f"  {status} - {result['time']:.1f}s")
        if result["failed"] > 0:
            print(f"  Stopping - cannot handle {ctx // 1024}K per agent")
            break
        await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(main())
