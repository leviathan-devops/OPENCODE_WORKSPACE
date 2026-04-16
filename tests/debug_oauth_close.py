#!/usr/bin/env python3
"""
Debug why browser closes during Google OAuth
"""
import time
import os
import subprocess
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔍 DEBUGGING BROWSER CLOSE DURING GOOGLE OAUTH")
print("=" * 50)

# Test 1: Check Chrome processes
print("\n1. 🖥️  Checking Chrome processes...")
result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
chrome_processes = [line for line in result.stdout.split('\n') if 'chrome' in line.lower() and 'grep' not in line]
print(f"   Found {len(chrome_processes)} Chrome processes")

# Test 2: Create minimal browser with logging
print("\n2. 🧪 Creating minimal browser test...")

# Create temp dir for logs
log_dir = '/tmp/chrome_logs'
os.makedirs(log_dir, exist_ok=True)

chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

# Add logging
chrome_options.add_argument(f'--log-path={log_dir}/chrome.log')
chrome_options.add_argument('--enable-logging')
chrome_options.add_argument('--v=1')

# Stealth options
chrome_options.add_argument('--disable-blink-features=AutomationControlled')
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

# User agent
chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

# Window size
chrome_options.add_argument('--window-size=1920,1080')

# Don't run headless for auth
# chrome_options.add_argument('--headless')

print("   Starting Chrome with stealth options...")

try:
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print("   ✅ Chrome started")
    print(f"   Session ID: {driver.session_id}")
    
    # Navigate to DeepSeek
    print("\n3. 🌐 Navigating to DeepSeek...")
    driver.get("https://chat.deepseek.com")
    time.sleep(3)
    
    print(f"   Title: {driver.title}")
    print(f"   URL: {driver.current_url}")
    
    # Take screenshot
    driver.save_screenshot('/tmp/deepseek_before_auth.png')
    print("   📸 Screenshot: /tmp/deepseek_before_auth.png")
    
    # Check page content
    page_source = driver.page_source[:1000]
    if 'google' in page_source.lower():
        print("   🔍 Google OAuth button detected")
    
    # Monitor browser for 30 seconds
    print("\n4. ⏳ Monitoring browser for 30 seconds...")
    print("   (This simulates waiting for you to click login)")
    
    initial_pid = driver.service.process.pid if hasattr(driver.service, 'process') else 'unknown'
    print(f"   Chrome PID: {initial_pid}")
    
    for i in range(15):
        time.sleep(2)
        
        # Check if browser still alive
        try:
            # Try to get current URL (will fail if browser closed)
            current_url = driver.current_url
            print(f"   Still alive: {current_url[:80]}... ({i*2}s)")
            
            # Check Chrome processes
            result = subprocess.run(['ps', '-p', str(initial_pid)], capture_output=True, text=True)
            if str(initial_pid) not in result.stdout:
                print(f"   ❌ Chrome process {initial_pid} DIED!")
                break
                
        except Exception as e:
            print(f"   ❌ Browser error: {e}")
            break
    
    print("\n5. 📊 Checking logs...")
    if os.path.exists(f'{log_dir}/chrome.log'):
        with open(f'{log_dir}/chrome.log', 'r') as f:
            logs = f.read()
            if 'killed' in logs.lower() or 'crash' in logs.lower():
                print("   ❌ Chrome was killed/crashed")
            if 'bot' in logs.lower() or 'automation' in logs.lower():
                print("   ⚠️  Bot/automation detection in logs")
    
    driver.quit()
    print("   ✅ Browser closed normally")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("🔍 LIKELY REASONS FOR RANDOM CLOSE:")
print("   1. Google OAuth anti-bot detection")
print("   2. Chrome flags triggering automation detection")
print("   3. Process killed by system (memory/security)")
print("   4. Network/timeout issues")
print("")
print("💡 SOLUTIONS TO TEST:")
print("   A. Use different browser (Firefox)")
print("   B. Use real Chrome profile (not automated)")
print("   C. Manual auth + cookie export")
print("   D. Use API if available")