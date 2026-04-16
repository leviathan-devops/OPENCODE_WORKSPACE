#!/bin/bash
# Hermes Agent v3.5 — Test Script

set -e

cd "$(dirname "$0")"

echo "Running Hermes Agent v3.5 tests..."

echo "=== Integration Tests ==="
bun run integration-tests/full-test-suite.ts

echo "=== E2E Tests ==="
bun run test-e2e.ts