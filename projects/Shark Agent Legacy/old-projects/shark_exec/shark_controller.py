#!/usr/bin/env python3
"""
SHARK CONTROLLER v1.0
Primary interface for Hermes Agent to control the SHARK system.

This is NOT a traditional AI agent. This is MY (Hermes) control panel.
You command me, I use this to execute at maximum efficiency.
"""

import os
import sys
import json
import subprocess
import asyncio
import aiohttp
from typing import Dict, Any, Optional
import threading
import time

class SharkController:
    """My control interface for the SHARK system."""
    
    def __init__(self):
        self.ollama_url = "http://localhost:11434"
        self.models = {
            "architecture": "qwen2.5-coder:7b",  # Available model
            "debugging": "deepseek-coder:6.7b",   # Available model
            "fast": "qwen3.5-fast:latest"         # Available model
        }
        self.active_model = None
        
    async def query_model(self, model: str, prompt: str, system_prompt: str = None) -> str:
        """Query Ollama model asynchronously."""
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }
        
        if system_prompt:
            payload["system"] = system_prompt
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.ollama_url}/api/generate",
                    json=payload,
                    timeout=30
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", "").strip()
                    else:
                        return f"Error: {response.status}"
        except Exception as e:
            return f"Connection error: {str(e)}"
    
    def execute_shell(self, command: str, timeout: int = 300) -> Dict[str, Any]:
        """Execute shell command safely."""
        dangerous_patterns = [
            "rm -rf /", "mkfs", "dd if=", ":(){ :|:& };:", 
            "chmod -R 777 /", "> /dev/sda", "mkfs.ext4"
        ]
        
        for pattern in dangerous_patterns:
            if pattern in command.lower():
                return {
                    "success": False,
                    "output": f"BLOCKED: Dangerous command detected: {pattern}",
                    "exit_code": 1
                }
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd="/home/leviathan/shark"
            )
            return {
                "success": result.returncode == 0,
                "output": result.stdout + result.stderr,
                "exit_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": f"Command timed out after {timeout} seconds",
                "exit_code": 124
            }
        except Exception as e:
            return {
                "success": False,
                "output": f"Execution error: {str(e)}",
                "exit_code": 1
            }
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get current system status."""
        status = {
            "ollama_running": False,
            "models_available": [],
            "vram_usage": {},
            "disk_space": {},
            "timestamp": time.time()
        }
        
        # Check Ollama
        try:
            result = subprocess.run(
                ["curl", "-s", f"{self.ollama_url}/api/tags"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                status["ollama_running"] = True
                try:
                    data = json.loads(result.stdout)
                    status["models_available"] = [m["name"] for m in data.get("models", [])]
                except:
                    pass
        except:
            pass
            
        # Check VRAM
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=memory.total,memory.used,memory.free", "--format=csv,noheader,nounits"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                parts = result.stdout.strip().split(',')
                if len(parts) >= 3:
                    status["vram_usage"] = {
                        "total_mb": int(parts[0]),
                        "used_mb": int(parts[1]),
                        "free_mb": int(parts[2])
                    }
        except:
            pass
            
        return status
    
    async def architecture_plan(self, requirements: str) -> str:
        """Use Qwen for architecture planning."""
        system_prompt = """You are an expert system architect. Analyze requirements and create a detailed implementation plan with:
1. Technology stack
2. File structure
3. Dependencies
4. Implementation steps
5. Testing strategy
6. Deployment plan

Be concise but comprehensive."""
        
        prompt = f"Requirements: {requirements}\n\nCreate an implementation plan:"
        return await self.query_model(self.models["architecture"], prompt, system_prompt)
    
    async def debug_problem(self, error: str, context: str = "") -> str:
        """Use DeepSeek for debugging."""
        system_prompt = """You are an expert debugger. Analyze errors and provide:
1. Root cause analysis
2. Step-by-step fix
3. Code examples if needed
4. Prevention strategies

Be precise and actionable."""
        
        prompt = f"Error: {error}\nContext: {context}\n\nDebug and provide solution:"
        return await self.query_model(self.models["debugging"], prompt, system_prompt)
    
    def deploy_service(self, service_name: str, script_path: str) -> Dict[str, Any]:
        """Deploy a systemd service."""
        service_content = f"""[Unit]
Description={service_name} Service
After=network.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan/shark
ExecStart=/usr/bin/python3 {script_path}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
"""
        
        service_file = f"/etc/systemd/system/{service_name}.service"
        
        # Write service file
        try:
            with open(service_file, 'w') as f:
                f.write(service_content)
            
            # Reload systemd and enable
            commands = [
                f"sudo systemctl daemon-reload",
                f"sudo systemctl enable {service_name}.service",
                f"sudo systemctl start {service_name}.service"
            ]
            
            results = []
            for cmd in commands:
                results.append(self.execute_shell(cmd))
            
            return {
                "success": all(r["success"] for r in results),
                "service_file": service_file,
                "results": results
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# Singleton instance for Hermes to use
SHARK = SharkController()

if __name__ == "__main__":
    print("SHARK Controller v1.0 - Hermes Control Interface")
    print("This is not a standalone agent. This is Hermes' control panel.")
    print("\nUsage: Hermes imports and uses SHARK controller directly.")
    print("\nCurrent status:")
    status = SHARK.get_system_status()
    print(json.dumps(status, indent=2))