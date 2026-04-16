# 🦈 SHARK SAFETY STACK INTEGRATION WITH OPENCODE

## Overview
Integration of Shark Frankenstein's mechanical enforcement systems with OpenCode's execution pipeline. Provides Guardian protection, workflow enforcement, and auto-debug capabilities to all OpenCode operations.

## Integration Architecture

### 1. Guardian File Protection System
**Purpose**: Prevent unauthorized file operations
**Integration Point**: Wrap all file read/write/delete operations

```bash
# Guardian Protection Levels
1. MAXIMUM: Block all system file operations
2. BALANCED: Allow with backup (default)
3. PERMISSIVE: Allow with warning
4. YOLO: No protection (bypass all)
```

### 2. Workflow Machine
**Purpose**: Enforce 5-step workflow (PLAN → BUILD → TEST → VERIFY → SHIP)
**Integration Point**: Command execution pipeline

### 3. Auto-Debug Engine
**Purpose**: Automatic error detection and fixing
**Integration Point**: Error handling system

### 4. FirewallMesh
**Purpose**: Monitor and block suspicious tool calls
**Integration Point**: Tool execution registry

## Implementation Details

### Guardian Integration Hooks

#### File Operation Wrappers
```typescript
// Guardian-protected file operations
class GuardedFileSystem {
  constructor(private guardian: Guardian) {}
  
  async readFile(path: string): Promise<string> {
    const decision = this.guardian.checkPermission(path, 'read');
    if (decision === ModificationDecision.BLOCK) {
      throw new Error(`Guardian blocked read: ${path}`);
    }
    return fs.readFileSync(path, 'utf-8');
  }
  
  async writeFile(path: string, content: string): Promise<void> {
    const decision = this.guardian.checkPermission(path, 'write');
    if (decision === ModificationDecision.BLOCK) {
      throw new Error(`Guardian blocked write: ${path}`);
    }
    
    if (decision === ModificationDecision.BACKUP_THEN_ALLOW) {
      await this.guardian.createBackup(path);
    }
    
    return fs.writeFileSync(path, content, 'utf-8');
  }
}
```

#### System File Protection
```typescript
// Protected system paths (always blocked)
const PROTECTED_PATHS = [
  '/etc/passwd', '/etc/shadow', '/etc/sudoers',
  '/root/', '/home/*/.ssh/', '~/.ssh/',
  '/var/log/', '/proc/', '/sys/',
  '*.pem', '*.key', '*.env', '.env*'
];

class SystemGuardian {
  isProtected(path: string): boolean {
    const normalized = path.replace(/^~/, process.env.HOME || '');
    return PROTECTED_PATHS.some(pattern => 
      minimatch(normalized, pattern)
    );
  }
}
```

### Workflow Integration Hooks

#### Step Enforcement
```typescript
class WorkflowEnforcer {
  private currentStep: WorkflowStep = WorkflowStep.PLAN;
  
  async enforceStep(requiredStep: WorkflowStep, action: string): Promise<void> {
    if (this.currentStep !== requiredStep) {
      throw new WorkflowViolationError(
        `Cannot ${action} in ${WorkflowStep[this.currentStep]} step. ` +
        `Required: ${WorkflowStep[requiredStep]}`
      );
    }
  }
  
  async advanceStep(): Promise<void> {
    // Mechanical validation before advancing
    await this.validateStepCompletion();
    this.currentStep = this.getNextStep(this.currentStep);
  }
  
  private async validateStepCompletion(): Promise<void> {
    // Mechanical validation - no AI inference
    switch (this.currentStep) {
      case WorkflowStep.PLAN:
        await this.validatePlanExists();
        break;
      case WorkflowStep.BUILD:
        await this.validateBuildArtifacts();
        break;
      case WorkflowStep.TEST:
        await this.validateTestResults();
        break;
      case WorkflowStep.VERIFY:
        await this.validateVerification();
        break;
    }
  }
}
```

#### Command Pipeline Integration
```typescript
// Wrap OpenCode's command execution
class GuardedCommandExecutor {
  constructor(
    private workflow: WorkflowEnforcer,
    private guardian: Guardian
  ) {}
  
  async execute(command: string, args: any[]): Promise<any> {
    // Check workflow step
    await this.workflow.enforceStep(
      this.getRequiredStep(command),
      command
    );
    
    // Check file permissions
    const filePaths = this.extractFilePaths(command, args);
    for (const path of filePaths) {
      const decision = this.guardian.checkPermission(path, this.getOperation(command));
      if (decision === ModificationDecision.BLOCK) {
        throw new GuardianBlockedError(`Guardian blocked: ${path}`);
      }
    }
    
    // Execute with auto-debug wrapper
    return await this.executeWithAutoDebug(command, args);
  }
}
```

### Auto-Debug Integration Hooks

#### Error Pattern Matching
```typescript
class AutoDebugIntegrator {
  private patterns = [
    {
      pattern: /command not found: (\w+)/,
      fix: (match: RegExpMatchArray) => `npm install -g ${match[1]}`,
      description: "Missing command - install globally"
    },
    {
      pattern: /Cannot find module ['"]([^'"]+)['"]/,
      fix: (match: RegExpMatchArray) => `npm install ${match[1]}`,
      description: "Missing npm module"
    },
    {
      pattern: /permission denied/i,
      fix: () => `chmod +x ${this.getScriptPath()}`,
      description: "Permission denied - make executable"
    },
    {
      pattern: /no such file or directory: ([^\s]+)/,
      fix: (match: RegExpMatchArray) => `mkdir -p $(dirname "${match[1]}")`,
      description: "Missing directory - create parent"
    }
  ];
  
  async tryAutoFix(error: string): Promise<AutoFixResult> {
    for (const pattern of this.patterns) {
      const match = error.match(pattern.pattern);
      if (match) {
        const fixCommand = pattern.fix(match);
        return {
          success: true,
          fix: fixCommand,
          description: pattern.description,
          pattern: pattern.pattern.source
        };
      }
    }
    return { success: false };
  }
}
```

#### Prevention Tips
```typescript
class PreventionTipGenerator {
  getTips(command: string): string[] {
    const tips: string[] = [];
    
    if (command.includes('rm') || command.includes('delete')) {
      tips.push('⚠️  Delete operations are monitored by Guardian');
      tips.push('💡 Consider using --dry-run first');
    }
    
    if (command.includes('git push')) {
      tips.push('⚠️  Verify all tests pass before pushing');
      tips.push('💡 Run: npm test && git push');
    }
    
    if (command.includes('npm install')) {
      tips.push('⚠️  Check package.json for version conflicts');
      tips.push('💡 Consider: npm ci for clean install');
    }
    
    return tips;
  }
}
```

### FirewallMesh Integration

#### Tool Call Monitoring
```typescript
class ToolFirewall {
  private blockedTools = ['eval', 'exec', 'child_process.spawn'];
  private suspiciousPatterns = [
    /curl.*https?:\/\/[^\s]+\s*\|.*sh/,
    /wget.*https?:\/\/[^\s]+\s*-O.*\.sh/,
    /rm.*-rf.*\/(etc|root|home|var)/
  ];
  
  async checkToolCall(tool: string, args: any[]): Promise<FirewallDecision> {
    // Check blocked tools
    if (this.blockedTools.includes(tool)) {
      return { allowed: false, reason: 'Tool is blocked by firewall' };
    }
    
    // Check suspicious patterns
    const commandString = JSON.stringify(args);
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(commandString)) {
        return { 
          allowed: false, 
          reason: 'Suspicious command pattern detected' 
        };
      }
    }
    
    // Rate limiting
    if (!this.checkRateLimit(tool)) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }
    
    return { allowed: true };
  }
}
```

## Configuration Integration

### OpenCode Configuration Extension
```json
{
  "sharkSafety": {
    "enabled": true,
    "guardian": {
      "level": "balanced",
      "protectedPaths": [
        "/etc/",
        "/root/",
        "~/.ssh/",
        "*.env",
        "*.pem"
      ],
      "autoBackup": true
    },
    "workflow": {
      "enforced": true,
      "strict": true,
      "validation": "mechanical"
    },
    "autoDebug": {
      "enabled": true,
      "autoFix": true,
      "preventionTips": true
    },
    "firewall": {
      "enabled": true,
      "blockedTools": ["eval", "exec"],
      "rateLimit": 10
    }
  }
}
```

### Environment Variables
```bash
# Guardian settings
export SHARK_GUARDIAN_LEVEL="balanced"
export SHARK_GUARDIAN_AUTO_BACKUP="true"

# Workflow settings
export SHARK_WORKFLOW_ENFORCED="true"
export SHARK_WORKFLOW_STRICT="true"

# Auto-debug settings
export SHARK_AUTODEBUG_ENABLED="true"
export SHARK_AUTODEBUG_AUTOFIX="true"

# Firewall settings
export SHARK_FIREWALL_ENABLED="true"
export SHARK_FIREWALL_RATE_LIMIT="10"
```

## Integration Points with OpenCode

### 1. Session Processor Integration
**File**: `src/session/processor.ts`
**Hook**: Wrap `processToolCall` method

```typescript
// Modified OpenCode processor
class SharkEnhancedProcessor extends SessionProcessor {
  constructor(
    private guardian: Guardian,
    private workflow: WorkflowEnforcer,
    private firewall: ToolFirewall
  ) {
    super();
  }
  
  async processToolCall(toolCall: ToolCall): Promise<ToolResult> {
    // Firewall check
    const firewallDecision = await this.firewall.checkToolCall(
      toolCall.name, 
      toolCall.arguments
    );
    
    if (!firewallDecision.allowed) {
      return {
        type: 'error',
        content: `Firewall blocked: ${firewallDecision.reason}`
      };
    }
    
    // Workflow enforcement
    await this.workflow.enforceStepForTool(toolCall.name);
    
    // Guardian check for file operations
    if (this.isFileOperation(toolCall)) {
      const filePath = this.extractFilePath(toolCall);
      const guardianDecision = this.guardian.checkPermission(
        filePath, 
        this.getOperationType(toolCall)
      );
      
      if (guardianDecision === ModificationDecision.BLOCK) {
        return {
          type: 'error',
          content: `Guardian blocked: ${filePath}`
        };
      }
    }
    
    // Execute with auto-debug wrapper
    try {
      return await super.processToolCall(toolCall);
    } catch (error) {
      // Auto-debug attempt
      const fixResult = await this.autoDebug.tryAutoFix(error.message);
      if (fixResult.success) {
        return {
          type: 'error',
          content: `Error: ${error.message}\nAuto-fix: ${fixResult.fix}`
        };
      }
      throw error;
    }
  }
}
```

### 2. Tool Registry Integration
**File**: `src/tool/registry.ts`
**Hook**: Wrap tool registration

```typescript
class GuardedToolRegistry extends ToolRegistry {
  registerTool(tool: Tool): void {
    // Add safety wrappers to file operations
    if (tool.name.includes('file') || tool.name.includes('write')) {
      tool = this.wrapWithGuardian(tool);
    }
    
    if (tool.name.includes('exec') || tool.name.includes('shell')) {
      tool = this.wrapWithFirewall(tool);
    }
    
    super.registerTool(tool);
  }
  
  private wrapWithGuardian(tool: Tool): Tool {
    const originalExecute = tool.execute;
    tool.execute = async (args: any) => {
      // Guardian check
      const filePath = args.path || args.file;
      if (filePath) {
        const decision = this.guardian.checkPermission(
          filePath, 
          tool.name.includes('read') ? 'read' : 'write'
        );
        
        if (decision === ModificationDecision.BLOCK) {
          throw new Error(`Guardian blocked: ${filePath}`);
        }
      }
      
      return originalExecute.call(tool, args);
    };
    
    return tool;
  }
}
```

### 3. Error Handler Integration
**File**: `src/session/error-handler.ts`
**Hook**: Enhanced error handling

```typescript
class SharkErrorHandler extends ErrorHandler {
  async handleError(error: Error, context: any): Promise<ErrorResponse> {
    // Auto-debug analysis
    const analysis = await this.autoDebug.analyze(error);
    
    if (analysis.hasFix) {
      return {
        type: 'auto_fix',
        error: error.message,
        fix: analysis.fix,
        description: analysis.description
      };
    }
    
    // Workflow violation detection
    if (this.isWorkflowViolation(error)) {
      return {
        type: 'workflow_violation',
        error: error.message,
        currentStep: this.workflow.getCurrentStep(),
        requiredStep: this.extractRequiredStep(error),
        nextSteps: this.getWorkflowRecoverySteps()
      };
    }
    
    return super.handleError(error, context);
  }
}
```

## Testing the Integration

### Test Suite
```bash
# Test Guardian protection
shark-oc "try to write to /etc/passwd"
# Expected: Guardian blocked error

# Test workflow enforcement
shark-oc "build project"  # Without plan
# Expected: Workflow violation error

# Test auto-debug
shark-oc "run missing-script.sh"
# Expected: Auto-fix suggestion to create script

# Test firewall
shark-oc "eval malicious_code"
# Expected: Firewall blocked error
```

### Integration Verification
1. **Guardian**: Blocks system file writes
2. **Workflow**: Enforces step sequence
3. **AutoDebug**: Provides fixes for common errors
4. **Firewall**: Blocks dangerous tools
5. **Performance**: Minimal overhead added

## Performance Considerations

### Overhead Analysis
- Guardian checks: < 5ms per file operation
- Workflow validation: < 10ms per command
- Auto-debug analysis: < 50ms per error
- Firewall checks: < 2ms per tool call

### Optimization Strategies
1. **Caching**: Cache guardian decisions for repeated paths
2. **Lazy Validation**: Defer workflow validation until necessary
3. **Pattern Pre-compilation**: Pre-compile regex patterns
4. **Batch Processing**: Batch similar safety checks

## Deployment

### Installation Script
```bash
#!/bin/bash
# Install Shark safety stack for OpenCode

echo "Installing Shark safety stack..."

# 1. Copy configuration
cp shark-safety-config.json ~/.config/opencode/

# 2. Install dependencies
npm install @leviathan/shark-safety-stack

# 3. Patch OpenCode (if needed)
node patch-opencode.js

# 4. Verify installation
shark-oc --test-safety

echo "Installation complete!"
```

### Migration Guide
1. Backup existing OpenCode configuration
2. Install Shark safety stack
3. Test with non-critical tasks
4. Monitor for performance issues
5. Adjust configuration as needed

## Monitoring & Analytics

### Safety Metrics
```typescript
interface SafetyMetrics {
  guardian: {
    blocks: number;
    warnings: number;
    backups: number;
    topBlockedPaths: string[];
  };
  workflow: {
    violations: number;
    enforcedSteps: number;
    completionRate: number;
  };
  autoDebug: {
    fixesAttempted: number;
    fixesSuccessful: number;
    successRate: number;
  };
  firewall: {
    blocks: number;
    suspiciousPatterns: number;
    rateLimitHits: number;
  };
}
```

### Alerting
- Real-time alerts for critical violations
- Daily safety reports
- Performance degradation alerts
- Configuration change notifications

## Conclusion

The Shark safety stack integration provides mechanical enforcement layers to OpenCode, ensuring:
1. **Safety**: Protected file operations and system integrity
2. **Quality**: Enforced development workflow
3. **Reliability**: Automatic error recovery
4. **Security**: Tool call monitoring and blocking

This transforms OpenCode from a powerful AI coding assistant into a trustworthy, production-ready development environment with built-in guardrails.