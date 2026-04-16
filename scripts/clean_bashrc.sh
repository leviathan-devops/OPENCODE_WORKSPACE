#!/bin/bash
# Clean bashrc and add proper wrapper

cat > ~/.bashrc << 'EOF'
# Qwen Code proper wrapper - makes 'qwen' use local vLLM + YOLO by default
source ~/.qwen_proper_wrapper.sh
EOF

echo "✅ Clean bashrc created with proper wrapper"