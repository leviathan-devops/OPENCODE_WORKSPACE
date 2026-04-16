#!/bin/bash
# Simple voice-to-text that actually works

LOCKFILE="/tmp/voice-to-text.lock"
if [ -f "$LOCKFILE" ]; then
    echo "Already running"
    exit 1
fi
touch "$LOCKFILE"
trap "rm -f $LOCKFILE" EXIT

# Wait for double Ctrl press
echo "Waiting for double Ctrl press..."
python3 -c "
import keyboard
import time

last_press = 0
while True:
    if keyboard.is_pressed('ctrl'):
        current_time = time.time()
        if current_time - last_press < 0.5:
            print('DOUBLE_PRESS')
            break
        last_press = current_time
        time.sleep(0.1)  # Debounce
    time.sleep(0.01)
" 2>/dev/null || {
    # Fallback if python keyboard doesn't work
    read -n 1
}

echo "Recording... (speak now)"
AUDIO_FILE="/tmp/voice-$$.wav"
arecord -d 5 -f cd -r 16000 -c 1 "$AUDIO_FILE" 2>/dev/null

echo "Transcribing..."
/tmp/voice-venv/bin/python -c "
import json
import wave
from vosk import Model, KaldiRecognizer
import sys

model = Model('/usr/local/share/voice-to-text/vosk-model-small-en-us-0.15')
wf = wave.open('$AUDIO_FILE', 'rb')
rec = KaldiRecognizer(model, wf.getframerate())

text_parts = []
while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break
    if rec.AcceptWaveform(data):
        result = json.loads(rec.Result())
        if 'text' in result and result['text']:
            text_parts.append(result['text'])

result = json.loads(rec.FinalResult())
if 'text' in result and result['text']:
    text_parts.append(result['text'])

full_text = ' '.join(text_parts).strip()
if full_text:
    print(full_text)
" 2>/dev/null | while read -r text; do
    if [ -n "$text" ]; then
        echo "Typing: $text"
        xdotool type --clearmodifiers "$text "
    fi
done

rm -f "$AUDIO_FILE"
