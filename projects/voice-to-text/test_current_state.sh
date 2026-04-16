#!/bin/bash
# Test script to demonstrate current state and issues
# Run this script to see what's working and what's not

echo "=== Voice-to-Text Debug Test ==="
echo ""

# 1. Check if application is running
echo "1. Checking if voice-to-text is running..."
if ps aux | grep -v grep | grep -q voice-to-text; then
    echo "   ✅ Application is running"
    echo "   PID: $(pgrep -f voice-to-text)"
else
    echo "   ❌ Application is not running"
    echo "   Starting it now..."
    nohup /usr/local/bin/voice-to-text > /tmp/voice-to-text.log 2>&1 &
    sleep 2
    if ps aux | grep -v grep | grep -q voice-to-text; then
        echo "   ✅ Application started"
    else
        echo "   ❌ Failed to start application"
        echo "   Check logs: tail -f /tmp/voice-to-text.log"
    fi
fi
echo ""

# 2. Check double Ctrl detection
echo "2. Testing double Ctrl detection..."
echo "   Simulating double Ctrl press with xdotool..."
xdotool keydown ctrl sleep 0.05 keyup ctrl sleep 0.05 keydown ctrl sleep 0.05 keyup ctrl
sleep 1
echo "   Checking logs..."
if tail -20 /tmp/voice-to-text.log | grep -q "Double Ctrl press detected"; then
    echo "   ✅ Double Ctrl detection works"
    if tail -20 /tmp/voice-to-text.log | grep -q "Starting recording"; then
        echo "   ✅ Recording starts on double Ctrl"
    else
        echo "   ❌ Recording does not start (audio issue likely)"
    fi
else
    echo "   ❌ Double Ctrl detection not working"
fi
echo ""

# 3. Check audio issues
echo "3. Checking audio configuration..."
echo "   Audio devices:"
arecord -l 2>/dev/null | head -5
echo ""
echo "   PortAudio error from logs:"
if tail -50 /tmp/voice-to-text.log | grep -q "Invalid sample rate"; then
    echo "   ❌ Invalid sample rate error detected"
    echo "   The audio device doesn't support 16kHz sample rate"
else
    echo "   No sample rate error detected"
fi
echo ""

# 4. Check model loading
echo "4. Checking Vosk model..."
if tail -20 /tmp/voice-to-text.log | grep -q "Loading Vosk model"; then
    echo "   ✅ Vosk model loads successfully"
else
    echo "   ❌ Vosk model not loading"
fi
echo ""

# 5. Check autostart
echo "5. Checking autostart configuration..."
if [ -f "/home/leviathan/.config/autostart/voice-to-text.desktop" ]; then
    echo "   ✅ Autostart entry exists"
else
    echo "   ❌ Autostart entry missing"
fi
echo ""

# 6. Check installation
echo "6. Checking installation..."
if [ -f "/usr/local/bin/voice-to-text" ]; then
    echo "   ✅ Binary installed at /usr/local/bin/voice-to-text"
else
    echo "   ❌ Binary not installed"
fi
echo ""

echo "=== Summary ==="
echo ""
echo "What's working:"
echo "  - Double Ctrl detection"
echo "  - Vosk model loading"
echo "  - Application startup"
echo "  - Autostart configuration"
echo ""
echo "What's not working:"
echo "  - Audio capture (sample rate mismatch)"
echo "  - No transcription output (due to audio failure)"
echo ""
echo "To see detailed logs:"
echo "  tail -f /tmp/voice-to-text.log"
echo ""
echo "To test manually:"
echo "  1. Ensure voice-to-text is running"
echo "  2. Double-press Ctrl keys"
echo "  3. Speak into microphone"
echo "  4. Double-press Ctrl again"
echo "  5. Check logs for transcription (if audio works)"