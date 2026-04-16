#!/usr/bin/env python3
import requests
import json
import time

def test_vllm_api():
    url = "http://localhost:8000/v1/completions"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "qwen2.5-coder-14b-awq",
        "prompt": "Write a Python function to calculate fibonacci numbers:",
        "max_tokens": 100,
        "temperature": 0.1
    }
    
    print("Testing vLLM API...")
    print(f"URL: {url}")
    print(f"Request: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\nSuccess! Response:")
            print(json.dumps(result, indent=2))
            
            if 'choices' in result and len(result['choices']) > 0:
                text = result['choices'][0]['text']
                print(f"\nGenerated text ({len(text)} chars):")
                print(text[:500] + "..." if len(text) > 500 else text)
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

if __name__ == "__main__":
    # Wait a bit more for model to fully initialize
    print("Waiting for model to be ready...")
    time.sleep(10)
    
    success = test_vllm_api()
    if success:
        print("\n✅ vLLM API is working correctly!")
    else:
        print("\n❌ vLLM API test failed")