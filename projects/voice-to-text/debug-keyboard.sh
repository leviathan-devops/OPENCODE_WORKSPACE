#!/bin/bash
# Debug script for voice-to-text keyboard issues

echo "=== Voice-to-Text Keyboard Debug ==="
echo ""

# Kill any existing voice-to-text processes
echo "1. Stopping any existing voice-to-text processes..."
pkill -f voice-to-text 2>/dev/null
sleep 1

# Start voice-to-text in background
echo "2. Starting voice-to-text application..."
DISPLAY=:0 nohup /usr/local/bin/voice-to-text > /tmp/voice-debug-run.log 2>&1 &
sleep 2

# Check if it's running
if ps aux | grep -v grep | grep -q voice-to-text; then
    echo "   ✅ Application started successfully"
    echo "   PID: $(pgrep -f voice-to-text)"
else
    echo "   ❌ Failed to start application"
    echo "   Check /tmp/voice-debug-run.log for errors"
    exit 1
fi

echo ""
echo "3. Testing keyboard detection..."
echo "   Press any key on your keyboard (try 'A' key first)"
echo "   Then check the keycode file:"
echo "   cat /tmp/voice-to-text-keypress.log"
echo ""
echo "   Expected output for 'A' key: [TIME] keycode=30 rawcode=97"
echo ""
echo "4. Testing Ctrl key detection..."
echo "   Press Ctrl key (left or right) once"
echo "   Check the keycode file again:"
echo "   cat /tmp/voice-to-text-keypress.log"
echo ""
echo "   If Ctrl is detected, you'll see rawcode around 65507"
echo "   If nothing appears, the application isn't receiving keyboard events"
echo ""
echo "5. Testing double-Ctrl activation..."
echo "   Press Ctrl twice quickly (within 0.5 seconds)"
echo "   Check logs for recording start:"
echo "   tail -f /tmp/voice-debug-run.log"
echo ""
echo "   Expected: 'Double Ctrl press detected!' and 'Starting recording...'"
echo ""
echo "=== Troubleshooting ==="
echo ""
echo "If no key presses appear in /tmp/voice-to-text-keypress.log:"
echo "  - Make sure you're on X11 (not Wayland): echo \$XDG_SESSION_TYPE"
echo "  - Check DISPLAY environment: echo \$DISPLAY (should be :0)"
echo "  - Application might need X11 permissions"
echo "  - Try running as current user in terminal:"
echo "    DISPLAY=:0 /usr/local/bin/voice-to-text"
echo ""
echo "If Ctrl shows different rawcode than 65507:"
echo "  - Update /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text/keyboard.go"
echo "  - Add your rawcode to ctrlRawcodes map"
echo "  - Rebuild with: cd /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text && go build"
echo "  - Restart application"
echo ""
echo "If double-Ctrl doesn't trigger recording:"
echo "  - Press faster (within 0.5 seconds)"
echo "  - Check timing in logs: grep 'Time since' /tmp/voice-debug-run.log"
echo "  - Try different Ctrl key (left vs right)"
echo ""
echo "Log files:"
echo "  - Application log: /tmp/voice-debug-run.log"
echo "  - Keypress status: /tmp/voice-to-text-keypress.log"
echo "  - Notification status: /tmp/voice-to-text-status.log"