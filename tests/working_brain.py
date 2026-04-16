#!/usr/bin/env python3
"""
WORKING BRAIN BRIDGE - Simple and effective
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

def brain(question):
    """Main brain function"""
    print(f"🧠 Thinking: {question[:80]}...")
    
    # Setup Chrome
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--headless')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Go to DeepSeek
        driver.get("https://chat.deepseek.com")
        time.sleep(2)
        
        # Load cookies if they exist
        if os.path.exists(COOKIE_FILE):
            with open(COOKIE_FILE, 'r') as f:
                cookies = json.load(f)
            for cookie in cookies:
                try:
                    driver.add_cookie(cookie)
                except:
                    pass
            driver.refresh()
            time.sleep(3)
        
        # Check if we need auth
        if 'sign_in' in driver.current_url:
            print("❌ Need authentication")
            print("   Run: python3 /home/leviathan/OPENCODE_WORKSPACE/full_auth.py")
            driver.quit()
            return "Authentication required"
        
        # Try to find chat input
        input_found = False
        for _ in range(5):
            try:
                # Try different selectors
                selectors = [
                    'textarea',
                    '[contenteditable="true"]',
                    'div[contenteditable="true"]',
                    '.chat-input',
                    'input'
                ]
                
                for selector in selectors:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        input_element = elements[-1]  # Last one is usually chat input
                        input_found = True
                        break
                
                if input_found:
                    break
                    
            except:
                pass
            
            time.sleep(1)
        
        if not input_found:
            # Save page for debugging
            with open('/tmp/deepseek_page.html', 'w') as f:
                f.write(driver.page_source[:10000])
            print("❌ Could not find input")
            driver.quit()
            return "Could not find chat input"
        
        # Type question
        input_element.clear()
        input_element.send_keys(question)
        input_element.send_keys(Keys.RETURN)
        print("🤔 Waiting for response...")
        
        # Wait for response
        response_text = ""
        for i in range(30):
            time.sleep(2)
            
            # Look for responses
            try:
                # Try to find response elements
                response_elements = driver.find_elements(By.CSS_SELECTOR,
                    '.message, .response, .markdown, .prose, [class*="message"], [class*="response"]'
                )
                
                if response_elements:
                    # Get text from all response elements
                    all_text = []
                    for elem in response_elements:
                        text = elem.text.strip()
                        if text and len(text) > 20:
                            all_text.append(text)
                    
                    if all_text:
                        # Get the longest response (likely the answer)
                        latest = max(all_text, key=len)
                        if latest != response_text:
                            response_text = latest
                            print(f"✅ Got response ({len(response_text)} chars)")
            
            except:
                pass
            
            # If we have a good response, return it
            if response_text and len(response_text) > 50:
                driver.quit()
                return response_text
            
            if i % 5 == 0:
                print(f"   Still thinking... ({i*2}s)")
        
        driver.quit()
        return response_text if response_text else "No response received"
        
    except Exception as e:
        print(f"❌ Error: {e}")
        driver.quit()
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("🧠 BRAIN - Ask DeepSeek anything")
        print("Usage: brain \"your question\"")
        print("")
        print("First: python3 /home/leviathan/OPENCODE_WORKSPACE/full_auth.py")
        print("Then: brain \"your problem\"")
        sys.exit(1)
    
    question = " ".join(sys.argv[1:])
    answer = brain(question)
    print(f"\n🤖 ANSWER:\n{answer}")