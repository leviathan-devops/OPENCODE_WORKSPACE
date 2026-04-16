#!/usr/bin/env python3
"""
DeepSeek Authentication Script
Run this ONCE to authenticate your DeepSeek account for agent use.

This will open a browser where you manually login to DeepSeek.
The authenticated session will be saved for agents to use.
"""

import subprocess
import time
import os
import sys

def authenticate_deepseek():
    """
    Open DeepSeek in a browser for manual authentication.
    The session will be saved as 'deepseek-agent'.
    """
    print("=" * 70)
    print("DEEPSEEK MANUAL AUTHENTICATION")
    print("=" * 70)
    print()
    print("This script will open DeepSeek in a browser.")
    print("PLEASE LOGIN MANUALLY with your credentials:")
    print(f"  Email: cryptoforex36963@gmail.com")
    print(f"  Password: CosmicEnergy369!")
    print()
    print("After login, the session will be saved for agent use.")
    print("You only need to do this once!")
    print()
    input("Press Enter to open DeepSeek browser...")
    
    # Set environment variables
    os.environ['AGENT_BROWSER_ARGS'] = '--no-sandbox --disable-blink-features=AutomationControlled'
    os.environ['AGENT_BROWSER_USER_AGENT'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    
    # Open DeepSeek with a persistent session
    print("\n🔓 Opening DeepSeek for authentication...")
    print("   Please login when the browser opens.")
    print("   After login, you can close the browser.")
    print()
    
    # Use --headed to see the browser for manual login
    # Use --session to save the authenticated session
    cmd = [
        'agent-browser',
        '--session', 'deepseek-agent',
        '--headed',  # Show browser window for manual login
        'open', 'https://chat.deepseek.com'
    ]
    
    print(f"Running: {' '.join(cmd)}")
    print()
    print("⚠️  IMPORTANT: A browser window will open.")
    print("   Login with: cryptoforex36963@gmail.com / CosmicEnergy369!")
    print("   After login, wait 10 seconds, then close the browser.")
    print("   The script will continue automatically.")
    print()
    
    try:
        # Run agent-browser
        process = subprocess.Popen(cmd)
        
        # Wait for browser to open and give time for manual login
        print("⏳ Browser opened. Please login now...")
        print("   (Waiting 60 seconds for you to login)")
        
        for i in range(60):
            time.sleep(1)
            if i % 10 == 0:
                print(f"   {60-i} seconds remaining...")
        
        # After waiting, check if process is still running
        if process.poll() is None:
            print("\n✅ Login time complete. Closing browser...")
            process.terminate()
            process.wait(timeout=5)
        else:
            print("\n✅ Browser closed automatically.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False
    
    # Test if authentication worked
    print("\n🔍 Testing authentication...")
    time.sleep(2)
    
    test_cmd = [
        'agent-browser',
        '--session', 'deepseek-agent',
        '--json',
        'open', 'https://chat.deepseek.com'
    ]
    
    try:
        result = subprocess.run(test_cmd, capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            # Parse JSON response
            import json
            try:
                data = json.loads(result.stdout)
                if data.get('success'):
                    url = data['data'].get('url', '')
                    if 'sign_in' not in url:
                        print("✅ SUCCESS! DeepSeek session authenticated and saved.")
                        print(f"   Session name: 'deepseek-agent'")
                        print(f"   Current URL: {url}")
                        return True
                    else:
                        print("❌ Still on login page. Authentication may have failed.")
                        print("   Please try again.")
                        return False
            except json.JSONDecodeError:
                print("❌ Could not parse response.")
                return False
        else:
            print(f"❌ Command failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def create_agent_chat_sessions():
    """Create multiple agent chat sessions as backups."""
    print("\n" + "=" * 70)
    print("CREATING BACKUP AGENT CHAT SESSIONS")
    print("=" * 70)
    print()
    print("You mentioned having agent chat 2 and 3 as backups.")
    print("We can create additional authenticated sessions.")
    print()
    
    response = input("Create backup sessions? (y/n): ").lower().strip()
    
    if response != 'y':
        return
    
    for i in range(2, 4):  # Create sessions 2 and 3
        session_name = f"deepseek-agent-{i}"
        print(f"\nCreating backup session: {session_name}")
        
        # Copy the main session if it exists
        # Note: agent-browser sessions can't be directly copied
        # Instead, we'd need to authenticate each one
        print(f"   Note: Each session needs separate authentication.")
        print(f"   Run this script again for each backup session.")
        print(f"   Use session name: {session_name}")
    
    print("\n💡 Tip: For now, use 'deepseek-agent' as the main session.")
    print("   If it hits context limits, manually authenticate another session.")

if __name__ == "__main__":
    print("DeepSeek Authentication for Agent Brain Bridge")
    print("=" * 70)
    
    if authenticate_deepseek():
        create_agent_chat_sessions()
        
        print("\n" + "=" * 70)
        print("🎉 AUTHENTICATION COMPLETE!")
        print("=" * 70)
        print()
        print("Your DeepSeek session is now saved as 'deepseek-agent'.")
        print("Hermes agents can use this session to think with DeepSeek.")
        print()
        print("Next steps:")
        print("1. Test the brain bridge: python3 deepseek_brain_bridge.py")
        print("2. Use in Hermes Research Agent")
        print("3. If session expires, run this script again")
        print()
        print("Session location: ~/.agent-browser/sessions/deepseek-agent")
    else:
        print("\n" + "=" * 70)
        print("❌ AUTHENTICATION FAILED")
        print("=" * 70)
        print()
        print("Possible issues:")
        print("1. Browser didn't open properly")
        print("2. Login failed or took too long")
        print("3. Network issues")
        print()
        print("Try running this script again.")
        sys.exit(1)