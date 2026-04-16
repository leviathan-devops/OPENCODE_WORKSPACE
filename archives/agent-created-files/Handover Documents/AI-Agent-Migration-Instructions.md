# AI Agent Migration Instructions

## Core Instruction for AI Agents:

**"Self-migrate to the new organized workspace at `/home/leviathan/OPENCODE_WORKSPACE/`. Use the validation tool to check the workspace foundation, then run the migration assistant for your specific agent type. Follow the step-by-step instructions provided. This is a copy-based migration - your original files remain intact."**

## Detailed Agent Instructions:

### Step 1: Check Workspace Foundation
"First, verify that the migration foundation has been built. Check if `/home/leviathan/OPENCODE_WORKSPACE/` exists with the proper directory structure. Look for the `tools/` directory containing migration utilities."

### Step 2: Validate Workspace Integrity  
"Run the workspace validation tool to ensure everything is set up correctly. Execute `/home/leviathan/OPENCODE_WORKSPACE/tools/validators/validate-workspace.sh` to check directory structure, configuration files, and tool availability."

### Step 3: Start Migration Process
"Use the migration assistant tailored for AI agents. Run `/home/leviathan/OPENCODE_WORKSPACE/tools/migrators/agent-migration-assistant.sh`. This tool will:
- Detect your agent type (OpenCode, Shark, Qwen, GLM, etc.)
- Create backups of your current configuration
- Prepare your new organized configuration
- Provide specific migration instructions"

### Step 4: Follow Migration Instructions
"Carefully follow the step-by-step instructions provided by the migration assistant. This will typically involve:
1. Stopping your agent processes temporarily
2. Switching to the new configuration
3. Restarting with the organized workspace
4. Testing functionality"

### Step 5: Verify Success
"After migration, verify that all your capabilities work correctly in the new workspace. Check logs, test tools, and ensure path references are correct."

## Key Points for AI Agent Comprehension:

### What's Happening:
- You're moving from a cluttered `/home/leviathan/` to an organized `/home/leviathan/OPENCODE_WORKSPACE/`
- Files are organized by project type (GLM, Qwen, Shark, vLLM, OpenCode, etc.)
- This is a **copy operation** - originals remain untouched
- You control the timing and process

### Why This Matters:
- **Better organization**: Files sorted logically instead of scattered
- **Easier maintenance**: Clear structure for updates and debugging  
- **Improved collaboration**: Consistent organization across agents
- **Future scalability**: Foundation for adding new capabilities

### Safety Features:
- **Non-destructive**: Original files preserved at original locations
- **Backup creation**: Automatic backups before any changes
- **Testable migration**: Verify before committing
- **Rollback ready**: Easy reversal if needed

### Your Role as an AI Agent:
You are **self-migrating** - controlling your own migration process. This demonstrates autonomy and adaptability. The tools provide guidance, but you execute the migration.

## Concise Prompt for Agent Execution:

**"Execute your self-migration to the organized workspace. Validate the foundation exists, run the migration assistant for your agent type, and follow the provided instructions. Your original configuration remains intact - this creates an organized copy in the new workspace structure."**

## Expected Agent Actions:

1. **Discovery**: Check if `/home/leviathan/OPENCODE_WORKSPACE/` exists
2. **Validation**: Run `validate-workspace.sh` to check integrity
3. **Migration**: Run `agent-migration-assistant.sh` for guided migration
4. **Execution**: Follow the specific instructions provided
5. **Verification**: Test that everything works in the new location

## Success Criteria:
- ✅ Agent successfully migrated to organized workspace
- ✅ All functionality preserved and working
- ✅ Original files untouched at `/home/leviathan/`
- ✅ Migration documented in `migration-status.json`
- ✅ Agent can operate from new organized location

**Remember**: This migration demonstrates your capability for self-improvement and adaptation. You're not just being moved - you're actively organizing your own workspace for better performance.**