#!/bin/bash
# PERMANENT FIX for qwen "Cannot read properties of undefined (reading 'model')"

echo "Fixing qwen permanently..."

# Create a wrapper script that sets environment and config
sudo -S -p '' tee /usr/local/bin/qwen-fixed > /dev/null << 'WRAPPER_EOF'
#!/bin/bash
# Qwen fixed wrapper - solves the config bug

# Set environment to ensure config is loaded
export QWEN_SETTINGS_PATH="$HOME/.qwen/settings.json"

# Check if vLLM is running, start if not
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "Starting vLLM server..."
    sudo -S -p '' systemctl start vllm-ultimate
    sleep 10
fi

# Run qwen with explicit config parameters to avoid the bug
/usr/bin/qwen \
    --model "qwen2.5-coder-14b-awq" \
    --openai-base-url "http://localhost:8000/v1" \
    --openai-api-key "no-key-required-local-vllm" \
    --yolo \
    "$@"
WRAPPER_EOF

sudo -S -p '' chmod +x /usr/local/bin/qwen-fixed

# Create alias in bashrc
if ! grep -q "alias qwen=" ~/.bashrc; then
    echo 'alias qwen="qwen-fixed"' >> ~/.bashrc
    echo 'alias q="qwen-fixed"' >> ~/.bashrc
fi

echo "✅ Qwen permanently fixed"
echo "Use: qwen or q (both will work with vLLM + YOLO mode)"
