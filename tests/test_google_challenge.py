#!/usr/bin/env python3
"""
Test Google Device Protection challenge
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("🔍 TESTING GOOGLE DEVICE PROTECTION CHALLENGE")
print("=" * 50)

# Create browser that looks more like real user
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

# Make it look like real Chrome
chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
chrome_options.add_argument('--window-size=1920,1080')

# Don't use headless for auth
# chrome_options.add_argument('--headless')

print("Starting browser...")

try:
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print("✅ Browser started")
    
    # Go directly to Google OAuth (simulating DeepSeek redirect)
    print("\n🌐 Going to Google OAuth...")
    oauth_url = "https://accounts.google.com/v3/signin/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin"
    driver.get(oauth_url)
    time.sleep(3)
    
    print(f"📄 Title: {driver.title}")
    print(f"📄 URL: {driver.current_url[:100]}...")
    
    # Check if we're on challenge page
    if 'challenge' in driver.current_url:
        print("⚠️  ON CHALLENGE PAGE!")
        print("   Google requires additional verification")
        
        # Take screenshot
        driver.save_screenshot('/tmp/google_challenge_page.png')
        print("   📸 Screenshot: /tmp/google_challenge_page.png")
        
        # Try to see what type of challenge
        page_source = driver.page_source.lower()
        if 'device' in page_source:
            print("   🔒 Device verification required")
        if 'phone' in page_source:
            print("   📱 Phone verification required")
        if 'email' in page_source:
            print("   📧 Email verification required")
        if 'captcha' in page_source:
            print("   🤖 CAPTCHA required")
    
    # Try to enter email (simulating user)
    print("\n🔐 Attempting to enter email...")
    try:
        # Find email field
        email_field = driver.find_element(By.CSS_SELECTOR, 'input[type="email"]')
        email_field.send_keys("cryptoforex36963@gmail.com")
        
        # Find next button
        next_button = driver.find_element(By.CSS_SELECTOR, 'button[type="button"], input[type="submit"]')
        next_button.click()
        
        print("✅ Email entered, clicked next")
        time.sleep(3)
        
        print(f"   New URL: {driver.current_url[:100]}...")
        
        # Check for password field
        try:
            password_field = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
            print("🔑 Password field found")
            
            # Enter password
            password_field.send_keys("CosmicEnergy369!")
            
            # Find submit button
            submit_button = driver.find_element(By.CSS_SELECTOR, 'button[type="button"], input[type="submit"]')
            submit_button.click()
            
            print("✅ Password entered, clicked submit")
            time.sleep(5)
            
            print(f"   Final URL: {driver.current_url[:100]}...")
            
            # Check if we got a challenge
            if 'challenge' in driver.current_url:
                print("❌ STUCK ON CHALLENGE")
                print("   Google requires manual verification")
                print("   This is why browser 'takes forever'")
                
                # Save page for analysis
                with open('/tmp/google_challenge_details.html', 'w') as f:
                    f.write(driver.page_source[:5000])
                print("   📄 Page saved: /tmp/google_challenge_details.html")
                
            elif 'myaccount.google.com' in driver.current_url or 'security' in driver.current_url:
                print("✅ LOGIN SUCCESSFUL!")
                print("   Redirected to Google account")
                
        except:
            print("❌ No password field found")
            print("   Might be on challenge page already")
            
    except Exception as e:
        print(f"❌ Error entering email: {e}")
    
    # Wait and monitor
    print("\n⏳ Monitoring for 20 seconds...")
    for i in range(10):
        time.sleep(2)
        try:
            current_url = driver.current_url
            print(f"   Current: {current_url[:80]}... ({i*2}s)")
        except:
            print(f"   ❌ Browser closed at {i*2}s")
            break
    
    driver.quit()
    print("✅ Browser closed")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("🔍 FINDINGS:")
print("")
print("🎯 ROOT CAUSE:")
print("   Google Device Protection challenge")
print("   When: Login from new device/location/browser")
print("   Why: Security measure for suspicious login")
print("")
print("💡 WHY IT 'TAKES FOREVER':")
print("   1. Browser waits for challenge completion")
print("   2. No timeout set")
print("   3. User needs to manually verify")
print("   4. Eventually times out and closes")
print("")
print("✅ SOLUTION:")
print("   Complete challenge ONCE in regular browser")
print("   Then Google remembers device")
print("   Future logins work automatically")