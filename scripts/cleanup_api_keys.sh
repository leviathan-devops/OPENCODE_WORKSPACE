#!/bin/bash
# Clean up API keys from environment and files
echo "=== API Key Cleanup Script ==="

# Remove from current environment (for future sessions)
sed -i '/OPENAI_API_KEY/d' ~/.bashrc ~/.profile ~/.bash_profile 2>/dev/null
sed -i '/AIDER_API_KEY/d' ~/.bashrc ~/.profile ~/.bash_profile 2>/dev/null
sed -i '/OPENAI_BASE_URL/d' ~/.bashrc ~/.profile ~/.bash_profile 2>/dev/null
sed -i '/AIDER_API_BASE/d' ~/.bashrc ~/.profile ~/.bash_profile 2>/dev/null

# Remove from shell session
unset OPENAI_API_KEY
unset AIDER_API_KEY
unset OPENAI_BASE_URL
unset AIDER_API_BASE

echo "API keys removed from shell configuration."
echo "Please request new keys from providers and store them securely."
echo "Consider using a password manager or secure vault for API keys."
