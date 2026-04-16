#!/bin/bash
# Container Cleanup Script
# Removes stale/finished containers to prevent bloat

set -e

echo "=== Container Cleanup ==="
echo ""

# List current containers
echo "Current containers:"
docker ps -a --format "  {{.Names}} ({{.Status}}) ({{.Image}})"
echo ""

# Find and remove dead containers
DEAD=$(docker ps -a --format '{{.Names}}' -f "status=exited" -f "status=dead" -f "status=created")
if [ -n "$DEAD" ]; then
    echo "Removing dead containers..."
    echo "$DEAD" | xargs -r docker rm -v 2>/dev/null
    echo "Done."
else
    echo "No dead containers found."
fi

# Find containers older than 7 days that are not running
OLD_STALE=$(docker ps -a --format '{{.Names}}' -f "status=running" --since "336h" 2>/dev/null | head -20)
if [ -n "$OLD_STALE" ]; then
    echo ""
    echo "Containers running > 7 days (may need cleanup):"
    echo "$OLD_STALE" | while read c; do echo "  $c"; done
else
    echo "No long-running containers found."
fi

# Remove containers with "test" or "temp" in name that are stopped
TEMP_STOPPED=$(docker ps -a --format '{{.Names}}' -f "status=exited" | grep -iE "(test|temp|debug)" | head -20)
if [ -n "$TEMP_STOPPED" ]; then
    echo ""
    echo "Removing test/temp containers..."
    echo "$TEMP_STOPPED" | xargs -r docker rm -v 2>/dev/null
    echo "Done."
else
    echo "No test/temp containers found."
fi

# Prune system
echo ""
echo "Running system prune..."
docker system prune -f --volumes 2>/dev/null || true

echo ""
echo "=== Final Status ==="
docker ps -a --format "{{.Names}} ({{.Status}})" | head -20
echo ""
echo "Total containers: $(docker ps -a | wc -l | xargs)"
echo ""
echo "Container cleanup complete."