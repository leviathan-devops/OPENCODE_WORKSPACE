# HERMES-CLOUD_SSH_HANDOVER_PACKAGE_HERMES-2ND-BRAIN

## The SSH Approach

Instead of fighting Railway's container deployment issues, deploy Hermes to a **cloud VM with SSH access**.

```
Phone (Shelly app)
      │
      │ SSH (port 22)
      ▼
Cloud VM (Linux + Public IP)
      │
      │ Local commands
      ▼
Hermes Agent running on VM
```

## Why SSH Is Better Than Railway Web App

| Aspect | Railway (Failed) | SSH (This Approach) |
|--------|-----------------|---------------------|
| Connection | HTTPS requests | SSH client |
| Auth | API tokens | SSH keys |
| Session | Stateless requests | Persistent terminal |
| Complexity | Docker + web app + TLS | Just SSH server |
| Phone access | Web browser | Shelly app (terminal) |
| Context | Must implement session storage | Just works in terminal |
| Container issues | Fails silently | No containers needed |

## What We Need

1. **Cloud VM** with public IP (~$5-10/month)
   - DigitalOcean
   - Hetzner
   - Oracle Cloud Free Tier
   - AWS/GCP free tiers

2. **SSH access configured**
   - OpenSSH server installed
   - SSH key added to `~/.ssh/authorized_keys`

3. **Hermes installed on VM**
   - Clone Hermes repo
   - Install dependencies
   - Run `hermes gateway run`

4. **From phone**
   - Shelly app (iOS SSH client)
   - Connect to VM IP
   - Type `hermes` and go

## Architecture

```
┌─────────────────────────────────────────┐
│           Cloud VM (Linux)              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Hermes Agent (Real)            │   │
│  │  - 2nd-brain identity          │   │
│  │  - Memories, Skills, Sessions   │   │
│  │  - Telegram polling (optional)  │   │
│  └─────────────────────────────────┘   │
│              ▲                         │
│              │ SSH                      │
└──────────────┼─────────────────────────┘
               │
      ┌────────┴────────┐
      │  Shelly (iOS)   │
      │  or any SSH     │
      │  client         │
      └─────────────────┘
```

## NOT a Chatbot Wrapper

This is **real Hermes Agent** running on the cloud VM:
- Full 2nd-brain identity
- Access to all memories, skills, sessions
- Same AI brain as local device
- Context persists in terminal session

## Next Steps for Spider Agent

See `layers/layer-2-DEPLOYMENT.md` for step-by-step VM setup.
