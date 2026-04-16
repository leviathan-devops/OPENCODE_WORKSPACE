# 🦈 SHARK CLI - Project Architectures

**Project**: Shark Frankenstein (Dual-Brain AI Coding Assistant)  
**Architecture Version**: V2 Integration  
**Last Updated**: 2026-03-28

---

## System Overview

Shark CLI is a dual-brain AI coding assistant that uses multiple LLM providers in a coordinated architecture. It features Guardian file protection, 5-step workflow enforcement, and auto-debug capabilities.

### Core Design Philosophy

1. **Dual-Brain Architecture** - Two specialized modes for different tasks
2. **Safety First** - Guardian protection, FirewallMesh, audit trails
3. **Cost Optimization** - Free tier usage where possible (Gemma, vLLM)
4. **Autonomous Execution** - Multi-iteration with self-completion detection

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INPUT                                     │
│                    (Task description + context)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLI (V2)                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Guardian  │  │  Workflow   │  │ Auto-Debug  │  │   Stats     │    │
│  │  Protection │  │ Enforcement │  │   Engine    │  │  Display    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│      MICRO ENGINEER       │       │      MACRO ENGINEER       │
│    (Precision Coding)     │       │   (Systems Engineering)   │
│                           │       │                           │
│  ┌─────────────────────┐  │       │  ┌─────────────────────┐  │
│  │   vLLM (Primary)    │  │       │  │   GLM 5 (Primary)   │  │
│  │  Qwen 2.5 Coder     │  │       │  │   Autonomous        │  │
│  │   7B AWQ            │  │       │  │   Execution         │  │
│  └─────────────────────┘  │       │  └─────────────────────┘  │
│            │              │       │            │              │
│            ▼              │       │            ▼              │
│  ┌─────────────────────┐  │       │  ┌─────────────────────┐  │
│  │  Gemma 3 4B         │  │       │  │  DeepSeek R1        │  │
│  │   (Fallback)        │  │       │  │   (Advisory)        │  │
│  │   FREE tier         │  │       │  │   Strategic         │  │
│  └─────────────────────┘  │       │  └─────────────────────┘  │
│                           │       │                           │
│  Use Cases:               │       │  Use Cases:               │
│  • Single-file ops        │       │  • Multi-file arch        │
│  • Syntax fixes           │       │  • DevOps/CI-CD           │
│  • Unit tests             │       │  • Autonomous scaffold    │
│  • Code reviews           │       │  • System migrations      │
└───────────────────────────┘       └───────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     ToolExecutor (V2)                                    │
│                                                                          │
│   executeTool(toolCall) {                                               │
│     // 1. Check FirewallMesh                                            │
│     const result = await firewallMesh.checkToolCall(toolCall)          │
│                                                                          │
│     // 2. If blocked, return error                                      │
│     if (result.blocked) return result                                   │
│                                                                          │
│     // 3. Execute tool                                                  │
│     return await actualExecute(toolCall)                                │
│   }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FirewallMesh (V2)                                 │
│                                                                          │
│   4 Parallel Firewalls:                                                 │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│   │    Guardian     │  │  WorkflowBlocker│  │ TheatricalDetect│        │
│   │   (BLOCKING)    │  │   (BLOCKING)    │  │  (WARNING ONLY) │        │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│   ┌─────────────────┐                                                   │
│   │  SecretDetector │                                                   │
│   │  (WARNING ONLY) │                                                   │
│   └─────────────────┘                                                   │
│                                                                          │
│   Promise.all([firewall1, firewall2, firewall3, firewall4])            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    StagnationDetector (V2)                               │
│                                                                          │
│   • Tracks tool call failures by (tool_name, identifier)               │
│   • Alerts after 3 identical failures                                   │
│   • Integration with Kraken Ultra debug agents                          │
│   • Auto-escalation to fresh agent with clean context                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. CLI Layer (`src/cli(V2).ts`)

**Purpose**: Main entry point, mode selection, REPL loop

**Key Features**:
- Interactive mode wizard
- Non-interactive mode support (piped input)
- Guardian protection integration
- Workflow state management
- Auto-debug integration
- Real firewall statistics (fixed placeholder bug)

**Commands**:
```
/mode           - Switch Micro/Macro
/workflow       - Show workflow status
/guardian       - Show guardian report
/firewall-stats - Show firewall statistics
/stagnation-stats - Show stagnation detection stats
/verify         - Run verification gates
/clear          - Clear screen
/exit           - Exit Shark
```

**Flags**:
```
--yolo           - Bypass all firewalls
--firewall-stats - Show stats and exit
--help           - Show help
--version        - Show version
```

---

### 2. Brain Layer (`src/brain/`)

#### 2.1 BaseCoordinator (`coordinator-base(V2).ts`)

**Purpose**: Abstract base class with common functionality

**Key Features**:
- FirewallMesh integration
- StagnationDetector integration
- Tool call processing with Guardian protection
- getFirewallStats() method
- getStagnationStats() method

**Inheritance**:
```
BaseCoordinator (abstract)
    ├── MicroCoordinator
    └── MacroCoordinator
```

#### 2.2 MicroCoordinator (`coordinator-micro(V2).ts`)

**Purpose**: Precision coding mode

**Architecture**:
```
vLLM (Qwen 2.5 Coder 7B AWQ)  →  PRIMARY (local, free)
        │
        ▼ (if unavailable)
Gemma 3 4B  →  FALLBACK (free tier, 14k RPD)
```

**Flow**:
1. Check vLLM availability
2. If available, use Qwen 2.5 Coder for execution
3. If not, fall back to Gemma 3 4B
4. Process tool calls with FirewallMesh
5. Return result

**Configuration**:
```typescript
interface MicroCoordinatorConfig extends BaseCoordinatorConfig {
  gemmaRegion?: 'us' | 'sea'  // Default: 'sea'
}
```

#### 2.3 MacroCoordinator (`coordinator-macro(V2).ts`)

**Purpose**: Systems engineering mode

**Architecture**:
```
DeepSeek R1  →  ADVISORY (strategic consultation)
        │
        ▼
GLM 5-flash  →  PRIMARY (autonomous execution with tools)
        │
        ▼
Process Tool Calls  →  FirewallMesh  →  Execute
        │
        ▼
DeepSeek R1 Review  →  Next iteration or Complete
```

**Flow**:
1. DeepSeek R1 provides strategic consultation
2. GLM 5-flash executes with built-in tools
3. Process tool calls with Guardian protection
4. Check for completion
5. DeepSeek reviews progress for next iteration
6. Iterate until complete or max iterations (15)

**Configuration**:
```typescript
interface MacroCoordinatorConfig extends BaseCoordinatorConfig {
  maxIterations: 15  // Default
}
```

#### 2.4 Brain Clients

| Client | File | API | Model |
|--------|------|-----|-------|
| GLMClient | `glm.ts` | z.ai API | glm-5 |
| GemmaClient | `gemma.ts` | Google AI | gemma-3-4b |
| DeepSeekClient | `deepseek.ts` | DeepSeek API | deepseek-reasoner |
| VLLMClient | `vllm.ts` | OpenAI-compatible | Auto-detected |

---

### 3. Tools Layer (`src/tools/`)

#### 3.1 ToolExecutor (`executor(V2).ts`)

**Purpose**: Execute tool calls with FirewallMesh protection

**Key Integration**:
```typescript
async executeTool(toolCall: ToolCall): Promise<ToolResult> {
  // Check FirewallMesh FIRST
  const firewallResult = await this.firewallMesh.checkToolCall(toolCall)
  
  if (firewallResult.blocked) {
    return {
      success: false,
      error: firewallResult.reason,
      guardianBlocked: true,
      guardianReason: firewallResult.reason
    }
  }
  
  // Execute actual tool
  return await this.actualExecute(toolCall)
}
```

**Supported Tools**:
- `write_file` - Write to file (Guardian protected)
- `read_file` - Read file
- `run_command` - Execute shell command
- `search` - Search codebase

#### 3.2 FirewallMesh (`firewall-mesh(V2).ts`)

**Purpose**: Run multiple firewalls in parallel

**Architecture**:
```typescript
class FirewallMesh {
  private firewalls: Firewall[] = [
    new GuardianFirewall(),      // BLOCKING
    new WorkflowBlocker(),       // BLOCKING (conditional)
    new TheatricalDetector(),    // WARNING ONLY
    new SecretDetector()         // WARNING ONLY
  ]
  
  async checkToolCall(toolCall: ToolCall): Promise<FirewallResult> {
    // Run ALL firewalls in parallel
    const results = await Promise.all(
      this.firewalls.map(f => f.check(toolCall))
    )
    
    // Any BLOCKING result blocks the tool
    const blocked = results.find(r => r.blocked)
    if (blocked) return blocked
    
    // Collect warnings
    const warnings = results.filter(r => r.warning)
    return { blocked: false, warnings }
  }
}
```

**Firewall Details**:

| Firewall | Mode | Purpose |
|----------|------|---------|
| GuardianFirewall | BLOCKING | Protect system/personal files |
| WorkflowBlocker | BLOCKING | Enforce 5-step workflow |
| TheatricalDetector | WARNING | Detect fake progress patterns |
| SecretDetector | WARNING | Detect API keys in output |

#### 3.3 StagnationDetector (`stagnation-detector(V2).ts`)

**Purpose**: Detect repeated tool failures

**Algorithm**:
```typescript
class StagnationDetector {
  private failureCounts: Map<string, number>  // key: "tool:identifier"
  
  recordFailure(toolName: string, identifier: string): void {
    const key = `${toolName}:${identifier}`
    const count = (this.failureCounts.get(key) || 0) + 1
    this.failureCounts.set(key, count)
    
    if (count >= 3) {
      this.alertStagnation(toolName, identifier)
    }
  }
  
  getStats(): StagnationStats {
    // Return top failures, unique tools, etc.
  }
}
```

**Integration Point**: `BaseCoordinator.processToolCalls()`

#### 3.4 FirewallAudit (`audit(V2).ts`)

**Purpose**: Log all tool calls for audit trail

**Logged Data**:
- Timestamp
- Tool name
- Arguments
- Result (success/blocked/bypassed)
- Reason if blocked

---

### 4. Guardian Layer (`src/guardian/`)

**Purpose**: File system protection

**Protection Levels**:

| Level | Description | Behavior |
|-------|-------------|----------|
| `strict` | Maximum protection | Only explicit allowlist |
| `balanced` | Default | Workspace + dev folders allowed |
| `sandbox` | Testing mode | All writes redirected to sandbox |

**Protected Zones**:
```typescript
const SYSTEM_PATHS = [
  '/etc', '/usr', '/bin', '/sbin', '/lib',
  '/System', '/Applications', '/Windows'
]

const PERSONAL_PATTERNS = [
  '.ssh/', '.gnupg/', '.password-store/',
  '.config/gh/', '.config/git/'
]

const ALLOWED_PATTERNS = [
  '/workspace/', '/projects/', '/dev/',
  '/home/*/workspace/', '/home/*/projects/'
]
```

**Decisions**:
```typescript
enum ModificationDecision {
  ALLOW,              // Safe to proceed
  BACKUP_THEN_ALLOW,  // Create backup first
  SANDBOX_REDIRECT,   // Redirect to sandbox
  DENY                // Block operation
}
```

---

### 5. Workflow Layer (`src/workflow/`)

**Purpose**: Enforce 5-step development workflow

**Steps**:
```
1. PLAN    → Analyze requirements, create plan
2. BUILD   → Implement the plan
3. TEST    → Run tests
4. VERIFY  → Verify functionality and intent
5. SHIP    → Deploy/release
```

**State Machine**:
```typescript
enum WorkflowStep {
  PLAN = 1,
  BUILD = 2,
  TEST = 3,
  VERIFY = 4,
  SHIP = 5
}

class WorkflowMachine {
  private currentStep: WorkflowStep = WorkflowStep.PLAN
  private originalPrompt: string | null = null
  
  setOriginalPrompt(prompt: string): void
  getCurrentStep(): WorkflowStep
  advanceStep(): void
  runVerificationGate(gate: VerificationGate): Promise<GateResult>
}
```

**Verification Gates**:
- `FUNCTIONAL` - Does it work?
- `INTENT` - Does it match original request?
- `SECURITY` - Is it safe?

---

### 6. Auto-Debug Layer (`src/debug/`)

**Purpose**: Automatic error detection and fixing

**Features**:
- 15 known error patterns
- 60% auto-fix rate for common errors
- Prevention tips before execution
- Quick fix suggestions

**Error Patterns** (examples):
```typescript
const ERROR_PATTERNS = [
  { pattern: /Cannot find module/, fix: 'npm install' },
  { pattern: /ENOENT/, fix: 'Check file path' },
  { pattern: /EACCES/, fix: 'Check permissions' },
  { pattern: /SyntaxError/, fix: 'Validate syntax' },
  // ... 11 more
]
```

---

## Data Flows

### 1. Normal Execution Flow

```
User Input
    │
    ▼
CLI.parse()
    │
    ├── Check Guardian
    ├── Check Workflow
    │
    ▼
Coordinator.execute()
    │
    ├── Select Brain (Micro/Macro)
    │
    ▼
Brain.execute()
    │
    ├── Generate tool calls
    │
    ▼
ToolExecutor.executeTool()
    │
    ├── FirewallMesh.checkToolCall()
    │   ├── GuardianFirewall.check()
    │   ├── WorkflowBlocker.check()
    │   ├── TheatricalDetector.check()
    │   └── SecretDetector.check()
    │
    ├── If blocked: return error
    ├── If allowed: execute tool
    │
    ▼
StagnationDetector.recordResult()
    │
    ▼
Return result to Brain
    │
    ▼
Brain continues or completes
    │
    ▼
Return final output to CLI
    │
    ▼
Display to user
```

### 2. YOLO Mode Flow

```
User Input with --yolo flag
    │
    ▼
CLI.parse()
    │
    ├── Set SHARK_SKIP_FIREWALLS=true
    │
    ▼
Coordinator.execute()
    │
    ▼
ToolExecutor.executeTool()
    │
    ├── FirewallMesh.checkToolCall()
    │   └── Returns { blocked: false, bypassed: true }
    │
    ▼
Execute tool without checks
    │
    ▼
Return result
```

### 3. Stagnation Detection Flow

```
ToolExecutor.executeTool()
    │
    ▼
Tool execution fails
    │
    ▼
StagnationDetector.recordFailure(tool, identifier)
    │
    ├── Check failure count
    │
    ├── If count >= 3:
    │   ├── Log alert
    │   └── Trigger escalation
    │
    ▼
Return error to Brain
    │
    ▼
Brain may try alternative approach
```

---

## Configuration

### Environment Variables

```bash
# API Keys
GOOGLE_API_KEY=...          # Gemma 3 4B
GLM_API_KEY=...             # GLM 5
GLM_CODING_PLAN_KEY=...     # Alternative GLM key
DEEPSEEK_API_KEY=...        # DeepSeek R1

# vLLM (local)
VLLM_API_URL=http://localhost:8000/v1

# Shark Configuration
SHARK_MODE=micro|macro      # Default mode
SHARK_REGION=us|sea         # Gemma region
SHARK_DEBUG=true|false      # Verbose logging
SHARK_SKIP_FIREWALLS=true   # YOLO mode

# Guardian Configuration
GUARDIAN_LEVEL=balanced|strict|sandbox
GUARDIAN_SANDBOX_PATH=/tmp/shark-sandbox
```

### Config File (`shark.config.json`)

```json
{
  "defaultMode": "micro",
  "maxIterations": 15,
  "gemmaRegion": "sea",
  "guardianLevel": "balanced",
  "workflowEnforcement": true,
  "autoDebug": true
}
```

---

## Extension Points

### Adding a New Brain

1. Create client in `src/brain/new-brain.ts`:
```typescript
export class NewBrainClient {
  isConfigured(): boolean
  execute(prompt: string, options?: BrainExecutionOptions): Promise<BrainResponse>
}
```

2. Add to coordinator:
```typescript
// In coordinator-micro(V2).ts or coordinator-macro(V2).ts
this.newBrain = new NewBrainClient()
```

### Adding a New Firewall

1. Create firewall in `src/tools/firewalls/`:
```typescript
export class NewFirewall implements Firewall {
  async check(toolCall: ToolCall): Promise<FirewallResult>
}
```

2. Add to FirewallMesh:
```typescript
// In firewall-mesh(V2).ts
private firewalls: Firewall[] = [
  // ... existing firewalls
  new NewFirewall()
]
```

### Adding a New Tool

1. Add tool handler in `executor(V2).ts`:
```typescript
case 'new_tool':
  return await this.handleNewTool(args)
```

2. Update brain tool definitions if needed

---

*Architecture Document generated: 2026-03-28*
