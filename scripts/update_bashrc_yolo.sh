#!/bin/bash
# Update bashrc to use YOLO configuration

# Remove old qwen_vllm_env lines
grep -v "qwen_vllm_env" ~/.bashrc > ~/.bashrc.tmp
mv ~/.bashrc.tmp ~/.bashrc

# Add YOLO configuration
echo "" >> ~/.bashrc
echo "# Qwen Code + vLLM Local Setup with YOLO mode" >> ~/.bashrc
echo "source ~/.qwen_vllm_env_yolo.sh" >> ~/.bashrc

echo "✅ Updated ~/.bashrc with YOLO mode configuration"