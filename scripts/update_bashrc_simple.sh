#!/bin/bash
# Update bashrc with simple Qwen Code wrapper

# Backup
cp ~/.bashrc ~/.bashrc.backup.$(date +%s)

# Remove old configurations
grep -v "qwen_vllm" ~/.bashrc > ~/.bashrc.tmp
grep -v "QWEN CODE" ~/.bashrc.tmp > ~/.bashrc.tmp2
mv ~/.bashrc.tmp2 ~/.bashrc
rm -f ~/.bashrc.tmp

# Add simple wrapper configuration
echo "" >> ~/.bashrc
echo "# ============================================================================" >> ~/.bashrc
echo "# QWEN CODE DEFAULT WRAPPER - 'qwen' uses local vLLM + YOLO by default" >> ~/.bashrc
echo "# ============================================================================" >> ~/.bashrc
echo "source ~/.qwen_vllm_default.sh" >> ~/.bashrc

echo "✅ Updated ~/.bashrc with simple wrapper"
echo "✅ Now 'qwen' command will use local vLLM by default"