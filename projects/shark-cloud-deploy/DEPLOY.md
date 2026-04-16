# Shark Cloud - Railway Deployment Guide

## Overview

Shark Cloud deploys OpenCode with the Shark Agent plugin as a 24/7 cloud service, accessible via Discord, Mattermost, or direct API.

```
User → Discord/Mattermost → Bot Bridge (Express) → OpenCode ACP → Shark Agent hooks
                                ↓
                           /workspace (persistent volume)
```

## Prerequisites

1. **Railway CLI** installed
2. **Docker** installed locally (for building)
3. Discord Bot created at https://discord.com/developers/applications
4. Railway account connected to GitHub

## Deployment Steps

### 1. Prepare Your OpenCode Plugin

The Shark Agent plugin must be available in the container. The Dockerfile uses `ghcr.io/anomalyco/opencode:latest` which includes OpenCode with plugin support.

Copy your shark-agent plugin to the container:

```dockerfile
# In Dockerfile, after FROM line:
COPY --chown=opencode:opencode shark-agent/ /home/opencode/.config/opencode/plugins/shark-agent/
```

### 2. Configure Environment Variables

Create a `railway.env` file:

```env
MINIMAX_API_KEY=sk-your-key
DISCORD_BOT_TOKEN=your-discord-token
MATTERMOST_WEBHOOK_URL=https://your-mm-server/api/v4/hooks/xxx
SHARK_WORKSPACE=/workspace
LOG_LEVEL=info
```

### 3. Deploy to Railway

```bash
cd projects/shark-cloud-deploy

# Login to Railway
railway login

# Init project
railway init
railway project name shark-cloud

# Set environment variables
railway variables set MINIMAX_API_KEY=sk-xxx
railway variables set DISCORD_BOT_TOKEN=xxx
railway variables set SHARK_WORKSPACE=/workspace

# Add persistent volume (for /workspace)
railway volume create --name shark-workspace

# Deploy
railway up

# Check status
railway status
```

### 4. Verify Deployment

```bash
# Check health
curl https://your-railway-app.up.railway.app/health

# Expected response:
# {"status":"ok","service":"shark-cloud","timestamp":1234567890}
```

## File Storage

| Path | Purpose | Persistence |
|------|---------|-------------|
| `/workspace` | Shark agent working files, generated code | **Persistent** (NFS volume) |
| `/root/.config/opencode` | OpenCode config + plugins | Ephemeral |
| `/tmp` | Temporary files | **Ephemeral** |

### Workspace Structure

```
/workspace/
├── .shark/                    # Shark agent state
│   ├── evidence/              # Gate evidence, test results
│   ├── state/                 # Session state
│   └── checkpoints/           # Versioned snapshots
├── tasks/                     # Per-user task workspaces
│   └── {userId}/
│       └── (generated files)
└── projects/                  # Project directories
    └── {project-name}/
```

## Discord Integration

### Setup Discord Bot

1. Go to https://discord.com/developers/applications
2. Create New Application → Bot
3. Enable Message Content Intent
4. Copy Bot Token

### Bot Commands

| Command | Description |
|---------|-------------|
| `!shark build a REST API` | Generate code |
| `!shark test the login flow` | Run tests |
| `!shark debug the auth bug` | Debug issue |
| `@Shark` (mention) | Same as `!shark` |

### Invite Bot to Server

1. OAuth2 → URL Generator
2. Scopes: `bot`
3. Permissions: `Send Messages`, `Read Message History`
4. Use generated URL to invite

## Mattermost Integration

### Setup Incoming Webhook

1. Mattermost Console → Integrations → Incoming Webhooks
2. Create new webhook, note URL
3. Set channel where `@shark` will be used

### Usage

```
@shark build a hello world express app
```

## API Usage

### Direct API Call

```bash
curl -X POST https://your-railway-app.up.railway.app/delegate \
  -H "Content-Type: application/json" \
  -d '{
    "task": "build a simple hello world node.js app",
    "userId": "my-user"
  }'
```

### Streaming Response

```bash
curl -X POST https://your-railway-app.up.railway.app/delegate/stream \
  -H "Content-Type: application/json" \
  -d '{"task": "build a REST API", "userId": "my-user"}'
```

## Cost Optimization

1. **Set MAX_CONCURRENT_TASKS=1** - Single task at a time
2. **Set SESSION_TIMEOUT_MS=60000** - 1 minute max per task
3. **Use rate limiting** - Prevents abuse
4. **Monitor Railway dashboard** - Track spend

## Troubleshooting

### ACP Session Fails to Start

```bash
# Check if opencode acp works in container
docker exec <container> opencode acp --cwd /workspace
```

### Bot Not Responding

1. Check Discord bot token is valid
2. Verify webhook is configured
3. Check Railway logs: `railway logs`

### Files Not Persisting

1. Verify volume is mounted: `railway volume list`
2. Check volume is attached to service
3. Verify `/workspace` path in logs

## Security

- [ ] Rotate API keys monthly
- [ ] Use Railway's encrypted environment variables
- [ ] Set up rate limiting (already enabled)
- [ ] Monitor spend on Railway dashboard
- [ ] Never commit `.env` to git

## Monitoring

```bash
# Watch logs
railway logs -f

# Check status
railway status

# View environment
railway variables list
```
