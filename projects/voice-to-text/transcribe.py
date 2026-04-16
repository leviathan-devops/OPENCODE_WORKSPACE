#!/usr/bin/env python3
import speech_recognition as sr
import sys
import os

def main():
    r = sr.Recognizer()
    
    # List available microphones
    print("Available microphones:", file=sys.stderr)
    for i, mic in enumerate(sr.Microphone.list_microphone_names()):
        print(f"  {i}: {mic}", file=sys.stderr)
    
    # Use default microphone
    with sr.Microphone() as source:
        print("Adjusting for noise...", file=sys.stderr)
        r.adjust_for_ambient_noise(source, duration=1)
        print("Listening... (speak now)", file=sys.stderr)
        
        try:
            # Listen with longer timeout
            audio = r.listen(source, timeout=8, phrase_time_limit=15)
            print("Processing...", file=sys.stderr)
            
            # Try Google Web Speech API
            text = r.recognize_google(audio)
            print(text)
            return 0
            
        except sr.WaitTimeoutError:
            print("No speech detected", file=sys.stderr)
            return 1
        except sr.UnknownValueError:
            print("Could not understand audio", file=sys.stderr)
            return 1
        except sr.RequestError as e:
            print(f"API error: {e}", file=sys.stderr)
            return 1
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            return 1

if __name__ == "__main__":
    sys.exit(main())
