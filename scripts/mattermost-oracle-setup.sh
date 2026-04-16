#!/bin/bash
# Mattermost Oracle Cloud Setup Script
# Run this AFTER you've created your Oracle Cloud VM

set -e

echo "=== Mattermost Oracle Cloud Setup ==="
echo "This script will install Docker and Mattermost on your Oracle Cloud VM"
echo ""

# Update and install Docker
echo "[1/4] Updating system..."
sudo apt update && sudo apt upgrade -y

echo "[2/4] Installing Docker..."
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

echo "[3/4] Installing Mattermost..."
mkdir -p ~/mattermost-server
cd ~/mattermost-server

cat > docker-compose.yml << 'EOF'
services:
  postgres:
    image: postgres:15-alpine
    container_name: mattermost-postgres
    environment:
      POSTGRES_USER: mmuser
      POSTGRES_PASSWORD: mmuser_password
      POSTGRES_DB: mattermost
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - mattermost-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mmuser -d mattermost"]
      interval: 10s
      timeout: 5s
      retries: 5

  mattermost:
    image: mattermost/mattermost-team-edition:latest
    container_name: mattermost-app
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      MM_USERNAME: mmuser
      MM_PASSWORD: mmuser_password
      MM_DBNAME: mattermost
      MM_SQLSETTINGS_DATASOURCE: postgres://mmuser:mmuser_password@postgres:5432/mattermost?sslmode=disable&connect_timeout=10
      MM_SERVICESETTINGS_SITEURL: http://${SITE_URL:-localhost:8065}
    volumes:
      - mattermost_data:/mattermost/data
      - mattermost_config:/mattermost/config
      - mattermost_logs:/mattermost/logs
      - mattermost_plugins:/mattermost/plugins
    networks:
      - mattermost-net
    ports:
      - "8065:8065"
    restart: unless-stopped

volumes:
  postgres_data:
  mattermost_data:
  mattermost_config:
  mattermost_logs:
  mattermost_plugins:

networks:
  mattermost-net:
    driver: bridge
EOF

echo "[4/4] Starting Mattermost..."
docker compose up -d

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Wait about 2 minutes for Mattermost to start, then check status with:"
echo "  cd ~/mattermost-server && docker compose ps"
echo ""
echo "To view logs:"
echo "  cd ~/mattermost-server && docker compose logs -f"
echo ""
echo "Once running, access at:"
echo "  http://YOUR_VM_PUBLIC_IP:8065"