# Shark Agent Container Testing Configuration

**Date:** 2026-04-16
**Model:** Gemma 4 26b (via Google API)

---

## API Configuration

```
GOOGLE_API_KEY="<REDACTED_SET_VIA_ENV>"
```

---

## Container Test Model

**Model:** `gemma-4-26b-it`
**Provider:** Google (Gemini)

---

## Usage

Set `GOOGLE_API_KEY` environment variable when running container:
```bash
docker run -d --name shark-v483 \
  -e GOOGLE_API_KEY="<REDACTED_SET_VIA_ENV>" \
  -e MODEL=gemma-4-26b-it \
  shark-agent-v4.8.3:test
```

---

## IMPORTANT

This API key is for container testing ONLY. Do not commit to git.