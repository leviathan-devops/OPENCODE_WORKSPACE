#!/usr/bin/env python3
"""
🧠 REAL BRAIN BRIDGE - Uses authenticated session
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

COOKIE_FILE = '/tmp/deepseek_cookies/session.json'

def check_auth():
    """Check if authenticated"""
    if not os.path.exists(COOKIE_FILE):
        print("❌ Not authenticated")
        print("   Run authentication first:")
        print("   source /tmp/brain_env/bin/activate && python3 /home/leviathan/OPENCODE_WORKSPACE/auto_auth.py")
        return False
    
    with open(COOKIE_FILE, 'r') as f:
        cookies = json.load(f)
    
    if not cookies:
        print("❌ No cookies found in session")
        return False
    
    return True

def ask_deepseek(question):
    """Ask DeepSeek a question using saved session"""
    if not check_auth():
        return "Authentication required"
    
    print(f"🧠 Asking DeepSeek: {question[:80]}...")
    
    # Setup Chrome in headless mode
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--headless')  # Run in background
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
        
        # Check if we're on chat page
        if 'sign_in' in driver.current_url:
            print("❌ Session expired - need to re-authenticate")
            driver.quit()
            return "Session expired. Please run authentication again."
        
        # Find chat input
        textarea = None
        selectors = [
            'textarea',
            '[contenteditable="true"]',
            '[role="textbox"]',
            '.chat-input',
            'input[type="text"]'
        ]
        
        for selector in selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            if elements:
                textarea = elements[0]
                break
        
        if not textarea:
            driver.quit()
            return "❌ Could not find chat input"
        
        # Type question
        textarea.clear()
        for char in question:
            textarea.send_keys(char)
            time.sleep(0.02)  # Human-like typing
        
        textarea.send_keys(Keys.RETURN)
        print("🤔 Thinking...")
        
        # Wait for response
        for i in range(25):  # 50 seconds max
            time.sleep(2)
            
            # Look for response elements
            responses = driver.find_elements(By.CSS_SELECTOR, 
                '.message, .response, [class*="message"], [class*="response"], .markdown, .prose'
            )
            
            if responses:
                # Get the latest response that's not empty
                for response in reversed(responses):
                    text = response.text.strip()
                    if text and len(text) > 50:
                        driver.quit()
                        return text
            
            if i % 5 == 0:
                print(f"   Still thinking... ({i*2}s)")
        
        driver.quit()
        return "❌ No response received (timeout)"
        
    except Exception as e:
        driver.quit()
        return f"❌ Error: {str(e)}"

def main():
    if len(sys.argv) < 2:
        print("🧠 BRAIN BRIDGE - Universal Thinking Tool")
        print("=" * 50)
        print("")
        print("Usage: brain \"your problem here\"")
        print("")
        print("Examples:")
        print("  brain \"vLLM installation failing for 4 hours\"")
        print("  brain \"How to fix Python import errors\"")
        print("  brain \"Docker container won't start\"")
        print("")
        print("First time? Run authentication:")
        print("  source /tmp/brain_env/bin/activate && python3 /home/leviathan/OPENCODE_WORKSPACE/auto_auth.py")
        return
    
    question = " ".join(sys.argv[1:])
    answer = ask_deepseek(question)
    print(f"\n🤖 DEEPSEEK SAYS:\n{answer}")

if __name__ == "__main__":
    main()