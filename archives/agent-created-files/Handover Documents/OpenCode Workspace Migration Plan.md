# OpenCode Workspace Migration Plan
## Foundation Architecture & Self-Service Migration

### Executive Summary
This plan establishes a new organized workspace at `/home/leviathan/OPENCODE_WORKSPACE/` while preserving all original files. The approach is **copy-based** and **self-service**, allowing each agent to migrate itself when ready without disrupting running processes.

### Core Philosophy
- **Copy, don't move** - Zero downtime migration
- **Self-service** - Each agent controls its own migration
- **Foundation first** - Create ideal structure, let agents adopt it
- **Rollback ready** - Original files always available

### New Workspace Structure
```
/home/leviathan/OPENCODE_WORKSPACE/
├── projects/           # Project-organized work
│   ├── glm/           # GLM integration projects
│   ├── qwen/          # Qwen model projects
│   ├── shark/         # Shark Agent projects
│   ├── vllm/          # vLLM server projects
│   ├── opencode/      # OpenCode core projects
│   ├── deepseek/      # DeepSeek projects
│   └── general/       # General projects
├── agents/            # Agent configurations
├── documentation/     # All documentation
├── configs/           # Configuration files
├── scripts/           # Shell scripts
├── logs/              # Log files
├── tests/             # Test files
├── models/            # AI models (symlinked)
├── tools/             # Migration & utility tools
├── archives/          # Backups
└── migrations/        # Migration state tracking
```

### Migration Tools Provided
1. **`agent-migration-assistant.sh`** - Interactive migration for any agent
2. **`update-paths.py`** - Automated path reference updates
3. **`validate-workspace.sh`** - Workspace integrity validation
4. **`WORKSPACE_MANIFEST.md`** - Complete workspace documentation
5. **`AGENT_MIGRATION_GUIDE.md`** - Step-by-step migration guide

### Key Decisions
1. **Workspace Name**: `OPENCODE_WORKSPACE` (no spaces for compatibility)
2. **File Strategy**: Copy-based, originals preserved
3. **Model Handling**: Symlink to avoid duplicating large files
4. **Path Updates**: Applied only to copied files in new workspace
5. **Self-Service**: Agents migrate themselves using provided tools

### Execution Steps

#### Phase 1: Foundation Creation (One-time)
```bash
# Create workspace structure
mkdir -p "/home/leviathan/OPENCODE_WORKSPACE"
# ... (full script in implementation)
```

#### Phase 2: Agent Self-Migration (Per Agent)
```bash
# Each agent runs when ready
cd "/home/leviathan/OPENCODE_WORKSPACE"
./tools/migrators/agent-migration-assistant.sh
```

#### Phase 3: Validation & Optimization
```bash
# Validate workspace integrity
./tools/validators/validate-workspace.sh
# Update migration status
cat migrations/migration-status.json
```

### Success Metrics
- ✅ All original files preserved at original locations
- ✅ New workspace structure created and validated
- ✅ Migration tools available and tested
- ✅ Agents can self-migrate without downtime
- ✅ Path mappings documented for reference
- ✅ Rollback procedure documented

### Risk Mitigation
| Risk | Mitigation |
|------|------------|
| Running process disruption | Copy-based, not move-based |
| Path reference breakage | Tools update paths in copies only |
| Permission issues | Preserve permissions with `cp -p` |
| Disk space | Symlink models, incremental migration |
| Agent compatibility | Self-service, test before switch |

### Handover Status
- **Plan Document**: This file
- **Implementation**: Ready for execution
- **Validation**: Tools included
- **Documentation**: Complete guides provided
- **Next Step**: Execute foundation creation

### Implementation Command
```bash
# Execute foundation creation
bash "/home/leviathan/Handover Documents/implement-migration.sh"
```

### Post-Implementation
1. Run validation: `validate-workspace.sh`
2. Notify agents workspace is ready
3. Monitor migration via `migration-status.json`
4. Optimize after all agents have migrated

---
**Document Version**: 1.0  
**Created**: 2026-03-25  
**Status**: Ready for Implementation  
**Author**: OpenCode Migration System