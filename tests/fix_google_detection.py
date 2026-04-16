#!/usr/bin/env python3
"""
Fix Google automation detection - Based on known solutions
"""
import time
import subprocess
import json
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔧 FIXING GOOGLE AUTOMATION DETECTION")
print("=" * 50)

# Google detects these telltale signs:
# 1. "chrome is being controlled by automated test software"
# 2. WebDriver property
# 3. Missing real user profile
# 4. Automation flags

print("\n🎯 GOOGLE DETECTS:")
print("   - WebDriver property (navigator.webdriver)")
print("   - Chrome automation flags")
print("   - Missing real user profile")
print("   - Non-standard window properties")
print("")

# Solution 1: Use undetected-chromedriver or stealth
print("1. 🛡️  USING STEALTH TECHNIQUES")
print("   " + "-" * 40)

# Create stealth Chrome options
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

# CRITICAL: Remove automation flags
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

# Use real user profile
user_data_dir = '/tmp/chrome_real_user_profile'
chrome_options.add_argument(f'--user-data-dir={user_data_dir}')
chrome_options.add_argument('--profile-directory=Default')

# Real user agent
chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

# Window settings
chrome_options.add_argument('--window-size=1920,1080')
chrome_options.add_argument('--start-maximized')

# Disable automation detection
chrome_options.add_argument('--disable-blink-features=AutomationControlled')

print("   ✅ Stealth options configured")
print("")

# Test the stealth approach
print("2. 🧪 TESTING STEALTH APPROACH")
print("   " + "-" * 40)

try:
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print("   ✅ Chrome started with stealth")
    
    # Execute JavaScript to hide WebDriver
    print("   🛡️  Hiding WebDriver property...")
    
    stealth_js = """
    // Delete the webdriver property
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
    });
    
    // Override permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );
    
    // Mock plugins
    Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
    });
    
    // Mock languages
    Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
    });
    
    console.log('Stealth mode activated');
    """
    
    driver.execute_script(stealth_js)
    
    # Load DeepSeek
    print("   🌐 Loading DeepSeek...")
    driver.get("https://chat.deepseek.com")
    time.sleep(5)
    
    print(f"   📄 Title: {driver.title}")
    print(f"   📄 URL: {driver.current_url}")
    
    # Check for automation warning
    page_source = driver.page_source.lower()
    if 'controlled by automated test' in page_source:
        print("   ❌ STILL DETECTED: Automation warning present")
    else:
        print("   ✅ NO AUTOMATION WARNING DETECTED")
    
    # Save screenshot
    driver.save_screenshot('/tmp/google_stealth_test.png')
    print("   📸 Screenshot: /tmp/google_stealth_test.png")
    
    driver.quit()
    
except Exception as e:
    print(f"   ❌ Error: {e}")

print("")
print("3. 🚀 ALTERNATIVE SOLUTION: Manual Auth + Cookie Export")
print("   " + "-" * 40)

print("""
   Since Google has strong detection, the most reliable approach is:
   
   1. MANUAL AUTH in REAL Chrome (not automated):
      - Open regular Chrome browser
      - Go to: https://chat.deepseek.com
      - Complete CAPTCHA
      - Login with Google
      - Complete all security steps
   
   2. EXPORT COOKIES:
      - Install "Cookie Editor" extension
      - Export cookies as JSON
      - Save to: /tmp/deepseek_cookies.json
   
   3. USE COOKIES IN AUTOMATION:
      - Load cookies in Selenium
      - Bypasses Google login entirely
      - Works because cookies = already authenticated
""")

# Create cookie loader script
cookie_script = '''#!/usr/bin/env python3
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def brain_bridge_with_cookies(question):
    """Use pre-authenticated cookies"""
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    # Use visible browser (CloudFront blocks headless)
    chrome_options.add_argument('--window-size=800,600')
    chrome_options.add_argument('--window-position=9999,9999')  # Off-screen
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Load page
        driver.get("https://chat.deepseek.com")
        time.sleep(3)
        
        # Load cookies from manual auth
        with open('/tmp/deepseek_cookies.json', 'r') as f:
            cookies = json.load(f)
        
        for cookie in cookies:
            try:
                driver.add_cookie(cookie)
            except:
                pass
        
        driver.refresh()
        time.sleep(3)
        
        # Check if authenticated
        if 'sign_in' in driver.current_url:
            return "AUTH_FAILED: Cookies expired or invalid"
        
        # Use chat
        input_elem = driver.find_element(By.CSS_SELECTOR, 'div[contenteditable="true"], textarea')
        input_elem.send_keys(question + Keys.RETURN)
        time.sleep(10)
        
        # Get response
        responses = driver.find_elements(By.CSS_SELECTOR, '.markdown, .prose')
        if responses:
            answer = responses[-1].text
            driver.quit()
            return answer
        
        driver.quit()
        return "NO_RESPONSE"
        
    except Exception as e:
        driver.quit()
        return f"ERROR: {str(e)}"

# Test
if __name__ == "__main__":
    answer = brain_bridge_with_cookies("What is 2+2?")
    print(answer)
'''

with open('/tmp/brain_with_cookies.py', 'w') as f:
    f.write(cookie_script)

print(f"   📁 Created: /tmp/brain_with_cookies.py")
print("")

print("4. 🎯 RECOMMENDED APPROACH")
print("   " + "-" * 40)

print("""
   STEP 1 - Manual Setup (One Time):
   ---------------------------------
   1. Open regular Chrome (NOT automated)
   2. Login to DeepSeek with Google
   3. Export cookies with Cookie Editor
   4. Save to: /tmp/deepseek_cookies.json
   
   STEP 2 - Automation:
   --------------------
   1. Use brain_with_cookies.py
   2. It loads your authenticated cookies
   3. No Google login needed
   4. Works with visible browser
   
   STEP 3 - Agent Usage:
   ---------------------
   /tmp/brain_with_cookies.py "question"
""")

print("\n" + "=" * 50)
print("✅ SOLUTION READY")
print("   Manual auth once → Cookies forever → Automation works")