# OpenCode Plugin Deployment Guide

## Overview

This guide covers deploying OpenCode plugins in production and development environments.

---

## Development Deployment

### Local Plugin Development

1. **Create plugin project**:
   ```bash
   mkdir my-plugin && cd my-plugin
   npm init -y
   npm install opencode --save-dev
   ```

2. **Link for local testing**:
   ```bash
   npm link  # In plugin directory
   npm link opencode-plugin-name  # In main project
   ```

3. **Configure in OpenCode**:
   ```yaml
   # opencode.config.yaml
   plugins:
     - name: my-plugin
       path: ./plugins/my-plugin
       enabled: true
       debug: true
   ```

4. **Run with debug output**:
   ```bash
   OPENCODE_DEBUG=plugin opencode
   ```

### Hot Reloading

Plugins support live reload during development:

```yaml
plugins:
  - name: my-plugin
    path: ./plugins/my-plugin
    watch: true  # Auto-reload on changes
```

---

## Production Deployment

### System Requirements

- Node.js 18+ or 20+ LTS
- 4GB RAM minimum (8GB recommended)
- 1GB disk space for installations

### Installation Steps

1. **Install OpenCode**:
   ```bash
   npm install -g opencode
   ```

2. **Configure plugins**:
   ```bash
   mkdir -p ~/.config/opencode
   cp opencode.config.yaml ~/.config/opencode/
   ```

3. **Install plugins**:
   ```bash
   # npm plugins
   npm install opencode-plugin-xyz
   
   # Configure in opencode.config.yaml
   plugins:
     - package: opencode-plugin-xyz
       version: "^2.0.0"
   ```

4. **Verify installation**:
   ```bash
   opencode doctor
   ```

---

## Configuration

### Plugin Configuration

```yaml
# opencode.config.yaml
plugins:
  # npm package
  - name: my-plugin
    package: opencode-plugin-example
    version: "^1.0.0"
    enabled: true
    
  # Local path
  - name: local-plugin
    path: /opt/opencode/plugins/local-plugin
    enabled: true
    
  # With options
  - name: configured-plugin
    package: opencode-plugin-configured
    options:
      apiKey: ${PLUGIN_API_KEY}
      endpoint: https://api.example.com
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENCODE_CONFIG_DIR` | Config directory | `~/.config/opencode` |
| `OPENCODE_DATA_DIR` | Data directory | `~/.local/share/opencode` |
| `OPENCODE_PLUGIN_DIR` | Additional plugin paths | `/opt/plugins` |
| `OPENCODE_LOG_LEVEL` | Logging level | `debug`, `info`, `warn`, `error` |

---

## Security

### Plugin Permissions

Plugins run with declared permissions only:

```json
{
  "permissions": [
    "tools:read",
    "tools:write", 
    "filesystem:read",
    "network:http"
  ]
}
```

### Running as Non-Root

```bash
# Create dedicated user
useradd -r -s /bin/false opencode

# Set permissions
chown -R opencode:opencode /var/lib/opencode
chmod -R 700 /var/lib/opencode
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine

RUN npm install -g opencode

# Install plugins
RUN npm install -g opencode-plugin-xyz

# Copy config
COPY opencode.config.yaml /etc/opencode/

# Run as non-root
USER node
CMD ["opencode"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  opencode:
    build: .
    volumes:
      - ./config:/etc/opencode:ro
      - ./data:/var/lib/opencode
    environment:
      - OPENCODE_LOG_LEVEL=info
    restart: unless-stopped
```

---

## Monitoring

### Health Checks

```bash
# Check status
opencode health

# View logs
opencode logs --tail 100

# Check plugin status
opencode plugins list
```

### Metrics

```yaml
# Enable metrics
telemetry:
  enabled: true
  endpoint: http://metrics.example.com
```

---

## Troubleshooting

### Plugin Fails to Load

```bash
# Check plugin status
opencode plugins list --verbose

# Validate config
opencode config validate

# Test plugin loading
opencode --debug --plugin my-plugin
```

### Permission Errors

```bash
# Check permissions
ls -la /var/lib/opencode

# Fix ownership
chown -R opencode:opencode /var/lib/opencode
```

---

## Backup and Recovery

### Backup

```bash
# Backup config and data
tar -czf opencode-backup-$(date +%Y%m%d).tar.gz \
  ~/.config/opencode \
  ~/.local/share/opencode \
  ~/.cache/opencode
```

### Recovery

```bash
# Stop service
systemctl stop opencode

# Restore
tar -xzf opencode-backup-20240101.tar.gz -C ~

# Restart
systemctl start opencode
```
