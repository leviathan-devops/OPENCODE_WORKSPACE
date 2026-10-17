#!/usr/bin/env python3
"""
Use DeepSeek R1 to diagnose Hermes Zai/GLM provider issue.
"""
import os
import json
import requests
import sys

DEEPSEEK_API_KEY = "<REDACTED_SET_VIA_ENV>"
DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

def ask_deepseek(question, context=""):
    """Ask DeepSeek R1 a question."""
    messages = []
    if context:
        messages.append({"role": "system", "content": context})
    messages.append({"role": "user", "content": question})
    
    response = requests.post(
        DEEPSEEK_URL,
        headers={
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "deepseek-reasoner",
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.1
        },
        timeout=30
    )
    
    if response.status_code != 200:
        print(f"DeepSeek API error: {response.status_code} - {response.text}")
        return None
    
    data = response.json()
    return data["choices"][0]["message"]["content"]

def collect_diagnostic_info():
    """Collect all diagnostic information about Hermes config."""
    info = {}
    
    # 1. Check config.yaml
    config_path = os.path.expanduser("~/.hermes/config.yaml")
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            info["config_yaml"] = f.read()
    
    # 2. Check .env file
    env_path = os.path.expanduser("~/.hermes/.env")
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            info["env_file"] = f.read()
    
    # 3. Check Hermes source patches
    auth_py_path = os.path.expanduser("~/hermes-agent/hermes_cli/auth.py")
    if os.path.exists(auth_py_path):
        # Check for our patches
        with open(auth_py_path, 'r') as f:
            content = f.read()
            info["auth_py_patches"] = {
                "has_coding_endpoint": "https://api.z.ai/api/coding/paas/v4" in content,
                "has_glm_45_flash_in_coding": '"coding-global", "https://api.z.ai/api/coding/paas/v4",  "glm-4.5-flash"' in content,
                "zai_provider_line": next((line for line in content.split('\n') if '"zai": ProviderConfig' in line), "NOT FOUND")
            }
    
    # 4. Test Zai API directly
    try:
        import requests
        env_path = os.path.expanduser("~/.hermes/.env")
        api_key = None
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith("GLM_API_KEY="):
                    api_key = line.strip().split("=", 1)[1]
                    break
        
        if api_key:
            # Test coding endpoint
            url = "https://api.z.ai/api/coding/paas/v4/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            data = {"model": "glm-4.5-flash", "messages": [{"role": "user", "content": "test"}], "max_tokens": 10}
            response = requests.post(url, headers=headers, json=data, timeout=10)
            info["zai_api_test_coding"] = {
                "status": response.status_code,
                "response": response.text[:200] if response.status_code == 200 else response.text
            }
            
            # Test regular endpoint
            url2 = "https://api.z.ai/api/paas/v4/chat/completions"
            response2 = requests.post(url2, headers=headers, json=data, timeout=10)
            info["zai_api_test_regular"] = {
                "status": response2.status_code,
                "response": response2.text[:200] if response2.status_code == 200 else response2.text
            }
    except Exception as e:
        info["zai_api_test_error"] = str(e)
    
    # 5. Check environment variables
    info["env_vars"] = {
        "GLM_BASE_URL": os.getenv("GLM_BASE_URL", "NOT SET"),
        "OPENROUTER_API_KEY": "SET" if os.getenv("OPENROUTER_API_KEY") else "NOT SET",
        "GLM_API_KEY": "SET" if os.getenv("GLM_API_KEY") else "NOT SET"
    }
    
    # 6. Check hermes executable
    hermes_path = os.path.expanduser("~/.local/bin/hermes")
    if os.path.exists(hermes_path):
        info["hermes_executable"] = os.path.realpath(hermes_path)
    
    return info

def main():
    print("Collecting diagnostic information...")
    info = collect_diagnostic_info()
    
    context = f"""
You are diagnosing a Hermes Agent configuration issue. The user wants Hermes to use Zai/GLM provider with coding plan endpoint (https://api.z.ai/api/coding/paas/v4) and model glm-4.5-flash.

Current state:
1. Config.yaml: {info.get('config_yaml', 'NOT FOUND')}
2. .env file: {info.get('env_file', 'NOT FOUND')}
3. Auth.py patches: {json.dumps(info.get('auth_py_patches', {}), indent=2)}
4. Zai API tests:
   - Coding endpoint: {json.dumps(info.get('zai_api_test_coding', {}), indent=2)}
   - Regular endpoint: {json.dumps(info.get('zai_api_test_regular', {}), indent=2)}
5. Environment variables: {json.dumps(info.get('env_vars', {}), indent=2)}
6. Hermes executable: {info.get('hermes_executable', 'NOT FOUND')}

The problem: When user runs `hermes`, it either times out or uses OpenRouter instead of Zai, even though config says provider: zai.

Direct API tests show Zai API works fine with both endpoints. The issue is in Hermes configuration/provider resolution.

Please diagnose and provide specific fix steps.
"""
    
    question = "What is wrong with this Hermes configuration and how do I fix it so `hermes` uses Zai/GLM provider with coding endpoint and glm-4.5-flash model?"
    
    print("\nAsking DeepSeek R1 to diagnose...")
    answer = ask_deepseek(question, context)
    
    if answer:
        print("\n" + "="*80)
        print("DEEPSEEK R1 DIAGNOSIS:")
        print("="*80)
        print(answer)
        print("="*80)
    else:
        print("Failed to get diagnosis from DeepSeek")

if __name__ == "__main__":
    main()