#!/usr/bin/env python3
"""
Test Ollama with Qwen2.5-Coder for multi-agent capability
"""
import requests
import json
import time

def test_ollama_api():
    url = "http://localhost:11434/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "qwen2.5-coder:14b",
        "messages": [
            {"role": "system", "content": "You are an expert Python programmer."},
            {"role": "user", "content": "Write a function to calculate factorial in Python."}
        ],
        "max_tokens": 200,
        "temperature": 0.1
    }
    
    print("Testing Ollama Qwen2.5-Coder API...")
    print(f"Endpoint: {url}")
    
    try:
        start = time.time()
        response = requests.post(url, headers=headers, json=data, timeout=30)
        elapsed = time.time() - start
        
        print(f"Response time: {elapsed:.2f}s")
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                message = result['choices'][0]['message']['content']
                print(f"\n✅ SUCCESS! Model responded with {len(message)} characters")
                print(f"First 200 chars: {message[:200]}...")
                return True
            else:
                print(f"Unexpected response: {result}")
                return False
        else:
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Ollama Multi-Agent Qwen Code Test")
    print("=" * 60)
    
    # Give Ollama a moment
    time.sleep(2)
    
    success = test_ollama_api()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 TEST PASSED! Ollama is ready for multi-agent Qwen Code.")
        print("\nConfiguration for Hermes/OpenFang:")
        print("  Base URL: http://localhost:11434/v1")
        print("  Model: qwen2.5-coder:14b")
        print("  API Key: (not required)")
        print("\nNo more API rate limits! No more Alibaba pricing bullshit!")
    else:
        print("❌ Test failed. Check Ollama logs.")
    
    print("=" * 60)