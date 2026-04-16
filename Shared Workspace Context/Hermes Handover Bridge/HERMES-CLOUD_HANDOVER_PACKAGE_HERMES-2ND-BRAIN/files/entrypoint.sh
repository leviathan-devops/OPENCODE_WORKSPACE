#!/bin/bash
set -e

HERMES_HOME="${HERMES_HOME:-/opt/data}"
INSTALL_DIR="/app/hermes-agent"

echo "[ENTRYPOINT] HERMES_HOME=$HERMES_HOME"
echo "[ENTRYPOINT] INSTALL_DIR=$INSTALL_DIR"

# Initialize Hermes home directory structure
mkdir -p "$HERMES_HOME"/{sessions,memories,skills,logs,cron,hooks}
mkdir -p "$HERMES_HOME/profiles/2nd-brain"

# Copy .env if not exists
if [ ! -f "$HERMES_HOME/.env" ]; then
    if [ -f "$INSTALL_DIR/.env.example" ]; then
        cp "$INSTALL_DIR/.env.example" "$HERMES_HOME/.env"
        echo "[ENTRYPOINT] Copied .env.example to $HERMES_HOME/.env"
    fi
fi

# Copy cli-config.yaml if not exists (rename to config.yaml)
if [ ! -f "$HERMES_HOME/config.yaml" ]; then
    if [ -f "$INSTALL_DIR/cli-config.yaml.example" ]; then
        cp "$INSTALL_DIR/cli-config.yaml.example" "$HERMES_HOME/config.yaml"
        echo "[ENTRYPOINT] Copied cli-config.yaml.example to $HERMES_HOME/config.yaml"
    fi
fi

# Copy SOUL.md if not exists
if [ ! -f "$HERMES_HOME/SOUL.md" ]; then
    if [ -f "$INSTALL_DIR/docker/SOUL.md" ]; then
        cp "$INSTALL_DIR/docker/SOUL.md" "$HERMES_HOME/SOUL.md"
        echo "[ENTRYPOINT] Copied SOUL.md to $HERMES_HOME/SOUL.md"
    fi
fi

# Add Telegram configuration if token is provided
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    echo "[ENTRYPOINT] Configuring Telegram bot..."
    
    # Ensure TELEGRAM_BOT_TOKEN is in .env (remove duplicates first)
    if [ -f "$HERMES_HOME/.env" ]; then
        sed -i '/^TELEGRAM_BOT_TOKEN=/d' "$HERMES_HOME/.env"
    fi
    echo "TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN" >> "$HERMES_HOME/.env"
    echo "[ENTRYPOINT] Added TELEGRAM_BOT_TOKEN to .env"
    
    # Add Telegram platform config using Python for proper YAML
    /usr/local/bin/python3 << 'PYEOF'
import yaml
import os
import sys

hermes_home = os.environ.get('HERMES_HOME', '/opt/data')
config_path = os.path.join(hermes_home, 'config.yaml')
token = os.environ.get('TELEGRAM_BOT_TOKEN', '')

if not token:
    sys.exit(0)

try:
    # Load existing config or create new
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f) or {}
    else:
        config = {}
    
    # Add telegram section
    if 'platforms' not in config:
        config['platforms'] = {}
    config['platforms']['telegram'] = {
        'enabled': True,
        'token': token
    }
    
    # Write back
    with open(config_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False)
    
    print(f"[ENTRYPOINT] Added Telegram config to {config_path}")
except Exception as e:
    print(f"[ENTRYPOINT] Warning: Could not update config.yaml: {e}")
PYEOF
fi

# Verify hermes binary is available
if ! command -v hermes &> /dev/null; then
    echo "[ENTRYPOINT] ERROR: hermes binary not found in PATH"
    exit 1
fi

echo "[ENTRYPOINT] hermes version: $(hermes --version 2>&1 | head -1)"
echo "[ENTRYPOINT] Starting Hermes gateway..."

exec "$@"
