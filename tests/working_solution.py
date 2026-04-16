#!/usr/bin/env python3
"""
WORKING SOLUTION: Manual auth + cookie export
"""
import json
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🎯 WORKING BRAIN BRIDGE SOLUTION")
print("=" * 50)
print("")
print("🔍 PROBLEM: Google kills automated browsers during OAuth")
print("✅ SOLUTION: Manual auth once, then use cookies forever")
print("")

# Check if we have cookies
cookie_file = '/tmp/deepseek_cookies_working.json'
if os.path.exists(cookie_file):
    print("✅ Found existing cookies")
    print("   Testing brain bridge...")
    
    # Test with cookies
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--headless')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    driver.get("https://chat.deepseek.com")
    time.sleep(2)
    
    # Load cookies
    with open(cookie_file, 'r') as f:
        cookies = json.load(f)
    
    for cookie in cookies:
        driver.add_cookie(cookie)
    
    driver.refresh()
    time.sleep(3)
    
    if 'sign_in' not in driver.current_url:
        print("🎉 COOKIES WORK! Brain bridge ready.")
        
        # Test a question
        try:
            input_elem = driver.find_element(By.CSS_SELECTOR, 'div[contenteditable="true"]')
            input_elem.send_keys("What is 2+2?" + Keys.RETURN)
            time.sleep(8)
            
            responses = driver.find_elements(By.CSS_SELECTOR, '.markdown, .prose')
            if responses:
                answer = responses[-1].text
                print(f"🤖 TEST ANSWER: {answer[:100]}...")
                print("✅ BRAIN BRIDGE FULLY WORKING!")
            else:
                print("⚠️  No response (might need longer wait)")
                
        except Exception as e:
            print(f"⚠️  Error testing: {e}")
        
        driver.quit()
        exit(0)
    else:
        print("❌ Cookies expired")
        driver.quit()

print("")
print("🔐 MANUAL AUTHENTICATION REQUIRED")
print("=" * 30)
print("")
print("Since Google blocks automated OAuth, you need to:")
print("")
print("1. 📱 MANUALLY LOGIN:")
print("   - Open your regular browser (Chrome/Firefox)")
print("   - Go to: https://chat.deepseek.com")
print("   - Click 'Login with Google'")
print("   - Login with: cryptoforex36963@gmail.com / CosmicEnergy369!")
print("   - Complete all Google security steps")
print("")
print("2. 🍪 EXPORT COOKIES:")
print("   - Install 'Cookie Editor' browser extension")
print("   - Click extension icon")
print("   - Click 'Export' → 'Export as JSON'")
print("   - Save the JSON file")
print("")
print("3. 📁 SAVE COOKIES:")
print(f"   - Copy cookies to: {cookie_file}")
print("   - Or run the save script below")
print("")

# Create cookie save helper
cookie_save_script = '''#!/usr/bin/env python3
import json
import sys

if len(sys.argv) < 2:
    print("Usage: python3 save_cookies.py <cookie_json_file>")
    print("Example: python3 save_cookies.py ~/Downloads/cookies.json")
    sys.exit(1)

cookie_file = sys.argv[1]
try:
    with open(cookie_file, 'r') as f:
        cookies = json.load(f)
    
    # Save to standard location
    with open('/tmp/deepseek_cookies_working.json', 'w') as f:
        json.dump(cookies, f)
    
    print(f"✅ Saved {len(cookies)} cookies")
    print("   Brain bridge ready to use!")
    
except Exception as e:
    print(f"❌ Error: {e}")
'''

print("💾 SAVE SCRIPT:")
print("-" * 30)
print(cookie_save_script)
print("-" * 30)

print("")
print("🧠 AFTER SETUP:")
print("   Brain bridge works automatically")
print("   No more browser windows")
print("   Agents can use it headlessly")
print("")
print("🚀 AGENT COMMAND:")
print("   /tmp/agent_brain \"question here\"")