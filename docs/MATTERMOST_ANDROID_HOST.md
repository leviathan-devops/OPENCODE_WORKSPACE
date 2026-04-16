# Mattermost Android Host Setup

## One-Line Complete Install

Copy-paste this entire block into your UserLAnd or Linux Deploy terminal:

```bash
apt update -qq && apt install -y -qq docker.io docker-compose && mkdir -p ~/.ssh && chmod 700 ~/.ssh && [ ! -f ~/.ssh/id_ed25519 ] && ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -C "mattermost-android" && service docker start 2>/dev/null || dockerd &>/dev/null & sleep 2 && mkdir -p ~/mattermost && cd ~/mattermost && cat > docker-compose.yml << 'EOF'
version: '3'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: mmuser
      POSTGRES_PASSWORD: mmuser_password
      POSTGRES_DB: mattermost
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mmuser -d mattermost"]
      interval: 10s
      timeout: 5s
      retries: 5
  mattermost:
    image: mattermost/mattermost-team-edition:latest
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      MM_USERNAME: mmuser
      MM_PASSWORD: mmuser_password
      MM_DBNAME: mattermost
      MM_SQLSETTINGS_DATASOURCE: "postgres://mmuser:mmuser_password@postgres:5432/mattermost?sslmode=disable&connect_timeout=10"
    volumes:
      - mattermost_data:/mattermost/data
      - mattermost_config:/mattermost/config
      - mattermost_logs:/mattermost/logs
      - mattermost_plugins:/mattermost/plugins
    ports:
      - "8065:8065"
    restart: unless-stopped
volumes:
  postgres_data:
  mattermost_data:
  mattermost_config:
  mattermost_logs:
  mattermost_plugins:
EOF
docker compose up -d && sleep 15 && IP=$(ip addr show wlan0 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1 || ip addr show eth0 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1) && echo "" && echo "========================================" && echo "=== SETUP COMPLETE ===" && echo "========================================" && echo "Access Mattermost at: http://${IP}:8065" && echo "Admin username: admin" && echo "Admin password: Admin123!" && echo "SSH to phone: ssh -i ~/.ssh/id_ed25519 user@$IP"
```

Or use the saved script:

```bash
curl -sO https://raw.githubusercontent.com/leviathan/OPENCODE_WORKSPACE/main/scripts/mattermost-android-install.sh && chmod +x mattermost-android-install.sh && ./mattermost-android-install.sh
```

---

## After Setup

### Access from Other Devices

On your laptop/desktop, open Mattermost app and connect to:

```
http://<PHONE_LOCAL_IP>:8065
```

Find your phone's local IP:
```bash
ip addr show wlan0 | grep inet
```

### SSH to Your Phone

Add the SSH key to GitHub, then:
```bash
ssh -i ~/.ssh/id_ed25519 user@<PHONE_LOCAL_IP>
```

---

## Admin Credentials

- **Username:** admin
- **Password:** Admin123!

---

## Management Commands

```bash
# View logs
docker compose logs -f

# Restart Mattermost
docker compose restart

# Stop server
docker compose down

# Start server
docker compose up -d
```