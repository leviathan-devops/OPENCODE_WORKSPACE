#!/bin/bash
# SHARK Agent Deployment Script - vLLM Version
# No Ollama, uses vLLM for model serving

set -e

echo "🦈 DEPLOYING SHARK AGENT WITH vLLM"

# Create directory structure
mkdir -p /home/leviathan/shark
cd /home/leviathan/shark

# Install system dependencies
echo "Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv python3-dev build-essential

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install vLLM with --break-system-packages (Ubuntu 24.04 workaround)
echo "Installing vLLM and dependencies..."
pip install --upgrade pip
pip install vllm==0.5.3.post1 torch --index-url https://download.pytorch.org/whl/cu121 --break-system-packages
pip install aiohttp discord.py python-dotenv psutil --break-system-packages

# Create the SHARK agent script
cat > shark_agent.py << 'EOF'
#!/usr/bin/env python3
"""
SHARK Agent - Local Autonomous AI Agent
Uses vLLM for model serving (OpenAI-compatible API)
"""

import asyncio
import aiohttp
import json
import subprocess
import shlex
import os
import sys
from typing import Optional, Dict, Any
from enum import Enum
import time

# Discord imports
import discord
from discord.ext import commands

# vLLM imports
from vllm import AsyncLLMEngine, SamplingParams
from vllm.engine.arg_utils import AsyncEngineArgs
from vllm.utils import random_uuid

# Configuration
class Config:
    # Model paths (using cached models)
    QWEN_MODEL = "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ"
    DEEPSEEK_MODEL = "deepseek-ai/DeepSeek-Coder-6.7B-Instruct"
    
    # Discord bot token
    DISCORD_TOKEN = os.getenv("SHARK_DISCORD_TOKEN", "")
    
    # Safe command patterns
    SAFE_COMMANDS = [
        "ls", "cd", "pwd", "cat", "grep", "find",
        "python", "python3", "pip", "git",
        "mkdir", "touch", "rm", "cp", "mv",
        "echo", "curl", "wget", "tar", "zip", "unzip"
    ]
    
    # Dangerous commands
    DANGEROUS_PATTERNS = [
        "rm -rf", "mkfs", "dd", "format",
        ":(){ :|:& };:", "forkbomb"
    ]
    
    # vLLM settings
    MAX_MODEL_LENGTH = 8192
    GPU_MEMORY_UTILIZATION = 0.9  # Use 90% of 12GB VRAM

class ModelType(Enum):
    QWEN = "qwen"
    DEEPSEEK = "deepseek"

class VLLMManager:
    """Manages vLLM engines for different models"""
    
    _engines: Dict[ModelType, AsyncLLMEngine] = {}
    _initialized = False
    
    @classmethod
    async def initialize(cls):
        """Initialize vLLM engines for both models"""
        if cls._initialized:
            return
            
        print("Initializing vLLM engines...")
        
        # Qwen engine args
        qwen_args = AsyncEngineArgs(
            model=Config.QWEN_MODEL,
            tensor_parallel_size=1,
            gpu_memory_utilization=Config.GPU_MEMORY_UTILIZATION,
            max_model_len=Config.MAX_MODEL_LENGTH,
            quantization="awq",  # Already AWQ quantized
            disable_log_stats=True,
            enforce_eager=True  # Avoid graph breaks
        )
        
        # DeepSeek engine args
        deepseek_args = AsyncEngineArgs(
            model=Config.DEEPSEEK_MODEL,
            tensor_parallel_size=1,
            gpu_memory_utilization=Config.GPU_MEMORY_UTILIZATION,
            max_model_len=Config.MAX_MODEL_LENGTH,
            disable_log_stats=True,
            enforce_eager=True
        )
        
        try:
            # Initialize engines
            cls._engines[ModelType.QWEN] = AsyncLLMEngine.from_engine_args(qwen_args)
            print(f"✓ Qwen engine initialized")
            
            cls._engines[ModelType.DEEPSEEK] = AsyncLLMEngine.from_engine_args(deepseek_args)
            print(f"✓ DeepSeek engine initialized")
            
            cls._initialized = True
            print("✅ vLLM engines ready")
            
        except Exception as e:
            print(f"Error initializing vLLM engines: {e}")
            # Fallback to single model if VRAM insufficient
            print("Falling back to Qwen only...")
            cls._engines[ModelType.QWEN] = AsyncLLMEngine.from_engine_args(qwen_args)
            cls._initialized = True
    
    @classmethod
    async def generate(cls, model_type: ModelType, prompt: str, max_tokens: int = 1024) -> str:
        """Generate text using vLLM engine"""
        if not cls._initialized:
            await cls.initialize()
            
        if model_type not in cls._engines:
            # Fallback to Qwen if requested model not available
            model_type = ModelType.QWEN
            
        engine = cls._engines[model_type]
        
        # Create sampling params
        sampling_params = SamplingParams(
            temperature=0.7,
            top_p=0.95,
            max_tokens=max_tokens,
            stop=["</s>", "```", "\n\n\n"]
        )
        
        # Generate
        request_id = random_uuid()
        results_generator = engine.generate(prompt, sampling_params, request_id)
        
        async for request_output in results_generator:
            return request_output.outputs[0].text
        
        return ""

class Router:
    """Simple keyword-based router"""
    
    @staticmethod
    def route(input_text: str) -> ModelType:
        input_lower = input_text.lower()
        
        qwen_keywords = ["design", "architecture", "plan", "system", "devops", 
                        "infrastructure", "deploy", "setup", "configure"]
        
        deepseek_keywords = ["debug", "fix", "error", "bug", "optimize", 
                           "algorithm", "performance", "memory", "speed"]
        
        qwen_score = sum(1 for kw in qwen_keywords if kw in input_lower)
        deepseek_score = sum(1 for kw in deepseek_keywords if kw in input_lower)
        
        if deepseek_score > qwen_score:
            return ModelType.DEEPSEEK
        else:
            return ModelType.QWEN

class SafeExecutor:
    """Safely executes shell commands"""
    
    @staticmethod
    def is_safe(command: str) -> bool:
        cmd_lower = command.lower()
        
        for pattern in Config.DANGEROUS_PATTERNS:
            if pattern in cmd_lower:
                return False
                
        first_word = command.strip().split()[0] if command.strip() else ""
        return first_word in Config.SAFE_COMMANDS
    
    @staticmethod
    async def execute(command: str) -> str:
        if not SafeExecutor.is_safe(command):
            return f"Blocked: Command '{command}' is not safe"
            
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=os.getcwd()
            )
            
            stdout, stderr = await process.communicate()
            
            output = ""
            if stdout:
                output += stdout.decode('utf-8', errors='ignore')
            if stderr:
                output += f"\nSTDERR:\n{stderr.decode('utf-8', errors='ignore')}"
                
            return output.strip() or "(Command executed successfully)"
            
        except Exception as e:
            return f"Error: {str(e)}"

class SharkAgent:
    """Main SHARK agent"""
    
    def __init__(self):
        self.router = Router()
        self.executor = SafeExecutor()
        
    async def process(self, input_text: str) -> str:
        """Process user input"""
        
        # Route to model
        model_type = self.router.route(input_text)
        
        # Generate with vLLM
        prompt = f"""You are SHARK, an autonomous AI agent that executes code.

User request: {input_text}

Provide a concise response with:
1. Brief analysis
2. Specific commands to execute (if applicable)
3. Expected outcome

Keep commands simple and safe. Use $ prefix for commands.

Response:"""
        
        response = await VLLMManager.generate(model_type, prompt)
        
        # Extract and execute commands
        lines = response.split('\n')
        commands_to_execute = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('$ '):
                cmd = line[2:].strip()
                if cmd:
                    commands_to_execute.append(cmd)
            elif any(cmd in line.split()[0] for cmd in Config.SAFE_COMMANDS if line):
                commands_to_execute.append(line)
        
        # Execute commands (limit to 2)
        execution_results = []
        for cmd in commands_to_execute[:2]:
            result = await self.executor.execute(cmd)
            execution_results.append(f"$ {cmd}\n{result}")
        
        # Combine results
        final_response = response
        if execution_results:
            final_response += "\n\n" + "="*50 + "\nEXECUTION:\n" + "="*50 + "\n"
            final_response += "\n".join(execution_results)
            
        return final_response

class TerminalInterface:
    """Interactive terminal interface"""
    
    def __init__(self, agent: SharkAgent):
        self.agent = agent
        
    async def run(self):
        print("🦈 SHARK Agent (vLLM)")
        print("Type 'exit' to quit")
        print("="*50)
        
        while True:
            try:
                user_input = input("\nshark> ").strip()
                
                if user_input.lower() in ['exit', 'quit', 'q']:
                    print("Goodbye!")
                    break
                    
                if not user_input:
                    continue
                    
                print("Thinking...")
                response = await self.agent.process(user_input)
                print(f"\n{response}")
                
            except KeyboardInterrupt:
                print("\n\nInterrupted. Goodbye!")
                break
            except Exception as e:
                print(f"Error: {str(e)}")

class DiscordBot:
    """Async-safe Discord bot"""
    
    def __init__(self, agent: SharkAgent):
        self.agent = agent
        intents = discord.Intents.default()
        intents.message_content = True
        self.bot = commands.Bot(command_prefix="!", intents=intents)
        self.setup_commands()
        
    def setup_commands(self):
        @self.bot.event
        async def on_ready():
            print(f"Discord bot: {self.bot.user}")
            
        @self.bot.command(name="shark")
        async def shark_command(ctx, *, message: str):
            async with ctx.typing():
                response = await self.agent.process(message)
                
                if len(response) > 1900:
                    chunks = [response[i:i+1900] for i in range(0, len(response), 1900)]
                    for chunk in chunks:
                        await ctx.send(f"```{chunk}```")
                else:
                    await ctx.send(f"```{response}```")
    
    async def run(self):
        if not Config.DISCORD_TOKEN:
            print("Warning: No Discord token set")
            return
            
        await self.bot.start(Config.DISCORD_TOKEN)

async def main():
    """Main entry point"""
    
    # Initialize vLLM
    await VLLMManager.initialize()
    
    # Create agent
    agent = SharkAgent()
    
    # Start Discord bot in background
    discord_bot = DiscordBot(agent)
    discord_task = asyncio.create_task(discord_bot.run())
    
    # Start terminal
    terminal = TerminalInterface(agent)
    await terminal.run()
    
    # Cleanup
    discord_task.cancel()
    try:
        await discord_task
    except asyncio.CancelledError:
        pass

if __name__ == "__main__":
    # Create .env file
    env_file = "/home/leviathan/shark/.env"
    if not os.path.exists(env_file):
        with open(env_file, "w") as f:
            f.write("# SHARK Discord token\n")
            f.write("# SHARK_DISCORD_TOKEN=your_token_here\n")
    
    # Run
    asyncio.run(main())
EOF

# Make executable
chmod +x shark_agent.py

# Create systemd service
sudo tee /etc/systemd/system/shark-agent.service << EOF
[Unit]
Description=SHARK AI Agent (vLLM)
After=network.target
Wants=network.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan/shark
Environment="PATH=/home/leviathan/shark/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="CUDA_VISIBLE_DEVICES=0"
ExecStart=/home/leviathan/shark/venv/bin/python /home/leviathan/shark/shark_agent.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Limit resources
MemoryMax=14G
CPUQuota=200%

[Install]
WantedBy=multi-user.target
EOF

# Create environment file
cat > /home/leviathan/shark/.env << EOF
# SHARK Configuration
# SHARK_DISCORD_TOKEN=your_token_here
EOF

# Set permissions
sudo chown -R leviathan:leviathan /home/leviathan/shark

echo ""
echo "✅ SHARK Agent (vLLM) deployment complete!"
echo ""
echo "QUICK START:"
echo "1. Add Discord token to /home/leviathan/shark/.env"
echo "2. Start: sudo systemctl start shark-agent"
echo "3. Enable: sudo systemctl enable shark-agent"
echo "4. Check: sudo systemctl status shark-agent"
echo ""
echo "MANUAL TEST:"
echo "  cd /home/leviathan/shark"
echo "  source venv/bin/activate"
echo "  python shark_agent.py"
echo ""
echo "Models:"
echo "  - Qwen2.5-Coder-14B-Instruct-AWQ"
echo "  - DeepSeek-Coder-6.7B-Instruct"
echo ""
echo "🦈 SHARK vLLM ready!"