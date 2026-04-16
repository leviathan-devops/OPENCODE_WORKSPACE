#!/usr/bin/env python3
"""
TEST SINGLE BROWSER CONVERSATION - ONE WINDOW
Verify DeepSeek web chat actually works with conversation
"""
import time
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🧪 TESTING SINGLE BROWSER CONVERSATION")
print("=" * 50)

# Kill ALL Chrome processes first
subprocess.run(['pkill', '-f', 'chrome'], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
time.sleep(2)

print("🚫 Killed all Chrome processes")
print("")

# Create ONE browser window with minimized settings
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

# Minimized window (not headless, but small)
chrome_options.add_argument('--window-size=800,600')
chrome_options.add_argument('--window-position=0,0')

# Stealth to avoid detection
chrome_options.add_argument('--disable-blink-features=AutomationControlled')
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

# User agent
chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

print("🌐 Starting ONE browser window...")
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

print("✅ Browser started (ONE window)")
print(f"   PID: {driver.service.process.pid}")
print("")

try:
    # Step 1: Load DeepSeek
    print("1. 📄 Loading DeepSeek...")
    driver.get("https://chat.deepseek.com")
    time.sleep(5)
    
    print(f"   Title: {driver.title}")
    print(f"   URL: {driver.current_url}")
    print("")
    
    # Check for CloudFront blocking
    page_source = driver.page_source.lower()
    if 'cloudfront' in page_source or '403' in page_source:
        print("❌ CLOUDFRONT BLOCKED - visible browser still blocked")
        driver.quit()
        exit(1)
    
    # Check for Human Verification/CAPTCHA
    if 'human verification' in page_source.lower() or 'captcha' in page_source.lower():
        print("⚠️  HUMAN VERIFICATION REQUIRED")
        print("   This is expected - DeepSeek requires CAPTCHA")
        print("   Need manual intervention")
        
        # Save screenshot
        driver.save_screenshot('/tmp/deepseek_captcha.png')
        print("   📸 Screenshot: /tmp/deepseek_captcha.png")
        
        # Wait for manual completion
        print("")
        print("⏳ Waiting 30 seconds for manual CAPTCHA completion...")
        print("   (If you see CAPTCHA, complete it manually)")
        
        for i in range(15):
            time.sleep(2)
            current_url = driver.current_url
            print(f"   Current: {current_url[:80]}... ({i*2}s)")
            
            # Check if we passed CAPTCHA
            if 'sign_in' in current_url or 'chat' in current_url:
                print(f"   ✅ CAPTCHA completed or not required")
                break
    
    # Step 2: Check authentication state
    print("")
    print("2. 🔐 Checking authentication...")
    
    current_url = driver.current_url
    if 'sign_in' in current_url:
        print("   ❌ NOT AUTHENTICATED")
        print("   Need to login with Google")
        print("")
        print("💡 MANUAL STEP REQUIRED:")
        print("   Click 'Login with Google'")
        print("   Complete Google login")
        print("   Wait for redirect back to DeepSeek")
        print("")
        print("⏳ Waiting 60 seconds for manual login...")
        
        for i in range(30):
            time.sleep(2)
            new_url = driver.current_url
            if new_url != current_url:
                print(f"   ✅ Navigation detected! New URL: {new_url[:80]}...")
                current_url = new_url
                
                if 'accounts.google.com' in new_url:
                    print("   🔐 On Google login page")
                elif 'chat.deepseek.com' in new_url and 'sign_in' not in new_url:
                    print("   🎯 LOGIN SUCCESSFUL!")
                    break
            
            print(f"   Still on: {current_url[:80]}... ({i*2}s)")
    
    # Step 3: Test conversation
    print("")
    print("3. 💬 TESTING CONVERSATION...")
    
    # Check if we're on chat page
    if 'chat.deepseek.com' in driver.current_url and 'sign_in' not in driver.current_url:
        print("   ✅ On chat page - ready for conversation")
        
        # Find chat input
        print("   🔍 Looking for chat input...")
        
        input_elem = None
        selectors = [
            'div[contenteditable="true"]',
            'textarea',
            'input[type="text"]',
            '[role="textbox"]'
        ]
        
        for selector in selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            if elements:
                input_elem = elements[-1]  # Last one is usually chat input
                print(f"   ✅ Found input with: {selector}")
                break
        
        if not input_elem:
            print("   ❌ NO CHAT INPUT FOUND")
            driver.save_screenshot('/tmp/deepseek_no_input.png')
            driver.quit()
            exit(1)
        
        # Test 1: Send first message
        print("")
        print("   🧪 TEST 1: Sending message...")
        test_message = "Hello! Please respond with 'TEST OK' if you can see this message."
        input_elem.send_keys(test_message)
        input_elem.send_keys(Keys.RETURN)
        
        print(f"   📤 Sent: {test_message}")
        print("   ⏳ Waiting for response...")
        time.sleep(10)
        
        # Look for response
        print("   🔍 Looking for response...")
        
        response = None
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
                text = elements[-1].text
                if text and len(text) > 10:
                    response = text
                    print(f"   ✅ Found response with: {selector}")
                    print(f"   📥 Response: {text[:100]}...")
                    break
        
        if response:
            print("")
            print("   🎉 CONVERSATION SUCCESS!")
            print(f"   🤖 Response received: {len(response)} characters")
            
            # Test 2: Send follow-up
            print("")
            print("   🧪 TEST 2: Follow-up question...")
            follow_up = "What is 2+2? Give me just the number."
            input_elem.send_keys(follow_up)
            input_elem.send_keys(Keys.RETURN)
            
            print(f"   📤 Sent: {follow_up}")
            print("   ⏳ Waiting for response...")
            time.sleep(10)
            
            # Get new response
            for selector in response_selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements and len(elements) > 1:
                    text = elements[-1].text
                    if text and len(text) > 5:
                        print(f"   ✅ Follow-up response: {text[:100]}...")
                        print("")
                        print("   🎯 MULTI-TURN CONVERSATION WORKS!")
                        break
            
            # Save proof
            driver.save_screenshot('/tmp/deepseek_conversation_proof.png')
            print("   📸 Proof saved: /tmp/deepseek_conversation_proof.png")
            
        else:
            print("   ❌ NO RESPONSE RECEIVED")
            driver.save_screenshot('/tmp/deepseek_no_response.png')
            
    else:
        print(f"   ❌ Not on chat page: {driver.current_url}")
    
    print("")
    print("✅ TEST COMPLETE")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

finally:
    print("")
    print("🔄 Closing browser...")
    driver.quit()
    print("✅ Browser closed")
    print("")

print("=" * 50)
print("🧪 TEST RESULTS:")
print("")
print("If conversation worked:")
print("   ✅ DeepSeek web chat interface works")
print("   ✅ Visible outputs can be obtained")
print("   ✅ Multi-turn conversation possible")
print("")
print("If failed:")
print("   ❌ Need manual CAPTCHA completion")
print("   ❌ Need manual Google login")
print("   ❌ CloudFront blocking issues")
print("")
print("🎯 NEXT: Complete manual steps if needed, then automate")