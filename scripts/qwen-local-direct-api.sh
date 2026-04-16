#!/usr/bin/env python3
"""
Qwen with Local Qwen Coder - DIRECT API CALL
Bypasses qwen CLI entirely and calls local API directly
"""

import os
import sys
import json
import subprocess
import requests

def main():
    print("🤖 Qwen with Local Qwen Coder (DIRECT API)")
    print("=========================================")
    print("🧠 Architecture: Dual-Brain (DeepSeek R1 + Local Qwen)")
    print("💰 Cost: 100% free execution tokens")
    print("📍 Model: Qwen2.5-Coder-7B (Local GPU)")
    print("🔗 API: http://localhost:8001/v1")
    print("")

    # Check if local agents are running
    try:
        response = requests.get("http://localhost:8001/v1/models", timeout=5)
        if response.status_code != 200:
            print("❌ Local agents not responding")
            sys.exit(1)
        print("✅ Local agents running and responsive")
    except:
        print("❌ Local agents not running")
        print("   Run: sudo systemctl start qwen-coders.service")
        sys.exit(1)

    # Process command line arguments
    if len(sys.argv) < 2:
        print("Usage: qwen-local [prompt or command]")
        print("Examples:")
        print("  qwen-local 'Write a Python script to read CSV files'")
        print("  qwen-local 'execute: ls -la'")
        print("  qwen-local --help")
        sys.exit(1)

    # Extract the prompt from arguments
    prompt = ' '.join(sys.argv[1:])
    
    # Handle special commands
    if prompt.startswith('--help'):
        print_help()
        return
    
    if "execute:" in prompt:
        # Handle execution commands
        command = prompt.replace("execute:", "").strip()
        result = execute_command(command)
        print(f"🔧 Command executed: {command}")
        print(f"📋 Result: {result}")
    else:
        # Handle regular chat requests
        result = send_chat_request(prompt)
        print(f"🤖 AI Response: {result}")

def print_help():
    print("""
Usage: qwen-local [prompt or command]

Options:
  --help              Show this help message

Examples:
  qwen-local "Write a Python hello world script"
  qwen-local "execute: pwd && whoami"
  qwen-local "Explain quantum computing simply"

Commands:
  Regular prompts → Send to local Qwen Coder API
  execute: <cmd> → Execute shell command and return result
  --help → Show this help

API Endpoints:
  Chat: http://localhost:8001/v1/chat/completions
  Models: http://localhost:8001/v1/models

Authentication: Uses local API key 'qwen-local-execution'
""")

def execute_command(command):
    """Execute a shell command and return the result"""
    try:
        # Safety check for dangerous commands
        dangerous_patterns = ['rm -rf', 'mkfs', 'dd ', 'format', '> /dev/sd']
        if any(pattern in command.lower() for pattern in dangerous_patterns):
            return "❌ Command blocked for safety reasons"
        
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=30
        )
        
        return f"Exit Code: {result.returncode}\nStdout: {result.stdout[:500]}\nStderr: {result.stderr[:500]}"
    except subprocess.TimeoutExpired:
        return "❌ Command timed out after 30 seconds"
    except Exception as e:
        return f"❌ Execution failed: {str(e)}"

def send_chat_request(prompt):
    """Send chat request to local Qwen Coder API"""
    try:
        response = requests.post(
            "http://localhost:8001/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer qwen-local-execution"
            },
            json={
                "model": "qwen-coder-7b-local",
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are the Qwen Coder Agent. You are designed to execute commands and provide helpful programming assistance. Keep responses concise and focused on execution."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "max_tokens": 2000,
                "temperature": 0.1
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data['choices'][0]['message']['content']
        else:
            return f"❌ API Error: {response.status_code} - {response.text}"
            
    except requests.exceptions.Timeout:
        return "❌ Request timed out"
    except Exception as e:
        return f"❌ Network error: {str(e)}"

if __name__ == "__main__":
    main()