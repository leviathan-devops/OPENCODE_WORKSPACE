#!/bin/bash
# Shark Agent Plugin Rollback Script
# This script removes shark-agent-plugin and restores opencode-ultra

set -e

CONFIG_FILE="$HOME/.config/opencode/opencode.json"

echo "🦈 Shark Agent Plugin Rollback"
echo "==============================="
echo ""

# Step 1: Find most recent backup
BACKUP=$(ls -t "$CONFIG_FILE".backup.* 2>/dev/null | head -1)

if [ -z "$BACKUP" ]; then
    echo "❌ No backup file found!"
    echo "Cannot rollback automatically. Please manually edit $CONFIG_FILE"
    exit 1
fi

echo "📋 Step 1: Found backup: $BACKUP"

# Step 2: Restore backup
echo ""
echo "📋 Step 2: Restoring configuration..."
cp "$BACKUP" "$CONFIG_FILE"
echo "   ✅ Configuration restored"

# Step 3: Unlink plugin
echo ""
echo "📋 Step 3: Unlinking shark-agent-plugin..."
npm unlink -g shark-agent-plugin 2>/dev/null || true
echo "   ✅ Plugin unlinked"

# Step 4: Verify
echo ""
echo "🦈 Rollback Complete!"
echo "====================="
echo ""
echo "Configuration has been restored to:"
echo "  $BACKUP"
echo ""
echo "To verify OpenCode works:"
echo "  opencode --version"
