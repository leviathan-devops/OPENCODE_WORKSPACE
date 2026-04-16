# Layer 1: Objective

## Mission
Deploy **real Hermes Agent** to Railway cloud - the exact same Hermes running locally on the user's device, not a chatbot pretending to be Hermes.

## What Hermes Agent IS

Hermes Agent is:
- A Python-based AI agent framework
- With persistent memory, skills, profiles
- CLI tool: `hermes chat`, `hermes gateway`
- Identity defined by `SOUL.md`
- Memory stored in `~/.hermes/profiles/2nd-brain/`
- Skills in `~/.hermes/profiles/2nd-brain/skills/`

## What Hermes Agent is NOT

- NOT a simple chatbot wrapper
- NOT a FastAPI app that calls an AI API
- NOT a "smart buffer" that just echoes responses

## Deployment Architecture

```
Railway Container
├── Hermes Agent binary (Python CLI)
├── Hermes Agent Python packages
├── HERMES_HOME=/opt/data (persistent volume)
│   ├── sessions/     (conversation history)
│   ├── memories/     (long-term memory)
│   ├── skills/      (agent capabilities)
│   ├── SOUL.md      (2nd-brain identity)
│   └── config.yaml  (profile configuration)
└── Web UI Server (FastAPI)
    └── Routes chat → Hermes Agent subprocess → response
```

## Why This Matters

Current Railway "chatbot" is:
- Just a webhook receiver + MiniMax API caller
- No access to Hermes memories
- No Hermes identity
- No skills
- Just "AI API wrapper"

Real Hermes on Railway would be:
- Same AI brain as local device
- Full context of user's life/work
- Access to all skills
- Persistent memory
- Real 2nd-brain identity

## Success Criteria

1. Container runs Hermes Agent (not a mock)
2. Web UI connects to real Hermes subprocess
3. AI responses come from Hermes (with full context)
4. Memories persist across deployments
5. THEN add Telegram integration (as a platform, not a replacement)

## Anti-Goals (What NOT to Build)

- NOT a "chatbot that uses MiniMax API"
- NOT a "Telegram bot with AI responses"
- NOT a "web interface to a language model"

These already exist and user is frustrated with them.
