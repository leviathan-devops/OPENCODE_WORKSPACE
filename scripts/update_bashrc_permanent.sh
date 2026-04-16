#!/bin/bash
# Update bashrc with permanent Qwen Code + vLLM configuration

# Backup current bashrc
cp ~/.bashrc ~/.bashrc.backup.$(date +%s)

# Remove any existing qwen/vllm configurations
grep -v "qwen_vllm" ~/.bashrc > ~/.bashrc.tmp
grep -v "QWEN CODE" ~/.bashrc.tmp > ~/.bashrc.tmp2
grep -v "vllm-" ~/.bashrc.tmp2 > ~/.bashrc.tmp3
mv ~/.bashrc.tmp3 ~/.bashrc
rm -f ~/.bashrc.tmp ~/.bashrc.tmp2

# Add permanent configuration at the END of bashrc
echo "" >> ~/.bashrc
echo "# ============================================================================" >> ~/.bashrc
echo "# QWEN CODE + vLLM PERMANENT CONFIGURATION" >> ~/.bashrc
echo "# Loads automatically in every terminal, vLLM starts on boot" >> ~/.bashrc
echo "# ============================================================================" >> ~/.bashrc
echo "source ~/.qwen_vllm_permanent.sh" >> ~/.bashrc

echo "✅ Permanent configuration added to ~/.bashrc"
echo "✅ Backup created: ~/.bashrc.backup.*"