# OpenCode Workspace Manifest
## New Architecture Foundation

### Structure Overview
```
/home/leviathan/OPENCODE_WORKSPACE/
├── projects/           # Project-organized work (30 projects)
├── agents/            # Agent configurations
├── documentation/     # All documentation
├── configs/           # Configuration files
├── scripts/           # Shell scripts
├── logs/              # Log files
├── tests/             # Test files
├── models/            # AI models (symlinked)
├── tools/              # Migration & utility tools
├── archives/          # Backups
└── migrations/         # Migration state tracking
```

### Migrated Projects (2026-04-03)
All major projects have been consolidated into `/home/leviathan/OPENCODE_WORKSPACE/projects/`:
- agent-lab, agent-swarm, agent-swarm-fork
- ai-tools, deer-flow
- deepseek, glm, qwen, vllm
- hermes-glm-setup, hive, hive-mind
- kraken-brain, kraken-hive-engine
- mpsc-channel (Rust lock-free channel library)
- nemotron-communication-layer
- opencode, OpenViking
- shark, shark-agent-context, shark-agent-plugin, shark-frankenstein
- shark-gemini-proxy, shark-opencode-integration
- space-invaders
- turboquant, turboquant-pytorch
- voice-to-text
- Shark Agent Legacy

### Migration Status
- **Foundation Created**: Thu Mar 26 01:48:49 AM +04 2026
- **Major Migration Complete**: Fri Apr 03 03:29 PM +04 2026
- **Projects Migrated**: 30 projects now in workspace
- **Configuration Updated**: opencode.json has workspace paths
- **AGENTS.md Updated**: Explicit workspace-first rules

### Workspace Configuration
Added to `~/.config/opencode/opencode.json`:
```json
"workspace": {
  "root": "/home/leviathan/OPENCODE_WORKSPACE",
  "projects": "/home/leviathan/OPENCODE_WORKSPACE/projects",
  "logs": "/home/leviathan/OPENCODE_WORKSPACE/logs",
  "config": "/home/leviathan/OPENCODE_WORKSPACE/configs",
  "docs": "/home/leviathan/OPENCODE_WORKSPACE/documentation"
}
```

### Agent Behavior Rules (from AGENTS.md)
1. **ALL project files MUST be written to `/home/leviathan/OPENCODE_WORKSPACE/` unless explicitly told otherwise**
2. **File Creation**: ALWAYS use `/home/leviathan/OPENCODE_WORKSPACE/` as base path
3. **Project Structure**: Create projects under `projects/` subdirectory
4. **Scripts**: Place in `scripts/` not home directory scripts
5. **Configs**: Use `configs/` for configuration files
6. **Temp Files**: Use `/tmp/` for temporary files, never home directory
7. **Verification**: Always verify file location before and after writes

### Quick Start for Agents
```bash
# Always write project files to workspace
WORKSPACE_ROOT=/home/leviathan/OPENCODE_WORKSPACE

# Example: Create new project
mkdir -p $WORKSPACE_ROOT/projects/my-new-project

# Example: Write file
echo "# my file" > $WORKSPACE_ROOT/projects/my-new-project/README.md
```

### Path Mappings
- Home: `/home/leviathan/`
- Workspace: `/home/leviathan/OPENCODE_WORKSPACE/`
- Projects: `/home/leviathan/OPENCODE_WORKSPACE/projects/`

### Remaining Items in Home
Some legitimate files remain in home (system configs, caches, running services):
- `.config/` - Application configurations
- `.local/` - Application data
- `.ssh/` - SSH keys (should not be moved)
- `.bashrc`, `.bash_history` - Shell configs (should not be moved)
- Running services: `agent-swarm` (now at projects/agent-swarm)

### Notes
- Runners/services may reference old paths - verify before restarting
- Models remain symlinked to avoid duplication
- Each agent controls its own migration timing
- Rollback available via archives/
