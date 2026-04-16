#!/bin/bash
# Hive Mind Startup Script - Launches OpenViking server for shared context

set -e

OPENVIKING_DIR="/home/leviathan/OPENCODE_WORKSPACE/projects/OpenViking"
OPENVIKING_CONF="$HOME/.openviking/ov.conf"
OPENVIKING_LOG="$HOME/OPENCODE_WORKSPACE/projects/hive-mind/openviking-server.log"
PID_FILE="$HOME/.openviking/openviking.pid"

# Check if already running
if curl -s http://localhost:1933/health > /dev/null 2>&1; then
    echo "OpenViking server already running"
    exit 0
fi

# Kill any stale processes
if [ -f "$PID_FILE" ]; then
    kill $(cat "$PID_FILE") 2>/dev/null || true
    rm -f "$PID_FILE"
fi

# Activate venv and start server
cd "$OPENVIKING_DIR"
source .venv/bin/activate

nohup openviking-server --config "$OPENVIKING_CONF" > "$OPENVIKING_LOG" 2>&1 &
echo $! > "$PID_FILE"

# Wait for server to be ready
for i in {1..30}; do
    if curl -s http://localhost:1933/health > /dev/null 2>&1; then
        echo "OpenViking server started successfully"
        exit 0
    fi
    sleep 1
done

echo "Failed to start OpenViking server. Check log: $OPENVIKING_LOG"
exit 1
