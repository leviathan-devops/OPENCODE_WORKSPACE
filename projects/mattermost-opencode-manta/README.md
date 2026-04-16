# Mattermost-OpenCode-Manta Integration

Use Mattermost as a frontend UI for OpenCode coding agents, with Manta Agent as the initial target.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker
- Redis
- Mattermost bot token

### Setup

1. **Create Mattermost Bot**
   - Go to Mattermost → System Console → Integrations → Bot Accounts
   - Create bot with username `opencode-bot`
   - Copy the bot token

2. **Get Channel ID**
   - Enable Developer Mode in Mattermost
   - Right-click channel → View Info → Copy Channel ID

3. **Configure Environment**
   ```bash
   export MATTERMOST_URL=https://mattermost-production-a9b9.up.railway.app
   export MATTERMOST_TOKEN=your-bot-token-here
   export MATTERMOST_BOT_USERNAME=opencode-bot
   export MATTERMOST_ALLOWED_USERS=leviathan
   export REDIS_HOST=localhost
   export REDIS_PORT=6379
   ```

4. **Build and Run**
   ```bash
   npm install
   npm run build
   npm start
   ```

5. **Test in Mattermost**
   - Go to your channel
   - Invite the bot: `/invite @opencode-bot`
   - Send `@opencode-bot help`

## Architecture

```
Mattermost → WebSocket → Bridge Service → Docker Container (OpenCode + Agent)
                              ↓
                           Redis (Session Store)
```

## Commands

| Command | Description |
|---------|-------------|
| `@manta help` | Show available commands |
| `@manta status` | Show session status |
| `@manta reset` | Reset session context |
| `@manta agent <type>` | Switch agent type |
| `@manta code <desc>` | Generate code |
| `@manta plan <task>` | Create implementation plan |
| `@manta review` | Review workspace |

## Supported Agents

- **Manta** - Precision engineer with dual-brain architecture
- **Shark** - Steamroll engineer for aggressive tasks
- **Spider** - 11-agent orchestrator for complex builds

## Railway Deployment

```bash
# Create Railway project
railway init

# Set environment variables
railway env set MATTERMOST_URL=https://mattermost-production-a9b9.up.railway.app
railway env set MATTERMOST_TOKEN=<token>

# Deploy
railway up
```

## Local Development

```bash
# Start Redis and Bridge
docker compose -f docker/docker-compose.local.yml up -d

# Check logs
docker compose -f docker/docker-compose.local.yml logs -f

# Test health
curl http://localhost:5000/health
```

## Project Structure

```
projects/mattermost-opencode-manta/
├── src/
│   ├── main.ts                    # Entry point
│   ├── mattermost/               # Mattermost WS/HTTP
│   ├── session/                  # Session management
│   ├── opencode/                 # Container spawner
│   └── bridge/                   # Message bridge
├── config/                       # Channel configs
├── docker/                        # Docker files
├── railway/                      # Railway config
├── BUILD_WORKFLOW.md             # Detailed build workflow
└── README.md
```

## License

MIT
