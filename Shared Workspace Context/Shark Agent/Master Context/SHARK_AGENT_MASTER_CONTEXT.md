# Shark Agent v4.8.3 — Master Context

## Container Testing Configuration

**API Key:** `<REDACTED_SET_VIA_ENV>`
**Model:** `gemma-4-26b-it` (Gemma 4 26b)

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Master Context/Container Testing Context/CONTAINER_API_CONFIG.md`

---

## Quick Reference

| Item | Value |
|------|-------|
| Container Image | `shark-agent-v4.8.3:test` |
| API Key | Google: `<REDACTED_SET_VIA_ENV>` |
| Model | `gemma-4-26b-it` |
| Container Name | `shark-v483` |

---

## Container Commands

```bash
# Start container with API key
docker run -d --name shark-v483 \
  --entrypoint /bin/sh \
  -e GOOGLE_API_KEY="<REDACTED_SET_VIA_ENV>" \
  shark-agent-v4.8.3:test -c "sleep 3600"

# Run tests
docker exec shark-v483 opencode run "Call shark-test-runner action=run" --agent shark --model gemma-4-26b-it
```