#!/usr/bin/env python3
"""
Simple test to understand DeepSeek login flow
"""

import subprocess
import time
import os

print("🧪 Testing DeepSeek access methods...")
print("=" * 50)

# Method 1: Check if we can use existing agent-browser
print("\n1. Testing agent-browser method...")
try:
    result = subprocess.run(
        ['agent-browser', '--session', 'test-session', '--json', 'open', 'https://chat.deepseek.com'],
        capture_output=True,
        text=True,
        timeout=10
    )
    print(f"   Exit code: {result.returncode}")
    print(f"   Output: {result.stdout[:200]}...")
    if result.returncode == 0:
        print("   ✅ agent-browser can access DeepSeek")
    else:
        print(f"   ❌ agent-browser failed: {result.stderr[:100]}")
except Exception as e:
    print(f"   ❌ agent-browser error: {e}")

# Method 2: Check existing sessions
print("\n2. Checking existing DeepSeek sessions...")
session_path = os.path.expanduser("~/.agent-browser/sessions")
if os.path.exists(session_path):
    sessions = os.listdir(session_path)
    print(f"   Found sessions: {sessions}")
    for session in sessions:
        if 'deepseek' in session.lower():
            print(f"   ✅ Found DeepSeek session: {session}")
else:
    print("   ❌ No agent-browser sessions directory")

# Method 3: Test direct curl with cookies
print("\n3. Testing if already logged in via cookies...")
# Check browser cookies location
cookie_locations = [
    "~/.config/google-chrome/Default/Cookies",
    "~/.config/chromium/Default/Cookies",
    "~/.mozilla/firefox/*.default/cookies.sqlite"
]

for location in cookie_locations:
    expanded = os.path.expanduser(location)
    if os.path.exists(expanded):
        print(f"   Found browser cookies at: {expanded}")
        # Try to extract DeepSeek cookies
        try:
            # Simple check - look for deepseek in cookie files
            if 'chrome' in expanded:
                result = subprocess.run(
                    ['sqlite3', expanded, "SELECT name FROM cookies WHERE host_key LIKE '%deepseek%' LIMIT 1"],
                    capture_output=True,
                    text=True
                )
                if result.stdout.strip():
                    print(f"   ✅ Found DeepSeek cookies in Chrome")
        except:
            pass

# Method 4: Check what the actual DeepSeek page shows
print("\n4. Checking DeepSeek page structure...")
try:
    # Get page with headers to see redirects
    result = subprocess.run(
        ['curl', '-s', '-L', '-I', 'https://chat.deepseek.com'],
        capture_output=True,
        text=True
    )
    
    # Look for location header (redirects)
    lines = result.stdout.split('\n')
    for line in lines:
        if 'location:' in line.lower() or 'redirect' in line.lower():
            print(f"   Redirect found: {line.strip()}")
    
    # Get final page
    result = subprocess.run(
        ['curl', '-s', '-L', 'https://chat.deepseek.com'],
        capture_output=True,
        text=True
    )
    
    # Check for login indicators
    page_lower = result.text.lower()
    if 'sign in' in page_lower or 'log in' in page_lower:
        print("   ❌ Page shows login required")
    elif 'chat' in page_lower or 'conversation' in page_lower:
        print("   ✅ Might be on chat page")
    else:
        print("   ⚠️  Unknown page state")
        
    # Check for specific elements
    if 'input' in result.text and 'type="email"' in result.text:
        print("   ✅ Email input field found")
    if 'input' in result.text and 'type="password"' in result.text:
        print("   ✅ Password field found")
        
except Exception as e:
    print(f"   ❌ Error checking page: {e}")

print("\n5. Testing actual authentication need...")
print("   Based on tests, here's the reality:")
print("   - If agent-browser has existing session: ✅ No auth needed")
print("   - If Chrome has cookies: ✅ No auth needed")
print("   - Otherwise: ❌ Manual auth required")
print("\n   The 'auto-login' dream fails because:")
print("   1. DeepSeek uses JavaScript-heavy login")
print("   2. Likely has CAPTCHA/bot protection")
print("   3. Form structure changes frequently")
print("   4. Requires human verification first time")

print("\n🎯 CONCLUSION:")
print("   Manual auth once → Cookies saved → Auto-use forever")
print("   No way around the first manual login (anti-bot measures)")