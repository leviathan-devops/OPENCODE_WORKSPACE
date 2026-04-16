# Cloud Hermes - Spider Agent Deployment Workflow

## Context
- GitHub: `leviathan-devops/cloud-hermes` (private)
- Railway token: `$RAILWAY_TOKEN`
- Working image: `ghcr.io/leviathan-devops/cloud-hermes:build` (verified working locally)
- Local Telegram polling: restored and working
- Goal: Deploy Cloud Hermes with web UI (NOT Telegram yet)

## Railway Project IDs
- Existing Telegram bridge: `telegram-bridge` service ID `3ab28d58-049f-4012-9a3c-2ee5aaa2075b`
- Project: `Hermes Cloud` ID `84255eda-87ac-4e98-81b6-c5a763099162`

## PHASE 1: Create Fresh Railway Project

```bash
#!/bin/bash
set -e

# 1. Create new Railway project via API
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { projectCreate(input: {name: \"cloud-hermes\"}) { id name } }"}'

# 2. Link to GitHub repo
cd ~/hermes-workspace/cloud-hermes
git remote -v
```

## PHASE 2: Prepare Deployment Files

### Dockerfile (for Cloud Hermes)
```dockerfile
# Cloud Hermes with Web Chat
FROM ghcr.io/leviathan-devops/cloud-hermes:build

ENV PYTHONUNBUFFERED=1
ENV HERMES_HOME=/opt/data
ENV PORT=8080

# Expose port
EXPOSE 8080

# Copy web chat server
COPY web_chat_server.py /app/web_chat_server.py

# Run web chat server (which wraps Hermes)
CMD ["python3", "/app/web_chat_server.py"]
```

### railway.json
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
    "restartPolicyMaxRetries": 10,
    "podCommand": ["python3", "/app/web_chat_server.py"]
  }
}
```

## PHASE 3: Deploy via Railway CLI

```bash
# Link to existing Railway project
cd ~/hermes-workspace/cloud-hermes

# Create .railway/project file manually
mkdir -p .railway
cat > .railway/project << 'EOF'
{"projectId":"NEW_PROJECT_ID","environmentId":"production","serviceId":"NEW_SERVICE_ID"}
EOF

# Deploy
railway up --service <SERVICE_ID>
```

## PHASE 4: Alternative - Use Railway Dashboard

If CLI fails:
1. Open Railway dashboard: https://railway.app
2. Create new project manually
3. Connect to GitHub repo: `leviathan-devops/cloud-hermes`
4. Set environment variables:
   - `HERMES_HOME=/opt/data`
   - `PORT=8080`
5. Create persistent volume at `/opt/data`
6. Deploy

## PHASE 5: Verify Deployment

```bash
# Check status
railway status

# Check logs
railway logs

# Test health
curl https://<service>.up.railway.app/health

# Test web UI
curl https://<service>.up.railway.app/ | head -50
```

## Troubleshooting Commands

```bash
# Verify image works locally
docker run --rm -e HERMES_HOME=/tmp/test -p 8080:8080 ghcr.io/leviathan-devops/cloud-hermes:build

# Check Railway deployment
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { project(id: \"PROJECT_ID\") { services { edges { node { id name deployments { edges { node { id status createdAt } } } } } } } }"}'

# Redeploy
railway redeploy --service <SERVICE_ID>
```

## Key Files to Update

```
cloud-hermes/
├── Dockerfile           # Uses ghcr.io image, adds web chat
├── Dockerfile.simple    # Just runs Hermes gateway (backup)
├── entrypoint.sh        # Works, no changes needed
├── railway.json         # Railway config
├── web_chat_server.py  # FastAPI web chat (TO CREATE)
├── SPIDER_WORKFLOW.md   # This file
├── BUILD_DEBUG_LOG.md   # Previous attempts
└── BUILD_WORKFLOW.md   # Original workflow
```

## Success Criteria

1. ✅ Web UI accessible at `https://<service>.up.railway.app/`
2. ✅ Chat interface loads with "Hermes 2nd-Brain" header
3. ✅ Messages can be sent and receive responses
4. ✅ No container crashes in logs
5. ✅ Hermes initializes properly (logs show "Gateway running" or similar)

## After Success

Once verified working:
1. Add Telegram integration via web UI
2. Set up persistent volume for memories
3. Configure domain
4. Sync with local 2nd-brain
