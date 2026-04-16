#!/bin/bash
# API Usage Alert Script
ALERT_EMAIL=""
LOG_FILE="/home/leviathan/OPENCODE_WORKSPACE/api_usage.log"
MAX_DAILY_REQUESTS=1000
MAX_HOURLY_REQUESTS=100

# Log current usage
DATE=$(date +"%Y-%m-%d %H:%M:%S")
CONNECTIONS=$(ss -tunap | grep -c "3.173.21.63")

echo "$DATE - API Connections: $CONNECTIONS" >> "$LOG_FILE"

# Check thresholds
if [ "$CONNECTIONS" -gt 10 ]; then
    echo "WARNING: High API connections detected: $CONNECTIONS" >> "$LOG_FILE"
    # Could add email notification here
fi

# Check for excessive processes
QWEN_COUNT=$(ps aux | grep -c "[q]wen")
if [ "$QWEN_COUNT" -gt 2 ]; then
    echo "WARNING: Excessive qwen processes: $QWEN_COUNT" >> "$LOG_FILE"
fi

# Weekly report
if [ $(date +%u) -eq 1 ] && [ $(date +%H) -eq 9 ]; then
    echo "=== Weekly API Usage Report ===" >> "$LOG_FILE"
    tail -100 "$LOG_FILE" | grep "API Connections" | awk '{sum+=$NF} END {print "Total connections: " sum}' >> "$LOG_FILE"
fi
