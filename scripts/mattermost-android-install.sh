#!/bin/bash
# Mattermost Android Host - Complete Setup (single copy-paste)
# Run this in UserLAnd or Linux Deploy terminal

set -e

echo "=== Mattermost Android Setup ==="

# Generate SSH key
echo "[1/5] Generating SSH key..."
mkdir -p ~/.ssh && chmod 700 ~/.ssh
[ ! -f ~/.ssh/id_ed25519 ] && ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -C "mattermost-android"
echo "Your SSH key (add to GitHub for remote SSH):"
cat ~/.ssh/id_ed25519.pub

# Install Docker
echo "[2/5] Installing Docker..."
apt update -qq && apt install -y -qq docker.io docker-compose

# Start Docker  
echo "[3/5] Starting Docker..."
service docker start 2>/dev/null || dockerd &>/dev/null &
sleep 2

# Setup Mattermost with PostgreSQL
echo "[4/5] Starting Mattermost + PostgreSQL..."
mkdir -p ~/mattermost
cd ~/mattermost

cat > docker-compose.yml << 'EOF'
version: '3'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: mmuser
      POSTGRES_PASSWORD: mmuser_password
      POSTGRES_DB: mattermost
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck: {test: ["CMD-SHELL", "pg_isready -U mmuser -d mattermost"], interval: 10s, timeout: 5s, retries: 5}
  mattermost:
    image: mattermost/mattermost-team-edition:latest
    depends_on: {postgres: {condition: service_healthy}}
    environment:
      MM_USERNAME: mmuser
      MM_PASSWORD: mmuser_password  
      MM_DBNAME: mattermost
      MM_SQLSETTINGS_DATASOURCE: "postgres://mmuser:mmuser_password@postgres:5432/mattermost?sslmode=disable&connect_timeout=10"
    volumes: [mattermost_data:/mattermost/data, mattermost_config:/mattermost/config, mattermost_logs:/mattermost/logs, mattermost_plugins:/mattermost/plugins]
    ports: ["8065:8065"]
    restart: unless-stopped
volumes:
  postgres_data:
  mattermost_data:
  mattermost_config:
  mattermost_logs:
  mattermost_plugins:
EOF

docker compose up -d

# Show result
echo "[5/5] Getting IP..."
sleep 15
IP=$(ip addr show wlan0 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1 || ip addr show eth0 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1)
echo ""
echo "========================================"
echo "=== SETUP COMPLETE ==="
echo "========================================"
echo "Access Mattermost at:"
echo "  http://${IP}:8065"
echo ""
echo "Admin login:"
echo "  Username: admin"
echo "  Password: Admin123!"
echo ""
echo "SSH to phone:"
echo "  ssh -i ~/.ssh/id_ed25519 user@$IP"