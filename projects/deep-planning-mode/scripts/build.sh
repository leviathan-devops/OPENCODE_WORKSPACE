#!/bin/bash
set -e

echo "========================================"
echo "Deep Planning Mode - Build Script"
echo "========================================"

VERSION=$(node -p "require('./pkg/package.json').version")
echo "Building version $VERSION"

echo ""
echo "[1/4] Cleaning previous build..."
rm -rf dist/
mkdir -p dist

echo ""
echo "[2/4] Type checking..."
npm run typecheck

echo ""
echo "[3/4] Compiling TypeScript..."
npx tsc

echo ""
echo "[4/4] Verifying build..."
if [ ! -f "dist/index.js" ]; then
  echo "ERROR: dist/index.js not found"
  exit 1
fi

echo ""
echo "========================================"
echo "Build complete!"
echo "Output: dist/"
echo "========================================"

ls -la dist/
