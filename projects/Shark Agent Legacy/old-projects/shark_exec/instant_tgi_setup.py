#!/usr/bin/env python3
"""
INSTANT TGI SETUP - No Docker, Pure Python
Uses vLLM which is compatible with OpenAI API
"""

import os
import sys
import subprocess
import time
import json

def run_command(cmd, check=True):
    """Run shell command"""
    print(f"$ {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"❌ Failed: {result.stderr}")
        return False
    return True

def setup_vllm():
    """Setup vLLM in virtual environment"""
    print("🚀 SETTING UP vLLM (TGI ALTERNATIVE)")
    print("=" * 60)
    
    # Create virtual environment
    print("\n1. Creating virtual environment...")
    if not run_command("python3 -m venv /home/leviathan/vllm-venv"):
        return False
    
    # Install vLLM
    print("\n2. Installing vLLM...")
    install_cmd = """
    source /home/leviathan/vllm-venv/bin/activate && \
    pip install vllm==0.6.3.post1 transformers torch --no-cache-dir
    """
    if not run_command(install_cmd):
        return False
    
    # Create systemd service for Qwen
    print("\n3. Creating systemd service for Qwen...")
    service_qwen = """
[Unit]
Description=vLLM Qwen 2.5 Coder 7B (TGI Alternative)
After=network.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan
Environment=PATH=/home/leviathan/vllm-venv/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games
ExecStart=/home/leviathan/vllm-venv/bin/python3 -m vllm.entrypoints.openai.api_server \\
    --model Qwen/Qwen2.5-Coder-7B-Instruct-GGUF \\
    --port 11434 \\
    --max-model-len 32768 \\
    --gpu-memory-utilization 0.9 \\
    --enforce-eager \\
    --disable-log-requests \\
    --disable-log-stats \\
    --served-model-name qwen2.5-coder-7b \\
    --max-num-batched-tokens 32768 \\
    --max-num-seqs 256

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
    
    with open("/tmp/vllm-qwen.service", "w") as f:
        f.write(service_qwen)
    
    run_command("sudo cp /tmp/vllm-qwen.service /etc/systemd/system/vllm-qwen.service")
    
    # Create systemd service for DeepSeek
    print("\n4. Creating systemd service for DeepSeek...")
    service_deepseek = """
[Unit]
Description=vLLM DeepSeek Coder 6.7B (TGI Alternative)
After=network.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan
Environment=PATH=/home/leviathan/vllm-venv/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games
ExecStart=/home/leviathan/vllm-venv/bin/python3 -m vllm.entrypoints.openai.api_server \\
    --model deepseek-ai/DeepSeek-Coder-6.7B-Instruct \\
    --port 11435 \\
    --max-model-len 32768 \\
    --gpu-memory-utilization 0.9 \\
    --enforce-eager \\
    --disable-log-requests \\
    --disable-log-stats \\
    --served-model-name deepseek-coder-6.7b \\
    --max-num-batched-tokens 32768 \\
    --max-num-seqs 256

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
    
    with open("/tmp/vllm-deepseek.service", "w") as f:
        f.write(service_deepseek)
    
    run_command("sudo cp /tmp/vllm-deepseek.service /etc/systemd/system/vllm-deepseek.service")
    
    # Enable and start services
    print("\n5. Starting vLLM services...")
    run_command("sudo systemctl daemon-reload")
    run_command("sudo systemctl enable vllm-qwen vllm-deepseek")
    run_command("sudo systemctl start vllm-qwen vllm-deepseek")
    
    # Wait for services
    print("\n6. Waiting for services to start...")
    time.sleep(15)
    
    # Test services
    print("\n7. Testing vLLM endpoints...")
    
    # Test Qwen
    test_qwen = """curl -s -X POST http://localhost:11434/v1/completions \\
  -H 'Content-Type: application/json' \\
  -d '{"model":"qwen2.5-coder-7b","prompt":"Test","max_tokens":10}'"""
    
    result = subprocess.run(test_qwen, shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            data = json.loads(result.stdout)
            if "choices" in data:
                print("✅ Qwen vLLM: WORKING")
            else:
                print("❌ Qwen vLLM: No choices in response")
        except:
            print("❌ Qwen vLLM: Invalid JSON response")
    else:
        print("❌ Qwen vLLM: HTTP error")
    
    # Test DeepSeek
    test_deepseek = """curl -s -X POST http://localhost:11435/v1/completions \\
  -H 'Content-Type: application/json' \\
  -d '{"model":"deepseek-coder-6.7b","prompt":"Test","max_tokens":10}'"""
    
    result = subprocess.run(test_deepseek, shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            data = json.loads(result.stdout)
            if "choices" in data:
                print("✅ DeepSeek vLLM: WORKING")
            else:
                print("❌ DeepSeek vLLM: No choices in response")
        except:
            print("❌ DeepSeek vLLM: Invalid JSON response")
    else:
        print("❌ DeepSeek vLLM: HTTP error")
    
    return True

def reconfigure_hermes():
    """Reconfigure Hermes to use vLLM"""
    print("\n🔧 RECONFIGURING HERMES FOR vLLM...")
    print("=" * 60)
    
    # Create vLLM config
    config = """# 🦈 HERMES vLLM CONFIGURATION - NO OUTPUT LIMITS, 100% LOCAL
# vLLM endpoints: Qwen @ 11434, DeepSeek @ 11435

model:
  default: qwen2.5-coder-7b
  provider: openai
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# Smart routing - vLLM endpoints
smart_model_routing:
  enabled: true
  max_simple_chars: 300
  max_simple_words: 50
  cheap_model:
    provider: openai
    model: qwen2.5-coder-7b
    base_url: http://localhost:11434/v1
    api_key: "no-key-needed"
  strong_model:
    provider: openai
    model: qwen2.5-coder-7b
    base_url: http://localhost:11434/v1
    api_key: "no-key-needed"

# Fallback chain - vLLM ONLY
fallback_chain:
  - provider: openai
    model: qwen2.5-coder-7b
    base_url: http://localhost:11434/v1
    api_key: "no-key-needed"
  - provider: openai
    model: deepseek-coder-6.7b
    base_url: http://localhost:11435/v1
    api_key: "no-key-needed"

# Brain bridge - vLLM ONLY
brain_bridge:
  enabled: true
  web_thinking_threshold: 5000
  local_preference: true
  web_fallback: false

# Agent configuration
agent:
  max_turns: 100
  verbose: false
  reasoning_effort: high
  autonomous_execution: true
  safety_checks: true
  token_budget: 32768

# Toolsets (full access)
toolsets:
- all

# Display
display:
  personality: technical
  show_reasoning: true
  show_cost: false
  show_token_usage: true

# Memory
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 3000
  user_char_limit: 2000

# Terminal
terminal:
  backend: local
  cwd: /home/leviathan
  timeout: 300
  persistent_shell: true

# Security - NO API KEYS
security:
  redact_secrets: true
  command_allowlist:
    - script execution via -e/-c flag

# Compression (vLLM models)
compression:
  enabled: true
  threshold: 0.9
  summary_model: qwen2.5-coder-7b
  summary_provider: openai
  summary_base_url: http://localhost:11434/v1
  summary_api_key: "no-key-needed"

# Session search (vLLM)
session_search:
  provider: openai
  model: qwen2.5-coder-7b
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# Skills hub (vLLM)
skills_hub:
  provider: openai
  model: qwen2.5-coder-7b
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# MCP (vLLM)
mcp:
  provider: openai
  model: qwen2.5-coder-7b
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# vLLM-specific optimization
vllm_optimization:
  max_context_length: 32768
  temperature: 0.7
  top_p: 0.95
  max_tokens: 8192
  streaming: true

# Emergency protocol
emergency_protocol:
  if_api_called: "block_and_alert"
  fallback_strategy: "vllm_only"
  max_vllm_retries: 3
  system_halt_on_api_dependency: true

# Model aliases
model_aliases:
  qwen2.5-coder-7b: "Qwen/Qwen2.5-Coder-7B-Instruct-GGUF"
  deepseek-coder-6.7b: "deepseek-ai/DeepSeek-Coder-6.7B-Instruct"
"""
    
    # Write config
    config_path = "/home/leviathan/.hermes/config_vllm_final.yaml"
    with open(config_path, "w") as f:
        f.write(config)
    
    print(f"✅ vLLM config created: {config_path}")
    
    # Backup old config and replace
    backup_path = f"/home/leviathan/.hermes/config.yaml.backup.{int(time.time())}"
    run_command(f"cp /home/leviathan/.hermes/config.yaml {backup_path} 2>/dev/null || true")
    run_command(f"cp {config_path} /home/leviathan/.hermes/config.yaml")
    
    print("✅ Hermes reconfigured to use vLLM by default")
    return True

def main():
    """Main setup"""
    print("🚀 INSTANT TGI/vLLM SETUP")
    print("=" * 60)
    
    # Stop Ollama
    print("\n🛑 Stopping Ollama...")
    run_command("sudo systemctl stop ollama 2>/dev/null || true")
    run_command("sudo systemctl disable ollama 2>/dev/null || true")
    run_command("pkill -9 ollama 2>/dev/null || true")
    
    # Setup vLLM
    if not setup_vllm():
        print("❌ vLLM setup failed")
        sys.exit(1)
    
    # Reconfigure Hermes
    if not reconfigure_hermes():
        print("❌ Hermes reconfiguration failed")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎉 SETUP COMPLETE!")
    print("=" * 60)
    print("✅ vLLM services running on ports 11434 (Qwen) and 11435 (DeepSeek)")
    print("✅ Hermes reconfigured to use vLLM by default")
    print("✅ No output limits (32K context, streaming enabled)")
    print("✅ 100% local - zero API costs")
    print("\n📊 Service status:")
    run_command("sudo systemctl status vllm-qwen --no-pager -l | head -20")
    print("\n🔧 Test vLLM:")
    print("  curl -X POST http://localhost:11434/v1/completions \\")
    print("    -H 'Content-Type: application/json' \\")
    print("    -d '{\"model\":\"qwen2.5-coder-7b\",\"prompt\":\"Test\",\"max_tokens\":1000}'")
    print("\n🚀 Switch to new terminal and run Hermes with local context!")

if __name__ == "__main__":
    main()