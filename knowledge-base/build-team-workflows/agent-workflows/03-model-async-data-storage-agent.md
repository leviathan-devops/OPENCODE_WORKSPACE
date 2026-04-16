# Model-Async Data Storage Agent - Executable Build Process

## Mission
Implement a logging directory and data storage system for capturing model interactions, token usage, and async operation traces in the Shark Frankenstein CLI.

## Success Criteria
- Logging directory created at `.shark/logs/` with proper structure
- `ModelLogger` class implemented with methods for logging model interactions
- Integration with existing components (ToolExecutor, coordinator, etc.)
- Async operation tracing implemented
- Token usage tracking across model calls
- Performance metrics collection (latency, success rates)
- Log rotation and management

## Pre-flight Checks
1. **Verify workspace location**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein`
2. **Check existing logging infrastructure**: Look for existing logging modules
3. **Review model interaction points**: Identify where model calls happen
4. **Understand async patterns**: Review async/await usage in codebase

## Step-by-Step Execution

### Step 1: Analyze Current Model Interaction Points
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
# Find where models are called
grep -r "generate\|chat\|completion\|model" src/ --include="*.ts" | grep -v "test" | grep -v "//" | head -20
```

**Expected**: Find calls to Ollama, vLLM, or other model APIs. Identify the key files:
- `src/brain/coordinator*.ts`
- `src/tools/executor*.ts`
- Any model client files

### Step 2: Design Logging Architecture
Create architecture diagram in documentation:

```
.shark/logs/
├── model/                 # Model interactions
│   ├── YYYY-MM-DD/       # Daily directories
│   │   └── HH.jsonl      # Hourly log files (JSON Lines)
├── async/                # Async operation traces
│   └── operations.jsonl  # Async operation logs
├── tokens/               # Token usage
│   └── usage.csv         # CSV of token counts
└── performance/          # Performance metrics
    └── metrics.jsonl     # Latency, success rates
```

Log formats:
- **Model logs**: `{timestamp, model, operation, input_tokens, output_tokens, latency_ms, success, error}`
- **Async logs**: `{timestamp, operation, duration_ms, result, error}`
- **Token logs**: `{timestamp, model, total_tokens, cost_estimate}`
- **Performance logs**: `{timestamp, component, operation, p50, p95, p99}`

### Step 3: Create Logging Directory Structure
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
mkdir -p .shark/logs/{model,async,tokens,performance,archive}
mkdir -p .shark/config
```

Create configuration file:
```bash
cat > .shark/config/logging.json << 'EOF'
{
  "enabled": true,
  "logLevel": "info",
  "maxFileSizeMB": 10,
  "maxArchiveDays": 30,
  "compression": true,
  "logToConsole": false,
  "components": {
    "model": true,
    "async": true,
    "tokens": true,
    "performance": true
  }
}
EOF
```

### Step 4: Implement ModelLogger Class
Create `src/logging/model-logger.ts`:

```bash
cat > src/logging/model-logger.ts << 'EOF'
/**
 * 🦈 Model Logger - Captures model interactions and async operations
 */

import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

export interface ModelLogEntry {
  timestamp: string;
  model: string;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AsyncLogEntry {
  timestamp: string;
  operation: string;
  durationMs: number;
  result?: any;
  error?: string;
  component: string;
}

export interface TokenUsageEntry {
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costEstimate?: number;
}

export class ModelLogger {
  private logDir: string;
  private config: any;

  constructor(logDir: string = '.shark/logs') {
    this.logDir = logDir;
    this.loadConfig();
    this.ensureDirectories();
  }

  private loadConfig() {
    const configPath = path.join(this.logDir, '../config/logging.json');
    try {
      this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      this.config = { enabled: true, logLevel: 'info' };
    }
  }

  private ensureDirectories() {
    const dirs = ['model', 'async', 'tokens', 'performance'];
    dirs.forEach(dir => {
      const fullPath = path.join(this.logDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  private getModelLogFile(): string {
    const now = new Date();
    const dateDir = now.toISOString().split('T')[0];
    const hour = now.getHours().toString().padStart(2, '0');
    const dir = path.join(this.logDir, 'model', dateDir);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    return path.join(dir, `${hour}.jsonl`);
  }

  private getAsyncLogFile(): string {
    return path.join(this.logDir, 'async', 'operations.jsonl');
  }

  private getTokenLogFile(): string {
    return path.join(this.logDir, 'tokens', 'usage.csv');
  }

  private writeLogLine(filePath: string, data: any) {
    if (!this.config.enabled) return;
    
    const line = JSON.stringify(data) + '\n';
    fs.appendFileSync(filePath, line, 'utf8');
  }

  /**
   * Log a model interaction
   */
  logModelInteraction(entry: Omit<ModelLogEntry, 'timestamp'>) {
    const fullEntry: ModelLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    const logFile = this.getModelLogFile();
    this.writeLogLine(logFile, fullEntry);

    // Also log token usage
    if (entry.inputTokens !== undefined || entry.outputTokens !== undefined) {
      this.logTokenUsage({
        timestamp: fullEntry.timestamp,
        model: entry.model,
        inputTokens: entry.inputTokens || 0,
        outputTokens: entry.outputTokens || 0,
        totalTokens: (entry.inputTokens || 0) + (entry.outputTokens || 0)
      });
    }
  }

  /**
   * Log token usage
   */
  logTokenUsage(entry: TokenUsageEntry) {
    const csvFile = this.getTokenLogFile();
    const csvLine = `${entry.timestamp},${entry.model},${entry.inputTokens},${entry.outputTokens},${entry.totalTokens},${entry.costEstimate || ''}\n`;
    
    if (!fs.existsSync(csvFile)) {
      // Write header
      fs.writeFileSync(csvFile, 'timestamp,model,inputTokens,outputTokens,totalTokens,costEstimate\n', 'utf8');
    }
    
    fs.appendFileSync(csvFile, csvLine, 'utf8');
  }

  /**
   * Log async operation with timing
   */
  async logAsyncOperation<T>(
    operation: string,
    component: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const durationMs = performance.now() - startTime;
      
      this.writeLogLine(this.getAsyncLogFile(), {
        timestamp: new Date().toISOString(),
        operation,
        durationMs: Math.round(durationMs),
        result: typeof result === 'object' ? { type: typeof result } : result,
        error: undefined,
        component
      });
      
      return result;
    } catch (error) {
      const durationMs = performance.now() - startTime;
      
      this.writeLogLine(this.getAsyncLogFile(), {
        timestamp: new Date().toISOString(),
        operation,
        durationMs: Math.round(durationMs),
        result: undefined,
        error: error instanceof Error ? error.message : String(error),
        component
      });
      
      throw error;
    }
  }

  /**
   * Get recent model logs
   */
  getRecentModelLogs(limit: number = 100): ModelLogEntry[] {
    const logFile = this.getModelLogFile();
    if (!fs.existsSync(logFile)) return [];
    
    const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
    const logs = lines.slice(-limit).map(line => JSON.parse(line));
    return logs;
  }

  /**
   * Get token usage summary
   */
  getTokenSummary(): { totalTokens: number; byModel: Record<string, number> } {
    const csvFile = this.getTokenLogFile();
    if (!fs.existsSync(csvFile)) return { totalTokens: 0, byModel: {} };
    
    const lines = fs.readFileSync(csvFile, 'utf8').trim().split('\n').slice(1);
    let totalTokens = 0;
    const byModel: Record<string, number> = {};
    
    lines.forEach(line => {
      const [, model, , , total] = line.split(',');
      const tokenCount = parseInt(total) || 0;
      totalTokens += tokenCount;
      byModel[model] = (byModel[model] || 0) + tokenCount;
    });
    
    return { totalTokens, byModel };
  }
}

// Singleton instance
export const modelLogger = new ModelLogger();
EOF
```

### Step 5: Create Index File for Logging Module
```bash
cat > src/logging/index.ts << 'EOF'
export * from './model-logger';
EOF
```

### Step 6: Integrate with ToolExecutor
Update `src/tools/executor_v2.ts` (or `executor(V2).ts` if not renamed yet) to include logging:

```bash
# First, backup the executor file
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
cp src/tools/executor_v2.ts src/tools/executor_v2.ts.backup

# Add import at top of file
sed -i "1s/^/import { modelLogger } from '..\/logging\/model-logger';\n/" src/tools/executor_v2.ts

# Find the executeTool method and wrap calls with logging
# This requires more careful editing; create a patch file
cat > /tmp/executor-logging.patch << 'EOF'
--- a/src/tools/executor_v2.ts
+++ b/src/tools/executor_v2.ts
@@ -XXX,XXX +XXX,XXX @@
   async executeTool(toolCall: ToolCall): Promise<ToolResult> {
+    const startTime = Date.now();
+    
     try {
       // Existing logic
-      const result = await this.executeToolInternal(toolCall);
+      const result = await modelLogger.logAsyncOperation(
+        `executeTool:${toolCall.name}`,
+        'ToolExecutor',
+        () => this.executeToolInternal(toolCall)
+      );
       
+      const latencyMs = Date.now() - startTime;
+      
+      // Log successful tool execution
+      modelLogger.logModelInteraction({
+        model: 'tool-executor',
+        operation: toolCall.name,
+        latencyMs,
+        success: true,
+        metadata: {
+          toolCallId: toolCall.toolCallId,
+          arguments: toolCall.arguments
+        }
+      });
+      
       return result;
     } catch (error) {
+      const latencyMs = Date.now() - startTime;
+      
+      modelLogger.logModelInteraction({
+        model: 'tool-executor',
+        operation: toolCall.name,
+        latencyMs,
+        success: false,
+        error: error instanceof Error ? error.message : String(error),
+        metadata: {
+          toolCallId: toolCall.toolCallId,
+          arguments: toolCall.arguments
+        }
+      });
+      
       return {
         toolCallId: toolCall.toolCallId,
         name: toolCall.name,
EOF

# Apply patch (if patch command available)
patch -p1 < /tmp/executor-logging.patch 2>/dev/null || echo "Patch application may need manual adjustment"
```

**Manual Integration Required**: If patch fails, manually edit `executor_v2.ts` to add logging calls around tool execution.

### Step 7: Integrate with Brain Coordinator
Update coordinator files to log model interactions:

```bash
# Find coordinator files
find src/brain -name "*.ts" -type f | grep -v test | while read -r file; do
  echo "Adding logging to $file"
  # Add import if not present
  if ! grep -q "model-logger" "$file"; then
    sed -i "1s/^/import { modelLogger } from '..\/logging\/model-logger';\n/" "$file"
  fi
  
  # Find model calls (e.g., client.generate, client.chat)
  # This requires careful manual editing based on each file
done
```

### Step 8: Create Log Rotation Script
```bash
cat > scripts/rotate-logs.sh << 'EOF'
#!/bin/bash
# Log rotation script for Shark logs

LOG_DIR=".shark/logs"
ARCHIVE_DIR="$LOG_DIR/archive"
DAYS_TO_KEEP=30

# Create archive directory if needed
mkdir -p "$ARCHIVE_DIR"

# Archive old logs
find "$LOG_DIR/model" -type d -name "20*" -mtime +$DAYS_TO_KEEP | while read -r dir; do
  dirname=$(basename "$dir")
  tar -czf "$ARCHIVE_DIR/model-$dirname.tar.gz" -C "$LOG_DIR/model" "$dirname"
  rm -rf "$dir"
  echo "Archived: $dir"
done

# Rotate large files
find "$LOG_DIR" -name "*.jsonl" -size +10M | while read -r file; do
  basename=$(basename "$file" .jsonl)
  timestamp=$(date +%Y%m%d_%H%M%S)
  gzip "$file"
  mv "$file.gz" "$ARCHIVE_DIR/$basename-$timestamp.jsonl.gz"
  echo "Rotated: $file"
done

echo "Log rotation complete"
EOF

chmod +x scripts/rotate-logs.sh
```

### Step 9: Update Package.json with Logging Scripts
```bash
# Add scripts to package.json
cat > /tmp/update-package.json << 'EOF'
{
  "scripts": {
    "logs:view": "tail -f .shark/logs/model/*/*.jsonl",
    "logs:summary": "node -e \"const { modelLogger } = require('./dist/logging/model-logger'); console.log(modelLogger.getTokenSummary());\"",
    "logs:rotate": "./scripts/rotate-logs.sh",
    "logs:clean": "rm -rf .shark/logs/*"
  }
}
EOF

# Merge with existing package.json (requires jq)
if command -v jq >/dev/null; then
  jq '.scripts += {"logs:view": "tail -f .shark/logs/model/*/*.jsonl", "logs:summary": "node -e \"const { modelLogger } = require(\\"./dist/logging/model-logger\\"); console.log(modelLogger.getTokenSummary());\"", "logs:rotate": "./scripts/rotate-logs.sh", "logs:clean": "rm -rf .shark/logs/*"}' package.json > package.json.tmp && mv package.json.tmp package.json
else
  echo "jq not installed, manually update package.json scripts"
fi
```

### Step 10: Test Logging System
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
# Create test file
cat > test-logging.ts << 'EOF'
import { modelLogger } from './src/logging/model-logger';

async function testLogging() {
  // Test model interaction logging
  modelLogger.logModelInteraction({
    model: 'test-model',
    operation: 'generate',
    inputTokens: 100,
    outputTokens: 200,
    latencyMs: 500,
    success: true
  });

  // Test async operation logging
  await modelLogger.logAsyncOperation(
    'test-operation',
    'test-component',
    async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'test-result';
    }
  );

  console.log('✅ Logging test complete');
  console.log('Recent logs:', modelLogger.getRecentModelLogs(5));
  console.log('Token summary:', modelLogger.getTokenSummary());
}

testLogging().catch(console.error);
EOF

# Run test
npx tsx test-logging.ts
```

### Step 11: Verify Integration
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
# Check TypeScript compilation
npm run typecheck 2>&1 | head -20

# Check if logs are being created
ls -la .shark/logs/model/*/*.jsonl 2>/dev/null | head -5

# Run existing tests to ensure no regression
npm test 2>&1 | tail -20
```

### Step 12: Create Git Commit
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
git add -A
git commit -m "feat: implement model-async data storage and logging system

- Created ModelLogger class for capturing model interactions, token usage, and async operations
- Implemented logging directory at .shark/logs/ with structured organization
- Integrated logging with ToolExecutor for tool execution tracking
- Added async operation tracing with performance metrics
- Implemented token usage tracking across model calls
- Added log rotation script for maintenance
- Updated package.json with logging utility scripts
- Maintained backward compatibility and existing functionality"
```

## Verification Checklist
- [ ] Logging directory structure created (`.shark/logs/`)
- [ ] `ModelLogger` class implemented (`src/logging/model-logger.ts`)
- [ ] Integration with ToolExecutor for tool execution logging
- [ ] Integration with brain coordinator for model interaction logging
- [ ] Log rotation script created (`scripts/rotate-logs.sh`)
- [ ] Package.json updated with logging scripts
- [ ] TypeScript compilation succeeds
- [ ] Test logging works without errors
- [ ] Existing tests pass
- [ ] Git commit created with descriptive message

## Error Recovery
If any step fails:
1. **Restore from backup**: `git checkout -- src/logging/ scripts/ .shark/`
2. **Manual integration**: If automated patch fails, manually integrate logging calls
3. **Simplify approach**: Start with basic logging, then add advanced features

## Completion Signal
When complete, output the following message:
```
✅ MODEL-ASYNC DATA STORAGE IMPLEMENTATION COMPLETE
- Logging directory: .shark/logs/
- ModelLogger class: src/logging/model-logger.ts
- Integration points: [count]
- Test status: SUCCESS
- Commit hash: [git rev-parse HEAD]
```

## Next Agent
Proceed to **Safety Stack Integration Agent** (04-safety-stack-integration-agent.md)