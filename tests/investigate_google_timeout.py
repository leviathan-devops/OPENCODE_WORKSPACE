#!/usr/bin/env python3
"""
Investigate why Google login takes forever and closes
"""
import time
import subprocess
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔍 INVESTIGATING GOOGLE LOGIN TIMEOUT")
print("=" * 50)

# Test 1: Check network connectivity to Google
print("\n1. 🌐 Testing network connectivity...")
google_test = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 'https://accounts.google.com'], 
                           capture_output=True, text=True, timeout=5)
print(f"   Google HTTP status: {google_test.stdout}")

# Test 2: Check DNS resolution
print("\n2. 🔍 Testing DNS resolution...")
dns_test = subprocess.run(['nslookup', 'accounts.google.com'], capture_output=True, text=True, timeout=5)
if 'Address:' in dns_test.stdout:
    print("   ✅ DNS working")
else:
    print("   ❌ DNS issues")

# Test 3: Create browser with timeout monitoring
print("\n3. 🧪 Creating browser with timeout test...")

chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-blink-features=AutomationControlled')
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

# Add logging
log_dir = '/tmp/chrome_debug'
os.makedirs(log_dir, exist_ok=True)
chrome_options.add_argument(f'--log-path={log_dir}/chrome_debug.log')
chrome_options.add_argument('--enable-logging')
chrome_options.add_argument('--v=1')

# Network logging
chrome_options.add_argument('--log-net-log=/tmp/chrome_netlog.json')
chrome_options.add_argument('--net-log-capture-mode=Default')

print("   Starting Chrome with full debugging...")

try:
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print("   ✅ Chrome started")
    print(f"   PID: {driver.service.process.pid}")
    
    # Navigate to DeepSeek
    print("\n4. 🌐 Navigating to DeepSeek...")
    start_time = time.time()
    driver.get("https://chat.deepseek.com")
    load_time = time.time() - start_time
    print(f"   Load time: {load_time:.2f}s")
    print(f"   Title: {driver.title}")
    print(f"   URL: {driver.current_url}")
    
    # Take screenshot
    driver.save_screenshot('/tmp/deepseek_before_login.png')
    print("   📸 Screenshot: /tmp/deepseek_before_login.png")
    
    # Check page content
    page_source = driver.page_source[:2000]
    print(f"   Page source preview: {page_source[:500]}...")
    
    # Look for Google login button
    if 'google' in page_source.lower() or 'sign in' in page_source.lower():
        print("   🔍 Google login button detected")
    
    # Simulate clicking Google login (but don't actually click)
    print("\n5. ⏳ Simulating Google login wait...")
    print("   (This tests what happens when you click)")
    
    # Get the Google OAuth URL from page
    import re
    google_urls = re.findall(r'https://accounts\.google\.com[^"\']+', page_source)
    if google_urls:
        print(f"   Found Google OAuth URL: {google_urls[0][:80]}...")
        
        # Test loading Google OAuth page
        print("   Testing Google OAuth page load...")
        try:
            driver.get(google_urls[0])
            time.sleep(5)
            print(f"   Google page title: {driver.title}")
            print(f"   Google page URL: {driver.current_url[:100]}...")
            
            # Check for timeout indicators
            google_page = driver.page_source.lower()
            if 'timeout' in google_page or 'loading' in google_page:
                print("   ⚠️  Timeout/loading indicators found")
            if 'suspicious' in google_page or 'bot' in google_page:
                print("   ❌ Bot detection triggered")
            
            driver.save_screenshot('/tmp/google_oauth_page.png')
            print("   📸 Screenshot: /tmp/google_oauth_page.png")
            
        except Exception as e:
            print(f"   ❌ Error loading Google: {e}")
    else:
        print("   ❌ No Google OAuth URL found in page")
    
    # Monitor for 30 seconds
    print("\n6. ⏳ Monitoring browser for 30 seconds...")
    for i in range(15):
        time.sleep(2)
        try:
            current_url = driver.current_url
            print(f"   Still alive: {current_url[:80]}... ({i*2}s)")
            
            # Check Chrome process
            ps_test = subprocess.run(['ps', '-p', str(driver.service.process.pid)], 
                                   capture_output=True, text=True)
            if str(driver.service.process.pid) not in ps_test.stdout:
                print(f"   ❌ Chrome process DIED at {i*2}s!")
                break
                
        except Exception as e:
            print(f"   ❌ Browser error at {i*2}s: {e}")
            break
    
    print("\n7. 📊 Checking logs...")
    if os.path.exists(f'{log_dir}/chrome_debug.log'):
        with open(f'{log_dir}/chrome_debug.log', 'r') as f:
            logs = f.read()[-5000:]  # Last 5KB
            if 'timeout' in logs.lower():
                print("   ⚠️  Timeout in logs")
            if 'killed' in logs.lower():
                print("   ❌ Process killed")
            if 'network' in logs.lower():
                print("   🌐 Network issues in logs")
    
    driver.quit()
    print("   ✅ Browser closed normally")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("🔍 POSSIBLE CAUSES OF FOREVER LOADING:")
print("   1. Network timeout to Google servers")
print("   2. DNS resolution issues")
print("   3. Google anti-bot delaying response")
print("   4. Browser configuration blocking redirects")
print("   5. Missing required headers/cookies")
print("")
print("💡 NEXT TESTS:")
print("   - Test manual login in regular browser")
print("   - Compare network traffic")
print("   - Check firewall/network restrictions")