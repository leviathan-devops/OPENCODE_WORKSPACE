#!/usr/bin/env python3
"""
Test Selenium-based authentication that actually opens browser
"""

import os
import sys
import time

print("🧪 Testing Selenium-based browser auth...")
print("=" * 50)

# First, try to install selenium if not available
try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    print("✅ Selenium already installed")
except ImportError:
    print("❌ Selenium not installed. Installing...")
    os.system("pip3 install selenium webdriver-manager --user 2>/dev/null || pip install selenium webdriver-manager --user 2>/dev/null")
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.keys import Keys
        print("✅ Selenium installed successfully")
    except:
        print("❌ Failed to install Selenium")
        sys.exit(1)

print("\n🔧 Setting up Chrome with --no-sandbox...")
print("   This should actually open a visible browser window")

try:
    # Import ChromeDriverManager
    from selenium.webdriver.chrome.service import Service
    from webdriver_manager.chrome import ChromeDriverManager
    
    # Setup Chrome options
    from selenium.webdriver.chrome.options import Options
    
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')  # Required for Linux
    chrome_options.add_argument('--disable-dev-shm-usage')  # For Docker/VM
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Show browser window (not headless)
    # chrome_options.add_argument('--headless')  # COMMENTED OUT to see browser
    
    print("✅ Chrome options configured")
    print("   --no-sandbox: Enabled")
    print("   --disable-dev-shm-usage: Enabled")
    print("   Headless mode: Disabled (you should see browser)")
    
    # Setup service
    service = Service(ChromeDriverManager().install())
    
    print("\n🚀 Launching Chrome browser...")
    print("   This should open a visible Chrome window")
    print("   If you don't see it, check your desktop environment")
    
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print(f"✅ Browser launched successfully!")
    print(f"   Browser session ID: {driver.session_id}")
    
    # Navigate to DeepSeek
    print("\n🌐 Navigating to DeepSeek...")
    driver.get("https://chat.deepseek.com")
    
    print(f"   Current URL: {driver.current_url}")
    print(f"   Page title: {driver.title}")
    
    # Take screenshot
    driver.save_screenshot('/home/leviathan/OPENCODE_WORKSPACE/deepseek_screenshot.png')
    print("   📸 Screenshot saved to: /home/leviathan/OPENCODE_WORKSPACE/deepseek_screenshot.png")
    
    # Check page content
    page_source = driver.page_source[:2000]
    
    # Look for login indicators
    if 'sign in' in page_source.lower() or 'log in' in page_source.lower():
        print("\n🔐 LOGIN PAGE DETECTED")
        print("   You need to login manually in the browser window")
        print("   Credentials: cryptoforex36963@gmail.com / CosmicEnergy369!")
        print("")
        print("   The browser window should be visible now.")
        print("   Please login, then come back here.")
        print("")
        
        # Wait for manual login
        print("⏳ Waiting for manual login...")
        print("   After login, this script will continue automatically")
        print("   (Checking every 5 seconds for 2 minutes)")
        
        for i in range(24):  # 2 minutes
            time.sleep(5)
            current_url = driver.current_url
            
            # Check if we're on chat page (logged in)
            if 'chat.deepseek.com' in current_url and 'sign_in' not in current_url:
                print(f"✅ LOGIN SUCCESSFUL! ({current_url})")
                
                # Save cookies
                import json
                cookies = driver.get_cookies()
                os.makedirs('/home/leviathan/OPENCODE_WORKSPACE/deepseek_cookies', exist_ok=True)
                with open('/home/leviathan/OPENCODE_WORKSPACE/deepseek_cookies/session.json', 'w') as f:
                    json.dump(cookies, f)
                
                print(f"💾 Saved {len(cookies)} cookies to /home/leviathan/OPENCODE_WORKSPACE/deepseek_cookies/session.json")
                break
            
            print(f"   Still waiting... ({i*5}s elapsed)")
        else:
            print("❌ Login timeout after 2 minutes")
    
    elif 'chat' in page_source.lower():
        print("\n✅ ALREADY ON CHAT PAGE")
        print("   You might already be logged in!")
        
        # Save cookies anyway
        import json
        cookies = driver.get_cookies()
        os.makedirs('/home/leviathan/OPENCODE_WORKSPACE/deepseek_cookies', exist_ok=True)
        with open('/home/leviathan/OPENCODE_WORKSPACE/deepseek_cookies/session.json', 'w') as f:
            json.dump(cookies, f)
        
        print(f"💾 Saved {len(cookies)} cookies")
    
    else:
        print("\n⚠️  UNKNOWN PAGE STATE")
        print(f"   Page source snippet: {page_source[:500]}...")
    
    # Keep browser open for inspection
    print("\n⚠️  Browser will remain open for 30 seconds...")
    print("   Check the window to see DeepSeek page.")
    print("   Close browser manually or wait for auto-close.")
    
    time.sleep(30)
    
    print("\n✅ Test complete. Closing browser...")
    driver.quit()
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    
    print("\n💡 TROUBLESHOOTING:")
    print("   1. Make sure Chrome is installed: google-chrome --version")
    print("   2. Check DISPLAY variable for GUI: echo $DISPLAY")
    print("   3. Try running with xvfb for headless: xvfb-run python3 this_script.py")
    print("   4. Or use different approach (see below)")

print("\n" + "=" * 50)
print("🎯 REALITY CHECK:")
print("   - Selenium CAN open browser")
print("   - Manual login REQUIRED (anti-bot)")
print("   - After login, cookies work automatically")
print("")
print("🚀 NEXT: Create working brain bridge with Selenium")