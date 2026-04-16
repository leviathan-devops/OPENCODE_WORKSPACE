#!/usr/bin/env python3
"""
Real-time Voice Dictation System
Double-press either Ctrl key to start/stop dictation.
Transcribed text types automatically at cursor.

Requirements:
    pip install faster-whisper sounddevice pynput
"""

import sounddevice as sd
import numpy as np
import threading
import time
import sys
import os
import subprocess
import signal
from faster_whisper import WhisperModel

MODEL_SIZE = "small"
AUDIO_DEVICE = 4
SAMPLE_RATE = 16000
CHUNK_DURATION = 3
SILENCE_TIMEOUT = 2.5
DOUBLE_PRESS_WINDOW = 0.5

is_dictating = False
audio_buffer = np.array([], dtype=np.float32)
audio_lock = threading.Lock()
stream_global = None
model_global = None
running = True
hotkey_running = True
last_ctrl_time = 0.0


def type_text(text):
    escaped = (
        text.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("'", "'")
        .replace("`", "\\`")
        .replace("$", "\\$")
    )
    subprocess.run(
        f'xdotool type --clearmodifiers --delay 0 -- "{escaped}"',
        shell=True,
        capture_output=True,
        timeout=3,
    )


def audio_callback(indata, frames, time_info, status):
    global audio_buffer
    if status:
        return
    with audio_lock:
        chunk = indata[:, 0].astype(np.float32)
        if len(audio_buffer) == 0:
            audio_buffer = chunk
        else:
            audio_buffer = np.concatenate([audio_buffer, chunk])


def transcribe_loop():
    global is_dictating, audio_buffer, running, stream_global, model_global

    print("\n[DICTATION ACTIVE] Speak now...")
    print("(Silence 2.5s or double-Ctrl to stop)")
    sys.stdout.flush()

    silence_start = None
    min_audio_samples = SAMPLE_RATE * 1.5

    while is_dictating and running:
        time.sleep(0.05)

        with audio_lock:
            buf_len = len(audio_buffer)

        if buf_len < min_audio_samples:
            continue

        with audio_lock:
            buffer_copy = audio_buffer.copy()

        rms = np.sqrt(np.mean(buffer_copy**2))

        if rms < 0.005:
            silence_start = silence_start or time.time()
            if time.time() - silence_start > SILENCE_TIMEOUT:
                print("\n[Silence timeout]")
                break
        else:
            silence_start = None

        if buf_len >= SAMPLE_RATE * CHUNK_DURATION:
            samples = buffer_copy[-SAMPLE_RATE * CHUNK_DURATION :]

            with audio_lock:
                keep = len(audio_buffer) - len(samples)
                audio_buffer = (
                    audio_buffer[-keep:]
                    if keep > SAMPLE_RATE
                    else np.array([], dtype=np.float32)
                )

            try:
                segments, _ = model_global.transcribe(
                    samples,
                    language="en",
                    task="transcribe",
                    beam_size=5,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                )
                text = "".join(seg.text for seg in segments).strip()
                if text:
                    text = text.strip(" .,!?'\"")
                    if text:
                        print(f"  -> '{text}'", end="", flush=True)
                        type_text(text + " ")
                        sys.stdout.flush()
            except Exception as e:
                print(f"\nError: {e}", file=sys.stderr)

    is_dictating = False
    print("\n[DICTATION STOPPED]")
    sys.stdout.flush()


def toggle_dictation():
    global is_dictating, stream_global, model_global

    if is_dictating:
        is_dictating = False
        print("\n[Stopping dictation]")
    else:
        print("\n[Starting dictation...]")
        is_dictating = True
        t = threading.Thread(target=run_dictation, daemon=True)
        t.start()


def run_dictation():
    global running, stream_global, model_global

    print("=" * 50)
    print(f"Whisper {MODEL_SIZE} on RTX 4080 GPU")

    print("Loading model...")
    sys.stdout.flush()
    model_global = WhisperModel(MODEL_SIZE, device="cuda", compute_type="float16")
    print("Model ready. Starting mic...")
    sys.stdout.flush()

    global audio_buffer
    with audio_lock:
        audio_buffer = np.array([], dtype=np.float32)

    stream_global = sd.InputStream(
        device=AUDIO_DEVICE,
        channels=1,
        samplerate=SAMPLE_RATE,
        callback=audio_callback,
        blocksize=1024,
    )
    stream_global.start()

    try:
        transcribe_loop()
    finally:
        try:
            stream_global.stop()
            stream_global.close()
        except:
            pass
        stream_global = None
        model_global = None


def on_press(key):
    global last_ctrl_time

    try:
        name = key.name
    except AttributeError:
        return

    if name in ("Key.left_ctrl", "Key.right_ctrl"):
        now = time.time()
        dt = now - last_ctrl_time

        if dt < DOUBLE_PRESS_WINDOW:
            print(f"\n*** DOUBLE-CTRL detected (dt={dt:.3f}s) ***")
            sys.stdout.flush()
            toggle_dictation()
            last_ctrl_time = 0
        else:
            last_ctrl_time = now


def main():
    global running, hotkey_running

    print("=" * 50)
    print("VOICE DICTATION SYSTEM")
    print("=" * 50)
    print(f"Model: Whisper {MODEL_SIZE}")
    print(f"Mic: HDA Intel PCH (device 4)")
    print(f"GPU: RTX 4080")
    print()
    print("Double-press either Ctrl key to toggle dictation")
    print()

    from pynput import keyboard

    listener = keyboard.Listener(on_press=on_press, suppress=False)
    listener.start()

    def cleanup(signum, frame):
        global running, hotkey_running
        print("\nShutdown...")
        running = False
        hotkey_running = False
        listener.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        while True:
            time.sleep(0.5)
    except KeyboardInterrupt:
        cleanup(None, None)


if __name__ == "__main__":
    main()
