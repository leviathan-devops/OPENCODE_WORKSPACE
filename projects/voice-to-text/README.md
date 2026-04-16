# Voice-to-Text Dictation Tool

A lightweight, offline voice-to-text application that enables dictation with a simple keyboard shortcut. Uses Vosk for speech recognition, PortAudio for audio capture, and runs completely on device without any API keys or internet connection.

## Features

- **Privacy-focused**: All processing happens locally on your device
- **No API keys or signups required**: Completely offline operation
- **Low resource usage**: CPU-only processing (no GPU/VRAM usage)
- **Accurate transcription**: Uses Vosk's small English model with low hallucination rate
- **Easy activation**: Press ENTER key to start/stop recording
- **Real-time feedback**: Shows partial transcriptions as you speak

## Requirements

- Go 1.24 or higher
- Vosk small English model (download instructions below)
- Working microphone

## Setup

### 1. Download Vosk Model

The application uses the Vosk small English model for accurate, low-hallucination speech recognition.

```bash
# Go to the voice-to-text directory
cd voice-to-text

# Download the Vosk small English model
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip

# Extract the model
unzip vosk-model-small-en-us-0.15.zip

# The model will be extracted to a folder named 'vosk-model-small-en-us-0.15'
```

### 2. Install System Dependencies

On Ubuntu/Debian:
```bash
# Install PortAudio development libraries
sudo apt-get update
sudo apt-get install portaudio19-dev libportaudiocpp0

# Install Vosk library
# Download the Vosk library from https://github.com/alphacep/vosk-api/releases
# Extract and copy the header and library files to system directories
```

### 3. Build the Application

```bash
# Build the application
go build -o voice-to-text main.go
```

### 4. Run the Application

```bash
# Run the application
./voice-to-text
```

## Usage

1. Start the application: `./voice-to-text`
2. The application will load the Vosk model and wait for input
3. Press **ENTER** to start recording (you'll see "Starting recording (speak now)...")
4. Speak clearly into your microphone
5. Press **ENTER** again to stop recording and see the transcription
6. The transcription will be displayed in the terminal
7. Press **Ctrl+C** to exit the application

## How It Works

- Uses PortAudio to capture audio from your default microphone
- Uses Vosk for offline speech recognition with the small English model
- The Vosk model is approximately 50MB and provides accurate transcription with low hallucination rate
- No data leaves your machine - completely private and offline

## Resource Usage

- **CPU**: Minimal usage during idle, moderate during speech processing
- **Memory**: ~150-200MB RAM (Vosk model + application overhead)
- **GPU/VRAM**: None - purely CPU-based processing
- **Storage**: ~50MB for the Vosk model

## Customization

### Changing the Activation Key

To change the activation key, modify the `activationKey` constant in main.go:
```go
activationKey = "ctrl+space"  // Change to your preferred key
```

### Using Different Models

To use a different Vosk model:
1. Download the desired model from https://alphacephei.com/vosk/models
2. Extract it and update the `modelPath` constant in main.go:
```go
modelPath = "path/to/your/model"
```

## Future Enhancements

- **Double Ctrl key activation**: Implementation in progress using global keyboard hooks
- **Continuous listening mode**: Optional mode for longer dictation sessions
- **Clipboard integration**: Copy transcriptions directly to clipboard
- **File output**: Save transcriptions to text files

## Troubleshooting

### "Failed to load Vosk model" Error

Ensure you've downloaded and extracted the Vosk model correctly in the application directory.

### Audio Issues

Make sure your microphone is working and selected as the default input device in your system settings.

### Build Errors

Make sure you have the PortAudio development libraries installed and the Vosk library files (vosk_api.h and libvosk.so) in your system paths.

## License

MIT License - feel free to modify and distribute as needed.