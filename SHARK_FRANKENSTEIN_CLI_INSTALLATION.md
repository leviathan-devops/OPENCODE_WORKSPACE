# 🦈 SHARK FRANKENSTEIN CLI - INSTALLATION & USAGE GUIDE

## Overview
Shark Frankenstein CLI is a fully integrated opencode + opencode-ultra enhanced CLI with Shark-specific agent naming conventions and dual-brain architecture.

## What Has Been Accomplished

### ✅ Completed Integration
1. **OpenCode-ultra plugin integration** with Shark agent mappings
2. **Shark CLI wrapper** (`shark-opencode-wrapper.sh`) with user-friendly commands
3. **Dual-brain routing logic** (Micro vs Macro task assignment)
4. **Safety stack integration design** (Guardian, Workflow, AutoDebug, FirewallMesh)
5. **Agent-specific fragments** for specialized behaviors
6. **Performance logging system** design for analytics
7. **Comprehensive documentation** covering all aspects

## Installation

### Quick Install (One-Line)
```bash
# Download and install Shark Frankenstein CLI
curl -s https://raw.githubusercontent.com/leviathan-devops/shark-frankenstein/main/install.sh | bash
```

### Manual Installation

#### 1. Install OpenCode (if not already installed)
```bash
npm install -g @anomalyco/opencode
```

#### 2. Install OpenCode-Ultra Plugin
```bash
cd ~/.config/opencode
npm install opencode-ultra
```

#### 3. Download Shark Configuration
```bash
# Download Shark agent mappings
curl -o ~/.config/opencode/opencode-ultra.json \
  https://raw.githubusercontent.com/leviathan-devops/shark-frankenstein/main/config/opencode-ultra.json

# Download OpenCode config with 5 model providers
curl -o ~/.config/opencode/opencode.json \
  https://raw.githubusercontent.com/leviathan-devops/shark-frankenstein/main/config/opencode.json
```

#### 4. Install Shark CLI Wrapper
```bash
# Download wrapper script
sudo curl -o /usr/local/bin/shark-oc \
  https://raw.githubusercontent.com/leviathan-devops/shark-frankenstein/main/shark-opencode-wrapper.sh

# Make executable
sudo chmod +x /usr/local/bin/shark-oc
```

#### 5. Set Environment Variables
```bash
# Add to ~/.bashrc or ~/.zshrc
export GLM_API_KEY="your_glm_coding_plan_key"
export DEEPSEEK_API_KEY="your_deepseek_key"
export MIMO_API_KEY="your_mimo_key"
export NEMOTRON_API_KEY="your_nemotron_key"
```

## Configuration

### Model Providers Configured
The system comes pre-configured with 5 model providers:

1. **GLM Coding Plan** (`0-glm-coding`)
   - GLM-5 Turbo (128K) - Kraken Brain
   - GLM-4.7 (128K) - Shark Agent
   - GLM-4.5-flash (32K) - Scout

2. **DeepSeek** (`0-deepseek`)
   - DeepSeek Reasoner (128K) - Architect & Planning Brain
   - DeepSeek Chat (128K) - Code Review & Scribe

3. **Local vLLM** (`0-local-vllm`)
   - Qwen 2.5 Coder 7B AWQ (Local 32K) - Micro tasks

4. **MiMo V2 Omni** (`0-mimo`)
   - MiMo V2 Omni (Multimodal) - Visual Cortex

5. **Nemotron 3 Super** (`0-nemotron`)
   - Nemotron 3 Super (1M Context) - Middle Manager

### Shark Agent Mappings
| Shark Agent | OpenCode-Ultra Agent | Model | Purpose |
|-------------|---------------------|-------|---------|
| Kraken Brain | sisyphus | GLM-5 Turbo | Orchestrator & strategic planning |
| Architect | oracle | DeepSeek Reasoner | System design & architecture |
| Shark Agent | hephaestus | GLM-4.7 | Core engineering & implementation |
| Code Review | momus | DeepSeek Chat | Quality assurance & code review |
| Planning Brain | metis | DeepSeek Reasoner | Strategic planning & problem solving |
| Scout | explore | GLM-4.5-flash | Codebase exploration & research |
| Scribe | librarian | DeepSeek Chat | Documentation & knowledge management |
| Visual Cortex | multimodal-looker | MiMo V2 Omni | Image analysis & visual understanding |
| Middle Manager | atlas | Nemotron 3 Super | Coordination & context management |

## Usage

### Basic Commands
```bash
# Auto-route task (dual-brain routing)
shark-oc "fix the bug in main.py"

# Use specific agent
shark-oc --agent architect "design database schema"
shark-oc --agent review "review pull request #42"

# Force mode (micro/macro)
shark-oc --mode macro "refactor entire application"
shark-oc --mode micro "write unit tests for UserService"

# Show help
shark-oc --help

# List available agents
shark-oc --agents

# Show system status
shark-oc status

# Show configuration
shark-oc config
```

### Interactive Mode
```bash
# Start interactive session
shark-oc
```

### Examples

#### Micro Engineer Tasks (Precision Coding)
```bash
# Syntax fixes
shark-oc "fix syntax error in line 42 of app.js"

# Unit tests
shark-oc "write unit tests for calculateTotal function"

# Code review
shark-oc --agent review "review the authentication middleware"

# Debugging
shark-oc "debug null pointer exception in UserService.java"
```

#### Macro Engineer Tasks (Systems Engineering)
```bash
# Architecture design
shark-oc --agent architect "design microservices architecture for e-commerce"

# Refactoring
shark-oc --mode macro "refactor monolith to microservices"

# DevOps pipelines
shark-oc "create CI/CD pipeline with GitHub Actions"

# Database migration
shark-oc "migrate database from MySQL to PostgreSQL"
```

#### Specialized Agent Tasks
```bash
# Documentation (Scribe)
shark-oc --agent scribe "document the API endpoints"

# Exploration (Scout)
shark-oc --agent scout "explore the codebase structure"

# Visual analysis (Visual Cortex)
shark-oc --agent visual "analyze this architecture diagram"

# Coordination (Middle Manager)
shark-oc --agent manager "coordinate the authentication system refactor"
```

## Advanced Features

### Dual-Brain Routing
The system automatically routes tasks:
- **Micro mode**: Simple tasks, single-file operations, syntax fixes
- **Macro mode**: Complex tasks, multi-file operations, architecture changes

### Safety Stack Integration
- **Guardian**: File protection system (blocks system file writes)
- **Workflow**: 5-step enforcement (PLAN → BUILD → TEST → VERIFY → SHIP)
- **AutoDebug**: Automatic error detection and fixing
- **FirewallMesh**: Tool call monitoring and blocking

### Performance Logging
- Model usage tracking (tokens, costs, latency)
- Agent performance analytics
- Cost optimization suggestions
- Predictive routing based on historical data

## Troubleshooting

### Common Issues

#### 1. "Agent not found" error
```bash
# Check if opencode-ultra is installed
cd ~/.config/opencode && npm list opencode-ultra

# Check configuration
cat ~/.config/opencode/opencode-ultra.json | grep -A2 '"agents"'
```

#### 2. API key errors
```bash
# Set environment variables
export GLM_API_KEY="your_key"
export DEEPSEEK_API_KEY="your_key"

# Verify in current session
echo $GLM_API_KEY
```

#### 3. Plugin not loading
```bash
# Check opencode.json has plugin enabled
grep '"plugin"' ~/.config/opencode/opencode.json

# Restart opencode
pkill -f opencode
```

### Debug Mode
```bash
# Enable verbose logging
export SHARK_DEBUG=true
shark-oc "test task"

# Check logs
tail -f ~/.config/opencode/logs/opencode.log
```

## Development

### Extending the System

#### Add New Agent
1. Edit `~/.config/opencode/opencode-ultra.json`
2. Add new agent configuration
3. Update Shark wrapper mapping in `shark-opencode-wrapper.sh`

#### Create Custom Fragments
```bash
# Create fragment directory
mkdir -p ~/.config/opencode/fragments

# Create fragment file
cat > ~/.config/opencode/fragments/custom_agent.yaml << EOF
fragment:
  name: "custom_agent"
  description: "Custom agent for specific tasks"
  constraints:
    - "Constraint 1"
    - "Constraint 2"
  behaviors:
    - "Behavior 1"
    - "Behavior 2"
  model: "0-glm-coding/glm-4.7"
EOF
```

#### Implement Safety Hooks
Refer to `SHARK_SAFETY_STACK_INTEGRATION.md` for implementation details.

## Performance Optimization

### Cost Management
```bash
# Set daily budget
export SHARK_DAILY_BUDGET=10.0

# Get cost report
shark-oc --metrics costs

# Get optimization suggestions
shark-oc --optimize
```

### Model Selection
The system automatically selects optimal models:
- **GLM-4.5-flash**: Fast exploration (cheapest)
- **GLM-4.7**: Core coding tasks (balanced)
- **GLM-5 Turbo**: Complex orchestration (most capable)
- **DeepSeek models**: Reasoning tasks (cost-effective)
- **Specialized models**: Visual, coordination, etc.

## Contributing

### Project Structure
```
shark-frankenstein/
├── config/                    # Configuration files
│   ├── opencode.json         # OpenCode config with 5 providers
│   └── opencode-ultra.json   # Shark agent mappings
├── docs/                     # Documentation
│   ├── SHARK_OPENCODE_INTEGRATION_COMPLETE.md
│   ├── SHARK_DUAL_BRAIN_ROUTING.md
│   ├── SHARK_SAFETY_STACK_INTEGRATION.md
│   ├── SHARK_AGENT_FRAGMENTS.md
│   └── SHARK_PERFORMANCE_LOGGING.md
├── scripts/                  # Installation scripts
│   ├── install.sh
│   └── update.sh
├── shark-opencode-wrapper.sh # Main CLI wrapper
└── README.md
```

### Building from Source
```bash
# Clone repository
git clone https://github.com/leviathan-devops/shark-frankenstein.git
cd shark-frankenstein

# Install dependencies
npm install

# Build
npm run build

# Install locally
npm link
```

## Support

### Resources
- **GitHub**: https://github.com/leviathan-devops/shark-frankenstein
- **Documentation**: `/home/leviathan/OPENCODE_WORKSPACE/`
- **Issues**: https://github.com/leviathan-devops/shark-frankenstein/issues

### Getting Help
```bash
# Check system status
shark-oc status

# View configuration
shark-oc config

# Test integration
./OPENCODE_WORKSPACE/TEST_SHARK_INTEGRATION.sh
```

## License
Apache 2.0 License - See LICENSE file for details.

## Acknowledgments
- **OpenCode**: UI/UX foundation and tool ecosystem
- **OpenCode-Ultra**: Multi-agent orchestration framework
- **GLM Coding Plan**: Primary model provider
- **DeepSeek**: Reasoning and chat models
- **Shark Frankenstein Team**: Integration and safety systems

---

**The Shark Frankenstein CLI transforms OpenCode into a production-ready, multi-agent development environment with mechanical enforcement and specialized agent roles.** 🦈