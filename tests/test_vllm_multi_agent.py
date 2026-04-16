#!/usr/bin/env python3
"""
Test script for vLLM multi-agent Qwen 2.5 Coder 14B
Simulates 5 concurrent coding agents
"""

import asyncio
import aiohttp
import json
import time

async def test_agent(session, agent_id, prompt):
    """Test a single agent"""
    url = "http://localhost:8000/v1/completions"
    headers = {"Content-Type": "application/json"}
    
    data = {
        "model": "qwen2.5-coder-14b-awq",
        "prompt": prompt,
        "max_tokens": 512,
        "temperature": 0.7,
        "top_p": 0.95,
        "stream": False
    }
    
    start_time = time.time()
    try:
        async with session.post(url, headers=headers, json=data) as response:
            result = await response.json()
            elapsed = time.time() - start_time
            
            if response.status == 200:
                completion = result["choices"][0]["text"]
                tokens = result.get("usage", {}).get("total_tokens", 0)
                return {
                    "agent_id": agent_id,
                    "status": "success",
                    "time": f"{elapsed:.2f}s",
                    "tokens": tokens,
                    "first_100_chars": completion[:100] + "..."
                }
            else:
                return {
                    "agent_id": agent_id,
                    "status": f"error {response.status}",
                    "time": f"{elapsed:.2f}s",
                    "error": result.get("error", "Unknown error")
                }
    except Exception as e:
        return {
            "agent_id": agent_id,
            "status": "exception",
            "error": str(e)
        }

async def test_multi_agent():
    """Test 5 concurrent coding agents"""
    print("🚀 Testing vLLM Multi-Agent Capability")
    print("=" * 50)
    
    # Different coding prompts for different "agents"
    prompts = [
        "Write a Python function to calculate fibonacci numbers recursively.",
        "Create a React component for a todo list with TypeScript.",
        "Write a SQL query to find duplicate records in a users table.",
        "Create a Dockerfile for a Node.js application with production optimizations.",
        "Write a bash script to monitor disk usage and send alerts when over 90%."
    ]
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i, prompt in enumerate(prompts):
            task = test_agent(session, f"Agent-{i+1}", prompt)
            tasks.append(task)
        
        print(f"📡 Sending {len(tasks)} concurrent requests to vLLM...")
        results = await asyncio.gather(*tasks)
        
        print("
📊 Results:")
        print("-" * 50)
        for result in results:
            print(f"{result['agent_id']}: {result['status']} in {result.get('time', 'N/A')}")
            if result['status'] == 'success':
                print(f"   Tokens: {result['tokens']}")
                print(f"   Preview: {result['first_100_chars']}")
            print()

async def check_server_health():
    """Check if vLLM server is healthy"""
    url = "http://localhost:8000/health"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=5) as response:
                if response.status == 200:
                    print("✅ vLLM server is healthy")
                    return True
                else:
                    print(f"❌ vLLM server returned status {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Cannot connect to vLLM server: {e}")
        return False

async def get_model_info():
    """Get model information from vLLM"""
    url = "http://localhost:8000/v1/models"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=5) as response:
                if response.status == 200:
                    data = await response.json()
                    print("
📋 Model Information:")
                    print(json.dumps(data, indent=2))
                    return True
                else:
                    print(f"❌ Failed to get model info: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Error getting model info: {e}")
        return False

async def main():
    print("🔍 Checking vLLM server...")
    
    # Check health
    if not await check_server_health():
        print("Please start vLLM server first:")
        print("  sudo systemctl start vllm-qwen-multi")
        return
    
    # Get model info
    await get_model_info()
    
    # Test multi-agent capability
    await test_multi_agent()
    
    print("🎯 vLLM is ready for multi-agent vibecoding!")
    print("
To use with 5 terminals:")
    print("1. Each terminal can use curl or Python to call:")
    print("   http://localhost:8000/v1/completions")
    print("2. Or use OpenAI-compatible clients")
    print("3. Or integrate with coding tools/IDEs")

if __name__ == "__main__":
    asyncio.run(main())
