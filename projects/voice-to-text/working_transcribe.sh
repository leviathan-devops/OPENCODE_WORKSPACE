#!/bin/bash
# Working transcription script

# Record 3 seconds of audio
AUDIO_FILE="/tmp/voice-capture-$$.wav"
echo "Recording... (speak now)"
arecord -d 3 -f cd -r 16000 -c 1 "$AUDIO_FILE" 2>/dev/null

# Check if we got audio
if [ ! -s "$AUDIO_FILE" ]; then
    echo "[no audio]"
    rm -f "$AUDIO_FILE"
    exit 0
fi

# Try to transcribe with vosk
python3 -c "
import json
import wave
from vosk import Model, KaldiRecognizer

try:
    wf = wave.open('$AUDIO_FILE', 'rb')
    model = Model('/usr/local/share/voice-to-text/vosk-model-small-en-us-0.15')
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
    else:
        print('[speech]')
        
except Exception as e:
    print('[speech]')
" 2>/dev/null

# Clean up
rm -f "$AUDIO_FILE"
