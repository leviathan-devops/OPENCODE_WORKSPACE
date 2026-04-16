# HERMES-CLOUD_LHANDOVER_PACKAGE_HERMES-2ND-BRAIN

## Purpose
Deploy **real Hermes Agent** (the actual AI brain with memories, skills, profile) to Railway cloud as a 24/7 service with web UI chat interface.

**THIS IS NOT A CHATBOT WRAPPER.** This is deploying the actual Hermes Agent that:
- Has full 2nd-brain identity (SOUL.md)
- Has access to memories, skills, sessions
- Uses real AI models (MiniMax, OpenRouter, etc.)
- Is the same Hermes running locally on your device

## Architecture Goal

```
                    ┌─────────────────────────────────────┐
                    │           RAILWAY CLOUD             │
                    │                                     │
   Telegram ──────►│  ┌─────────────────────────────┐    │
                    │  │    Hermes Agent (REAL)      │    │
                    │  │  - 2nd-brain identity      │    │
   Web UI ─────────►│  │  - Memories/Skills        │    │
                    │  │  - AI Model integration   │    │
                    │  │  - Web UI server          │    │
                    │  └─────────────────────────────┘    │
                    │              │                       │
                    │              ▼                       │
                    │  ┌─────────────────────────────┐    │
                    │  │  Persistent Volume          │    │
                    │  │  /opt/data (memories,      │    │
                    │  │  sessions, skills)          │    │
                    │  └─────────────────────────────┘    │
                    └─────────────────────────────────────┘
```

## Key Clarification

**"Wrap Hermes Agent"** means:
- Build a FastAPI web server that:
  1. Runs Hermes Agent as a subprocess
  2. Exposes web UI for chat interface
  3. Routes AI requests TO Hermes Agent (not a separate chatbot)
  4. Maintains session state via Hermes

**NOT** a chatbot that pretends to be Hermes but is actually just an API call to MiniMax.

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Local Hermes 2nd-brain | ✅ Working | Your device runs the real Hermes |
| Telegram Polling | ✅ Restored | Deleted webhook, local gateway polls |
| Context Sync | ✅ Enabled | Synthesizer running |
| Cloud Hermes | ❌ Failed | Railway deployments fail silently |
| Railway Chatbot | ⚠️ Stub | Webhook receiver, NOT real Hermes |

## Problem to Solve

Railway deployments of Hermes Agent keep failing:
- Build succeeds
- Container exits immediately
- No useful error logs
- CLI has linking issues

## Files in This Package

```
HERMES-CLOUD_LHANDOVER_PACKAGE_HERMES-2ND-BRAIN/
├── README.md                    # This file
├── layers/
│   ├── layer-1-OBJECTIVE.md     # What we're building
│   ├── layer-2-DEPLOYMENT.md    # Railway deployment steps
│   └── layer-3-TROUBLESHOOTING.md
├── references/
│   ├── DOCKERFILE               # Working Dockerfile
│   ├── ENTRYPOINT.sh           # Working entrypoint
│   ├── RAILWAY_CONFIG.json     # Railway project IDs
│   └── PREVIOUS_ATTEMPTS.md    # Debug log
├── cases/
│   └── WEB_UI_INTEGRATION.md   # How web UI connects to Hermes
└── files/
    └── cloud-hermes/           # Source code directory
```

## Success Criteria

1. ✅ Hermes Agent deployed on Railway (not a wrapper)
2. ✅ Web UI accessible at railway.app URL
3. ✅ Real AI responses (routing through Hermes Agent)
4. ✅ Persistent memories across restarts
5. ✅ THEN add Telegram integration

## Railway Project Info

- Project: `Hermes Cloud` ID `84255eda-87ac-4e98-81b6-c5a763099162`
- Telegram Bridge Service: `3ab28d58-049f-4012-9a3c-2ee5aaa2075b`
- GitHub: `leviathan-devops/cloud-hermes`
- Docker Image: `ghcr.io/leviathan-devops/cloud-hermes:build` (works locally)

## Next Agent Tasks

See `layers/layer-2-DEPLOYMENT.md` for step-by-step deployment instructions.
