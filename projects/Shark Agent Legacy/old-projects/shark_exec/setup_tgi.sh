#!/bin/bash
# 🦈 SHARK TGI SETUP - NO OUTPUT LIMITS, STREAMING ENABLED

set -e

echo "🚀 NUCLEAR FIRE ENGAGED - REMOVING ALL OUTPUT LIMITS"
echo "====================================================="

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose
    sudo usermod -aG docker $USER
fi

# Create TGI directory
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
      - MODEL_ID=deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct
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
    command: --model-id deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct --quantize gptq --max-input-length 32768 --max-total-tokens 32768 --max-batch-prefill-tokens 32768 --max-batch-total-tokens 32768 --dtype bfloat16
EOF

echo "📦 Pulling TGI images (this may take a while)..."
docker pull ghcr.io/huggingface/text-generation-inference:2.0.2

echo "🚀 Starting TGI services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

echo "✅ TGI Setup Complete!"
echo "Qwen TGI: http://localhost:11434"
echo "DeepSeek TGI: http://localhost:11435"
echo ""
echo "Test with:"
echo "curl -X POST http://localhost:11434/generate \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"inputs\":\"Hello\",\"parameters\":{\"max_new_tokens\":1000,\"do_sample\":true}}'"