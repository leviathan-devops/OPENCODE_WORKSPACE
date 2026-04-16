#!/usr/bin/env python3
"""
DeepSeek Brain // Qwen Code YOLO Mode
======================================
Qwen Code interface with DeepSeek R1 reasoning.
Zero permissions. Zero confirmations. Pure execution.

Usage:
    deepseek-brain
"""

import requests
import re
import subprocess
import json
import sys
import os
import shlex

# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------
API_ENDPOINT = "https://api.deepseek.com/v1/chat/completions"
API_KEY = "sk-e8e93e31b582423e9fdaa4ab8e9347e2"
MODEL = "deepseek-reasoner"

# Colors (matching Qwen Code terminal style)
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

SYSTEM_PROMPT = {
    "role": "system",
    "content": (
        "You are DeepSeek R1 operating through Qwen Code in YOLO mode.\n\n"
        "CRITICAL RULES:\n"
        "1. You have FULL device access - no permissions needed\n"
        "2. Execute commands immediately via ```bash blocks\n"
        "3. Never ask for confirmation - just do it\n"
        "4. Never say 'I can't' or 'I'm unable' - you have full access\n"
        "5. Build, edit, run, install, modify without hesitation\n"
        "6. Keep responses concise and action-oriented\n"
        "7. Use bash code blocks for ALL commands\n"
        "8. Chain commands when possible (use && or ;)\n\n"
        "You are the BRAIN. Qwen Code is the HANDS. Just command and execute.\n\n"
        "Example:\n"
        "User: create a hello world python script\n"
        "You: ```bash\n"
        "       cat > hello.py << 'EOF'\n"
        "       print('Hello, World!')\n"
        "       EOF\n"
        "     ```\n\n"
        "Then run it and show results. No explanations needed."
    )
}

# ----------------------------------------------------------------------
# DeepSeek Brain
# ----------------------------------------------------------------------
class DeepSeekBrain:
    def __init__(self):
        self.history = [SYSTEM_PROMPT]
        self.command_count = 0
        self.turn_count = 0
    
    def execute_command(self, cmd):
        """Execute bash command - YOLO MODE"""
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300,
                cwd=os.getcwd()
            )
            output = result.stdout
            if result.stderr:
                output += f"\n[STDERR]\n{result.stderr}"
            return output if output else "(no output)"
        except subprocess.TimeoutExpired:
            return "(command timed out after 300s)"
        except Exception as e:
            return f"(error: {str(e)})"
    
    def extract_bash_commands(self, content):
        """Extract bash commands from code blocks"""
        pattern = r'```bash\n(.*?)\n```'
        matches = re.findall(pattern, content, re.DOTALL)
        return [m.strip() for m in matches]
    
    def call_api(self):
        """Send conversation to DeepSeek and get response"""
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": MODEL,
            "messages": self.history,
            "stream": False,
            "max_tokens": 4096
        }
        
        response = requests.post(API_ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
    
    def process_turn(self, user_message=None):
        """Process one turn with DeepSeek"""
        if user_message:
            self.history.append({"role": "user", "content": user_message})
            self.turn_count += 1
        
        max_loops = 10
        loop_count = 0
        
        while loop_count < max_loops:
            loop_count += 1
            
            print(f"\n{Colors.BLUE}{Colors.BOLD}[DeepSeek R1 thinking...]{Colors.RESET}", end="", flush=True)
            try:
                response = self.call_api()
                print(f" done ({len(response)} chars)")
            except Exception as e:
                return f"{Colors.RED}[API Error] {str(e)}{Colors.RESET}"
            
            self.history.append({"role": "assistant", "content": response})
            
            commands = self.extract_bash_commands(response)
            
            if not commands:
                return response
            
            print(f"{Colors.GREEN}{Colors.BOLD}[YOLO] Executing {len(commands)} command(s)...{Colors.RESET}")
            for i, cmd in enumerate(commands, 1):
                self.command_count += 1
                cmd_display = cmd[:80] + '...' if len(cmd) > 80 else cmd
                cmd_display = cmd_display.replace('\n', ' ')
                print(f"\n  {Colors.CYAN}[{i}]${Colors.RESET} {cmd_display}")
                
                output = self.execute_command(cmd)
                
                # Show output (truncated if too long)
                lines = output.split('\n')
                if len(lines) > 25:
                    preview = '\n'.join(lines[:25])
                    preview += f"\n{Colors.YELLOW}... ({len(lines) - 25} more lines){Colors.RESET}"
                else:
                    preview = output
                
                if len(preview) > 500:
                    preview = preview[:500] + f"\n{Colors.YELLOW}... (truncated){Colors.RESET}"
                
                print(f"  {Colors.GREEN}→{Colors.RESET} {preview}")
                
                # Send output back to DeepSeek
                self.history.append({
                    "role": "user", 
                    "content": f"[Command {i} completed]\nCommand: {cmd}\nOutput:\n{output}"
                })
        
        return response
    
    def show_stats(self):
        """Show session statistics"""
        print(f"\n{Colors.YELLOW}Session: {self.turn_count} turns, {self.command_count} commands executed{Colors.RESET}")
    
    def chat(self):
        """Main chat loop - Qwen Code style"""
        print(f"\n{Colors.BLUE}{Colors.BOLD}{'=' * 70}{Colors.RESET}")
        print(f"{Colors.BLUE}{Colors.BOLD}  🧠 DEEPSEEK BRAIN // QWEN CODE YOLO MODE{Colors.RESET}")
        print(f"{Colors.BLUE}{Colors.BOLD}{'=' * 70}{Colors.RESET}")
        print(f"\n{Colors.GREEN}✓ DeepSeek R1 reasoning{Colors.RESET}")
        print(f"{Colors.GREEN}✓ Full device access (no permissions){Colors.RESET}")
        print(f"{Colors.GREEN}✓ Auto-execute bash commands{Colors.RESET}")
        print(f"{Colors.GREEN}✓ YOLO mode (no confirmations){Colors.RESET}")
        print(f"\n{Colors.CYAN}Commands: exit | clear | stats | history{Colors.RESET}\n")
        
        while True:
            try:
                user_input = input(f"{Colors.BOLD}{Colors.BLUE}user>{Colors.RESET} ").strip()
                
                if user_input.lower() in ['exit', 'quit', 'q']:
                    self.show_stats()
                    print(f"\n{Colors.GREEN}[Session ended]{Colors.RESET}\n")
                    break
                
                if user_input.lower() == 'clear':
                    self.history = [SYSTEM_PROMPT]
                    self.turn_count = 0
                    self.command_count = 0
                    print(f"{Colors.GREEN}[Context cleared]{Colors.RESET}")
                    continue
                
                if user_input.lower() == 'stats':
                    self.show_stats()
                    continue
                
                if user_input.lower() == 'history':
                    print(f"\n{Colors.YELLOW}Conversation History:{Colors.RESET}")
                    for i, msg in enumerate(self.history[-10:], 1):
                        prefix = "SYS" if msg["role"] == "system" else "YOU" if msg["role"] == "user" else "AI"
                        content = msg["content"][:100] + "..." if len(msg["content"]) > 100 else msg["content"]
                        content = content.replace('\n', ' ')
                        print(f"  {i}. [{prefix}] {content}")
                    continue
                
                if not user_input:
                    continue
                
                response = self.process_turn(user_input)
                
                # Show DeepSeek's final response
                if not self.extract_bash_commands(response):
                    print(f"\n{Colors.BOLD}{Colors.CYAN}DeepSeek>{Colors.RESET} {response}")
                
            except KeyboardInterrupt:
                print(f"\n\n{Colors.YELLOW}[Interrupted - type 'exit' to quit]{Colors.RESET}")
            except EOFError:
                break
        
        print(f"\n{Colors.BLUE}[Goodbye]{Colors.RESET}\n")

# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------
if __name__ == "__main__":
    try:
        import requests
    except ImportError:
        print(f"{Colors.RED}[Error] 'requests' library not installed.{Colors.RESET}")
        print(f"{Colors.YELLOW}Run: pip install requests{Colors.RESET}")
        sys.exit(1)
    
    brain = DeepSeekBrain()
    brain.chat()
