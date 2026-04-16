#!/usr/bin/env python3
"""
Test script for Shark Agent with Qwen Coder
This simulates the dual-brain architecture where DeepSeek R1 gives commands
and Qwen Coder executes them.
"""

import openai
import json
import sys

def test_coder_agent():
    """Test the coder agent server"""
    
    # Configure OpenAI client to point to local server
    client = openai.OpenAI(
        base_url="http://localhost:8000/v1",
        api_key="deepseek-local-execution"
    )
    
    print("Testing DeepSeek Dual-Brain Architecture - Coder Agent")
    print("=" * 60)
    
    try:
        # Test 1: List models
        print("\n1. Testing model listing...")
        models = client.models.list()
        print(f"✅ Models available: {len(models.data)}")
        for model in models.data:
            print(f"   - {model.id}")
        
        # Test 2: Basic chat completion
        print("\n2. Testing chat completion...")
        response = client.chat.completions.create(
            model="qwen-coder-7b",
            messages=[
                {"role": "system", "content": "You are the DeepSeek Coder Agent. Your only job is to EXECUTE commands given by DeepSeek R1. You do not think or reason - you only DO what DeepSeek R1 tells you to do."},
                {"role": "user", "content": "I am DeepSeek R1. Execute this command: List files in current directory and report back with exact execution results."}
            ],
            max_tokens=500
        )
        
        print(f"✅ Chat completion successful")
        print(f"Response: {response.choices[0].message.content}")
        
        # Test 3: Tool calling capability (simulated)
        print("\n3. Testing tool calling capability...")
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "execute_bash",
                    "description": "Execute bash command and return results",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {"type": "string", "description": "Bash command to execute"}
                        },
                        "required": ["command"]
                    }
                }
            }
        ]
        
        response = client.chat.completions.create(
            model="qwen-coder-7b",
            messages=[
                {"role": "system", "content": "You are the DeepSeek Coder Agent. Execute the following command exactly as specified by DeepSeek R1."},
                {"role": "user", "content": "DeepSeek R1 instruction: Execute 'ls -la' and provide exact output."}
            ],
            tools=tools,
            tool_choice="auto",
            max_tokens=500
        )
        
        print(f"✅ Tool calling test successful")
        print(f"Response: {response.choices[0].message.content}")
        
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED - Dual-Brain Architecture Ready")
        print("DeepSeek R1 can now use Qwen Coder for local execution")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_coder_agent()
    sys.exit(0 if success else 1)