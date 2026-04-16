#!/usr/bin/env python3
"""
Test DeepSeek auto-login to see what actually happens
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

print("🧪 Testing DeepSeek auto-login...")
print("=" * 50)

# Setup browser with visible window
options = webdriver.ChromeOptions()
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
# Keep browser visible to see what happens
# options.add_argument('--headless')  # Commented out to see browser

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

try:
    print("1. Opening DeepSeek chat...")
    driver.get("https://chat.deepseek.com")
    time.sleep(3)
    
    print(f"2. Current URL: {driver.current_url}")
    print(f"3. Page title: {driver.title}")
    
    # Take screenshot to see what we're looking at
    driver.save_screenshot('/home/leviathan/OPENCODE_WORKSPACE/deepseek_login_page.png')
    print("4. Screenshot saved to deepseek_login_page.png")
    
    # Look for login elements
    print("\n5. Searching for login elements...")
    
    # Check for various possible login field selectors
    selectors = [
        'input[type="email"]',
        'input[type="text"][name*="email"]',
        '#email',
        'input[name="email"]',
        '[data-testid="email-input"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="mail" i]'
    ]
    
    email_field = None
    for selector in selectors:
        elements = driver.find_elements(By.CSS_SELECTOR, selector)
        if elements:
            email_field = elements[0]
            print(f"   Found email field with selector: {selector}")
            break
    
    if not email_field:
        print("   ❌ No email field found")
        # Try to get page source to see structure
        with open('/home/leviathan/OPENCODE_WORKSPACE/deepseek_page.html', 'w') as f:
            f.write(driver.page_source[:5000])
        print("   Page source snippet saved to deepseek_page.html")
    
    # Check for password field
    password_selectors = [
        'input[type="password"]',
        '#password',
        'input[name="password"]',
        '[data-testid="password-input"]',
        'input[placeholder*="password" i]'
    ]
    
    password_field = None
    for selector in password_selectors:
        elements = driver.find_elements(By.CSS_SELECTOR, selector)
        if elements:
            password_field = elements[0]
            print(f"   Found password field with selector: {selector}")
            break
    
    if not password_field:
        print("   ❌ No password field found")
    
    # Check for login button
    button_selectors = [
        'button[type="submit"]',
        'button:contains("Login")',
        'button:contains("Sign in")',
        'button:contains("Log in")',
        '[data-testid="login-button"]'
    ]
    
    login_button = None
    for selector in button_selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            if elements:
                login_button = elements[0]
                print(f"   Found login button with selector: {selector}")
                print(f"   Button text: {login_button.text}")
                break
        except:
            pass
    
    if not login_button:
        print("   ❌ No login button found")
    
    # Check if we're already logged in (cookies from previous session)
    print(f"\n6. Checking login state...")
    print(f"   URL contains 'sign_in': {'sign_in' in driver.current_url}")
    print(f"   URL contains 'login': {'login' in driver.current_url}")
    print(f"   URL contains 'chat': {'chat' in driver.current_url}")
    
    # Look for chat interface elements
    chat_selectors = [
        'textarea',
        '[contenteditable="true"]',
        '[role="textbox"]',
        '.chat-input',
        '[data-testid="chat-input"]'
    ]
    
    chat_input = None
    for selector in chat_selectors:
        elements = driver.find_elements(By.CSS_SELECTOR, selector)
        if elements:
            chat_input = elements[0]
            print(f"   Found chat input with selector: {selector}")
            break
    
    if chat_input:
        print("   ✅ Already on chat page (might be logged in)")
    else:
        print("   ❌ Not on chat page (needs login)")
    
    print("\n7. Testing auto-login if fields found...")
    if email_field and password_field:
        print("   Attempting to fill credentials...")
        try:
            email_field.send_keys("cryptoforex36963@gmail.com")
            time.sleep(0.5)
            password_field.send_keys("CosmicEnergy369!")
            time.sleep(0.5)
            
            if login_button:
                login_button.click()
            else:
                # Try pressing Enter
                password_field.send_keys(Keys.RETURN)
            
            print("   ✅ Credentials filled and submitted")
            time.sleep(3)
            
            # Check if login worked
            print(f"   Post-login URL: {driver.current_url}")
            print(f"   Contains 'sign_in': {'sign_in' in driver.current_url}")
            
            # Look for CAPTCHA or error messages
            error_selectors = [
                '.error',
                '.alert',
                '[role="alert"]',
                'div:contains("CAPTCHA")',
                'div:contains("captcha")',
                'div:contains("robot")',
                'div:contains("verify")'
            ]
            
            for selector in error_selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    print(f"   ⚠️  Found potential error/CAPTCHA: {elements[0].text[:100]}")
            
        except Exception as e:
            print(f"   ❌ Auto-login attempt failed: {e}")
    else:
        print("   ⚠️  Cannot attempt auto-login (missing fields)")
    
    print("\n8. Final assessment:")
    if 'chat.deepseek.com' in driver.current_url and 'sign_in' not in driver.current_url:
        print("   ✅ Likely already logged in or login successful")
        # Get cookies
        cookies = driver.get_cookies()
        print(f"   Number of cookies: {len(cookies)}")
    else:
        print("   ❌ Not logged in - manual authentication needed")
        print("   Reason: Could be:")
        print("   - CAPTCHA protection")
        print("   - Different login flow (OAuth, social login)")
        print("   - Dynamic form that changes selectors")
        print("   - Already logged out session")
    
    # Keep browser open for inspection
    print("\n⚠️  Browser will remain open for 30 seconds for manual inspection...")
    print("   Check the browser window to see the actual DeepSeek page.")
    time.sleep(30)
    
except Exception as e:
    print(f"❌ Test failed with error: {e}")
    import traceback
    traceback.print_exc()

finally:
    driver.quit()
    print("\n✅ Test complete. Browser closed.")