#!/bin/bash
# DEEPSEEK OPENFANG ENGINEER – FRESH SETUP
# Run this script to configure OpenFang with Discord and DeepSeek.

set -e  # Exit on error

echo "🚀 Starting OpenFang DeepSeek Engineer setup..."

# Step 1: Verify OpenFang is installed
if ! command -v openfang &> /dev/null; then
    echo "❌ OpenFang not found. Installing now..."
    curl -fsSL https://openfang.sh/install | sh
fi

# Step 2: Stop any running OpenFang instance
pkill openfang 2>/dev/null || true
sleep 2

# Step 3: Create config directory
mkdir -p ~/.openfang

# Step 4: Write the main config file
cat > ~/.openfang/config.toml << 'EOF'
# OpenFang configuration – DeepSeek as primary model

[llm]
provider = "deepseek"
api_key = "sk-e8e93e31b582423e9fdaa4ab8e9347e2"
model = "deepseek-chat"
reasoning_model = "deepseek-chat"
fast_model = "deepseek-chat"

[memory]
enabled = true
type = "sqlite"
path = "~/.openfang/memory.db"

[discord]
enabled = true
token = "MTQ3NzAzMTk1MTg2NDAzNzM5Ng.GSy3lB.M37ric87tHks7ij7Rc626rdQJ5C29rEk89S6wM"
guild_id = ""
intents = 33281

[[discord.bindings]]
channel = "all"
agent = "engineer"

[[agents]]
name = "engineer"
type = "assistant"
model = "deepseek-chat"
system_prompt = """
You are the Leviathan DeepSeek Engineer. You have full access to the terminal via OpenFang Hands. 
The user will give you tasks in plain English. You will break them down and execute commands using OpenFang's built‑in tools. 
Always think step‑by‑step. If you need to run a command, use the `shell` Hand. Report results back concisely.
"""
tools = ["shell", "file", "git"]
EOF

# Step 5: Start OpenFang
echo "🚀 Starting OpenFang..."
openfang start
sleep 5

# Step 6: Verify Discord connection
echo "🔍 Checking Discord connection..."
openfang channel test discord || echo "⚠️ Discord not connected. Check token and intents."

# Step 7: Done
echo ""
echo "✅ DEEPSEEK OPENFANG ENGINEER IS READY."
echo "   You can now talk to me in Discord. I am listening in all channels."
