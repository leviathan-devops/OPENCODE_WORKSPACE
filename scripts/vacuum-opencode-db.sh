#!/bin/bash
# Database Vacuum Script - Reduces opencode.db from multi-GB to manageable size
# IMPORTANT: Run this when NO opencode sessions are active
# Location: /home/leviathan/OPENCODE_WORKSPACE/scripts/vacuum-opencode-db.sh

set -e

DB_PATH="$HOME/.local/share/opencode/opencode.db"
BACKUP_PATH="$HOME/.local/share/opencode/opencode.db.backup_$(date +%Y%m%d_%H%M%S)"
ARCHIVE_DIR="$HOME/.local/share/opencode/hive-mind/archives"

echo "=== OpenCode Database Vacuum ==="
echo "Date: $(date)"
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at $DB_PATH"
    exit 1
fi

# Check database size
DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
echo "Current database size: $DB_SIZE"

# Check if any opencode processes are running
if pgrep -x "opencode" > /dev/null 2>&1; then
    echo "WARNING: OpenCode is still running!"
    echo "Please close all OpenCode sessions before running vacuum."
    echo "Running processes:"
    pgrep -la opencode | grep -v grep
    exit 1
fi

echo ""
echo "Creating backup..."
cp "$DB_PATH" "$BACKUP_PATH"
echo "Backup saved to: $BACKUP_PATH"

echo ""
echo "Checking for sqlite3..."
if command -v sqlite3 &> /dev/null; then
    echo "sqlite3 found - performing vacuum..."
    
    # Vacuum the database
    sqlite3 "$DB_PATH" "VACUUM;"
    
    echo ""
    echo "Vacuum complete!"
    NEW_SIZE=$(du -h "$DB_PATH" | cut -f1)
    echo "New database size: $NEW_SIZE"
else
    echo "sqlite3 not found - using manual cleanup"
    echo "Install sqlite3 with: sudo apt install sqlite3"
    echo ""
    echo "Alternative: Let OpenCode compact on next startup"
fi

echo ""
echo "=== Archive old sessions ==="
if [ -d "$ARCHIVE_DIR" ]; then
    # Move old hook sessions to archives
    find "$HOME/.local/share/opencode/hive-mind" -maxdepth 1 -type d -name "hook-session-*" -mtime +7 -exec mv {} "$ARCHIVE_DIR/" \; 2>/dev/null || true
    echo "Old sessions archived"
else
    echo "Archive directory not found"
fi

echo ""
echo "=== Done ==="
echo "Backup location: $BACKUP_PATH"
echo ""
echo "To restore from backup if needed:"
echo "  cp $BACKUP_PATH $DB_PATH"
