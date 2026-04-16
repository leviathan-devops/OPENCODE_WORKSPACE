# Layer 3: Troubleshooting

## Problem: Container Exits Immediately on Railway

**Symptoms:**
- Build succeeds
- Container shows "Status: FAILED"
- No useful error logs
- Container doesn't stay running

**Local test works:**
```bash
docker run --rm -e HERMES_HOME=/tmp/test ghcr.io/leviathan-devops/cloud-hermes:build hermes --version
# Output: Hermes Agent v0.6.0 (2026.3.30)
```

**But Railway fails.**

## Diagnostic Steps

### 1. Check if `hermes` binary is in PATH
```bash
docker run --rm ghcr.io/leviathan-devops/cloud-hermes:build which hermes
# Should output: /usr/local/bin/hermes
```

### 2. Check if entrypoint.sh exists
```bash
docker run --rm ghcr.io/leviathan-devops/cloud-hermes:build ls -la /usr/local/bin/entrypoint.sh
```

### 3. Test entrypoint execution
```bash
docker run --rm -e HERMES_HOME=/tmp/test ghcr.io/leviathan-devops/cloud-hermes:build hermes gateway run
# Should see: "Starting Hermes gateway..."
```

### 4. Check Railway logs
```bash
railway logs
# Look for: "error", "failed", "exited", "crashed"
```

## Known Issues

### Issue: Railway can't pull from public.ecr.aws

**Symptom:** Build fails when trying to use `FROM public.ecr.aws/z9k9k8q1/hermes-bridge:latest`

**Workaround:** Build locally and push to ghcr.io

```bash
cd ~/hermes-workspace/cloud-hermes
docker build -t ghcr.io/leviathan-devops/cloud-hermes:v1 .
docker push ghcr.io/leviathan-devops/cloud-hermes:v1
# Then use ghcr.io image in Dockerfile
```

### Issue: Telegram webhook conflicts with polling

**Symptom:** "409 Conflict" errors when polling

**Fix:** Delete webhook so local Hermes can poll
```bash
curl -s "https://api.telegram.org/bot<TOKEN>/deleteWebhook?drop_pending_updates=true"
```

### Issue: Railway CLI can't link to service

**Symptom:** `railway status` shows `Service: None`

**Workaround:** Create `.railway/project` file manually:
```json
{"projectId":"ID","environmentId":"production","serviceId":"SERVICE_ID"}
```

## Debug Commands

```bash
# Check Railway deployment status
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { deployment(id: \"DEPLOYMENT_ID\") { status createdAt } }"}'

# Get service ID
railway status --json | python3 -c "import sys,json; d=json.load(sys.stdin)..."

# Redeploy with fresh build
railway up --no-cache --service <SERVICE_ID>
```

## Previous Attempts Log

See: `references/PREVIOUS_ATTEMPTS.md`

Key finding: Docker image works locally but fails on Railway. Unknown root cause.
