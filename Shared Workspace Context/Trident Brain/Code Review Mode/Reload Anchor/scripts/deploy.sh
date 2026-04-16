#!/bin/bash
# TRIDENT BRAIN v3.0.1 - Deploy Script
# Deploys built plugin to OpenCode plugins directory

echo "========================================"
echo "   TRIDENT BRAIN v3.0.1 - DEPLOY"
echo "========================================"
echo ""

PLUGIN_DIR="$HOME/.config/opencode/plugins/trident-brain"
SRC_DIR="$(cd "$(dirname "$0")/../dist" && pwd)"

echo "Source: $SRC_DIR"
echo "Target: $PLUGIN_DIR"
echo ""

# Check source exists
if [ ! -f "$SRC_DIR/index.js" ]; then
    echo "❌ ERROR: Built files not found at $SRC_DIR"
    echo "Run build.sh first"
    exit 1
fi

# Create target directory
mkdir -p "$PLUGIN_DIR"

# Copy files
cp -r "$SRC_DIR"/* "$PLUGIN_DIR/"

if [ $? -eq 0 ]; then
    echo "✅ DEPLOY SUCCESS"
    echo ""
    echo "Deployed files:"
    ls -la "$PLUGIN_DIR"
    echo ""
    echo "Restart OpenCode to load the plugin"
else
    echo "❌ DEPLOY FAILED"
    exit 1
fi