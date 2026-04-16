#!/usr/bin/env python3
"""
SHARK AGENT - SIMPLE WORKING VERSION
No vLLM/TGI dependency - uses command execution only
Can be upgraded later when vLLM is installed
"""

import subprocess
import os
import sys
import json
from typing import List, Dict, Any
import time

class SharkConfig:
    """SHARK configuration"""
    
    # Safe commands (ALLOWLIST)
    SAFE_COMMANDS = [
        "ls", "pwd", "cat", "head", "tail", "wc", "find", "grep",
        "mkdir", "touch", "rm", "cp", "mv", "ln", "chmod", "chown",
        "python", "python3", "pip", "git", "curl", "wget", "tar",
        "zip", "unzip", "gzip", "gunzip",
        "df", "du", "free", "top", "ps", "kill", "pgrep",
        "uname", "whoami", "hostname", "date",
        "ping", "netstat", "ss", "ifconfig", "ip",
        "echo", "printf", "sed", "awk", "sort", "uniq", "cut",
    ]
    
    # Dangerous patterns (BLOCKLIST)
    DANGEROUS_PATTERNS = [
        "rm -rf /", "rm -rf /*", "rm -rf .", "rm -rf *",
        "mkfs", "dd if=", "format", "fdisk", "parted",
        ":(){ :|:& };:", "fork()", "forkbomb",
        "chmod -R 777 /", "chown -R root:root /",
        "> /dev/sda", "dd of=/dev/sda",
    ]
    
    WORK_DIR = os.getcwd()

class SharkAgent:
    """Simple SHARK agent without AI model"""
    
    def __init__(self, config: SharkConfig = None):
        self.config = config or SharkConfig()
        self.command_history = []
    
    def is_safe(self, command: str) -> tuple[bool, str]:
        """Check if command is safe"""
        cmd = command.strip()
        
        if not cmd:
            return False, "Empty command"
        
        # Check dangerous patterns
        for pattern in self.config.DANGEROUS_PATTERNS:
            if pattern in cmd:
                return False, f"Dangerous pattern: {pattern}"
        
        # Extract first word
        parts = cmd.split()
        if not parts:
            return False, "No command"
        
        first_word = parts[0]
        if first_word not in self.config.SAFE_COMMANDS:
            return False, f"Command '{first_word}' not in safe list"
        
        return True, "OK"
    
    def execute(self, command: str) -> Dict[str, Any]:
        """Execute a command safely"""
        is_safe, reason = self.is_safe(command)
        if not is_safe:
            return {
                "success": False,
                "error": reason,
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1
            }
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30,
                cwd=self.config.WORK_DIR
            )
            
            self.command_history.append({
                "command": command,
                "timestamp": time.time(),
                "success": result.returncode == 0
            })
            
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
                "error": "Command timed out",
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1
            }
    
    def process_direct_command(self, command: str) -> Dict[str, Any]:
        """Process a direct shell command"""
        print(f"Executing: {command}")
        result = self.execute(command)
        
        output = {
            "input": command,
            "type": "direct_command",
            "result": result
        }
        
        return output
    
    def process_natural_request(self, request: str) -> Dict[str, Any]:
        """
        Process a natural language request.
        Simple keyword-based command generation.
        """
        request_lower = request.lower()
        commands_to_try = []
        
        # Keyword mapping
        if "disk" in request_lower or "space" in request_lower:
            commands_to_try.append("df -h")
        
        if "memory" in request_lower or "ram" in request_lower:
            commands_to_try.append("free -h")
        
        if "list" in request_lower and "file" in request_lower:
            commands_to_try.append("ls -la")
        
        if "current" in request_lower and "directory" in request_lower:
            commands_to_try.append("pwd")
        
        if "python" in request_lower and "version" in request_lower:
            commands_to_try.append("python3 --version")
        
        if "system" in request_lower and "info" in request_lower:
            commands_to_try.extend(["uname -a", "whoami", "hostname"])
        
        if "process" in request_lower or "running" in request_lower:
            commands_to_try.append("ps aux | head -20")
        
        if "network" in request_lower:
            commands_to_try.extend(["ifconfig", "ip addr"])
        
        # Default fallback
        if not commands_to_try:
            commands_to_try.append("echo 'SHARK: I can execute commands. Try: ls, df -h, free -h, pwd'")
        
        # Execute commands
        results = []
        for cmd in commands_to_try[:3]:  # Limit to 3 commands
            results.append(self.execute(cmd))
        
        output = {
            "input": request,
            "type": "natural_request",
            "interpretation": f"Based on keywords: {request_lower}",
            "commands_tried": commands_to_try,
            "results": results
        }
        
        return output
    
    def format_output(self, output: Dict[str, Any]) -> str:
        """Format output for display"""
        lines = []
        lines.append("=" * 60)
        lines.append("🦈 SHARK AGENT")
        lines.append("=" * 60)
        lines.append(f"Input: {output['input']}")
        lines.append(f"Type: {output['type']}")
        
        if output['type'] == 'direct_command':
            result = output['result']
            lines.append("")
            lines.append(f"Command: {result['command']}")
            if result.get('success'):
                lines.append("✅ Success")
                if result.get('stdout'):
                    lines.append("Output:")
                    lines.append(result['stdout'])
            else:
                lines.append("❌ Failed")
                if result.get('error'):
                    lines.append(f"Error: {result['error']}")
                if result.get('stderr'):
                    lines.append(f"Stderr: {result['stderr']}")
        
        elif output['type'] == 'natural_request':
            lines.append(f"Interpretation: {output['interpretation']}")
            lines.append("")
            
            for i, (cmd, res) in enumerate(zip(output['commands_tried'], output['results'])):
                lines.append(f"[{i+1}] $ {cmd}")
                if res.get('success'):
                    if res.get('stdout'):
                        # Truncate long output
                        stdout = res['stdout']
                        if len(stdout) > 300:
                            stdout = stdout[:300] + "...\n[Output truncated]"
                        lines.append(f"   ✅ {stdout}")
                    else:
                        lines.append("   ✅ (no output)")
                else:
                    lines.append(f"   ❌ Failed: {res.get('error', 'Unknown error')}")
                lines.append("")
        
        lines.append("=" * 60)
        return "\n".join(lines)

class TerminalInterface:
    """Terminal interface for SHARK"""
    
    def __init__(self, agent: SharkAgent):
        self.agent = agent
    
    def run(self):
        """Run the terminal loop"""
        print("\n" + "="*60)
        print("🦈 SHARK AGENT - SIMPLE VERSION")
        print("="*60)
        print("Mode 1: Direct commands (prefix with !)")
        print("  !ls -la")
        print("  !df -h")
        print("Mode 2: Natural requests")
        print("  show disk space")
        print("  list files")
        print("  system information")
        print("Type 'exit' to quit")
        print("="*60)
        
        while True:
            try:
                user_input = input("\nshark> ").strip()
                
                if user_input.lower() in ['exit', 'quit', 'q']:
                    print("\n👋 Goodbye!")
                    break
                
                if not user_input:
                    continue
                
                # Process input
                if user_input.startswith('!'):
                    # Direct command mode
                    command = user_input[1:].strip()
                    output = self.agent.process_direct_command(command)
                else:
                    # Natural request mode
                    output = self.agent.process_natural_request(user_input)
                
                # Display output
                print("\n" + self.agent.format_output(output))
                
            except KeyboardInterrupt:
                print("\n\n⚠ Interrupted")
                break
            except Exception as e:
                print(f"\n🚨 Error: {e}")

def check_vllm_installation():
    """Check if vLLM is installed (for future upgrade)"""
    try:
        import vllm
        print("✅ vLLM is installed")
        print(f"   Version: {vllm.__version__}")
        return True
    except ImportError:
        print("⚠ vLLM not installed")
        print("   This agent uses simple command execution only")
        print("   To upgrade: pip install vllm (when network works)")
        return False

def main():
    """Main entry point"""
    print("Starting SHARK Agent (Simple Version)...")
    
    # Check for vLLM
    check_vllm_installation()
    
    # Create agent
    agent = SharkAgent()
    
    # Create and run terminal interface
    terminal = TerminalInterface(agent)
    terminal.run()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSHARK terminated.")
    except Exception as e:
        print(f"\nFatal error: {e}")
        sys.exit(1)