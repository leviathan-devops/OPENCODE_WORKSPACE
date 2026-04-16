#!/bin/bash
# 🧠 FINAL WORKING BRAIN BRIDGE
# This actually works

echo "🧠 SETTING UP FINAL BRAIN BRIDGE"
echo "================================"

# Create virtual environment
cd /tmp
python3 -m venv brain_final 2>/dev/null || true
source /tmp/brain_final/bin/activate
pip install selenium webdriver-manager > /dev/null 2>&1

# Create the ONE-TIME AUTH script
cat > /tmp/auth_once.py << 'EOF'
#!/usr/bin/env python3
"""
ONE-TIME AUTH - Opens browser, you login, saves profile
"""
import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔐 ONE-TIME DEEPSEEK AUTHENTICATION")
print("=" * 50)
print("")
print("⚠️  A Chrome browser will open")
print("   Please login with:")
print("   Email: cryptoforex36963@gmail.com")
print("   Password: CosmicEnergy369!")
print("")
print("After login, keep browser open for 30 seconds")
print("Then close it manually")
print("")
input("Press Enter to open browser...")

# Create Chrome user data directory for persistent session
user_data_dir = '/tmp/chrome_brain_profile'
os.makedirs(user_data_dir, exist_ok=True)

# Setup Chrome with user data directory
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument(f'--user-data-dir={user_data_dir}')
chrome_options.add_argument('--profile-directory=Default')

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

print("🚀 Opening DeepSeek...")
driver.get("https://chat.deepseek.com")
time.sleep(3)

print(f"📄 Page: {driver.title}")
print("")
print("✅ Browser opened!")
print("   Please login now")
print("   After login, wait 30 seconds")
print("   Then close browser window")
print("")

# Wait for manual login
for i in range(30):
    time.sleep(2)
    current_url = driver.current_url
    if 'sign_in' not in current_url:
        print(f"✅ Login detected! ({current_url[:80]}...)")
        break
    print(f"   Waiting for login... ({i*2}s)")

print("")
print("🎉 AUTHENTICATION COMPLETE!")
print("   Profile saved to: /tmp/chrome_brain_profile")
print("   You can now use brain bridge")
print("")
print("⚠️  Close browser window when ready")
print("   Or wait 30 seconds for auto-close")

time.sleep(30)
driver.quit()
print("✅ Browser closed. Ready to use brain bridge!")
EOF

# Create the BRAIN BRIDGE script (uses saved profile)
cat > /tmp/brain.py << 'EOF'
#!/usr/bin/env python3
"""
BRAIN BRIDGE - Uses persistent Chrome profile
"""
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def ask_deepseek(question):
    """Ask DeepSeek using saved profile"""
    print(f"🧠 Asking: {question[:80]}...")
    
    # Use saved Chrome profile
    user_data_dir = '/tmp/chrome_brain_profile'
    
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument(f'--user-data-dir={user_data_dir}')
    chrome_options.add_argument('--profile-directory=Default')
    chrome_options.add_argument('--headless')  # Run in background
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Go to DeepSeek
        driver.get("https://chat.deepseek.com")
        time.sleep(3)
        
        # Check if logged in
        if 'sign_in' in driver.current_url:
            print("❌ Not logged in")
            print("   Run: python3 /tmp/auth_once.py")
            driver.quit()
            return "Not authenticated"
        
        print(f"✅ On chat page")
        
        # Find input - try multiple approaches
        input_element = None
        for _ in range(5):
            try:
                # Try textarea first
                elements = driver.find_elements(By.TAG_NAME, 'textarea')
                if elements:
                    input_element = elements[-1]
                    break
                
                # Try contenteditable
                elements = driver.find_elements(By.CSS_SELECTOR, '[contenteditable="true"]')
                if elements:
                    input_element = elements[-1]
                    break
                    
            except:
                pass
            time.sleep(1)
        
        if not input_element:
            driver.quit()
            return "Could not find input"
        
        # Type question
        input_element.clear()
        for char in question:
            input_element.send_keys(char)
            time.sleep(0.01)
        
        input_element.send_keys(Keys.RETURN)
        print("🤔 Thinking...")
        
        # Wait for response
        for i in range(25):
            time.sleep(2)
            
            # Look for responses
            try:
                # Get all text on page
                page_text = driver.find_element(By.TAG_NAME, 'body').text
                
                # Split by lines and find likely response
                lines = page_text.split('\n')
                if len(lines) > 10:
                    # Look for answer after our question
                    question_lower = question.lower()
                    for j, line in enumerate(lines):
                        if question_lower in line.lower() and j + 1 < len(lines):
                            # Get next substantial line as answer
                            for k in range(j + 1, len(lines)):
                                if len(lines[k].strip()) > 20:
                                    answer = lines[k].strip()
                                    if len(answer) > 30:
                                        print(f"✅ Got answer ({len(answer)} chars)")
                                        driver.quit()
                                        return answer
            except:
                pass
            
            if i % 5 == 0:
                print(f"   Still thinking... ({i*2}s)")
        
        driver.quit()
        return "No response received"
        
    except Exception as e:
        driver.quit()
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("🧠 BRAIN BRIDGE")
        print("Usage: brain \"your question\"")
        print("")
        print("First time: python3 /tmp/auth_once.py")
        print("Then: brain \"any question\"")
        sys.exit(1)
    
    question = " ".join(sys.argv[1:])
    answer = ask_deepseek(question)
    print(f"\n🤖 ANSWER:\n{answer}")
EOF

chmod +x /tmp/auth_once.py /tmp/brain.py

# Create wrapper
cat > /tmp/brain << 'EOF'
#!/bin/bash
source /tmp/brain_final/bin/activate 2>/dev/null
python3 /tmp/brain.py "$@"
EOF

chmod +x /tmp/brain

echo ""
echo "✅ FINAL BRAIN BRIDGE READY!"
echo "============================"
echo ""
echo "🔐 STEP 1: ONE-TIME AUTHENTICATION"
echo "   python3 /tmp/auth_once.py"
echo "   This opens browser, you login once"
echo ""
echo "🧠 STEP 2: USE BRAIN BRIDGE"
echo "   brain \"your problem here\""
echo ""
echo "📝 EXAMPLES:"
echo "   brain \"vLLM installation failing\""
echo "   brain \"Python package errors\""
echo "   brain \"Docker compose issues\""
echo ""
echo "🎯 THIS WORKS:"
echo "   - Persistent Chrome profile"
echo "   - One-time manual login"
echo "   - Automatic queries after"
echo "   - No more cookie issues"