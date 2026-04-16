# Shark Agent Plugin - Technical Specification

## Plugin Interface Specification

### Core Plugin Entry Point
```typescript
// src/index.ts
import type { PluginInput, Hooks } from '@opencode-ai/plugin';

export default async function sharkPlugin(input: PluginInput): Promise<Hooks> {
  const { client, project, directory, worktree, serverUrl, $ } = input;
  
  // Initialize plugin components
  const config = await SharkConfig.load(client);
  const wizard = new SharkModeWizard(client, config);
  const coordinator = await SharkCoordinator.create(config, client);
  const safety = new SafetyStack(config, directory);
  
  return {
    // Session lifecycle hooks
    'chat.message': async (input, output) => {
      const sessionID = input.sessionID;
      
      // Check if wizard should launch
      if (await wizard.shouldLaunch(sessionID)) {
        const mode = await wizard.launch(sessionID);
        await coordinator.initializeSession(sessionID, mode);
      }
      
      // Apply safety checks if shark mode is active
      if (await coordinator.isSharkModeActive(sessionID)) {
        await safety.applyChatSafety(input, output);
      }
    },
    
    // Tool execution safety
    'tool.execute.before': async (input, output) => {
      const sessionID = input.sessionID;
      
      if (await coordinator.isSharkModeActive(sessionID)) {
        const safetyResult = await safety.checkToolCall(
          input.tool,
          input.args,
          sessionID
        );
        
        if (!safetyResult.allowed) {
          throw new Error(`Safety check failed: ${safetyResult.reason}`);
        }
        
        // Apply workflow enforcement
        await coordinator.enforceWorkflowStep(
          sessionID,
          'TOOL_EXECUTION',
          { tool: input.tool }
        );
      }
    },
    
    // Model parameter adjustment
    'chat.params': async (input, output) => {
      const sessionID = input.sessionID;
      
      if (await coordinator.isSharkModeActive(sessionID)) {
        const brainConfig = await coordinator.getCurrentBrainConfig(sessionID);
        
        // Adjust model parameters based on current brain
        output.temperature = brainConfig.temperature || 0.7;
        output.topP = brainConfig.topP || 0.9;
        output.options = {
          ...output.options,
          ...brainConfig.modelOptions
        };
      }
    },
    
    // Custom tools
    tool: {
      'shark_toggle': {
        description: 'Toggle Shark Mode on/off',
        parameters: z.object({
          enable: z.boolean().describe('Enable or disable Shark Mode')
        }),
        async execute(params, ctx) {
          const sessionID = ctx.sessionID;
          await coordinator.toggleSharkMode(sessionID, params.enable);
          return {
            title: 'Shark Mode Toggled',
            output: `Shark Mode ${params.enable ? 'enabled' : 'disabled'}`,
            metadata: { enabled: params.enable }
          };
        }
      },
      
      'shark_mode_select': {
        description: 'Select Shark Agent mode (Micro/Macro)',
        parameters: z.object({
          mode: z.enum(['micro', 'macro']).describe('Shark Agent mode')
        }),
        async execute(params, ctx) {
          const sessionID = ctx.sessionID;
          await coordinator.setMode(sessionID, params.mode);
          return {
            title: 'Shark Mode Selected',
            output: `Switched to ${params.mode} engineer mode`,
            metadata: { mode: params.mode }
          };
        }
      }
    },
    
    // Session compaction
    'experimental.session.compacting': async (input, output) => {
      const sessionID = input.sessionID;
      
      if (await coordinator.isSharkModeActive(sessionID)) {
        // Add shark-specific context to compaction
        output.context.push(
          '## Shark Agent Context',
          `Current mode: ${await coordinator.getMode(sessionID)}`,
          `Current brain: ${await coordinator.getCurrentBrain(sessionID)}`,
          `Safety stack: ${await safety.getSafetyStatus(sessionID)}`
        );
      }
    }
  };
}
```

## Component Specifications

### 1. SharkModeWizard Class
```typescript
interface SharkModeWizardConfig {
  autoLaunch: boolean;
  timeoutMs: number;
  requireConfirmation: boolean;
}

class SharkModeWizard {
  private client: OpencodeClient;
  private config: SharkModeWizardConfig;
  
  constructor(client: OpencodeClient, config: Partial<SharkModeWizardConfig> = {}) {
    this.client = client;
    this.config = {
      autoLaunch: config.autoLaunch ?? true,
      timeoutMs: config.timeoutMs ?? 30000,
      requireConfirmation: config.requireConfirmation ?? true
    };
  }
  
  async shouldLaunch(sessionID: string): Promise<boolean> {
    if (!this.config.autoLaunch) return false;
    
    // Check if wizard already completed for this session
    const state = await this.getSessionState(sessionID);
    if (state.wizardCompleted) return false;
    
    // Check if this is the first user message
    const messages = await this.client.session.messages.list(sessionID);
    const userMessages = messages.filter(m => m.role === 'user');
    return userMessages.length === 1;
  }
  
  async launch(sessionID: string): Promise<'micro' | 'macro'> {
    try {
      // Step 1: Introduction
      await this.showIntroduction(sessionID);
      
      // Step 2: Mode selection
      const mode = await this.selectMode(sessionID);
      
      // Step 3: Configuration based on mode
      await this.configureMode(sessionID, mode);
      
      // Step 4: Confirmation
      if (this.config.requireConfirmation) {
        await this.confirmConfiguration(sessionID, mode);
      }
      
      // Step 5: Save state
      await this.saveSessionState(sessionID, { wizardCompleted: true, mode });
      
      return mode;
    } catch (error) {
      if (error instanceof QuestionRejectedError) {
        // User cancelled wizard
        await this.saveSessionState(sessionID, { wizardCompleted: false });
        throw error;
      }
      throw error;
    }
  }
  
  private async selectMode(sessionID: string): Promise<'micro' | 'macro'> {
    const answers = await Question.ask({
      sessionID,
      questions: [{
        question: `# 🦈 SHARK AGENT MODE SELECTOR

## Choose your engineering assistant:

### **Micro Engineer** (Recommended for most tasks)
- **Cost**: FREE (zero API costs)
- **Thinking**: DeepSeek Chat (API)
- **Execution**: Local vLLM Qwen 2.5 Coder 7B AWQ
- **Best for**: Single-file edits, syntax fixes, unit tests
- **Limitations**: Smaller context (32K), local model only

### **Macro Engineer** (Complex systems)
- **Cost**: ~$0.02-0.08 per task
- **Primary**: GLM 5 (128K context)
- **Advisory**: DeepSeek R1 (reasoning)
- **Best for**: Multi-file architecture, DevOps, migrations
- **Requirements**: GLM API key

Which mode would you like to use?`,
        header: "Shark Mode",
        custom: false,
        options: [
          { 
            label: "Micro Engineer (Free/Local)", 
            description: "DeepSeek thinks + local Qwen executes" 
          },
          { 
            label: "Macro Engineer (Paid/Cloud)", 
            description: "GLM 5 primary + DeepSeek R1 advisory" 
          }
        ]
      }]
    });
    
    const selection = answers[0]?.[0];
    
    if (selection === "Micro Engineer (Free/Local)") return 'micro';
    if (selection === "Macro Engineer (Paid/Cloud)") return 'macro';
    
    throw new Error('Invalid mode selection');
  }
}
```

### 2. SharkCoordinator Class
```typescript
interface SharkCoordinatorConfig {
  defaultMode: 'micro' | 'macro';
  autoSwitchBrains: boolean;
  maxIterations: number;
  enableSafety: boolean;
}

class SharkCoordinator {
  private sessions: Map<string, SessionState> = new Map();
  private microCoordinator: MicroCoordinatorAdapter;
  private macroCoordinator: MacroCoordinatorAdapter;
  private safety: SafetyStack;
  
  static async create(
    config: SharkCoordinatorConfig,
    client: OpencodeClient
  ): Promise<SharkCoordinator> {
    const instance = new SharkCoordinator();
    
    // Initialize coordinators
    instance.microCoordinator = await MicroCoordinatorAdapter.create(config, client);
    instance.macroCoordinator = await MacroCoordinatorAdapter.create(config, client);
    instance.safety = new SafetyStack(config);
    
    return instance;
  }
  
  async initializeSession(sessionID: string, mode: 'micro' | 'macro'): Promise<void> {
    const state: SessionState = {
      mode,
      sharkModeActive: true,
      currentBrain: 'planning',
      workflowStep: 'PLAN',
      iteration: 0,
      createdAt: Date.now()
    };
    
    this.sessions.set(sessionID, state);
    
    // Initialize appropriate coordinator
    if (mode === 'micro') {
      await this.microCoordinator.initialize(sessionID);
    } else {
      await this.macroCoordinator.initialize(sessionID);
    }
    
    // Update UI to show shark mode
    await this.updateUIIndicator(sessionID, 'shark', true);
  }
  
  async executeTask(sessionID: string, task: string): Promise<CoordinationResult> {
    const state = this.getSessionState(sessionID);
    if (!state.sharkModeActive) {
      throw new Error('Shark Mode not active for this session');
    }
    
    state.iteration++;
    
    if (state.iteration > this.config.maxIterations) {
      throw new Error(`Maximum iterations (${this.config.maxIterations}) exceeded`);
    }
    
    // Get appropriate coordinator based on mode
    const coordinator = state.mode === 'micro' 
      ? this.microCoordinator 
      : this.macroCoordinator;
    
    // Execute with dual-brain coordination
    const result = await coordinator.execute(sessionID, task, {
      safety: this.safety,
      workflowEnforcer: this.workflowEnforcer
    });
    
    // Update brain state
    state.currentBrain = result.finalBrain;
    state.workflowStep = result.finalStep;
    
    // Update UI with brain switch
    await this.updateBrainIndicator(sessionID, result.finalBrain);
    
    return result;
  }
  
  async switchBrain(
    sessionID: string, 
    from: BrainType, 
    to: BrainType
  ): Promise<void> {
    const state = this.getSessionState(sessionID);
    
    // Validate brain switch
    if (!this.canSwitchBrain(from, to, state.workflowStep)) {
      throw new Error(`Cannot switch from ${from} to ${to} in ${state.workflowStep} step`);
    }
    
    // Perform brain switch
    state.currentBrain = to;
    
    // Update model in Opencode UI
    const modelConfig = this.getModelConfig(state.mode, to);
    await this.updateChatModel(sessionID, modelConfig);
    
    // Log brain switch
    await this.logBrainSwitch(sessionID, from, to);
  }
  
  private getModelConfig(mode: 'micro' | 'macro', brain: BrainType): ModelConfig {
    if (mode === 'micro') {
      return {
        planning: {
          providerID: '0-deepseek',
          modelID: 'deepseek-chat',
          name: 'DeepSeek Chat (Planning)'
        },
        execution: {
          providerID: '0-local-vllm',
          modelID: 'qwen-2.5-coder',
          name: 'Qwen 2.5 Coder (Execution)'
        }
      }[brain];
    } else {
      return {
        planning: {
          providerID: '0-deepseek',
          modelID: 'deepseek-reasoner',
          name: 'DeepSeek R1 (Planning)'
        },
        execution: {
          providerID: '0-glm-coding',
          modelID: 'glm-5',
          name: 'GLM 5 (Execution)'
        }
      }[brain];
    }
  }
}
```

### 3. SafetyStack Class
```typescript
class SafetyStack {
  private guardian: GuardianAdapter;
  private firewallMesh: FirewallMeshAdapter;
  private workflowEnforcer: WorkflowEnforcer;
  private stagnationDetector: StagnationDetectorAdapter;
  
  constructor(config: SafetyConfig, workspacePath: string) {
    this.guardian = new GuardianAdapter(workspacePath, config.guardian);
    this.firewallMesh = new FirewallMeshAdapter(config.firewall);
    this.workflowEnforcer = new WorkflowEnforcer(config.workflow);
    this.stagnationDetector = new StagnationDetectorAdapter(config.stagnation);
  }
  
  async checkToolCall(
    tool: string,
    args: any,
    sessionID: string
  ): Promise<SafetyResult> {
    const checks: Promise<CheckResult>[] = [];
    
    // 1. Guardian filesystem protection
    checks.push(this.guardian.checkToolCall(tool, args));
    
    // 2. Firewall mesh parallel screening
    checks.push(this.firewallMesh.checkAllFirewalls({ tool, args, sessionID }));
    
    // 3. Workflow enforcement
    checks.push(this.workflowEnforcer.canExecuteTool(tool, sessionID));
    
    // Run all checks in parallel (<50ms target)
    const results = await Promise.all(checks);
    
    // Aggregate results
    const aggregated = this.aggregateResults(results);
    
    // Record for stagnation detection
    if (!aggregated.allowed) {
      await this.stagnationDetector.recordFailure(sessionID, {
        tool,
        reason: aggregated.reason
      });
    }
    
    return aggregated;
  }
  
  async applyChatSafety(
    input: ChatMessageInput,
    output: ChatMessageOutput
  ): Promise<void> {
    // Anti-hallucination checks for planning operations
    if (input.message.parts.some(p => 
      p.type === 'text' && 
      p.text.toLowerCase().includes('plan') ||
      p.text.toLowerCase().includes('design')
    )) {
      const theatricalPatterns = this.detectTheatricalPatterns(output.message);
      if (theatricalPatterns.length > 0) {
        output.message = this.sanitizeTheatricalContent(output.message);
      }
    }
  }
}
```

### 4. UI Integration Components

#### Model Indicator
```typescript
class ModelIndicator {
  async update(sessionID: string, brain: BrainType, model: ModelConfig): Promise<void> {
    // Inject CSS for brain indicator
    await this.injectCSS(`
      .shark-brain-indicator {
        position: absolute;
        top: 5px;
        right: 10px;
        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 500;
        color: #00ff88;
        border: 1px solid #333;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .shark-brain-indicator::before {
        content: '🦈';
        font-size: 10px;
      }
      
      .shark-brain-indicator.planning {
        color: #4dabf7;
        border-color: #4dabf7;
      }
      
      .shark-brain-indicator.execution {
        color: #00ff88;
        border-color: #00ff88;
      }
    `);
    
    // Create or update indicator element
    let indicator = document.querySelector(`#shark-indicator-${sessionID}`);
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = `shark-indicator-${sessionID}`;
      indicator.className = `shark-brain-indicator ${brain}`;
      document.body.appendChild(indicator);
    }
    
    indicator.textContent = `${model.name} • ${brain}`;
    indicator.className = `shark-brain-indicator ${brain}`;
  }
}
```

#### Toggle Interface
```typescript
class SharkToggle {
  async integrate(): Promise<void> {
    // Find Opencode's agent toggle container
    const toggleContainer = document.querySelector('.agent-toggle-container');
    
    if (!toggleContainer) {
      console.warn('Could not find agent toggle container');
      return;
    }
    
    // Create shark toggle
    const sharkToggle = document.createElement('div');
    sharkToggle.className = 'agent-toggle shark-toggle';
    sharkToggle.innerHTML = `
      <input type="checkbox" id="shark-mode-toggle" class="toggle-checkbox">
      <label for="shark-mode-toggle" class="toggle-label">
        <span class="toggle-icon">🦈</span>
        <span class="toggle-text">Shark Mode</span>
      </label>
    `;
    
    toggleContainer.appendChild(sharkToggle);
    
    // Add event listener
    const checkbox = sharkToggle.querySelector('.toggle-checkbox') as HTMLInputElement;
    checkbox.addEventListener('change', async (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      await this.onToggleChange(enabled);
    });
    
    // Sync with plugin state
    await this.syncWithPluginState(checkbox);
  }
  
  private async onToggleChange(enabled: boolean): Promise<void> {
    // Get current session ID
    const sessionID = await this.getCurrentSessionID();
    
    // Call shark_toggle tool
    await this.client.tool.execute('shark_toggle', {
      enable: enabled
    }, { sessionID });
    
    // Update UI state
    this.updateUIState(enabled);
  }
}
```

## Configuration Schema

### Plugin Configuration
```typescript
const SharkPluginConfig = z.object({
  shark: z.object({
    // General settings
    default_mode: z.enum(['micro', 'macro']).default('micro'),
    auto_launch_wizard: z.boolean().default(true),
    wizard_timeout_ms: z.number().min(5000).max(60000).default(30000),
    
    // Safety configuration
    safety: z.object({
      guardian_enabled: z.boolean().default(true),
      firewall_mesh_enabled: z.boolean().default(true),
      workflow_enforcement: z.enum(['strict', 'balanced', 'permissive']).default('strict'),
      stagnation_detection: z.boolean().default(true),
      max_consecutive_failures: z.number().min(1).max(10).default(3)
    }).default({}),
    
    // Micro engineer configuration
    micro: z.object({
      thinking_model: ModelId.default('0-deepseek/deepseek-chat'),
      execution_model: ModelId.default('0-local-vllm/qwen-2.5-coder'),
      fallback_model: ModelId.optional(),
      temperature: z.number().min(0).max(2).default(0.7),
      max_tokens: z.number().min(100).max(32000).default(8000)
    }).default({}),
    
    // Macro engineer configuration
    macro: z.object({
      primary_model: ModelId.default('0-glm-coding/glm-5'),
      advisory_model: ModelId.default('0-deepseek/deepseek-reasoner'),
      temperature: z.number().min(0).max(2).default(0.7),
      max_tokens: z.number().min(100).max(128000).default(16000),
      enable_cost_tracking: z.boolean().default(true),
      cost_warning_threshold: z.number().min(0).default(0.10) // $0.10
    }).default({}),
    
    // UI configuration
    ui: z.object({
      show_brain_indicator: z.boolean().default(true),
      brain_indicator_position: z.enum(['top-right', 'top-left', 'bottom-right']).default('top-right'),
      show_cost_estimate: z.boolean().default(true),
      animate_brain_switches: z.boolean().default(true)
    }).default({}),
    
    // Advanced settings
    advanced: z.object({
      enable_debug_logging: z.boolean().default(false),
      log_directory: z.string().default('.shark/logs'),
      max_session_history: z.number().min(10).max(1000).default(100),
      cache_ttl_ms: z.number().min(0).max(3600000).default(300000) // 5 minutes
    }).default({})
  }).optional()
});
```

## Data Models

### Session State
```typescript
interface SessionState {
  // Core state
  sessionID: string;
  mode: 'micro' | 'macro';
  sharkModeActive: boolean;
  wizardCompleted: boolean;
  
  // Brain coordination
  currentBrain: BrainType;
  previousBrain: BrainType | null;
  brainSwitchCount: number;
  
  // Workflow
  workflowStep: WorkflowStep;
  workflowEvidence: Record<string, any>;
  
  // Execution tracking
  iteration: number;
  totalTokens: number;
  estimatedCost: number; // For macro mode
  
  // Safety
  safetyStats: SafetyStats;
  consecutiveFailures: number;
  
  // Timestamps
  createdAt: number;
  lastBrainSwitch: number | null;
  lastToolExecution: number | null;
  
  // Configuration
  config: SessionConfig;
}

interface SafetyStats {
  guardianBlocks: number;
  firewallWarnings: number;
  workflowEnforcements: number;
  stagnationDetections: number;
  theatricalDetections: number;
}

interface SessionConfig {
  // Model configurations
  planningModel: ModelConfig;
  executionModel: ModelConfig;
  
  // Safety settings
  guardianLevel: 'STRICT' | 'BALANCED' | 'PERMISSIVE' | 'SANDBOX';
  firewallEnabled: boolean;
  workflowStrictness: number; // 0-1
  
  // Performance
  maxIterations: number;
  timeoutMs: number;
  
  // Cost tracking (macro only)
  costLimit?: number;
  costWarningThreshold?: number;
}
```

### Coordination Result
```typescript
interface CoordinationResult {
  // Execution results
  finalOutput: string;
  success: boolean;
  
  // Brain coordination
  brainSwitches: BrainSwitch[];
  finalBrain: BrainType;
  planningBrainUsed: boolean;
  executionBrainUsed: boolean;
  
  // Workflow
  workflowSteps: WorkflowStep[];
  finalStep: WorkflowStep;
  evidenceProvided: boolean;
  
  // Safety
  safetyChecks: SafetyCheck[];
  blocks: number;
  warnings: number;
  
  // Performance
  executionTimeMs: number;
  tokenUsage: TokenUsage;
  estimatedCost?: number;
  
  // Iteration tracking
  iteration: number;
  refinements: number;
  
  // Metadata
  sessionID: string;
  mode: 'micro' | 'macro';
  timestamp: number;
}

interface BrainSwitch {
  from: BrainType;
  to: BrainType;
  timestamp: number;
  reason: string;
  workflowStep: WorkflowStep;
}

interface SafetyCheck {
  type: 'guardian' | 'firewall' | 'workflow' | 'stagnation';
  passed: boolean;
  reason?: string;
  timestamp: number;
}
```

## Hook Implementation Details

### Chat Message Hook
```typescript
async function chatMessageHook(
  input: { sessionID: string; agent?: string; messageID?: string; variant?: string },
  output: { message: UserMessage; parts: Part[] }
): Promise<void> {
  const sessionID = input.sessionID;
  
  // Get session state
  const state = await getSessionState(sessionID);
  if (!state?.sharkModeActive) return;
  
  // Apply shark-specific processing
  if (state.mode === 'micro') {
    await processMicroEngineerMessage(output, state);
  } else {
    await processMacroEngineerMessage(output, state);
  }
  
  // Add brain indicator to message if enabled
  if (state.config.ui.showBrainIndicator) {
    await addBrainIndicator(output, state.currentBrain);
  }
  
  // Track token usage for cost estimation
  if (state.mode === 'macro') {
    await trackTokenUsage(sessionID, output);
  }
}
```

### Tool Execution Hook
```typescript
async function toolExecuteBeforeHook(
  input: { tool: string; sessionID: string; callID: string },
  output: { args: any }
): Promise<void> {
  const { tool, sessionID } = input;
  
  // Get session state
  const state = await getSessionState(sessionID);
  if (!state?.sharkModeActive) return;
  
  // Apply safety checks
  const safety = getSafetyStack();
  const result = await safety.checkToolCall(tool, output.args, sessionID);
  
  if (!result.allowed) {
    throw new SharkSafetyError(`Tool execution blocked: ${result.reason}`, {
      tool,
      sessionID,
      reason: result.reason,
      safetyLevel: state.config.guardianLevel
    });
  }
  
  // Apply workflow enforcement
  const workflow = getWorkflowEnforcer();
  await workflow.enforceStep(
    sessionID,
    'TOOL_EXECUTION',
    { tool, args: output.args }
  );
  
  // Update session state
  state.lastToolExecution = Date.now();
  
  // Log tool execution
  await logToolExecution(sessionID, tool, output.args, 'allowed');
}
```

## Error Handling

### Error Hierarchy
```typescript
class SharkPluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SharkPluginError';
  }
}

class SharkSafetyError extends SharkPluginError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 'SAFETY_VIOLATION', context);
    this.name = 'SharkSafetyError';
  }
}

class SharkWorkflowError extends SharkPluginError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 'WORKFLOW_VIOLATION', context);
    this.name = 'SharkWorkflowError';
  }
}

class SharkBrainSwitchError extends SharkPluginError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 'BRAIN_SWITCH_FAILED', context);
    this.name = 'SharkBrainSwitchError';
  }
}

class SharkConfigurationError extends SharkPluginError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 'CONFIGURATION_ERROR', context);
    this.name = 'SharkConfigurationError';
  }
}
```

### Error Recovery
```typescript
async function withErrorRecovery<T>(
  sessionID: string,
  operation: () => Promise<T>,
  recoveryStrategy: RecoveryStrategy = 'fallback'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Log error
    await logError(sessionID, error);
    
    // Get session state
    const state = await getSessionState(sessionID);
    
    // Apply recovery based on strategy
    switch (recoveryStrategy) {
      case 'fallback':
        return await applyFallbackRecovery(sessionID, error, state);
        
      case 'retry':
        return await applyRetryRecovery(sessionID, error, state);
        
      case 'escalate':
        return await applyEscalationRecovery(sessionID, error, state);
        
      case 'abort':
        throw new SharkPluginError(
          'Operation aborted after error',
          'OPERATION_ABORTED',
          { originalError: error.message }
        );
    }
  }
}
```

## Performance Optimization

### Caching Strategy
```typescript
class SharkCache {
  private cache = new Map<string, { value: any; expires: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);
    
    if (entry && entry.expires > now) {
      return entry.value as T;
    }
    
    const value = await fetcher();
    this.cache.set(key, {
      value,
      expires: now + (ttl || this.defaultTTL)
    });
    
    return value;
  }
  
  // Specialized caches
  readonly modelConfigCache = new SharkCache();
  readonly safetyCheckCache = new SharkCache();
  readonly sessionStateCache = new SharkCache();
}
```

### Lazy Loading
```typescript
class LazyComponentLoader {
  private loaded = new Map<string, boolean>();
  
  async loadComponent<T>(
    name: string,
    loader: () => Promise<T>
  ): Promise<T> {
    if (this.loaded.get(name)) {
      return this.getLoadedComponent<T>(name);
    }
    
    // Load component
    const component = await loader();
    this.setLoadedComponent(name, component);
    this.loaded.set(name, true);
    
    return component;
  }
  
  // Usage example
  async getSafetyStack(): Promise<SafetyStack> {
    return this.loadComponent('safety', () => 
      SafetyStack.create(this.config, this.workspacePath)
    );
  }
}
```

## Testing Specifications

### Unit Test Structure
```typescript
describe('SharkModeWizard', () => {
  let wizard: SharkModeWizard;
  let mockClient: MockOpencodeClient;
  
  beforeEach(() => {
    mockClient = new MockOpencodeClient();
    wizard = new SharkModeWizard(mockClient, {
      autoLaunch: true,
      timeoutMs: 30000
    });
  });
  
  test('should launch wizard for new sessions', async () => {
    // Arrange
    mockClient.setSessionState('new-session', { messages: [] });
    
    // Act
    const shouldLaunch = await wizard.shouldLaunch('new-session');
    
    // Assert
    expect(shouldLaunch).toBe(true);
  });
  
  test('should not launch wizard for sessions with completed wizard', async () => {
    // Arrange
    mockClient.setSessionState('existing-session', {
      messages: [],
      sharkState: { wizardCompleted: true }
    });
    
    // Act
    const shouldLaunch = await wizard.shouldLaunch('existing-session');
    
    // Assert
    expect(shouldLaunch).toBe(false);
  });
  
  test('should present mode selection options', async () => {
    // Arrange
    const sessionID = 'test-session';
    
    // Act
    const mode = await wizard.launch(sessionID);
    
    // Assert
    expect(mode).toBeDefined();
    expect(['micro', 'macro']).toContain(mode);
    expect(mockClient.askedQuestions).toHaveLength(1);
    expect(mockClient.askedQuestions[0].options).toHaveLength(2);
  });
});
```

### Integration Test Structure
```typescript
describe('Shark Plugin Integration', () => {
  let plugin: Hooks;
  let mockInput: PluginInput;
  
  beforeAll(async () => {
    mockInput = createMockPluginInput();
    plugin = await sharkPlugin(mockInput);
  });
  
  test('should register all required hooks', () => {
    expect(plugin['chat.message']).toBeDefined();
    expect(plugin['tool.execute.before']).toBeDefined();
    expect(plugin['chat.params']).toBeDefined();
    expect(plugin.tool).toBeDefined();
    expect(plugin.tool!['shark_toggle']).toBeDefined();
    expect(plugin.tool!['shark_mode_select']).toBeDefined();
  });
  
  test('should handle chat messages with wizard', async () => {
    // Arrange
    const input = {
      sessionID: 'new-session',
      agent: 'build',
      messageID: 'msg-1',
      variant: 'default'
    };
    
    const output = {
      message: createUserMessage('Hello, world!'),
      parts: []
    };
    
    // Act
    await plugin['chat.message']!(input, output);
    
    // Assert
    // Should have triggered wizard logic
    expect(mockInput.client.question.ask).toHaveBeenCalled();
  });
  
  test('should enforce safety on tool execution', async () => {
    // Arrange
    const input = {
      tool: 'write',
      sessionID: 'shark-session',
      callID: 'call-1'
    };
    
    const output = {
      args: { file_path: '/etc/passwd', content: 'test' }
    };
    
    // Act & Assert
    await expect(
      plugin['tool.execute.before']!(input, output)
    ).rejects.toThrow('Guardian blocked');
  });
});
```

## Deployment Configuration

### Build Configuration
```json
{
  "name": "shark-agent-plugin",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc && bun build src/index.ts --outdir dist --target bun --format esm",
    "test": "bun test",
    "test:unit": "bun test/unit",
    "test:integration": "bun test/integration",
    "test:performance": "bun test/performance",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm test"
  },
  "dependencies": {
    "@opencode-ai/plugin": "^1.1.19",
    "@opencode-ai/sdk": "^1.1.19",
    "zod": "^4.1.8"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/node": "^20.0.0",
    "typescript": "^5.8.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "opencode": {
    "plugin": true,
    "compatibility": ">=1.2.0",
    "requires": []
  }
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

This technical specification provides the complete implementation details for the Shark Agent Plugin, covering all components, interfaces, configurations, and testing requirements needed for the build team to implement the plugin successfully.