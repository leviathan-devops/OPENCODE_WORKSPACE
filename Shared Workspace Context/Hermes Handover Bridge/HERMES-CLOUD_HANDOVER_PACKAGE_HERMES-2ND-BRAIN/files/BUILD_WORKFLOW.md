# Cloud Hermes - Railway Deployment Workflow

## Goal
Deploy a real Hermes Agent to Railway with:
1. Full 2nd-brain identity (memories, skills, profile)
2. Web UI chat interface for testing (NOT Telegram yet)
3. Persistence via Railway volumes
4. After verified working → add Telegram via web UI

## Prerequisites
- GitHub token: stored in `~/.git-credentials` (repo: leviathan-devops/cloud-hermes)
- Railway token: `$RAILWAY_TOKEN` env var
- Working local Dockerfile: verified working (Dockerfile + entrypoint.sh)

## Critical Discovery
**The working image is at:** `ghcr.io/leviathan-devops/cloud-hermes:build`

This image was locally built and pushed. It:
- Contains Hermes Agent with entrypoint.sh
- Runs `hermes gateway run` successfully
- Initializes HERMES_HOME at /opt/data
- Supports Telegram config

## Step-by-Step Deployment

### Phase 1: Create Fresh Railway Project

```bash
# 1. Authenticate with Railway
railway login --browserless

# 2. Create new project
railway init --name cloud-hermes-web
# Follow prompts, select personal account

# 3. Link to GitHub repo
cd ~/hermes-workspace/cloud-hermes
railway link --project <NEW_PROJECT_ID>
railway link --service <NEW_SERVICE_ID>
```

### Phase 2: Configure Deployment

Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

The `Dockerfile` should be:
```dockerfile
FROM ghcr.io/leviathan-devops/cloud-hermes:build

ENV PYTHONUNBUFFERED=1
ENV HERMES_HOME=/opt/data
ENV PORT=8080

EXPOSE 8080

# Run Hermes in gateway mode with web UI support
CMD ["hermes", "gateway", "run", "--web"]
```

### Phase 3: Environment Variables

Set in Railway dashboard or CLI:
```
HERMES_HOME=/opt/data
PORT=8080
# Optional: Add provider API keys for full AI functionality
```

### Phase 4: Volume Mount

Create persistent volume at `/opt/data` for:
- sessions/
- memories/
- skills/
- config.yaml
- SOUL.md

### Phase 5: Deploy

```bash
cd ~/hermes-workspace/cloud-hermes
railway up --service <SERVICE_ID>
```

### Phase 6: Verify

1. Check logs: `railway logs`
2. Test web UI: `curl https://<service>.up.railway.app/health`
3. Check if Hermes initialized: look for "Gateway running" in logs

## Troubleshooting

### If Deployment Fails
1. Check `railway logs` for errors
2. Verify image can be pulled: `docker pull ghcr.io/leviathan-devops/cloud-hermes:build`
3. Test locally: `docker run --rm -e HERMES_HOME=/tmp/test ghcr.io/leviathan-devops/cloud-hermes:build hermes --version`

### If Container Exits Immediately
1. Add `sleep infinity` to CMD to keep container alive
2. Check if `hermes` binary is in PATH
3. Verify entrypoint.sh permissions

### If Web UI Not Accessible
1. Verify PORT env var matches Railway exposed port
2. Check if Hermes has web server mode
3. Try exposing port 3000 (common React/Next.js port)

## Alternative: Build Fresh Image

If ghcr.io image doesn't work, build locally:

```bash
cd ~/hermes-workspace/cloud-hermes

# Build from Hermes base image
docker build -t ghcr.io/leviathan-devops/cloud-hermes:v1 .

# Push to GitHub Container Registry
docker push ghcr.io/leviathan-devops/cloud-hermes:v1

# Use this image in Dockerfile
```

## Key Files

```
cloud-hermes/
├── Dockerfile           # Uses ghcr.io image
├── entrypoint.sh       # Initializes HERMES_HOME
├── railway.json        # Railway config
├── BUILD_DEBUG_LOG.md  # Previous attempts debug info
└── BUILD_WORKFLOW.md   # This file
```

## Next Steps After Success

1. Add web UI chat interface
2. Configure custom domain
3. Then add Telegram integration via web UI
4. Sync with local 2nd-brain memories

