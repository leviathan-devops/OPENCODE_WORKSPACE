# Mattermost-OpenCode-Manta Integration: Build Workflow & PoC

## Overview

This document describes the architecture and build workflow for integrating OpenCode coding agents (specifically Manta Agent) with Mattermost, using Mattermost as a frontend UI for AI-assisted coding sessions.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          MATTERMOST CLOUD (Railway)                                 │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────────────┐  │
│  │ kraken-factory  │    │ manta-factory    │    │ @manta mention triggers        │  │
│  │ channel         │    │ channel          │    │ per-channel agent session      │  │
│  └────────┬────────┘    └────────┬─────────┘    └─────────────────────────────────┘  │
│           │                      │                                                     │
│           └──────────────────────┼─────────────────────────────────────────────────   │
│                                  ▼ WebSocket                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                     MATTERMOST BOT ADAPTER                                       │ │
│  │  - Real-time @mention detection                                                 │ │
│  │  - Per-channel session routing                                                  │ │
│  │  - Message normalization (strip @mention, extract command)                       │ │
│  │  - File attachment handling                                                     │ │
│  └────────────────────────────────┬────────────────────────────────────────────────┘ │
└──────────────────────────────────┼──────────────────────────────────────────────────┘
                                   │ HTTP/WebSocket
┌──────────────────────────────────┼──────────────────────────────────────────────────┐
│                     OPENCODE BRIDGE SERVICE                                          │
│  ┌─────────────────┐  ┌────────┴────────┐  ┌─────────────────────────────────────┐ │
│  │  Session Store   │  │  Message Router │  │  Container Spawner                 │ │
│  │  (Redis)         │──│  (per-channel)  │──│  (Docker containers per agent)     │ │
│  │                  │  │                 │  │                                     │ │
│  │  - channel_id    │  │  Routes to     │  │  - manta-agent plugin              │ │
│  │  - workspace     │  │  correct agent  │  │  - plugin config per channel       │ │
│  │  - plugin config │  │  container      │  │  - stdin/stdout bridge             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────────────┘ │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                     DOCKER CONTAINERS (Per Channel)                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │ │
│  │  │ manta-factory   │  │ kraken-factory  │  │ shark-alpha     │                │ │
│  │  │ container       │  │ container       │  │ container       │                │ │
│  │  │                 │  │                 │  │                 │                │ │
│  │  │ /workspace/     │  │ /workspace/     │  │ /workspace/     │                │ │
│  │  │ channel-xxx     │  │ channel-yyy     │  │ channel-zzz     │                │ │
│  │  │                 │  │                 │  │                 │                │ │
│  │  │ OpenCode +      │  │ OpenCode +      │  │ OpenCode +      │                │ │
│  │  │ manta-agent     │  │ kraken-agent    │  │ shark-agent     │                │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

## Build Workflow

### Phase 1: Mattermost Bot Setup

1. **Create Mattermost Bot Account**
   - Go to Mattermost System Console → Integrations → Bot Accounts
   - Create bot with username `manta-bot` (or similar)
   - Copy the bot token immediately (shown only once)

2. **Get Channel IDs**
   - Enable Developer Mode in Mattermost
   - Right-click on channel → View Info → Copy Channel ID
   - Note: `kraken-factory` channel ID needed for initial test

3. **Environment Variables**
   ```bash
   MATTERMOST_URL=https://mattermost-production-a9b9.up.railway.app
   MATTERMOST_TOKEN=your-bot-token-here
   MATTERMOST_ALLOWED_USERS=leviathan
   ```

### Phase 2: OpenCode Bridge Service

The bridge service handles:
- Mattermost WebSocket connection
- Session management (Redis)
- Container spawning
- Message routing

```bash
# Build the bridge service
cd projects/mattermost-opencode-manta
docker build -f docker/Dockerfile.bridge -t mattermost-opencode-bridge .

# Run locally for testing
docker run -p 5000:5000 \
  -e MATTERMOST_URL=https://mattermost-production-a9b9.up.railway.app \
  -e MATTERMOST_TOKEN=$MATTERMOST_TOKEN \
  -e REDIS_HOST=redis \
  -v /var/run/docker.sock:/var/run/docker.sock \
  mattermost-opencode-bridge
```

### Phase 3: Container Spawner Configuration

Each channel gets its own Docker container with specific plugins:

```json
{
  "channel_id": "kraken-factory",
  "channel_name": "kraken-factory",
  "agent_type": "manta",
  "plugins": ["manta-agent-v1.5"],
  "workspace": "/workspace/channels/kraken-factory",
  "model": "minimax/MiniMax-M2.7"
}
```

Container spawn command:
```bash
docker run -d \
  --name opencode-manta-kraken-factory \
  -v /workspace/channels/kraken-factory:/workspace \
  -e OPENCODE_AGENT=manta \
  -e OPENCODE_PLUGINS=manta-agent-v1.5 \
  -e OPENCODE_MODEL=minimax/MiniMax-M2.7 \
  opencode-ai/opencode
```

### Phase 4: Railway Deployment

1. **Connect GitHub Repository**
2. **Configure Environment Variables**
3. **Set Resource Sizes**
4. **Deploy**

## Component Specifications

### 1. Mattermost WebSocket Listener (`src/mattermost/`)

**File: `mattermost_ws.ts`**

Responsibilities:
- Connect to Mattermost WebSocket at `wss://<url>/api/v4/websocket`
- Authenticate with bot token
- Listen for `posted` events
- Filter for @mentions of the bot
- Extract message content (strip @mention)
- Route messages to bridge

Key Events:
```typescript
interface MattermostEvent {
  event: 'posted' | 'user_added' | 'user_removed';
  data: {
    channel_id: string;
    channel_type: 'D' | 'O' | 'P' | 'G';
    post: string; // JSON stringified post object
    sender_name: string;
  };
}
```

### 2. Session Manager (`src/session/`)

**File: `session_manager.ts`**

Responsibilities:
- Create/get session per channel
- Store session state in Redis
- Map channel_id → container_id
- Handle session timeout (30 min idle)

```typescript
interface ChannelSession {
  session_id: string;
  channel_id: string;
  channel_name: string;
  container_id: string;
  container_name: string;
  agent_type: 'manta' | 'shark' | 'spider';
  plugins: string[];
  workspace_path: string;
  created_at: number;
  last_activity: number;
  status: 'active' | 'idle' | 'stopped';
}
```

### 3. Container Spawner (`src/opencode/`)

**File: `container_spawner.ts`**

Responsibilities:
- Spawn Docker containers with OpenCode + plugins
- Mount channel-specific workspace volumes
- Set environment variables for plugin loading
- Stream stdout/stderr back to bridge
- Handle container lifecycle (start, stop, restart, remove)

Container Configuration:
```typescript
interface ContainerConfig {
  name: string;           // opencode-{agent}-{channel}
  image: string;         // opencodeai/opencode:latest
  workspace: string;     // /workspace/channels/{channel}
  env: Record<string, string>;
  plugins: string[];     // ['manta-agent-v1.5']
  model: string;         // 'minimax/MiniMax-M2.7'
}
```

### 4. Message Bridge (`src/bridge/`)

**File: `message_bridge.ts`**

Responsibilities:
- Receive normalized messages from Mattermost WS listener
- Forward to correct container (via stdin)
- Stream container output (via stdout/stderr)
- Send responses back to Mattermost channel
- Handle streaming responses (chunked)

Message Flow:
```
Mattermost → @mention → WS Listener → Session Manager → Container stdin
Container stdout → Bridge → Mattermost Channel ← @manta response
```

### 5. Command Parser (`src/bridge/`)

**File: `command_parser.ts`**

Supported commands:
```
@manta help                    - Show available commands
@manta status                  - Show current session status
@manta reset                   - Reset session context
@manta agent <type>            - Switch agent type (manta/shark/spider)
/manta help                    - Alternative slash command
/manta code <description>      - Generate code
/manta review                  - Review workspace
/manta plan <task>             - Create implementation plan
```

## Environment Variables

### Required
```bash
MATTERMOST_URL=https://mattermost-production-a9b9.up.railway.app
MATTERMOST_TOKEN=<bot-token>
MATTERMOST_ALLOWED_USERS=leviathan
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Optional
```bash
OPENCODE_IMAGE=opencodeai/opencode:latest
DEFAULT_AGENT=manta
DEFAULT_PLUGINS=manta-agent-v1.5
DEFAULT_MODEL=minimax/MiniMax-M2.7
SESSION_TIMEOUT=1800  # 30 minutes
MAX_CONTAINERS=10
```

## File Structure

```
projects/mattermost-opencode-manta/
├── BUILD_WORKFLOW.md           # This document
├── README.md                   # Quick start guide
├── docker/
│   ├── Dockerfile.bridge       # Bridge service container
│   └── Dockerfile.opencode     # OpenCode container (if custom image needed)
├── railway/
│   ├── railway.json            # Railway deployment config
│   └── Dockerfile              # Railway Dockerfile
├── config/
│   ├── channel-defaults.json   # Default plugin/agent per channel
│   └── allowed-users.json      # List of allowed Mattermost users
├── src/
│   ├── mattermost/
│   │   ├── mattermost_ws.ts    # WebSocket listener
│   │   ├── mattermost_http.ts  # HTTP API client
│   │   └── types.ts            # Mattermost type definitions
│   ├── session/
│   │   ├── session_manager.ts  # Redis-backed session store
│   │   └── types.ts            # Session type definitions
│   ├── opencode/
│   │   ├── container_spawner.ts # Docker container management
│   │   ├── container_pool.ts    # Container pool manager
│   │   └── types.ts            # OpenCode container types
│   └── bridge/
│       ├── message_bridge.ts   # Main bridge logic
│       ├── command_parser.ts    # @mention command parsing
│       └── response_formatter.ts # Format responses for Mattermost
├── package.json
└── tsconfig.json
```

## Railway Deployment Steps

### 1. Prepare Repository
```bash
cd projects/mattermost-opencode-manta
git init
git add .
git commit -m "Initial commit: Mattermost-OpenCode-Manta PoC"
git remote add origin https://github.com/leviathan/mattermost-opencode-manta.git
git push -u origin main
```

### 2. Create Railway Project
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login
railway login

# Create project
railway init

# Link to repository
railway link <project-id>
```

### 3. Configure Environment
```bash
# Set environment variables
railway env set MATTERMOST_URL=https://mattermost-production-a9b9.up.railway.app
railway env set MATTERMOST_TOKEN=<token>
railway env set REDIS_HOST=redis
railway env set REDIS_PORT=6379

# Add plugin from opencode.json
railway env set OPENCODE_PLUGINS=manta-agent-v1.5
```

### 4. Configure Railway
Create `railway/railway.json`:
```json
{
  "$schema": "https://railway.app/schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 5. Deploy
```bash
railway up
railway status
railway logs
```

## Testing

### Local Testing with Docker Compose

```bash
cd projects/mattermost-opencode-manta

# Start Redis and Bridge
docker compose -f docker/docker-compose.local.yml up -d

# Check logs
docker compose -f docker/docker-compose.local.yml logs -f

# Test Mattermost connection
curl http://localhost:5000/health

# Send test message (simulate Mattermost webhook)
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "kraken-factory",
    "user_id": "leviathan",
    "message": "@manta help"
  }'
```

### Mattermost Channel Testing

1. Go to `https://mattermost-production-a9b9.up.railway.app/leviathan-devops/channels/kraken-factory`
2. Invite the bot to the channel (if not already)
3. Send `@manta help`
4. Bot should respond with help text

### Container Verification

```bash
# List active containers
docker ps | grep opencode-

# Check container logs
docker logs opencode-manta-kraken-factory

# Exec into container
docker exec -it opencode-manta-kraken-factory /bin/sh

# Check OpenCode version inside container
opencode --version
```

## Troubleshooting

### Bot Not Responding
1. Check bot is added to channel
2. Verify MATTERMOST_TOKEN is correct
3. Check WebSocket connection: `docker logs <bridge-container> | grep websocket`
4. Verify @mention syntax is correct

### Container Not Spawning
1. Check Docker socket is mounted: `-v /var/run/docker.sock:/var/run/docker.sock`
2. Verify OpenCode image exists: `docker pull opencodeai/opencode`
3. Check container logs: `docker logs opencode-manta-<channel>`

### Session Timeout
- Sessions auto-timeout after 30 minutes of inactivity
- Send any message to reactivate
- Adjust `SESSION_TIMEOUT` env var if needed

### Message Loop (Bot responding to itself)
- The bot ignores its own messages by user_id check
- Ensure `MATTERMOST_REQUIRE_MENTION=true` in config

## Security Considerations

1. **Token Security**: Never commit MATTERMOST_TOKEN to git
2. **User Allowlist**: Set `MATTERMOST_ALLOWED_USERS` to restrict access
3. **Container Isolation**: Each channel has isolated workspace
4. **Rate Limiting**: Implement per-user rate limits in production

## Future Enhancements

1. **Slash Commands**: Register `/manta` as native Mattermost slash command
2. **File Attachments**: Upload files to workspace before processing
3. **Multi-Agent**: Support multiple agent types per channel
4. **Persistence**: Save session state for resume after restart
5. **Streaming**: Real-time token streaming in Mattermost
6. **Threading**: Reply in threads for cleaner channel
