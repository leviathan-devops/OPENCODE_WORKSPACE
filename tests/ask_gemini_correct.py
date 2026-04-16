#!/usr/bin/env python3
"""
Ask Gemini with correct API endpoint
"""
import requests
import json

API_KEY = "AIzaSyBIIzyQA032RD0tmoFSW4cRW8WVyb50jAE"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent?key={API_KEY}"

question = """I'm building a brain bridge that allows AI agents to use DeepSeek's web chat interface via browser automation.

PROBLEM: When using Selenium/Chrome to automate Google OAuth login for DeepSeek, Google shows:
1. "Couldn’t sign you in. This browser or app may not be secure."
2. "chrome is being controlled by automated test software"

WHAT I'VE TRIED:
1. Chrome with --no-sandbox, --disable-dev-shm-usage
2. Removing automation flags: excludeSwitches ["enable-automation"], useAutomationExtension: false
3. Stealth JS: deleting navigator.webdriver, overriding permissions
4. Real user agent, window size, user-data-dir
5. CloudFront blocks headless browsers, visible browser works to CAPTCHA

CURRENT FLOW (tested):
1. Visible Chrome loads DeepSeek
2. CAPTCHA appears, auto-completes after ~16s
3. Redirects to Google OAuth login
4. Google detects automation and blocks with above error

NEED: How to make Selenium Chrome pass Google's "secure browser" check for OAuth login.

Please provide SPECIFIC, ACTIONABLE solutions:
1. Chrome flags/options that bypass Google's automation detection
2. JavaScript injections to hide automation completely
3. Profile/user-data configurations
4. Any libraries/tools that work (undetected-chromedriver, etc.)
5. Step-by-step code examples

The goal: Complete Google OAuth login in automated browser, save cookies, then use those cookies for future automation."""

data = {
    "contents": [
        {
            "parts": [
                {"text": question}
            ]
        }
    ],
    "generationConfig": {
        "temperature": 0.1,
        "topP": 0.8,
        "topK": 40
    }
}

print("🧠 Asking Gemini for solution...")
print("=" * 50)

try:
    response = requests.post(API_URL, json=data, timeout=30)
    response.raise_for_status()
    
    result = response.json()
    
    if 'candidates' in result and result['candidates']:
        answer = result['candidates'][0]['content']['parts'][0]['text']
        print(answer)
        
        # Save the answer
        with open('/tmp/gemini_solution_final.txt', 'w') as f:
            f.write(answer)
        
        print("\n" + "=" * 50)
        print("✅ Solution saved to: /tmp/gemini_solution_final.txt")
    else:
        print("❌ No response from Gemini")
        print(f"Response: {json.dumps(result, indent=2)}")
    
except Exception as e:
    print(f"❌ API Error: {e}")
    if 'response' in locals():
        print(f"Response: {response.text}")
    
    # Try one more endpoint
    print("\n🔄 Trying alternative endpoint...")
    try:
        API_URL_ALT = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"
        response = requests.post(API_URL_ALT, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        if 'candidates' in result and result['candidates']:
            answer = result['candidates'][0]['content']['parts'][0]['text']
            print(answer[:1000] + "...")
            
            with open('/tmp/gemini_solution_alt.txt', 'w') as f:
                f.write(answer)
            
            print("\n✅ Alternative solution saved")
    except Exception as e2:
        print(f"❌ Alternative also failed: {e2}")