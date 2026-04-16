#!/usr/bin/env python3
"""
🧠 REAL WORKING BRAIN BRIDGE
"""
import sys
import json
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

COOKIE_FILE = '/tmp/deepseek_cookies/full_session.json'

def check_auth():
    """Check if authenticated"""
    if not os.path.exists(COOKIE_FILE):
        print("❌ Not authenticated")
        print("   Run: source /tmp/brain_env/bin/activate && python3 /home/leviathan/OPENCODE_WORKSPACE/full_auth.py")
        return False
    return True

def ask_deepseek(question):
    """Ask DeepSeek a question"""
    if not check_auth():
        return "Authentication required"
    
    print(f"🧠 Asking DeepSeek: {question[:80]}...")
    
    # Setup Chrome in headless mode
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Load page
        driver.get("https://chat.deepseek.com")
        time.sleep(2)
        
        # Load cookies
        with open(COOKIE_FILE, 'r') as f:
            cookies = json.load(f)
        
        for cookie in cookies:
            try:
                driver.add_cookie(cookie)
            except:
                pass
        
        driver.refresh()
        time.sleep(3)
        
        # Check if we're logged in
        current_url = driver.current_url
        if 'sign_in' in current_url or 'authorized' in current_url:
            print("❌ Session issue - might need re-auth")
            driver.quit()
            return "Session issue. Might need to re-authenticate."
        
        print(f"✅ On chat page: {current_url[:80]}...")
        
        # Find chat input - try multiple selectors
        textarea = None
        selectors = [
            'textarea',
            '[contenteditable="true"]',
            '[role="textbox"]',
            '.chat-input',
            'input[type="text"]',
            'div[contenteditable="true"]'
        ]
        
        for selector in selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    textarea = elements[0]
                    print(f"✅ Found input with selector: {selector}")
                    break
            except:
                pass
        
        if not textarea:
            # Try to get page source for debugging
            with open('/tmp/deepseek_debug.html', 'w') as f:
                f.write(driver.page_source[:5000])
            print("❌ Could not find chat input")
            print("   Debug HTML saved to /tmp/deepseek_debug.html")
            driver.quit()
            return "Could not find chat input"
        
        # Type question
        textarea.clear()
        for char in question:
            textarea.send_keys(char)
            time.sleep(0.01)
        
        textarea.send_keys(Keys.RETURN)
        print("🤔 Thinking...")
        
        # Wait for response
        last_response = ""
        for i in range(30):  # 60 seconds max
            time.sleep(2)
            
            # Look for response
            responses = driver.find_elements(By.CSS_SELECTOR, 
                '.message, .response, [class*="message"], [class*="response"], .markdown, .prose, .whitespace-pre-wrap'
            )
            
            if responses:
                # Get the latest response
                for response in reversed(responses):
                    text = response.text.strip()
                    if text and len(text) > 30 and text != last_response:
                        print(f"✅ Got response ({len(text)} chars)")
                        driver.quit()
                        return text
            
            if i % 5 == 0:
                print(f"   Still thinking... ({i*2}s)")
        
        print("❌ Timeout - no response")
        driver.quit()
        return "No response received (timeout)"
        
    except Exception as e:
        print(f"❌ Error: {e}")
        driver.quit()
        return f"Error: {str(e)}"

def main():
    if len(sys.argv) < 2:
        print("🧠 REAL BRAIN BRIDGE")
        print("=" * 50)
        print("Usage: brain \"your question\"")
        print("")
        print("First time? Authenticate:")
        print("  source /tmp/brain_env/bin/activate && python3 /home/leviathan/OPENCODE_WORKSPACE/full_auth.py")
        print("")
        print("Then use:")
        print("  brain \"vLLM installation failing\"")
        print("  brain \"Python package errors\"")
        print("  brain \"Docker issues\"")
        return
    
    question = " ".join(sys.argv[1:])
    answer = ask_deepseek(question)
    print(f"\n🤖 DEEPSEEK SAYS:\n{answer}")

if __name__ == "__main__":
    main()