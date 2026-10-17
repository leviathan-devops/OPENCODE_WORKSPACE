#!/usr/bin/env python3
"""
DeepSeek R1 Local Connector
This script connects DeepSeek R1 to the local Qwen Coder Agent
It provides the dual-brain architecture interface
"""

import openai
import json
import subprocess
import sys
import time
from typing import Any, Dict, List

class DeepSeekDualBrainConnector:
    """Connector for DeepSeek R1 + Qwen Coder dual-brain architecture"""
    
    def __init__(self):
        # Local Qwen Coder Agent
        self.local_client = openai.OpenAI(
            base_url="http://localhost:8000/v1",
            api_key="deepseek-local-execution"
        )
        
        # Remote DeepSeek R1 (for comparison/backup)
        self.deepseek_client = openai.OpenAI(
            base_url="https://api.deepseek.com/v1",
            api_key="<REDACTED_SET_VIA_ENV>"
        )
        
    def execute_locally(self, command: str, context: str = "") -> str:
        """Execute command using local Qwen Coder Agent"""
        try:
            response = self.local_client.chat.completions.create(
                model="qwen-coder-7b",
                messages=[
                    {
                        "role": "system", 
                        "content": f"""You are the DeepSeek Coder Agent. Your ONLY job is to EXECUTE commands given by DeepSeek R1.
                        
DUAL-BRAIN ARCHITECTURE:
- DeepSeek R1: Thinking/Reasoning (Remote)
- You (Qwen Coder): Execution/Motor Cortex (Local)

RULES:
1. Execute EXACTLY what DeepSeek R1 tells you to do
2. NO thinking, NO reasoning, NO questions
3. Provide precise execution results
4. Report back with exact output

CONTEXT: {context}

EXECUTION TASK: {command}"""
                    },
                    {"role": "user", "content": f"DeepSeek R1 instruction: {command}"}
                ],
                max_tokens=2000,
                temperature=0.1
            )
            return response.choices[0].message.content
            
        except Exception as e:
            return f"❌ Local execution failed: {e}"
    
    def verify_model_ready(self) -> bool:
        """Verify local model is ready"""
        try:
            models = self.local_client.models.list()
            return len(models.data) > 0
        except:
            return False
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get dual-brain system status"""
        return {
            "architecture": "Dual-Brain",
            "deepseek_r1": {
                "status": "connected",
                "role": "thinking_reasoning"
            },
            "qwen_coder": {
                "status": "ready" if self.verify_model_ready() else "loading",
                "role": "execution_motor",
                "model": "Qwen2.5-Coder-7B",
                "quantization": "GGML/CUDA"
            },
            "local_server": {
                "url": "http://localhost:8000/v1",
                "healthy": self.verify_model_ready()
            }
        }

def main():
    """Main connector interface"""
    print("🧠 DeepSeek Dual-Brain Architecture Connector")
    print("=" * 50)
    
    connector = DeepSeekDualBrainConnector()
    
    # Check system status
    status = connector.get_system_status()
    print(f"System Status: {status['local_server']['healthy'] and '✅ Ready' or '⏳ Loading'}")
    
    if not status['local_server']['healthy']:
        print("🚀 Starting local coder agent...")
        subprocess.run(["/home/leviathan/OPENCODE_WORKSPACE/start-coder-agent.sh", "1"])
        time.sleep(10)
    
    print("\n🔗 DeepSeek R1 ↔ Qwen Coder Connector Active")
    print("💡 Send commands in format: EXECUTE: <your_command>")
    print("📡 Type 'EXIT' to quit")
    
    while True:
        try:
            user_input = input("\nDeepSeek R1> ").strip()
            
            if user_input.upper() == 'EXIT':
                print("👋 Disconnecting dual-brain system...")
                break
            
            if user_input.startswith('EXECUTE: '):
                command = user_input[9:]  # Remove 'EXECUTE: ' prefix
                result = connector.execute_locally(command)
                print(f"\n🤖 Coder Agent Execution:\n{result}")
            else:
                print("❌ Format: EXECUTE: <your_command>")
                
        except KeyboardInterrupt:
            print("\n👋 Disconnecting...")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()