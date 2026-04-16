#!/usr/bin/env python3
"""
MINIMAL SHARK AGENT - Working prototype
Phase 1: Command execution framework
Phase 2: Add model intelligence (TGI/vLLM/Transformers)
"""

import asyncio
import aiohttp
import subprocess
import os
import sys
import json
from typing import List, Dict, Any
from dataclasses import dataclass
from enum import Enum

# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class SharkConfig:
    """SHARK configuration"""
    
    # Model endpoints (to be configured later)
    MODEL_API_URL: str = "http://localhost:8080/v1/completions"  # TGI/vLLM endpoint
    
    # Discord
    DISCORD_TOKEN: str = os.getenv("SHARK_DISCORD_TOKEN", "")
    
    # Safe commands (allowlist approach)
    SAFE_COMMANDS: List[str] = [
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
    
    # Dangerous patterns (blocklist)
    DANGEROUS_PATTERNS: List[str] = [
        "rm -rf /", "rm -rf /*", "rm -rf .", "rm -rf *",
        "mkfs", "dd if=", "format", "fdisk", "parted",
        ":(){ :|:& };:", "fork()", "forkbomb",
        "chmod -R 777 /", "chown -R root:root /",
        "> /dev/sda", "dd of=/dev/sda",
    ]
    
    # Working directory
    WORK_DIR: str = os.getcwd()

# ============================================================================
# CORE COMPONENTS
# ============================================================================

class CommandSafety:
    """Command safety checker"""
    
    @staticmethod
    def is_safe(command: str) -> tuple[bool, str]:
        """
        Check if command is safe.
        Returns (is_safe, reason)
        """
        cmd = command.strip()
        
        # Empty command
        if not cmd:
            return False, "Empty command"
        
        # Check for dangerous patterns
        for pattern in SharkConfig.DANGEROUS_PATTERNS:
            if pattern in cmd:
                return False, f"Contains dangerous pattern: {pattern}"
        
        # Extract first word
        parts = cmd.split()
        if not parts:
            return False, "No command"
        
        first_word = parts[0]
        
        # Check if in safe list
        if first_word not in SharkConfig.SAFE_COMMANDS:
            return False, f"Command '{first_word}' not in safe list"
        
        return True, "OK"

class CommandExecutor:
    """Async command executor"""
    
    @staticmethod
    async def execute(command: str, timeout: int = 30) -> Dict[str, Any]:
        """
        Execute a shell command asynchronously.
        Returns dict with exit_code, stdout, stderr, success
        """
        # Safety check
        is_safe, reason = CommandSafety.is_safe(command)
        if not is_safe:
            return {
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Safety check failed: {reason}",
                "success": False,
                "command": command
            }
        
        try:
            # Create subprocess
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=SharkConfig.WORK_DIR
            )
            
            # Wait with timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                return {
                    "exit_code": -1,
                    "stdout": "",
                    "stderr": f"Command timed out after {timeout} seconds",
                    "success": False,
                    "command": command
                }
            
            # Decode output
            stdout_text = stdout.decode('utf-8', errors='ignore') if stdout else ""
            stderr_text = stderr.decode('utf-8', errors='ignore') if stderr else ""
            
            return {
                "exit_code": process.returncode,
                "stdout": stdout_text.strip(),
                "stderr": stderr_text.strip(),
                "success": process.returncode == 0,
                "command": command
            }
            
        except Exception as e:
            return {
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "success": False,
                "command": command
            }

class ModelRouter:
    """
    Simple router for model selection.
    Currently placeholder - will integrate with TGI/vLLM
    """
    
    class ModelType(Enum):
        QWEN = "qwen"
        DEEPSEEK = "deepseek"
        FALLBACK = "fallback"
    
    @staticmethod
    def select_model(input_text: str) -> ModelType:
        """Select model based on input keywords"""
        text = input_text.lower()
        
        # Keywords for different models
        qwen_keywords = ["design", "architecture", "plan", "system", "devops"]
        deepseek_keywords = ["debug", "fix", "error", "bug", "optimize"]
        
        qwen_score = sum(1 for kw in qwen_keywords if kw in text)
        deepseek_score = sum(1 for kw in deepseek_keywords if kw in text)
        
        if deepseek_score > qwen_score:
            return ModelRouter.ModelType.DEEPSEEK
        elif qwen_score > 0:
            return ModelRouter.ModelType.QWEN
        else:
            return ModelRouter.ModelType.FALLBACK
    
    @staticmethod
    async def generate_response(input_text: str, model_type: ModelType = None) -> str:
        """
        Generate response using selected model.
        Currently uses fallback logic - will connect to TGI/vLLM
        """
        if model_type is None:
            model_type = ModelRouter.select_model(input_text)
        
        # Fallback response until model servers are ready
        responses = {
            ModelRouter.ModelType.QWEN: f"[Qwen] I would analyze: {input_text}\n\nSuggested commands:\n$ ls -la\n$ pwd",
            ModelRouter.ModelType.DEEPSEEK: f"[DeepSeek] Debugging: {input_text}\n\nCheck with:\n$ python3 --version\n$ pip list",
            ModelRouter.ModelType.FALLBACK: f"[SHARK] Processing: {input_text}\n\nTry:\n$ echo 'SHARK is working'\n$ ls"
        }
        
        return responses.get(model_type, f"Processing: {input_text}")

# ============================================================================
# SHARK AGENT
# ============================================================================

class SharkAgent:
    """Main SHARK agent class"""
    
    def __init__(self):
        self.executor = CommandExecutor()
        self.router = ModelRouter()
        
    async def process(self, input_text: str) -> Dict[str, Any]:
        """
        Process user input through full pipeline.
        Returns dict with analysis, commands, and results.
        """
        result = {
            "input": input_text,
            "model_used": None,
            "analysis": "",
            "commands": [],
            "execution_results": [],
            "final_output": ""
        }
        
        # Step 1: Route to model
        model_type = self.router.select_model(input_text)
        result["model_used"] = model_type.value
        
        # Step 2: Generate analysis and suggested commands
        analysis = await self.router.generate_response(input_text, model_type)
        result["analysis"] = analysis
        
        # Step 3: Extract commands from analysis
        commands = self._extract_commands(analysis)
        result["commands"] = commands
        
        # Step 4: Execute commands
        execution_results = []
        for cmd in commands[:3]:  # Limit to 3 commands per request
            cmd_result = await self.executor.execute(cmd)
            execution_results.append(cmd_result)
        
        result["execution_results"] = execution_results
        
        # Step 5: Format final output
        result["final_output"] = self._format_output(result)
        
        return result
    
    def _extract_commands(self, text: str) -> List[str]:
        """Extract shell commands from text"""
        commands = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Look for command patterns
            if line.startswith('$ '):
                cmd = line[2:].strip()
                if cmd:
                    commands.append(cmd)
            elif line.startswith('```bash'):
                # Skip the opening ```
                continue
            elif line.startswith('```'):
                # Skip closing ```
                continue
            elif any(line.startswith(cmd + ' ') for cmd in SharkConfig.SAFE_COMMANDS):
                # Line starts with a safe command
                commands.append(line)
        
        return commands
    
    def _format_output(self, result: Dict[str, Any]) -> str:
        """Format the final output for display"""
        output = []
        
        # Header
        output.append("🦈 SHARK AGENT")
        output.append("=" * 50)
        
        # Input
        output.append(f"INPUT: {result['input']}")
        output.append(f"MODEL: {result['model_used'].upper()}")
        output.append("")
        
        # Analysis
        output.append("ANALYSIS:")
        output.append("-" * 30)
        output.append(result['analysis'])
        output.append("")
        
        # Execution results
        if result['execution_results']:
            output.append("EXECUTION RESULTS:")
            output.append("-" * 30)
            
            for i, res in enumerate(result['execution_results'], 1):
                output.append(f"\n[{i}] $ {res['command']}")
                
                if res['stdout']:
                    output.append(f"STDOUT:\n{res['stdout']}")
                
                if res['stderr']:
                    output.append(f"STDERR:\n{res['stderr']}")
                
                if res['success']:
                    output.append("✓ Success")
                else:
                    output.append(f"✗ Failed (exit code: {res['exit_code']})")
        
        return "\n".join(output)

# ============================================================================
# INTERFACES
# ============================================================================

class TerminalInterface:
    """Interactive terminal interface"""
    
    def __init__(self, agent: SharkAgent):
        self.agent = agent
        
    async def run(self):
        """Run the terminal loop"""
        print("\n" + "="*60)
        print("🦈 SHARK AGENT - TERMINAL INTERFACE")
        print("="*60)
        print("Type commands or requests for SHARK to execute")
        print("Type 'exit', 'quit', or Ctrl+C to exit")
        print("="*60)
        
        while True:
            try:
                # Get input
                user_input = input("\nshark> ").strip()
                
                # Check for exit
                if user_input.lower() in ['exit', 'quit', 'q']:
                    print("\nGoodbye! 🦈")
                    break
                
                if not user_input:
                    continue
                
                # Process
                print("Processing...")
                result = await self.agent.process(user_input)
                
                # Display result
                print("\n" + result['final_output'])
                
            except KeyboardInterrupt:
                print("\n\nInterrupted. Goodbye! 🦈")
                break
            except Exception as e:
                print(f"\nError: {str(e)}")

# ============================================================================
# MAIN
# ============================================================================

async def main():
    """Main entry point"""
    print("Starting SHARK Agent...")
    
    # Create agent
    agent = SharkAgent()
    
    # Create and run terminal interface
    terminal = TerminalInterface(agent)
    await terminal.run()

def setup_environment():
    """Setup environment"""
    # Create .env if not exists
    env_file = "/home/leviathan/shark/.env"
    if not os.path.exists(env_file):
        with open(env_file, "w") as f:
            f.write("# SHARK Configuration\n")
            f.write("# SHARK_DISCORD_TOKEN=your_discord_bot_token_here\n")
            f.write("# SHARK_MODEL_API=http://localhost:8080/v1/completions\n")
    
    # Create logs directory
    logs_dir = "/home/leviathan/shark/logs"
    os.makedirs(logs_dir, exist_ok=True)
    
    print(f"Environment setup complete")
    print(f"Config file: {env_file}")
    print(f"Logs directory: {logs_dir}")

if __name__ == "__main__":
    # Setup
    setup_environment()
    
    # Run
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nSHARK agent terminated.")
    except Exception as e:
        print(f"\nFatal error: {e}")
        sys.exit(1)