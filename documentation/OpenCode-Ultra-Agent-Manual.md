# OpenCode-Ultra: AI Agent Operational Manual

## Operational Protocol

### System Initialization Sequence
```
1. LOAD_CONFIG: ~/.config/opencode/opencode-ultra.json
2. VALIDATE_GLM: Test GLM API connectivity
3. INIT_TOOLS: Register 12 specialized tools
4. INIT_AGENTS: Register 9 agent types with model assignments
5. START_SESSION_MGR: Initialize session continuity system
6. ENABLE_HOOKS: Activate 9 hook points
7. VERIFY_SHARK_AGENT: Check dual-mode integration
8. READY_FOR_OPERATIONS: System status = GREEN
```

### Agent Assignment Matrix
| Agent Type | Model | Concurrency | Timeout | Primary Use Case |
|------------|-------|-------------|---------|------------------|
| EXPLORE | GLM-4.5-flash | 5 | 120s | Fast searches, file patterns |
| GENERAL | GLM-4.7 | 3 | 180s | Research, multi-step tasks |
| SISYPHUS | GLM-5 | 2 | 300s | Complex problem-solving |
| HEPHAESTUS | GLM-4.7 | 3 | 240s | Code generation, refactoring |
| ANALYZE | GLM-4.7 | 2 | 180s | Code analysis, metrics |
| TEST | GLM-4.5-flash | 3 | 120s | Test generation, execution |
| DOCUMENT | GLM-4.5-flash | 3 | 120s | Documentation generation |
| REVIEW | GLM-4.7 | 2 | 180s | Code review, quality assessment |
| OPTIMIZE | GLM-4.7 | 2 | 180s | Performance optimization |

## Tool Reference

### Core Tools (Priority 1)

#### 1. SPAWN_AGENT
```typescript
interface SpawnAgentParams {
  agent_type: 'explore' | 'general' | 'sisyphus' | 'hephaestus' | 'analyze' | 'test' | 'document' | 'review' | 'optimize';
  prompt: string;
  timeout?: number; // ms, defaults to agent-specific timeout
  concurrency_limit?: number; // Override default concurrency
}
```

**Usage Pattern:**
```javascript
// Spawn parallel agents for comprehensive analysis
const agents = await Promise.all([
  spawn_agent({ agent_type: 'explore', prompt: 'Find all API endpoints' }),
  spawn_agent({ agent_type: 'analyze', prompt: 'Calculate code complexity metrics' }),
  spawn_agent({ agent_type: 'review', prompt: 'Identify security vulnerabilities' })
]);
```

#### 2. BATCH_READ
```typescript
interface BatchReadParams {
  file_paths: string[];
  max_concurrent?: number; // Default: 20
}
```

**Optimization:**
- Group related files (e.g., all components in a directory)
- Prioritize small files first
- Use for initial codebase exploration

#### 3. EVOLVE_EXE
```typescript
interface EvolveExeParams {
  task_description: string;
  branch_name?: string; // Auto-generated if not provided
  auto_commit?: boolean; // Default: true
}
```

**Workflow:**
1. Creates feature branch
2. Implements changes
3. Runs validation
4. Commits with descriptive messages
5. Returns change summary

#### 4. AST_SEARCH
```typescript
interface ASTSearchParams {
  pattern: string; // AST pattern or regex fallback
  file_pattern?: string; // e.g., "**/*.{ts,tsx}"
  fallback_to_grep?: boolean; // Default: true
}
```

**AST Patterns:**
- `FunctionDeclaration[name="calculateTotal"]`
- `ClassDeclaration[extends="Component"]`
- `CallExpression[callee.name="fetch"]`

### Utility Tools (Priority 2)

#### 5. LEDGER_SAVE / LEDGER_LOAD
```typescript
// Session continuity system
interface LedgerParams {
  session_id: string;
  data: Record<string, any>;
}
```

**Session Structure:**
```javascript
{
  context: 'Current task context',
  progress: 'Completed steps',
  artifacts: ['file1.ts', 'file2.ts'],
  next_steps: ['Step 1', 'Step 2'],
  metadata: { timestamp, agent, model }
}
```

#### 6. CODE_METRICS
- Cyclomatic complexity
- Cognitive complexity  
- Dependency graphs
- Code churn analysis

#### 7. DEPENDENCY_GRAPH
- Visualize imports/exports
- Identify circular dependencies
- Module coupling analysis

## Keyword Routing System

### Automatic Agent Selection
```
INPUT → KEYWORD_DETECTION → AGENT_SELECTION → EXECUTION
```

**Keyword Mapping:**
- `ultrawork` → SISYPHUS (complex, persistent)
- `search` → EXPLORE (fast, pattern matching)
- `analyze` → ANALYZE (metrics, deep analysis)
- `think hard` → GENERAL (research, reasoning)
- `evolve` → HEPHAESTUS (implementation)
- `test` → TEST (testing)
- `document` → DOCUMENT (documentation)
- `review` → REVIEW (quality)
- `optimize` → OPTIMIZE (performance)

### Complexity-Based Fallback
```javascript
function selectAgent(task, estimatedComplexity) {
  if (task.includes('ultrawork')) return 'sisyphus';
  if (estimatedComplexity >= 8) return 'sisyphus';
  if (estimatedComplexity >= 6) return 'hephaestus';
  if (estimatedComplexity >= 4) return 'general';
  return 'explore';
}
```

## Safety Protocols

### Concurrency Control
```javascript
class SafetyManager {
  // Model-specific limits
  static MODEL_LIMITS = {
    'glm-5': 2,
    'glm-4.7': 3,
    'glm-4.5-flash': 5
  };
  
  // Global limits
  static MAX_SESSIONS = 10;
  static MAX_RUNTIME = 300000; // 5 minutes
  
  static canSpawn(agentType, model) {
    // Check model limits
    const activeByModel = countActiveByModel(model);
    if (activeByModel >= this.MODEL_LIMITS[model]) {
      return { allowed: false, reason: `Model ${model} at capacity` };
    }
    
    // Check total sessions
    if (totalActiveSessions() >= this.MAX_SESSIONS) {
      return { allowed: false, reason: 'Maximum sessions reached' };
    }
    
    return { allowed: true };
  }
}
```

### Timeout Enforcement
```javascript
async function executeWithSafety(operation, timeout, context) {
  const timeoutId = setTimeout(() => {
    logTimeout(context);
    attemptGracefulStop(operation);
  }, timeout);
  
  try {
    const result = await operation();
    clearTimeout(timeoutId);
    return { success: true, result };
  } catch (error) {
    clearTimeout(timeoutId);
    return { success: false, error: error.message };
  }
}
```

### Circuit Breaker Pattern
```javascript
class CircuitBreaker {
  constructor(threshold = 5, resetTimeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
    this.state = 'CLOSED';
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker OPEN - operations suspended');
    }
    
    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      setTimeout(() => this.reset(), this.resetTimeout);
    }
  }
}
```

## Error Handling Framework

### Error Classification
```javascript
const ERROR_TYPES = {
  NETWORK: 'GLM API connectivity issues',
  TIMEOUT: 'Operation exceeded time limit',
  RESOURCE: 'Memory/CPU constraints',
  VALIDATION: 'Invalid input/data',
  UNKNOWN: 'Unclassified error'
};

async function handleError(error, context) {
  const type = classifyError(error);
  
  // Log with context
  await logError({
    type,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: Date.now()
  });
  
  // Execute recovery
  switch (type) {
    case 'NETWORK':
      return await networkRecovery(context);
    case 'TIMEOUT':
      return await timeoutRecovery(context);
    case 'RESOURCE':
      return await resourceRecovery(context);
    default:
      return await genericRecovery(context);
  }
}
```

### Recovery Procedures

#### Network Recovery
```javascript
async function networkRecovery(context) {
  // Step 1: Check GLM status
  const glmStatus = await testGLMConnectivity();
  
  if (!glmStatus.connected) {
    // Step 2: Switch to local vLLM
    const localStatus = await checkLocalVLLM();
    
    if (localStatus.available) {
      await switchToLocalProvider();
      return { recovered: true, provider: 'local' };
    }
    
    // Step 3: Exponential backoff
    const backoff = calculateBackoff(context.retryCount);
    await sleep(backoff);
    
    // Step 4: Simplify task and retry
    const simplified = simplifyTask(context.task);
    return { recovered: false, action: 'retry', task: simplified };
  }
  
  return { recovered: true, provider: 'glm' };
}
```

#### Timeout Recovery
```javascript
async function timeoutRecovery(context) {
  // Analyze what timed out
  const analysis = analyzeTimeout(context);
  
  // Adjust parameters
  const adjustments = {
    timeout: increaseTimeout(context.timeout),
    complexity: reduceComplexity(context.task),
    concurrency: reduceIfNeeded(analysis.concurrencyIssue)
  };
  
  // Retry with adjustments
  return {
    recovered: true,
    adjustments,
    retry_context: { ...context, ...adjustments }
  };
}
```

## Quality Assurance

### Result Validation
```javascript
async function validateResults(results, expectations) {
  const validation = {
    timestamp: Date.now(),
    checks: []
  };
  
  // Required fields check
  if (!results.status) validation.checks.push('FAIL: Missing status field');
  if (!results.data) validation.checks.push('FAIL: Missing data field');
  
  // Data structure validation
  if (results.data) {
    const structureCheck = validateStructure(results.data);
    validation.checks.push(...structureCheck);
  }
  
  // Performance validation
  if (results.performance) {
    const perfCheck = validatePerformance(results.performance);
    validation.checks.push(...perfCheck);
  }
  
  // Overall assessment
  const failed = validation.checks.filter(c => c.startsWith('FAIL'));
  validation.passed = failed.length === 0;
  validation.score = calculateQualityScore(validation.checks);
  
  return validation;
}
```

### Code Quality Assessment
```javascript
async function assessCodeQuality(changes) {
  const assessment = {
    files: changes.length,
    issues: [],
    metrics: {}
  };
  
  for (const change of changes) {
    // Syntax validation
    const syntax = await validateSyntax(change);
    if (!syntax.valid) {
      assessment.issues.push(`Syntax error in ${change.path}: ${syntax.error}`);
    }
    
    // Style consistency
    const style = await checkStyle(change);
    assessment.issues.push(...style.violations);
    
    // Complexity analysis
    const complexity = analyzeComplexity(change);
    assessment.metrics[change.path] = complexity;
    
    if (complexity.score > 7) {
      assessment.issues.push(`High complexity in ${change.path}: ${complexity.score}/10`);
    }
  }
  
  assessment.summary = assessment.issues.length === 0 
    ? 'All changes meet quality standards'
    : `Found ${assessment.issues.length} issues`;
    
  return assessment;
}
```

## Performance Optimization

### Caching Strategy
```javascript
class CodeCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  async getOrCompute(key, computeFn) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = await computeFn();
    
    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
    return result;
  }
  
  // Cacheable operations
  static CACHEABLE = [
    'AST_PARSE',
    'DEPENDENCY_GRAPH',
    'CODE_METRICS',
    'FILE_STATS'
  ];
}
```

### Batch Optimization
```javascript
async function optimizeBatchOperations(operations) {
  // Group by type
  const groups = groupByType(operations);
  
  const results = [];
  
  // Process each group in parallel
  for (const [type, groupOps] of Object.entries(groups)) {
    if (type === 'FILE_READ') {
      // Batch file reads
      const filePaths = groupOps.map(op => op.path);
      const batchResult = await batch_read({ file_paths: filePaths });
      results.push(...batchResult);
    } else if (type === 'SEARCH') {
      // Parallel searches
      const searchPromises = groupOps.map(op => 
        ast_search({ pattern: op.pattern, file_pattern: op.file_pattern })
      );
      const searchResults = await Promise.all(searchPromises);
      results.push(...searchResults);
    }
    // ... other optimizations
  }
  
  return results;
}
```

## Monitoring & Metrics

### Health Checks
```javascript
async function performHealthCheck() {
  const checks = [
    { name: 'GLM API', check: testGLMConnectivity },
    { name: 'Local vLLM', check: checkLocalVLLM },
    { name: 'Tool Registry', check: verifyTools },
    { name: 'Agent Registry', check: verifyAgents },
    { name: 'Session Storage', check: checkSessionStorage },
    { name: 'Resource Usage', check: checkResources }
  ];
  
  const results = await Promise.all(
    checks.map(async ({ name, check }) => {
      try {
        const result = await check();
        return { name, status: 'PASS', details: result };
      } catch (error) {
        return { name, status: 'FAIL', error: error.message };
      }
    })
  );
  
  const failed = results.filter(r => r.status === 'FAIL');
  const overall = failed.length === 0 ? 'HEALTHY' : 'UNHEALTHY';
  
  return { overall, results, timestamp: Date.now() };
}
```

### Performance Metrics
```javascript
class MetricsCollector {
  constructor() {
    this.metrics = {
      agent_executions: [],
      tool_calls: [],
      errors: [],
      performance: []
    };
  }
  
  recordAgentExecution(agentType, duration, success) {
    this.metrics.agent_executions.push({
      agent_type: agentType,
      duration,
      success,
      timestamp: Date.now()
    });
  }
  
  recordToolCall(toolName, duration, success) {
    this.metrics.tool_calls.push({
      tool: toolName,
      duration,
      success,
      timestamp: Date.now()
    });
  }
  
  getPerformanceReport() {
    const report = {
      timestamp: Date.now(),
      summary: {}
    };
    
    // Agent performance
    for (const agentType of ['explore', 'general', 'sisyphus', 'hephaestus']) {
      const executions = this.metrics.agent_executions
        .filter(m => m.agent_type === agentType);
      
      if (executions.length > 0) {
        report.summary[agentType] = {
          count: executions.length,
          avg_duration: average(executions.map(e => e.duration)),
          success_rate: executions.filter(e => e.success).length / executions.length
        };
      }
    }
    
    // Tool performance
    for (const tool of ['batch_read', 'ast_search', 'evolve_exe']) {
      const calls = this.metrics.tool_calls.filter(m => m.tool === tool);
      
      if (calls.length > 0) {
        report.summary[tool] = {
          count: calls.length,
          avg_duration: average(calls.map(c => c.duration)),
          success_rate: calls.filter(c => c.success).length / calls.length
        };
      }
    }
    
    return report;
  }
}
```

## Emergency Procedures

### System Overload Response
```javascript
async function handleSystemOverload() {
  // Immediate actions
  await setSystemStatus('OVERLOAD_EMERGENCY');
  
  // Stop non-critical agents
  const nonCritical = identifyNonCriticalAgents();
  for (const agent of nonCritical) {
    await stopAgentGracefully(agent.id);
  }
  
  // Reduce concurrency
  await reduceConcurrencyLimits(0.5); // 50% reduction
  
  // Clear caches
  await clearAllCaches();
  
  // Monitor recovery
  const recovery = await monitorRecovery();
  
  if (recovery.stabilized) {
    // Gradual restoration
    await graduallyRestoreFunctionality();
    return { status: 'RECOVERED', recovery_time: recovery.time };
  } else {
    // Full shutdown
    await emergencyShutdown();
    return { status: 'SHUTDOWN', reason: 'RECOVERY_FAILED' };
  }
}
```

### Data Loss Prevention
```javascript
async function preventDataLoss(sessionId, criticalData) {
  // Immediate backup
  const backupId = await createBackup(sessionId, criticalData);
  
  // Verify backup
  const valid = await verifyBackup(backupId);
  
  if (!valid) {
    // Alternative backup
    const altBackupId = await createAlternativeBackup(criticalData);
    const altValid = await verifyBackup(altBackupId);
    
    if (!altValid) {
      // Last resort: in-memory preservation
      preserveInMemory(criticalData);
      return { status: 'CRITICAL', preserved_in_memory: true };
    }
    
    return { status: 'RECOVERED', backup_id: altBackupId };
  }
  
  // Schedule regular backups
  await scheduleBackups(sessionId);
  
  return { status: 'PROTECTED', backup_id: backupId };
}
```

## Integration Protocols

### Shark Agent Dual-Mode
```javascript
async function executeDualMode(task, context) {
  // Determine initial provider
  const provider = determineProvider(task);
  
  try {
    // Execute with primary
    const result = await shark_agent.execute({
      task: task.description,
      context: context,
      provider: provider,
      mode: 'PRIMARY'
    });
    
    // Check confidence
    if (result.confidence >= 0.8) {
      return {
        ...result,
        provider_used: provider,
        mode: 'PRIMARY',
        switched: false
      };
    }
    
    // Switch to secondary
    const secondaryResult = await shark_agent.execute({
      task: task.description,
      context: context,
      provider: 'SECONDARY',
      mode: 'FALLBACK'
    });
    
    return {
      ...secondaryResult,
      provider_used: 'SECONDARY',
      mode: 'FALLBACK',
      switched: true,
      primary_confidence: result.confidence
    };
    
  } catch (error) {
    // Emergency fallback
    const emergencyResult = await shark_agent.execute({
      task: task.description,
      context: context,
      provider: 'LOCAL',
      mode: 'EMERGENCY'
    });
    
    return {
      ...emergencyResult,
      provider_used: 'LOCAL',
      mode: 'EMERGENCY',
      switched: true,
      error: error.message
    };
  }
}
```

### vLLM Local Integration
```javascript
async function setupLocalVLLM() {
  // Check status
  const status = await checkVLLMStatus();
  
  if (!status.running) {
    // Start server
    await startVLLMServer({
      model: 'Qwen2.5-7B-Instruct',
      port: 8000,
      gpu_memory_utilization: 0.9
    });
    
    // Wait for readiness
    await waitForVLLMReady(30000);
    
    // Verify model
    const modelStatus = await verifyModelLoaded();
    if (!modelStatus.loaded) {
      throw new Error(`Model load failed: ${modelStatus.error}`);
    }
  }
  
  // Configure endpoint
  await configureLocalEndpoint('http://localhost:8000/v1');
  
  return {
    success: true,
    endpoint: 'http://localhost:8000/v1',
    model: 'Qwen2.5-7B-Instruct',
    status: 'READY'
  };
}
```

## Operational Checklists

### Daily Startup
```javascript
const DAILY_CHECKLIST = [
  { id: 'CONFIG', action: verifyConfiguration, critical: true },
  { id: 'GLM_API', action: testGLMConnectivity, critical: true },
  { id: 'VLLM', action: checkLocalVLLM, critical: false },
  { id: 'TOOLS', action: verifyTools, critical: true },
  { id: 'AGENTS', action: verifyAgents, critical: true },
  { id: 'STORAGE', action: checkDiskSpace, critical: false },
  { id: 'MEMORY', action: checkMemory, critical: false }
];

async function runDailyChecklist() {
  const results = [];
  
  for (const item of DAILY_CHECKLIST) {
    try {
      const result = await item.action();
      results.push({
        item: item.id,
        status: 'PASS',
        critical: item.critical,
        details: result
      });
    } catch (error) {
      results.push({
        item: item.id,
        status: 'FAIL',
        critical: item.critical,
        error: error.message
      });
      
      if (item.critical) {
        throw new Error(`Critical check failed: ${item.id} - ${error.message}`);
      }
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    overall: results.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL',
    results
  };
}
```

### Session Cleanup
```javascript
async function performSessionCleanup() {
  // Identify old sessions (>24 hours)
  const sessions = await listSessions();
  const now = Date.now();
  const oldSessions = sessions.filter(s => 
    (now - s.last_activity) > 24 * 60 * 60 * 1000
  );
  
  // Archive important sessions
  const important = oldSessions.filter(s => s.important);
  await archiveSessions(important);
  
  // Delete non-important
  const toDelete = oldSessions.filter(s => !s.important);
  let deleted = 0;
  const failures = [];
  
  for (const session of toDelete) {
    try {
      await deleteSession(session.id);
      deleted++;
    } catch (error) {
      failures.push({ id: session.id, error: error.message });
    }
  }
  
  // Clean temp files
  await cleanupTempFiles();
  
  return {
    total_sessions: sessions.length,
    old_sessions: oldSessions.length,
    archived: important.length,
    deleted,
    failures: failures.length,
    temp_files_cleaned: true
  };
}
```

## Command Reference

### System Commands
```bash
opencode ultra status                    # System status
opencode ultra agents list              # Available agents
opencode ultra tools list               # Available tools
opencode ultra config validate          # Validate configuration
opencode ultra monitor start            # Start monitoring
opencode ultra session list             # Active sessions
opencode ultra cleanup run              # Run cleanup
opencode ultra emergency stop           # Emergency stop
opencode ultra emergency recover        # Emergency recovery
```

### Diagnostic Commands
```bash
opencode ultra health                   # Health check
opencode ultra metrics                  # Performance metrics
opencode ultra logs --tail 100          # Recent logs
opencode ultra debug agent <id>         # Debug specific agent
opencode ultra debug tool <name>        # Debug specific tool
```

## Configuration Templates

### Development Configuration
```json
{
  "agents": {
    "explore": {"model": "glm-4.5-flash", "concurrency": 3, "timeout": 120000},
    "general": {"model": "glm-4.7", "concurrency": 2, "timeout": 180000}
  },
  "safety": {
    "maxSpawnedSessions": 5,
    "maxAgentRuntime": 300000,
    "enableCircuitBreaker": true,
    "circuitBreakerThreshold": 3
  }
}
```

### Production Configuration
```json
{
  "agents": {
    "explore": {"model": "glm-4.5-flash", "concurrency": 5, "timeout": 90000},
    "general": {"model": "glm-4.7", "concurrency": 3, "timeout": 180000},
    "sisyphus": {"model": "glm-5", "concurrency": 2, "timeout": 300000},
    "hephaestus": {"model": "glm-4.7", "concurrency": 3, "timeout": 240000}
  },
  "safety": {
    "maxSpawnedSessions": 10,
    "maxAgentRuntime": 360000,
    "enableCircuitBreaker": true,
    "circuitBreakerThreshold": 5
  }
}
```

## Performance Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Memory | >400MB | >600MB | Clear cache, stop agents |
| Active Agents | >7 | >10 | Stop new tasks |
| Response Time | >10s | >30s | Reduce complexity |
| Error Rate | >5% | >15% | Switch providers |
| GLM Latency | >2s | >5s | Use local vLLM |
| Disk Space | <5GB | <1GB | Cleanup sessions |

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-25  
**For**: AI Agents & Orchestrators  
**Status**: Complete Operational Manual  
**Validation**: All procedures compatible with current GLM configuration