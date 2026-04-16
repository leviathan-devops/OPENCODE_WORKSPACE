#!/bin/bash
# Shark Cloud - Local Development Setup

set -e

echo "🦈 Shark Cloud Local Setup"
echo "=========================="

# Check for MINIMAX_API_KEY
if [ -z "$MINIMAX_API_KEY" ]; then
    echo "Error: MINIMAX_API_KEY not set"
    echo "Run: export MINIMAX_API_KEY=sk-xxx"
    exit 1
fi

# Build the image
echo "Building Docker image..."
docker build -t shark-cloud:latest -f Dockerfile ..

# Run with docker-compose
echo "Starting Shark Cloud..."
MINIMAX_API_KEY=$MINIMAX_API_KEY \
DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN:-""} \
docker-compose up -d

# Wait for health
echo "Waiting for service to be healthy..."
sleep 10

# Check health
curl -s http://localhost:3000/health | jq .

echo ""
echo "Shark Cloud is running!"
echo "API: http://localhost:3000"
echo "Health: http://localhost:3000/health"
echo ""
echo "Test with:"
echo '  curl -X POST http://localhost:3000/delegate -H "Content-Type: application/json" -d '\''{"task": "write a hello world in node.js", "userId": "test"}\'''
