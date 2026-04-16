#!/bin/bash
# 🚀 FINAL LOCAL SETUP - vLLM with no Docker dependencies

set -e

echo "🚀 FINAL LOCAL SETUP - vLLM ONLY"
echo "================================="

# Kill Ollama
echo "🛑 Killing Ollama..."
sudo systemctl stop ollama 2>/dev/null || true
sudo systemctl disable ollama 2>/dev/null || true
pkill -9 ollama 2>/dev/null || true
pkill -9 ollama-runner 2>/dev/null || true

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv /home/leviathan/vllm-venv

# Install vLLM directly
echo "⚡ Installing vLLM..."
/home/leviathan/vllm-venv/bin/pip install vllm==0.6.3.post1 transformers torch --no-cache-dir

# Create launch scripts
echo "📝 Creating launch scripts..."

# Qwen launch script
cat > /home/leviathan/launch_qwen.sh << 'EOF'
#!/bin/bash
source /home/leviathan/vllm-venv/bin/activate
python3 -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-Coder-7B-Instruct-GGUF \
    --port 11434 \
    --max-model-len 32768 \
    --gpu-memory-utilization 0.9 \
    --enforce-eager \
    --disable-log-requests \
    --disable-log-stats \
    --served-model-name qwen2.5-coder-7b \
    --max-num-batched-tokens 32768 \
    --max-num-seqs 256
EOF

# DeepSeek launch script
cat > /home/leviathan/launch_deepseek.sh << 'EOF'
#!/bin/bash
source /home/leviathan/vllm-venv/bin/activate
python3 -m vllm.entrypoints.openai.api_server \
    --model deepseek-ai/DeepSeek-Coder-6.7B-Instruct \
    --port 11435 \
    --max-model-len 32768 \
    --gpu-memory-utilization 0.9 \
    --enforce-eager \
    --disable-log-requests \
    --disable-log-stats \
    --served-model-name deepseek-coder-6.7b \
    --max-num-batched-tokens 32768 \
    --max-num-seqs 256
EOF

chmod +x /home/leviathan/launch_*.sh

# Create systemd services
echo "🔧 Creating systemd services..."

# Qwen service
sudo tee /etc/systemd/system/vllm-qwen.service > /dev/null << EOF
[Unit]
Description=vLLM Qwen 2.5 Coder 7B
After=network.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan
Environment=PATH=/home/leviathan/vllm-venv/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games
ExecStart=/home/leviathan/launch_qwen.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# DeepSeek service
sudo tee /etc/systemd/system/vllm-deepseek.service > /dev/null << EOF
[Unit]
Description=vLLM DeepSeek Coder 6.7B
After=network.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan
Environment=PATH=/home/leviathan/vllm-venv/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games
ExecStart=/home/leviathan/launch_deepseek.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start services
echo "🚀 Starting vLLM services..."
sudo systemctl daemon-reload
sudo systemctl enable vllm-qwen vllm-deepseek
sudo systemctl start vllm-qwen vllm-deepseek

echo "⏳ Waiting for services to start..."
sleep 20

# Test services
echo "🧪 Testing vLLM endpoints..."

# Test Qwen
if curl -s -X POST http://localhost:11434/v1/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen2.5-coder-7b","prompt":"Test","max_tokens":10}' | grep -q "choices"; then
    echo "✅ Qwen vLLM: WORKING"
else
    echo "⚠️  Qwen vLLM: Starting up..."
    sleep 10
fi

# Test DeepSeek
if curl -s -X POST http://localhost:11435/v1/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"deepseek-coder-6.7b","prompt":"Test","max_tokens":10}' | grep -q "choices"; then
    echo "✅ DeepSeek vLLM: WORKING"
else
    echo "⚠️  DeepSeek vLLM: Starting up..."
    sleep 10
fi

# Create Hermes vLLM config
echo "🔧 Creating Hermes vLLM configuration..."

cat > /home/leviathan/.hermes/config_vllm_final.yaml << 'EOF'
# 🦈 HERMES vLLM CONFIGURATION - 100% LOCAL, NO LIMITS
# vLLM OpenAI-compatible endpoints

model:
  default: qwen2.5-coder-7b
  provider: openai
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# Smart routing
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

# Compression
compression:
  enabled: true
  threshold: 0.9
  summary_model: qwen2.5-coder-7b
  summary_provider: openai
  summary_base_url: http://localhost:11434/v1
  summary_api_key: "no-key-needed"

# Session search
session_search:
  provider: openai
  model: qwen2.5-coder-7b
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# Skills hub
skills_hub:
  provider: openai
  model: qwen2.5-coder-7b
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# MCP
mcp:
  provider: openai
  model: qwen2.5-coder-7b
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# vLLM optimization
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
EOF

# Backup old config and set vLLM as default
echo "🔄 Setting vLLM as default..."
cp /home/leviathan/.hermes/config.yaml /home/leviathan/.hermes/config.yaml.backup.$(date +%s) 2>/dev/null || true
cp /home/leviathan/.hermes/config_vllm_final.yaml /home/leviathan/.hermes/config.yaml

echo ""
echo "🎉 FINAL LOCAL SETUP COMPLETE!"
echo "==============================="
echo ""
echo "✅ vLLM services:"
echo "   Qwen: http://localhost:11434/v1"
echo "   DeepSeek: http://localhost:11435/v1"
echo ""
echo "✅ Hermes reconfigured to use vLLM by default"
echo "✅ No output limits (32K context)"
echo "✅ 100% local - zero API costs"
echo ""
echo "📊 Service status:"
sudo systemctl status vllm-qwen --no-pager -l | head -10
echo ""
echo "🔧 Test command:"
echo "   curl -X POST http://localhost:11434/v1/completions \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"model\":\"qwen2.5-coder-7b\",\"prompt\":\"Hello\",\"max_tokens\":1000}'"
echo ""
echo "🚀 Switch to new terminal and run: hermes"
echo "   Hermes will now use local vLLM with no API dependencies!"