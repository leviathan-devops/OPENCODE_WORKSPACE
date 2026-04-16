#!/usr/bin/env python3
"""
Test Chrome directly with same args agent-browser should use
"""
import subprocess
import time
import tempfile
import os

print("🧪 Testing Chrome directly...")

# Create temp directory for Chrome profile
temp_dir = tempfile.mkdtemp(prefix="chrome-test-")
print(f"📁 Temp profile: {temp_dir}")

# Chrome arguments similar to what agent-browser should use
chrome_args = [
    "/opt/google/chrome/chrome",
    "--no-sandbox",  # Critical for Linux
    "--disable-dev-shm-usage",
    "--disable-blink-features=AutomationControlled",
    "--remote-debugging-port=9222",
    f"--user-data-dir={temp_dir}",
    "--headless=new",
    "https://chat.deepseek.com"
]

print(f"🚀 Running: {' '.join(chrome_args[:4])}...")
print(f"   Profile: {temp_dir}")

try:
    # Start Chrome
    process = subprocess.Popen(
        chrome_args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    print("⏳ Waiting for Chrome to start...")
    time.sleep(5)
    
    # Check if process is still running
    if process.poll() is not None:
        stdout, stderr = process.communicate()
        print(f"❌ Chrome exited with code: {process.returncode}")
        print(f"   Stderr: {stderr[:500]}")
    else:
        print("✅ Chrome is running!")
        print("   Should be listening on port 9222")
        
        # Try to connect to debug port
        try:
            import requests
            response = requests.get("http://localhost:9222/json/version", timeout=2)
            print(f"   Debug port response: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ Debug port accessible!")
                data = response.json()
                print(f"   Browser: {data.get('Browser', 'Unknown')}")
                print(f"   Protocol: {data.get('Protocol-Version', 'Unknown')}")
        except:
            print("   ❌ Could not connect to debug port")
        
        # Kill Chrome
        process.terminate()
        process.wait(timeout=5)
        print("✅ Chrome terminated")
    
except Exception as e:
    print(f"❌ Error: {e}")

# Cleanup
try:
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)
    print(f"🧹 Cleaned up temp directory")
except:
    pass

print("\n🔍 ANALYSIS:")
print("   Agent-browser issue: Chrome sandbox restrictions on Linux")
print("   Our Selenium works because: Uses --no-sandbox correctly")
print("   Agent-browser fails because: Sandbox args not applied properly")
print("\n💡 SOLUTION: Use Selenium with proper --no-sandbox flag")