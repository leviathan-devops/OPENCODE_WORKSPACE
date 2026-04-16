#!/bin/bash
# BUILD_VERIFY.sh — Verify dist/index.js is fresh (mtime > all src/**/*.ts)
# Exit 0 = PASS (dist is fresh), Exit 1 = FAIL (stale dist)

cd "$(dirname "$0")/.."

if [ ! -f dist/index.js ]; then
  echo "FAIL: dist/index.js does not exist — run 'bun build.ts' first"
  exit 1
fi

DIST_MTIME=$(stat -c '%Y' dist/index.js)
OLDEST_SRC=$(find src -name '*.ts' -type f -exec stat -c '%Y' {} \; | sort -n | head -1)

if [ "$DIST_MTIME" -lt "$OLDEST_SRC" ]; then
  echo "FAIL: dist/index.js is STALE"
  echo "dist mtime: $(stat -c '%Y %y' dist/index.js)"
  echo "oldest src mtime: $OLDEST_SRC"
  echo "Run 'bun build.ts' to rebuild"
  exit 1
fi

echo "PASS: dist/index.js is FRESH"
exit 0
