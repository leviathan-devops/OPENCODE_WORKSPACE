#!/usr/bin/env python3
"""
QUICK SHARK AGENT - Minimal working version
Uses Transformers directly as fallback until TGI/vLLM is ready
"""

import asyncio
import aiohttp
import subprocess
import os
import sys
from typing import Optional

# Try to import transformers
try:
    from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Warning: Transformers not available. Install with: pip install transformers torch")

class Config:
    # Model settings
    MODEL_NAME = "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ"
    
    # Discord
    DISCORD_TOKEN = os.getenv("SHARK_DISCORD_TOKEN", "")
    
    # Safe commands
    SAFE_COMMANDS = ["ls", "pwd", "echo", "cat", "python", "pip", "git"]
    DANGEROUS = ["rm -rf", "mkfs", "dd", "format"]

class SimpleModel:
    """Simple model interface using Transformers"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.pipe = None
        
    def load(self):
        """Load the model (blocking)"""
        if not TRANSFORMERS_AVAILABLE:
            return False
            
        try:
            print("Loading model... (this may take a minute)")
            self.tokenizer = AutoTokenizer.from_pretrained(Config.MODEL_NAME)
            self.model = AutoModelForCausalLM.from_pretrained(
                Config.MODEL_NAME,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            self.pipe = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                device_map="auto"
            )
            print("Model loaded!")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def generate(self, prompt: str, max_tokens: int = 512) -> str:
        """Generate text (blocking)"""
        if not self.pipe:
            return "Model not loaded"
            
        try:
            result = self.pipe(
                prompt,
                max_new_tokens=max_tokens,
                temperature=0.7,
                do_sample=True
            )
            return result[0]['generated_text'][len(prompt):].strip()
        except Exception as e:
            return f"Generation error: {e}"

class SafeExecutor:
    """Safe command executor"""
    
    @staticmethod
    def is_safe(cmd: str) -> bool:
        cmd_lower = cmd.lower()
        for dangerous in Config.DANGEROUS:
            if dangerous in cmd_lower:
                return False
        first = cmd.strip().split()[0] if cmd.strip() else ""
        return first in Config.SAFE_COMMANDS
    
    @staticmethod
    async def execute(cmd: str) -> str:
        if not SafeExecutor.is_safe(cmd):
            return f"Blocked: {cmd}"
            
        try:
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            output = ""
            if stdout:
                output += stdout.decode('utf-8', errors='ignore')
            if stderr:
                output += f"\nSTDERR: {stderr.decode('utf-8', errors='ignore')}"
                
            return output or "(No output)"
        except Exception as e:
            return f"Error: {e}"

class SharkAgent:
    """Simple SHARK agent"""
    
    def __init__(self):
        self.model = SimpleModel()
        self.executor = SafeExecutor()
        self.model_loaded = False
        
    def load_model(self):
        """Load model in background thread"""
        self.model_loaded = self.model.load()
        
    async def process(self, input_text: str) -> str:
        """Process input"""
        if not self.model_loaded:
            return "Model not loaded yet. Please wait..."
        
        # Create prompt
        prompt = f"""You are SHARK, a coding assistant.

Request: {input_text}

Provide:
1. Brief analysis
2. Commands to run (prefixed with $)
3. Explanation

Response:"""
        
        # Generate (run in thread to avoid blocking)
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, self.model.generate, prompt)
        
        # Extract commands
        lines = response.split('\n')
        commands = []
        for line in lines:
            if line.strip().startswith('$'):
                cmd = line.strip()[1:].strip()
                if cmd:
                    commands.append(cmd)
        
        # Execute commands
        results = []
        for cmd in commands[:2]:  # Limit to 2 commands
            result = await self.executor.execute(cmd)
            results.append(f"$ {cmd}\n{result}")
        
        # Combine
        final = response
        if results:
            final += "\n\n" + "="*40 + "\nEXECUTION:\n" + "="*40 + "\n"
            final += "\n".join(results)
            
        return final

async def terminal_interface(agent: SharkAgent):
    """Simple terminal interface"""
    print("🦈 SHARK (Quick Version)")
    print("Type 'exit' to quit")
    
    while True:
        try:
            user_input = input("\nshark> ").strip()
            
            if user_input.lower() in ['exit', 'quit']:
                break
                
            if not user_input:
                continue
                
            print("Processing...")
            response = await agent.process(user_input)
            print(f"\n{response}")
            
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")

async def main():
    """Main function"""
    print("Starting SHARK agent...")
    
    # Create agent
    agent = SharkAgent()
    
    # Load model in background
    print("Loading model in background...")
    load_task = asyncio.create_task(asyncio.to_thread(agent.load_model))
    
    # Start terminal
    await terminal_interface(agent)
    
    # Wait for model load if still running
    if not load_task.done():
        load_task.cancel()

if __name__ == "__main__":
    # Check for .env
    env_file = "/home/leviathan/shark/.env"
    if not os.path.exists(env_file):
        with open(env_file, "w") as f:
            f.write("# SHARK_DISCORD_TOKEN=your_token\n")
    
    # Run
    asyncio.run(main())