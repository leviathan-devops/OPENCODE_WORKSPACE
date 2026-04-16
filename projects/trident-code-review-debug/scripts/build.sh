#!/bin/bash
# TRIDENT BRAIN - Build Script
# Run from pkg/ directory

echo "========================================"
echo "   TRIDENT BRAIN v3.0 - BUILD"
echo "========================================"
echo ""

# Check dependencies
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found"
    echo "Run this script from the pkg/ directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build
echo "Building..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ BUILD SUCCESS"
    echo ""
    echo "Built files are in ../dist/"
    ls -la ../dist/
else
    echo ""
    echo "❌ BUILD FAILED"
    exit 1
fi