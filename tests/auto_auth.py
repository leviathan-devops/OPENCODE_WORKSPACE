#!/usr/bin/env python3
"""
Auto-authentication - opens browser immediately
"""
import time
import json
import os
import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

print("🧠 AUTO-AUTHENTICATING TO DEEPSEEK...")
print("=" * 50)

# Check if already authenticated
cookie_file = '/tmp/deepseek_cookies/session.json'
if os.path.exists(cookie_file):
    print("✅ Already authenticated!")
    with open(cookie_file, 'r') as f:
        cookies = json.load(f)
    print(f"   Found {len(cookies)} saved cookies")
    sys.exit(0)

print("🔐 Opening browser for authentication...")
print("   Browser will open in 3 seconds...")
print("   Please login with:")
print("   Email: cryptoforex36963@gmail.com")
print("   Password: CosmicEnergy369!")
print("")
time.sleep(3)

try:
    # Setup Chrome with visible window
    from selenium.webdriver.chrome.options import Options
    
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Browser WILL be visible
    # chrome_options.add_argument('--headless')  # Commented out - you need to see it
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print("🚀 Opening DeepSeek...")
    driver.get("https://chat.deepseek.com")
    time.sleep(3)
    
    print(f"📄 Page title: {driver.title}")
    print(f"📄 Current URL: {driver.current_url}")
    print("")
    print("✅ Browser opened!")
    print("   Please login in the browser window")
    print("   Check your desktop for Chrome")
    print("")
    
    # Wait for login
    print("⏳ Waiting for login (checking every 5 seconds)...")
    
    for i in range(24):  # 2 minutes max
        time.sleep(5)
        current_url = driver.current_url
        
        # Check if we're logged in
        if 'chat.deepseek.com' in current_url and 'sign_in' not in current_url:
            print(f"✅ LOGIN DETECTED! ({current_url})")
            
            # Save cookies
            cookies = driver.get_cookies()
            os.makedirs('/tmp/deepseek_cookies', exist_ok=True)
            with open(cookie_file, 'w') as f:
                json.dump(cookies, f)
            
            print(f"💾 Saved {len(cookies)} cookies")
            print("🎉 AUTHENTICATION SUCCESSFUL!")
            driver.quit()
            sys.exit(0)
        
        print(f"   Still waiting... ({i*5}s elapsed)")
    
    print("❌ Login timeout after 2 minutes")
    print("   Please try again")
    driver.quit()
    sys.exit(1)
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)