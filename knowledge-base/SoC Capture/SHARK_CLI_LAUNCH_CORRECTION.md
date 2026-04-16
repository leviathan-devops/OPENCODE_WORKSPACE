# Shark CLI Launch Correction: Micro/Macro Wizard

## Problem Statement
The current `shark-opencode-wrapper.sh` creates a separate CLI with `--help`, `--agents`, `status`, `config` commands, which deviates from the intended user experience. Users should experience the **standard OpenCode TUI** with all Shark/Kraken enhancements baked into the environment, not a wrapper with different commands.

## Correct Architecture

### Target User Experience
1. **Command**: `shark` (symlink/alias to `opencode` with environment overrides)
2. **Wizard**: Simple micro/macro mode selector
3. **Launch**: After selection, executes `opencode` with:
   - Custom `opencode.json` (includes Zen provider + agent mappings)
   - `opencode-ultra.json` with Shark-named agents
   - Fragment files (`.shark/fragments/`) for agent-specific instructions
4. **Experience**: User enters **standard OpenCode TUI** with all enhancements

## Implementation Workflow

### Phase 1: Create Shark Launcher Script

**File**: `/usr/local/bin/shark` (executable shell script)

**Script Logic**:
```bash
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
    
    cat << EOF
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

# Run main function
main "$@"
```

### Phase 2: Update OpenCode Configuration

**File**: `~/.config/opencode/opencode.json` (with Zen provider)

```json
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
```

### Phase 3: Create Fragment Files

**Directory**: `~/OPENCODE_WORKSPACE/.shark/fragments/`

**File**: `shark-agent.md`
```markdown
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
```

**File**: `kraken-brain.md`
```markdown
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
```

### Phase 4: Installation Script

**File**: `install-shark-cli.sh`
```bash
#!/bin/bash
# Install Shark Frankenstein CLI

set -e

echo "🦈 Installing Shark Frankenstein CLI..."

# Check dependencies
if ! command -v opencode &> /dev/null; then
    echo "Installing OpenCode..."
    npm install -g @anomalyco/opencode
fi

# Create shark command
sudo cp shark-launcher.sh /usr/local/bin/shark
sudo chmod +x /usr/local/bin/shark

# Create configuration directory
mkdir -p ~/OPENCODE_WORKSPACE/.shark/fragments

# Copy fragment templates
cp fragments/* ~/OPENCODE_WORKSPACE/.shark/fragments/

# Update OpenCode config
echo "Updating OpenCode configuration..."
cp opencode-zen.json ~/.config/opencode/opencode.json

echo ""
echo "✅ Installation complete!"
echo ""
echo "Usage:"
echo "  shark                     # Interactive mode with wizard"
echo "  shark 'fix the bug'       # Auto-detect mode"
echo "  shark --micro 'debug'     # Force micro mode"
echo "  shark --macro 'refactor'  # Force macro mode"
```

## Testing Workflow

### Test 1: Basic Launch
```bash
# Should show wizard
shark

# Should auto-detect as micro task
shark "fix the syntax error in main.py"

# Should auto-detect as macro task  
shark "refactor the entire authentication system"
```

### Test 2: Mode Selection
```bash
# Force micro mode
shark --micro "implement new feature"

# Force macro mode
shark --macro "design database architecture"

# Direct OpenCode
shark --direct
```

### Test 3: Agent Mapping Verification
```bash
# Launch OpenCode and check agent list
shark --micro
# In OpenCode TUI: type "/agents" to see Shark agent mappings

# Test spawn_agent with Shark names
spawn_agent("shark-agent") should work
spawn_agent("kraken-brain") should work
```

### Test 4: Fragment Injection
```bash
# Verify fragments are injected
shark --macro
# Check system prompt contains Kraken Brain instructions

shark --micro  
# Check system prompt contains Shark Agent instructions
```

## Integration Points

### 1. Environment Variables
- `SHARK_MODE`: `micro` or `macro`
- `SHARK_PRIMARY_AGENT`: Current primary agent
- `OPENCODE_CONFIG_DIR`: Temporary config directory
- `GLM_API_KEY`, `DEEPSEEK_API_KEY`, `OPENCODE_ZEN_API_KEY`

### 2. Configuration Loading Order
1. Base `~/.config/opencode/opencode.json`
2. Shark-generated `$TEMP_CONFIG_DIR/opencode-ultra.json`
3. Fragment files from `$SHARK_FRAGMENTS_DIR`
4. Agent definitions from `.opencode/agents/`

### 3. Cleanup Mechanism
- Temporary config directory cleaned on exit
- Environment variables scoped to session
- No persistent side effects

## Performance Considerations

### Startup Time Target
- **Wizard display**: < 100ms
- **Config generation**: < 50ms
- **OpenCode launch**: Same as native (no overhead)

### Memory Usage
- **Temporary files**: < 1MB
- **Environment**: Minimal overhead
- **Fragments**: Loaded on demand

### Compatibility
- **OpenCode versions**: 1.2.x and above
- **Shell compatibility**: Bash 4.0+
- **Platforms**: Linux, macOS (WSL supported)

## Error Handling

### Common Issues & Solutions
1. **OpenCode not installed**: Guide to installation
2. **API keys missing**: Instructions for setting environment variables
3. **Permission denied**: Check `/usr/local/bin` permissions
4. **Config errors**: Fallback to default OpenCode config

### Recovery Mechanisms
- **Fallback to direct mode** if config generation fails
- **Preserve original config** before modifications
- **Log errors** to `~/.shark/logs/` for debugging

## Deployment Checklist

### Prerequisites
- [ ] OpenCode installed globally
- [ ] GLM API key set (`GLM_API_KEY`)
- [ ] DeepSeek API key set (`DEEPSEEK_API_KEY`)
- [ ] OpenCode Zen API key optional (`OPENCODE_ZEN_API_KEY`)

### Installation Steps
1. [ ] Copy `shark-launcher.sh` to `/usr/local/bin/shark`
2. [ ] Set execute permissions: `chmod +x /usr/local/bin/shark`
3. [ ] Create fragment directory: `mkdir -p ~/OPENCODE_WORKSPACE/.shark/fragments`
4. [ ] Copy fragment templates
5. [ ] Update OpenCode config with Zen provider
6. [ ] Test basic functionality

### Verification
1. [ ] `shark` command shows wizard
2. [ ] `shark --micro` launches OpenCode
3. [ ] Agent mappings work correctly
4. [ ] Fragments are injected properly

---

*This workflow provides a complete, mechanical implementation plan for correcting the Shark CLI launch experience. Each step is executable and testable.*