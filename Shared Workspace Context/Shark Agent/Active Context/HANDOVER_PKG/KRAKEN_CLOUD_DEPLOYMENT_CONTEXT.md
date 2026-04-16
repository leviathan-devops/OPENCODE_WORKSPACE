# KRAKEN CLOUD: DEPLOYMENT CONTEXT LIBRARY
## Complete Technical Specification for Building Kraken-as-a-Service on Railway with Chat Bot Integration

**Created:** 2026-04-12  
**Version:** v1.0 (Cloud Edition)  
**Purpose:** Deploy Kraken as a hosted service connected to Discord/Mattermost as a bot

---

## PART 1: ARCHITECTURE OVERVIEW

### 1.1 The Cloud Kraken Stack
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KRAKEN CLOUD                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │  User Interface │    │  Bot Bridge      │    │  Kraken Engine         │ │
│  │  (Discord/MM)   │◀──▶│  (Cloud Worker)  │◀──▶│  (Railway Server)      │ │
│  │                 │    │                 │    │                        │ │
│  │  • @kraken      │    │  • Message     │    │  • AsyncDelegation    │ │
│  │    build foo    │    │    Parser       │    │  • Cluster Manager   │ │
│  │  • @kraken      │    │  • Command     │    │  • Shark/Manta       │ │
│  │    test bar     │    │    Router       │    │    Execution         │ │
│  │  • @kraken     │    │  • Result       │    │  • Hive Mind         │ │
│  │    debug baz   │    │    Formatter    │    │    Storage          │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 System Flow Diagram
```
USER (Discord)          BOT BRIDGE              KRAKEN ENGINE           KRAKEN-HIVE
    │                      │                      │                      │
    │ @kraken build app    │                      │                      │
    │─────────────────────▶│ Parse Command        │                      │
    │                      │─────────────────────▶│ Delegate Task        │ │
    │                      │                      │───────────────▶     │ │
    │                      │                      │                      │ Store
    │                      │                      │                      │ Context
    │                      │                      │                      │◀──────
    │                      │                      │                      │
    │                      │              Execute (Shark/Manta)         │
    │                      │              ─────────────────▶       │
    │                      │                      │                      │
    │                      │              Return Result            │
    │                      │              ◀───────────────────      │
    │        Format Reply  │                      │                      │
    │        ◀──��─────────│                      │                      │
    │                     │                      │                      │
    │ [CODE BLOCK]       │                      │                      │
    │────────────────────│                      │                      │
```

---

## PART 2: TECH STACK & REQUIREMENTS

### 2.1 Core Dependencies
```json
{
  "dependencies": {
    "bun": "^1.3.0",
    "express": "^4.18.0",
    "discord.js": "^14.0.0",
    "@mattermost/client": "^5.0.0",
    "opencode-ai": "latest"
  }
}
```

### 2.2 Railway Requirements
| Resource | Requirement | Notes |
|----------|-------------|-------|
| **RAM** | 1GB Minimum | 2GB Recommended for multi-agent |
| **CPU** | 1 vCPU | Sufficient for single task |
| **Disk** | 2GB | For node_modules + logs |
| **Bandwidth** | ~100MB/mo | Chat bot usage |

### 2.3 Environment Variables
```bash
# Required
KRAKEN_API_KEY=sk-..."          # API Key for authentication
DISCORD_BOT_TOKEN=..."          # Discord Bot Token
MATTERMOST_URL=https://..."       # Mattermost Server URL
MATTERMOST_ACCESS_TOKEN=..."     # Mattermost API Token

# Optional
OPENCODE_MODEL=opencode/big-pickle # Override default model
MAX_CONCURRENT_TASKS=3          # Max parallel tasks
SESSION_TIMEOUT_MS=300000        # 5 minute timeout
LOG_LEVEL=info                 # debug|info|warn|error
```

---

## PART 3: BOT BRIDGE IMPLEMENTATION

### 3.1 Project Structure
```
kraken-cloud/
├── src/
│   ├── bot-bridge.ts          # Main entry point
│   ├── bridges/
│   │   ├── discord.ts        # Discord integration
│   │   └── mattermost.ts     # Mattermost integration
│   ├── server/
│   │   ├── index.ts          # Express server
│   │   └── routes.ts        # API endpoints
│   ├── kraken/
│   │   └── client.ts        # Kraken API client
│   └── utils/
│       ├── parser.ts        # Command parser
│       └── formatter.ts     # Result formatter
├── railway.json              # Railway config
├── Dockerfile               # Docker container
├── package.json
└── tsconfig.json
```

### 3.2 Main Server (src/server/index.ts)
```typescript
import express from 'express';
import { KrakenClient } from '../kraken/client.js';
import { setupRoutes } from './routes.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API Routes
const kraken = new KrakenClient({
  apiKey: process.env.KRAKEN_API_KEY!,
  baseUrl: process.env.KRAKEN_ENGINE_URL || 'http://localhost:3001'
});
setupRoutes(app, kraken);

app.listen(port, () => {
  console.log(`[KRAKEN-CLOUD] Server running on port ${port}`);
});
```

### 3.3 Discord Bridge (src/bridges/discord.ts)
```typescript
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { KrakenClient } from '../kraken/client.js';

export class DiscordBridge {
  private client: Client;
  private kraken: KrakenClient;
  private commandPrefix = '!kraken';

  constructor(kraken: KrakenClient, token: string) {
    this.kraken = kraken;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });
  }

  async start() {
    this.client.on(Events.MessageCreate, this.handleMessage.bind(this));
    await this.client.login(process.env.DISCORD_BOT_TOKEN);
    console.log('[DISCORD] Bot connected');
  }

  private async handleMessage(msg: any) {
    // Ignore bots
    if (msg.author.bot) return;
    
    // Check prefix
    if (!msg.content.startsWith(this.commandPrefix)) return;
    
    // Parse command
    const args = msg.content.slice(this.commandPrefix.length).trim().split(' ');
    const command = args.shift()?.toLowerCase();
    const task = args.join(' ');
    
    // Typing indicator
    msg.channel.sendTyping();
    
    try {
      const result = await this.kraken.delegate({
        agent: command === 'test' ? 'manta' : 'shark',
        task: task,
        context: { 
          user: msg.author.username,
          channel: msg.channel.name 
        }
      });
      
      // Format and send result
      await this.sendFormatted(msg, result);
      
    } catch (error) {
      msg.reply(`Error: ${error.message}`);
    }
  }

  private async sendFormatted(msg: any, result: any) {
    // Handle code blocks
    if (result.code) {
      const codeBlock = '```' + result.language + '\n' + result.code + '\n```';
      await msg.reply({ content: result.summary, files: result.files });
      if (result.code.length < 1800) {
        await msg.reply(codeBlock);
      } else {
        await msg.reply(result.files?.[0] || 'Code too long, attached file');
      }
      return;
    }
    
    // Handle errors
    if (result.error) {
      await msg.reply(`❌ ${result.error}`);
      return;
    }
    
    // Default
    await msg.reply(result.summary || JSON.stringify(result, null, 2));
  }
}
```

### 3.4 Kraken Client (src/kraken/client.ts)
```typescript
interface KrakenRequest {
  agent: 'shark' | 'manta' | 'kraken';
  task: string;
  context?: Record<string, any>;
  options?: {
    timeout?: number;
    priority?: 'low' | 'normal' | 'high';
  };
}

interface KrakenResponse {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary?: string;
  code?: string;
  language?: string;
  error?: string;
  files?: Array<{ name: string; content: string }>;
}

export class KrakenClient {
  constructor(private config: { apiKey: string; baseUrl: string }) {}

  async delegate(request: KrakenRequest): Promise<KrakenResponse> {
    const response = await fetch(`${this.config.baseUrl}/delegate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`Kraken API Error: ${response.status}`);
    }
    
    return response.json();
  }

  async getTaskResult(taskId: string): Promise<KrakenResponse> {
    const response = await fetch(`${this.config.baseUrl}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });
    
    return response.json();
  }
}
```

---

## PART 4: RAILWAY DEPLOYMENT

### 4.1 railway.json
```json
{
  "$schema": "https://railway.app/schema.json",
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

### 4.2 Dockerfile
```dockerfile
FROM oven/bun:1.3.11 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY src/ ./src/
COPY kraken-agent/ ./kraken-agent/

# Build Kraken (if needed)
RUN cd kraken-agent && bun run build

# Expose ports
EXPOSE 3000 3001

# Start
CMD ["bun", "run", "src/server/index.ts"]
```

### 4.3 Deployment Commands
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Init project
railway init

# 4. Set environment variables
railway env set KRAKEN_API_KEY=sk-...
railway env set DISCORD_BOT_TOKEN=...

# 5. Deploy
railway up

# 6. Check status
railway status
```

---

## PART 5: MATTERMOST INTEGRATION

### 5.1 Mattermost Bot (src/bridges/mattermost.ts)
```typescript
import { Client } from '@mattermost/client';
import { KrakenClient } from '../kraken/client.js';

export class MattermostBridge {
  private client: Client;
  private kraken: KrakenClient;
  private commandPrefix = '@kraken';

  constructor(kraken: KrakenClient) {
    this.kraken = kraken;
    this.client = new Client({
      url: process.env.MATTERMOST_URL!,
      token: process.env.MATTERMOST_ACCESS_TOKEN!
    });
  }

  async start() {
    await this.client.connect();
    
    this.client.on('messagePosted', async (msg: any) => {
      await this.handleMessage(msg);
    });
    
    console.log('[MATTERMOST] Bot connected');
  }

  private async handleMessage(msg: any) {
    // Ignore bots and system messages
    if (msg.sender_name === 'bot' || !msg.data) return;
    
    const text = msg.data.message;
    
    // Check if mentioned bot
    if (!text.includes('@kraken')) return;
    
    // Parse task (remove @kraken)
    const task = text.replace(/@kraken/, '').trim();
    
    // Send typing
    // (Mattermost doesn't have native typing indicator)
    
    try {
      const result = await this.kraken.delegate({
        agent: 'shark',
        task: task,
        context: { user: msg.sender_name }
      });
      
      await this.sendFormatted(msg, result);
      
    } catch (error) {
      await this.sendError(msg, error.message);
    }
  }

  private async sendFormatted(msg: any, result: any) {
    // Mattermost requires file uploads for code
    if (result.code) {
      await this.client.createIssue({
        channel_id: msg.channel_id,
        file_ids: [/* file ID from upload */]
      });
    }
    
    await this.client.createPost({
      channel_id: msg.channel_id,
      message: `**Summary:** ${result.summary}\n\`\`\`\`\n${result.code?.slice(0, 1500)}\n\`\`\``
    });
  }
}
```

---

## PART 6: KRAKEN ENGINE EDITS

### 6.1 Required Modifications for Cloud Deployment
The current Kraken assumes it runs inside OpenCode. For cloud deployment, you need to:

1. **Port the Tool Layer:**
   Current: Uses OpenCode's `bash`, `write`, `read` tools.
   Cloud: Replace with Node.js `child_process`:

```typescript
// src/kraken-executor.ts (NEW)
import { spawn } from 'child_process';

export async function executeBash(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, { shell: true });
    let output = '';
    
    proc.stdout.on('data', (data) => output += data);
    proc.stderr.on('data', (data) => output += data);
    
    proc.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(output));
    });
  });
}
```

2. **Add API Endpoint Layer:**
```typescript
// src/server/api.ts (NEW)
app.post('/delegate', async (req, res) => {
  const { agent, task, context } = req.body;
  
  const kraken = new KrakenEngine();
  const engine = kraken.getAgent(agent);
  
  const result = await engine.execute(task, { 
    ...context,
    toolExecutor: executeBash // Use cloud executor
  });
  
  res.json(result);
});
```

---

## PART 7: TESTING & VALIDATION

### 7.1 Local Test Script
```bash
# Start server locally
bun run src/server/index.ts

# In another terminal, test Discord
@kraken build a simple hello world express app

# Check logs
tail -f logs/kraken-cloud.log
```

### 7.2 Manual Integration Test
| Test | Expected Result |
|------|----------------|
| `@kraken build hello world` | Returns code file |
| `@kraken test this function` | Returns test results |
| `@kraken debug login bug` | Returns debug analysis |

---

## PART 8: SECURITY CONSIDERATIONS

### 8.1 API Key Management
- Use Railway's environment variable encryption
- Rotate keys monthly
- Never commit keys to git

### 8.2 Rate Limiting
```typescript
// Add to server/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute per user
});

app.use('/delegate', limiter);
```

### 8.3 Cost Control
- Set `MAX_CONCURRENT_TASKS=1` on Railway
- Set `SESSION_TIMEOUT_MS=60000` (1 minute max)
- Monitor Railway dashboard for spend

---

## APPENDIX: QUICK START CHECKLIST

- [ ] Clone Kraken v1.1 repo
- [ ] Add Bot Bridge code (discord.ts, mattermost.ts)
- [ ] Port tool layer to cloud (child_process)
- [ ] Add API endpoint layer
- [ ] Update Dockerfile
- [ ] Create railway.json
- [ ] Create Discord Bot Application
- [ ] Get Discord Bot Token
- [ ] Deploy to Railway
- [ ] Set Environment Variables
- [ ] Invite bot to server
- [ ] Test `@kraken hello`

---

**END OF CONTEXT LIBRARY**
*This specification is ready for immediate implementation.*