#!/bin/bash
# Shark Agent v4.8.1 Container Build Script
# Builds a carbon-copy container of the ship target environment

set -e

CONTAINER_DIR="/home/leviathan/OPENCODE_WORKSPACE/.shark/container"
IMAGE_NAME="shark-agent-v481-test"
CONTAINER_NAME="shark-v481-sandbox"

echo "=== Building Shark v4.8.1 Test Container ==="
echo "Container directory: $CONTAINER_DIR"

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not found. Cannot build container."
    exit 1
fi

# Build the container
echo "Building Docker image..."
docker build -t "$IMAGE_NAME" -f "$CONTAINER_DIR/Dockerfile" "$CONTAINER_DIR" 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Container image built successfully: $IMAGE_NAME"
    echo ""
    echo "To run tests in container:"
    echo "  docker run -it --name $CONTAINER_NAME $IMAGE_NAME"
    echo ""
    echo "To run with workspace mount (for file access):"
    echo "  docker run -it --name $CONTAINER_NAME -v /home/leviathan/OPENCODE_WORKSPACE:/opt/opencode/workspace $IMAGE_NAME"
else
    echo "ERROR: Container build failed"
    exit 1
fi