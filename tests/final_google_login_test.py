#!/usr/bin/env python3
"""
FINAL TEST: Try actual Google login with ultimate stealth
"""
import time
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔐 FINAL GOOGLE LOGIN TEST")
print("=" * 50)

# Kill Chrome
subprocess.run(['pkill', '-f', 'chrome'], stderr=subprocess.DEVNULL)
time.sleep(2)

# Use the working stealth config from earlier test
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

# Real profile
user_data_dir = '/tmp/chrome_final_test'
chrome_options.add_argument(f'--user-data-dir={user_data_dir}')
chrome_options.add_argument('--profile-directory=Default')

# Remove automation
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

# Real browser
chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
chrome_options.add_argument('--window-size=1920,1080')

# Anti-detection
chrome_options.add_argument('--disable-blink-features=AutomationControlled')

print("Starting browser...")

try:
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print("✅ Browser started")
    
    # Go directly to Google OAuth (simulating DeepSeek redirect)
    print("\n🌐 Going to Google OAuth directly...")
    oauth_url = "https://accounts.google.com/v3/signin/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin"
    driver.get(oauth_url)
    time.sleep(5)
    
    print(f"📄 Title: {driver.title}")
    print(f"📄 URL: {driver.current_url[:100]}...")
    
    # Check for security warning
    page_source = driver.page_source.lower()
    if 'controlled by automated test' in page_source:
        print("❌ AUTOMATION WARNING PRESENT")
        print("   Google still detecting automation")
        
        # Save the warning page
        with open('/tmp/google_warning_page.html', 'w') as f:
            f.write(driver.page_source[:3000])
        print("📄 Warning page saved")
        
    elif 'couldn\'t sign you in' in page_source or 'not secure' in page_source:
        print("❌ SECURITY BLOCK PRESENT")
        print("   Google blocking login")
        
    else:
        print("✅ NO SECURITY WARNINGS DETECTED")
        print("   Page looks clean")
        
        # Try to login
        print("\n🔐 Attempting login...")
        
        try:
            # Find email field
            email_field = driver.find_element(By.CSS_SELECTOR, 'input[type="email"]')
            print("✅ Found email field")
            
            # Enter email
            email_field.send_keys("cryptoforex36963@gmail.com")
            
            # Find next button
            next_button = driver.find_element(By.CSS_SELECTOR, 'button[type="button"], input[type="submit"]')
            next_button.click()
            
            print("✅ Email entered, clicked next")
            time.sleep(5)
            
            print(f"   New URL: {driver.current_url[:100]}...")
            
            # Check if we got security block after email
            new_page = driver.page_source.lower()
            if 'not secure' in new_page or 'couldn\'t sign' in new_page:
                print("❌ SECURITY BLOCK AFTER EMAIL")
                print("   Google detected automation at login step")
            else:
                print("✅ No security block after email")
                
                # Try password
                try:
                    password_field = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
                    print("✅ Found password field")
                    
                    # Enter password
                    password_field.send_keys("CosmicEnergy369!")
                    
                    # Find submit
                    submit_button = driver.find_element(By.CSS_SELECTOR, 'button[type="button"], input[type="submit"]')
                    submit_button.click()
                    
                    print("✅ Password entered, clicked submit")
                    time.sleep(5)
                    
                    print(f"   Final URL: {driver.current_url[:100]}...")
                    
                    # Check final state
                    final_page = driver.page_source.lower()
                    if 'welcome' in final_page or 'myaccount' in final_page:
                        print("🎉 LOGIN SUCCESSFUL!")
                        print("   Google OAuth works with automation")
                    elif 'challenge' in final_page:
                        print("⚠️  Security challenge required")
                        print("   Need additional verification")
                    else:
                        print(f"⚠️  Unknown final state")
                        
                except:
                    print("❌ No password field (might be on challenge page)")
                    
        except Exception as e:
            print(f"❌ Login error: {e}")
    
    # Save final screenshot
    driver.save_screenshot('/tmp/google_login_final_test.png')
    print("\n📸 Screenshot: /tmp/google_login_final_test.png")
    
    # Keep browser open
    print("\n⏳ Keeping browser open for inspection...")
    print("   Check what you see in the browser window")
    time.sleep(15)
    
    driver.quit()
    print("✅ Browser closed")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("🎯 TEST RESULTS:")
print("")
print("If login worked without 'not secure' warning:")
print("   ✅ Google OAuth works with automation")
print("   ✅ Can automate complete DeepSeek login")
print("   ✅ Brain bridge is possible")
print("")
print("If 'not secure' warning appears:")
print("   ❌ Google detects and blocks automation")
print("   ❌ Need manual auth in REAL browser")
print("   ❌ Then export cookies for automation")
print("")
print("🚀 TELL ME WHAT HAPPENED IN THE BROWSER WINDOW")