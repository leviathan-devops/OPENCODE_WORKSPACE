#!/usr/bin/env python3
"""
FIX AUTHENTICATION - Wait for complete Google OAuth flow
"""
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔐 FIXING DEEPSEEK AUTHENTICATION")
print("=" * 50)
print("")
print("⚠️  The issue: Browser closes during Google OAuth")
print("   This script will:")
print("   1. Open browser")
print("   2. Go to DeepSeek")
print("   3. Wait for you to click 'Login with Google'")
print("   4. Wait for you to complete Google login")
print("   5. Wait for redirect back to DeepSeek")
print("   6. Verify you're on chat page")
print("   7. Save session")
print("")
print("📝 IMPORTANT: Don't close browser manually")
print("   Let the script handle it after auth completes")
print("")
input("Press Enter to start...")

# Clean up old profile
import shutil
if os.path.exists('/tmp/chrome_brain_fixed'):
    shutil.rmtree('/tmp/chrome_brain_fixed', ignore_errors=True)

# Setup Chrome with new profile
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-blink-features=AutomationControlled')
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)
chrome_options.add_argument('--user-data-dir=/tmp/chrome_brain_fixed')

# Don't run headless - you need to see and interact
# chrome_options.add_argument('--headless')

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

try:
    print("🚀 Opening DeepSeek...")
    driver.get("https://chat.deepseek.com")
    time.sleep(3)
    
    print(f"📄 Initial page: {driver.title}")
    print(f"📄 URL: {driver.current_url}")
    print("")
    print("✅ Browser opened!")
    print("")
    print("🔐 STEP 1: Click 'Login with Google' button")
    print("   Look for Google login button on the page")
    print("   Click it, then proceed with Google login")
    print("")
    print("⏳ Waiting for you to click Google login...")
    
    # Wait for user to click Google login
    initial_url = driver.current_url
    for i in range(60):  # 2 minutes max
        time.sleep(2)
        current_url = driver.current_url
        
        if current_url != initial_url:
            print(f"✅ Navigation detected! New URL: {current_url[:100]}...")
            
            if 'accounts.google.com' in current_url:
                print("🎯 ON GOOGLE LOGIN PAGE!")
                print("   Please complete Google login now")
                print("   Enter: cryptoforex36963@gmail.com / CosmicEnergy369!")
                break
            elif 'chat.deepseek.com' in current_url and 'sign_in' not in current_url:
                print("🎯 ALREADY ON CHAT PAGE!")
                print("   You might already be logged in")
                break
        
        print(f"   Still on initial page... ({i*2}s)")
    
    print("")
    print("🔐 STEP 2: Complete Google OAuth")
    print("   The browser will stay open while you login")
    print("   Take your time - don't rush")
    print("")
    
    # Wait for Google OAuth to complete
    for i in range(90):  # 3 minutes for OAuth
        time.sleep(2)
        current_url = driver.current_url
        
        # Check if we're back on DeepSeek chat
        if 'chat.deepseek.com' in current_url and 'sign_in' not in current_url and 'oauth' not in current_url:
            print(f"✅ BACK ON DEEPSEEK CHAT! ({current_url[:100]}...)")
            print("   Login successful!")
            
            # Wait a bit more to ensure page loads
            time.sleep(5)
            
            # Check for chat interface
            page_text = driver.page_source.lower()
            if 'chat' in page_text or 'conversation' in page_text:
                print("✅ Chat interface detected!")
                
                # Save screenshot
                driver.save_screenshot('/tmp/deepseek_auth_success.png')
                print("📸 Screenshot saved: /tmp/deepseek_auth_success.png")
                
                # Keep browser open for a bit
                print("")
                print("🎉 AUTHENTICATION COMPLETE!")
                print("   Session saved in: /tmp/chrome_brain_fixed")
                print("   Browser will close in 10 seconds...")
                
                time.sleep(10)
                driver.quit()
                
                # Copy to standard location
                if os.path.exists('/tmp/chrome_brain'):
                    shutil.rmtree('/tmp/chrome_brain', ignore_errors=True)
                shutil.copytree('/tmp/chrome_brain_fixed', '/tmp/chrome_brain')
                print("✅ Profile copied to: /tmp/chrome_brain")
                
                exit(0)
        
        # Check if we're stuck on Google
        if 'accounts.google.com' in current_url:
            if i % 10 == 0:  # Every 20 seconds
                print(f"   Still on Google login... ({i*2}s)")
                print("   Please complete the login process")
        else:
            print(f"   Current URL: {current_url[:80]}... ({i*2}s)")
    
    print("❌ OAuth timeout after 3 minutes")
    print("   Please try again")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

driver.quit()
print("")
print("💡 TROUBLESHOOTING:")
print("   1. Make sure you complete ALL Google login steps")
print("   2. Don't close browser manually")
print("   3. If stuck, try incognito/private mode in regular browser first")
print("   4. Check credentials: cryptoforex36963@gmail.com / CosmicEnergy369!")