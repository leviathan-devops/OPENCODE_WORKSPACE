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

# Copy application
echo "Installing application..."
cp /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text/voice-to-text /usr/local/bin/
chmod +x /usr/local/bin/voice-to-text

# Copy model
echo "Installing Vosk model..."
mkdir -p /usr/local/share/voice-to-text
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/voice-to-text/vosk-model-small-en-us-0.15 /usr/local/share/voice-to-text/

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/voice-to-text.service << EOF
[Unit]
Description=Voice-to-Text Dictation Service
After=sound.target

[Service]
Type=simple
User=$REAL_USER
Environment=DISPLAY=:0
Environment=XAUTHORITY=/run/user/1000/gdm/Xauthority
WorkingDirectory=/usr/local/share/voice-to-text
ExecStart=/usr/local/bin/voice-to-text
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "Enabling and starting service..."
systemctl daemon-reload
systemctl enable voice-to-text.service
systemctl start voice-to-text.service

echo ""
echo "✅ Installation complete!"
echo "Voice-to-Text is now running in the background."
echo "Double-press Ctrl key to start/stop dictation."
echo ""
echo "Check status: systemctl status voice-to-text"
echo "View logs: journalctl -u voice-to-text -f"