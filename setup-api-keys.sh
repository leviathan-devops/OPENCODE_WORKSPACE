#!/bin/bash
# 🦈 Shark Frankenstein API Key Setup Script

set -e

CONFIG_FILE="$HOME/.shark-api-keys"
SHELL_RC="$HOME/.bashrc"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🦈 Shark Frankenstein API Key Setup${NC}"
echo -e "${YELLOW}This script will help you set API keys for Shark Frankenstein CLI${NC}"
echo ""

# Check if config file exists
if [ -f "$CONFIG_FILE" ]; then
    echo "Existing API keys found:"
    cat "$CONFIG_FILE"
    echo ""
    read -p "Do you want to update? (y/n): " update
    if [[ "$update" != "y" && "$update" != "Y" ]]; then
        echo "Exiting."
        exit 0
    fi
fi

echo -e "${CYAN}Step 1: GLM API Key (required for GLM models)${NC}"
echo "Get your key from: https://open.bigmodel.cn/"
read -p "GLM_API_KEY (leave empty to skip): " GLM_KEY

echo -e "\n${CYAN}Step 2: DeepSeek API Key (required for DeepSeek models)${NC}"
echo "Get your key from: https://platform.deepseek.com/api_keys"
read -p "DEEPSEEK_API_KEY (leave empty to skip): " DEEPSEEK_KEY

echo -e "\n${CYAN}Step 3: OpenCode Zen API Key (required for free models)${NC}"
echo "Get your key from: https://opencode.ai/zen (sign up required)"
read -p "OPENCODE_ZEN_API_KEY (leave empty to skip): " ZEN_KEY

echo -e "\n${CYAN}Step 4: MiMo API Key (optional, for MiMo V2 Omni)${NC}"
echo "Get your key from: https://mimo.ai"
read -p "MIMO_API_KEY (leave empty to skip): " MIMO_KEY

echo -e "\n${CYAN}Step 5: Nemotron API Key (optional, for Nemotron 3 Super)${NC}"
echo "Get your key from: https://nemotron.ai"
read -p "NEMOTRON_API_KEY (leave empty to skip): " NEMOTRON_KEY

# Write to config file
cat > "$CONFIG_FILE" << EOF
# Shark Frankenstein API Keys
# Generated on $(date)
$( [ -n "$GLM_KEY" ] && echo "export GLM_API_KEY=\"$GLM_KEY\"" )
$( [ -n "$DEEPSEEK_KEY" ] && echo "export DEEPSEEK_API_KEY=\"$DEEPSEEK_KEY\"" )
$( [ -n "$ZEN_KEY" ] && echo "export OPENCODE_ZEN_API_KEY=\"$ZEN_KEY\"" )
$( [ -n "$MIMO_KEY" ] && echo "export MIMO_API_KEY=\"$MIMO_KEY\"" )
$( [ -n "$NEMOTRON_KEY" ] && echo "export NEMOTRON_API_KEY=\"$NEMOTRON_KEY\"" )
EOF

echo -e "\n${GREEN}✓ API keys saved to $CONFIG_FILE${NC}"

# Update shell RC
if ! grep -q "source $CONFIG_FILE" "$SHELL_RC"; then
    echo "" >> "$SHELL_RC"
    echo "# Shark Frankenstein API Keys" >> "$SHELL_RC"
    echo "[ -f \"$CONFIG_FILE\" ] && source \"$CONFIG_FILE\"" >> "$SHELL_RC"
    echo -e "${GREEN}✓ Added sourcing to $SHELL_RC${NC}"
fi

echo -e "\n${CYAN}Next steps:${NC}"
echo "1. Run: source $CONFIG_FILE"
echo "2. Test with: shark --help"
echo "3. Try a task: shark \"list files\""
echo ""
echo -e "${YELLOW}Note: Free Zen models may require signing up at https://opencode.ai/zen${NC}"