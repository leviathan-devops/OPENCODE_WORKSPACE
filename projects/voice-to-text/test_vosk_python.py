import json
import sys
from vosk import Model, KaldiRecognizer
import wave

audio_file = "/tmp/test-record.wav"
model_path = "/usr/local/share/voice-to-text/vosk-model-small-en-us-0.15"

# First record some audio
import subprocess
print("Recording audio...")
subprocess.run(["arecord", "-d", "3", "-f", "cd", "-r", "16000", audio_file], check=True)

print(f"Model path: {model_path}")
print(f"Audio file: {audio_file}")

try:
    wf = wave.open(audio_file, "rb")
    print(f"Audio: channels={wf.getnchannels()}, sampwidth={wf.getsampwidth()}, rate={wf.getframerate()}")
    
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() not in (8000, 16000, 32000, 48000):
        print("Audio file must be WAV format mono PCM.")
        sys.exit(1)
    
    print("Loading model...")
    model = Model(model_path)
    print("Model loaded")
    
    rec = KaldiRecognizer(model, wf.getframerate())
    print("Recognizer created")
    
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            print(f"Result: {result}")
            if 'text' in result:
                print(f"Text: {result['text']}")
                break
        else:
            partial = json.loads(rec.PartialResult())
            if 'partial' in partial and partial['partial']:
                print(f"Partial: {partial['partial']}", end='\r')
    
    # Final result
    result = json.loads(rec.FinalResult())
    print(f"Final result: {result}")
    if 'text' in result and result['text']:
        print(f"Final text: {result['text']}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
