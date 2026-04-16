#!/bin/bash
# BUILD_VERIFY.sh — Verify dist/index.js is fresh (mtime > all src/**/*.ts)
# Must be run from v3-build directory
# Exit 0 = PASS (dist is fresh), Exit 1 = FAIL (stale dist)

set -e

cd "$(dirname "$0")/.."

echo "=== Build Verification ==="

# Check dist exists
if [ ! -f dist/index.js ]; then
  echo "FAIL: dist/index.js does not exist"
  echo "Run 'bun build.ts' first"
  exit 1
fi

# Get dist mtime
DIST_MTIME=$(stat -c '%Y' dist/index.js)

# Find oldest source file
OLDEST_SRC=$(find src -name '*.ts' -type f -exec stat -c '%Y' {} \; | sort -n | head -1)

echo "dist/index.js mtime: $(stat -c '%Y %y' dist/index.js)"
echo "Oldest source mtime: $OLDEST_SRC ($(date -d @$OLDEST_SRC '+%Y-%m-%d %H:%M:%S'))"

if [ "$DIST_MTIME" -lt "$OLDEST_SRC" ]; then
  echo ""
  echo "FAIL: dist/index.js is STALE"
  echo "dist is older than source files — run 'bun build.ts'"
  exit 1
fi

echo ""
echo "PASS: dist/index.js is FRESH (newer than all source)"
exit 0
