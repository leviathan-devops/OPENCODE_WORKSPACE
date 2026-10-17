#!/usr/bin/env python3
"""
DeepSeek R1 Proxy Agent
Bridges DeepSeek API with local device access.
Executes bash commands requested by DeepSeek and returns results.
"""

import requests
import re
import subprocess
import json
import sys

API_ENDPOINT = "https://api.deepseek.com/v1/chat/completions"
API_KEY = "<REDACTED_SET_VIA_ENV>"
MODEL = "deepseek-reasoner"

class DeepSeekProxy:
    def __init__(self):
        self.conversation_history = [
            {
                "role": "system",
                "content": """You are DeepSeek R1 with full control over the user's device via a proxy agent.

To execute commands, output them in a fenced bash code block like:
```bash
your-command-here
```

The proxy will execute the command and return the output. Continue reasoning and requesting commands until you have a final answer.

When you have a final response for the user, provide it clearly at the end."""
            }
        ]
    
    def execute_command(self, cmd):
        """Execute bash command and return output"""
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=120
            )
            output = result.stdout
            if result.stderr:
                output += f"\nSTDERR:\n{result.stderr}"
            return output if output else "(no output)"
        except subprocess.TimeoutExpired:
            return "(command timed out after 120s)"
        except Exception as e:
            return f"(error: {str(e)})"
    
    def extract_bash_commands(self, content):
        """Extract bash commands from code blocks"""
        pattern = r'```bash\n(.*?)\n```'
        matches = re.findall(pattern, content, re.DOTALL)
        return matches
    
    def send_to_deepseek(self, user_message=None):
        """Send message to DeepSeek API and get response"""
        if user_message:
            self.conversation_history.append({"role": "user", "content": user_message})
        
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": MODEL,
            "messages": self.conversation_history,
            "stream": False
        }
        
        response = requests.post(API_ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        assistant_message = data["choices"][0]["message"]["content"]
        
        self.conversation_history.append({"role": "assistant", "content": assistant_message})
        return assistant_message
    
    def process_response(self, content):
        """Check for bash commands, execute them, and return results to DeepSeek"""
        commands = self.extract_bash_commands(content)
        
        if commands:
            print(f"\n[DeepSeek requested {len(commands)} command(s) to execute]")
            
            for i, cmd in enumerate(commands):
                print(f"\n[Executing command {i+1}]: {cmd[:80]}{'...' if len(cmd) > 80 else ''}")
                output = self.execute_command(cmd)
                print(f"[Output]: {output[:200]}{'...' if len(output) > 200 else ''}")
                
                # Send output back to DeepSeek
                followup = f"Command output for: {cmd}\n\n{output}"
                content = self.send_to_deepseek(followup)
                print(f"\n[DeepSeek response after command]: {content[:300]}{'...' if len(content) > 300 else ''}")
        
        return content
    
    def chat(self):
        """Main chat loop"""
        print("=" * 60)
        print("DeepSeek R1 Proxy Agent")
        print("Type 'quit' or 'exit' to end the session")
        print("=" * 60)
        
        while True:
            try:
                user_input = input("\n[You]: ").strip()
                
                if user_input.lower() in ['quit', 'exit']:
                    print("[Ending session]")
                    break
                
                if not user_input:
                    continue
                
                print("\n[Thinking...]")
                response = self.send_to_deepseek(user_input)
                print(f"\n[DeepSeek]: {response}")
                
                # Process any commands
                final_response = self.process_response(response)
                
                if not self.extract_bash_commands(final_response):
                    print(f"\n[Final Answer]: {final_response}")
                    
            except KeyboardInterrupt:
                print("\n[Interrupted by user]")
                break
            except Exception as e:
                print(f"\n[Error]: {str(e)}")

if __name__ == "__main__":
    proxy = DeepSeekProxy()
    proxy.chat()
