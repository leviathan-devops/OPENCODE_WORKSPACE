#!/bin/bash
# 🧠 CLEAN HEADLESS SOLUTION - NO BROWSER WINDOWS
echo "🧠 CREATING HEADLESS BRAIN BRIDGE"
echo "================================="
echo ""

# Kill any existing Chrome processes
pkill -f chrome 2>/dev/null || true
echo "✅ Killed any stray Chrome processes"

# Create clean environment
cd /tmp
rm -rf brain_clean 2>/dev/null || true
python3 -m venv brain_clean
source /tmp/brain_clean/bin/activate
pip install selenium webdriver-manager > /dev/null 2>&1

# Create HEADLESS brain bridge
cat > /tmp/brain_clean.py << 'EOF'
#!/usr/bin/env python3
"""
CLEAN HEADLESS BRAIN BRIDGE - No browser windows
"""
import sys
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

# Kill Chrome processes before starting
subprocess.run(['pkill', '-f', 'chrome'], stderr=subprocess.DEVNULL)

COOKIE_FILE = '/tmp/deepseek_cookies.json'

def think(question):
    """HEADLESS thinking - no browser windows"""
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--headless=new')  # HEADLESS - NO WINDOWS
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-software-rasterizer')
    chrome_options.add_argument('--no-first-run')
    chrome_options.add_argument('--no-default-browser-check')
    chrome_options.add_argument('--disable-extensions')
    
    # Reduce logging
    chrome_options.add_argument('--log-level=3')
    chrome_options.add_argument('--silent')
    
    service = Service(ChromeDriverManager().install())
    
    try:
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Set page load timeout
        driver.set_page_load_timeout(30)
        
        # Load page
        driver.get("https://chat.deepseek.com")
        time.sleep(2)
        
        # Load cookies if available
        if os.path.exists(COOKIE_FILE):
            try:
                with open(COOKIE_FILE, 'r') as f:
                    cookies = json.load(f)
                for cookie in cookies:
                    try:
                        driver.add_cookie(cookie)
                    except:
                        pass
                driver.refresh()
                time.sleep(3)
            except:
                pass
        
        # Check auth
        if 'sign_in' in driver.current_url:
            driver.quit()
            return "🔐 AUTH_REQUIRED: Need cookies from manual login"
        
        # Ask question
        try:
            input_elem = driver.find_element(By.CSS_SELECTOR, 'div[contenteditable="true"], textarea')
            input_elem.send_keys(question)
            input_elem.send_keys(Keys.RETURN)
            time.sleep(10)  # Wait for response
            
            # Get response
            responses = driver.find_elements(By.CSS_SELECTOR, '.markdown, .prose, [class*="message"]')
            if responses:
                answer = responses[-1].text
                driver.quit()
                return answer
            else:
                driver.quit()
                return "⏳ No response received"
                
        except Exception as e:
            driver.quit()
            return f"❌ Error: {str(e)}"
            
    except Exception as e:
        return f"❌ Browser error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("🧠 Headless Brain Bridge")
        print("Usage: brain \"question\"")
        sys.exit(1)
    
    question = " ".join(sys.argv[1:])
    answer = think(question)
    print(answer)
EOF

# Create simple setup
cat > /tmp/setup_clean.md << 'EOF'
# 🧠 HEADLESS BRAIN BRIDGE SETUP

## NO BROWSER WINDOWS - COMPLETELY HEADLESS

### 1. ONE-TIME MANUAL SETUP:
```bash
# In your REGULAR browser (NOT automated):
# 1. Go to: https://chat.deepseek.com
# 2. Login with Google
# 3. Complete all security steps
# 4. Export cookies with "Cookie Editor" extension
# 5. Save as: ~/Downloads/deepseek_cookies.json
```

### 2. LOAD COOKIES:
```bash
cp ~/Downloads/deepseek_cookies.json /tmp/deepseek_cookies.json
```

### 3. USE BRAIN BRIDGE:
```bash
/tmp/brain "your question here"
```

### 4. EXAMPLE:
```bash
/tmp/brain "What is 2+2?"
/tmp/brain "Help me debug Python code"
/tmp/brain "Explain quantum computing"
```

## 🎯 FEATURES:
- ✅ NO browser windows (completely headless)
- ✅ One-time manual auth
- ✅ Works forever with cookies
- ✅ Simple question → answer interface
- ✅ Perfect for agents/automation
```

# Create wrapper
cat > /tmp/brain << 'EOF'
#!/bin/bash
# Kill any Chrome processes first
pkill -f chrome 2>/dev/null || true
source /tmp/brain_clean/bin/activate 2>/dev/null
python3 /tmp/brain_clean.py "$@"
EOF

chmod +x /tmp/brain_clean.py /tmp/brain

echo ""
echo "✅ HEADLESS BRAIN BRIDGE CREATED!"
echo "================================="
echo ""
echo "📋 SETUP:"
echo "   cat /tmp/setup_clean.md"
echo ""
echo "🧪 TEST (NO BROWSER WINDOWS):"
echo "   /tmp/brain \"What is 2+2?\""
echo ""
echo "🔧 FILES:"
echo "   /tmp/brain_clean.py - Headless brain bridge"
echo "   /tmp/brain         - Wrapper command"
echo "   /tmp/setup_clean.md - Setup instructions"
echo ""
echo "🎯 NO BROWSER WINDOWS - COMPLETELY HEADLESS"
echo "   Uses: --headless=new flag"
echo "   Kills stray Chrome processes"
echo "   Clean operation"