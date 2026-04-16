#!/bin/bash
# Start auto-context update script as background process

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/auto-context.log"

echo "Starting auto-context background process..." | tee -a "$LOG_FILE"

# Check if already running
if pgrep -f "auto-context-update.js" > /dev/null; then
    echo "Auto-context process is already running" | tee -a "$LOG_FILE"
    exit 0
fi

# Start the process
cd "$SCRIPT_DIR"
nohup bun run auto-context-update.js >> "$LOG_FILE" 2>&1 &
PID=$!

echo "Auto-context process started with PID: $PID" | tee -a "$LOG_FILE"
echo "Logs: $LOG_FILE" | tee -a "$LOG_FILE"
echo "To stop: pkill -f 'auto-context-update.js'" | tee -a "$LOG_FILE"

# Save PID to file
echo "$PID" > "$SCRIPT_DIR/auto-context.pid"