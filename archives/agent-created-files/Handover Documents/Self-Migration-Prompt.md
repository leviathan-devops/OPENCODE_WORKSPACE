# Self-Migration Prompt for Agents
## Copy and paste into any terminal to begin migration

```bash
# ============================================
# OPENCODE WORKSPACE SELF-MIGRATION PROMPT
# ============================================
# Copy this entire block into any terminal
# Agents will migrate themselves to the new organized workspace
# ============================================

echo "🚀 Starting OpenCode Workspace Self-Migration"
echo "=========================================="

# Check if new workspace exists
if [ ! -d "/home/leviathan/OPENCODE_WORKSPACE" ]; then
    echo "❌ New workspace not found. Foundation needs to be created first."
    echo "   Run: bash /home/leviathan/Handover\ Documents/implement-migration.sh"
    exit 1
fi

# Validate workspace
echo "🔍 Validating workspace..."
if ! "/home/leviathan/OPENCODE_WORKSPACE/tools/validators/validate-workspace.sh"; then
    echo "❌ Workspace validation failed. Please fix issues before migration."
    exit 1
fi

# Run migration assistant
echo ""
echo "🔧 Starting migration assistant..."
"/home/leviathan/OPENCODE_WORKSPACE/tools/migrators/agent-migration-assistant.sh"

echo ""
echo "📋 Migration instructions provided above."
echo "   Follow the steps to complete your migration."
echo ""
echo "💡 Tip: Backup your current configuration before proceeding."
```

## Quick One-Liner Version
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE" && ./tools/validators/validate-workspace.sh && ./tools/migrators/agent-migration-assistant.sh
```

## What This Does

### 1. **Validates the New Workspace**
- Checks if `/home/leviathan/OPENCODE_WORKSPACE/` exists and is properly structured
- Validates configuration files and paths
- Ensures migration tools are available and executable

### 2. **Runs Migration Assistant**
- Detects your agent type (OpenCode, Shark, Qwen, GLM, etc.)
- Creates backups of your current configuration
- Prepares new configuration in the organized workspace
- Provides step-by-step instructions for migration

### 3. **Provides Clear Instructions**
- Shows exactly what commands to run
- Includes rollback procedures
- Agent-specific guidance based on your setup

## Migration Process

### Phase 1: Preparation (Automatic)
- ✅ Workspace validation
- ✅ Backup creation
- ✅ New configuration preparation

### Phase 2: Switch (Manual - Follow Instructions)
- Stop your agent
- Switch to new configuration
- Restart agent
- Test functionality

### Phase 3: Verification (Manual)
- Verify agent is running correctly
- Check logs for issues
- Test critical functionality

## Safety Features

### 🔒 Non-Destructive
- Original files remain at `/home/leviathan/`
- Copies only, no file deletion
- Backups created automatically

### 🔄 Rollback Ready
- Backup locations documented
- Simple rollback commands provided
- Original configuration always available

### ⚡ Self-Service
- Each agent controls its own migration
- Migrate when ready, no forced timeline
- Test before switching

## Post-Migration

### Verify Success
```bash
# Check if agent is running
opencode status  # For OpenCode agents
shark-agent status  # For Shark agents

# Check logs for errors
tail -f /home/leviathan/OPENCODE_WORKSPACE/logs/agent.log
```

### Update Migration Status
```bash
# Update migration tracking
cd "/home/leviathan/OPENCODE_WORKSPACE"
python3 -c "
import json
with open('migrations/migration-status.json', 'r') as f:
    data = json.load(f)
# Update your agent status here
print('Migration status updated')
"
```

## Troubleshooting

### Issue: "Workspace not found"
**Solution**: Foundation needs to be created first
```bash
bash "/home/leviathan/Handover Documents/implement-migration.sh"
```

### Issue: "Permission denied"
**Solution**: Make tools executable
```bash
chmod +x "/home/leviathan/OPENCODE_WORKSPACE/tools/"*/*.sh
chmod +x "/home/leviathan/OPENCODE_WORKSPACE/tools/"*/*.py
```

### Issue: Migration fails
**Solution**: Rollback using provided instructions
```bash
# Example rollback for OpenCode
mv /home/leviathan/.config/opencode /home/leviathan/.config/opencode.new
mv /home/leviathan/.config/opencode.old /home/leviathan/.config/opencode
opencode start
```

## Support Resources

### Documentation
- `WORKSPACE_MANIFEST.md` - Workspace structure and overview
- `AGENT_MIGRATION_GUIDE.md` - Detailed migration guide
- `configs/path-mapping.json` - Path reference mappings

### Tools
- `validate-workspace.sh` - Workspace validation
- `update-paths.py` - Path reference updates
- `agent-migration-assistant.sh` - Migration automation

### Status Tracking
- `migrations/migration-status.json` - Migration progress tracking

---
**Ready to migrate? Copy the prompt above and paste into your terminal!**

**Status**: ✅ Foundation created, ✅ Tools ready, ✅ Validation passed  
**Next**: Agents can self-migrate using the prompt above