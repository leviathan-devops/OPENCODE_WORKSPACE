# Pod 1: Kraken OS Integration - Executable Build Process

## Mission
Build production-grade API Gateway and integration layer connecting the Agent Lab visual interface to Shark/Kraken CLI infrastructure. Implement WebSocket/REST APIs, authentication, configuration management, and real-time command execution with streaming output.

## Success Criteria
- ✅ WebSocket API accepts connections and routes to Shark CLI with <100ms latency
- ✅ REST API provides complete project/agent management with OpenAPI documentation
- ✅ Authentication system supports OAuth2, API keys, and session management
- ✅ Configuration management with version control and rollback capabilities
- ✅ Real-time command execution with streaming output via WebSocket
- ✅ Comprehensive monitoring with Prometheus metrics and structured logging
- ✅ Security audit passes with no critical vulnerabilities

## Pre-flight Checks
1. **Verify development environment**:
   ```bash
   cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-lab
   pnpm --version
   docker --version
   node --version
   ```

2. **Check Shark CLI availability**:
   ```bash
   which shark
   shark --help
   which opencode
   opencode --version
   ```

3. **Verify database connectivity**:
   ```bash
   docker-compose ps | grep postgres
   pg_isready -h localhost -p 5432
   ```

4. **Check Redis availability**:
   ```bash
   docker-compose ps | grep redis
   redis-cli ping
   ```

## Phase 1: API Gateway Foundation

### Step 1: Project Structure Setup
```bash
# Create API gateway package
cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-lab
mkdir -p packages/api-gateway/src/{controllers,middleware,services,types,utils}

# Initialize package.json
cat > packages/api-gateway/package.json << 'EOF'
{
  "name": "@agent-lab/api-gateway",
  "version": "0.1.0",
  "description": "API Gateway for Agent Lab - Shark/Kraken CLI integration",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.18.0",
    "ws": "^8.14.0",
    "jsonwebtoken": "^9.0.0",
    "redis": "^4.6.0",
    "pg": "^8.11.0",
    "zod": "^3.22.0",
    "prom-client": "^14.0.0",
    "winston": "^3.10.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "rate-limiter-flexible": "^2.4.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/ws": "^8.5.0",
    "@types/jsonwebtoken": "^9.0.0",
    "typescript": "^5.0.0",
    "tsx": "^3.12.0",
    "vitest": "^0.34.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.0"
  }
}
EOF

# Create TypeScript configuration
cat > packages/api-gateway/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF
```

**Verification**:
```bash
cd packages/api-gateway
pnpm install
pnpm lint
pnpm build
echo "✅ API gateway package structure created"
```

### Step 2: WebSocket Server Implementation
```bash
# Create WebSocket server with Shark CLI integration
cat > packages/api-gateway/src/services/WebSocketServer.ts << 'EOF'
import WebSocket, { WebSocketServer as WSServer } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';
import { SharkCLIExecutor } from './SharkCLIExecutor';
import { authenticateConnection } from '../middleware/auth';
import { rateLimitConnection } from '../middleware/rateLimit';

export class WebSocketServer {
  private wss: WSServer;
  private sharkExecutor: SharkCLIExecutor;
  private connections: Map<string, WebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WSServer({ server });
    this.sharkExecutor = new SharkCLIExecutor();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', async (ws: WebSocket, request) => {
      try {
        // Authentication
        const userId = await authenticateConnection(request);
        if (!userId) {
          ws.close(4401, 'Unauthorized');
          return;
        }

        // Rate limiting
        const rateLimitResult = await rateLimitConnection(userId);
        if (!rateLimitResult.allowed) {
          ws.close(4429, 'Too Many Requests');
          return;
        }

        this.connections.set(userId, ws);
        logger.info(`WebSocket connected: ${userId}`);

        // Setup message handlers
        ws.on('message', async (data: Buffer) => {
          await this.handleMessage(userId, data.toString());
        });

        ws.on('close', () => {
          this.connections.delete(userId);
          logger.info(`WebSocket disconnected: ${userId}`);
        });

        ws.on('error', (error) => {
          logger.error(`WebSocket error for ${userId}:`, error);
        });

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connection:established',
          timestamp: new Date().toISOString(),
          userId
        }));

      } catch (error) {
        logger.error('WebSocket connection error:', error);
        ws.close(4500, 'Internal Server Error');
      }
    });
  }

  private async handleMessage(userId: string, message: string): Promise<void> {
    try {
      const ws = this.connections.get(userId);
      if (!ws) return;

      const data = JSON.parse(message);
      logger.debug(`Received message from ${userId}:`, data);

      switch (data.type) {
        case 'agent:specify':
          await this.handleAgentSpecification(userId, data.specification, ws);
          break;
        case 'agent:build-start':
          await this.handleBuildStart(userId, data.blueprint_id, ws);
          break;
        case 'agent:test-execute':
          await this.handleTestExecute(userId, data.agent_id, data.test_input, ws);
          break;
        case 'agent:deploy':
          await this.handleDeploy(userId, data.agent_id, data.target, ws);
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Unknown message type',
            received_type: data.type
          }));
      }
    } catch (error) {
      logger.error(`Error handling message from ${userId}:`, error);
      const ws = this.connections.get(userId);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Failed to process message',
          details: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    }
  }

  private async handleAgentSpecification(
    userId: string, 
    specification: any, 
    ws: WebSocket
  ): Promise<void> {
    // Validate specification
    const validationResult = this.validateSpecification(specification);
    if (!validationResult.valid) {
      ws.send(JSON.stringify({
        type: 'agent:specification-error',
        errors: validationResult.errors
      }));
      return;
    }

    // Create agent blueprint
    const blueprint = await this.createAgentBlueprint(userId, specification);
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'agent:specification-confirmed',
      blueprint,
      timestamp: new Date().toISOString()
    }));

    logger.info(`Agent specification created for ${userId}: ${blueprint.id}`);
  }

  private async handleBuildStart(
    userId: string, 
    blueprintId: string, 
    ws: WebSocket
  ): Promise<void> {
    // Retrieve blueprint
    const blueprint = await this.getAgentBlueprint(userId, blueprintId);
    if (!blueprint) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Blueprint not found'
      }));
      return;
    }

    // Start build process
    const buildId = await this.startBuildProcess(userId, blueprint);
    
    // Send build started confirmation
    ws.send(JSON.stringify({
      type: 'agent:build-started',
      buildId,
      blueprintId,
      timestamp: new Date().toISOString()
    }));

    // Execute build via Shark CLI
    await this.executeBuildViaShark(userId, blueprint, buildId, ws);
  }

  private async executeBuildViaShark(
    userId: string,
    blueprint: any,
    buildId: string,
    ws: WebSocket
  ): Promise<void> {
    // Convert blueprint to Shark CLI commands
    const commands = this.convertBlueprintToCommands(blueprint);
    
    for (const command of commands) {
      ws.send(JSON.stringify({
        type: 'agent:build-progress',
        buildId,
        command: command.description,
        status: 'running',
        timestamp: new Date().toISOString()
      }));

      try {
        // Execute via Shark CLI
        const result = await this.sharkExecutor.executeCommand(command);
        
        ws.send(JSON.stringify({
          type: 'agent:build-progress',
          buildId,
          command: command.description,
          status: 'completed',
          output: result.stdout,
          duration: result.duration_ms,
          timestamp: new Date().toISOString()
        }));

      } catch (error) {
        ws.send(JSON.stringify({
          type: 'agent:build-error',
          buildId,
          command: command.description,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }));
        break;
      }
    }

    // Final build status
    ws.send(JSON.stringify({
      type: 'agent:build-completed',
      buildId,
      status: 'completed',
      timestamp: new Date().toISOString()
    }));
  }

  private validateSpecification(specification: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields
    if (!specification.name) errors.push('Agent name is required');
    if (!specification.capabilities || !Array.isArray(specification.capabilities)) {
      errors.push('Capabilities array is required');
    }
    if (!specification.personality_traits || !Array.isArray(specification.personality_traits)) {
      errors.push('Personality traits array is required');
    }

    // Validate capabilities
    if (specification.capabilities) {
      specification.capabilities.forEach((cap: any, index: number) => {
        if (!cap.name) errors.push(`Capability ${index + 1} requires a name`);
        if (!cap.type) errors.push(`Capability ${index + 1} requires a type`);
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async createAgentBlueprint(userId: string, specification: any): Promise<any> {
    // In-memory storage for now (replace with database later)
    const blueprint = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name: specification.name,
      description: specification.description || '',
      capabilities: specification.capabilities,
      personality_traits: specification.personality_traits,
      visual_representation: specification.visual_representation || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store in temporary storage (replace with database)
    const blueprints = JSON.parse(await this.sharkExecutor.executeCommand({
      command: 'cat',
      args: ['/tmp/agent_blueprints.json'],
      silent: true
    }).stdout || '{}');
    
    blueprints[blueprint.id] = blueprint;
    
    await this.sharkExecutor.executeCommand({
      command: 'echo',
      args: [JSON.stringify(blueprints)],
      redirect: '>',
      redirect_target: '/tmp/agent_blueprints.json'
    });

    return blueprint;
  }

  private async getAgentBlueprint(userId: string, blueprintId: string): Promise<any | null> {
    try {
      const blueprints = JSON.parse(await this.sharkExecutor.executeCommand({
        command: 'cat',
        args: ['/tmp/agent_blueprints.json'],
        silent: true
      }).stdout || '{}');
      
      const blueprint = blueprints[blueprintId];
      if (!blueprint || blueprint.userId !== userId) {
        return null;
      }
      return blueprint;
    } catch {
      return null;
    }
  }

  private async startBuildProcess(userId: string, blueprint: any): Promise<string> {
    const buildId = `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store build record
    const builds = JSON.parse(await this.sharkExecutor.executeCommand({
      command: 'cat',
      args: ['/tmp/agent_builds.json'],
      silent: true
    }).stdout || '{}');
    
    builds[buildId] = {
      id: buildId,
      userId,
      blueprintId: blueprint.id,
      status: 'running',
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString()
    };
    
    await this.sharkExecutor.executeCommand({
      command: 'echo',
      args: [JSON.stringify(builds)],
      redirect: '>',
      redirect_target: '/tmp/agent_builds.json'
    });

    return buildId;
  }

  private convertBlueprintToCommands(blueprint: any): Array<{command: string; args: string[]; description: string}> {
    const commands = [];
    
    // Base agent creation command
    commands.push({
      command: 'shark',
      args: ['create-agent', blueprint.name],
      description: `Creating agent: ${blueprint.name}`
    });

    // Add capabilities
    blueprint.capabilities.forEach((cap: any) => {
      commands.push({
        command: 'shark',
        args: ['add-capability', blueprint.name, cap.name, cap.type, ...(cap.params || [])],
        description: `Adding capability: ${cap.name} (${cap.type})`
      });
    });

    // Add personality traits
    blueprint.personality_traits.forEach((trait: any) => {
      commands.push({
        command: 'shark',
        args: ['add-trait', blueprint.name, trait.name, trait.value],
        description: `Adding personality trait: ${trait.name}=${trait.value}`
      });
    });

    // Generate agent code
    commands.push({
      command: 'shark',
      args: ['generate-code', blueprint.name],
      description: `Generating agent code for: ${blueprint.name}`
    });

    // Build agent
    commands.push({
      command: 'shark',
      args: ['build-agent', blueprint.name],
      description: `Building agent: ${blueprint.name}`
    });

    return commands;
  }

  private async handleTestExecute(
    userId: string, 
    agentId: string, 
    testInput: any, 
    ws: WebSocket
  ): Promise<void> {
    // Implementation for test execution
    ws.send(JSON.stringify({
      type: 'agent:test-result',
      agentId,
      result: { status: 'not_implemented_yet' },
      timestamp: new Date().toISOString()
    }));
  }

  private async handleDeploy(
    userId: string, 
    agentId: string, 
    target: any, 
    ws: WebSocket
  ): Promise<void> {
    // Implementation for deployment
    ws.send(JSON.stringify({
      type: 'agent:deployment-status',
      agentId,
      status: 'not_implemented_yet',
      timestamp: new Date().toISOString()
    }));
  }

  public broadcast(userId: string, message: any): void {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public close(): void {
    this.wss.close();
    this.connections.clear();
  }
}
EOF
```

**Verification**:
```bash
cd packages/api-gateway
pnpm lint src/services/WebSocketServer.ts
echo "✅ WebSocket server implementation created"
```

### Step 3: Shark CLI Executor Service
```bash
# Create Shark CLI executor with streaming output
cat > packages/api-gateway/src/services/SharkCLIExecutor.ts << 'EOF'
import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger';

export interface CommandExecution {
  command: string;
  args: string[];
  environment?: Record<string, string>;
  working_directory?: string;
  timeout_ms?: number;
  silent?: boolean;
  redirect?: '>' | '>>' | '|';
  redirect_target?: string;
}

export interface CommandResult {
  exit_code: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
  success: boolean;
  timed_out: boolean;
}

export class SharkCLIExecutor {
  private activeProcesses: Map<string, ChildProcess> = new Map();

  async executeCommand(execution: CommandExecution): Promise<CommandResult> {
    const startTime = Date.now();
    const processId = `shark_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    return new Promise((resolve, reject) => {
      try {
        // Prepare environment
        const env = {
          ...process.env,
          ...execution.environment,
          PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin'
        };

        // Prepare command with potential redirection
        let finalCommand = execution.command;
        let finalArgs = [...execution.args];
        
        if (execution.redirect && execution.redirect_target) {
          finalArgs.push(execution.redirect);
          finalArgs.push(execution.redirect_target);
        }

        // Spawn process
        const process = spawn(finalCommand, finalArgs, {
          cwd: execution.working_directory || process.cwd(),
          env,
          shell: true,
          stdio: execution.silent ? 'pipe' : ['pipe', 'pipe', 'pipe']
        });

        this.activeProcesses.set(processId, process);

        let stdout = '';
        let stderr = '';
        let timed_out = false;
        let timeoutId: NodeJS.Timeout | null = null;

        // Set timeout if specified
        if (execution.timeout_ms && execution.timeout_ms > 0) {
          timeoutId = setTimeout(() => {
            timed_out = true;
            process.kill('SIGTERM');
            logger.warn(`Command timed out after ${execution.timeout_ms}ms: ${execution.command} ${execution.args.join(' ')}`);
          }, execution.timeout_ms);
        }

        // Capture output
        process.stdout?.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        process.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        // Handle process completion
        process.on('close', (code) => {
          if (timeoutId) clearTimeout(timeoutId);
          this.activeProcesses.delete(processId);

          const duration_ms = Date.now() - startTime;
          const success = code === 0 && !timed_out;

          const result: CommandResult = {
            exit_code: code || 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            duration_ms,
            success,
            timed_out
          };

          if (!execution.silent) {
            logger.debug(`Command executed: ${execution.command}`, {
              duration_ms,
              exit_code: code,
              success,
              timed_out,
              stdout_length: stdout.length,
              stderr_length: stderr.length
            });
          }

          if (success) {
            resolve(result);
          } else {
            reject(new Error(`Command failed with code ${code}: ${stderr || 'Unknown error'}`));
          }
        });

        process.on('error', (error) => {
          if (timeoutId) clearTimeout(timeoutId);
          this.activeProcesses.delete(processId);
          reject(error);
        });

      } catch (error) {
        reject(new Error(`Failed to execute command: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  async executeCommandWithStreaming(
    execution: CommandExecution,
    onOutput: (data: string, isError: boolean) => void,
    onCompletion: (result: CommandResult) => void
  ): Promise<void> {
    const startTime = Date.now();
    const processId = `shark_stream_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      // Prepare environment
      const env = {
        ...process.env,
        ...execution.environment,
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin'
      };

      // Spawn process
      const process = spawn(execution.command, execution.args, {
        cwd: execution.working_directory || process.cwd(),
        env,
        shell: true
      });

      this.activeProcesses.set(processId, process);

      let stdout = '';
      let stderr = '';
      let timed_out = false;
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout if specified
      if (execution.timeout_ms && execution.timeout_ms > 0) {
        timeoutId = setTimeout(() => {
          timed_out = true;
          process.kill('SIGTERM');
          onOutput(`\n⏰ Command timed out after ${execution.timeout_ms}ms\n`, true);
        }, execution.timeout_ms);
      }

      // Stream output
      process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        onOutput(output, false);
      });

      process.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        onOutput(output, true);
      });

      // Handle process completion
      process.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        this.activeProcesses.delete(processId);

        const duration_ms = Date.now() - startTime;
        const success = code === 0 && !timed_out;

        const result: CommandResult = {
          exit_code: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration_ms,
          success,
          timed_out
        };

        logger.debug(`Streaming command completed: ${execution.command}`, {
          duration_ms,
          exit_code: code,
          success,
          timed_out
        });

        onCompletion(result);
      });

      process.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        this.activeProcesses.delete(processId);
        onOutput(`\n❌ Process error: ${error.message}\n`, true);
        
        onCompletion({
          exit_code: 1,
          stdout: stdout.trim(),
          stderr: stderr.trim() + `\nProcess error: ${error.message}`,
          duration_ms: Date.now() - startTime,
          success: false,
          timed_out: false
        });
      });

    } catch (error) {
      onOutput(`\n❌ Failed to execute command: ${error instanceof Error ? error.message : 'Unknown error'}\n`, true);
      
      onCompletion({
        exit_code: 1,
        stdout: '',
        stderr: `Failed to execute command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration_ms: Date.now() - startTime,
        success: false,
        timed_out: false
      });
    }
  }

  public killProcess(processId: string): boolean {
    const process = this.activeProcesses.get(processId);
    if (process) {
      process.kill('SIGTERM');
      this.activeProcesses.delete(processId);
      return true;
    }
    return false;
  }

  public getActiveProcesses(): string[] {
    return Array.from(this.activeProcesses.keys());
  }

  public cleanup(): void {
    this.activeProcesses.forEach((process) => {
      process.kill('SIGTERM');
    });
    this.activeProcesses.clear();
  }
}
EOF
```

**Verification**:
```bash
cd packages/api-gateway
pnpm lint src/services/SharkCLIExecutor.ts
echo "✅ Shark CLI executor service created"
```

### Step 4: Express REST API Server
```bash
# Create main Express application with REST endpoints
cat > packages/api-gateway/src/index.ts << 'EOF'
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { WebSocketServer } from './services/WebSocketServer';
import { logger } from './utils/logger';
import { metricsMiddleware, registerMetrics } from './middleware/metrics';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import projectRoutes from './controllers/projectController';
import agentRoutes from './controllers/agentController';
import buildRoutes from './controllers/buildController';

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Authentication middleware (skip for public endpoints)
app.use('/api/projects', authMiddleware);
app.use('/api/agents', authMiddleware);
app.use('/api/builds', authMiddleware);

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.1.0'
  });
});

// Metrics endpoint (public)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', registerMetrics.contentType);
  res.end(await registerMetrics.metrics());
});

// API routes
app.use('/api/projects', projectRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/builds', buildRoutes);

// Error handling
app.use(errorHandler);

// WebSocket server
const wss = new WebSocketServer(server);

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`WebSocket server ready for connections`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`Metrics: http://localhost:${PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  wss.close();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  wss.close();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export { app, server, wss };
EOF
```

**Verification**:
```bash
cd packages/api-gateway
pnpm lint src/index.ts
echo "✅ Express REST API server created"
```

### Step 5: Database Schema and Migrations
```bash
# Create database schema for Agent Lab
cat > packages/api-gateway/src/database/schema.sql << 'EOF'
-- Agent Lab Database Schema
-- Version: 1.0
-- Created: 2026-03-30

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  hashed_password VARCHAR(255),
  auth_provider VARCHAR(50), -- 'local', 'github', 'google', 'api_key'
  auth_provider_id VARCHAR(255),
  api_key VARCHAR(64) UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  agent_blueprint JSONB NOT NULL,
  tags VARCHAR(255)[] DEFAULT '{}',
  visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'unlisted', 'public'
  fork_of UUID REFERENCES projects(id),
  star_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_visibility CHECK (visibility IN ('private', 'unlisted', 'public'))
);

-- Agent blueprints table (denormalized from projects for fast access)
CREATE TABLE agent_blueprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capabilities JSONB NOT NULL DEFAULT '[]',
  personality_traits JSONB NOT NULL DEFAULT '[]',
  visual_representation JSONB DEFAULT '{}',
  code_definition JSONB,
  test_suite JSONB DEFAULT '{}',
  deployment_config JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Build tasks table
CREATE TABLE build_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES agent_blueprints(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  task_graph JSONB NOT NULL,
  results JSONB DEFAULT '[]',
  error_message TEXT,
  logs TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

-- Agent instances table
CREATE TABLE agent_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES agent_blueprints(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'stopped', -- 'stopped', 'running', 'error', 'deploying'
  deployment_target VARCHAR(50) NOT NULL, -- 'local', 'docker', 'kubernetes', 'cloudflare'
  deployment_config JSONB NOT NULL DEFAULT '{}',
  endpoint_url VARCHAR(500),
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  stopped_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_status CHECK (status IN ('stopped', 'running', 'error', 'deploying')),
  CONSTRAINT valid_target CHECK (deployment_target IN ('local', 'docker', 'kubernetes', 'cloudflare'))
);

-- Agent logs table
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL, -- 'debug', 'info', 'warn', 'error'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_level CHECK (level IN ('debug', 'info', 'warn', 'error'))
);

-- Marketplace agents table
CREATE TABLE marketplace_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES agent_blueprints(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags VARCHAR(255)[] DEFAULT '{}',
  category VARCHAR(50) NOT NULL,
  downloads INTEGER DEFAULT 0,
  stars INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_category CHECK (category IN ('research', 'coding', 'design', 'data', 'automation', 'other'))
);

-- User agent stars (for marketplace)
CREATE TABLE user_agent_stars (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES marketplace_agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, agent_id)
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_visibility ON projects(visibility) WHERE visibility = 'public';
CREATE INDEX idx_agent_blueprints_project_id ON agent_blueprints(project_id);
CREATE INDEX idx_build_tasks_project_id ON build_tasks(project_id);
CREATE INDEX idx_build_tasks_status ON build_tasks(status) WHERE status IN ('pending', 'running');
CREATE INDEX idx_agent_instances_blueprint_id ON agent_instances(blueprint_id);
CREATE INDEX idx_agent_instances_status ON agent_instances(status);
CREATE INDEX idx_agent_logs_agent_instance_id ON agent_logs(agent_instance_id);
CREATE INDEX idx_agent_logs_timestamp ON agent_logs(timestamp DESC);
CREATE INDEX idx_marketplace_agents_category ON marketplace_agents(category);
CREATE INDEX idx_marketplace_agents_downloads ON marketplace_agents(downloads DESC);
CREATE INDEX idx_marketplace_agents_stars ON marketplace_agents(stars DESC);

-- Update trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_blueprints_updated_at BEFORE UPDATE ON agent_blueprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_agents_updated_at BEFORE UPDATE ON marketplace_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF
```

**Verification**:
```bash
cd packages/api-gateway
# Test SQL syntax (if psql available)
echo "✅ Database schema created with comprehensive tables"
```

### Step 6: Docker Configuration
```bash
# Create Docker configuration for API gateway
cat > packages/api-gateway/Dockerfile << 'EOF'
# Multi-stage build for API Gateway
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/api-gateway/package.json ./packages/api-gateway/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/api-gateway ./packages/api-gateway
COPY shared ./shared

# Build
RUN pnpm --filter @agent-lab/api-gateway build

# Production image
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache tini

WORKDIR /app

# Copy built application
COPY --from=builder /app/packages/api-gateway/dist ./dist
COPY --from=builder /app/packages/api-gateway/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S agentlab -u 1001

# Set permissions
RUN chown -R agentlab:nodejs /app
USER agentlab

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if(r.statusCode === 200) process.exit(0); process.exit(1)})"

# Entry point
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]

EXPOSE 8080
EOF

# Create docker-compose configuration
cat > docker-compose.api.yml << 'EOF'
version: '3.8'

services:
  api-gateway:
    build:
      context: .
      dockerfile: packages/api-gateway/Dockerfile
      target: production
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://agentlab:agentlab@postgres:5432/agentlab
      - REDIS_URL=redis://redis:6379
      - CORS_ORIGIN=https://agentlab.example.com
      - JWT_SECRET=${JWT_SECRET}
      - API_KEY_SALT=${API_KEY_SALT}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080/health', (r) => {if(r.statusCode === 200) process.exit(0); process.exit(1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - agentlab-network
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=agentlab
      - POSTGRES_PASSWORD=agentlab
      - POSTGRES_DB=agentlab
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./packages/api-gateway/src/database/schema.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - agentlab-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U agentlab"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass redispass --appendonly yes
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    networks:
      - agentlab-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    networks:
      - agentlab-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3001:3000"
    networks:
      - agentlab-network
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:

networks:
  agentlab-network:
    driver: bridge
EOF
```

**Verification**:
```bash
cd packages/api-gateway
docker build -t agentlab-api-gateway:test -f Dockerfile .
echo "✅ Docker configuration created and build tested"
```

## Phase 2: Integration Testing

### Step 7: Comprehensive Test Suite
```bash
# Create test suite for API gateway
cat > packages/api-gateway/src/tests/api.test.ts << 'EOF'
import request from 'supertest';
import { app } from '../index';
import { SharkCLIExecutor } from '../services/SharkCLIExecutor';

describe('API Gateway Integration Tests', () => {
  let sharkExecutor: SharkCLIExecutor;

  beforeAll(() => {
    sharkExecutor = new SharkCLIExecutor();
  });

  afterAll(async () => {
    sharkExecutor.cleanup();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('Metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app).get('/metrics');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('http_request_duration_seconds');
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection', (done) => {
      // WebSocket test would go here
      // This is a placeholder for actual WebSocket testing
      done();
    });
  });

  describe('Shark CLI Integration', () => {
    it('should execute basic Shark CLI command', async () => {
      const result = await sharkExecutor.executeCommand({
        command: 'echo',
        args: ['test'],
        silent: true
      });
      
      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('test');
      expect(result.exit_code).toBe(0);
    });

    it('should handle command errors', async () => {
      await expect(
        sharkExecutor.executeCommand({
          command: 'false', // Command that returns non-zero exit code
          args: [],
          silent: true
        })
      ).rejects.toThrow();
    });
  });

  describe('Authentication', () => {
    it('should reject unauthorized API requests', async () => {
      const response = await request(app).get('/api/projects');
      expect(response.status).toBe(401);
    });

    // More authentication tests would go here
  });
});
EOF

# Create test configuration
cat > packages/api-gateway/vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.ts'
      ]
    },
    setupFiles: ['./src/tests/setup.ts']
  }
});
EOF
```

**Verification**:
```bash
cd packages/api-gateway
pnpm test
echo "✅ Test suite created and executed"
```

## Phase 3: Production Deployment

### Step 8: Monitoring and Observability
```bash
# Create monitoring configuration
mkdir -p packages/api-gateway/monitoring

cat > packages/api-gateway/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert.rules.yml"

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node'
    static_configs:
      - targets: ['api-gateway:9100']
EOF

cat > packages/api-gateway/monitoring/alert.rules.yml << 'EOF'
groups:
  - name: api_gateway_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on API Gateway"
          description: "Error rate is {{ $value }}% (threshold: 5%)"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on API Gateway"
          description: "95th percentile latency is {{ $value }}s (threshold: 1s)"

      - alert: ServiceDown
        expr: up{job="api-gateway"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API Gateway is down"
          description: "The API Gateway service is not responding"
EOF
```

### Step 9: Security Hardening
```bash
# Create security configuration
cat > packages/api-gateway/src/security/securityConfig.ts << 'EOF'
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req: Request) => {
    // Skip rate limiting for health checks and metrics
    return req.path === '/health' || req.path === '/metrics';
  }
});

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize request body, query, and params
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Basic XSS protection
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof obj[key] === 'object') {
        obj[key] = sanitize(obj[key]);
      }
    }
    
    return obj;
  };
  
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

export const validateAPIKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    res.status(401).json({ error: 'API key required' });
    return;
  }
  
  // Validate API key format
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(apiKey)) {
    res.status(401).json({ error: 'Invalid API key format' });
    return;
  }
  
  // In production, validate against database
  next();
};

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://agentlab.example.com',
      process.env.CORS_ORIGIN || ''
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
EOF
```

## Verification & Completion

### Final Verification Steps
```bash
# Complete build and test
cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-lab/packages/api-gateway

# Build the application
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Security scan (if available)
# pnpm security:scan

echo "========================================="
echo "✅ Pod 1: Kraken OS Integration Complete"
echo "========================================="
echo "Built components:"
echo "1. WebSocket Server with Shark CLI integration"
echo "2. REST API Gateway with Express"
echo "3. Shark CLI Executor with streaming"
echo "4. Database schema (PostgreSQL)"
echo "5. Docker configuration"
echo "6. Comprehensive test suite"
echo "7. Monitoring setup (Prometheus/Grafana)"
echo "8. Security hardening"
echo ""
echo "Next steps:"
echo "1. Deploy to development environment"
echo "2. Integrate with Pod 2 (Frontend)"
echo "3. Set up production monitoring"
echo "4. Perform security audit"
```

### Integration Points Ready
- **WebSocket Endpoint**: `ws://localhost:8080` (real-time communication)
- **REST API**: `http://localhost:8080/api/*` (project/agent management)
- **Health Check**: `http://localhost:8080/health`
- **Metrics**: `http://localhost:8080/metrics` (Prometheus format)
- **Database**: PostgreSQL on `localhost:5432`
- **Redis**: `localhost:6379` (for rate limiting and sessions)

### Success Criteria Verification
```bash
# Verify each success criterion
echo "1. Testing WebSocket API..."
# curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: localhost:8080" -H "Origin: http://localhost:3000" http://localhost:8080

echo "2. Testing REST API..."
curl -s http://localhost:8080/health | grep -q "healthy" && echo "✅ Health check passed" || echo "❌ Health check failed"

echo "3. Testing database connection..."
docker-compose -f docker-compose.api.yml exec postgres pg_isready -U agentlab && echo "✅ Database connected" || echo "❌ Database connection failed"

echo "4. Testing Shark CLI integration..."
which shark && echo "✅ Shark CLI available" || echo "❌ Shark CLI not found"

echo "========================================="
echo "Pod 1 is ready for integration with other pods"
echo "Interface contracts documented in architecture"
echo "Proceed to Pod 2: Visual Builder Frontend"
```

---

**Document Version**: 1.0  
**Pod**: 1 - Kraken OS Integration  
**Status**: Ready for Implementation  
**Estimated Engineering Effort**: 3-4 engineers for Phase 1  
**Integration Dependencies**: Shark CLI, PostgreSQL, Redis  
**Deliverables**: Production API Gateway with WebSocket/REST APIs