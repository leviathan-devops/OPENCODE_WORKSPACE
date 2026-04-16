#!/usr/bin/env python3
"""Careful stress test with VRAM monitoring."""

import asyncio
import aiohttp
import time
import subprocess

API_URL = "http://localhost:8000/v1/chat/completions"
MODEL = "/home/leviathan/models/Qwen2.5-Coder-7B-Instruct-AWQ"

FILLER = "The quick brown fox jumps over the lazy dog. " * 100


def get_vram():
    result = subprocess.run(
        ["nvidia-smi", "--query-gpu=memory.used,memory.free", "--format=csv,noheader"],
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def build_prompt(context_tokens: int) -> str:
    chars = context_tokens * 4
    return (FILLER + "\n") * (chars // len(FILLER) + 1)


async def test_request(
    session: aiohttp.ClientSession, prompt: str, req_id: int
) -> dict:
    start = time.time()
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt + f"\n\nRequest {req_id}: Reply OK."}
        ],
        "max_tokens": 10,
        "temperature": 0.1,
    }
    try:
        async with session.post(API_URL, json=payload, timeout=180) as resp:
            elapsed = time.time() - start
            if resp.status == 200:
                data = await resp.json()
                return {"success": True, "elapsed": elapsed}
            else:
                text = await resp.text()
                return {"success": False, "error": f"HTTP {resp.status}: {text[:100]}"}
    except Exception as e:
        return {"success": False, "error": str(e)[:50]}


async def run_test(num_agents: int, context_per: int) -> dict:
    prompt = build_prompt(context_per)
    total_context = num_agents * context_per

    print(f"\n  VRAM before: {get_vram()}")

    connector = aiohttp.TCPConnector(limit=num_agents + 5)
    async with aiohttp.ClientSession(connector=connector) as session:
        start = time.time()
        tasks = [test_request(session, prompt, i) for i in range(num_agents)]
        results = await asyncio.gather(*tasks)
        total_time = time.time() - start

    successes = [r for r in results if r.get("success")]
    failures = [r for r in results if not r.get("success")]

    print(f"  VRAM after:  {get_vram()}")

    return {
        "agents": num_agents,
        "context_per": context_per,
        "total_context": total_context,
        "success": len(successes),
        "failed": len(failures),
        "time": total_time,
        "errors": [f["error"] for f in failures[:2]] if failures else [],
    }


async def main():
    print("Careful stress test with VRAM monitoring")
    print("=" * 60)

    tests = [
        (1, 32000),
        (5, 32000),
        (10, 32000),
        (10, 24000),
        (10, 16000),
    ]

    for num_agents, context_per in tests:
        total = num_agents * context_per
        print(
            f"\nTest: {num_agents} agent(s) × {context_per // 1024}K = {total // 1024}K total"
        )
        result = await run_test(num_agents, context_per)

        if result["success"] == num_agents:
            print(f"  PASS - {result['time']:.1f}s")
        else:
            print(f"  FAIL - {result['success']}/{num_agents} succeeded")
            if result["errors"]:
                print(f"  Errors: {result['errors']}")
            print(f"  Stopping tests")
            break

        await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(main())
