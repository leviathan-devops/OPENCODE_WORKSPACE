#!/bin/bash
set -e

echo "========================================"
echo "Deep Planning Mode - Deploy Script"
echo "========================================"

PLUGIN_NAME="deep-planning-mode"
OPENCODE_CONFIG="${HOME}/.config/opencode/opencode.json"
PLUGIN_DIR="${HOME}/.config/opencode/plugins/${PLUGIN_NAME}"

echo ""
echo "[1/4] Checking build exists..."
if [ ! -d "dist" ]; then
  echo "ERROR: dist/ not found. Run 'npm run build' first."
  exit 1
fi

echo ""
echo "[2/4] Creating plugin directory..."
mkdir -p "${PLUGIN_DIR}"

echo ""
echo "[3/4] Copying files..."
cp -r dist/* "${PLUGIN_DIR}/"
cp pkg/package.json "${PLUGIN_DIR}/"
cp -r context-library "${PLUGIN_DIR}/"

echo ""
echo "[4/4] Verifying deployment..."
if [ ! -f "${PLUGIN_DIR}/index.js" ]; then
  echo "ERROR: Deployment failed - index.js not found"
  exit 1
fi

echo ""
echo "========================================"
echo "Deploy complete!"
echo "Plugin: ${PLUGIN_DIR}"
echo "========================================"

ls -la "${PLUGIN_DIR}/"
