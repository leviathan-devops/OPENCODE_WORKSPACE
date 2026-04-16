#!/bin/bash
# SHARK Agent Deployment Script
# Simple, reliable deployment

set -e

echo "🦈 Deploying SHARK Agent..."

# Create directory
mkdir -p /home/leviathan/shark
cd /home/leviathan/shark

# Make scripts executable
chmod +x shark_final.py

# Create systemd service
sudo tee /etc/systemd/system/shark-agent.service > /dev/null <<EOF
[Unit]
Description=SHARK AI Agent
After=network.target
Wants=network.target

[Service]
Type=simple
User=leviathan
Group=leviathan
WorkingDirectory=/home/leviathan/shark
ExecStart=/usr/bin/python3 /home/leviathan/shark/shark_final.py
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

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable shark-agent.service
sudo systemctl start shark-agent.service

echo "✅ SHARK Agent deployed!"
echo ""
echo "📋 Commands:"
echo "  sudo systemctl status shark-agent    # Check status"
echo "  sudo journalctl -u shark-agent -f    # View logs"
echo "  sudo systemctl restart shark-agent   # Restart"
echo "  sudo systemctl stop shark-agent      # Stop"
echo ""
echo "🦈 SHARK is now running as a system service!"

# Test the service
sleep 2
echo ""
echo "🔍 Testing service..."
sudo systemctl status shark-agent --no-pager