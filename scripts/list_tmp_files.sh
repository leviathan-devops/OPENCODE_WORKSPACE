#!/bin/bash

# List all files in /tmp and count them

echo "Files in /tmp:"
echo "=============="

# List all files (including hidden)
files=$(ls -la /tmp)
echo "$files"

# Count files (excluding . and ..)
count=$(ls -A /tmp | wc -l)
echo ""
echo "=============="
echo "Total files: $count"
