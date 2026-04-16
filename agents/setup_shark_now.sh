#!/bin/bash
# SHARK AGENT - SIMPLE WORKING VERSION
# Uses vLLM, no Ollama, no bullshit

set -e

echo "=== SETTING UP SHARK AGENT ==="

# 1. Create directory
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/shark
cd /home/leviathan/OPENCODE_WORKSPACE/shark

# 2. Install vLLM in isolated environment
echo "Installing vLLM..."
python3 -m pip install --user vllm==0.3.3  # Stable version

# 3. Create the agent script
cat > shark.py << 'EOF'
#!/usr/bin/env python3
"""
SHARK AGENT - WORKING VERSION
Uses vLLM with Qwen2.5-Coder-14B
"""

import subprocess
import sys
import os
import time
from typing import Optional

def check_vllm():
    """Check if vLLM is installed"""
    try:
        import vllm
        print("✓ vLLM is installed")
        return True
    except ImportError:
        print("✗ vLLM not installed")
        return False

def start_vllm_server():
    """Start vLLM server with Qwen model"""
    print("Starting vLLM server with Qwen2.5-Coder-14B-Instruct...")
    
    # Check if server is already running
    try:
        import requests
        response = requests.get("http://localhost:8000/health", timeout=2)
        if response.status_code == 200:
            print("✓ vLLM server already running")
            return True
    except:
        pass
    
    # Start server in background
    cmd = [
        "python3", "-m", "vllm.entrypoints.openai.api_server",
        "--model", "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
        "--port", "8000",
        "--host", "0.0.0.0",
        "--max-model-len", "8192",
        "--gpu-memory-utilization", "0.85"
    ]
    
    print(f"Starting: {' '.join(cmd)}")
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for server to start
    print("Waiting for server to start...")
    time.sleep(10)
    
    # Check if server started
    try:
        import requests
        for _ in range(10):
            try:
                response = requests.get("http://localhost:8000/health", timeout=5)
                if response.status_code == 200:
                    print("✓ vLLM server started successfully")
                    return True
            except:
                time.sleep(2)
                continue
    except ImportError:
        print("⚠ Could not verify server start (requests not installed)")
        print("Assuming server started...")
        return True
    
    print("✗ Server may not have started properly")
    return False

def test_vllm():
    """Test vLLM server with a simple request"""
    print("\nTesting vLLM server...")
    
    try:
        import requests
        import json
        
        payload = {
            "model": "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
            "messages": [{"role": "user", "content": "Say 'SHARK is working'"}],
            "max_tokens": 50
        }
        
        response = requests.post(
            "http://localhost:8000/v1/chat/completions",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            message = result['choices'][0]['message']['content']
            print(f"✓ Server response: {message}")
            return True
        else:
            print(f"✗ Server error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False

def create_shark_agent():
    """Create the SHARK agent script that uses vLLM"""
    print("\nCreating SHARK agent...")
    
    agent_code = '''#!/usr/bin/env python3
"""
SHARK AGENT CORE
Uses vLLM OpenAI-compatible API
"""

import requests
import json
import subprocess
import os
import sys
from typing import List, Dict, Any

class SharkConfig:
    VLLM_URL = "http://localhost:8000/v1/chat/completions"
    MODEL = "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ"
    
    SAFE_COMMANDS = [
        "ls", "pwd", "cat", "echo", "python", "pip", "git",
        "mkdir", "touch", "rm", "cp", "mv", "find", "grep"
    ]
    
    DANGEROUS = ["rm -rf", "mkfs", "dd", "format", "forkbomb"]

class SharkAgent:
    def __init__(self):
        self.config = SharkConfig()
    
    def is_safe(self, cmd: str) -> bool:
        cmd_lower = cmd.lower()
        for dangerous in self.config.DANGEROUS:
            if dangerous in cmd_lower:
                return False
        
        parts = cmd.strip().split()
        if not parts:
            return False
        
        return parts[0] in self.config.SAFE_COMMANDS
    
    def execute(self, cmd: str) -> Dict[str, Any]:
        if not self.is_safe(cmd):
            return {"success": False, "output": f"Blocked: {cmd}"}
        
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                "success": result.returncode == 0,
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "command": cmd
            }
        except Exception as e:
            return {"success": False, "output": f"Error: {e}"}
    
    def ask_vllm(self, prompt: str) -> str:
        """Ask vLLM server for response"""
        try:
            payload = {
                "model": self.config.MODEL,
                "messages": [
                    {"role": "system", "content": "You are SHARK, an autonomous AI agent that executes code. Provide analysis and shell commands to run."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1024,
                "temperature": 0.7
            }
            
            response = requests.post(
                self.config.VLLM_URL,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            else:
                return f"Error: Server returned {response.status_code}"
                
        except Exception as e:
            return f"Error contacting vLLM: {e}"
    
    def extract_commands(self, text: str) -> List[str]:
        """Extract shell commands from text"""
        commands = []
        lines = text.split('\\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('$ '):
                cmd = line[2:].strip()
                if cmd:
                    commands.append(cmd)
            elif line.startswith('```bash'):
                continue
            elif line.startswith('```'):
                continue
            elif any(line.startswith(cmd + ' ') for cmd in self.config.SAFE_COMMANDS):
                commands.append(line)
        
        return commands
    
    def process(self, user_input: str) -> str:
        """Main processing pipeline"""
        print(f"Processing: {user_input}")
        
        # Step 1: Get analysis from vLLM
        analysis = self.ask_vllm(user_input)
        print(f"Analysis: {analysis[:200]}...")
        
        # Step 2: Extract commands
        commands = self.extract_commands(analysis)
        print(f"Found {len(commands)} commands to execute")
        
        # Step 3: Execute commands
        results = []
        for cmd in commands[:3]:  # Limit to 3 commands
            print(f"Executing: {cmd}")
            result = self.execute(cmd)
            results.append(result)
        
        # Step 4: Format output
        output = []
        output.append("="*60)
        output.append("🦈 SHARK AGENT RESULTS")
        output.append("="*60)
        output.append(f"Input: {user_input}")
        output.append("")
        output.append("Analysis:")
        output.append("-"*40)
        output.append(analysis)
        output.append("")
        
        if results:
            output.append("Execution Results:")
            output.append("-"*40)
            for i, res in enumerate(results, 1):
                output.append(f"{i}. $ {res.get('command', 'N/A')}")
                if res.get('success'):
                    if res.get('stdout'):
                        output.append(f"   Output: {res['stdout'][:500]}")
                    else:
                        output.append("   ✓ Success (no output)")
                else:
                    output.append(f"   ✗ Failed: {res.get('stderr') or res.get('output', 'Unknown error')}")
                output.append("")
        
        return "\\n".join(output)

def main():
    """Main terminal interface"""
    print("🦈 SHARK AGENT - vLLM Edition")
    print("Type 'exit' to quit")
    print("="*50)
    
    agent = SharkAgent()
    
    while True:
        try:
            user_input = input("\\nshark> ").strip()
            
            if user_input.lower() in ['exit', 'quit', 'q']:
                print("Goodbye!")
                break
            
            if not user_input:
                continue
            
            result = agent.process(user_input)
            print(f"\\n{result}")
            
        except KeyboardInterrupt:
            print("\\n\\nInterrupted. Goodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    # Install requests if needed
    try:
        import requests
    except ImportError:
        print("Installing requests...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
        import requests
    
    main()
'''
    
    with open("shark_agent.py", "w") as f:
        f.write(agent_code)
    
    os.chmod("shark_agent.py", 0o755)
    print("✓ Created shark_agent.py")

def main():
    """Main setup function"""
    print("\n=== SHARK AGENT SETUP ===")
    
    # Step 1: Check vLLM
    if not check_vllm():
        print("Please install vLLM first: pip install vllm")
        return
    
    # Step 2: Start vLLM server
    if not start_vllm_server():
        print("Failed to start vLLM server")
        return
    
    # Step 3: Test server
    if not test_vllm():
        print("vLLM server test failed")
        return
    
    # Step 4: Create agent
    create_shark_agent()
    
    print("\n" + "="*60)
    print("✅ SHARK AGENT SETUP COMPLETE!")
    print("="*60)
    print("\nTo run SHARK:")
    print("  cd /home/leviathan/OPENCODE_WORKSPACE/shark")
    print("  python3 shark_agent.py")
    print("\nThe agent will:")
    print("  1. Use vLLM with Qwen2.5-Coder-14B-Instruct-AWQ")
    print("  2. Execute safe shell commands")
    print("  3. Provide analysis and results")
    print("\nModels available at: http://localhost:8000")
    print("OpenAI-compatible API: http://localhost:8000/v1/chat/completions")
    print("\n🦈 SHARK IS READY TO HUNT!")

if __name__ == "__main__":
    main()
EOF

# Make executable and run
chmod +x setup_shark_now.sh
./setup_shark_now.sh