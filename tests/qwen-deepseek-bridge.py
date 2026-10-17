#!/usr/bin/env python3
"""
Qwen Code → DeepSeek Brain Bridge
==================================
This script transforms Qwen Code into a pure execution layer for DeepSeek R1.
All reasoning comes from DeepSeek. Qwen Code becomes just the interface/hands.

Usage:
    deepseek-mode
    
This sets an environment variable that Qwen Code sessions can detect.
"""

import os
import sys
import subprocess

# Set environment flag for DeepSeek mode
DEEPSEEK_MODE_SCRIPT = """
# DeepSeek Brain Mode for Qwen Code
# Add to your shell config to enable

export DEEPSEEK_BRAIN_MODE=1
export DEEPSEEK_API_KEY="<REDACTED_SET_VIA_ENV>"

# Alias to launch Qwen Code in DeepSeek mode
alias qwen-deepseek='DEEPSEEK_BRAIN_MODE=1 qwen'

echo "✅ DeepSeek Brain Mode enabled for this session"
echo "   Run 'qwen-deepseek' to start Qwen Code with DeepSeek reasoning"
"""

print("Setting up DeepSeek Brain Mode for Qwen Code...")
print("\nThis makes Qwen Code use DeepSeek R1 for all reasoning.")
print("Qwen Code becomes the interface, DeepSeek is the brain.\n")

# Add to bash_aliases
bash_aliases = os.path.expanduser("~/.bash_aliases")
with open(bash_aliases, "a") as f:
    f.write("\n# DeepSeek Brain Mode\n")
    f.write("export DEEPSEEK_BRAIN_MODE=1\n")
    f.write("export DEEPSEEK_API_KEY=\"sk-e8e93e31b582423e9fdaa4ab8e9347e2\"\n")
    f.write("alias qwen-deepseek='DEEPSEEK_BRAIN_MODE=1 qwen'\n")

print("✅ Added to ~/.bash_aliases")
print("\nIn a NEW terminal, run:")
print("   qwen-deepseek")
print("\nOr in current session:")
print("   source ~/.bash_aliases && qwen-deepseek")
