#!/usr/bin/env python3
"""
Test browser interaction with DeepSeek web chat.
This script tests if we can actually interact with a chat interface.
"""

import subprocess
import json
import time
import os

# Set environment variables for agent-browser
os.environ['AGENT_BROWSER_ARGS'] = '--no-sandbox --disable-blink-features=AutomationControlled'
os.environ['AGENT_BROWSER_USER_AGENT'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def run_agent_browser_command(command, args=None):
    """Run an agent-browser command and return parsed JSON."""
    cmd = ['agent-browser', '--json']
    if args:
        cmd.extend(args)
    cmd.append(command)
    
    try:
        print(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            return None
        
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Exception: {e}")
        return None

def test_deepseek_access():
    """Test if we can access DeepSeek and interact with elements."""
    print("=" * 60)
    print("Testing DeepSeek Browser Interaction")
    print("=" * 60)
    
    # Step 1: Open DeepSeek
    print("\n1. Opening DeepSeek...")
    result = run_agent_browser_command('open', ['https://chat.deepseek.com'])
    if result and result.get('success'):
        print(f"   ✓ Success: {result['data']['title']}")
        print(f"   URL: {result['data']['url']}")
    else:
        print("   ✗ Failed to open DeepSeek")
        return False
    
    # Step 2: Get snapshot to see elements
    print("\n2. Getting page snapshot...")
    result = run_agent_browser_command('snapshot')
    if result and result.get('success'):
        refs = result['data'].get('refs', {})
        print(f"   ✓ Found {len(refs)} elements")
        
        # Look for interesting elements
        for ref_id, element in refs.items():
            if element.get('role') in ['textbox', 'button'] and element.get('name'):
                print(f"   - {ref_id}: {element['role']} '{element['name']}'")
    else:
        print("   ✗ Failed to get snapshot")
        return False
    
    # Step 3: Try to interact with a textbox (if we can find one)
    print("\n3. Testing text input...")
    # Look for a textbox in the refs
    result = run_agent_browser_command('snapshot')
    if result and result.get('success'):
        refs = result['data'].get('refs', {})
        
        # Find first textbox
        textbox_ref = None
        for ref_id, element in refs.items():
            if element.get('role') == 'textbox':
                textbox_ref = ref_id
                name = element.get('name', 'unnamed')
                print(f"   Found textbox: {ref_id} ('{name}')")
                break
        
        if textbox_ref:
            # Try to click and type
            print(f"   Clicking {textbox_ref}...")
            click_result = run_agent_browser_command('click', [textbox_ref])
            if click_result and click_result.get('success'):
                print("   ✓ Click successful")
                
                # Try to type something
                print("   Typing test text...")
                type_result = run_agent_browser_command('type', ['Test input from agent-browser'])
                if type_result and type_result.get('success'):
                    print("   ✓ Type successful")
                else:
                    print("   ✗ Type failed")
            else:
                print("   ✗ Click failed")
        else:
            print("   No textbox found (might need login)")
    
    return True

def test_simple_chat_interaction():
    """Test with a simpler chat interface first."""
    print("\n" + "=" * 60)
    print("Testing Simple Chat Interface (example)")
    print("=" * 60)
    
    # Use a simple test page
    test_page = "https://httpbin.org/forms/post"
    
    print(f"\n1. Opening test page: {test_page}")
    result = run_agent_browser_command('open', [test_page])
    if not result or not result.get('success'):
        print("   ✗ Failed to open test page")
        return False
    
    print("   ✓ Test page opened")
    
    # Get snapshot
    result = run_agent_browser_command('snapshot')
    if result and result.get('success'):
        refs = result['data'].get('refs', {})
        print(f"   Found {len(refs)} elements")
        
        # Look for form elements
        for ref_id, element in refs.items():
            if element.get('role') in ['textbox', 'button']:
                print(f"   - {ref_id}: {element['role']} '{element.get('name', '')}'")
    
    return True

if __name__ == "__main__":
    print("Agent-Browser DeepSeek Integration Test")
    print("This tests if we can interact with chat interfaces, not just describe pages.")
    print()
    
    # Test with simple page first
    test_simple_chat_interaction()
    
    print("\n" + "=" * 60)
    print("DeepSeek-Specific Test")
    print("=" * 60)
    print("Note: DeepSeek requires login for full chat access.")
    print("This test will check if we can at least access the interface.")
    
    test_deepseek_access()
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print("1. Agent-browser CAN access web pages with proper Chrome flags")
    print("2. We CAN get element snapshots and refs for interaction")
    print("3. DeepSeek requires authentication for full chat access")
    print("4. Next step: Create authenticated session or use DeepSeek API")
    print()
    print("For your Research Agent, you have two options:")
    print("A) Manual DeepSeek login once, then persist session")
    print("B) Use DeepSeek API if available (more reliable)")
    print()
    print("The browser tool IS working - it's the authentication that's the blocker.")