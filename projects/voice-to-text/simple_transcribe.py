#!/usr/bin/env python3
"""
Simple speech transcription using Google Web Speech API (free, online)
Fallback solution since Vosk offline recognition isn't working
"""
import speech_recognition as sr
import sys
import os

def transcribe_audio():
    # Initialize recognizer
    r = sr.Recognizer()
    
    # Use microphone as source
    with sr.Microphone() as source:
        print("Listening... (speak now)")
        # Adjust for ambient noise
        r.adjust_for_ambient_noise(source, duration=0.5)
        
        try:
            # Listen for audio
            audio = r.listen(source, timeout=5, phrase_time_limit=10)
            
            # Try Google Web Speech API (free, requires internet)
            text = r.recognize_google(audio)
            print(f"Transcription: {text}")
            return text
            
        except sr.WaitTimeoutError:
            print("No speech detected")
            return ""
        except sr.UnknownValueError:
            print("Could not understand audio")
            return ""
        except sr.RequestError as e:
            print(f"API error: {e}")
            return ""
        except Exception as e:
            print(f"Error: {e}")
            return ""

if __name__ == "__main__":
    result = transcribe_audio()
    if result:
        sys.stdout.write(result)
        sys.stdout.flush()
