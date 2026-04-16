#!/usr/bin/env python3
"""
TESTED BRAIN BRIDGE - Actually works
"""
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def brain(question):
    print(f"🧠 Asking DeepSeek: {question[:80]}...")
    
    # Use the Chrome profile from auth
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--user-data-dir=/tmp/chrome_brain')
    chrome_options.add_argument('--headless=new')  # New headless mode
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Go to DeepSeek
        driver.get("https://chat.deepseek.com")
        time.sleep(5)  # Give more time for page load
        
        print(f"📄 Current URL: {driver.current_url}")
        
        # Check if logged in
        if 'sign_in' in driver.current_url:
            print("❌ Not logged in")
            print("   Run authentication first")
            driver.quit()
            return "Not authenticated"
        
        print("✅ Logged in!")
        
        # Try to find input - DeepSeek uses contenteditable div
        input_element = None
        max_attempts = 10
        
        for attempt in range(max_attempts):
            try:
                # DeepSeek uses a contenteditable div for input
                elements = driver.find_elements(By.CSS_SELECTOR, 'div[contenteditable="true"]')
                if elements:
                    # Usually the last contenteditable div is the chat input
                    input_element = elements[-1]
                    print(f"✅ Found input element (attempt {attempt+1})")
                    break
                
                # Also try textarea
                elements = driver.find_elements(By.TAG_NAME, 'textarea')
                if elements:
                    input_element = elements[-1]
                    print(f"✅ Found textarea (attempt {attempt+1})")
                    break
                    
            except Exception as e:
                print(f"   Search attempt {attempt+1} failed: {e}")
            
            time.sleep(1)
        
        if not input_element:
            # Save page for debugging
            with open('/tmp/deepseek_debug.html', 'w') as f:
                f.write(driver.page_source[:5000])
            print("❌ Could not find input")
            print("   Debug HTML saved to /tmp/deepseek_debug.html")
            driver.quit()
            return "Could not find chat input"
        
        # Type question
        input_element.clear()
        input_element.send_keys(question)
        input_element.send_keys(Keys.RETURN)
        print("🤔 Thinking...")
        
        # Wait for response
        last_text = ""
        for i in range(20):  # 60 seconds max
            time.sleep(3)
            
            # Get all text on page
            try:
                all_text = driver.find_element(By.TAG_NAME, 'body').text
                
                # Split by lines and find response
                lines = all_text.split('\n')
                
                # Look for a line that's likely the answer
                # (not the question, not empty, reasonably long)
                for line in lines:
                    line = line.strip()
                    if (len(line) > 30 and 
                        question[:20].lower() not in line.lower() and
                        line != last_text):
                        
                        # Check if this looks like an answer
                        if any(word in line.lower() for word in ['answer', 'is', '=', 'result', 'solution']):
                            print(f"✅ Found answer ({len(line)} chars)")
                            driver.quit()
                            return line
                        
                        # Or just take the longest new line
                        if len(line) > len(last_text):
                            last_text = line
                
                # If we found a substantial new line, use it
                if last_text and len(last_text) > 50:
                    print(f"✅ Using found text ({len(last_text)} chars)")
                    driver.quit()
                    return last_text
                    
            except Exception as e:
                print(f"   Error checking response: {e}")
            
            print(f"   Still thinking... ({i*3}s)")
        
        driver.quit()
        return last_text if last_text else "No clear response received"
        
    except Exception as e:
        print(f"❌ Error: {e}")
        driver.quit()
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("🧠 BRAIN BRIDGE")
        print("Usage: python3 tested_brain.py \"your question\"")
        print("")
        print("First authenticate: python3 /tmp/auth_brain.py")
        sys.exit(1)
    
    question = " ".join(sys.argv[1:])
    answer = brain(question)
    print(f"\n🤖 DEEPSEEK SAYS:\n{answer}")