#!/usr/bin/env python3
"""
Full authentication - waits for complete DeepSeek login
"""
import time
import json
import os
import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

print("🧠 COMPLETE DEEPSEEK AUTHENTICATION")
print("=" * 50)

# Check if already authenticated
cookie_file = '/tmp/deepseek_cookies/full_session.json'
if os.path.exists(cookie_file):
    print("✅ Already authenticated!")
    sys.exit(0)

print("🔐 Opening browser for FULL authentication...")
print("   This will:")
print("   1. Open Chrome browser")
print("   2. Go to DeepSeek")
print("   3. Wait for Google OAuth login")
print("   4. Wait for you to complete login")
print("   5. Wait until you're on chat page")
print("   6. Save complete session")
print("")
print("   Login with: cryptoforex36963@gmail.com / CosmicEnergy369!")
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
    
    print(f"📄 Initial URL: {driver.current_url}")
    print("")
    print("✅ Browser opened!")
    print("   Please complete the login process:")
    print("   1. Click Google login button")
    print("   2. Enter credentials")
    print("   3. Grant permissions if asked")
    print("   4. Wait to be redirected to chat page")
    print("")
    
    # Wait for complete login (longer timeout)
    print("⏳ Waiting for complete login...")
    print("   This may take a few minutes")
    print("   Please complete all steps in browser")
    
    last_url = ""
    for i in range(60):  # 5 minutes max
        time.sleep(5)
        current_url = driver.current_url
        
        if current_url != last_url:
            print(f"   URL changed: {current_url[:100]}...")
            last_url = current_url
        
        # Check if we're on the actual chat page (not OAuth flow)
        if 'chat.deepseek.com' in current_url and 'sign_in' not in current_url and 'oauth' not in current_url:
            print(f"✅ ON CHAT PAGE! ({current_url[:100]}...)")
            
            # Wait a bit more to ensure page is loaded
            time.sleep(5)
            
            # Check for chat interface
            page_source = driver.page_source.lower()
            if 'chat' in page_source or 'conversation' in page_source:
                print("✅ Chat interface detected!")
                
                # Save ALL cookies
                cookies = driver.get_cookies()
                os.makedirs('/tmp/deepseek_cookies', exist_ok=True)
                with open(cookie_file, 'w') as f:
                    json.dump(cookies, f)
                
                print(f"💾 Saved {len(cookies)} cookies")
                print("🎉 FULL AUTHENTICATION SUCCESSFUL!")
                
                # Also save screenshot for debugging
                driver.save_screenshot('/tmp/deepseek_chat_page.png')
                print("📸 Screenshot saved: /tmp/deepseek_chat_page.png")
                
                driver.quit()
                sys.exit(0)
        
        print(f"   Still in login flow... ({i*5}s elapsed)")
    
    print("❌ Login timeout after 5 minutes")
    print("   Please try again or check browser")
    driver.quit()
    sys.exit(1)
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)