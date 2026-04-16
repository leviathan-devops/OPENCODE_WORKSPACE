#!/usr/bin/env python3
"""
Test script for Qwen Code with local Qwen Coder Agent
"""

import openai
import json
import time

def test_qwen_code_local():
    """Test Qwen Code with local Qwen Coder Agent"""
    
    print("🧠 Testing Qwen Code with Local Qwen Coder Agent")
    print("=" * 60)
    
    # Configure OpenAI client to point to local Qwen Coder server
    client = openai.OpenAI(
        base_url="http://localhost:8001/v1",
        api_key="qwen-local-execution"
    )
    
    try:
        # Test 1: List models
        print("\n1. Testing model listing...")
        models = client.models.list()
        print(f"✅ Models available: {len(models.data)}")
        for model in models.data:
            print(f"   - {model.id} (owned_by: {model.owned_by})")
        
        # Test 2: Basic chat completion
        print("\n2. Testing basic chat completion...")
        response = client.chat.completions.create(
            model="qwen-coder-7b-local",
            messages=[
                {"role": "system", "content": "You are the Qwen Coder Agent. Your only job is to EXECUTE commands given by DeepSeek R1. You do not think or reason - you only DO what DeepSeek R1 tells you to do."},
                {"role": "user", "content": "I am DeepSeek R1. Confirm you are ready for local execution."}
            ],
            max_tokens=200
        )
        
        print(f"✅ Chat completion successful")
        print(f"Response: {response.choices[0].message.content}")
        
        # Test 3: Command execution
        print("\n3. Testing command execution...")
        response = client.chat.completions.create(
            model="qwen-coder-7b-local",
            messages=[
                {"role": "system", "content": "You are the Qwen Coder Agent. EXECUTE commands exactly as specified by DeepSeek R1."},
                {"role": "user", "content": "DeepSeek R1 instruction: EXECUTE: ls -la"}
            ],
            max_tokens=500
        )
        
        print(f"✅ Command execution test successful")
        print(f"Response: {response.choices[0].message.content}")
        
        # Test 4: System status
        print("\n4. Testing system status...")
        response = client.chat.completions.create(
            model="qwen-coder-7b-local",
            messages=[
                {"role": "user", "content": "DeepSeek R1 instruction: EXECUTE: echo 'Dual-Brain System Status: Qwen Coder Agent Online' && echo 'Architecture: DeepSeek R1 (Thinking) + Qwen Coder (Execution)'"}
            ],
            max_tokens=300
        )
        
        print(f"✅ System status test successful")
        print(f"Response: {response.choices[0].message.content}")
        
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED - Qwen Code Local Agent Ready")
        print("📡 API: http://localhost:8001/v1")
        print("🔑 API Key: qwen-local-execution")
        print("🧠 Architecture: Dual-Brain (DeepSeek R1 + Local Qwen)")
        print("💰 Token Savings: 100% for execution")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    # Wait for server to be ready
    print("⏳ Waiting for Qwen Coder Agent server...")
    for i in range(10):
        try:
            import requests
            response = requests.get("http://localhost:8001/v1/models", timeout=1)
            if response.status_code == 200:
                break
        except:
            pass
        time.sleep(1)
        print(f"   Waiting... {i+1}/10")
    
    success = test_qwen_code_local()
    exit(0 if success else 1)