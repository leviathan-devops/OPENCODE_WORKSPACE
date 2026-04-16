#!/usr/bin/env python3
"""Test performance at different GPU memory utilization levels."""

import subprocess
import time
import json
import requests
import sys


def test_utilization(utilization: float) -> dict:
    """Test performance at a specific GPU memory utilization."""
    print(f"\n{'=' * 60}")
    print(f"Testing GPU memory utilization: {utilization}")
    print(f"{'=' * 60}")

    # Update vLLM config
    with open("/home/leviathan/.config/systemd/user/vllm.service", "r") as f:
        content = f.read()

    # Update the utilization value
    import re

    new_content = re.sub(
        r"--gpu-memory-utilization\s+\d+\.\d+",
        f"--gpu-memory-utilization {utilization}",
        content,
    )

    with open("/home/leviathan/.config/systemd/user/vllm.service", "w") as f:
        f.write(new_content)

    # Reload and restart vLLM
    print("  Restarting vLLM...")
    subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
    subprocess.run(["systemctl", "--user", "restart", "vllm.service"], check=True)

    # Wait for vLLM to start
    print("  Waiting for vLLM to start...")
    time.sleep(45)

    # Check if vLLM is healthy
    try:
        resp = requests.get("http://localhost:8000/health", timeout=10)
        if resp.status_code != 200:
            print(f"  ❌ vLLM not healthy: HTTP {resp.status_code}")
            return {
                "utilization": utilization,
                "success": False,
                "error": "vLLM not healthy",
            }
    except Exception as e:
        print(f"  ❌ vLLM not reachable: {e}")
        return {"utilization": utilization, "success": False, "error": str(e)}

    # Run performance test
    print("  Running performance test...")

    # Test 1: Short prompt (low context)
    start = time.time()
    payload = {
        "model": "/home/leviathan/models/Qwen2.5-Coder-7B-Instruct-AWQ",
        "messages": [
            {
                "role": "user",
                "content": "Write a Python function that calculates factorial.",
            }
        ],
        "max_tokens": 100,
        "temperature": 0.1,
    }

    try:
        resp = requests.post(
            "http://localhost:8000/v1/chat/completions", json=payload, timeout=30
        )
        short_time = time.time() - start

        if resp.status_code == 200:
            data = resp.json()
            tokens = data["usage"]["completion_tokens"]
            short_speed = tokens / short_time
            print(
                f"  Short prompt: {short_time:.2f}s, {tokens} tokens, {short_speed:.1f} tok/s"
            )
        else:
            print(f"  ❌ Short prompt failed: HTTP {resp.status_code}")
            return {
                "utilization": utilization,
                "success": False,
                "error": f"Short prompt HTTP {resp.status_code}",
            }

    except Exception as e:
        print(f"  ❌ Short prompt error: {e}")
        return {"utilization": utilization, "success": False, "error": str(e)}

    # Test 2: Medium context (~16K tokens)
    print("  Testing medium context (16K tokens)...")
    filler = "The quick brown fox jumps over the lazy dog. " * 100
    chars_needed = 16000 * 4  # 4 chars per token approx
    repetitions = chars_needed // len(filler) + 1
    medium_context = (filler + "\n") * repetitions

    start = time.time()
    payload = {
        "model": "/home/leviathan/models/Qwen2.5-Coder-7B-Instruct-AWQ",
        "messages": [
            {
                "role": "user",
                "content": medium_context + "\n\nSummarize in one sentence.",
            }
        ],
        "max_tokens": 50,
        "temperature": 0.1,
    }

    try:
        resp = requests.post(
            "http://localhost:8000/v1/chat/completions", json=payload, timeout=120
        )
        medium_time = time.time() - start

        if resp.status_code == 200:
            data = resp.json()
            tokens = data["usage"]["completion_tokens"]
            medium_speed = tokens / medium_time
            print(
                f"  Medium context: {medium_time:.2f}s, {tokens} tokens, {medium_speed:.1f} tok/s"
            )
        else:
            print(f"  ❌ Medium context failed: HTTP {resp.status_code}")
            return {
                "utilization": utilization,
                "success": False,
                "error": f"Medium context HTTP {resp.status_code}",
            }

    except Exception as e:
        print(f"  ❌ Medium context error: {e}")
        return {"utilization": utilization, "success": False, "error": str(e)}

    return {
        "utilization": utilization,
        "success": True,
        "short_time": short_time,
        "short_speed": short_speed,
        "medium_time": medium_time,
        "medium_speed": medium_speed,
    }


def main():
    print("GPU Memory Utilization Performance Test")
    print("=" * 60)

    utilizations = [0.70, 0.65, 0.60, 0.55]
    results = []

    for util in utilizations:
        result = test_utilization(util)
        results.append(result)

        if not result["success"]:
            print(
                f"\n❌ Failed at utilization {util}: {result.get('error', 'Unknown error')}"
            )
            print("Restoring original config...")
            subprocess.run(
                [
                    "cp",
                    "/home/leviathan/.config/systemd/user/vllm.service.backup",
                    "/home/leviathan/.config/systemd/user/vllm.service",
                ],
                check=True,
            )
            subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
            subprocess.run(
                ["systemctl", "--user", "restart", "vllm.service"], check=True
            )
            break

        time.sleep(2)

    # Print summary
    print(f"\n{'=' * 60}")
    print("PERFORMANCE SUMMARY")
    print(f"{'=' * 60}")

    successful = [r for r in results if r.get("success")]

    if successful:
        print(f"\n{'Util':<8} {'Short tok/s':<12} {'Medium tok/s':<12} {'Status':<10}")
        print("-" * 50)

        for result in successful:
            util = result["utilization"]
            short = result.get("short_speed", 0)
            medium = result.get("medium_speed", 0)
            print(f"{util:<8} {short:<12.1f} {medium:<12.1f} {'✅':<10}")

    # Restore original config
    print("\nRestoring original config (0.70)...")
    subprocess.run(
        [
            "cp",
            "/home/leviathan/.config/systemd/user/vllm.service.backup",
            "/home/leviathan/.config/systemd/user/vllm.service",
        ],
        check=True,
    )
    subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
    subprocess.run(["systemctl", "--user", "restart", "vllm.service"], check=True)


if __name__ == "__main__":
    main()
