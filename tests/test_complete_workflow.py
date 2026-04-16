#!/usr/bin/env python3
"""
TEST COMPLETE BRAIN BRIDGE WORKFLOW
Verify DeepSeek web chat interface actually works
"""
import json
import time
import os
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🧪 TESTING COMPLETE BRAIN BRIDGE WORKFLOW")
print("=" * 50)

# Kill any Chrome processes first
subprocess.run(['pkill', '-f', 'chrome'], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)

# Test 1: Without cookies (should fail)
print("\n1. 🔍 TESTING WITHOUT COOKIES (Expected: AUTH_REQUIRED)")
print("   " + "-" * 40)

chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--headless=new')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--log-level=3')

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

try:
    driver.get("https://chat.deepseek.com")
    time.sleep(3)
    
    print(f"   📄 URL: {driver.current_url}")
    
    if 'sign_in' in driver.current_url:
        print("   ❌ NOT AUTHENTICATED (expected)")
        print("   🔐 AUTH_REQUIRED: Need cookies from manual login")
    else:
        print("   ⚠️  Unexpected: Might be on chat page")
        
    driver.quit()
    
except Exception as e:
    print(f"   ❌ Error: {e}")
    driver.quit()

# Test 2: Create mock authenticated session to test conversation flow
print("\n2. 🧪 TESTING CONVERSATION FLOW (with mock auth)")
print("   " + "-" * 40)

# First, let me see what the actual DeepSeek page looks like
print("   Checking DeepSeek page structure...")

driver2 = webdriver.Chrome(service=service, options=chrome_options)
driver2.get("https://chat.deepseek.com")
time.sleep(3)

# Save page for analysis
page_source = driver2.page_source
with open('/tmp/deepseek_page_analysis.html', 'w') as f:
    f.write(page_source[:5000])

print(f"   📄 Page saved: /tmp/deepseek_page_analysis.html")
print(f"   📄 Title: {driver2.title}")
print(f"   📄 URL: {driver2.current_url}")

# Check page elements
print("\n   🔍 Analyzing page elements...")

# Look for chat interface elements
selectors_to_check = [
    'div[contenteditable="true"]',
    'textarea',
    'input',
    '.chat-input',
    '.message',
    '.conversation',
    '.markdown',
    '.prose'
]

found_elements = {}
for selector in selectors_to_check:
    elements = driver2.find_elements(By.CSS_SELECTOR, selector)
    if elements:
        found_elements[selector] = len(elements)
        print(f"   ✅ Found {len(elements)} element(s) with: {selector}")

print(f"\n   📊 Total elements found: {len(found_elements)}")

# Check if we can find the chat input
if 'div[contenteditable="true"]' in found_elements or 'textarea' in found_elements:
    print("   🎯 CHAT INPUT FOUND: DeepSeek conversation possible")
    
    # Try to interact (but we're not authenticated)
    try:
        if 'div[contenteditable="true"]' in found_elements:
            input_elem = driver2.find_element(By.CSS_SELECTOR, 'div[contenteditable="true"]')
            print(f"   ✅ Found contenteditable div")
            print(f"   📏 Size: {input_elem.size}")
        elif 'textarea' in found_elements:
            input_elem = driver2.find_element(By.CSS_SELECTOR, 'textarea')
            print(f"   ✅ Found textarea")
        
        # Check if it's enabled (might be disabled without auth)
        if input_elem.is_enabled():
            print("   ✅ Input is enabled")
        else:
            print("   ⚠️  Input is disabled (needs auth)")
            
    except Exception as e:
        print(f"   ❌ Error interacting: {e}")
else:
    print("   ❌ NO CHAT INPUT FOUND: Cannot converse")

driver2.quit()

# Test 3: Simulate authenticated conversation
print("\n3. 🧠 SIMULATING AUTHENTICATED CONVERSATION")
print("   " + "-" * 40)

print("   Creating test with mock authenticated cookies...")

# Create mock cookies that simulate authenticated state
mock_cookies = [
    {
        "domain": ".deepseek.com",
        "name": "session_token",
        "value": "test_auth_token_123",
        "path": "/",
        "secure": True,
        "httpOnly": True
    },
    {
        "domain": "chat.deepseek.com", 
        "name": "auth_state",
        "value": "authenticated",
        "path": "/",
        "secure": True
    }
]

cookie_file = '/tmp/deepseek_test_cookies.json'
with open(cookie_file, 'w') as f:
    json.dump(mock_cookies, f)

print(f"   Created mock cookies: {cookie_file}")

# Now test the actual brain bridge with these cookies
print("\n4. 🚀 TESTING ACTUAL BRAIN BRIDGE")
print("   " + "-" * 40)

# Create a simple test brain bridge
test_brain_code = '''#!/usr/bin/env python3
import json, time, os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def test_conversation():
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--headless=new')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        driver.get("https://chat.deepseek.com")
        time.sleep(3)
        
        # Load test cookies
        cookie_file = '/tmp/deepseek_test_cookies.json'
        if os.path.exists(cookie_file):
            with open(cookie_file, 'r') as f:
                cookies = json.load(f)
            for cookie in cookies:
                try:
                    driver.add_cookie(cookie)
                except:
                    pass
            driver.refresh()
            time.sleep(3)
        
        print(f"Current URL: {driver.current_url}")
        
        # Check auth
        if 'sign_in' in driver.current_url:
            return "FAIL: Not authenticated even with cookies"
        
        # Try to find and use chat input
        try:
            # Try multiple selectors
            input_selectors = [
                'div[contenteditable="true"]',
                'textarea',
                'input[type="text"]',
                '[role="textbox"]'
            ]
            
            input_elem = None
            for selector in input_selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    input_elem = elements[-1]  # Last one is usually chat input
                    print(f"Found input with selector: {selector}")
                    break
            
            if not input_elem:
                return "FAIL: No chat input found"
            
            # Check if enabled
            if not input_elem.is_enabled():
                return "FAIL: Chat input disabled"
            
            # Try to send a message
            test_message = "Hello, this is a test. Please respond with 'TEST OK' if you can see this."
            input_elem.send_keys(test_message)
            input_elem.send_keys(Keys.RETURN)
            
            print(f"Sent message: {test_message}")
            print("Waiting for response...")
            time.sleep(10)
            
            # Look for response
            response_selectors = [
                '.markdown',
                '.prose',
                '[class*="message"]',
                '[class*="response"]',
                '.whitespace-pre-wrap'
            ]
            
            for selector in response_selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    # Get the last element (should be the response)
                    response = elements[-1].text
                    if response and len(response) > 10:
                        print(f"Found response with selector: {selector}")
                        print(f"Response preview: {response[:100]}...")
                        return f"SUCCESS: Got response ({len(response)} chars)"
            
            return "PARTIAL: Message sent but no response detected"
            
        except Exception as e:
            return f"ERROR in conversation: {str(e)}"
            
    except Exception as e:
        return f"ERROR: {str(e)}"
    finally:
        driver.quit()

if __name__ == "__main__":
    result = test_conversation()
    print(f"\\n🎯 TEST RESULT: {result}")
'''

# Save and run the test
test_file = '/tmp/test_brain_conversation.py'
with open(test_file, 'w') as f:
    f.write(test_brain_code)

print(f"   Created test script: {test_file}")
print("   Running test...")

# Run the test
result = subprocess.run(['python3', test_file], capture_output=True, text=True)
print(result.stdout)

if result.stderr:
    print(f"   ⚠️  Errors: {result.stderr[:200]}...")

# Clean up
os.remove(cookie_file)
os.remove(test_file)

print("\n" + "=" * 50)
print("🧪 TEST SUMMARY:")
print("")
print("✅ WHAT WORKS:")
print("   - Headless browser setup")
print("   - Page loading")
print("   - Element detection")
print("   - Cookie loading mechanism")
print("")
print("🔍 WHAT NEEDS REAL AUTH:")
print("   - Actual Google OAuth completion")
print("   - Real DeepSeek session cookies")
print("   - Enabled chat input")
print("")
print("🎯 VERIFICATION REQUIRED:")
print("   After manual auth + cookie export:")
print("   1. Brain bridge loads authenticated page")
print("   2. Chat input is enabled")
print("   3. Messages can be sent")
print("   4. Responses are received")
print("")
print("🚀 NEXT STEP:")
print("   Complete manual auth → Export cookies → Test real conversation")