# 🦈 Shark Frankenstein CLI Quick Start

## Overview
Shark Frankenstein CLI is now fully integrated with OpenCode and OpenCode-Ultra, providing a dual-brain architecture with 9 specialist agents. The launch experience is a simple micro/macro wizard that launches the standard OpenCode TUI with all Shark enhancements baked in.

## Installation Verification
1. **OpenCode**: `opencode --version` (should show v1.3.4 or later)
2. **OpenCode-Ultra Plugin**: Check `~/.config/opencode/opencode-ultra.json`
3. **Shark Launcher**: `shark --help` should show usage

## First-Time Setup
1. **API Keys** (optional but recommended):
   ```bash
   # Set in your shell profile (~/.bashrc, ~/.zshrc)
   export GLM_API_KEY="your_key"
   export DEEPSEEK_API_KEY="your_key"
   export OPENCODE_ZEN_API_KEY="your_key"  # For free models
   export MIMO_API_KEY="your_key"
   export NEMOTRON_API_KEY="your_key"
   ```

2. **Reload your shell**: `source ~/.bashrc`

## Basic Usage

### Interactive Mode (Recommended)
```bash
shark
```
1. Select your engineer mode (Micro/Macro/Auto)
2. OpenCode TUI launches with Shark enhancements
3. Use `/agents` in OpenCode to see Shark-mapped agents

### Direct Task Execution
```bash
shark "fix the bug in main.py"
shark --mode macro "design database schema"
shark --mode micro "add unit tests"
```

### Agent-Specific Tasks
```bash
# Use Shark agent names (they map to OpenCode-Ultra agents)
opencode run --agent hephaestus "write a function"
opencode run --agent sisyphus "orchestrate complex task"
```

## Shark Agent Mapping
| Shark Agent | OpenCode-Ultra Agent | Model | Purpose |
|-------------|----------------------|-------|---------|
| Kraken Brain | sisyphus | GLM-5 | Primary orchestrator |
| Architect | oracle | DeepSeek Reasoner | System design |
| Shark Agent | hephaestus | GLM-4.7 | Deep autonomous work |
| Code Review | momus | MiniMax M2.5 Free | Quality assurance |
| Planning Brain | metis | DeepSeek Reasoner | Strategic planning |
| Scout | explore | Big Pickle | Codebase exploration |
| Scribe | librarian | MiniMax M2.5 Free | Documentation |
| Visual Cortex | multimodal-looker | MiMo V2 Omni Free | Visual analysis |
| Middle Manager | atlas | Nemotron 3 Super Free | Task coordination |

## Features
- **Dual-Brain Architecture**: Micro (precision) and Macro (systems) modes
- **9 Specialist Agents**: Each optimized for specific tasks
- **OpenCode Zen Integration**: Free models during beta
- **Fragment-Based Instructions**: Shark-specific guidance per agent
- **Safety Stack**: Guardian, Workflow, AutoDebug (designed, ready for build team)
- **Build Team Workflows**: Complete rewrite strategy for customizable agent names

## Troubleshooting

### "sisyphus missing from selectable modes"
Fixed in config migration. Ensure `~/.config/opencode/opencode.json` references plugin `["opencode-ultra"]`.

### "API key missing" warnings
Set environment variables as shown above. Free models (Zen) may work without keys during beta.

### "Agent is a subagent" warning
Normal behavior. OpenCode-Ultra uses sisyphus as primary orchestrator; subagents are spawned as needed.

### Shark wrapper shows old CLI
Ensure `which shark` points to `/home/leviathan/.npm-global/bin/shark` (new launcher). Original Shark Frankenstein CLI is available as `shark-frankenstein`.

## Advanced Configuration
- **Fragment files**: `~/.config/opencode/fragments/shark/` - customize agent instructions
- **Provider configuration**: `~/.config/opencode/opencode.json` - add/remove model providers
- **OpenCode-Ultra config**: `~/.config/opencode/opencode-ultra.json` - fine-tune agent behavior

## Build Team Workflows
Complete implementation plans for the build team are in `OPENCODE_WORKSPACE/build-team-workflows/`:
- `OPENCODE_ULTRA_REWRITE_STRATEGY.md` - Customizable agent names
- `OPENCODE_ZEN_INTEGRATION_WORKFLOW.md` - Zen model integration
- `BUILD_TEAM_IMPLEMENTATION_PLAN.md` - Phased implementation

## Support
- **GitHub Issues**: https://github.com/anomalyco/opencode/issues
- **OpenCode Docs**: https://opencode.ai/docs
- **Zen Documentation**: https://opencode.ai/zen

---
*Shark Frankenstein CLI v2.0 | OpenCode-Ultra Enhanced | Dual-Brain Architecture*