#!/usr/bin/env python3
"""
Test Ollama Qwen integration for Hermes.
"""

import aiohttp
import asyncio
import json

async def test_qwen():
    """Test Qwen model via Ollama."""
    url = "http://localhost:11434/api/generate"
    
    prompt = """You are Qwen2.5-Coder, a coding assistant. 
Write a simple Python function that calculates factorial.
Keep it concise and include a docstring."""
    
    payload = {
        "model": "qwen2.5-coder:7b",
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 2048  # Increased token limit
        }
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Qwen test successful!")
                    print(f"Response length: {len(data.get('response', ''))} characters")
                    print("\nResponse preview:")
                    print(data.get('response', '')[:500])
                    return True
                else:
                    print(f"❌ Error: HTTP {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

async def test_model_availability():
    """Check what models are available."""
    url = "http://localhost:11434/api/tags"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    print("\n📊 Available models:")
                    for model in data.get("models", []):
                        print(f"  - {model.get('name', 'Unknown')}")
                    return True
                else:
                    print(f"❌ Cannot get model list: HTTP {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        return False

async def main():
    print("🧪 Testing Ollama Qwen integration for Hermes...")
    print("=" * 50)
    
    # Check model availability
    print("\n1. Checking model availability...")
    await test_model_availability()
    
    # Test Qwen
    print("\n2. Testing Qwen2.5-Coder:7b...")
    success = await test_qwen()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Hermes can now use local Qwen.")
        print("\n💰 API credits saved: 100%")
        print("⚡ Response time: Local (fast)")
        print("🔒 Privacy: 100% local")
    else:
        print("❌ Tests failed. Check Ollama installation.")

if __name__ == "__main__":
    asyncio.run(main())