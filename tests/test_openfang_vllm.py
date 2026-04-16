#!/usr/bin/env python3
"""
Test OpenFang connection to local vLLM server
"""

import requests
import json
import time

def test_vllm_direct():
    """Test direct connection to vLLM"""
    print("🔍 Testing direct vLLM connection...")
    
    url = "http://localhost:8000/v1/completions"
    headers = {"Content-Type": "application/json"}
    
    data = {
        "model": "qwen2.5-coder-14b-awq",
        "prompt": "Write a Python function to add two numbers:",
        "max_tokens": 100,
        "temperature": 0.7
    }
    
    try:
        start = time.time()
        response = requests.post(url, headers=headers, json=data, timeout=30)
        elapsed = time.time() - start
        
        if response.status_code == 200:
            result = response.json()
            text = result["choices"][0]["text"]
            tokens = result["usage"]["total_tokens"]
            print(f"✅ Direct vLLM test: {elapsed:.2f}s, {tokens} tokens")
            print(f"   Response: {text[:100]}...")
            return True
        else:
            print(f"❌ Direct vLLM test failed: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Direct vLLM test exception: {e}")
        return False

def test_openai_compatibility():
    """Test OpenAI-compatible endpoints"""
    print("\n🔍 Testing OpenAI compatibility...")
    
    # Test models endpoint
    try:
        models = requests.get("http://localhost:8000/v1/models", timeout=5)
        if models.status_code == 200:
            data = models.json()
            print(f"✅ Models endpoint: {len(data['data'])} model(s)")
            for model in data['data']:
                print(f"   - {model['id']}")
            return True
        else:
            print(f"❌ Models endpoint failed: {models.status_code}")
            return False
    except Exception as e:
        print(f"❌ Models endpoint exception: {e}")
        return False

def test_chat_completion():
    """Test chat completion (OpenFang uses this)"""
    print("\n🔍 Testing chat completion (OpenFang format)...")
    
    url = "http://localhost:8000/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    
    data = {
        "model": "qwen2.5-coder-14b-awq",
        "messages": [
            {"role": "system", "content": "You are a helpful coding assistant."},
            {"role": "user", "content": "Write a Python function to calculate factorial."}
        ],
        "max_tokens": 200,
        "temperature": 0.7
    }
    
    try:
        start = time.time()
        response = requests.post(url, headers=headers, json=data, timeout=30)
        elapsed = time.time() - start
        
        if response.status_code == 200:
            result = response.json()
            message = result["choices"][0]["message"]["content"]
            tokens = result["usage"]["total_tokens"]
            print(f"✅ Chat completion: {elapsed:.2f}s, {tokens} tokens")
            print(f"   Response: {message[:100]}...")
            return True
        else:
            print(f"❌ Chat completion failed: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Chat completion exception: {e}")
        return False

def test_openfang_config():
    """Verify OpenFang config is correct"""
    print("\n🔍 Checking OpenFang configuration...")
    
    config_path = "/home/leviathan/OPENCODE_WORKSPACE/.openfang/config.toml"
    try:
        with open(config_path, 'r') as f:
            content = f.read()
        
        if 'vllm-local' in content and 'http://localhost:8000/v1' in content:
            print("✅ OpenFang config contains vLLM provider")
            
            # Count vLLM agents
            vllm_agents = content.count('provider = "vllm-local"')
            print(f"   Found {vllm_agents} agent(s) using local vLLM")
            
            # Check which agents use vLLM
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'provider = "vllm-local"' in line:
                    # Find agent name
                    for j in range(i-5, i):
                        if j >= 0 and 'name = "' in lines[j]:
                            agent_name = lines[j].split('"')[1]
                            print(f"   - {agent_name} uses local vLLM")
                            break
            return True
        else:
            print("❌ OpenFang config missing vLLM settings")
            return False
    except Exception as e:
        print(f"❌ Error reading OpenFang config: {e}")
        return False

def main():
    print("=" * 60)
    print("OpenFang + vLLM Integration Test")
    print("=" * 60)
    
    all_passed = True
    
    # Test 1: Direct vLLM connection
    if not test_vllm_direct():
        all_passed = False
    
    # Test 2: OpenAI compatibility
    if not test_openai_compatibility():
        all_passed = False
    
    # Test 3: Chat completion (OpenFang uses this)
    if not test_chat_completion():
        all_passed = False
    
    # Test 4: OpenFang config
    if not test_openfang_config():
        all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("\nOpenFang is now configured to use local vLLM for:")
        print("  • coder-backend agent")
        print("  • coder-data agent")
        print("\nTo test OpenFang with vLLM:")
        print("  1. Restart OpenFang if it's running")
        print("  2. Run: openfang start")
        print("  3. Send a coding task to coder-backend or coder-data")
        print("\nYou'll see requests going to http://localhost:8000")
    else:
        print("⚠️  Some tests failed. Check vLLM server logs:")
        print("  sudo journalctl -u vllm-qwen-multi -n 50")
    
    print("=" * 60)

if __name__ == "__main__":
    main()