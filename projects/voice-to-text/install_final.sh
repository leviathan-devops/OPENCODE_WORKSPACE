#!/bin/bash
set -e

echo "Installing Voice-to-Text Dictation Tool..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root: sudo $0"
  exit 1
fi

# Get the actual user who ran sudo
REAL_USER=${SUDO_USER:-$USER}
REAL_HOME=$(eval echo ~$REAL_USER)

# Install system dependencies
echo "Installing system dependencies..."
apt-get update
apt-get install -y portaudio19-dev libportaudiocpp0 libx11-dev libxtst-dev libx11-xcb-dev libxkbcommon-dev libxkbcommon-x11-dev libxkbfile-dev libxinerama-dev

# Install Vosk library
echo "Installing Vosk library..."
cd /tmp
wget -q https://github.com/alphacep/vosk-api/releases/download/v0.3.45/vosk-linux-x86_64-0.3.45.zip -O vosk.zip
unzip -q -o vosk.zip
cp vosk-linux-x86_64-0.3.45/vosk_api.h /usr/local/include/
cp vosk-linux-x86_64-0.3.45/libvosk.so /usr/local/lib/
ldconfig

# Create Python virtual environment with vosk and keyboard
echo "Creating Python virtual environment..."
mkdir -p /tmp/voice-venv
python3 -m venv /tmp/voice-venv
/tmp/voice-venv/bin/pip install --quiet vosk keyboard

# Copy application
echo "Installing application..."
cp /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text/voice-to-text /usr/local/bin/
chmod +x /usr/local/bin/voice-to-text

# Copy model
echo "Installing Vosk model..."
mkdir -p /usr/local/share/voice-to-text
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text/vosk-model-small-en-us-0.15 /usr/local/share/voice-to-text/

# Create desktop autostart entry
echo "Creating autostart entry..."
mkdir -p $REAL_HOME/.config/autostart
cat > $REAL_HOME/.config/autostart/voice-to-text.desktop << EOF
[Desktop Entry]
Type=Application
Name=Voice-to-Text Dictation
Exec=bash -c "cd /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text && /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text/final_voice_to_text.sh"
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Voice-to-Text Dictation with double Ctrl activation
EOF

chown -R $REAL_USER:$REAL_USER $REAL_HOME/.config/autostart

echo ""
echo "✅ Installation complete!"
echo "Voice-to-Text will start automatically on next login."
echo "To start now, log out and log back in, or run:"
echo "  sudo -u $REAL_USER /usr/local/bin/voice-to-text &"
echo ""
echo "Double-press Ctrl key to start/stop dictation."