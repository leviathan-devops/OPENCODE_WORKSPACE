#!/bin/bash
echo "Starting TGI servers..."
cd /home/leviathan/shark/tgi

# Pull TGI image
echo "Pulling TGI image..."
docker pull ghcr.io/huggingface/text-generation-inference:2.0.1

# Start Qwen server
echo "Starting Qwen server on port 8080..."
docker-compose up -d tgi-qwen

# Start DeepSeek server
echo "Starting DeepSeek server on port 8081..."
docker-compose up -d tgi-deepseek

echo ""
echo "✅ TGI servers starting..."
echo "Qwen:    http://localhost:8080"
echo "DeepSeek: http://localhost:8081"
echo ""
echo "Check status: docker-compose logs -f"
