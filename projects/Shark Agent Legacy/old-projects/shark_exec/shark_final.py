#!/usr/bin/env python3
"""
SHARK AGENT - FINAL WORKING VERSION
Simple, reliable, no external dependencies beyond Python stdlib
"""

import subprocess
import os
import sys
import json
import time
import threading
import queue
from typing import List, Dict, Any, Optional
import signal

class SharkConfig:
    """SHARK configuration - simple and safe"""
    
    # Safe commands (ALLOWLIST approach)
    SAFE_COMMANDS = {
        "system": ["uname", "whoami", "hostname", "date", "uptime"],
        "files": ["ls", "pwd", "cat", "head", "tail", "wc", "find", "grep", "stat"],
        "disk": ["df", "du", "free", "mount"],
        "process": ["ps", "top", "htop", "kill", "pgrep", "pkill"],
        "network": ["ping", "curl", "wget", "ifconfig", "ip", "netstat", "ss"],
        "package": ["apt", "dpkg", "pip", "python", "python3"],
        "git": ["git"],
        "misc": ["echo", "printf", "which", "whereis", "locate"]
    }
    
    # Dangerous patterns (BLOCKLIST)
    DANGEROUS_PATTERNS = [
        "rm -rf", "rm -rf /", "rm -rf /*", "rm -rf .", "rm -rf *",
        "mkfs", "dd if=", "dd of=", "format", "fdisk", "parted",
        ":(){ :|:& };:", "fork()", "forkbomb",
        "chmod -R 777 /", "chown -R root:root /",
        "> /dev/sda", "dd of=/dev/sda",
        "shutdown", "reboot", "halt", "poweroff",
        "sudo rm", "sudo mkfs", "sudo dd"
    ]
    
    WORK_DIR = os.getcwd()
    MAX_OUTPUT_SIZE = 10000  # 10KB max output
    COMMAND_TIMEOUT = 30  # seconds

class SharkAgent:
    """Simple, reliable SHARK agent"""
    
    def __init__(self, config: SharkConfig = None):
        self.config = config or SharkConfig()
        self.command_history = []
        self.running = True
        
        # Signal handling
        signal.signal(signal.SIGINT, self.handle_signal)
        signal.signal(signal.SIGTERM, self.handle_signal)
    
    def handle_signal(self, signum, frame):
        """Handle termination signals"""
        print(f"\n🦈 SHARK received signal {signum}, shutting down...")
        self.running = False
        sys.exit(0)
    
    def is_safe(self, command: str) -> tuple[bool, str]:
        """Check if command is safe - strict validation"""
        cmd = command.strip()
        
        if not cmd:
            return False, "Empty command"
        
        # Check dangerous patterns
        for pattern in self.config.DANGEROUS_PATTERNS:
            if pattern in cmd:
                return False, f"Dangerous pattern detected: {pattern}"
        
        # Extract first word
        parts = cmd.split()
        if not parts:
            return False, "No command"
        
        first_word = parts[0]
        
        # Check if command is in safe list
        safe = False
        for category, commands in self.config.SAFE_COMMANDS.items():
            if first_word in commands:
                safe = True
                break
        
        if not safe:
            return False, f"Command '{first_word}' not in safe list"
        
        return True, "OK"
    
    def truncate_output(self, text: str, max_size: int = None) -> str:
        """Truncate output if too large"""
        if max_size is None:
            max_size = self.config.MAX_OUTPUT_SIZE
        
        if len(text) > max_size:
            return text[:max_size] + f"\n\n[Output truncated - {len(text)} chars total]"
        return text
    
    def execute(self, command: str) -> Dict[str, Any]:
        """Execute a command safely with timeout"""
        is_safe, reason = self.is_safe(command)
        if not is_safe:
            return {
                "success": False,
                "error": reason,
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1,
                "timestamp": time.time()
            }
        
        try:
            # Execute with timeout
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=self.config.COMMAND_TIMEOUT,
                cwd=self.config.WORK_DIR
            )
            
            # Truncate large outputs
            stdout = self.truncate_output(result.stdout)
            stderr = self.truncate_output(result.stderr)
            
            self.command_history.append({
                "command": command,
                "timestamp": time.time(),
                "success": result.returncode == 0,
                "exit_code": result.returncode
            })
            
            return {
                "success": result.returncode == 0,
                "command": command,
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": result.returncode,
                "timestamp": time.time()
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"Command timed out after {self.config.COMMAND_TIMEOUT}s",
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1,
                "timestamp": time.time()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1,
                "timestamp": time.time()
            }
    
    def process_input(self, user_input: str) -> Dict[str, Any]:
        """Process user input - smart routing"""
        input_lower = user_input.strip().lower()
        
        # Direct command mode (starts with !)
        if user_input.startswith('!'):
            command = user_input[1:].strip()
            return self.execute(command)
        
        # Special commands
        if input_lower in ['help', '?']:
            return self.show_help()
        elif input_lower in ['status', 'health']:
            return self.system_status()
        elif input_lower in ['history', 'log']:
            return self.show_history()
        elif input_lower in ['clear', 'cls']:
            os.system('clear')
            return {
                "success": True,
                "command": "clear",
                "stdout": "Screen cleared",
                "stderr": "",
                "exit_code": 0
            }
        
        # Natural language processing (simple keyword matching)
        return self.natural_language_processing(user_input)
    
    def show_help(self) -> Dict[str, Any]:
        """Show help information"""
        help_text = """
🦈 SHARK AGENT - HELP
=====================

MODES:
  Direct command: !ls -la, !df -h, !free -m
  Natural language: "show disk space", "list files", "system info"

COMMANDS:
  !<command>      - Execute shell command
  help/?          - Show this help
  status/health   - System status
  history/log     - Command history
  clear/cls       - Clear screen

SAFE COMMANDS:
"""
        for category, commands in self.config.SAFE_COMMANDS.items():
            help_text += f"  {category}: {', '.join(commands[:5])}\n"
        
        help_text += "\nType 'exit' or 'quit' to exit."
        
        return {
            "success": True,
            "command": "help",
            "stdout": help_text,
            "stderr": "",
            "exit_code": 0
        }
    
    def system_status(self) -> Dict[str, Any]:
        """Get system status"""
        commands = [
            "uptime",
            "free -h",
            "df -h /",
            "ps aux | wc -l"
        ]
        
        results = []
        for cmd in commands:
            results.append(self.execute(cmd))
        
        status_text = "🦈 SYSTEM STATUS\n"
        status_text += "=" * 40 + "\n"
        
        for i, (cmd, res) in enumerate(zip(commands, results)):
            status_text += f"\n[{i+1}] $ {cmd}\n"
            if res['success']:
                status_text += f"✅ {res['stdout']}\n"
            else:
                status_text += f"❌ {res.get('error', 'Failed')}\n"
        
        return {
            "success": True,
            "command": "system_status",
            "stdout": status_text,
            "stderr": "",
            "exit_code": 0
        }
    
    def show_history(self) -> Dict[str, Any]:
        """Show command history"""
        if not self.command_history:
            return {
                "success": True,
                "command": "history",
                "stdout": "No command history yet.",
                "stderr": "",
                "exit_code": 0
            }
        
        history_text = "🦈 COMMAND HISTORY\n"
        history_text += "=" * 40 + "\n"
        
        for i, entry in enumerate(self.command_history[-10:]):  # Last 10 commands
            timestamp = time.strftime('%H:%M:%S', time.localtime(entry['timestamp']))
            status = "✅" if entry['success'] else "❌"
            history_text += f"\n{i+1:2d}. [{timestamp}] {status} {entry['command'][:50]}"
            if 'exit_code' in entry and entry['exit_code'] != 0:
                history_text += f" (exit: {entry['exit_code']})"
        
        return {
            "success": True,
            "command": "history",
            "stdout": history_text,
            "stderr": "",
            "exit_code": 0
        }
    
    def natural_language_processing(self, request: str) -> Dict[str, Any]:
        """Simple natural language processing"""
        request_lower = request.lower()
        commands = []
        
        # Keyword mapping
        keywords = {
            "disk": ["df -h", "lsblk"],
            "memory": ["free -h", "cat /proc/meminfo | head -5"],
            "cpu": ["lscpu | grep -E 'Model name|CPU\\(s\\)'", "top -bn1 | head -5"],
            "files": ["ls -la", "find . -type f | head -20"],
            "process": ["ps aux --sort=-%cpu | head -10"],
            "network": ["ifconfig", "ip addr", "netstat -tulpn | head -20"],
            "system": ["uname -a", "whoami", "hostname"],
            "python": ["python3 --version", "pip list | head -10"],
            "git": ["git status", "git log --oneline -5"],
            "users": ["who", "w"],
            "date": ["date", "cal"],
            "logs": ["tail -20 /var/log/syslog", "dmesg | tail -20"]
        }
        
        for keyword, cmd_list in keywords.items():
            if keyword in request_lower:
                commands.extend(cmd_list)
        
        # Default if no keywords matched
        if not commands:
            return self.execute(f"echo 'SHARK: I can execute commands. Try: !ls -la, !df -h, or type help'")
        
        # Execute up to 3 commands
        results = []
        for cmd in commands[:3]:
            results.append(self.execute(cmd))
        
        # Format output
        output = f"🦈 Processing: '{request}'\n"
        output += "=" * 40 + "\n"
        
        for i, (cmd, res) in enumerate(zip(commands[:3], results)):
            output += f"\n[{i+1}] $ {cmd}\n"
            if res['success']:
                if res['stdout']:
                    output += f"✅ {res['stdout']}\n"
                else:
                    output += "✅ (no output)\n"
            else:
                output += f"❌ {res.get('error', 'Failed')}\n"
        
        return {
            "success": True,
            "command": "nlp",
            "stdout": output,
            "stderr": "",
            "exit_code": 0
        }
    
    def format_result(self, result: Dict[str, Any]) -> str:
        """Format result for display"""
        lines = []
        
        if 'command' in result:
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
        
        if 'exit_code' in result and result['exit_code'] != 0:
            lines.append(f"Exit code: {result['exit_code']}")
        
        return "\n".join(lines)

class TerminalInterface:
    """Terminal interface for SHARK"""
    
    def __init__(self, agent: SharkAgent):
        self.agent = agent
        self.running = True
    
    def run(self):
        """Run the terminal loop"""
        self.clear_screen()
        self.show_banner()
        
        while self.agent.running and self.running:
            try:
                # Get user input
                user_input = input("\n🦈 shark> ").strip()
                
                # Check for exit
                if user_input.lower() in ['exit', 'quit', 'q']:
                    print("\n👋 Goodbye!")
                    break
                
                if not user_input:
                    continue
                
                # Process input
                result = self.agent.process_input(user_input)
                
                # Display result
                print("\n" + self.agent.format_result(result))
                
            except KeyboardInterrupt:
                print("\n\n⚠ Interrupted (Ctrl+C to exit)")
                continue
            except EOFError:
                print("\n\n📡 EOF received")
                break
            except Exception as e:
                print(f"\n🚨 Error: {e}")
                continue
    
    def clear_screen(self):
        """Clear the terminal screen"""
        os.system('clear')
    
    def show_banner(self):
        """Show SHARK banner"""
        banner = """
        ███████╗██╗  ██╗ █████╗ ██████╗ ██╗  ██╗
        ██╔════╝██║  ██║██╔══██╗██╔══██╗██║ ██╔╝
        ███████╗███████║███████║██████╔╝█████╔╝ 
        ╚════██║██╔══██║██╔══██║██╔══██╗██╔═██╗ 
        ███████║██║  ██║██║  ██║██║  ██║██║  ██╗
        ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
        
        Simple, Reliable AI Agent
        Version 1.0 - No External Dependencies
        """
        print(banner)
        print("=" * 60)
        print("Type 'help' for commands, 'exit' to quit")
        print("=" * 60)

def check_system():
    """Check system requirements"""
    print("🔍 Checking system...")
    
    checks = [
        ("Python 3.12+", lambda: sys.version_info >= (3, 12)),
        ("Working directory", lambda: os.path.exists("/home/leviathan/shark")),
        ("Network connectivity", lambda: subprocess.run(["ping", "-c", "1", "8.8.8.8"], capture_output=True).returncode == 0),
    ]
    
    all_ok = True
    for name, check in checks:
        try:
            if check():
                print(f"  ✅ {name}")
            else:
                print(f"  ⚠  {name} (warning)")
                all_ok = False
        except:
            print(f"  ❌ {name} (failed)")
            all_ok = False
    
    return all_ok

def main():
    """Main entry point"""
    print("🚀 Starting SHARK Agent...")
    
    # Check system
    if not check_system():
        print("\n⚠  Some checks failed, but continuing anyway...")
    
    # Create agent
    agent = SharkAgent()
    
    # Create and run terminal interface
    terminal = TerminalInterface(agent)
    
    try:
        terminal.run()
    except KeyboardInterrupt:
        print("\n\n🦈 SHARK terminated by user.")
    except Exception as e:
        print(f"\n💥 Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()