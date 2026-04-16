#!/bin/bash
# Build and Install Hive Mind Shark Plugin v3

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$SCRIPT_DIR"
DEST_DIR="${HOME}/.config/opencode/plugins"
PLUGIN_NAME="hive-mind-plugin"

echo "🦈 Building Hive Mind Shark Plugin v3..."
echo ""

# Check dependencies
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build
echo "🔨 Compiling TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Check output
if [ ! -f "dist/index.js" ]; then
    echo "❌ dist/index.js not found after build"
    exit 1
fi

# Copy to plugins directory
echo "📦 Copying to plugins directory..."
mkdir -p "$DEST_DIR"
cp "dist/index.js" "${DEST_DIR}/${PLUGIN_NAME}.js"
cp "dist/index.js" "${DEST_DIR}/${PLUGIN_NAME}.ts"  # Keep TS for debugging

echo ""
echo "✅ Build complete!"
echo ""
echo "Installed: ${DEST_DIR}/${PLUGIN_NAME}.js"
echo ""
echo "To activate:"
echo "1. Add to ~/.config/opencode/opencode.json plugins array:"
echo '   \"plugin\": [\"hive-mind-plugin\", ...]'
echo ""
echo "2. Restart opencode"
echo ""
echo "To verify:"
echo "   curl http://localhost:1933/health"
echo ""
