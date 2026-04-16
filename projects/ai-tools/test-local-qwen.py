#!/usr/bin/env python3
import os
import sys
import subprocess

# Test the actual qwen-local command and capture what API it tries to use
print("🧪 Testing actual API endpoint usage...")

# Test with qwen-local using a simple command that will show the API being called
try:
    result = subprocess.run([
        'qwen-local', 'echo "test local connection"'
    ], capture_output=True, text=True, timeout=10)
    
    print("STDOUT:", result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    print("Return code:", result.returncode)
    
except subprocess.TimeoutExpired:
    print("❌ Command timed out - might be trying GLM API")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n🔍 Verifying local server is accessible:")
try:
    result = subprocess.run([
        'curl', '-s', 'http://localhost:8001/v1/models'
    ], capture_output=True, text=True, timeout=5)
    
    if result.returncode == 0:
        print("✅ Local server accessible")
        print("Models available:", result.stdout)
    else:
        print("❌ Local server not accessible")
        
except Exception as e:
    print(f"❌ Local server test failed: {e}")