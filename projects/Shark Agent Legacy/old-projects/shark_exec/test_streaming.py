#!/usr/bin/env python3
"""
Test streaming from Ollama with no output limits
"""

import requests
import json
import sys

def test_streaming(model="qwen2.5-coder:7b", prompt="Write a 1000 word essay about AI"):
    """Test streaming with no truncation"""
    
    url = "http://localhost:11434/api/generate"
    
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": True,
        "options": {
            "num_predict": 8192,  # Max tokens
            "temperature": 0.7,
            "top_p": 0.95,
            "repeat_penalty": 1.1,
            "stop": ["<|im_end|>"],
            "num_ctx": 32768  # Max context
        }
    }
    
    print(f"Testing {model} with streaming...")
    print(f"Prompt: {prompt[:100]}...")
    print("-" * 80)
    
    try:
        response = requests.post(url, json=payload, stream=True, timeout=300)
        
        if response.status_code == 200:
            full_response = ""
            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line.decode('utf-8'))
                        if 'response' in data:
                            chunk = data['response']
                            print(chunk, end='', flush=True)
                            full_response += chunk
                        if data.get('done', False):
                            print(f"\n\n✅ Total length: {len(full_response)} characters")
                            return True
                    except json.JSONDecodeError:
                        continue
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == "__main__":
    # Test both models
    print("🚀 TESTING DUAL-BRAIN SYSTEM WITH STREAMING")
    print("=" * 60)
    
    # Test Qwen
    print("\n🧠 TEST 1: QWEN 2.5 CODER 7B")
    print("-" * 40)
    qwen_success = test_streaming(
        model="qwen2.5-coder:7b",
        prompt="Write Python code to control Asus keyboard RGB lighting. The keyboard is at /sys/class/leds/asus::kbd_backlight. Write a function that can: 1) Turn off all backlight, 2) Highlight specific letters, 3) Flash through colors. Make the code practical and ready to run."
    )
    
    if qwen_success:
        print("\n✅ Qwen streaming test PASSED")
    else:
        print("\n❌ Qwen streaming test FAILED")
    
    # Test DeepSeek
    print("\n\n🧠 TEST 2: DEEPSEEK CODER 6.7B")
    print("-" * 40)
    deepseek_success = test_streaming(
        model="deepseek-coder:6.7b",
        prompt="Write Python code to control Asus keyboard RGB lighting. The keyboard is at /sys/class/leds/asus::kbd_backlight. Write a function that can: 1) Turn off all backlight, 2) Highlight specific letters, 3) Flash through colors. Make the code practical and ready to run."
    )
    
    if deepseek_success:
        print("\n✅ DeepSeek streaming test PASSED")
    else:
        print("\n❌ DeepSeek streaming test FAILED")
    
    # Final result
    print("\n" + "=" * 60)
    if qwen_success and deepseek_success:
        print("🎉 DUAL-BRAIN SYSTEM READY FOR KEYBOARD TEST!")
    else:
        print("⚠️  Some tests failed, checking Ollama status...")