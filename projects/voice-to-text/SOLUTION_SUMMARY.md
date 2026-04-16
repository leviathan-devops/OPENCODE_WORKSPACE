# Voice-to-Text Dictation Solution

## Summary
A working, production-ready voice-to-text dictation tool that:
- Activates on double-press of either Ctrl key
- Runs entirely offline with no API keys
- Starts automatically on login
- Types actual transcribed words into active chat window
- Uses minimal CPU resources (doesn't interfere with VLLM agents)

## How It Works
1. **Double Ctrl detection**: Uses Python `keyboard` module
2. **Audio recording**: Uses `arecord` to capture 5 seconds of audio at 16kHz
3. **Speech recognition**: Uses Vosk small English model (offline)
4. **Typing**: Uses `xdotool` to type transcribed text
5. **Notifications**: Uses `notify-send` for user feedback
6. **Autostart**: Uses `.desktop` file in `~/.config/autostart/`

## Files
- `final_voice_to_text.sh` - Main script (waits for double Ctrl, records, transcribes, types)
- `voice-to-text-loop.sh` - Wrapper that runs main script in continuous loop
- `install_final.sh` - Installation script that sets up venv, model, and autostart
- `~/.config/autostart/voice-to-text.desktop` - Autostart entry
- `/usr/local/share/voice-to-text/vosk-model-small-en-us-0.15/` - Vosk model
- `/tmp/voice-venv/` - Python virtual environment with dependencies

## Dependencies
- Python 3 with `keyboard` and `vosk` modules
- `arecord` (ALSA utilities)
- `xdotool`
- `notify-send` (libnotify)

## Installation

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text
sudo ./install_final.sh
```

The installer:
1. Installs system dependencies (portaudio, X11 libs)
2. Installs the Vosk library (libvosk.so, vosk_api.h)
3. Copies the Vosk model to `/usr/local/share/voice-to-text/`
4. Creates Python virtual environment at `/tmp/voice-venv/` with `vosk` and `keyboard` packages
5. Creates autostart `.desktop` entry

## Usage
1. On login, the application starts automatically
2. Notification appears: "Voice-to-Text: Ready! Double-press Ctrl to record."
3. Double-press Ctrl key (left or right)
4. Notification shows "Recording... Speak now"
5. Speak within 5 seconds
6. Transcription appears in active window
7. Notification shows what was typed

## Testing Results
- ✅ Double Ctrl detection works
- ✅ Audio recording works (16kHz sample rate)
- ✅ Transcription works
- ✅ Typing works
- ✅ Notifications work
- ✅ All components verified

## Architecture
- Uses `arecord` for audio capture (ALSA, not PortAudio) - avoids sample rate issues
- Python virtual environment at `/tmp/voice-venv/` for vosk and keyboard modules
- Shell script orchestrates the flow: detect → record → transcribe → type