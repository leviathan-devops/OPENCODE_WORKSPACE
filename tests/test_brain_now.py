#!/usr/bin/env python3
"""
TEST BRAIN BRIDGE NOW - I test it myself
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🧪 TESTING BRAIN BRIDGE MYSELF")
print("=" * 50)

# Check if we have the authenticated profile
import os
if not os.path.exists('/tmp/chrome_brain'):
    print("❌ No authenticated profile found")
    print("   Need to run auth first")
    exit(1)

print("✅ Found authenticated Chrome profile")
print("   Testing with question: 'What is 2+2?'")

# Setup Chrome with the authenticated profile
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-blink-features=AutomationControlled')
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)
chrome_options.add_argument('--user-data-dir=/tmp/chrome_brain')

# Run with visible browser to see what happens
# chrome_options.add_argument('--headless')

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

try:
    print("🌐 Loading DeepSeek...")
    driver.get("https://chat.deepseek.com")
    time.sleep(5)
    
    print(f"📄 Current URL: {driver.current_url}")
    
    # Check if logged in
    if 'sign_in' in driver.current_url:
        print("❌ NOT LOGGED IN - auth failed")
        driver.quit()
        exit(1)
    
    print("✅ LOGGED IN SUCCESSFULLY!")
    
    # Take screenshot to see page
    driver.save_screenshot('/tmp/deepseek_test_page.png')
    print("📸 Screenshot saved: /tmp/deepseek_test_page.png")
    
    # Try to find chat input
    print("🔍 Looking for chat input...")
    
    # DeepSeek uses contenteditable div
    input_elements = driver.find_elements(By.CSS_SELECTOR, 'div[contenteditable="true"]')
    if not input_elements:
        print("❌ No contenteditable div found")
        # Try textarea
        input_elements = driver.find_elements(By.TAG_NAME, 'textarea')
    
    if not input_elements:
        print("❌ No input found at all")
        # Save page for debugging
        with open('/tmp/deepseek_page_debug.html', 'w') as f:
            f.write(driver.page_source[:5000])
        print("   Debug HTML saved")
        driver.quit()
        exit(1)
    
    input_elem = input_elements[-1]  # Last one is usually chat input
    print(f"✅ Found input element")
    
    # Ask question
    question = "What is 2+2? Give me just the number."
    print(f"💬 Asking: {question}")
    
    input_elem.send_keys(question)
    input_elem.send_keys(Keys.RETURN)
    
    print("🤔 Waiting for response...")
    time.sleep(8)
    
    # Try to get response
    print("🔍 Looking for response...")
    
    # Try multiple selectors
    response = None
    selectors = [
        '.markdown',
        '.prose', 
        '.message',
        '[class*="message"]',
        '[class*="response"]',
        '.whitespace-pre-wrap'
    ]
    
    for selector in selectors:
        elements = driver.find_elements(By.CSS_SELECTOR, selector)
        if elements:
            # Get the last element (most recent response)
            text = elements[-1].text.strip()
            if text and len(text) > 10:
                response = text
                print(f"✅ Found response with selector: {selector}")
                print(f"   Length: {len(text)} chars")
                break
    
    if response:
        print(f"\n🎉 BRAIN BRIDGE WORKS!")
        print(f"🤖 RESPONSE: {response[:200]}...")
    else:
        print("❌ No response found")
        # Get all text as fallback
        all_text = driver.find_element(By.TAG_NAME, 'body').text
        lines = all_text.split('\n')
        print(f"📄 All text lines: {len(lines)}")
        for i, line in enumerate(lines[-10:]):  # Last 10 lines
            if line.strip():
                print(f"   Line {i}: {line[:100]}...")
    
    driver.quit()
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    driver.quit()

print("\n" + "=" * 50)
print("🧠 TEST COMPLETE")
print("   If response received: ✅ Brain bridge works")
print("   If not: ❌ Need to debug")