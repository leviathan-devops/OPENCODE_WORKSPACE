#!/bin/bash
# Qwen YOLO - Smart Model Selection
# Automatically chooses the best model based on context and availability

echo "🎯 Qwen YOLO - Smart Model Selection"
echo "==================================="

# Check if local agents are available and fast
LOCAL_AVAILABLE=false
LOCAL_FAST=false

if curl -s --connect-timeout 2 http://localhost:8001/v1/models > /dev/null; then
    LOCAL_AVAILABLE=true
    
    # Test response time
    start_time=$(date +%s%N)
    curl -s http://localhost:8001/v1/models > /dev/null
    end_time=$(date +%s%N)
    
    response_time=$((($end_time - $start_time) / 1000000))
    
    if [ $response_time -lt 100 ]; then  # Less than 100ms
        LOCAL_FAST=true
    fi
fi

# Model selection logic
if [ "$LOCAL_AVAILABLE" = true ] && [ "$LOCAL_FAST" = true ]; then
    echo "✅ Local Qwen Coder available and responsive"
    echo "🚀 Using: LOCAL QWEN CODER (Dual-Brain Architecture)"
    echo "💰 Cost: 100% free execution"
    echo ""
    exec /home/leviathan/OPENCODE_WORKSPACE/qwen-local.sh "$@"
elif [ "$LOCAL_AVAILABLE" = true ] && [ "$LOCAL_FAST" = false ]; then
    echo "⚠️  Local Qwen Coder available but slow"
    echo "🔄 Falling back to: GLM Cloud API"
    echo "💰 Cost: Standard API pricing"
    echo ""
    exec /home/leviathan/OPENCODE_WORKSPACE/qwen-glm.sh "$@"
else
    echo "🌐 Local agents not available"
    echo "🚀 Using: GLM Cloud API"
    echo "💰 Cost: Standard API pricing"
    echo ""
    exec /home/leviathan/OPENCODE_WORKSPACE/qwen-glm.sh "$@"
fi