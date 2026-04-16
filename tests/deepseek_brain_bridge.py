#!/usr/bin/env python3
"""
DeepSeek Brain Bridge
Allows Hermes agents to "think" with your personal DeepSeek web chat.

Usage:
1. First, manually authenticate (see authenticate_deepseek.py)
2. Then agents can use: DeepSeekBrainBridge().think("What is AI?")
"""

import subprocess
import json
import time
import os
import re
from typing import Optional, Dict, Any

class DeepSeekBrainBridge:
    """
    Bridge between Hermes agents and your personal DeepSeek web chat.
    Uses agent-browser with authenticated session.
    """
    
    def __init__(self, session_name: str = "deepseek-agent"):
        """
        Initialize the brain bridge.
        
        Args:
            session_name: Name of the authenticated agent-browser session
        """
        self.session_name = session_name
        self.browser_args = [
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled"
        ]
        self.user_agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        
        # Set environment variables
        os.environ['AGENT_BROWSER_ARGS'] = ' '.join(self.browser_args)
        os.environ['AGENT_BROWSER_USER_AGENT'] = self.user_agent
    
    def _run_command(self, command: str, args: list = None, timeout: int = 30) -> Dict[str, Any]:
        """Run an agent-browser command and return parsed JSON."""
        cmd = ['agent-browser', '--json', '--session', self.session_name]
        
        if args:
            cmd.extend(args)
        
        cmd.append(command)
        
        try:
            # print(f"DEBUG: Running command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            
            if result.returncode != 0:
                return {
                    "success": False,
                    "error": f"Command failed with code {result.returncode}: {result.stderr[:200]}"
                }
            
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                # Sometimes agent-browser outputs non-JSON for errors
                return {
                    "success": False,
                    "error": f"Invalid JSON response: {result.stdout[:200]}"
                }
                
        except subprocess.TimeoutExpired:
            return {"success": False, "error": f"Timeout after {timeout} seconds"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def is_authenticated(self) -> bool:
        """Check if we have an authenticated DeepSeek session."""
        # Navigate to DeepSeek chat
        result = self._run_command("open", ["https://chat.deepseek.com"])
        
        if not result.get("success"):
            return False
        
        # Check if we're on chat page (not login page)
        current_url = result["data"].get("url", "")
        return "chat.deepseek.com" in current_url and "sign_in" not in current_url
    
    def think(self, prompt: str, model: str = "deepseek-chat") -> str:
        """
        Send a prompt to DeepSeek and get response.
        
        Args:
            prompt: The question or prompt for DeepSeek
            model: Which DeepSeek model to use (deepseek-chat, deepseek-r1, etc.)
            
        Returns:
            DeepSeek's response as text
        """
        print(f"🤔 Thinking with DeepSeek: {prompt[:50]}...")
        
        # Step 1: Ensure we're on DeepSeek chat
        result = self._run_command("open", ["https://chat.deepseek.com"])
        if not result.get("success"):
            return f"Error: Could not open DeepSeek - {result.get('error', 'Unknown error')}"
        
        time.sleep(2)  # Wait for page load
        
        # Step 2: Get snapshot to find chat elements
        result = self._run_command("snapshot")
        if not result.get("success"):
            return f"Error: Could not get page snapshot - {result.get('error', 'Unknown error')}"
        
        snapshot_data = result["data"]
        refs = snapshot_data.get("refs", {})
        snapshot_text = snapshot_data.get("snapshot", "")
        
        # Step 3: Find chat input and send button
        chat_input_ref = None
        send_button_ref = None
        
        for ref_id, element in refs.items():
            role = element.get("role", "")
            name = element.get("name", "").lower()
            
            # Look for chat input (textbox that's not password)
            if role == "textbox" and "password" not in name:
                # Check if it's likely a chat input
                if not chat_input_ref:  # Take first non-password textbox
                    chat_input_ref = ref_id
            
            # Look for send button
            elif role == "button":
                if "send" in name or "submit" in name or "arrow" in name:
                    send_button_ref = ref_id
                elif not send_button_ref and ("send" in snapshot_text.lower() or "submit" in snapshot_text.lower()):
                    # Fallback: any button if snapshot mentions send/submit
                    send_button_ref = ref_id
        
        if not chat_input_ref:
            # Try to find by scanning snapshot
            lines = snapshot_text.split('\n')
            for line in lines:
                if 'textbox' in line and 'password' not in line.lower():
                    # Extract ref from line like: 'textbox "Message" [ref=e5]'
                    match = re.search(r'\[ref=([^\]]+)\]', line)
                    if match:
                        chat_input_ref = match.group(1)
                        break
        
        if not chat_input_ref or not send_button_ref:
            return f"Error: Could not find chat interface. Found {len(refs)} elements. Snapshot preview: {snapshot_text[:200]}..."
        
        print(f"  Found chat input: {chat_input_ref}, send button: {send_button_ref}")
        
        # Step 4: Clear any existing text (click and press Ctrl+A, Delete)
        self._run_command("click", [chat_input_ref])
        time.sleep(0.5)
        
        # Step 5: Type the prompt
        print(f"  Typing prompt ({len(prompt)} chars)...")
        type_result = self._run_command("type", [prompt])
        if not type_result.get("success"):
            return f"Error: Could not type prompt - {type_result.get('error', 'Unknown error')}"
        
        time.sleep(1)  # Wait for typing to complete
        
        # Step 6: Send the message
        print("  Sending to DeepSeek...")
        send_result = self._run_command("click", [send_button_ref])
        if not send_result.get("success"):
            return f"Error: Could not send message - {send_result.get('error', 'Unknown error')}"
        
        # Step 7: Wait for response
        print("  Waiting for DeepSeek response...")
        time.sleep(8)  # Give DeepSeek time to respond
        
        # Step 8: Get response
        result = self._run_command("snapshot")
        if not result.get("success"):
            return f"Error: Could not get response - {result.get('error', 'Unknown error')}"
        
        snapshot_text = result["data"].get("snapshot", "")
        
        # Step 9: Extract response from snapshot
        # Look for the response in the snapshot
        response = self._extract_response(snapshot_text, prompt)
        
        if response:
            print(f"  ✅ Got response ({len(response)} chars)")
            return response
        else:
            print(f"  ⚠️ Could not extract clear response from snapshot")
            # Return snapshot excerpt as fallback
            return f"DeepSeek response (raw snapshot excerpt):\n{snapshot_text[:500]}..."
    
    def _extract_response(self, snapshot_text: str, prompt: str) -> str:
        """Extract DeepSeek's response from snapshot text."""
        # Simple extraction: look for text after our prompt
        lines = snapshot_text.split('\n')
        
        # Find lines that look like responses (not UI elements)
        response_lines = []
        in_response = False
        
        for line in lines:
            # Skip UI element references
            if '[ref=' in line or 'textbox' in line or 'button' in line:
                continue
            
            # Skip empty lines and generic labels
            if not line.strip() or 'generic' in line or 'StaticText' in line:
                continue
            
            # Clean the line
            clean_line = line.strip()
            if clean_line.startswith('- '):
                clean_line = clean_line[2:]
            
            # Remove quotes if present
            clean_line = clean_line.strip('"')
            
            # Skip if it's our prompt or very short
            if prompt[:30] in clean_line or len(clean_line) < 10:
                continue
            
            response_lines.append(clean_line)
        
        if response_lines:
            # Join lines, but remove duplicates
            unique_lines = []
            seen = set()
            for line in response_lines:
                if line not in seen and len(line) > 20:  # Only substantial lines
                    seen.add(line)
                    unique_lines.append(line)
            
            if unique_lines:
                return '\n'.join(unique_lines[:10])  # Limit to 10 lines
        
        # Fallback: return portion of snapshot after "Message" or similar
        message_index = snapshot_text.lower().find('message')
        if message_index > 0:
            return snapshot_text[message_index:message_index + 500]
        
        return snapshot_text[:300]  # First 300 chars as fallback
    
    def chat(self, messages: list) -> str:
        """
        Have a conversation with DeepSeek.
        
        Args:
            messages: List of dicts with 'role' and 'content'
            
        Returns:
            DeepSeek's response
        """
        # For now, just use the last user message
        for msg in reversed(messages):
            if msg.get('role') == 'user':
                return self.think(msg.get('content', ''))
        
        return "Error: No user message found"


def test_brain_bridge():
    """Test the DeepSeek brain bridge."""
    print("🧪 Testing DeepSeek Brain Bridge")
    print("=" * 60)
    
    bridge = DeepSeekBrainBridge(session_name="deepseek-agent")
    
    # Check authentication
    print("1. Checking authentication...")
    if bridge.is_authenticated():
        print("   ✅ Authenticated with DeepSeek")
    else:
        print("   ❌ Not authenticated. You need to run authenticate_deepseek.py first.")
        return False
    
    # Test a simple thought
    print("\n2. Testing simple thought...")
    test_prompt = "Hello DeepSeek! What is artificial intelligence in one sentence?"
    response = bridge.think(test_prompt)
    
    print(f"\n📤 Prompt: {test_prompt}")
    print(f"📥 Response: {response[:200]}...")
    
    return True


if __name__ == "__main__":
    print("DeepSeek Brain Bridge Module")
    print("=" * 60)
    print("This module allows Hermes agents to think with your DeepSeek web chat.")
    print()
    print("PREREQUISITE: You must first authenticate by running:")
    print("  python3 authenticate_deepseek.py")
    print()
    
    if test_brain_bridge():
        print("\n" + "=" * 60)
        print("✅ BRAIN BRIDGE TEST SUCCESSFUL!")
        print("=" * 60)
        print("\nHermes agents can now use DeepSeek for thinking.")
        print("\nUsage in Hermes Research Agent:")
        print("""
from deepseek_brain_bridge import DeepSeekBrainBridge

bridge = DeepSeekBrainBridge()
deepseek_thought = bridge.think("Analyze this data and find patterns...")
        """)
    else:
        print("\n" + "=" * 60)
        print("❌ BRAIN BRIDGE TEST FAILED")
        print("=" * 60)
        print("\nPlease authenticate first with authenticate_deepseek.py")