#!/bin/bash
# Final bashrc update with direct vLLM wrapper

# Clean bashrc
cp ~/.bashrc ~/.bashrc.backup.final
echo "# Qwen Code direct vLLM wrapper" > ~/.bashrc
echo "source ~/.qwen_direct.sh" >> ~/.bashrc

echo "✅ Final configuration applied"
echo "✅ 'qwen' command now uses vLLM directly"
echo "✅ Simple, reliable, no compatibility issues"