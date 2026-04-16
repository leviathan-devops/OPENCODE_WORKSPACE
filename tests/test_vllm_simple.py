#!/usr/bin/env python3
"""
Simple test for vLLM Qwen 2.5 Coder 14B
"""

import requests
import json
import time

def test_single_request():
    """Test a single coding request"""
    url = "http://localhost:8000/v1/completions"
    headers = {"Content-Type": "application/json"}
    
    data = {
        "model": "qwen2.5-coder-14b-awq",
        "prompt": "Write a Python function to reverse a string:",
        "max_tokens": 100,
        "temperature": 0.7,
        "top_p": 0.95,
        "stream": False
    }
    
    print("🚀 Testing vLLM with single request...")
    start_time = time.time()
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            completion = result["choices"][0]["text"]
            tokens = result.get("usage", {}).get("total_tokens", 0)
            
            print(f"✅ Success in {elapsed:.2f}s")
            print(f"📊 Tokens: {tokens}")
            print(f"📝 Response:\n{completion}")
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_concurrent_requests():
    """Test 5 concurrent requests (simulating 5 terminals)"""
    import threading
    import queue
    
    results = queue.Queue()
    
    def worker(worker_id, prompt):
        url = "http://localhost:8000/v1/completions"
        headers = {"Content-Type": "application/json"}
        
        data = {
            "model": "qwen2.5-coder-14b-awq",
            "prompt": prompt,
            "max_tokens": 50,
            "temperature": 0.7,
            "stream": False
        }
        
        try:
            start = time.time()
            response = requests.post(url, headers=headers, json=data, timeout=30)
            elapsed = time.time() - start
            
            if response.status_code == 200:
                result = response.json()
                tokens = result.get("usage", {}).get("total_tokens", 0)
                results.put((worker_id, "success", elapsed, tokens))
            else:
                results.put((worker_id, f"error {response.status_code}", elapsed, 0))
                
        except Exception as e:
            results.put((worker_id, f"exception: {str(e)[:50]}", 0, 0))
    
    # Different coding prompts for different "terminals"
    prompts = [
        "Write Python code to read a CSV file:",
        "Create a JavaScript function to validate email:",
        "Write SQL query to find users created today:",
        "Create a Dockerfile for Python app:",
        "Write bash script to backup directory:"
    ]
    
    print("\n🚀 Testing 5 concurrent requests (simulating 5 terminals)...")
    
    threads = []
    for i in range(5):
        t = threading.Thread(target=worker, args=(f"Terminal-{i+1}", prompts[i]))
        threads.append(t)
        t.start()
    
    # Wait for all threads
    for t in threads:
        t.join()
    
    # Collect results
    print("\n📊 Results:")
    print("-" * 50)
    while not results.empty():
        worker_id, status, elapsed, tokens = results.get()
        if status == "success":
            print(f"{worker_id}: ✅ {elapsed:.2f}s, {tokens} tokens")
        else:
            print(f"{worker_id}: ❌ {status}")

def check_server():
    """Check server health and model info"""
    print("🔍 Checking vLLM server...")
    
    # Check health
    try:
        health = requests.get("http://localhost:8000/health", timeout=5)
        if health.status_code == 200:
            print("✅ Server is healthy")
        else:
            print(f"❌ Server health check failed: {health.status_code}")
            return False
    except:
        print("❌ Cannot connect to server")
        return False
    
    # Get model info
    try:
        models = requests.get("http://localhost:8000/v1/models", timeout=5)
        if models.status_code == 200:
            data = models.json()
            print(f"✅ Model: {data['data'][0]['id']}")
            return True
        else:
            print(f"❌ Failed to get model info: {models.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting model info: {e}")
        return False

def main():
    print("=" * 60)
    print("vLLM Qwen 2.5 Coder 14B - Multi-Agent Test")
    print("=" * 60)
    
    # Check server
    if not check_server():
        print("\nPlease start vLLM server first:")
        print("  sudo systemctl start vllm-qwen-multi")
        print("  sudo journalctl -u vllm-qwen-multi -f")
        return
    
    print("\n" + "=" * 60)
    
    # Test single request
    if test_single_request():
        print("\n" + "=" * 60)
        
        # Test concurrent requests
        test_concurrent_requests()
        
        print("\n" + "=" * 60)
        print("🎉 vLLM is ready for multi-agent vibecoding!")
        print("\nYou can now open 5 terminals and use:")
        print("  curl -X POST http://localhost:8000/v1/completions \\")
        print("    -H 'Content-Type: application/json' \\")
        print("    -d '{\"model\":\"qwen2.5-coder-14b-awq\",\"prompt\":\"Your code here\",\"max_tokens\":512}'")
        print("\nOr use OpenAI-compatible clients in each terminal!")
    else:
        print("\n❌ Initial test failed. Check server logs:")
        print("  sudo journalctl -u vllm-qwen-multi -n 50")

if __name__ == "__main__":
    main()