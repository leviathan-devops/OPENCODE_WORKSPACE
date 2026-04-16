# Cloud Hermes - Build Debug Log

## Current Working Architecture

### Local Machine
- Hermes Agent running locally with 2nd-brain profile
- Local storage: `~/.hermes/profiles/2nd-brain/` (25MB sessions, memories, skills)
- Telegram polling via Hermes gateway
- Multiple Hermes instances running (devops-manager, 2nd-brain, engineer)

### Railway (Working)
- Service: `telegram-bridge` in project "Hermes Cloud"
- URL: `https://telegram-bridge-production-2ab9.up.railway.app`
- Volume: `/data/telegram` (5000MB, currently using 158MB)
- Status: Running, webhook active
- AI: MiniMax API (configured)
- Mode: Webhook receiver + AI chat buffer (20 message context)

### GitHub
- Repo: `leviathan-devops/cloud-hermes` (private)
- ghcr.io: `ghcr.io/leviathan-devops/hermes-gateway:latest` (pushed, 856 bytes manifest)

## What Works

1. **Railway Webhook** - Telegram → Railway webhook, 24/7
2. **Bot Responses** - MiniMax API generates responses
3. **Context Storage** - Messages stored in Railway volume
4. **Local Hermes** - Running locally, polls Telegram

## What's Broken / Missing

### Full Hermes Agent on Railway
**Problem**: Cannot get Hermes Agent running on Railway
- Dockerfile builds fail silently
- Railway keeps old container running when new deployments fail
- Multi-service project has CLI linking issues

### Specific Failures

1. **Dockerfile with Hermes base image**
   - Tried: `FROM public.ecr.aws/z9k9k8q1/hermes-bridge:latest`
   - Result: Build succeeds but container fails to start
   - Railway shows: `Status: FAILED`

2. **Custom entrypoint.sh**
   - Entrypoint expects `/opt/hermes/docker/entrypoint.sh`
   - But base image has Hermes at `/usr/local/bin/hermes` or `/app/hermes-agent/`
   - Config files not in expected locations

3. **Hermes Agent locations (from docker inspect)**
   ```
   /usr/local/bin/hermes (main binary)
   /app/hermes-agent/ (Python package at)
   ```

4. **Railway CLI Issues**
   - `railway up` creates deployment but can't link to service
   - `railway status` shows `Service: None` after `railway link`
   - `.railway/project` file not properly configured
   - Service ID vs Service Instance ID confusion

5. **Volume Mount**
   - Existing volume: `telegram-bridge-volume` mount at `/data/telegram`
   - Want: `/opt/data` for Hermes home
   - Different mount paths

## Key Insights

### Hermes Image Entry Point
```dockerfile
CMD: ['python3', '-u', 'app/main.py']
# NOT 'hermes gateway run'
```

### Hermes Gateway Command
```
hermes gateway run
```
But `hermes` binary may not be in PATH when using `python3 -u app/main.py`

### What Hermes Image Actually Runs
```python
# Entry point is app/main.py, not shell
# Tries to connect to Telegram but may fail without python-telegram-bot
```

## Environment Variables Needed
```
HERMES_HOME=/opt/data
TELEGRAM_BOT_TOKEN=8668512792:AAF3jqr-SgrJep0HGyJX-m1q39LAt3Y4tLs
MINIMAX_API_KEY=sk-cp-CAN-... (already in Railway)
```

## Local Hermes 2nd-Brain Structure
```
~/.hermes/profiles/2nd-brain/
├── memories/           # Long-term memory files
│   ├── MASTER_CONTEXT.md
│   ├── MEMORY_AUDIT_2026-04-02.md
│   └── projects/
├── sessions/           # Chat sessions (24MB)
├── skills/             # 28 skill directories
├── SOUL.md             # Profile identity
├── config.yaml         # Profile config
├── state.db            # SQLite state
└── .env               # Secrets
```

## Question

How do we deploy Hermes Agent (the real AI brain with memories, skills, profile) to Railway so it:
1. Runs 24/7 (not tethered to device)
2. Connects to Telegram bot
3. Has access to 2nd-brain identity/memories/skills
4. Syncs with local 2nd-brain (bidirectional)

## Constraints
- Railway CLI has bugs with multi-service projects
- GitHub and Railway are already linked
- Token stored in `~/.git-credentials`
- Existing volume at `/data/telegram` (we can create new volume)
- Image `ghcr.io/leviathan-devops/hermes-gateway:latest` available
