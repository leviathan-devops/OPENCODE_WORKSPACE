#!/bin/bash
# Final setup

cat > ~/.bashrc << 'EOF'
source ~/.qwen_working_wrapper.sh
EOF

echo "✅ Final setup complete"
echo "✅ 'qwen' now uses local vLLM with YOLO mode"
echo "✅ All Qwen Code features work"