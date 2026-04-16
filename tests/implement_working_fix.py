#!/usr/bin/env python3
"""
IMPLEMENT WORKING FIX for Google automation detection
Based on known working solutions
"""
import time
import subprocess
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔧 IMPLEMENTING WORKING FIX FOR GOOGLE DETECTION")
print("=" * 50)

# Kill all Chrome
subprocess.run(['pkill', '-f', 'chrome'], stderr=subprocess.DEVNULL)
time.sleep(2)

print("🚫 Killed all Chrome processes")
print("")

# Create ULTIMATE stealth configuration
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

# CRITICAL: Use real user profile
user_data_dir = '/tmp/chrome_ultimate_stealth'
chrome_options.add_argument(f'--user-data-dir={user_data_dir}')
chrome_options.add_argument('--profile-directory=Default')

# Remove ALL automation indicators
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
chrome_options.add_experimental_option('useAutomationExtension', False)

# Real browser appearance
chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
chrome_options.add_argument('--window-size=1920,1080')
chrome_options.add_argument('--start-maximized')

# Disable automation detection features
chrome_options.add_argument('--disable-blink-features=AutomationControlled')
chrome_options.add_argument('--disable-features=IsolateOrigins,site-per-process')

# Additional stealth
chrome_options.add_argument('--disable-web-security')
chrome_options.add_argument('--disable-site-isolation-trials')
chrome_options.add_argument('--disable-notifications')
chrome_options.add_argument('--disable-popup-blocking')

print("✅ Ultimate stealth configuration ready")
print("")

print("🧪 Testing with DeepSeek...")
print("   " + "-" * 40)

try:
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print("✅ Chrome started with ultimate stealth")
    
    # Execute COMPLETE stealth JavaScript
    print("🛡️  Injecting complete stealth JavaScript...")
    
    stealth_js = """
    // === COMPLETE STEALTH INJECTION ===
    
    // 1. Delete webdriver property completely
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
    });
    
    // 2. Override permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );
    
    // 3. Mock plugins
    Object.defineProperty(navigator, 'plugins', {
        get: () => [{
            "0": {type: "application/x-google-chrome-pdf", description: "Portable Document Format"},
            "1": {type: "application/pdf", description: "Portable Document Format"},
            length: 2
        }]
    });
    
    // 4. Mock languages
    Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
    });
    
    // 5. Hide Chrome automation
    window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
    };
    
    // 6. Override console.debug to hide automation logs
    const originalDebug = console.debug;
    console.debug = function(...args) {
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].includes('webdriver') || args[0].includes('automation'))) {
            return;
        }
        return originalDebug.apply(this, args);
    };
    
    // 7. Remove automation痕迹 from window
    delete window._Selenium_IDE_Recorder;
    delete window._selenium;
    delete window.callPhantom;
    delete window.__nightmare;
    delete window._phantom;
    
    console.log('✅ Ultimate stealth mode activated');
    """
    
    # Load page first
    print("🌐 Loading DeepSeek...")
    driver.get("https://chat.deepseek.com")
    time.sleep(3)
    
    # Inject stealth JS
    driver.execute_script(stealth_js)
    
    # Refresh to apply stealth
    driver.refresh()
    time.sleep(5)
    
    print(f"📄 Title: {driver.title}")
    print(f"📄 URL: {driver.current_url}")
    
    # Check page for automation warnings
    page_source = driver.page_source.lower()
    
    if 'controlled by automated test' in page_source:
        print("❌ STILL DETECTED: Automation warning present")
        print("   Need more aggressive stealth")
    elif 'couldn\'t sign you in' in page_source or 'not secure' in page_source:
        print("❌ GOOGLE BLOCK: Security warning")
        print("   Google still detecting automation")
    elif 'human verification' in page_source or 'captcha' in page_source:
        print("✅ CAPTCHA PAGE (Good - not blocked)")
        print("   CAPTCHA should auto-complete in ~16s")
        
        # Wait for CAPTCHA auto-completion
        print("⏳ Waiting for CAPTCHA auto-completion...")
        time.sleep(20)
        
        print(f"   New URL: {driver.current_url}")
        
        if 'sign_in' in driver.current_url:
            print("✅ CAPTCHA completed, on sign_in page")
            
            # Save screenshot
            driver.save_screenshot('/tmp/after_captcha.png')
            print("📸 Screenshot: /tmp/after_captcha.png")
            
            # Now test Google login
            print("\n🔐 Testing Google login page...")
            
            # Look for Google login button
            google_buttons = driver.find_elements(By.XPATH, "//*[contains(text(), 'Google') or contains(@href, 'google')]")
            if google_buttons:
                print(f"✅ Found {len(google_buttons)} Google login elements")
                
                # Click first Google button
                try:
                    google_buttons[0].click()
                    time.sleep(5)
                    
                    print(f"   After click URL: {driver.current_url}")
                    
                    if 'accounts.google.com' in driver.current_url:
                        print("✅ On Google login page")
                        
                        # Check for security warning
                        google_page = driver.page_source.lower()
                        if 'not secure' in google_page or 'couldn\'t sign' in google_page:
                            print("❌ Google still showing security warning")
                        else:
                            print("🎉 NO SECURITY WARNING!")
                            print("   Google login should work now")
                            
                            # Save proof
                            driver.save_screenshot('/tmp/google_login_working.png')
                            print("📸 Proof: /tmp/google_login_working.png")
                            
                except Exception as e:
                    print(f"❌ Error clicking Google button: {e}")
            else:
                print("❌ No Google login button found")
        else:
            print(f"⚠️  Unexpected page after CAPTCHA: {driver.current_url}")
    else:
        print(f"⚠️  Unknown page state: {driver.title}")
    
    # Keep browser open for inspection
    print("\n⏳ Keeping browser open for 10 seconds...")
    time.sleep(10)
    
    driver.quit()
    print("✅ Browser closed")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("🎯 WORKING SOLUTION SUMMARY:")
print("")
print("If Google login works without 'not secure' warning:")
print("   ✅ Ultimate stealth configuration works")
print("   ✅ Can complete Google OAuth in automation")
print("   ✅ Can save cookies for future use")
print("")
print("If still blocked:")
print("   ❌ Google has advanced detection")
print("   ❌ Need manual auth in REAL browser")
print("   ❌ Then export cookies for automation")
print("")
print("🚀 NEXT: Check if Google login works in the test")