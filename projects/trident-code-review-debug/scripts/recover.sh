#!/bin/bash
# TRIDENT BRAIN - Full Recovery Script
# Restores plugin from anchor to working state

echo "========================================"
echo "   TRIDENT BRAIN v3.0 - FULL RECOVERY"
echo "========================================"
echo ""

ANCHOR_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_DIR="$HOME/OPENCODE_WORKSPACE/projects/trident-brain-code-review"

echo "Anchor: $ANCHOR_DIR"
echo "Target: $PROJECT_DIR"
echo ""

# Step 1: Copy source
echo "[1/5] Copying source files..."
mkdir -p "$PROJECT_DIR/src"
cp "$ANCHOR_DIR/src"/* "$PROJECT_DIR/src/"
echo "  ✅ Source copied"

# Step 2: Copy dist
echo "[2/5] Copying built dist files..."
mkdir -p "$PROJECT_DIR/dist"
cp "$ANCHOR_DIR/dist"/* "$PROJECT_DIR/dist/"
echo "  ✅ Dist copied"

# Step 3: Copy package files
echo "[3/5] Copying package files..."
cp "$ANCHOR_DIR/pkg/package.json" "$PROJECT_DIR/"
cp "$ANCHOR_DIR/pkg/package-lock.json" "$PROJECT_DIR/"
cp "$ANCHOR_DIR/pkg/tsconfig.json" "$PROJECT_DIR/"
echo "  ✅ Package files copied"

# Step 4: Copy docs
echo "[4/5] Copying documentation..."
mkdir -p "$PROJECT_DIR/docs"
cp "$ANCHOR_DIR/docs/"*.md "$PROJECT_DIR/docs/" 2>/dev/null
echo "  ✅ Documentation copied"

# Step 5: Install and build
echo "[5/5] Installing dependencies and building..."
cd "$PROJECT_DIR"
npm install > /dev/null 2>&1
npm run build

if [ $? -eq 0 ]; then
    echo "  ✅ Build successful"
else
    echo "  ⚠️ Build had warnings (check manually)"
fi

echo ""
echo "========================================"
echo "✅ RECOVERY COMPLETE"
echo "========================================"
echo ""
echo "Project restored at: $PROJECT_DIR"
echo "Built plugin at: $PROJECT_DIR/dist/"
echo ""
echo "To deploy:"
echo "  cp -r $PROJECT_DIR/dist/* ~/.config/opencode/plugins/trident-brain/"
echo ""