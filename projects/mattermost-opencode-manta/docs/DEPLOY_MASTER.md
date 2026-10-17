# Deployment Guide: Manta Agent to manta-factory Channel

## Configuration Summary

| Field | Value |
|-------|-------|
| **Mattermost URL** | https://mattermost-production-a9b9.up.railway.app |
| **Bot Username** | manta-bot |
| **Bot User ID** | s1oig6hehig79d9oem38nmjnzo |
| **Bot Token** | `i8nxktjo5jy3pg36ywr6twtrjy` |
| **Manta Factory Channel ID** | `sziyoi8633fgmj3ob8drtm44jw` |
| **Railway API** | `8190a045-3fbd-4c68-8c0f-772d7f10901f` |

---

## Step 1: Deploy to Railway

### Option A: Via Railway Dashboard (Recommended)

1. Go to https://railway.app
2. Click **New Project** → **Deploy from GitHub repo**
3. Connect your GitHub and select the `mattermost-opencode-manta` repo
4. Railway will auto-detect the Dockerfile
5. Add environment variables (see below)

### Option B: Via Railway CLI

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/mattermost-opencode-manta

# Login to Railway
railway login

# Initialize new project
railway init
# Select: Production, Create new project
# Name: manta-bridge

# Set environment variables
railway env set MATTERMOST_URL=https://mattermost-production-a9b9.up.railway.app
railway env set MATTERMOST_TOKEN="<REDACTED_SET_VIA_ENV>"
railway env set MATTERMOST_BOT_USERNAME=manta-bot
railway env set MATTERMOST_BOT_USER_ID="<REDACTED_SET_VIA_ENV>"
railway env set MATTERMOST_ALLOWED_USERS=*
railway env set REDIS_HOST=localhost
railway env set REDIS_PORT=6379
railway env set DEFAULT_AGENT=manta
railway env set DEFAULT_PLUGINS=manta-agent-v1.5

# Deploy
railway up
```

### Required Environment Variables

| Variable | Value |
|----------|-------|
| `MATTERMOST_URL` | `https://mattermost-production-a9b9.up.railway.app` |
| `MATTERMOST_TOKEN` | `i8nxktjo5jy3pg36ywr6twtrjy` |
| `MATTERMOST_BOT_USERNAME` | `manta-bot` |
| `MATTERMOST_BOT_USER_ID` | `s1oig6hehig79d9oem38nmjnzo` |
| `MATTERMOST_ALLOWED_USERS` | `*` (allow all) |
| `REDIS_HOST` | `localhost` |
| `REDIS_PORT` | `6379` |
| `DEFAULT_AGENT` | `manta` |
| `DEFAULT_PLUGINS` | `manta-agent-v1.5` |
| `DEFAULT_MODEL` | `minimax/MiniMax-M2.7` |
| `OPENCODE_IMAGE` | `opencodeai/opencode:latest` |

---

## Step 2: Add Bot to Channel

1. Log into Mattermost as admin
2. Go to **leviathan-devops** team
3. Open **manta-factory** channel
4. Click channel name → **Add Members**
5. Search for `manta-bot` and add

---

## Step 3: Test the Bot

In the **manta-factory** channel, send:

```
@manta-bot help
```

The bot should respond with the help message.

---

## Project Structure

```
projects/mattermost-opencode-manta/
├── Dockerfile                    # Container build
├── railway.json                 # Railway config
├── config/
│   └── channel-defaults.json    # Channel → Agent mapping
├── src/
│   ├── main.ts                  # Entry point
│   ├── mattermost/              # Mattermost WS/HTTP
│   ├── session/                 # Redis session manager
│   ├── opencode/                # Container spawner
│   └── bridge/                  # Message routing
└── dist/                        # Compiled JS
```

---

## Channel Configuration

The `manta-factory` channel is pre-configured:

```json
{
  "manta-factory": {
    "agentType": "manta",
    "plugins": ["manta-agent-v1.5"],
    "model": "minimax/MiniMax-M2.7"
  }
}
```

---

## Troubleshooting

### Bot not responding
1. Verify bot is added to channel
2. Check bot token is correct
3. Check Railway logs: `railway logs`

### Container won't spawn
- Railway containers can't spawn Docker containers without DinD
- For production, use OpenCode in subprocess mode or API mode

### Session timeout
- Sessions expire after 30 min of inactivity
- Adjust `SESSION_TIMEOUT` env var
