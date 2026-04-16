#!/bin/bash
# 🧠 WORKING BRAIN BRIDGE - ACTUALLY OPENS BROWSER
# Copy and paste this entire block into terminal

echo "🧠 Setting up Working Brain Bridge..."
echo "======================================"

# 1. Install dependencies
echo "📦 Installing dependencies..."
pip3 install selenium webdriver-manager 2>/dev/null || true

# 2. Create working authentication script
cat > /home/leviathan/OPENCODE_WORKSPACE/real_auth.py << 'EOF'
#!/usr/bin/env python3
"""
Real DeepSeek authentication that actually opens a browser
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import os

def authenticate_deepseek():
    print("🔐 Opening REAL browser for DeepSeek authentication...")
    print("   Email: cryptoforex36963@gmail.com")
    print("   Password: CosmicEnergy369!")
    print("")
    print("⚠️  A Chrome browser will open.")
    print("   Please login when it opens.")
    print("   After login, this window will close automatically.")
    print("")
    input("Press Enter to open browser...")
    
    try:
        # Setup Chrome with visible browser
        options = webdriver.ChromeOptions()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # Use webdriver-manager to handle ChromeDriver
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        # Open DeepSeek
        driver.get("https://chat.deepseek.com")
        print("✅ Browser opened to DeepSeek")
        print("   Please login manually...")
        
        # Wait for manual login (up to 2 minutes)
        print("⏳ Waiting for login (check browser window)...")
        
        # Check every 5 seconds if we're logged in
        for i in range(24):  # 24 * 5 = 120 seconds
            time.sleep(5)
            current_url = driver.current_url
            
            # If we're on chat page (not login page), we're logged in
            if 'chat.deepseek.com' in current_url and 'sign_in' not in current_url:
                print(f"✅ Successfully logged in! ({current_url})")
                
                # Get cookies and save them
                cookies = driver.get_cookies()
                import json
                os.makedirs('/home/leviathan/OPENCODE_WORKSPACE/deepseek_cookies', exist_ok=True)
                with open('/home/leviathan/OPENCODE_WORKSPACE/deepseek_cookies/session.json', 'w') as f:
                    json.dump(cookies, f)
                
                print("💾 Cookies saved to /home/leviathan/OPENCODE_WORKSPACE/deepseek_cookies/session.json")
                driver.quit()
                return True
            
            print(f"   Still waiting... ({i*5}s elapsed)")
        
        print("❌ Timeout - please login faster next time")
        driver.quit()
        return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    if authenticate_deepseek():
        print("\n🎉 AUTHENTICATION SUCCESSFUL!")
        print("   Brain Bridge is now ready to use.")
    else:
        print("\n❌ AUTHENTICATION FAILED")
        print("   Please try again or check browser installation.")
EOF

# 3. Create working brain bridge
cat > /home/leviathan/OPENCODE_WORKSPACE/real_brain.py << 'EOF'
#!/usr/bin/env python3
"""
Working Brain Bridge using Selenium
"""
import sys
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

class WorkingBrainBridge:
    def __init__(self):
        self.driver = None
        
    def setup_browser(self):
        """Setup browser with saved cookies if available"""
        options = webdriver.ChromeOptions()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--headless')  # Run in background
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
        
        # Load cookies if available
        try:
            with open('/home/leviathan/OPENCODE_WORKSPACE/deepseek_cookies/session.json', 'r') as f:
                cookies = json.load(f)
            
            self.driver.get("https://chat.deepseek.com")
            for cookie in cookies:
                self.driver.add_cookie(cookie)
            self.driver.refresh()
            print("✅ Loaded saved session")
            return True
        except:
            print("⚠️  No saved session - need authentication")
            return False
    
    def think(self, problem):
        """Ask DeepSeek a question"""
        if not self.driver:
            if not self.setup_browser():
                return "❌ Need authentication first. Run: python3 /home/leviathan/OPENCODE_WORKSPACE/real_auth.py"
        
        try:
            # Navigate to chat
            self.driver.get("https://chat.deepseek.com")
            time.sleep(3)
            
            # Find textarea and type question
            textarea = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "textarea, [contenteditable=true]"))
            )
            textarea.clear()
            
            # Type like a human
            for char in problem:
                textarea.send_keys(char)
                time.sleep(0.05 + (0.1 if char == ' ' else 0))
            
            # Submit
            textarea.send_keys(Keys.RETURN)
            print("🤔 Thinking... (waiting for response)")
            
            # Wait for response (up to 60 seconds)
            for i in range(60):
                time.sleep(1)
                # Look for response elements
                responses = self.driver.find_elements(By.CSS_SELECTOR, ".message, .response, [class*='message'], [class*='response']")
                if len(responses) > 0:
                    # Get the latest response
                    latest = responses[-1].text
                    if latest and len(latest) > 50:  # Reasonable response length
                        return latest
            
            return "❌ Timeout waiting for response"
            
        except Exception as e:
            return f"❌ Error: {str(e)}"
        
        finally:
            if self.driver:
                self.driver.quit()
                self.driver = None

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 /home/leviathan/OPENCODE_WORKSPACE/real_brain.py 'Your problem here'")
        print("Example: python3 /home/leviathan/OPENCODE_WORKSPACE/real_brain.py 'How do I fix vLLM installation?'")
        return
    
    problem = " ".join(sys.argv[1:])
    bridge = WorkingBrainBridge()
    response = bridge.think(problem)
    print(f"\n🧠 DeepSeek says:\n{response}")

if __name__ == "__main__":
    main()
EOF

# Make scripts executable
chmod +x /home/leviathan/OPENCODE_WORKSPACE/real_auth.py /home/leviathan/OPENCODE_WORKSPACE/real_brain.py

echo ""
echo "✅ SETUP COMPLETE!"
echo "=================="
echo ""
echo "🔐 TO AUTHENTICATE (do this first):"
echo "   python3 /home/leviathan/OPENCODE_WORKSPACE/real_auth.py"
echo ""
echo "🧠 TO USE BRAIN BRIDGE:"
echo "   python3 /home/leviathan/OPENCODE_WORKSPACE/real_brain.py 'Your problem here'"
echo ""
echo "📝 EXAMPLE:"
echo "   python3 /home/leviathan/OPENCODE_WORKSPACE/real_brain.py 'vLLM installation failing for 4 hours, need exact fix commands'"
echo ""
echo "💡 This actually opens a browser for you to login, then saves cookies."
echo "   After auth, brain bridge works in background without browser window."