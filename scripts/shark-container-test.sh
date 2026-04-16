#!/bin/bash
# Shark Agent v4.8.1 Container Test Runner
# Runs the complete test suite INSIDE the container

set -e

IMAGE_NAME="shark-agent-v481-test"
CONTAINER_NAME="shark-v481-sandbox"
CONTAINER_WORKSPACE="/opt/opencode/workspace"
ARTIFACTS_DIR="/opt/opencode/artifacts"

echo "=== Shark v4.8.1 Container Test Runner ==="
echo "This runs ALL tests inside an isolated container"
echo ""

# Clean up any existing container with same name
echo "Cleaning up existing container..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

# Build the container image
echo "Building container image..."
cd /home/leviathan/OPENCODE_WORKSPACE/.shark/container
docker build -t "$IMAGE_NAME" . 2>&1 | tail -20

if [ $? -ne 0 ]; then
    echo "ERROR: Container build failed"
    exit 1
fi

echo "✓ Container image ready: $IMAGE_NAME"
echo ""

# Run the container with workspace mount
echo "Starting container with workspace mount..."
docker run -d --name "$CONTAINER_NAME" \
    -v /home/leviathan/OPENCODE_WORKSPACE:/opt/opencode/workspace \
    -w /opt/opencode/workspace \
    -e SHARK_CONTAINER=true \
    -e SHARK_PLUGIN_DIR=/opt/opencode/plugins/shark-agent \
    -e SHARK_ALLOWED_PATHS=/opt/opencode,/workspace \
    -e SHARK_ARTIFACTS_DIR=/opt/opencode/artifacts \
    "$IMAGE_NAME" \
    tail -f /dev/null 2>&1

# Wait for container to start
sleep 2

# Run the build in the container
echo ""
echo "=== Running Build in Container ==="
docker exec "$CONTAINER_NAME" bash -c "cd /opt/opencode/workspace/projects/shark-agent-v4 && bun run build 2>&1"

# Run the test suite in the container
echo ""
echo "=== Running Test Suite in Container ==="
docker exec "$CONTAINER_NAME" bash -c "cd /opt/opencode/workspace/projects/shark-agent-v4 && SHARK_CONTAINER=true node dist/index.js 2>&1 || true"

# Copy artifacts out
echo ""
echo "=== Copying Test Results ==="
docker cp "$CONTAINER_NAME:/opt/opencode/artifacts" /home/leviathan/OPENCODE_WORKSPACE/.shark/ 2>/dev/null || echo "No artifacts found"

# Get the test results
echo ""
echo "=== Test Results ==="
docker exec "$CONTAINER_NAME" cat /opt/opencode/artifacts/test-results-*.json 2>/dev/null | head -100 || echo "No test results captured"

# Cleanup
echo ""
echo "=== Cleaning Up Container ==="
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

echo "✓ Container test run complete"