#!/usr/bin/env python3
"""
SHARK AGENT - FINAL WORKING VERSION
Assumes vLLM is running on localhost:8000
"""

import requests
import json
import subprocess
import os
import sys
import time
from typing import List, Dict, Any, Optional

# ============================================================================
# CONFIGURATION
# ============================================================================

class SharkConfig:
    """SHARK configuration - EDIT THESE IF NEEDED"""
    
    # vLLM server (OpenAI-compatible API)
    VLLM_URL = "http://localhost:8000/v1/chat/completions"
    
    # Model to use
    MODEL = "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ"
    
    # Safe commands (ALLOWLIST - only these are allowed)
    SAFE_COMMANDS = [
        # File operations
        "ls", "pwd", "cat", "head", "tail", "wc", "find", "grep",
        "mkdir", "touch", "rm", "cp", "mv", "ln", "chmod", "chown",
        
        # Development
        "python", "python3", "pip", "git", "curl", "wget", "tar",
        "zip", "unzip", "gzip", "gunzip",
        
        # System info
        "df", "du", "free", "top", "htop", "ps", "kill", "pgrep",
        "uname", "whoami", "hostname", "date",
        
        # Network
        "ping", "netstat", "ss", "ifconfig", "ip", "dig", "nslookup",
        
        # Text processing
        "echo", "printf", "sed", "awk", "sort", "uniq", "cut", "paste",
        "tr", "column", "expand", "unexpand",
    ]
    
    # Dangerous patterns (BLOCKLIST - these are NEVER allowed)
    DANGEROUS_PATTERNS = [
        "rm -rf /", "rm -rf /*", "rm -rf .", "rm -rf *",
        "mkfs", "dd if=", "format", "fdisk", "parted",
        ":(){ :|:& };:", "fork()", "forkbomb",
        "chmod -R 777 /", "chown -R root:root /",
        "> /dev/sda", "dd of=/dev/sda",
    ]
    
    # Working directory
    WORK_DIR = os.getcwd()
    
    # Timeouts
    VLLM_TIMEOUT = 60
    COMMAND_TIMEOUT = 30

# ============================================================================
# CORE AGENT
# ============================================================================

class SharkAgent:
    """Main SHARK agent class"""
    
    def __init__(self, config: SharkConfig = None):
        self.config = config or SharkConfig()
        self._ensure_requests()
    
    def _ensure_requests(self):
        """Ensure requests module is available"""
        try:
            import requests
        except ImportError:
            print("Installing requests module...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "--break-system-packages"])
            import requests
    
    # ------------------------------------------------------------------------
    # SAFETY CHECKING
    # ------------------------------------------------------------------------
    
    def is_safe_command(self, command: str) -> tuple[bool, str]:
        """
        Check if a command is safe to execute.
        Returns (is_safe, reason)
        """
        cmd = command.strip()
        
        # Empty command
        if not cmd:
            return False, "Empty command"
        
        # Check for dangerous patterns
        for pattern in self.config.DANGEROUS_PATTERNS:
            if pattern in cmd:
                return False, f"Contains dangerous pattern: {pattern}"
        
        # Extract first word
        parts = cmd.split()
        if not parts:
            return False, "No command"
        
        first_word = parts[0]
        
        # Check if in safe list
        if first_word not in self.config.SAFE_COMMANDS:
            return False, f"Command '{first_word}' not in safe list"
        
        return True, "OK"
    
    # ------------------------------------------------------------------------
    # COMMAND EXECUTION
    # ------------------------------------------------------------------------
    
    def execute_command(self, command: str) -> Dict[str, Any]:
        """
        Execute a shell command safely.
        Returns dict with results.
        """
        # Safety check
        is_safe, reason = self.is_safe_command(command)
        if not is_safe:
            return {
                "success": False,
                "error": f"Safety check failed: {reason}",
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1
            }
        
        try:
            # Execute command
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=self.config.COMMAND_TIMEOUT,
                cwd=self.config.WORK_DIR
            )
            
            return {
                "success": result.returncode == 0,
                "command": command,
                "stdout": result.stdout.strip(),
                "stderr": result.stderr.strip(),
                "exit_code": result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"Command timed out after {self.config.COMMAND_TIMEOUT} seconds",
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Execution error: {str(e)}",
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1
            }
    
    # ------------------------------------------------------------------------
    # vLLM INTEGRATION
    # ------------------------------------------------------------------------
    
    def ask_vllm(self, prompt: str, system_prompt: str = None) -> str:
        """
        Send a prompt to vLLM server and get response.
        """
        if system_prompt is None:
            system_prompt = """You are SHARK, an autonomous AI agent that executes code.

When responding:
1. Analyze the user's request
2. Suggest specific shell commands to run (prefix with $)
3. Explain what each command does
4. Keep commands simple and safe

Example:
User: "Check disk space"
Response: "I'll check disk usage with df command.
$ df -h
This shows disk usage in human-readable format."

Now respond to the user's request."""
        
        try:
            import requests
            
            payload = {
                "model": self.config.MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1024,
                "temperature": 0.7,
                "top_p": 0.95
            }
            
            response = requests.post(
                self.config.VLLM_URL,
                json=payload,
                timeout=self.config.VLLM_TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            else:
                return f"Error: vLLM server returned status {response.status_code}\n{response.text}"
                
        except requests.exceptions.ConnectionError:
            return "Error: Could not connect to vLLM server. Make sure vLLM is running on localhost:8000"
        except Exception as e:
            return f"Error contacting vLLM: {str(e)}"
    
    # ------------------------------------------------------------------------
    # COMMAND EXTRACTION
    # ------------------------------------------------------------------------
    
    def extract_commands(self, text: str) -> List[str]:
        """
        Extract shell commands from text.
        Looks for:
        - Lines starting with $
        - Lines that look like shell commands
        """
        commands = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Lines starting with $ (most common)
            if line.startswith('$ '):
                cmd = line[2:].strip()
                if cmd:
                    commands.append(cmd)
            
            # Code blocks
            elif line.startswith('```bash') or line.startswith('```sh'):
                # Skip the opening ```
                continue
            elif line.startswith('```'):
                # Skip closing ```
                continue
            
            # Lines that look like shell commands
            else:
                # Check if line starts with a safe command
                parts = line.split()
                if parts and parts[0] in self.config.SAFE_COMMANDS:
                    commands.append(line)
        
        return commands
    
    # ------------------------------------------------------------------------
    # MAIN PROCESSING PIPELINE
    # ------------------------------------------------------------------------
    
    def process(self, user_input: str) -> Dict[str, Any]:
        """
        Main processing pipeline:
        1. Get analysis from vLLM
        2. Extract commands
        3. Execute commands
        4. Return results
        """
        print(f"🔍 Processing: {user_input}")
        
        result = {
            "input": user_input,
            "analysis": "",
            "commands_found": [],
            "execution_results": [],
            "success": False
        }
        
        # Step 1: Get analysis from vLLM
        print("🤔 Thinking...")
        analysis = self.ask_vllm(user_input)
        result["analysis"] = analysis
        
        # Step 2: Extract commands
        commands = self.extract_commands(analysis)
        result["commands_found"] = commands
        
        if not commands:
            print("⚠ No commands found in analysis")
            result["success"] = True  # Still successful, just no commands
            return result
        
        # Step 3: Execute commands (limit to 3 for safety)
        print(f"⚡ Executing {min(3, len(commands))} commands...")
        for i, cmd in enumerate(commands[:3]):
            print(f"  [{i+1}] $ {cmd}")
            exec_result = self.execute_command(cmd)
            result["execution_results"].append(exec_result)
        
        # Step 4: Determine overall success
        if result["execution_results"]:
            all_success = all(r.get("success", False) for r in result["execution_results"])
            result["success"] = all_success
        
        return result
    
    # ------------------------------------------------------------------------
    # OUTPUT FORMATTING
    # ------------------------------------------------------------------------
    
    def format_result(self, result: Dict[str, Any]) -> str:
        """Format the result for display"""
        output = []
        
        # Header
        output.append("=" * 60)
        output.append("🦈 SHARK AGENT")
        output.append("=" * 60)
        
        # Input
        output.append(f"📝 INPUT: {result['input']}")
        output.append("")
        
        # Analysis
        output.append("💭 ANALYSIS:")
        output.append("-" * 40)
        output.append(result['analysis'])
        output.append("")
        
        # Commands found
        if result['commands_found']:
            output.append(f"🔧 COMMANDS FOUND ({len(result['commands_found'])}):")
            output.append("-" * 40)
            for i, cmd in enumerate(result['commands_found'][:5]):  # Show up to 5
                output.append(f"  {i+1}. $ {cmd}")
            output.append("")
        
        # Execution results
        if result['execution_results']:
            output.append("⚡ EXECUTION RESULTS:")
            output.append("-" * 40)
            
            for i, res in enumerate(result['execution_results']):
                output.append(f"\n[{i+1}] $ {res['command']}")
                
                if res.get('success'):
                    if res.get('stdout'):
                        # Truncate long output
                        stdout = res['stdout']
                        if len(stdout) > 500:
                            stdout = stdout[:500] + "...\n[Output truncated]"
                        output.append(f"   ✅ Success")
                        output.append(f"   📤 Output:\n{stdout}")
                    else:
                        output.append(f"   ✅ Success (no output)")
                else:
                    output.append(f"   ❌ Failed")
                    if res.get('error'):
                        output.append(f"   🚨 Error: {res['error']}")
                    if res.get('stderr'):
                        output.append(f"   📤 Stderr: {res['stderr'][:200]}")
        
        # Summary
        output.append("")
        output.append("=" * 60)
        if result.get('success', False):
            output.append("✅ PROCESSING COMPLETE")
        else:
            output.append("⚠ PROCESSING FINISHED WITH ISSUES")
        output.append("=" * 60)
        
        return "\n".join(output)

# ============================================================================
# TERMINAL INTERFACE
# ============================================================================

class TerminalInterface:
    """Simple terminal interface for SHARK"""
    
    def __init__(self, agent: SharkAgent):
        self.agent = agent
    
    def run(self):
        """Run the terminal loop"""
        print("\n" + "="*60)
        print("🦈 SHARK AGENT - TERMINAL INTERFACE")
        print("="*60)
        print("Type requests for SHARK to analyze and execute")
        print("Examples:")
        print("  - 'Check disk space'")
        print("  - 'List Python files in current directory'")
        print("  - 'Show system information'")
        print("  - 'Count lines in all .py files'")
        print("Type 'exit', 'quit', or Ctrl+C to exit")
        print("="*60)
        
        while True:
            try:
                # Get input
                user_input = input("\nshark> ").strip()
                
                # Check for exit
                if user_input.lower() in ['exit', 'quit', 'q']:
                    print("\n👋 Goodbye! SHARK is going back to sleep... 🦈")
                    break
                
                if not user_input:
                    continue
                
                # Process the request
                result = self.agent.process(user_input)
                
                # Display result
                print("\n" + self.agent.format_result(result))
                
            except KeyboardInterrupt:
                print("\n\n⚠ Interrupted. Goodbye! 🦈")
                break
            except Exception as e:
                print(f"\n🚨 Error: {str(e)}")

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def check_vllm_server():
    """Check if vLLM server is running"""
    try:
        import requests
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ vLLM server is running")
            return True
        else:
            print(f"⚠ vLLM server returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ vLLM server is not running")
        print("\nTo start vLLM server:")
        print("  python3 -m vllm.entrypoints.openai.api_server \\")
        print("    --model Qwen/Qwen2.5-Coder-14B-Instruct-AWQ \\")
        print("    --port 8000 --host 0.0.0.0")
        return False
    except ImportError:
        print("⚠ Could not check vLLM server (requests not installed)")
        return True  # Assume it's running

def print_help():
    """Print help information"""
    print("\n" + "="*60)
    print("SHARK AGENT HELP")
    print("="*60)
    print("\nRequirements:")
    print("  1. vLLM server running on localhost:8000")
    print("  2. Qwen2.5-Coder-14B-Instruct-AWQ model available")
    print("\nTo install vLLM (Ubuntu 24.04):")
    print("  python3 -m pip install vllm --break-system-packages")
    print("\nTo start vLLM server:")
    print("  python3 -m vllm.entrypoints.openai.api_server \\")
    print("    --model Qwen/Qwen2.5-Coder-14B-Instruct-AWQ \\")
    print("    --port 8000 --host 0.0.0.0 \\")
    print("    --max-model-len 8192 \\")
    print("    --gpu-memory-utilization 0.85")
    print("\nThe agent will automatically:")
    print("  1. Connect to vLLM server")
    print("  2. Analyze your request")
    print("  3. Execute safe shell commands")
    print("  4. Show results")
    print("="*60)

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main entry point"""
    print("Starting SHARK Agent...")
    
    # Check vLLM server
    if not check_vllm_server():
        print_help()
        response = input("\nContinue anyway? (y/n): ").strip().lower()
        if response != 'y':
            print("Exiting.")
            return
    
    # Create agent
    agent = SharkAgent()
    
    # Create and run terminal interface
    terminal = TerminalInterface(agent)
    terminal.run()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSHARK agent terminated.")
    except Exception as e:
        print(f"\nFatal error: {e}")
        sys.exit(1)