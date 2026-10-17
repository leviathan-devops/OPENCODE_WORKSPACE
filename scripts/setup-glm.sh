#!/bin/bash
set -e

# Install pipx if needed
sudo apt install -y pipx
pipx ensurepath

# Install aider
pipx install aider-chat

# Create launcher script
mkdir -p ~/.local/bin
cat > ~/.local/bin/glm << 'LAUNCHER'
#!/bin/bash
export OPENAI_API_KEY="<REDACTED_SET_VIA_ENV>"
export OPENAI_API_BASE="https://open.bigmodel.cn/api/paas/v4"

aider \
    --model openai/glm-z1-airx \
    --auto-commits \
    --no-suggest-shell-commands \
    --message commands \
    --no-attribute-commit-message-author \
    "$@"
LAUNCHER
chmod +x ~/.local/bin/glm

# Add to shell
grep -q 'alias glm=' ~/.zshrc 2>/dev/null || echo 'alias glm="~/.local/bin/glm"' >> ~/.zshrc
grep -q 'alias glm=' ~/.bashrc 2>/dev/null || echo 'alias glm="~/.local/bin/glm"' >> ~/.bashrc

echo "✅ Done. Run: source ~/.zshrc && glm"
