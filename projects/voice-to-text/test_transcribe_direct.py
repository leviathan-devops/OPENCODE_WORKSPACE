import json
import wave
from vosk import Model, KaldiRecognizer
import sys

# First record some audio
import subprocess
print("Recording 3 seconds of audio...", file=sys.stderr)
subprocess.run(["arecord", "-d", "3", "-f", "cd", "-r", "16000", "-c", "1", "/tmp/test.wav"], 
               capture_output=True)

print("Loading model...", file=sys.stderr)
model = Model("/usr/local/share/voice-to-text/vosk-model-small-en-us-0.15")
print("Model loaded", file=sys.stderr)

wf = wave.open("/tmp/test.wav", "rb")
print(f"Audio file: channels={wf.getnchannels()}, rate={wf.getframerate()}", file=sys.stderr)

rec = KaldiRecognizer(model, wf.getframerate())

text_parts = []
while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break
    if rec.AcceptWaveform(data):
        result = json.loads(rec.Result())
        print(f"Result: {result}", file=sys.stderr)
        if 'text' in result and result['text']:
            text_parts.append(result['text'])

result = json.loads(rec.FinalResult())
print(f"Final: {result}", file=sys.stderr)
if 'text' in result and result['text']:
    text_parts.append(result['text'])

full_text = ' '.join(text_parts).strip()
if full_text:
    print(full_text)
else:
    print("(no speech detected)")
