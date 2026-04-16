#!/usr/bin/env python3
"""
Test TGI servers.
"""

import requests
import json
import time

def test_server(port, model_name):
    url = f"http://localhost:{port}/generate"
    
    payload = {
        "inputs": f"Write a Python function to calculate factorial. You are {model_name}.",
        "parameters": {
            "max_new_tokens": 200,
            "temperature": 0.7,
            "top_p": 0.95
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {model_name} (port {port}): Working")
            print(f"   Response: {result['generated_text'][:100]}...")
            return True
        else:
            print(f"❌ {model_name} (port {port}): HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {model_name} (port {port}): {e}")
        return False

def main():
    print("Testing TGI servers...")
    print("=" * 50)
    
    servers = [
        (8080, "Qwen2.5-Coder-7B"),
        (8081, "DeepSeek-Coder-6.7B")
    ]
    
    all_working = True
    for port, name in servers:
        if test_server(port, name):
            print()
        else:
            all_working = False
            print()
    
    if all_working:
        print("✅ All TGI servers working!")
        print("\nUpdate Hermes config to use TGI:")
        print("""
model:
  default: qwen2.5-coder-7b
  provider: openai
  base_url: http://localhost:8080
  api_key: "tgi-local"

fallback_model:
  provider: openai
  model: deepseek-coder-6.7b
  base_url: http://localhost:8081
  api_key: "tgi-local"
""")
    else:
        print("❌ Some servers failed.")

if __name__ == "__main__":
    main()
