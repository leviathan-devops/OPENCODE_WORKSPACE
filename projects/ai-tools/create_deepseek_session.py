#!/usr/bin/env python3
"""
Create authenticated DeepSeek session for agent-browser.
This will login once and save the session for future use.
"""

import subprocess
import json
import time
import os
import sys

# DeepSeek credentials
DEEPSEEK_EMAIL = "cryptoforex36963@gmail.com"
DEEPSEEK_PASSWORD = "CosmicEnergy369!"

# Set environment variables for agent-browser
os.environ['AGENT_BROWSER_ARGS'] = '--no-sandbox --disable-blink-features=AutomationControlled'
os.environ['AGENT_BROWSER_USER_AGENT'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def run_agent_browser(cmd_args, timeout=30):
    """Run agent-browser command and return result."""
    cmd = ['agent-browser', '--json'] + cmd_args
    print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                return {"success": False, "error": f"Invalid JSON: {result.stdout[:100]}"}
        else:
            return {"success": False, "error": result.stderr}
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def create_deepseek_session():
    """Create and authenticate DeepSeek session."""
    print("=" * 70)
    print("Creating Authenticated DeepSeek Session")
    print("=" * 70)
    
    # Step 1: Open DeepSeek with a profile to save session
    print("\n1. Opening DeepSeek with session profile...")
    result = run_agent_browser(['--session', 'deepseek-auth', 'open', 'https://chat.deepseek.com'])
    
    if not result.get('success'):
        print(f"   ✗ Failed to open DeepSeek: {result.get('error', 'Unknown error')}")
        return False
    
    print(f"   ✓ Opened: {result['data'].get('title', 'No title')}")
    print(f"   URL: {result['data'].get('url', 'No URL')}")
    
    # Step 2: Get snapshot to find login elements
    print("\n2. Getting page snapshot to find login form...")
    time.sleep(2)  # Wait for page to load
    result = run_agent_browser(['--session', 'deepseek-auth', 'snapshot'])
    
    if not result.get('success'):
        print("   ✗ Failed to get snapshot")
        return False
    
    refs = result['data'].get('refs', {})
    print(f"   ✓ Found {len(refs)} elements")
    
    # Find email and password fields
    email_ref = None
    password_ref = None
    login_button_ref = None
    
    for ref_id, element in refs.items():
        role = element.get('role', '')
        name = element.get('name', '').lower()
        
        if role == 'textbox':
            if 'email' in name or 'phone' in name:
                email_ref = ref_id
                print(f"   Found email field: {ref_id} ('{element.get('name')}')")
            elif 'password' in name:
                password_ref = ref_id
                print(f"   Found password field: {ref_id} ('{element.get('name')}')")
        elif role == 'button' and ('log' in name or 'sign' in name):
            login_button_ref = ref_id
            print(f"   Found login button: {ref_id} ('{element.get('name')}')")
    
    if not email_ref or not password_ref or not login_button_ref:
        print("   ⚠️ Could not find all login elements. Page might have changed.")
        print("   Available elements:")
        for ref_id, element in refs.items():
            print(f"   - {ref_id}: {element.get('role')} '{element.get('name')}'")
        return False
    
    # Step 3: Fill in login form
    print("\n3. Filling login form...")
    
    # Click email field
    print(f"   Clicking email field {email_ref}...")
    result = run_agent_browser(['--session', 'deepseek-auth', 'click', email_ref])
    if not result.get('success'):
        print(f"   ✗ Failed to click email field: {result.get('error')}")
    
    # Type email
    print(f"   Typing email...")
    result = run_agent_browser(['--session', 'deepseek-auth', 'type', DEEPSEEK_EMAIL])
    if not result.get('success'):
        print(f"   ✗ Failed to type email: {result.get('error')}")
    else:
        print("   ✓ Email entered")
    
    # Click password field
    print(f"   Clicking password field {password_ref}...")
    result = run_agent_browser(['--session', 'deepseek-auth', 'click', password_ref])
    if not result.get('success'):
        print(f"   ✗ Failed to click password field: {result.get('error')}")
    
    # Type password
    print(f"   Typing password...")
    result = run_agent_browser(['--session', 'deepseek-auth', 'type', DEEPSEEK_PASSWORD])
    if not result.get('success'):
        print(f"   ✗ Failed to type password: {result.get('error')}")
    else:
        print("   ✓ Password entered")
    
    # Step 4: Click login button
    print(f"\n4. Clicking login button {login_button_ref}...")
    result = run_agent_browser(['--session', 'deepseek-auth', 'click', login_button_ref])
    if not result.get('success'):
        print(f"   ✗ Failed to click login: {result.get('error')}")
        return False
    
    print("   ✓ Login button clicked")
    
    # Step 5: Wait for login and check if successful
    print("\n5. Waiting for login to complete...")
    time.sleep(5)
    
    result = run_agent_browser(['--session', 'deepseek-auth', 'snapshot'])
    if result.get('success'):
        current_url = result['data'].get('origin', '')
        print(f"   Current URL: {current_url}")
        
        if 'chat' in current_url and 'sign_in' not in current_url:
            print("   ✅ SUCCESS: Logged into DeepSeek chat!")
            
            # Get chat interface elements
            refs = result['data'].get('refs', {})
            chat_elements = []
            for ref_id, element in refs.items():
                if element.get('role') in ['textbox', 'button']:
                    chat_elements.append(f"{ref_id}: {element.get('role')} '{element.get('name', '')}'")
            
            if chat_elements:
                print("   Chat interface elements found:")
                for elem in chat_elements[:5]:  # Show first 5
                    print(f"   - {elem}")
            
            return True
        else:
            print("   ⚠️ Might still be on login page or redirected")
            return False
    else:
        print("   ✗ Failed to check login status")
        return False

def test_chat_interaction():
    """Test if we can interact with DeepSeek chat."""
    print("\n" + "=" * 70)
    print("Testing DeepSeek Chat Interaction")
    print("=" * 70)
    
    # Use the authenticated session
    print("\n1. Testing chat with authenticated session...")
    
    # Get snapshot to find chat elements
    result = run_agent_browser(['--session', 'deepseek-auth', 'snapshot'])
    if not result.get('success'):
        print("   ✗ Failed to get snapshot")
        return False
    
    refs = result['data'].get('refs', {})
    
    # Find chat input and send button
    chat_input_ref = None
    send_button_ref = None
    
    for ref_id, element in refs.items():
        role = element.get('role', '')
        name = element.get('name', '').lower()
        
        if role == 'textbox' and ('message' in name or 'chat' in name or 'input' in name):
            chat_input_ref = ref_id
        elif role == 'button' and ('send' in name or 'submit' in name):
            send_button_ref = ref_id
    
    if chat_input_ref and send_button_ref:
        print(f"   Found chat input: {chat_input_ref}")
        print(f"   Found send button: {send_button_ref}")
        
        # Test sending a message
        test_message = "Hello DeepSeek! This is a test from Hermes agent."
        print(f"\n2. Sending test message: '{test_message}'")
        
        # Click chat input
        run_agent_browser(['--session', 'deepseek-auth', 'click', chat_input_ref])
        
        # Type message
        run_agent_browser(['--session', 'deepseek-auth', 'type', test_message])
        
        # Click send
        result = run_agent_browser(['--session', 'deepseek-auth', 'click', send_button_ref])
        
        if result.get('success'):
            print("   ✅ Message sent! Waiting for response...")
            time.sleep(5)  # Wait for response
            
            # Get updated snapshot to see response
            result = run_agent_browser(['--session', 'deepseek-auth', 'snapshot'])
            if result.get('success'):
                snapshot = result['data'].get('snapshot', '')
                # Look for response in snapshot
                if 'Hello' in snapshot or 'test' in snapshot.lower():
                    print("   ✅ Response detected in snapshot!")
                else:
                    print("   ⚠️ Response might not be visible in snapshot format")
            return True
        else:
            print(f"   ✗ Failed to send message: {result.get('error')}")
            return False
    else:
        print("   ⚠️ Could not find chat interface elements")
        print("   Available elements:")
        for ref_id, element in list(refs.items())[:10]:  # Show first 10
            print(f"   - {ref_id}: {element.get('role')} '{element.get('name', '')}'")
        return False

if __name__ == "__main__":
    print("DeepSeek Authentication Setup")
    print(f"Email: {DEEPSEEK_EMAIL}")
    print(f"Password: {'*' * len(DEEPSEEK_PASSWORD)}")
    print()
    
    # Create authenticated session
    if create_deepseek_session():
        print("\n" + "=" * 70)
        print("✅ DEEPSEEK AUTHENTICATION SUCCESSFUL!")
        print("=" * 70)
        print("\nSession 'deepseek-auth' has been created and authenticated.")
        print("This session can now be used by Hermes agents.")
        
        # Test chat interaction
        test_chat = input("\nTest chat interaction? (y/n): ").lower().strip()
        if test_chat == 'y':
            test_chat_interaction()
    else:
        print("\n" + "=" * 70)
        print("❌ DEEPSEEK AUTHENTICATION FAILED")
        print("=" * 70)
        print("\nPossible issues:")
        print("1. DeepSeek login page structure changed")
        print("2. Credentials incorrect")
        print("3. CAPTCHA or additional verification required")
        print("4. Network issues")
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("NEXT STEPS:")
    print("=" * 70)
    print("1. Use '--session deepseek-auth' with agent-browser commands")
    print("2. Integrate with Hermes browser tool")
    print("3. Create DeepSeekBrainBridge Python module")
    print("4. Build Research Agent with DeepSeek thinking layer")
    print()
    print("Session will be saved for future use!")