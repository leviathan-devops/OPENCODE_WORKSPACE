#!/usr/bin/env python3
"""
TEST REAL BROWSER - KEEP WINDOW OPEN
Actually see what happens instead of guessing
"""
import time
import subprocess
import signal
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔍 TESTING REAL BROWSER - WINDOW STAYS OPEN")
print("=" * 50)

# Kill ALL Chrome first
subprocess.run(['pkill', '-9', '-f', 'chrome'], stderr=subprocess.DEVNULL)
time.sleep(2)

print("🚫 Killed all Chrome processes")
print("")

# Create ONE browser with minimal flags
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

# NO headless - we want to SEE it
# chrome_options.add_argument('--headless')

# Minimal user agent
chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

# Keep window open
chrome_options.add_experimental_option("detach", True)

print("🌐 Starting ONE browser window (should stay open)...")
print("   This window should remain visible")

try:
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print(f"✅ Browser started - PID: {driver.service.process.pid}")
    print("   Window should be visible now")
    print("")
    
    # Set longer timeouts
    driver.set_page_load_timeout(30)
    driver.implicitly_wait(10)
    
    print("1. 📄 Loading DeepSeek (timeout: 30s)...")
    start_time = time.time()
    
    try:
        driver.get("https://chat.deepseek.com")
        load_time = time.time() - start_time
        print(f"   ✅ Page loaded in {load_time:.1f}s")
        
    except Exception as e:
        print(f"   ❌ Page load timeout: {e}")
        print("   (Browser might still be loading)")
    
    print("")
    print("2. 🔍 Checking page state...")
    time.sleep(3)  # Let page settle
    
    print(f"   Title: {driver.title}")
    print(f"   URL: {driver.current_url}")
    print("")
    
    # Take screenshot
    try:
        driver.save_screenshot('/tmp/deepseek_actual_page.png')
        print("   📸 Screenshot: /tmp/deepseek_actual_page.png")
    except:
        print("   ❌ Could not take screenshot")
    
    # Check page content
    try:
        page_text = driver.find_element(By.TAG_NAME, 'body').text[:500]
        print(f"   Page text (first 500 chars):")
        print(f"   '{page_text}'")
        print("")
        
        # Check for specific content
        page_lower = page_text.lower()
        if 'cloudfront' in page_lower:
            print("   ❌ CLOUDFRONT BLOCKED")
        elif 'captcha' in page_lower or 'verification' in page_lower:
            print("   ⚠️  CAPTCHA/VERIFICATION DETECTED")
        elif 'sign in' in page_lower or 'login' in page_lower:
            print("   🔐 LOGIN PAGE")
        elif 'chat' in page_lower or 'conversation' in page_lower:
            print("   💬 CHAT PAGE")
        else:
            print("   ⚠️  UNKNOWN PAGE CONTENT")
            
    except Exception as e:
        print(f"   ❌ Error reading page: {e}")
    
    print("")
    print("3. ⏳ Keeping browser open for 30 seconds...")
    print("   DO NOT CLOSE THE BROWSER WINDOW")
    print("   Let it stay open so we can see what happens")
    print("")
    
    for i in range(15):
        time.sleep(2)
        try:
            # Check if browser still alive
            current_url = driver.current_url
            current_title = driver.title
            
            print(f"   Still open: {current_title} - {current_url[:80]}... ({i*2}s)")
            
            # Check if page changed
            if i > 0 and ('cloudfront' in current_title.lower() or 'error' in current_title.lower()):
                print(f"   ❌ PAGE ERROR DETECTED at {i*2}s")
                break
                
        except Exception as e:
            print(f"   ❌ Browser error at {i*2}s: {e}")
            break
    
    print("")
    print("4. 🎯 TEST COMPLETE")
    print("   Browser window should still be open")
    print("   Check what you see in the window")
    
    # DON'T quit - keep window open
    # driver.quit()
    
    print("")
    print("⚠️  BROWSER WINDOW LEFT OPEN")
    print("   Please check what's displayed")
    print("   Then close it manually")
    
except Exception as e:
    print(f"❌ SETUP ERROR: {e}")
    import traceback
    traceback.print_exc()

print("")
print("=" * 50)
print("🧪 WHAT TO LOOK FOR:")
print("")
print("In the browser window, check for:")
print("1. ✅ DeepSeek chat interface")
print("2. ❌ CloudFront 403 error")
print("3. ⚠️  CAPTCHA/human verification")
print("4. 🔐 Google login page")
print("")
print("🎯 TELL ME WHAT YOU SEE IN THE BROWSER WINDOW")