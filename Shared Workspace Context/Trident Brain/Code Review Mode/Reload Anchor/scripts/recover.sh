#!/bin/bash
# TRIDENT BRAIN v3.0.1 - Full Recovery Script
# Restores plugin from anchor to working state AND deploys

echo "========================================"
echo "   TRIDENT BRAIN v3.0.1 - FULL RECOVERY"
echo "========================================"
echo ""

ANCHOR_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_DIR="$HOME/OPENCODE_WORKSPACE/projects/trident-brain-v3.0"
PLUGIN_DIR="$HOME/.config/opencode/plugins/trident-brain"

echo "Anchor: $ANCHOR_DIR"
echo "Target: $PROJECT_DIR"
echo "Plugin: $PLUGIN_DIR"
echo ""

# Step 1: Copy source
echo "[1/6] Copying source files..."
mkdir -p "$PROJECT_DIR/src"
cp "$ANCHOR_DIR/src"/* "$PROJECT_DIR/src/"
echo "  ✅ Source copied"

# Step 2: Copy dist
echo "[2/6] Copying built dist files..."
mkdir -p "$PROJECT_DIR/dist"
cp "$ANCHOR_DIR/dist"/* "$PROJECT_DIR/dist/"
echo "  ✅ Dist copied"

# Step 3: Copy package files
echo "[3/6] Copying package files..."
cp "$ANCHOR_DIR/package.json" "$PROJECT_DIR/"
cp "$ANCHOR_DIR/tsconfig.json" "$PROJECT_DIR/"
echo "  ✅ Package files copied"

# Step 4: Deploy to OpenCode
echo "[4/6] Deploying to OpenCode plugins..."
mkdir -p "$PLUGIN_DIR"
cp "$ANCHOR_DIR/dist"/* "$PLUGIN_DIR/"
echo "  ✅ Deployed to $PLUGIN_DIR"

# Step 5: Install and build
echo "[5/6] Installing dependencies and building..."
cd "$PROJECT_DIR"
npm install > /dev/null 2>&1
npm run build

if [ $? -eq 0 ]; then
    echo "  ✅ Build successful"
else
    echo "  ⚠️ Build had warnings (check manually)"
fi

# Step 6: Verify plugin loads
echo "[6/6] Verifying plugin..."
node -e "import('$PLUGIN_DIR/index.js').then(m => console.log('  ✅ Plugin loads OK')).catch(e => console.log('  ❌ Plugin load failed:', e.message))"

echo ""
echo "========================================"
echo "✅ RECOVERY COMPLETE"
echo "========================================"
echo ""
echo "Working project: $PROJECT_DIR"
echo "Plugin deployed: $PLUGIN_DIR"
echo ""
echo "To use in OpenCode:"
echo "1. Refresh OpenCode"
echo "2. Select 'trident' agent"
echo "3. Say 'status' or 'help'"
echo ""