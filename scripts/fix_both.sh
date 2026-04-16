#!/bin/bash
# Fix both: vLLM running + YOLO default

# 1. Start vLLM if not running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "Starting vLLM..."
    sudo systemctl start vllm-qwen-multi
    sleep 15
fi

# 2. Create proper wrapper that ALWAYS adds --yolo
cat > ~/.qwen_always_yolo.sh << 'EOF'
# ALWAYS use YOLO mode
qwen() {
    # Check if vLLM is running
    if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "Starting vLLM server..."
        sudo systemctl start vllm-qwen-multi
        sleep 10
    fi
    
    # ALWAYS add --yolo flag
    /usr/bin/qwen --yolo "$@"
}
EOF

# 3. Apply it
echo "source ~/.qwen_always_yolo.sh" > ~/.bashrc

echo "✅ vLLM should be running"
echo "✅ qwen now ALWAYS uses --yolo flag"
echo "✅ Test with: qwen 'Write code'"