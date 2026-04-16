#!/bin/bash
# Hermes Agent v3.5 — Build Script

set -e

cd "$(dirname "$0")"

echo "Building Hermes Agent v3.5..."

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  bun install
fi

echo "Compiling TypeScript..."
bun build src/index.ts --outdir dist --format esm --target node

echo "Build complete. Output: dist/index.js"