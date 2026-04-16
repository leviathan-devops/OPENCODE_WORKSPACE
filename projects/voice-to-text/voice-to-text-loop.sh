#!/bin/bash
# Voice-to-Text that runs in a loop

echo "Voice-to-Text started. Double-press Ctrl to record."
notify-send "Voice-to-Text" "Ready! Double-press Ctrl to record."

while true; do
    # Run the final script (which waits for double Ctrl, records, transcribes)
    /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text/final_voice_to_text.sh
    
    # Brief pause to avoid tight loop if script exits unexpectedly
    sleep 0.5
done