# Layer 2: Deployment Steps

## Prerequisites

- GitHub token: stored in `~/.git-credentials`
- Railway token: `$RAILWAY_TOKEN` env var
- Working Docker image: `ghcr.io/leviathan-devops/cloud-hermes:build` (verified locally)

## Step 1: Create Fresh Railway Project

```bash
# Via Railway GraphQL API
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { projectCreate(input: {name: \"cloud-hermes-web\"}) { id } }"}'
```

## Step 2: Link to GitHub

In Railway dashboard:
1. Connect to `leviathan-devops/cloud-hermes` repo
2. Set build configuration

## Step 3: Configure railway.json

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

## Step 4: Create Web UI + Hermes Integration

The Docker image needs to:
1. Start Hermes Agent subprocess
2. Start FastAPI web server
3. Route web UI requests to Hermes subprocess

```dockerfile
FROM ghcr.io/leviathan-devops/cloud-hermes:build

ENV PYTHONUNBUFFERED=1
ENV HERMES_HOME=/opt/data
ENV PORT=8080

# Web server that connects to Hermes
COPY web_server.py /app/web_server.py

EXPOSE 8080

# Start both Hermes and web server
CMD ["bash", "-c", "hermes gateway run & python3 /app/web_server.py"]
```

## Step 5: Environment Variables

```
HERMES_HOME=/opt/data
PORT=8080
MINIMAX_API_KEY=<from ~/.hermes/profiles/2nd-brain/.env>
```

## Step 6: Persistent Volume

Create volume at `/opt/data` for:
- sessions/
- memories/
- skills/
- SOUL.md
- config.yaml

## Step 7: Deploy and Verify

```bash
# Deploy
railway up --service <SERVICE_ID>

# Check logs
railway logs

# Test
curl https://<service>.up.railway.app/health
curl https://<service>.up.railway.app/
```

## Verification Checklist

- [ ] Container starts without crashing
- [ ] Logs show "Hermes Agent" initialization
- [ ] Web UI loads at root URL
- [ ] Chat messages route to Hermes Agent
- [ ] AI responses include context from memories
- [ ] Sessions persist after restart

## Key Command

```bash
hermes gateway run
```

This is what runs the real Hermes messaging gateway. Must be running inside container.
