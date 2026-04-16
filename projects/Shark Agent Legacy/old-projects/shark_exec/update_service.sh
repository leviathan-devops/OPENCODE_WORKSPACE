#!/bin/bash
# Update SHARK service to use daemon

set -e

echo "🦈 Updating SHARK service to daemon mode..."

# Update systemd service
sudo tee /etc/systemd/system/shark-agent.service > /dev/null <<EOF
[Unit]
Description=SHARK AI Agent Daemon
After=network.target
Wants=network.target

[Service]
Type=simple
User=leviathan
Group=leviathan
WorkingDirectory=/home/leviathan/shark
ExecStart=/usr/bin/python3 /home/leviathan/shark/shark_daemon.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=shark-agent
Environment=PYTHONUNBUFFERED=1

# Security
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

[Install]
WantedBy=multi-user.target
EOF

# Make daemon executable
chmod +x shark_daemon.py

# Create command file
touch /home/leviathan/shark/commands.txt
chmod 666 /home/leviathan/shark/commands.txt

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart shark-agent

echo "✅ SHARK Daemon updated!"
echo ""
echo "📋 Usage:"
echo "  # Add commands to execute (one per line)"
echo "  echo 'df -h' >> /home/leviathan/shark/commands.txt"
echo "  echo 'free -m' >> /home/leviathan/shark/commands.txt"
echo ""
echo "  # View logs"
echo "  sudo journalctl -u shark-agent -f"
echo ""
echo "  # Check status"
echo "  sudo systemctl status shark-agent"

# Show current status
sleep 2
echo ""
echo "🔍 Current status:"
sudo systemctl status shark-agent --no-pager