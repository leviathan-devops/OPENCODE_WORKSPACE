#!/bin/bash
# Final bashrc setup

cat > ~/.bashrc << 'EOF'
# Qwen Code final wrapper
source ~/.qwen_final_wrapper.sh
EOF

echo "✅ Final bashrc setup complete"