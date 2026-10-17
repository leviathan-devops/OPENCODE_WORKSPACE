#!/usr/bin/env python3
"""
Ask DeepSeek R1 how to fix Google login automation detection
"""
import requests
import json

API_KEY = "<REDACTED_SET_VIA_ENV>"
API_URL = "https://api.deepseek.com/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

question = """I'm trying to create a brain bridge that allows AI agents to use DeepSeek web chat interface. 

The problem: When using Selenium to automate Chrome for Google OAuth login to DeepSeek, Google shows this error:
"Couldn’t sign you in. This browser or app may not be secure. Learn more. Try using a different browser."

Also shows: "chrome is being controlled by automated test software"

I've tested and found:
1. CloudFront blocks headless browsers (403 error)
2. Visible browser with minimal flags gets to CAPTCHA (auto-completes after ~16s)
3. After CAPTCHA, redirects to Google login
4. Google detects automation and blocks login

What I need:
1. How to bypass Google's automation detection for OAuth login
2. How to make Selenium Chrome look like a real user browser
3. How to save authentication cookies after manual login
4. How to use those cookies in automation

Please provide specific, actionable solutions with code examples."""

data = {
    "model": "deepseek-chat",
    "messages": [
        {"role": "system", "content": "You are an expert in web automation, browser fingerprinting, and bypassing anti-bot detection. Provide practical, working solutions."},
        {"role": "user", "content": question}
    ],
    "stream": False
}

print("🧠 Asking DeepSeek R1 for solution...")
print("=" * 50)

try:
    response = requests.post(API_URL, headers=headers, json=data, timeout=30)
    response.raise_for_status()
    
    result = response.json()
    answer = result['choices'][0]['message']['content']
    
    print(answer)
    
    # Save the answer
    with open('/tmp/r1_solution.txt', 'w') as f:
        f.write(answer)
    
    print("\n" + "=" * 50)
    print("✅ Solution saved to: /tmp/r1_solution.txt")
    
except Exception as e:
    print(f"❌ API Error: {e}")
    if 'response' in locals():
        print(f"Response: {response.text}")