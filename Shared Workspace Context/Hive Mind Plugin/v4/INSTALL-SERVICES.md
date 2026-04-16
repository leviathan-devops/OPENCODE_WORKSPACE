# Hive Mind Plugin v4 - Service Installation

## systemd Service Files

Two services need to be installed:

1. **openviking.service** - OpenViking memory server (port 1933)
2. **llama-embedding.service** - llama.cpp embedding server (port 8001)

## Installation Steps

### 1. Copy service files to systemd directory
```bash
sudo cp /home/leviathan/.config/opencode/plugins/iteration-v4/openviking.service /etc/systemd/system/
sudo cp /home/leviathan/.config/opencode/plugins/iteration-v4/llama-embedding.service /etc/systemd/system/
```

### 2. Reload systemd
```bash
sudo systemctl daemon-reload
```

### 3. Enable services (start on boot)
```bash
sudo systemctl enable openviking.service
sudo systemctl enable llama-embedding.service
```

### 4. Start services
```bash
sudo systemctl start openviking.service
sudo systemctl start llama-embedding.service
```

### 5. Check status
```bash
systemctl status openviking.service
systemctl status llama-embedding.service
```

## Service Management

| Action | Command |
|--------|---------|
| Start | `sudo systemctl start openviking.service` |
| Stop | `sudo systemctl stop openviking.service` |
| Restart | `sudo systemctl restart openviking.service` |
| View logs | `journalctl -u openviking.service -f` |
| View logs (all) | `journalctl -u openviking.service -u llama-embedding.service -f` |

## Troubleshooting

### Service won't start
```bash
# Check logs
journalctl -u openviking.service -n 50

# Verify config exists
cat /home/leviathan/.openviking/ov.conf

# Check port availability
ss -tlnp | grep -E "1933|8001"
```

### Service starts but health check fails
```bash
# Check if process is actually running
ps aux | grep openviking

# Check logs for errors
cat /tmp/openviking-stdout.log
cat /tmp/openviking-stderr.log
```

### Ports already in use
```bash
# Find what's using the port
fuser 1933/tcp
fuser 8001/tcp

# Kill if needed
fuser -k 1933/tcp
fuser -k 8001/tcp

# Restart service
sudo systemctl restart openviking.service
```

## Verification

After installation:
```bash
curl http://localhost:1933/health
curl http://localhost:8001/v1/models
```

Expected:
- `{"status":"ok","healthy":true,"version":"0.2.9"}`
- Model list including "nomic-embed-text"