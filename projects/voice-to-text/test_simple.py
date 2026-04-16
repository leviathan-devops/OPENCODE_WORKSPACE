import subprocess
import sys

# Record audio in mono
print("Recording audio (say something)...")
result = subprocess.run(["arecord", "-d", "3", "-f", "cd", "-r", "16000", "-c", "1", "/tmp/test-mono.wav"], 
                       capture_output=True, text=True)
print(f"arecord stdout: {result.stdout}")
print(f"arecord stderr: {result.stderr}")
print(f"arecord returncode: {result.returncode}")

# Check file
import os
print(f"File exists: {os.path.exists('/tmp/test-mono.wav')}")
print(f"File size: {os.path.getsize('/tmp/test-mono.wav') if os.path.exists('/tmp/test-mono.wav') else 0} bytes")
