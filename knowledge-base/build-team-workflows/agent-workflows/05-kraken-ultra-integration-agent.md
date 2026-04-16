# Kraken Ultra Integration Agent - Executable Build Process

## Mission
Integrate Kraken Ultra components (anti-hallucination validators, surgical debug protocol, Nemotron event-driven service) into Shark Frankenstein CLI and implement the Shark CLI launch experience with micro/macro wizard.

## Success Criteria
- Kraken Ultra anti-hallucination validators integrated into Shark Frankenstein
- Surgical debug protocol operational for automated debugging
- Nemotron event-driven service integrated for cross-module communication
- Shark CLI launch script (`/usr/local/bin/shark`) with micro/macro wizard
- OpenCode Zen provider configured for free model access
- Fragment injection system working for agent-specific instructions
- Full backward compatibility with existing OpenCode configurations

## Pre-flight Checks
1. **Review Kraken Ultra architecture**: Read `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/PROJECT_ARCHITECTURE.md`
2. **Review Shark CLI launch correction**: Read `/home/leviathan/OPENCODE_WORKSPACE/build-team-workflows/SHARK_CLI_LAUNCH_CORRECTION.md`
3. **Review opencode-ultra rewrite plan**: Read `/home/leviathan/OPENCODE_WORKSPACE/build-team-workflows/BUILD_TEAM_IMPLEMENTATION_PLAN.md`
4. **Check current integration state**: Examine existing integration points

## Step-by-Step Execution

### Step 1: Analyze Kraken Ultra Components
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra
# List key components
find . -name "*.md" -o -name "*.ts" -o -name "*.js" | grep -E "(anti-hallucination|surgical|nemotron|orchestrator)" | head -20

# Read architecture document
cat PROJECT_ARCHITECTURE.md | head -100
```

**Key Components to Integrate**:
1. `src/anti-hallucination/` - Validators, evidence checkers, mechanical validators
2. `src/surgical-debug/` - Surgical debug protocol
3. `src/nemotron-service/` - Event-driven communication layer
4. `src/orchestrator/` - Multi-agent orchestration

### Step 2: Integrate Anti-Hallucination Validators
Anti-hallucination validators ensure agents provide evidence and avoid theatrical code.

```bash
# Copy anti-hallucination components to Shark Frankenstein
cd /home/leviathan/OPENCODE_WORKSPACE
mkdir -p projects/shark-frankenstein/src/anti-hallucination
cp -r projects/kraken-brain/Kraken Ultra/src/anti-hallucination/* projects/shark-frankenstein/src/anti-hallucination/

# Update imports and paths
find projects/shark-frankenstein/src/anti-hallucination -name "*.ts" -exec sed -i "s@from '\.\./\.\./@from '../@g" {} \;

# Integrate with ToolExecutor
cat > /tmp/integrate-validators.patch << 'EOF'
--- a/src/tools/executor_v2.ts
+++ b/src/tools/executor_v2.ts
@@ -XXX,XXX +XXX,XXX @@
 import { StateIntegrity } from './state-integrity';
 import { AutoDebugEngine, DetectedError } from '../debug/autodebug';
+import { AntiHallucinationValidator } from '../anti-hallucination/validator';
+import { EvidenceChecker } from '../anti-hallucination/evidence-checker';

 export class ToolExecutor {
   private guardian: Guardian;
   private workflowBlocker: WorkflowBlocker | null;
   private audit: FirewallAudit;
   private firewallMesh: FirewallMesh;
   private stagnationDetector: StagnationDetector;
   private stateIntegrity: StateIntegrity;
   private autoDebug: AutoDebugEngine;
+  private antiHallucinationValidator: AntiHallucinationValidator;
+  private evidenceChecker: EvidenceChecker;

   constructor(config: ToolExecutorConfig) {
     // Existing initialization
+    this.antiHallucinationValidator = new AntiHallucinationValidator();
+    this.evidenceChecker = new EvidenceChecker();
   }

   private async executeToolInternal(toolCall: ToolCall): Promise<ToolResult> {
+    // Anti-hallucination check for plan/design operations
+    if (toolCall.name.includes('plan') || toolCall.name.includes('design')) {
+      const hallucinationCheck = this.antiHallucinationValidator.validate(
+        toolCall.arguments,
+        { operation: toolCall.name }
+      );
+      
+      if (!hallucinationCheck.valid) {
+        return {
+          toolCallId: toolCall.toolCallId,
+          name: toolCall.name,
+          success: false,
+          result: `❌ Anti-hallucination check failed: ${hallucinationCheck.reason}`,
+          guardianBlocked: false,
+          guardianReason: undefined
+        };
+      }
+    }
+    
     // Existing logic...
   }
EOF

# Apply patch
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
patch -p1 < /tmp/integrate-validators.patch 2>/dev/null || echo "Manual integration required"
```

### Step 3: Integrate Surgical Debug Protocol
Surgical debug protocol provides targeted debugging for specific code issues.

```bash
# Copy surgical debug components
mkdir -p projects/shark-frankenstein/src/surgical-debug
cp -r projects/kraken-brain/Kraken Ultra/src/surgical-debug/* projects/shark-frankenstein/src/surgical-debug/

# Integrate with AutoDebugEngine
cat > /tmp/integrate-surgical-debug.patch << 'EOF'
--- a/src/debug/autodebug.ts
+++ b/src/debug/autodebug.ts
@@ -XXX,XXX +XXX,XXX @@
+import { SurgicalDebugProtocol } from '../surgical-debug/protocol';
+
 export class AutoDebugEngine {
   private errorPatterns: Map<string, ErrorPattern>;
   private fixAttempts: Map<string, number>;
   private context: DebugContext;
+  private surgicalDebug: SurgicalDebugProtocol;

   constructor() {
     this.errorPatterns = new Map();
     this.fixAttempts = new Map();
     this.context = { errors: [], fixes: [] };
+    this.surgicalDebug = new SurgicalDebugProtocol();
   }

   async diagnoseAndFix(error: DetectedError): Promise<DebugResult> {
+    // First attempt surgical debug for targeted fixes
+    const surgicalResult = await this.surgicalDebug.attemptSurgicalFix(error);
+    if (surgicalResult.success) {
+      return {
+        success: true,
+        fixApplied: surgicalResult.fix,
+        explanation: surgicalResult.explanation,
+        confidence: surgicalResult.confidence
+      };
+    }
+    
     // Existing pattern-based diagnosis
   }
EOF

# Apply patch
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
patch -p1 < /tmp/integrate-surgical-debug.patch 2>/dev/null || echo "Manual integration required"
```

### Step 4: Integrate Nemotron Event-Driven Service
Nemotron service provides cross-module communication and event-driven architecture.

```bash
# Copy Nemotron service components
mkdir -p projects/shark-frankenstein/src/nemotron-service
cp -r projects/kraken-brain/Kraken Ultra/src/nemotron-service/* projects/shark-frankenstein/src/nemotron-service/

# Create event bus integration
cat > /tmp/integrate-nemotron.patch << 'EOF'
--- a/src/brain/coordinator_v2.ts
+++ b/src/brain/coordinator_v2.ts
@@ -XXX,XXX +XXX,XXX @@
+import { NemotronEventBus } from '../nemotron-service/event-bus';
+
 export class DualBrainCoordinator {
   private microEngineer: MicroEngineer;
   private macroEngineer: MacroEngineer;
   private config: CoordinatorConfig;
   private currentTask: Task | null;
+  private eventBus: NemotronEventBus;

   constructor(config: CoordinatorConfig) {
     this.config = config;
     this.currentTask = null;
+    this.eventBus = new NemotronEventBus();
   }

   async processTask(task: Task): Promise<TaskResult> {
+    // Emit task started event
+    this.eventBus.emit('task:started', {
+      taskId: task.id,
+      description: task.description,
+      timestamp: new Date().toISOString()
+    });
+
     // Existing task processing logic
     const result = await this.routeToEngineer(task);
+
+    // Emit task completed event
+    this.eventBus.emit('task:completed', {
+      taskId: task.id,
+      success: result.success,
+      durationMs: result.durationMs,
+      timestamp: new Date().toISOString()
+    });
+
     return result;
   }
EOF

# Apply patch
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
patch -p1 < /tmp/integrate-nemotron.patch 2>/dev/null || echo "Manual integration required"
```

### Step 5: Implement Shark CLI Launch Script
Based on SHARK_CLI_LAUNCH_CORRECTION.md, create the launch script.

```bash
# Create the shark command
cat > /usr/local/bin/shark << 'EOF'
#!/bin/bash
# 🦈 SHARK FRANKENSTEIN CLI
# Launches OpenCode with Shark/Kraken enhancements

set -e

# Configuration directories
SHARK_CONFIG_DIR="$HOME/.config/opencode"
SHARK_WORKSPACE="$HOME/OPENCODE_WORKSPACE"
SHARK_FRAGMENTS_DIR="$SHARK_WORKSPACE/.shark/fragments"

# Mode selection wizard
select_mode() {
    echo "🦈 SHARK FRANKENSTEIN CLI"
    echo "========================="
    echo ""
    echo "Select mode:"
    echo "1) Micro Task  - Single file, quick fix, debugging"
    echo "2) Macro Task  - Architecture, refactoring, system design"
    echo "3) Direct OpenCode - Bypass wizard, use default OpenCode"
    echo ""
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1) echo "micro" ;;
        2) echo "macro" ;;
        3) echo "direct" ;;
        *) echo "micro" ;; # Default to micro
    esac
}

# Prepare environment for selected mode
prepare_environment() {
    local mode="$1"
    
    # Export mode for OpenCode plugins
    export SHARK_MODE="$mode"
    
    # Set agent mapping based on mode
    if [ "$mode" = "micro" ]; then
        export SHARK_PRIMARY_AGENT="shark-agent"
        export SHARK_ORCHESTRATOR="hephaestus"
        echo "🤖 Mode: Micro (Shark Agent)"
    elif [ "$mode" = "macro" ]; then
        export SHARK_PRIMARY_AGENT="kraken-brain"
        export SHARK_ORCHESTRATOR="sisyphus"
        echo "🐙 Mode: Macro (Kraken Brain)"
    else
        echo "⚡ Mode: Direct OpenCode"
    fi
    
    # Load Shark-specific configuration
    load_shark_config "$mode"
}

# Load Shark configuration
load_shark_config() {
    local mode="$1"
    
    # Create temporary config directory
    TEMP_CONFIG_DIR=$(mktemp -d)
    export OPENCODE_CONFIG_DIR="$TEMP_CONFIG_DIR"
    
    # Copy base OpenCode config
    cp "$SHARK_CONFIG_DIR/opencode.json" "$TEMP_CONFIG_DIR/opencode.json"
    
    # Generate mode-specific opencode-ultra.json
    generate_opencode_ultra_config "$mode" > "$TEMP_CONFIG_DIR/opencode-ultra.json"
    
    # Create fragments directory
    mkdir -p "$TEMP_CONFIG_DIR/fragments"
    cp -r "$SHARK_FRAGMENTS_DIR"/* "$TEMP_CONFIG_DIR/fragments/" 2>/dev/null || true
    
    # Create .opencode directory structure
    mkdir -p "$TEMP_CONFIG_DIR/.opencode/agents"
    mkdir -p "$TEMP_CONFIG_DIR/.opencode/commands"
    
    # Generate Shark agent definitions
    generate_shark_agents > "$TEMP_CONFIG_DIR/.opencode/agents/shark.md"
}

# Generate opencode-ultra.json with Shark mappings
generate_opencode_ultra_config() {
    local mode="$1"
    
    cat << 'EOF'
{
  "agents": {
    "sisyphus": {
      "model": "0-glm-coding/glm-5",
      "description": "Kraken Brain - Primary orchestrator",
      "aliases": ["kraken-brain", "orchestrator", "brain"]
    },
    "oracle": {
      "model": "0-deepseek/deepseek-reasoner",
      "description": "Architect - Design architect & debugger",
      "aliases": ["architect", "design", "system"]
    },
    "hephaestus": {
      "model": "0-glm-coding/glm-4.7",
      "description": "Shark Agent - Deep autonomous worker",
      "aliases": ["shark-agent", "engineer", "coder", "build"]
    },
    "momus": {
      "model": "0-deepseek/deepseek-chat",
      "description": "Code Review - Code reviewer",
      "aliases": ["review", "qa", "test", "quality"]
    },
    "metis": {
      "model": "0-deepseek/deepseek-reasoner",
      "description": "Planning Brain - Strategic planner",
      "aliases": ["planning", "strategy", "metis"]
    },
    "explore": {
      "model": "0-glm-coding/glm-4.5-flash",
      "description": "Scout - Fast codebase explorer",
      "aliases": ["scout", "explore", "research"]
    },
    "librarian": {
      "model": "0-deepseek/deepseek-chat",
      "description": "Scribe - Documentation researcher",
      "aliases": ["scribe", "doc", "documentation"]
    },
    "multimodal-looker": {
      "model": "0-mimo/mimo-v2-omni",
      "description": "Visual Cortex - Visual analyzer",
      "aliases": ["visual", "image", "multimodal"]
    },
    "atlas": {
      "model": "0-nemotron/nemotron-3-super",
      "description": "Middle Manager - Task orchestrator",
      "aliases": ["manager", "coordinate", "atlas"]
    }
  },
  "categories": {
    "micro": { "model": "0-glm-coding/glm-4.7" },
    "macro": { "model": "0-glm-coding/glm-5" },
    "quick": { "model": "0-glm-coding/glm-4.5-flash" },
    "thinking": { "model": "0-deepseek/deepseek-reasoner" }
  },
  "fragments": {
    "hephaestus": ["fragments/shark-agent.md"],
    "sisyphus": ["fragments/kraken-brain.md"],
    "oracle": ["fragments/architect.md"],
    "momus": ["fragments/code-review.md"]
  },
  "disabled_agents": [],
  "disabled_hooks": [],
  "disabled_tools": [],
  "demote_builtin": true,
  "background_task": {
    "defaultConcurrency": 3,
    "providerConcurrency": {
      "0-glm-coding": 5,
      "0-deepseek": 3,
      "0-local-vllm": 2,
      "0-mimo": 1,
      "0-nemotron": 1,
      "0-opencode-zen": 3
    }
  }
}
EOF
}

# Generate Shark agent markdown definitions
generate_shark_agents() {
    cat << 'EOF'
# Shark Frankenstein Agents

## Kraken Brain (sisyphus)
**Primary orchestrator** - Analyzes requests, reads code directly, delegates implementation to specialists.

**Tools**: Grep, Glob, Read (NO Write/Edit/Bash)
**Model**: GLM-5 Turbo
**Mode**: Primary orchestrator

## Shark Agent (hephaestus)
**Deep autonomous worker** - Handles complex implementation tasks independently with high precision.

**Tools**: Full access
**Model**: GLM-4.7
**Mode**: Subagent

## Architect (oracle)
**Design architect and debugger** - Focuses on architecture decisions, debugging complex issues.

**Tools**: Full access
**Model**: DeepSeek Reasoner
**Mode**: Subagent

## Code Review (momus)
**Code reviewer** - Finds bugs, quality issues, and suggests improvements.

**Tools**: Read, Grep, Glob (NO Write/Edit/Bash)
**Model**: DeepSeek Chat
**Mode**: Subagent

## Planning Brain (metis)
**Strategic planner** - Breaks down complex tasks into parallel execution waves.

**Tools**: Planning tools
**Model**: DeepSeek Reasoner
**Mode**: Subagent

## Scout (explore)
**Fast codebase explorer** - Finds patterns, files, and implementations quickly.

**Tools**: Grep, Glob, Read
**Model**: GLM-4.5 Flash
**Mode**: Subagent

## Scribe (librarian)
**Documentation researcher** - Finds official docs, best practices, and examples.

**Tools**: Research tools
**Model**: DeepSeek Chat
**Mode**: Subagent

## Visual Cortex (multimodal-looker)
**Visual analyzer** - Inspects images, screenshots, and visual content.

**Tools**: Image analysis
**Model**: MiMo V2 Omni
**Mode**: Subagent

## Middle Manager (atlas)
**Task orchestrator** - Manages project tasks and coordinates agent work.

**Tools**: Coordination tools
**Model**: Nemotron 3 Super
**Mode**: Subagent
EOF
}

# Auto-detect mode based on task
auto_detect_mode() {
    local task="$*"
    local word_count=$(echo "$task" | wc -w)
    
    # Keywords indicating macro tasks
    local macro_keywords="architecture system design refactor migrate pipeline devops ci/cd infrastructure"
    # Keywords indicating micro tasks  
    local micro_keywords="fix debug syntax error single file line test review"
    
    for keyword in $macro_keywords; do
        if echo "$task" | grep -qi "$keyword"; then
            echo "macro"
            return
        fi
    done
    
    for keyword in $micro_keywords; do
        if echo "$task" | grep -qi "$keyword"; then
            echo "micro"
            return
        fi
    done
    
    # Default based on length
    if [ $word_count -gt 20 ]; then
        echo "macro"
    else
        echo "micro"
    fi
}

# Main execution
main() {
    # Check if opencode is installed
    if ! command -v opencode &> /dev/null; then
        echo "❌ OpenCode is not installed. Please install it first."
        echo "   npm install -g @anomalyco/opencode"
        exit 1
    fi
    
    # If arguments provided, skip wizard
    if [ $# -gt 0 ]; then
        # Check for mode flags
        for arg in "$@"; do
            case $arg in
                --micro|-m) MODE="micro"; break ;;
                --macro|-M) MODE="macro"; break ;;
                --direct|-d) MODE="direct"; break ;;
            esac
        done
        
        if [ -z "$MODE" ]; then
            # Auto-detect based on task complexity
            MODE=$(auto_detect_mode "$@")
        fi
    else
        # Interactive mode - show wizard
        MODE=$(select_mode)
    fi
    
    # Prepare environment
    prepare_environment "$MODE"
    
    # Launch OpenCode
    echo "🚀 Launching OpenCode with Shark enhancements..."
    echo ""
    
    # Pass all arguments to opencode
    exec opencode "$@"
}

# Run main function
main "$@"
EOF

# Make executable
chmod +x /usr/local/bin/shark
```

### Step 6: Create Fragment Files
```bash
# Create fragment directory
mkdir -p ~/OPENCODE_WORKSPACE/.shark/fragments

# Shark Agent fragment
cat > ~/OPENCODE_WORKSPACE/.shark/fragments/shark-agent.md << 'EOF'
# Shark Agent Instructions

## Coding Standards
- Write clean, well-tested code following existing patterns
- Use descriptive variable and function names
- Include error handling and validation
- Follow the project's established architecture

## Implementation Guidelines
- Break complex tasks into smaller, testable units
- Write comprehensive tests for new functionality
- Document public APIs and complex logic
- Optimize for readability over premature optimization

## Quality Requirements
- All code must pass existing test suites
- No linting errors or warnings
- Security best practices must be followed
- Performance considerations for critical paths
EOF

# Kraken Brain fragment
cat > ~/OPENCODE_WORKSPACE/.shark/fragments/kraken-brain.md << 'EOF'
# Kraken Brain Instructions

## Orchestration Principles
- Delegate ALL file writes to spawn_agent (hephaestus)
- Use Grep, Glob, Read directly for code exploration
- Run independent implementation tasks in parallel
- Always spawn momus for code review after implementation

## Planning Requirements
- Create detailed execution plans before implementation
- Identify dependencies between tasks
- Group independent tasks into parallel execution waves
- Estimate required agents and phases

## Quality Assurance
- Verify all agent outputs meet specifications
- Ensure code reviews are completed before merging
- Validate test execution and results
- Document architectural decisions
EOF
```

### Step 7: Configure OpenCode Zen Provider
Update OpenCode configuration with Zen provider for free models:

```bash
# Create or update opencode.json
cat > ~/.config/opencode/opencode.json << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-ultra"],
  "provider": {
    "0-glm-coding": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "GLM Coding Plan",
      "options": {
        "baseURL": "https://api.z.ai/api/coding/paas/v4",
        "apiKey": "{env:GLM_API_KEY}"
      },
      "models": {
        "glm-5": { "name": "GLM-5 (128K)", "limit": { "context": 131072, "output": 8192 } },
        "glm-4.7": { "name": "GLM-4.7 (128K)", "limit": { "context": 131072, "output": 8192 } },
        "glm-4.5-flash": { "name": "GLM-4.5 Flash (32K)", "limit": { "context": 32768, "output": 4096 } }
      }
    },
    "0-deepseek": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "DeepSeek",
      "options": {
        "baseURL": "https://api.deepseek.com",
        "apiKey": "{env:DEEPSEEK_API_KEY}"
      },
      "models": {
        "deepseek-chat": { "name": "DeepSeek Chat (128K)", "limit": { "context": 131072, "output": 8192 } },
        "deepseek-reasoner": { "name": "DeepSeek Reasoner (128K)", "limit": { "context": 131072, "output": 8192 } }
      }
    },
    "0-opencode-zen": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OpenCode Zen",
      "options": {
        "baseURL": "https://opencode.ai/zen/v1/chat/completions",
        "apiKey": "{env:OPENCODE_ZEN_API_KEY}"
      },
      "models": {
        "minimax-m2.5-free": { "name": "MiniMax M2.5 Free", "limit": { "context": 131072, "output": 8192 } },
        "mimo-v2-omni-free": { "name": "MiMo V2 Omni Free", "limit": { "context": 65536, "output": 4096 } },
        "nemotron-3-super-free": { "name": "Nemotron 3 Super Free", "limit": { "context": 1048576, "output": 16384 } }
      }
    }
  },
  "model": "0-glm-coding/glm-5",
  "default_agent": "sisyphus"
}
EOF
```

### Step 8: Test Shark CLI Integration
```bash
# Test basic launch
shark --help 2>&1 | head -10

# Test mode selection
shark --micro "test" 2>&1 | head -5

# Test fragment injection
SHARK_MODE=micro opencode --help 2>&1 | grep -i "shark" | head -5
```

### Step 9: Run Integration Tests
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
# Create integration test
cat > test/kraken-ultra-integration.test.ts << 'EOF'
import { AntiHallucinationValidator } from '../src/anti-hallucination/validator';
import { SurgicalDebugProtocol } from '../src/surgical-debug/protocol';
import { NemotronEventBus } from '../src/nemotron-service/event-bus';

describe('Kraken Ultra Integration', () => {
  test('Anti-hallucination validator works', () => {
    const validator = new AntiHallucinationValidator();
    const result = validator.validate('Test plan', { operation: 'plan' });
    expect(result.valid).toBe(true);
  });
  
  test('Surgical debug protocol works', async () => {
    const protocol = new SurgicalDebugProtocol();
    const error = { type: 'syntax', message: 'Unexpected token' };
    const result = await protocol.attemptSurgicalFix(error);
    expect(result).toHaveProperty('success');
  });
  
  test('Nemotron event bus works', () => {
    const eventBus = new NemotronEventBus();
    let eventReceived = false;
    
    eventBus.on('test', () => { eventReceived = true; });
    eventBus.emit('test', {});
    
    expect(eventReceived).toBe(true);
  });
});
EOF

# Run tests
npm test -- --testPathPattern="kraken-ultra" 2>&1 | tail -20
```

### Step 10: Verify Full Integration
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
# TypeScript compilation
npm run typecheck 2>&1 | head -20

# Build
npm run build 2>&1 | tail -10

# Run all tests
npm test 2>&1 | tail -30
```

### Step 11: Create Git Commit
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
git add -A
git commit -m "feat: integrate Kraken Ultra components and implement Shark CLI launch

- Integrated anti-hallucination validators into ToolExecutor
- Added surgical debug protocol for targeted debugging
- Integrated Nemotron event-driven service for cross-module communication
- Created Shark CLI launch script (/usr/local/bin/shark) with micro/macro wizard
- Implemented fragment injection system for agent-specific instructions
- Configured OpenCode Zen provider for free model access
- Created fragment files for Shark Agent and Kraken Brain
- Updated OpenCode configuration with Zen provider
- Added integration tests for Kraken Ultra components
- Maintained backward compatibility with existing systems"
```

## Verification Checklist
- [ ] Anti-hallucination validators integrated and functional
- [ ] Surgical debug protocol operational
- [ ] Nemotron event-driven service integrated
- [ ] Shark CLI launch script created (`/usr/local/bin/shark`)
- [ ] Fragment files created and injected
- [ ] OpenCode Zen provider configured
- [ ] Integration tests passing
- [ ] TypeScript compilation succeeds
- [ ] Build succeeds
- [ ] Shark CLI basic functionality tested

## Error Recovery
If any step fails:
1. **Rollback component integration**: `git checkout -- src/anti-hallucination/ src/surgical-debug/ src/nemotron-service/`
2. **Manual script debugging**: Test Shark CLI script step by step
3. **Incremental approach**: Integrate one component at a time

## Completion Signal
When complete, output the following message:
```
✅ KRAKEN ULTRA INTEGRATION COMPLETE
- Components integrated: anti-hallucination, surgical debug, nemotron service
- Shark CLI launch: OPERATIONAL
- Fragment injection: WORKING
- Zen provider: CONFIGURED
- Tests passing: [count]
- Commit hash: [git rev-parse HEAD]
```

## Next Agent
Proceed to **Testing & Validation Agent** (06-testing-validation-agent.md)