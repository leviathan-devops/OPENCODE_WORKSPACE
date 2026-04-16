# Deployment Guide: Manta Agent to kraken-factory Channel

## Target

- **Mattermost URL**: https://mattermost-production-a9b9.up.railway.app
- **Team**: leviathan-devops
- **Channel**: kraken-factory
- **Agent**: Manta v1.5 (Precision Engineer)

## Prerequisites

1. Mattermost bot account with valid token
2. Bot added to the kraken-factory channel
3. Railway CLI installed and authenticated
4. Docker running locally for testing

---

## Step 1: Create Mattermost Bot

### 1.1 Create Bot Account

1. Log into Mattermost as System Admin
2. Go to **System Console** → **Integrations** → **Bot Accounts**
3. Enable "Enable Bot Account Creation"
4. Click **Add Bot Account**
5. Fill in:
   - **Username**: `manta-bot`
   - **Display Name**: `Manta Agent`
   - **Description**: `Precision coding engineer powered by OpenCode`
   - **Role**: Member
6. Click **Create Bot Account**
7. **Copy the token immediately** (shown only once) ~ i8nxktjo5jy3pg36ywr6twtrjy (active bot token)

### 1.2 Get Your User ID

1. Click your avatar → Profile
2. Find your User ID (26-char alphanumeric)
3. Copy it for allowed users list

### 1.3 Add Bot to Channel

1. Go to `leviathan-devops` team
2. Open `kraken-factory` channel
3. Click channel name → **Add Members**
4. Search for `manta-bot` and add

---

## Step 2: Configure the Bridge Service

### 2.1 Environment Variables

Create a `.env` file:

```bash
# Mattermost Connection
MATTERMOST_URL=https://mattermost-production-a9b9.up.railway.app
MATTERMOST_TOKEN=<your-bot-token-here>
MATTERMOST_BOT_USERNAME=manta-bot
MATTERMOST_BOT_USER_ID=<your-user-id>
MATTERMOST_ALLOWED_USERS=leviathan,<your-user-id>
MATTERMOST_REQUIRE_MENTION=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
SESSION_TIMEOUT=1800

# OpenCode
OPENCODE_IMAGE=opencodeai/opencode:latest
DEFAULT_AGENT=manta
DEFAULT_PLUGINS=manta-agent-v1.5
DEFAULT_MODEL=minimax/MiniMax-M2.7
WORKSPACE_ROOT=/workspace

# Channel Config - kraken-factory
# Add to config/channel-defaults.json
```

### 2.2 Channel Configuration

The kraken-factory channel is pre-configured for Manta agent. Verify in `config/channel-defaults.json`:

```json
{
  "kraken-factory": {
    "agentType": "manta",
    "plugins": ["manta-agent-v1.5"],
    "model": "minimax/MiniMax-M2.7"
  }
}
```

---

## Step 3: Local Testing

### 3.1 Start Services

```bash
cd projects/mattermost-opencode-manta

# Copy env file
cp .env.example .env
# Edit .env with your values

# Start Docker Compose
docker compose -f docker/docker-compose.local.yml up -d

# Check logs
docker compose -f docker/docker-compose.local.yml logs -f
```

### 3.2 Health Check

```bash
curl http://localhost:5000/health
# Expected: {"status":"healthy","service":"mattermost-opencode-bridge"}
```

### 3.3 Test Bot Connection

1. Open Mattermost in browser
2. Go to `kraken-factory` channel
3. Send `@manta-bot help`
4. Bot should respond with help message

### 3.4 Test Manta Agent

Send a coding task:
```
@manta-bot code Create a Python function to calculate fibonacci numbers
```

---

## Step 4: Railway Deployment

### 4.1 Initialize Railway Project

```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login
railway login

# Initialize project
cd projects/mattermost-opencode-manta
railway init
# Select: Production, Create new project
# Name: mattermost-opencode-manta
```

### 4.2 Configure Environment Variables

```bash
# Set via Railway dashboard or CLI
railway env set MATTERMOST_URL=https://mattermost-production-a9b9.up.railway.app
railway env set MATTERMOST_TOKEN=<your-token>
railway env set MATTERMOST_BOT_USERNAME=manta-bot
railway env set MATTERMOST_BOT_USER_ID=<your-user-id>
railway env set MATTERMOST_ALLOWED_USERS=leviathan,<your-user-id>
railway env set REDIS_HOST=redis
railway env set REDIS_PORT=6379
railway env set SESSION_TIMEOUT=1800
railway env set OPENCODE_IMAGE=opencodeai/opencode:latest
railway env set DEFAULT_AGENT=manta
railway env set DEFAULT_PLUGINS=manta-agent-v1.5
railway env set DEFAULT_MODEL=minimax/MiniMax-M2.7
railway env set WORKSPACE_ROOT=/workspace
```

### 4.3 Configure Railway

Create `railway/railway.json`:

```json
{
  "$schema": "https://railway.app/schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 4.4 Add Redis Plugin

```bash
# Add Redis plugin to Railway project
railway add redis
```

### 4.5 Deploy

```bash
# Deploy to Railway
railway up

# Check status
railway status

# View logs
railway logs
```

---

## Step 5: Verify Deployment

### 5.1 Check Health

```bash
curl https://<your-railway-app>.up.railway.app/health
```

### 5.2 Test in Mattermost

1. Go to `kraken-factory` channel
2. Send `@manta-bot status`
3. Bot should respond with session info

### 5.3 First Coding Task

Send:
```
@manta-bot code Create a simple REST API endpoint in Python using Flask
```

Expected: Bot should start a Manta agent session and begin coding.

---

## Troubleshooting

### Bot Not Responding

1. **Check bot is in channel**: `/invite @manta-bot`
2. **Verify token**: Check `MATTERMOST_TOKEN` is correct
3. **Check logs**: `railway logs` for connection errors
4. **Verify mention**: Try `@manta-bot help` with exact mention

### Container Not Spawning

1. **Check Docker socket**: Ensure bridge container has `/var/run/docker.sock` mounted
2. **Check OpenCode image**: `docker pull opencodeai/opencode:latest`
3. **Check permissions**: Container needs to run Docker commands

### Session Timeout

- Sessions timeout after 30 minutes of inactivity
- Send any message to reactivate
- Adjust `SESSION_TIMEOUT` env var

### Message Loop (Bot responding to self)

- Bot ignores its own messages via `user_id` check
- Ensure `MATTERMOST_REQUIRE_MENTION=true`

---

## Monitoring

### Check Active Sessions

```bash
# List sessions via Redis
docker exec opencode-redis redis-cli keys "session:*"
```

### Container Status

```bash
# List OpenCode containers
docker ps | grep opencode-

# View container logs
docker logs opencode-manta-kraken-factory
```

### Bridge Logs

```bash
# Railway logs
railway logs

# Local logs
docker compose -f docker/docker-compose.local.yml logs bridge
```

---

## Next Steps

After successful deployment to `kraken-factory`:

1. **Add more channels**: Configure in `config/channel-defaults.json`
2. **Add more agents**: Support shark, spider in same channel
3. **File uploads**: Enable workspace file attachments
4. **Streaming**: Real-time token streaming in Mattermost
5. **Slash commands**: Native `/manta` command registration
