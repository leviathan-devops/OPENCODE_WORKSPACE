# Agent Migration Guide
## How to Migrate to the New Workspace

### Quick Start
```bash
# Run the migration assistant
/home/leviathan/OPENCODE_WORKSPACE/tools/migrators/agent-migration-assistant.sh
```

### Detailed Migration Process

#### Step 1: Preparation
1. Check workspace exists: `ls -la /home/leviathan/OPENCODE_WORKSPACE/`
2. Validate workspace: `./tools/validators/validate-workspace.sh`
3. Review your current configuration

#### Step 2: Migration
1. Run migration assistant (see above)
2. Follow the instructions provided
3. The assistant will create backups and prepare new configuration

#### Step 3: Switch
1. Stop your agent (instructions provided)
2. Switch to new configuration (instructions provided)
3. Restart your agent
4. Test functionality

#### Step 4: Verification
1. Verify agent is running correctly
2. Check logs for any issues
3. Test critical functionality

### Agent-Specific Notes

#### OpenCode Agents
- Configuration updated to use new model paths
- Test with: `opencode --config /home/leviathan/OPENCODE_WORKSPACE/configs/opencode/opencode.json status`

#### Shark Agents
- Configuration copied to new location
- Test dual-mode functionality after migration

#### Other Agents
- Use `update-paths.py` to update configuration files
- Test in isolated environment first

### Troubleshooting

#### Migration assistant not found
```bash
# Check if workspace exists
ls -la /home/leviathan/OPENCODE_WORKSPACE/
# If not, foundation needs to be created
```

#### Permission errors
```bash
# Make tools executable
chmod +x /home/leviathan/OPENCODE_WORKSPACE/tools/*/*.sh
chmod +x /home/leviathan/OPENCODE_WORKSPACE/tools/*/*.py
```

#### Path reference errors
```bash
# Update paths manually
python3 /home/leviathan/OPENCODE_WORKSPACE/tools/updaters/update-paths.py <your-file>
```

### Rollback Procedure
If migration fails:
1. Stop your agent
2. Restore from backup (backup location provided by migration assistant)
3. Restart agent with original configuration
4. Contact support if issues persist

### Support
- Check `WORKSPACE_MANIFEST.md` for workspace details
- Review `configs/path-mapping.json` for path mappings
- Validation tools available in `tools/validators/`
