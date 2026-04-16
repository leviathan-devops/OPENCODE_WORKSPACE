#!/usr/bin/env python3
"""
Simple interactive chat for local Qwen3.5-9B
No Qwen Code overhead - direct API access
"""
import requests
import sys

API_URL = "http://localhost:8000/v1/chat/completions"
API_KEY = "llama-cpp-key"
MODEL = "Qwen3.5-9B-Q4_K_M.gguf"

def chat():
    print("🦙 Qwen3.5-9B Local Chat (type 'quit' to exit)")
    print("=" * 50)
    
    messages = []
    
    while True:
        try:
            user_input = input("\n👤 You: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("Goodbye!")
                break
            
            if not user_input:
                continue
            
            messages.append({"role": "user", "content": user_input})
            
            response = requests.post(
                API_URL,
                headers={"Authorization": f"Bearer {API_KEY}"},
                json={
                    "model": MODEL,
                    "messages": messages,
                    "max_tokens": 2048,
                    "stream": False
                },
                timeout=120
            )
            
            if response.status_code != 200:
                print(f"❌ API Error: {response.status_code}")
                print(response.text)
                messages.pop()  # Remove failed message
                continue
            
            data = response.json()
            assistant_message = data["choices"][0]["message"]
            
            # Qwen3.5 uses reasoning_content for thinking
            content = assistant_message.get("content", "")
            reasoning = assistant_message.get("reasoning_content", "")
            
            # Show reasoning if present (thinking mode)
            if reasoning and "--show-thinking" in sys.argv:
                print(f"\n🤔 Thinking: {reasoning[:200]}...")
            
            print(f"\n🤖 Assistant: {content}")
            
            messages.append(assistant_message)
            
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            messages.pop()

if __name__ == "__main__":
    chat()
