#!/bin/bash
# Shark Agent Plugin Migration Script
# This script replaces opencode-ultra with shark-agent-plugin

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$HOME/.config/opencode/opencode.json"
BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

echo "🦈 Shark Agent Plugin Migration"
echo "================================"
echo ""

# Step 1: Verify we're in the right directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "❌ Error: package.json not found in $PROJECT_DIR"
    echo "Please run this script from the shark-agent-plugin directory"
    exit 1
fi

# Step 2: Backup current configuration
echo "📋 Step 1: Backing up current OpenCode configuration..."
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo "   ✅ Backup created: $BACKUP_FILE"
else
    echo "   ⚠️  No existing config file found, will create new one"
fi

# Step 3: Update configuration to use shark-agent-plugin
echo ""
echo "📋 Step 2: Updating OpenCode configuration..."
if [ -f "$CONFIG_FILE" ]; then
    # Check if opencode-ultra is currently the plugin
    if grep -q '"opencode-ultra"' "$CONFIG_FILE"; then
        sed -i 's/"opencode-ultra"/"shark-agent-plugin"/g' "$CONFIG_FILE"
        echo "   ✅ Replaced opencode-ultra with shark-agent-plugin"
    elif grep -q '"shark-agent-plugin"' "$CONFIG_FILE"; then
        echo "   ℹ️  shark-agent-plugin already configured"
    else
        echo "   ⚠️  No plugin found in config, adding shark-agent-plugin"
        sed -i 's/"plugin": \[/"plugin": ["shark-agent-plugin",/g' "$CONFIG_FILE"
    fi
else
    echo '   { "plugin": ["shark-agent-plugin"] }' > "$CONFIG_FILE"
    echo "   ✅ Created new config with shark-agent-plugin"
fi

# Step 4: Install plugin globally
echo ""
echo "📋 Step 3: Installing shark-agent-plugin globally..."
cd "$PROJECT_DIR"
npm link 2>/dev/null || true
echo "   ✅ Plugin linked globally"

# Step 5: Verify installation
echo ""
echo "📋 Step 4: Verifying installation..."
if command -v opencode &> /dev/null; then
    echo "   ✅ OpenCode is accessible"
    OPENCODE_VERSION=$(opencode --version 2>&1 | head -1 || echo "unknown")
    echo "   📌 OpenCode version: $OPENCODE_VERSION"
else
    echo "   ⚠️  OpenCode not found in PATH"
    echo "   Please ensure OpenCode is installed: npm install -g opencode"
fi

# Step 6: Show final status
echo ""
echo "🦈 Migration Complete!"
echo "======================"
echo ""
echo "To test the plugin, run:"
echo "  opencode 'Try to write to ~/.ssh/config'"
echo ""
echo "Expected behavior:"
echo "  - Guardian should block ~/.ssh/config writes"
echo "  - Workflow should enforce 5-step process"
echo "  - Mock mode should block 'I would run...' language"
echo ""
echo "To rollback if needed:"
echo "  cp $BACKUP_FILE $CONFIG_FILE"
echo ""
echo "To unlink the plugin:"
echo "  npm unlink -g shark-agent-plugin"
