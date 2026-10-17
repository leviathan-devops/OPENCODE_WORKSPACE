#!/bin/bash
# Model Preparation Script
# Run this once to prepare the model, then launch terminal agents

export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

echo "🔧 DeepSeek Model Preparation"
echo "============================"

# Check if model is already downloaded
MODEL_PATH="$HOME/qwen-model"
if [ -f "$MODEL_PATH/model-00001-of-00004.safetensors" ]; then
    echo "✅ Model already downloaded"
else
    echo "⬇️ Downloading Qwen2.5-Coder-7B model..."
    cd ~ && hf download Qwen/Qwen2.5-Coder-7B-Instruct --local-dir qwen-model
    if [ $? -ne 0 ]; then
        echo "❌ Download failed"
        exit 1
    fi
fi

# Convert to GGUF
GGUF_PATH="$MODEL_PATH/qwen2.5-coder-7b.gguf"
if [ -f "$GGUF_PATH" ]; then
    echo "✅ Model already converted to GGUF"
else
    echo "🔄 Converting to GGUF format..."
    /tmp/llama.cpp/build/bin/llama-gguf "$MODEL_PATH" --output "$GGUF_PATH"
    if [ $? -ne 0 ]; then
        echo "❌ GGUF conversion failed"
        exit 1
    fi
fi

echo ""
echo "🎯 Model preparation complete!"
echo ""
echo "Next steps:"
echo "1. Open 5 separate terminals"
echo "2. In each terminal, run one of these:"
echo "   Terminal 1: /home/leviathan/OPENCODE_WORKSPACE/terminal-agent.sh 8001"
echo "   Terminal 2: /home/leviathan/OPENCODE_WORKSPACE/terminal-agent.sh 8002"
echo "   Terminal 3: /home/leviathan/OPENCODE_WORKSPACE/terminal-agent.sh 8003"
echo "   Terminal 4: /home/leviathan/OPENCODE_WORKSPACE/terminal-agent.sh 8004"
echo "   Terminal 5: /home/leviathan/OPENCODE_WORKSPACE/terminal-agent.sh 8005"
echo ""
echo "3. Configure Qwen Code to use:"
echo "   API Base: http://localhost:8001/v1"
echo "   (or any other port)"
echo ""
echo "🚀 Ready for dual-brain execution!"