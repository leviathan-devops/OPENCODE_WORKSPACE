# 🛡️ MECHANICAL ENFORCEMENT INTEGRATION POINTS

**Date**: March 30, 2026  
**Goal**: Detailed mapping of Shark mechanical systems to OpenCode architecture  
**Approach**: Hook-based integration preserving OpenCode architecture while adding enforcement

---

## 🎯 INTEGRATION STRATEGY

### **Core Principle**: "Intercept, Validate, Execute"
1. **Intercept** tool calls at OpenCode execution points
2. **Validate** through Shark mechanical enforcement systems
3. **Execute** only if all validation passes
4. **Audit** all decisions for transparency and debugging

### **Integration Layers**:
```
┌─────────────────────────────────────────────────┐
│            OPENCODE EXECUTION FLOW              │
├─────────────────────────────────────────────────┤
│  User Input → Agent → Tool Call → Execution     │
│         │         │         │         │         │
│         ▼         ▼         ▼         ▼         │
│  ┌─────────────────────────────────────────┐    │
│  │        SHARK ENFORCEMENT HOOKS          │    │
│  ├─────────────────────────────────────────┤    │
│  │ 1. Session Hook  → Workflow Validation  │    │
│  │ 2. Agent Hook    → Dual-Brain Routing   │    │
│  │ 3. Tool Hook     → FirewallMesh Check   │    │
│  │ 4. File Hook     → Guardian Permission  │    │
│  │ 5. Error Hook    → AutoDebug Fixing     │    │
│  └─────────────────────────────────────────┘    │
│         │         │         │         │         │
│         ▼         ▼         ▼         ▼         │
│  ┌─────────────────────────────────────────┐    │
│  │         MECHANICAL ENFORCEMENT          │    │
│  ├─────────────────────────────────────────┤    │
│  │ • Guardian (Filesystem)                 │    │
│  │ • FirewallMesh (4 parallel)             │    │
│  │ • WorkflowBlocker (5-step)              │    │
│  │ • StagnationDetector (Loops)            │    │
│  │ • AutoDebugEngine (Fixes)               │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## 🔧 CRITICAL INTEGRATION POINTS

### **1. TOOL EXECUTION PIPELINE**

#### **Location**: `packages/opencode/src/tool/registry.ts`
```typescript
// Original OpenCode method
class ToolRegistry {
  async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.getTool(toolCall.name);
    return await tool.execute(toolCall.arguments);
  }
}

// Shark-enhanced version
class SharkEnhancedToolRegistry extends ToolRegistry {
  private sharkFirewallMesh: FirewallMesh;
  private sharkGuardian: Guardian;
  
  async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    // === SHARK INTERCEPTION POINT 1: Pre-execution validation ===
    
    // 1. FirewallMesh parallel check (4 firewalls in <50ms)
    const firewallResult = await this.sharkFirewallMesh.checkToolCall(
      toolCall,
      this.getCurrentWorkflowStep()
    );
    
    if (!firewallResult.allowed) {
      this.auditBlock('firewall', toolCall, firewallResult.reason);
      return this.createBlockedResult(toolCall, firewallResult);
    }
    
    // 2. Guardian filesystem protection (for file operations)
    if (this.isFileOperation(toolCall)) {
      const filePath = this.extractFilePath(toolCall);
      const guardianDecision = this.sharkGuardian.checkPermission(
        filePath,
        this.getOperationType(toolCall)
      );
      
      if (guardianDecision === 'DENY') {
        this.auditBlock('guardian', toolCall, `Blocked write to ${filePath}`);
        return this.createBlockedResult(toolCall, 'Guardian blocked operation');
      }
      
      if (guardianDecision === 'SANDBOX_REDIRECT') {
        // Redirect to sandbox location
        toolCall = this.redirectToSandbox(toolCall, filePath);
      }
    }
    
    // 3. Anti-hallucination check for plan/design operations
    if (this.isPlanningOperation(toolCall)) {
      const theatricalPatterns = this.mechanicalValidator.detectTheatrical(
        JSON.stringify(toolCall.arguments)
      );
      
      if (theatricalPatterns.length > 0) {
        this.auditBlock('anti-hallucination', toolCall, 
          `Theatrical patterns: ${theatricalPatterns.join(', ')}`);
        return this.createBlockedResult(toolCall, 'Anti-hallucination check failed');
      }
    }
    
    // === EXECUTE ORIGINAL OPENCODE LOGIC ===
    try {
      const result = await super.executeTool(toolCall);
      
      // === SHARK INTERCEPTION POINT 2: Post-execution processing ===
      
      // 4. Stagnation detection (record success/failure)
      this.stagnationDetector.recordOperation(toolCall, result.success);
      
      // 5. AutoDebug on failure
      if (!result.success && this.shouldAutoDebug(toolCall, result)) {
        const fixAttempt = await this.autoDebugEngine.attemptFix(toolCall, result);
        if (fixAttempt.success) {
          return await super.executeTool(fixAttempt.fixedToolCall);
        }
      }
      
      // 6. Audit logging
      this.auditLog(toolCall, result);
      
      return result;
      
    } catch (error) {
      // === SHARK INTERCEPTION POINT 3: Error handling ===
      
      // 7. Enhanced error handling with mechanical fixes
      const debugResult = await this.autoDebugEngine.diagnoseError(toolCall, error);
      
      if (debugResult.canFix) {
        this.log(`AutoDebug attempting fix: ${debugResult.fixStrategy}`);
        // Retry with fix
      }
      
      throw this.enhanceError(error, debugResult);
    }
  }
}
```

#### **Integration Hook Type**: Class Extension + Method Override
**Priority**: HIGH - This is the primary enforcement point
**Risk**: Medium (must preserve OpenCode tool compatibility)
**Fallback**: Graceful degradation to original OpenCode behavior

---

### **2. SESSION MANAGEMENT**

#### **Location**: `packages/opencode/src/session/processor.ts`
```typescript
// Original OpenCode session flow
class SessionProcessor {
  async process(session: Session): Promise<SessionResult> {
    // Process messages, manage agent interactions
  }
}

// Shark-enhanced version
class SharkEnhancedSessionProcessor extends SessionProcessor {
  private sharkWorkflowBlocker: WorkflowBlocker;
  private sharkDualBrainCoordinator: DualBrainCoordinator;
  
  async process(session: Session): Promise<SessionResult> {
    // === SHARK INTERCEPTION: Session-level validation ===
    
    // 1. Workflow step validation (PLAN→BUILD→TEST→VERIFY→SHIP)
    const currentStep = this.getSessionWorkflowStep(session);
    const nextStep = this.determineNextStep(session);
    
    const workflowCheck = this.sharkWorkflowBlocker.checkTransition(
      currentStep,
      nextStep,
      session
    );
    
    if (!workflowCheck.allowed) {
      return this.createWorkflowBlockedResult(session, workflowCheck);
    }
    
    // 2. Dual-brain routing for Shark mode
    if (this.isSharkMode(session)) {
      // Analyze task complexity, route to Micro vs Macro
      const engineerType = this.sharkDualBrainCoordinator.analyzeTask(
        session.currentTask
      );
      
      // Configure session for appropriate brain
      session = this.configureDualBrain(session, engineerType);
    }
    
    // 3. Stagnation detection at session level
    const stagnationAlert = this.stagnationDetector.checkSessionStagnation(session);
    if (stagnationAlert.triggered) {
      return this.handleStagnation(session, stagnationAlert);
    }
    
    // === PROCESS WITH ORIGINAL OPENCODE LOGIC ===
    const result = await super.process(session);
    
    // === POST-PROCESSING ===
    
    // 4. Update workflow state based on result
    this.updateWorkflowState(session, result);
    
    // 5. Log session metrics
    this.logSessionMetrics(session, result);
    
    return result;
  }
}
```

#### **Integration Hook Type**: Class Extension
**Priority**: HIGH - Controls overall session flow
**Risk**: Low (adds validation without breaking flow)
**Fallback**: Skip workflow validation if Shark systems unavailable

---

### **3. AGENT CREATION & CONFIGURATION**

#### **Location**: `packages/opencode/src/agent/factory.ts`
```typescript
// Original OpenCode agent factory
class AgentFactory {
  createAgent(config: AgentConfig): Agent {
    // Create agent based on configuration
  }
}

// Shark-enhanced version  
class SharkEnhancedAgentFactory extends AgentFactory {
  private sharkAgentEnhancer: AgentEnhancer;
  
  createAgent(config: AgentConfig): Agent {
    const baseAgent = super.createAgent(config);
    
    // === SHARK ENHANCEMENT: Agent capability injection ===
    
    // 1. Add mechanical enforcement hooks to agent
    const enhancedAgent = this.sharkAgentEnhancer.enhanceAgent(baseAgent, {
      // Injection points
      beforeToolCall: async (toolCall) => {
        return this.sharkFirewallMesh.checkToolCall(toolCall);
      },
      
      afterToolCall: async (toolCall, result) => {
        this.auditLog(toolCall, result);
      },
      
      onError: async (toolCall, error) => {
        return this.autoDebugEngine.diagnoseError(toolCall, error);
      }
    });
    
    // 2. Configure dual-brain for Shark mode agents
    if (config.mode === 'shark') {
      enhancedAgent.brainCoordinator = new DualBrainCoordinator({
        microThinker: new DeepSeekClient(),
        microExecutor: new QwenExecutor(),
        macroPrimary: new GLMClient(),
        macroAdvisory: new DeepSeekClient()
      });
    }
    
    // 3. Add workflow awareness
    enhancedAgent.workflowAware = true;
    enhancedAgent.getWorkflowStep = () => this.getCurrentWorkflowStep();
    
    return enhancedAgent;
  }
}
```

#### **Integration Hook Type**: Factory Pattern + Agent Decorator
**Priority**: MEDIUM - Enhances agent capabilities
**Risk**: Low (adds optional enhancements)
**Fallback**: Return base agent if enhancement fails

---

### **4. CONFIGURATION MANAGEMENT**

#### **Location**: `packages/opencode/src/config/config.ts`
```typescript
// Original OpenCode config
interface OpenCodeConfig {
  model?: string;
  agent?: string;
  // ... other OpenCode settings
}

// Shark-enhanced config
interface SharkEnhancedConfig extends OpenCodeConfig {
  shark?: {
    // Mechanical enforcement settings
    guardian: {
      enabled: boolean;
      protectionLevel: 'strict' | 'balanced' | 'permissive' | 'sandbox';
      blockedPaths: string[];
    };
    
    firewalls: {
      enabled: boolean;
      guardian: boolean;
      workflow: boolean;
      theatrical: boolean;
      secrets: boolean;
    };
    
    workflow: {
      enabled: boolean;
      enforceSteps: boolean;
      requireEvidence: boolean;
    };
    
    dualBrain: {
      enabled: boolean;
      autoRoute: boolean;
      microThinker: string; // e.g., 'deepseek-chat'
      microExecutor: string; // e.g., 'vllm-qwen'
      macroPrimary: string; // e.g., 'glm-5'
      macroAdvisory: string; // e.g., 'deepseek-reasoner'
    };
    
    autoDebug: {
      enabled: boolean;
      maxAttempts: number;
      patterns: string[];
    };
  };
}

// Config loader enhancement
class SharkEnhancedConfigLoader extends ConfigLoader {
  loadConfig(): SharkEnhancedConfig {
    const baseConfig = super.loadConfig();
    
    // Merge Shark defaults
    return {
      ...baseConfig,
      shark: this.mergeSharkConfig(baseConfig.shark)
    };
  }
  
  private mergeSharkConfig(userConfig?: Partial<SharkConfig>): SharkConfig {
    return {
      guardian: {
        enabled: true,
        protectionLevel: 'balanced',
        blockedPaths: ['/etc', '/usr', '~/.ssh', '/root', '/proc', '/sys', '/dev'],
        ...userConfig?.guardian
      },
      // ... other defaults
    };
  }
}
```

#### **Integration Hook Type**: Configuration Extension
**Priority**: MEDIUM - Enables user configuration
**Risk**: Very Low (adds optional configuration)
**Fallback**: Use defaults if config loading fails

---

### **5. ERROR HANDLING & RECOVERY**

#### **Location**: Multiple error handling points
```typescript
// Centralized error interceptor
class SharkErrorInterceptor {
  constructor(
    private autoDebugEngine: AutoDebugEngine,
    private stagnationDetector: StagnationDetector
  ) {}
  
  async interceptError(
    context: ErrorContext,
    error: Error
  ): Promise<ErrorHandlingResult> {
    // === SHARK ENHANCED ERROR HANDLING ===
    
    // 1. Classify error type
    const errorType = this.classifyError(error, context);
    
    // 2. Check for stagnation (repeated failures)
    const stagnationAlert = this.stagnationDetector.recordFailure(
      context.toolCall,
      errorType
    );
    
    if (stagnationAlert.triggered) {
      return {
        action: 'escalate',
        message: `Stagnation detected: ${stagnationAlert.reason}`,
        escalation: stagnationAlert.escalationPath
      };
    }
    
    // 3. Attempt AutoDebug fix for known patterns
    if (this.autoDebugEngine.canFix(errorType, context)) {
      const fixAttempt = await this.autoDebugEngine.attemptFix(context);
      
      if (fixAttempt.success) {
        return {
          action: 'retry',
          message: `AutoDebug fix applied: ${fixAttempt.strategy}`,
          fixedContext: fixAttempt.fixedContext
        };
      }
    }
    
    // 4. Enhanced error reporting
    const enhancedError = this.enhanceError(error, {
      context,
      errorType,
      suggestedFix: this.suggestFix(errorType),
      documentationLink: this.getDocumentationLink(errorType)
    });
    
    return {
      action: 'report',
      error: enhancedError
    };
  }
}

// Integration into OpenCode error handling
const originalErrorHandler = process.listeners('uncaughtException');
process.removeAllListeners('uncaughtException');

process.on('uncaughtException', async (error) => {
  const interceptor = new SharkErrorInterceptor();
  const result = await interceptor.interceptError(
    getCurrentContext(),
    error
  );
  
  if (result.action === 'retry') {
    // Retry with fixed context
    await retryOperation(result.fixedContext);
  } else {
    // Enhanced error reporting
    console.error(result.error);
    
    // Call original handlers
    originalErrorHandler.forEach(handler => handler(error));
  }
});
```

#### **Integration Hook Type**: Error Interceptor + Process Hooks
**Priority**: HIGH - Critical for reliability
**Risk**: Medium (must not break existing error handling)
**Fallback**: Fall back to original error handling

---

## 🎯 INTEGRATION PRIORITY MATRIX

| Integration Point | Priority | Risk | Effort | Impact | Dependencies |
|-------------------|----------|------|--------|--------|--------------|
| Tool Execution | HIGH | Medium | High | Critical | FirewallMesh, Guardian |
| Session Management | HIGH | Low | Medium | High | WorkflowBlocker |
| Error Handling | HIGH | Medium | Medium | High | AutoDebugEngine |
| Configuration | MEDIUM | Low | Low | Medium | - |
| Agent Factory | MEDIUM | Low | Medium | Medium | DualBrainCoordinator |
| UI Enhancements | LOW | Low | High | Low | - |

---

## 🔧 IMPLEMENTATION SEQUENCE

### **Phase 1: Core Enforcement (Week 1-2)**
1. **Tool Execution Wrapper** - Highest impact, enables all other enforcement
2. **Configuration System** - Required for user control
3. **Basic Error Interceptor** - Foundation for reliability

### **Phase 2: Intelligence Layer (Week 3-4)**
1. **Dual-Brain Integration** - Micro/Macro routing
2. **Workflow Enforcement** - Step validation
3. **Enhanced Agent Factory** - Agent capability injection

### **Phase 3: Advanced Features (Week 5-6)**
1. **AutoDebug Integration** - Pattern-based fixing
2. **Stagnation Detection** - Loop prevention
3. **Comprehensive Auditing** - Full transparency

### **Phase 4: Polish & Optimization (Week 7-8)**
1. **Performance Optimization** - Minimize overhead
2. **UI Integration** - Status indicators, controls
3. **Documentation & Examples** - User education

---

## 🚨 RISK MITIGATION STRATEGIES

### **Risk 1: Breaking OpenCode Compatibility**
**Mitigation**:
- Extensive integration testing
- Feature flags for all Shark enhancements
- Graceful degradation when Shark systems fail
- Compatibility test suite

### **Risk 2: Performance Overhead**
**Mitigation**:
- FirewallMesh parallel execution (<50ms target)
- Lazy loading of Shark systems
- Performance profiling and optimization
- Configurable enforcement levels

### **Risk 3: User Confusion**
**Mitigation**:
- Clear visual indicators of Shark enforcement
- Configurable enforcement levels
- Comprehensive documentation
- Help system integration

### **Risk 4: Maintenance Burden**
**Mitigation**:
- Clean separation between OpenCode and Shark code
- Comprehensive test coverage
- Automated CI/CD pipeline
- Contribution guidelines

---

## 🧪 TESTING STRATEGY

### **Unit Tests**
```typescript
// Test each integration point in isolation
describe('Shark Tool Registry', () => {
  test('blocks dangerous file operations', async () => {
    const registry = new SharkEnhancedToolRegistry();
    const result = await registry.executeTool({
      name: 'write_file',
      arguments: { file_path: '/etc/passwd', content: 'test' }
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Guardian blocked');
  });
});
```

### **Integration Tests**
```typescript
// Test full OpenCode + Shark integration
describe('Shark-enhanced OpenCode', () => {
  test('full session with mechanical enforcement', async () => {
    const opencode = new SharkEnhancedOpenCode();
    const session = await opencode.createSession();
    
    // Attempt dangerous operation
    const result = await session.execute('write to /etc/passwd');
    
    // Verify enforcement worked
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('Guardian');
  });
});
```

### **Performance Tests**
```typescript
// Measure overhead
describe('Performance impact', () => {
  test('tool execution overhead < 50ms', async () => {
    const start = Date.now();
    
    // Execute 100 tool calls with Shark enforcement
    for (let i = 0; i < 100; i++) {
      await registry.executeTool(safeToolCall);
    }
    
    const duration = Date.now() - start;
    const avgOverhead = duration / 100;
    
    expect(avgOverhead).toBeLessThan(50); // < 50ms target
  });
});
```

### **Compatibility Tests**
```typescript
// Ensure OpenCode compatibility
describe('OpenCode compatibility', () => {
  test('all original OpenCode tests pass', async () => {
    // Run OpenCode's existing test suite
    const testResults = await runOpenCodeTestSuite();
    expect(testResults.passed).toBe(testResults.total);
  });
});
```

---

## 📊 MONITORING & METRICS

### **Key Metrics to Track**
```typescript
interface SharkMetrics {
  // Enforcement metrics
  guardian: {
    blocks: number;
    allows: number;
    sandboxRedirects: number;
    blockedPaths: string[];
  };
  
  firewallMesh: {
    checks: number;
    blocks: number;
    warnings: number;
    byFirewall: {
      guardian: number;
      workflow: number;
      theatrical: number;
      secrets: number;
    };
  };
  
  workflow: {
    stepTransitions: number;
    blocks: number;
    currentStep: string;
  };
  
  dualBrain: {
    microExecutions: number;
    macroExecutions: number;
    autoRoutes: number;
    manualOverrides: number;
  };
  
  autoDebug: {
    attempts: number;
    successes: number;
    failureRate: number;
    commonPatterns: string[];
  };
  
  performance: {
    toolExecutionOverhead: number;
    firewallCheckTime: number;
    guardianCheckTime: number;
  };
}
```

### **Monitoring Integration**
```typescript
// Integrate with OpenCode's existing monitoring
class SharkMetricsCollector {
  collect(): SharkMetrics {
    return {
      guardian: this.guardian.getMetrics(),
      firewallMesh: this.firewallMesh.getMetrics(),
      // ... other metrics
    };
  }
  
  // Export to OpenCode's monitoring system
  exportToOpenCodeMonitoring() {
    const metrics = this.collect();
    OpenCodeMonitoring.record('shark_metrics', metrics);
  }
}
```

---

## 🎯 SUCCESS CRITERIA

### **Technical Success**:
1. **100% tool execution interception** - All OpenCode tool calls pass through Shark validation
2. **<50ms average overhead** - Mechanical enforcement doesn't impact responsiveness
3. **0 breaking changes** - Full OpenCode API compatibility
4. **100% test coverage** - All integration points thoroughly tested

### **User Success**:
1. **Transparent enforcement** - Users understand when/why operations are blocked
2. **Configurable safety** - Users can adjust enforcement levels
3. **Improved reliability** - Fewer errors, better auto-recovery
4. **Preserved workflow** - OpenCode users feel immediately at home

### **Business Success**:
1. **Adoption rate** - % of OpenCode users choosing Shark-enhanced version
2. **Safety incidents prevented** - Dangerous operations blocked by Guardian
3. **Productivity improvement** - Time saved through AutoDebug and dual-brain routing
4. **Community engagement** - Contributions, feedback, plugin development

---

## 📝 NEXT STEPS

### **Immediate (Next 24 hours)**:
1. **Create integration proof-of-concept** - Basic tool execution wrapper
2. **Set up test environment** - Isolated testing of integration points
3. **Document exact hook locations** - Line numbers in OpenCode source

### **Short-term (Week 1)**:
1. **Implement core enforcement** - Tool execution + Guardian integration
2. **Create configuration system** - User control over enforcement
3. **Build test suite** - Comprehensive integration testing

### **Medium-term (Month 1)**:
1. **Complete all integration points** - Full mechanical enforcement
2. **Optimize performance** - Meet <50ms overhead target
3. **User testing** - Gather feedback, iterate on UX

### **Long-term (Quarter 1)**:
1. **Plugin ecosystem** - Extensible enforcement systems
2. **Advanced intelligence** - ML-based pattern detection
3. **Community adoption** - Become standard for power users

---

*Mechanical enforcement integration plan prepared for implementation*  
*Next: Begin Phase 1 - Core enforcement implementation*