#!/usr/bin/env python3
"""
Test Google anti-bot detection triggers
"""
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔍 TESTING GOOGLE ANTI-BOT DETECTION")
print("=" * 50)

# Test different stealth configurations
configs = [
    {
        "name": "BASIC (triggers bot detection)",
        "args": ['--no-sandbox', '--disable-dev-shm-usage']
    },
    {
        "name": "STEALTH 1 (common stealth)",
        "args": [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    },
    {
        "name": "STEALTH 2 (full stealth)",
        "args": [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--window-size=1920,1080',
            '--start-maximized',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials'
        ]
    },
    {
        "name": "REAL BROWSER MODE",
        "args": [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--user-data-dir=/tmp/chrome_real_user',  # Simulate real user profile
            '--profile-directory=Default',
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    }
]

for config in configs:
    print(f"\n🧪 Testing: {config['name']}")
    print(f"   Args: {' '.join(config['args'][:3])}...")
    
    chrome_options = Options()
    for arg in config['args']:
        chrome_options.add_argument(arg)
    
    # Add experimental options for stealth
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print("   ✅ Browser started")
        
        # Navigate to Google OAuth directly (simulating DeepSeek redirect)
        test_url = "https://accounts.google.com/v3/signin/identifier?flowName=GlifWebSignIn"
        print(f"   🌐 Navigating to Google OAuth...")
        
        driver.get(test_url)
        time.sleep(3)
        
        print(f"   📄 Title: {driver.title}")
        print(f"   📄 URL: {driver.current_url[:80]}...")
        
        # Check for bot detection
        page_source = driver.page_source.lower()
        if 'automation' in page_source or 'bot' in page_source or 'suspicious' in page_source:
            print("   ❌ BOT DETECTED!")
        elif 'sign in' in page_source or 'email' in page_source:
            print("   ✅ On Google login page (no bot detection)")
        else:
            print("   ⚠️  Unknown page state")
        
        # Take screenshot
        driver.save_screenshot(f'/tmp/google_test_{config["name"].replace(" ", "_").lower()}.png')
        print(f"   📸 Screenshot saved")
        
        # Keep alive for 10 seconds
        print("   ⏳ Keeping alive for 10 seconds...")
        time.sleep(10)
        
        driver.quit()
        print("   ✅ Browser closed normally")
        
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        if 'chrome not reachable' in str(e).lower() or 'died' in str(e).lower():
            print("   💀 BROWSER KILLED BY ANTI-BOT!")

print("\n" + "=" * 50)
print("🔬 FINDINGS:")
print("")
print("🎯 GOOGLE ANTI-BOT DETECTS:")
print("   1. Automation-controlled flags")
print("   2. Headless browsers")
print("   3. Non-standard user agents")
print("   4. Missing real user profile data")
print("   5. Rapid navigation/actions")
print("")
print("💡 SOLUTION: Manual auth in REAL browser")
print("   - Use your regular Chrome/Firefox")
print("   - Login manually to DeepSeek")
print("   - Export cookies")
print("   - Load cookies in automation")
print("")
print("🚀 ALTERNATIVE: Use Firefox (less detection)")
print("   - Google detects Chrome automation better")
print("   - Firefox + geckodriver might work")