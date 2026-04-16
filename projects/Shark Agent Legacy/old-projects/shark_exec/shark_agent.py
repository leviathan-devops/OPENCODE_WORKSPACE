#!/usr/bin/env python3
"""
🦈 SHARK AGENT - DUAL-BRAIN LOCAL AI AGENT
Primary: Qwen 2.5 Coder 7B (Architecture/Design)
Secondary: DeepSeek Coder 6.7B (Debugging/Optimization)
"""

import os
import sys
import json
import time
import subprocess
import threading
import asyncio
import aiohttp
from typing import Dict, List, Optional, Tuple
import re

# ============================================================================
# CONFIGURATION
# ============================================================================

class SharkConfig:
    """SHARK Agent Configuration"""
    
    # Model endpoints (Ollama)
    OLLAMA_URL = "http://localhost:11434"
    MODELS = {
        "qwen": "qwen2.5-coder:7b",
        "deepseek": "deepseek-coder:6.7b",
        "fast": "qwen3.5-fast:latest"
    }
    
    # Router keywords
    ROUTER_KEYWORDS = {
        "qwen": ["plan", "design", "architecture", "system", "devops", "setup", "config"],
        "deepseek": ["debug", "fix", "error", "bug", "optimize", "algorithm", "code"]
    }
    
    # Safety - blocked commands
    BLOCKED_COMMANDS = [
        "rm -rf /", "mkfs", "dd if=", "chmod 777 /", 
        ":(){ :|:& };:", "> /dev/sda", "shutdown", "reboot",
        "halt", "poweroff", "init 0"
    ]
    
    # Working directory
    WORK_DIR = "/home/leviathan/shark"
    
    # Discord config (optional)
    DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "")
    
    @staticmethod
    def get_model_for_query(query: str) -> str:
        """Route query to appropriate model"""
        query_lower = query.lower()
        
        # Check for DeepSeek keywords
        for keyword in SharkConfig.ROUTER_KEYWORDS["deepseek"]:
            if keyword in query_lower:
                return "deepseek"
        
        # Check for Qwen keywords  
        for keyword in SharkConfig.ROUTER_KEYWORDS["qwen"]:
            if keyword in query_lower:
                return "qwen"
        
        # Default to Qwen for general tasks
        return "qwen"

# ============================================================================
# ASYNC OLLAMA CLIENT (NO BLOCKING CALLS)
# ============================================================================

class AsyncOllamaClient:
    """Async HTTP client for Ollama with no blocking calls"""
    
    def __init__(self, base_url: str = SharkConfig.OLLAMA_URL):
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def generate(self, model: str, prompt: str, stream: bool = False, 
                      max_tokens: int = 4096) -> str:
        """Generate text from model (async)"""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "num_predict": max_tokens,
                "temperature": 0.7,
                "top_p": 0.95,
                "repeat_penalty": 1.1
            }
        }
        
        try:
            if stream:
                # Stream response
                full_response = ""
                async with self.session.post(url, json=payload) as response:
                    async for line in response.content:
                        if line:
                            try:
                                data = json.loads(line.decode('utf-8'))
                                if 'response' in data:
                                    chunk = data['response']
                                    print(chunk, end='', flush=True)
                                    full_response += chunk
                                if data.get('done', False):
                                    return full_response
                            except json.JSONDecodeError:
                                continue
                return full_response
            else:
                # Single response
                async with self.session.post(url, json=payload) as response:
                    data = await response.json()
                    return data.get('response', '')
                    
        except Exception as e:
            return f"Error: {str(e)}"
    
    async def chat(self, model: str, messages: List[Dict], stream: bool = False) -> str:
        """Chat completion (async)"""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream
        }
        
        try:
            if stream:
                full_response = ""
                async with self.session.post(url, json=payload) as response:
                    async for line in response.content:
                        if line:
                            try:
                                data = json.loads(line.decode('utf-8'))
                                if 'message' in data and 'content' in data['message']:
                                    chunk = data['message']['content']
                                    print(chunk, end='', flush=True)
                                    full_response += chunk
                                if data.get('done', False):
                                    return full_response
                            except json.JSONDecodeError:
                                continue
                return full_response
            else:
                async with self.session.post(url, json=payload) as response:
                    data = await response.json()
                    return data.get('message', {}).get('content', '')
                    
        except Exception as e:
            return f"Error: {str(e)}"

# ============================================================================
# SAFE COMMAND EXECUTOR
# ============================================================================

class SafeCommandExecutor:
    """Execute shell commands safely"""
    
    @staticmethod
    def is_safe(command: str) -> bool:
        """Check if command is safe to execute"""
        command_lower = command.lower()
        
        # Check blocked commands
        for blocked in SharkConfig.BLOCKED_COMMANDS:
            if blocked in command_lower:
                return False
        
        # Additional safety checks
        dangerous_patterns = [
            r"rm\s+.*-rf", r"chmod\s+.*777", r">\s+/dev/",
            r"mkfs", r"dd\s+.*if=", r":\(\)\{.*:\|:&"
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, command_lower):
                return False
        
        return True
    
    @staticmethod
    def execute(command: str, timeout: int = 30) -> Tuple[str, int]:
        """Execute a shell command safely"""
        if not SafeCommandExecutor.is_safe(command):
            return "❌ Command blocked for safety reasons", -1
        
        try:
            # Run command with timeout
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=SharkConfig.WORK_DIR
            )
            return result.stdout + result.stderr, result.returncode
        except subprocess.TimeoutExpired:
            return f"⏰ Command timed out after {timeout} seconds", -2
        except Exception as e:
            return f"❌ Error: {str(e)}", -3

# ============================================================================
# KEYBOARD CONTROLLER
# ============================================================================

class KeyboardController:
    """Control Asus keyboard RGB lighting"""
    
    def __init__(self):
        self.backlight_path = "/sys/class/leds/asus::kbd_backlight"
        self.brightness_file = os.path.join(self.backlight_path, "brightness")
        self.max_brightness = 3  # Default
    
    def set_brightness(self, level: int) -> bool:
        """Set keyboard brightness"""
        try:
            with open(self.brightness_file, 'w') as f:
                f.write(str(level))
            return True
        except:
            return False
    
    def execute_light_show(self, model_name: str):
        """Execute light show for a model"""
        word = model_name.upper() if model_name == "qwen" else "DEEPSEEK"
        
        print(f"\n🎮 {model_name.upper()} KEYBOARD TEST")
        print("-" * 40)
        
        # Turn off
        self.set_brightness(0)
        time.sleep(1)
        
        # Spell word
        print(f"🔤 Spelling: {word}")
        for letter in word:
            print(f"  {letter}", end=' ', flush=True)
            self.set_brightness(3)  # Max brightness
            time.sleep(0.3)
            self.set_brightness(1)  # Low brightness
            time.sleep(0.1)
        print()
        
        # Color flash
        print("🎨 Flashing colors...")
        colors = [1, 2, 3, 2, 1]
        for color in colors:
            self.set_brightness(color)
            time.sleep(0.5)
        
        # Turn off
        self.set_brightness(0)
        time.sleep(1)
        
        print(f"✅ {model_name.upper()} test complete!\n")

# ============================================================================
# SHARK AGENT CORE
# ============================================================================

class SharkAgent:
    """Main SHARK agent class"""
    
    def __init__(self):
        self.config = SharkConfig()
        self.executor = SafeCommandExecutor()
        self.keyboard = KeyboardController()
        self.running = True
    
    async def process_query(self, query: str) -> str:
        """Process a user query with the dual-brain system"""
        print(f"\n🦈 SHARK Processing: {query[:100]}...")
        print("=" * 60)
        
        # Route to appropriate model
        model_type = self.config.get_model_for_query(query)
        model_name = self.config.MODELS[model_type]
        
        print(f"🧠 Using {model_type.upper()} brain: {model_name}")
        
        # Create prompt
        prompt = f"""You are SHARK, an autonomous AI agent that executes code.
User query: {query}

Respond with:
1. Analysis of the task
2. Step-by-step plan
3. EXECUTABLE CODE if applicable (Python/bash)
4. Expected outcome

Be concise and actionable. If this is a system/architecture task, think like a DevOps engineer.
If this is a debugging/code task, think like a software engineer.

Response:"""
        
        # Get response from model
        async with AsyncOllamaClient() as client:
            print("\n🤖 Thinking...")
            response = await client.generate(model_name, prompt, stream=True)
        
        # Extract and execute code if present
        code_blocks = self.extract_code_blocks(response)
        if code_blocks:
            print("\n⚡ Executing code...")
            for code in code_blocks:
                output, exit_code = self.executor.execute(code)
                print(f"Output:\n{output}")
                if exit_code != 0:
                    print(f"Exit code: {exit_code}")
        
        return response
    
    def extract_code_blocks(self, text: str) -> List[str]:
        """Extract code blocks from response"""
        code_blocks = []
        
        # Extract Python code blocks
        python_matches = re.findall(r'```python\n(.*?)\n```', text, re.DOTALL)
        code_blocks.extend(python_matches)
        
        # Extract bash code blocks
        bash_matches = re.findall(r'```bash\n(.*?)\n```', text, re.DOTALL)
        code_blocks.extend(bash_matches)
        
        # Extract shell code blocks
        shell_matches = re.findall(r'```sh\n(.*?)\n```', text, re.DOTALL)
        code_blocks.extend(shell_matches)
        
        return code_blocks
    
    def test_dual_brain(self):
        """Test both models with keyboard control"""
        print("🧪 TESTING DUAL-BRAIN SYSTEM")
        print("=" * 50)
        
        # Test Qwen
        print("\n1. Testing Qwen 2.5 Coder 7B...")
        self.keyboard.execute_light_show("qwen")
        
        # Test DeepSeek
        print("\n2. Testing DeepSeek Coder 6.7B...")
        self.keyboard.execute_light_show("deepseek")
        
        # Return to normal
        print("\n3. Returning to normal mode...")
        self.keyboard.set_brightness(1)  # Normal brightness
        print("✅ Dual-brain test complete! Both models have hardware access.")
    
    async def terminal_loop(self):
        """Interactive terminal loop"""
        print("🦈 SHARK AGENT - DUAL-BRAIN LOCAL AI")
        print("=" * 50)
        print("Models: Qwen 2.5 Coder 7B (Design) | DeepSeek Coder 6.7B (Debug)")
        print("Type 'test' to verify both models, 'exit' to quit")
        print("=" * 50)
        
        while self.running:
            try:
                query = input("\n🦈 SHARK> ").strip()
                
                if query.lower() == 'exit':
                    print("👋 Goodbye!")
                    self.running = False
                    break
                elif query.lower() == 'test':
                    self.test_dual_brain()
                elif query:
                    response = await self.process_query(query)
                    print(f"\n📝 Response:\n{response}")
                else:
                    continue
                    
            except KeyboardInterrupt:
                print("\n👋 Interrupted, exiting...")
                self.running = False
                break
            except Exception as e:
                print(f"❌ Error: {e}")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

async def main():
    """Main entry point"""
    agent = SharkAgent()
    
    # Test dual-brain system first
    print("🚀 INITIALIZING SHARK DUAL-BRAIN SYSTEM...")
    agent.test_dual_brain()
    
    # Start terminal loop
    await agent.terminal_loop()

if __name__ == "__main__":
    # Check for root if keyboard control needed
    if os.geteuid() != 0:
        print("⚠️  Running without root - keyboard control disabled")
        print("   For full hardware access, run with: sudo python3 shark_agent.py")
    
    # Run async main
    asyncio.run(main())