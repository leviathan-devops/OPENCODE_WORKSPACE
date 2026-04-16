#!/bin/bash
# Fix bashrc with simple wrapper

# Create clean bashrc
cp ~/.bashrc ~/.bashrc.backup.$(date +%s)

# Keep only non-qwen lines
grep -v "qwen" ~/.bashrc > ~/.bashrc.tmp
grep -v "QWEN" ~/.bashrc.tmp > ~/.bashrc.tmp2
grep -v "vllm" ~/.bashrc.tmp2 > ~/.bashrc.tmp3
mv ~/.bashrc.tmp3 ~/.bashrc
rm -f ~/.bashrc.tmp ~/.bashrc.tmp2

# Add simple wrapper
echo "" >> ~/.bashrc
echo "# Qwen Code - uses local vLLM by default" >> ~/.bashrc
echo "source ~/.qwen_simple_wrapper.sh" >> ~/.bashrc

echo "✅ Bashrc updated with simple wrapper"