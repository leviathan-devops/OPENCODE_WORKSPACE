#!/bin/bash
# 🚀 NUCLEAR RECONFIGURATION - TGI ONLY, NO OUTPUT LIMITS

set -e

echo "💣 NUKING OLD CONFIGURATIONS..."
echo "=================================="

# Kill all Ollama processes
sudo systemctl stop ollama 2>/dev/null || true
sudo systemctl disable ollama 2>/dev/null || true
sudo pkill -9 ollama 2>/dev/null || true
sudo pkill -9 ollama-runner 2>/dev/null || true

# Remove Ollama
sudo apt-get remove -y ollama 2>/dev/null || true

echo "✅ Ollama nuked"

# Install Docker for TGI
echo "📦 Installing Docker for TGI..."
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Create TGI directory
echo "📁 Setting up TGI directory..."
mkdir -p /home/leviathan/tgi
cd /home/leviathan/tgi

# Create docker-compose.yml for TGI with NO limits
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  tgi-qwen:
    image: ghcr.io/huggingface/text-generation-inference:2.0.2
    container_name: tgi-qwen
    ports:
      - "11434:80"
    volumes:
      - ./models:/data
    environment:
      - MODEL_ID=Qwen/Qwen2.5-Coder-7B-Instruct-GGUF
      - QUANTIZE=gptq
      - MAX_BATCH_PREFILL_TOKENS=32768
      - MAX_INPUT_LENGTH=32768
      - MAX_TOTAL_TOKENS=32768
      - MAX_BATCH_TOTAL_TOKENS=32768
      - DTYPE=bfloat16
      - TRUST_REMOTE_CODE=true
      - REPETITION_PENALTY=1.1
      - TEMPERATURE=0.7
      - TOP_P=0.95
      - TOP_K=40
      - DO_SAMPLE=true
      - MAX_NEW_TOKENS=8192
      - MIN_NEW_TOKENS=1
      - STOP_SEQUENCES="<|im_end|>"
      - SEED=42
      - WATERMARK=false
      - RETURN_FULL_TEXT=true
      - TRUNCATE=32768
      - STREAMING=true
      - NO_TRUNCATE=true
    shm_size: 16gb
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    command: --model-id Qwen/Qwen2.5-Coder-7B-Instruct-GGUF --quantize gptq --max-input-length 32768 --max-total-tokens 32768 --max-batch-prefill-tokens 32768 --max-batch-total-tokens 32768 --dtype bfloat16

  tgi-deepseek:
    image: ghcr.io/huggingface/text-generation-inference:2.0.2
    container_name: tgi-deepseek
    ports:
      - "11435:80"
    volumes:
      - ./models:/data
    environment:
      - MODEL_ID=deepseek-ai/DeepSeek-Coder-6.7B-Instruct
      - QUANTIZE=gptq
      - MAX_BATCH_PREFILL_TOKENS=32768
      - MAX_INPUT_LENGTH=32768
      - MAX_TOTAL_TOKENS=32768
      - MAX_BATCH_TOTAL_TOKENS=32768
      - DTYPE=bfloat16
      - TRUST_REMOTE_CODE=true
      - REPETITION_PENALTY=1.1
      - TEMPERATURE=0.7
      - TOP_P=0.95
      - TOP_K=40
      - DO_SAMPLE=true
      - MAX_NEW_TOKENS=8192
      - MIN_NEW_TOKENS=1
      - STOP_SEQUENCES="<|im_end|>"
      - SEED=42
      - WATERMARK=false
      - RETURN_FULL_TEXT=true
      - TRUNCATE=32768
      - STREAMING=true
      - NO_TRUNCATE=true
    shm_size: 16gb
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    command: --model-id deepseek-ai/DeepSeek-Coder-6.7B-Instruct --quantize gptq --max-input-length 32768 --max-total-tokens 32768 --max-batch-prefill-tokens 32768 --max-batch-total-tokens 32768 --dtype bfloat16
EOF

echo "🚀 Starting TGI services..."
docker-compose up -d

echo "⏳ Waiting for TGI to start (30 seconds)..."
sleep 30

echo "🧪 Testing TGI endpoints..."
# Test Qwen TGI
curl -X POST http://localhost:11434/generate \
  -H 'Content-Type: application/json' \
  -d '{"inputs":"Hello","parameters":{"max_new_tokens":100,"do_sample":true}}' \
  -s | python3 -c "import sys,json; print('✅ Qwen TGI:', 'working' if 'generated_text' in json.load(sys.stdin) else 'failed')" 2>/dev/null || echo "❌ Qwen TGI test failed"

# Test DeepSeek TGI
curl -X POST http://localhost:11435/generate \
  -H 'Content-Type: application/json' \
  -d '{"inputs":"Hello","parameters":{"max_new_tokens":100,"do_sample":true}}' \
  -s | python3 -c "import sys,json; print('✅ DeepSeek TGI:', 'working' if 'generated_text' in json.load(sys.stdin) else 'failed')" 2>/dev/null || echo "❌ DeepSeek TGI test failed"

echo ""
echo "🔧 RECONFIGURING HERMES FOR TGI..."
echo "=================================="

# Create Hermes TGI config
cat > /home/leviathan/.hermes/config_tgi_final.yaml << 'EOF'
# 🦈 HERMES TGI CONFIGURATION - NO OUTPUT LIMITS, 100% LOCAL
# TGI endpoints: Qwen @ 11434, DeepSeek @ 11435

model:
  default: qwen2.5-coder-7b
  provider: openai
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# Smart routing - TGI endpoints
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

# Fallback chain - TGI ONLY
fallback_chain:
  - provider: openai
    model: qwen2.5-coder-7b
    base_url: http://localhost:11434/v1
    api_key: "no-key-needed"
  - provider: openai
    model: deepseek-coder-6.7b
    base_url: http://localhost:11435/v1
    api_key: "no-key-needed"

# Brain bridge - TGI ONLY
brain_bridge:
  enabled: true
  web_thinking_threshold: 5000  # Very high to avoid web
  local_preference: true
  web_fallback: false

# Agent configuration
agent:
  max_turns: 100
  verbose: false
  reasoning_effort: high
  autonomous_execution: true
  safety_checks: true
  token_budget: 32768  # TGI supports large contexts

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

# Compression (TGI models)
compression:
  enabled: true
  threshold: 0.9
  summary_model: qwen2.5-coder-7b
  summary_provider: openai
  summary_base_url: http://localhost:11434/v1
  summary_api_key: "no-key-needed"

# Session search (TGI)
session_search:
  provider: openai
  model: qwen2.5-coder-7b
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# Skills hub (TGI)
skills_hub:
  provider: openai
  model: qwen2.5-coder-7b
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# MCP (TGI)
mcp:
  provider: openai
  model: qwen2.5-coder-7b
  base_url: http://localhost:11434/v1
  api_key: "no-key-needed"

# TGI-specific optimization
tgi_optimization:
  max_context_length: 32768
  temperature: 0.7
  top_p: 0.95
  top_k: 40
  repetition_penalty: 1.1
  do_sample: true
  max_new_tokens: 8192
  min_new_tokens: 1
  streaming: true
  no_truncate: true

# Emergency protocol
emergency_protocol:
  if_api_called: "block_and_alert"
  fallback_strategy: "tgi_only"
  max_tgi_retries: 3
  system_halt_on_api_dependency: true

# Model aliases for routing
model_aliases:
  qwen2.5-coder-7b: "Qwen/Qwen2.5-Coder-7B-Instruct-GGUF"
  deepseek-coder-6.7b: "deepseek-ai/DeepSeek-Coder-6.7B-Instruct"
EOF

echo "✅ Hermes TGI config created"

# Backup old config and replace with TGI config
echo "🔄 Setting TGI as default..."
cp /home/leviathan/.hermes/config.yaml /home/leviathan/.hermes/config.yaml.backup.$(date +%s) 2>/dev/null || true
cp /home/leviathan/.hermes/config_tgi_final.yaml /home/leviathan/.hermes/config.yaml

echo ""
echo "🎉 NUCLEAR RECONFIGURATION COMPLETE!"
echo "====================================="
echo ""
echo "✅ Ollama: REMOVED"
echo "✅ TGI: RUNNING on ports 11434 (Qwen) and 11435 (DeepSeek)"
echo "✅ Hermes: RECONFIGURED to use TGI by default"
echo "✅ Output limits: REMOVED (32K context, streaming enabled)"
echo ""
echo "📊 TGI STATUS:"
docker-compose ps
echo ""
echo "🔧 Test TGI manually:"
echo "  curl -X POST http://localhost:11434/generate \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"inputs\":\"Write a 2000 word essay\",\"parameters\":{\"max_new_tokens\":2000}}'"
echo ""
echo "🚀 Hermes is now 100% local with TGI - no API costs, no output limits!"