#!/usr/bin/env python3
"""
Test bypassing CloudFront blocking
"""
import time
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔍 TESTING CLOUDFRONT BYPASS")
print("=" * 50)

# Kill all Chrome
subprocess.run(['pkill', '-f', 'chrome'], stderr=subprocess.DEVNULL)

# Try different approaches
approaches = [
    {
        "name": "FULL STEALTH + REAL PROFILE",
        "options": [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--user-data-dir=/tmp/chrome_real_profile',
            '--profile-directory=Default',
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--window-size=1920,1080',
            '--start-maximized'
        ]
    },
    {
        "name": "MINIMAL + NO AUTOMATION FLAGS",
        "options": [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    },
    {
        "name": "WITH REFERRER + HEADERS",
        "options": [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--window-size=1920,1080',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    }
]

for approach in approaches:
    print(f"\n🧪 Testing: {approach['name']}")
    
    chrome_options = Options()
    for opt in approach['options']:
        chrome_options.add_argument(opt)
    
    # Add experimental options
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print("   Loading DeepSeek...")
        driver.get("https://chat.deepseek.com")
        time.sleep(5)
        
        print(f"   Title: {driver.title}")
        print(f"   URL: {driver.current_url[:80]}...")
        
        # Check page
        page_source = driver.page_source.lower()
        
        if 'cloudfront' in page_source or '403' in page_source:
            print("   ❌ CLOUDFRONT BLOCKED")
            
            # Save blocked page
            with open(f'/tmp/cloudfront_blocked_{approach["name"].replace(" ", "_")}.html', 'w') as f:
                f.write(driver.page_source[:2000])
            print(f"   📄 Saved blocked page")
            
        elif 'human verification' in page_source or 'captcha' in page_source:
            print("   ⚠️  HUMAN VERIFICATION (CAPTCHA)")
            print("   This is progress - not blocked, just needs verification")
            
        elif 'deepseek' in page_source or 'chat' in page_source:
            print("   ✅ PAGE LOADED SUCCESSFULLY")
            
            # Check if on sign_in or chat page
            if 'sign_in' in driver.current_url:
                print("   🔐 On sign_in page (needs login)")
            else:
                print("   🎯 On chat page (ready)")
                
            # Save successful page
            driver.save_screenshot(f'/tmp/deepseek_loaded_{approach["name"].replace(" ", "_")}.png')
            print(f"   📸 Screenshot saved")
            
        else:
            print("   ⚠️  Unknown page state")
            print(f"   Page preview: {page_source[:200]}...")
        
        driver.quit()
        
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n" + "=" * 50)
print("🔍 ANALYSIS:")
print("")
print("If ANY approach gets past CloudFront (even to CAPTCHA):")
print("   ✅ CloudFront can be bypassed")
print("   ✅ Need to handle CAPTCHA manually once")
print("   ✅ Then automation works")
print("")
print("If ALL approaches blocked:")
print("   ❌ CloudFront has strong detection")
print("   ❌ Need different approach")
print("   ❌ Maybe use API or different service")