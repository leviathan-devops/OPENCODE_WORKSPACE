#!/bin/bash
# Start voice-to-text in background
cd /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text
nohup ./voice-to-text > voice-to-text.log 2>&1 &
echo $! > voice-to-text.pid
echo "Voice-to-text started with PID $(cat voice-to-text.pid)"
echo "Logs: tail -f voice-to-text.log"