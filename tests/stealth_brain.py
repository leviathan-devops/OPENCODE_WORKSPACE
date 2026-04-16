#!/usr/bin/env python3
"""
STEALTH BRAIN BRIDGE - Avoids bot detection
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
    
    # Stealth mode - make browser look like real user
    chrome_options = Options()
    
    # Basic required args
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    # Stealth arguments to avoid bot detection
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # User agent and window size
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    chrome_options.add_argument('--window-size=1920,1080')
    
    # Use the saved profile
    chrome_options.add_argument('--user-data-dir=/tmp/chrome_brain')
    
    # Try WITHOUT headless first (might be getting blocked)
    # chrome_options.add_argument('--headless')  # Commented out - might trigger bot detection
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Go to DeepSeek with stealth
        print("🌐 Loading DeepSeek (stealth mode)...")
        driver.get("https://chat.deepseek.com")
        time.sleep(5)
        
        print(f"📄 Current URL: {driver.current_url}")
        
        # Check for blocking
        page_text = driver.page_source.lower()
        if 'cloudfront' in page_text or '403' in page_text or 'blocked' in page_text:
            print("❌ Blocked by CloudFront/WAF")
            print("   Trying different approach...")
            
            # Try with a different URL or approach
            driver.get("https://www.deepseek.com")
            time.sleep(3)
            driver.get("https://chat.deepseek.com")
            time.sleep(5)
        
        # Check if logged in
        if 'sign_in' in driver.current_url:
            print("❌ Not logged in or session expired")
            driver.quit()
            return "Need to re-authenticate"
        
        print("✅ On DeepSeek chat page")
        
        # Save screenshot to see what we're looking at
        driver.save_screenshot('/tmp/deepseek_view.png')
        print("📸 Screenshot saved to /tmp/deepseek_view.png")
        
        # Try to interact - DeepSeek might use different selectors
        print("🔍 Looking for chat input...")
        
        # Try multiple selectors with waits
        input_element = None
        selectors = [
            'div[contenteditable="true"]',
            'textarea',
            'input[type="text"]',
            '[role="textbox"]',
            '.chat-input',
            'div[class*="input"]',
            'div[class*="chat"]'
        ]
        
        for selector in selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    input_element = elements[-1]  # Last one is usually input
                    print(f"✅ Found with selector: {selector}")
                    break
            except:
                pass
        
        if not input_element:
            # Try JavaScript approach
            print("⚠️  Trying JavaScript approach...")
            try:
                # Try to find by tabindex or similar
                elements = driver.find_elements(By.CSS_SELECTOR, '[tabindex], [contenteditable]')
                if elements:
                    input_element = elements[-1]
                    print("✅ Found via tabindex/contenteditable")
            except:
                pass
        
        if not input_element:
            print("❌ Could not find input")
            # Save page for analysis
            with open('/tmp/deepseek_full.html', 'w') as f:
                f.write(driver.page_source[:10000])
            print("   Full page saved to /tmp/deepseek_full.html")
            driver.quit()
            return "Could not find input element"
        
        # Type question slowly (human-like)
        print("⌨️  Typing question...")
        input_element.clear()
        for char in question:
            input_element.send_keys(char)
            time.sleep(0.05)  # Human typing speed
        
        input_element.send_keys(Keys.RETURN)
        print("🤔 Waiting for response...")
        
        # Wait for response
        for i in range(15):
            time.sleep(4)
            
            # Check for response
            try:
                # Get all text
                all_text = driver.find_element(By.TAG_NAME, 'body').text
                lines = all_text.split('\n')
                
                # Look for new lines that might be responses
                new_lines = []
                for line in lines:
                    line = line.strip()
                    if (len(line) > 20 and 
                        question[:30].lower() not in line.lower() and
                        'deepseek' not in line.lower()):
                        new_lines.append(line)
                
                if new_lines:
                    # Get the longest new line (likely the answer)
                    answer = max(new_lines, key=len)
                    if len(answer) > 30:
                        print(f"✅ Got answer ({len(answer)} chars)")
                        driver.quit()
                        return answer
                        
            except Exception as e:
                print(f"   Error checking response: {e}")
            
            print(f"   Still waiting... ({i*4}s)")
        
        print("❌ Timeout - no response")
        driver.quit()
        return "No response received"
        
    except Exception as e:
        print(f"❌ Error: {e}")
        driver.quit()
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("🧠 STEALTH BRAIN BRIDGE")
        print("Usage: python3 stealth_brain.py \"your question\"")
        sys.exit(1)
    
    question = " ".join(sys.argv[1:])
    answer = brain(question)
    print(f"\n🤖 ANSWER:\n{answer}")