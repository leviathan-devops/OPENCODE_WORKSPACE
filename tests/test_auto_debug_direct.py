#!/usr/bin/env python3
"""
Direct test of auto-debug functionality
"""

import os
import subprocess
import sys

# Set API key
os.environ['DEEPSEEK_API_KEY'] = "sk-e8e93e31b582423e9fdaa4ab8e9347e2"

def test_auto_debug_feature():
    """Test the auto-debug feature"""
    print("🔍 Testing Auto-Debug Feature")
    print("=" * 40)
    
    # Test normal advisory mode first
    print("🧠 Testing normal advisory mode...")
    result = subprocess.run([
        'python3', 'skills/deepseek-brain/run.py',
        'Analyze this simple code: print("hello world")'
    ], capture_output=True, text=True, cwd='/home/leviathan/OPENCODE_WORKSPACE/shark-agent')
    
    if result.returncode == 0:
        print("✅ Normal advisory mode working")
        print(f"Response preview: {result.stdout[:100]}...")
    else:
        print(f"❌ Normal advisory failed: {result.stderr}")
        return False
    
    # Test with error detection context
    print("\n🔧 Testing auto-debug context...")
    
    error_context = '''
I'm getting this error repeatedly:
ConnectionError: HTTPSConnectionPool(host='api.deepseek.com', port=443): Max retries exceeded with url: /chat/completions (Caused by NewConnectionError('<urllib3.connection.HTTPSConnection object at 0x7f8c12345678>: Failed to establish a new connection: [Errno 110] Connection timed out'))

This happens every time I try to call the DeepSeek API. The network connection seems unstable but I need to get my work done.
'''
    
    result = subprocess.run([
        'python3', 'skills/deepseek-brain/run.py', error_context
    ], capture_output=True, text=True, cwd='/home/leviathan/OPENCODE_WORKSPACE/shark-agent')
    
    if result.returncode == 0:
        print("✅ Advisory with error context working")
        print(f"Response length: {len(result.stdout)} characters")
        return True
    else:
        print(f"❌ Advisory with context failed: {result.stderr}")
        return False

def main():
    """Run auto-debug test"""
    print("🧠 DEEPSEEK BRAIN AUTO-DEBUG TESTING")
    print("=" * 40)
    
    success = test_auto_debug_feature()
    
    if success:
        print("\n🎉 Auto-debug feature test completed successfully!")
        return 0
    else:
        print("\n❌ Auto-debug feature test failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())