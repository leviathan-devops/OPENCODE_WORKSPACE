#!/bin/bash
# OpenCode Workspace Migration Implementation
# Foundation Creation Script
# Execute this once to create the new workspace architecture

set -e

echo "🚀 OpenCode Workspace Migration - Foundation Creation"
echo "====================================================="
echo "This script will:"
echo "1. Create new workspace at /home/leviathan/OPENCODE_WORKSPACE/"
echo "2. Copy files (not move) to organized structure"
echo "3. Update paths in copied files only"
echo "4. Create migration tools for agents"
echo "5. Validate the new workspace"
echo ""
echo "⚠️  IMPORTANT: This is NON-DESTRUCTIVE"
echo "   Original files will remain at /home/leviathan/"
echo ""

# Ask for confirmation
read -p "Continue with foundation creation? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# ============================================
# PHASE 1: WORKSPACE CREATION
# ============================================
echo ""
echo "📁 PHASE 1: Creating workspace structure..."
echo "-------------------------------------------"

NEW_WORKSPACE="/home/leviathan/OPENCODE_WORKSPACE"

# Remove any existing workspace (with confirmation)
if [ -d "$NEW_WORKSPACE" ]; then
    echo "⚠️  Workspace already exists at $NEW_WORKSPACE"
    read -p "Remove and recreate? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$NEW_WORKSPACE"
        echo "✅ Removed existing workspace"
    else
        echo "Using existing workspace..."
    fi
fi

# Create directory structure
mkdir -p "$NEW_WORKSPACE"
mkdir -p "$NEW_WORKSPACE"/{projects,agents,documentation,configs,scripts,logs,tests,models,archives,tools,migrations}
mkdir -p "$NEW_WORKSPACE/projects"/{glm,qwen,shark,vllm,opencode,deepseek,general}
mkdir -p "$NEW_WORKSPACE/configs"/{opencode,shark-agent,qwen,glm,vllm,agents}
mkdir -p "$NEW_WORKSPACE/tools"/{migrators,validators,updaters}

echo "✅ Workspace structure created"

# ============================================
# PHASE 2: FILE COPYING WITH PROJECT DETECTION
# ============================================
echo ""
echo "📄 PHASE 2: Copying files to new structure..."
echo "---------------------------------------------"

# Function to detect project type from filename
detect_project() {
    local filename=$(basename "$1" | tr '[:upper:]' '[:lower:]')
    case "$filename" in
        *glm*) echo "glm" ;;
        *qwen*) echo "qwen" ;;
        *shark*) echo "shark" ;;
        *vllm*) echo "vllm" ;;
        *opencode*) echo "opencode" ;;
        *deepseek*) echo "deepseek" ;;
        *) echo "general" ;;
    esac
}

# Copy markdown files with project detection
echo "Copying markdown files..."
for file in /home/leviathan/*.md; do
    if [ -f "$file" ]; then
        project=$(detect_project "$file")
        mkdir -p "$NEW_WORKSPACE/projects/$project/documentation"
        cp -p "$file" "$NEW_WORKSPACE/projects/$project/documentation/"
    fi
done

# Copy hidden markdown files
for file in /home/leviathan/.*.md; do
    if [ -f "$file" ] && [ "$file" != "/home/leviathan/.*.md" ]; then
        project=$(detect_project "$file")
        mkdir -p "$NEW_WORKSPACE/projects/$project/documentation"
        cp -p "$file" "$NEW_WORKSPACE/projects/$project/documentation/"
    fi
done

# Copy configuration files
echo "Copying configuration files..."
for ext in json yaml yml; do
    for file in /home/leviathan/*.$ext; do
        if [ -f "$file" ]; then
            cp -p "$file" "$NEW_WORKSPACE/configs/"
        fi
    done
done

# Copy and categorize scripts
echo "Copying and categorizing scripts..."
# Regular .sh files
for script in /home/leviathan/*.sh; do
    if [ -f "$script" ]; then
        scriptname=$(basename "$script")
        # Categorize based on name
        if [[ "$scriptname" == *migrat* || "$scriptname" == *move* || "$scriptname" == *copy* ]]; then
            cp -p "$script" "$NEW_WORKSPACE/tools/migrators/"
        elif [[ "$scriptname" == *agent* || "$scriptname" == *shark* || "$scriptname" == *opencode* ]]; then
            cp -p "$script" "$NEW_WORKSPACE/agents/"
        else
            cp -p "$script" "$NEW_WORKSPACE/scripts/"
        fi
    fi
done

# Hidden .sh files
for script in /home/leviathan/.*.sh; do
    if [ -f "$script" ] && [ "$script" != "/home/leviathan/.*.sh" ]; then
        scriptname=$(basename "$script")
        # Categorize based on name
        if [[ "$scriptname" == *migrat* || "$scriptname" == *move* || "$scriptname" == *copy* ]]; then
            cp -p "$script" "$NEW_WORKSPACE/tools/migrators/"
        elif [[ "$scriptname" == *agent* || "$scriptname" == *shark* || "$scriptname" == *opencode* ]]; then
            cp -p "$script" "$NEW_WORKSPACE/agents/"
        else
            cp -p "$script" "$NEW_WORKSPACE/scripts/"
        fi
    fi
done

# Copy Python files
echo "Copying Python files..."
for file in /home/leviathan/*.py; do
    if [ -f "$file" ]; then
        cp -p "$file" "$NEW_WORKSPACE/tests/"
    fi
done

# Copy log files
echo "Copying log files..."
for file in /home/leviathan/*.log; do
    if [ -f "$file" ]; then
        cp -p "$file" "$NEW_WORKSPACE/logs/"
    fi
done

# Copy text files
echo "Copying text files..."
for file in /home/leviathan/*.txt; do
    if [ -f "$file" ]; then
        cp -p "$file" "$NEW_WORKSPACE/documentation/"
    fi
done

# Copy configuration directories
echo "Copying configuration directories..."
cp -rp /home/leviathan/.config/opencode "$NEW_WORKSPACE/configs/opencode/"
cp -rp /home/leviathan/.shark-agent "$NEW_WORKSPACE/configs/shark-agent/"

# Handle models directory (symlink to avoid duplication)
echo "Setting up models directory..."
if [ -d "/home/leviathan/models" ]; then
    ln -sf /home/leviathan/models "$NEW_WORKSPACE/models"
    echo "✅ Created symlink to models directory"
else
    echo "⚠️  Models directory not found, creating empty directory"
    mkdir -p "$NEW_WORKSPACE/models"
fi

echo "✅ File copying complete"

# ============================================
# PHASE 3: UPDATE PATHS IN COPIED FILES
# ============================================
echo ""
echo "🔄 PHASE 3: Updating paths in new workspace..."
echo "----------------------------------------------"

# Update OpenCode configuration model path
if [ -f "$NEW_WORKSPACE/configs/opencode/opencode.json" ]; then
    echo "Updating OpenCode configuration..."
    sed -i 's|/home/leviathan/models/|/home/leviathan/OPENCODE_WORKSPACE/models/|g' \
        "$NEW_WORKSPACE/configs/opencode/opencode.json"
fi

# Update all /home/leviathan references in copied files
echo "Updating path references..."
find "$NEW_WORKSPACE" -type f \( -name "*.md" -o -name "*.json" -o -name "*.sh" -o -name "*.py" -o -name "*.txt" \) \
    -exec sed -i 's|/home/leviathan/|/home/leviathan/OPENCODE_WORKSPACE/|g' {} \; 2>/dev/null || true

# Create path mapping file
echo "Creating path mapping configuration..."
cat > "$NEW_WORKSPACE/configs/path-mapping.json" << EOF
{
  "old_base": "/home/leviathan",
  "new_base": "/home/leviathan/OPENCODE_WORKSPACE",
  "mappings": {
    "configs": {
      "old": "/home/leviathan/.config/opencode",
      "new": "/home/leviathan/OPENCODE_WORKSPACE/configs/opencode"
    },
    "shark": {
      "old": "/home/leviathan/.shark-agent",
      "new": "/home/leviathan/OPENCODE_WORKSPACE/configs/shark-agent"
    },
    "models": {
      "old": "/home/leviathan/models",
      "new": "/home/leviathan/OPENCODE_WORKSPACE/models"
    }
  },
  "timestamp": "$(date -Iseconds)"
}
EOF

echo "✅ Path updates complete"

# ============================================
# PHASE 4: CREATE MIGRATION TOOLS
# ============================================
echo ""
echo "🛠️  PHASE 4: Creating migration tools..."
echo "----------------------------------------"

# Agent Migration Assistant
echo "Creating Agent Migration Assistant..."
cat > "$NEW_WORKSPACE/tools/migrators/agent-migration-assistant.sh" << 'EOF'
#!/bin/bash
# Agent Migration Assistant
# Allows agents to migrate themselves to the new workspace

set -e

WORKSPACE="/home/leviathan/OPENCODE_WORKSPACE"
MAPPING_FILE="$WORKSPACE/configs/path-mapping.json"

echo "🔧 Agent Migration Assistant"
echo "============================"

# Load path mappings
if [ ! -f "$MAPPING_FILE" ]; then
    echo "❌ Path mapping file not found: $MAPPING_FILE"
    exit 1
fi

OLD_BASE=$(jq -r '.old_base' "$MAPPING_FILE")
NEW_BASE=$(jq -r '.new_base' "$MAPPING_FILE")

echo "Migrating from: $OLD_BASE"
echo "Migrating to:   $NEW_BASE"
echo ""

# Detect agent type
detect_agent_type() {
    if [ -f "/home/leviathan/.config/opencode/opencode.json" ]; then
        echo "opencode"
    elif [ -f "/home/leviathan/.shark-agent/config.json" ]; then
        echo "shark"
    elif ps aux | grep -q "[q]wen"; then
        echo "qwen"
    elif ps aux | grep -q "[g]lm"; then
        echo "glm"
    else
        echo "unknown"
    fi
}

AGENT_TYPE=$(detect_agent_type)
echo "Detected agent type: $AGENT_TYPE"

# Migration steps per agent type
case "$AGENT_TYPE" in
    "opencode")
        echo "📦 Migrating OpenCode agent..."
        
        # Create backup of current config
        if [ -d "/home/leviathan/.config/opencode" ]; then
            BACKUP_DIR="/home/leviathan/.config/opencode.backup.$(date +%Y%m%d-%H%M%S)"
            cp -rp "/home/leviathan/.config/opencode" "$BACKUP_DIR"
            echo "✅ Backup created: $BACKUP_DIR"
        fi
        
        # Create new config directory
        mkdir -p "/home/leviathan/.config/opencode.new"
        
        # Copy updated configuration
        cp -rp "$WORKSPACE/configs/opencode/"* "/home/leviathan/.config/opencode.new/"
        
        echo "✅ OpenCode migration prepared."
        echo ""
        echo "📋 To complete migration:"
        echo "   1. Stop OpenCode: opencode stop-all"
        echo "   2. Switch config: mv /home/leviathan/.config/opencode /home/leviathan/.config/opencode.old && mv /home/leviathan/.config/opencode.new /home/leviathan/.config/opencode"
        echo "   3. Restart: opencode start"
        echo "   4. Test: opencode status"
        echo ""
        echo "🔄 To rollback:"
        echo "   mv /home/leviathan/.config/opencode /home/leviathan/.config/opencode.new && mv /home/leviathan/.config/opencode.old /home/leviathan/.config/opencode"
        ;;
    
    "shark")
        echo "🦈 Migrating Shark Agent..."
        
        # Create backup
        if [ -d "/home/leviathan/.shark-agent" ]; then
            BACKUP_DIR="/home/leviathan/.shark-agent.backup.$(date +%Y%m%d-%H%M%S)"
            cp -rp "/home/leviathan/.shark-agent" "$BACKUP_DIR"
            echo "✅ Backup created: $BACKUP_DIR"
        fi
        
        # Create new config directory
        mkdir -p "/home/leviathan/.shark-agent.new"
        cp -rp "$WORKSPACE/configs/shark-agent/"* "/home/leviathan/.shark-agent.new/"
        
        echo "✅ Shark Agent migration prepared."
        echo ""
        echo "📋 To complete migration:"
        echo "   1. Stop Shark: shark-agent stop"
        echo "   2. Switch config: mv /home/leviathan/.shark-agent /home/leviathan/.shark-agent.old && mv /home/leviathan/.shark-agent.new /home/leviathan/.shark-agent"
        echo "   3. Restart: shark-agent start"
        echo ""
        echo "🔄 To rollback:"
        echo "   mv /home/leviathan/.shark-agent /home/leviathan/.shark-agent.new && mv /home/leviathan/.shark-agent.old /home/leviathan/.shark-agent"
        ;;
    
    *)
        echo "⚠️  Unknown or generic agent type."
        echo ""
        echo "📋 Generic migration steps:"
        echo "   1. Check new workspace: ls -la $WORKSPACE"
        echo "   2. Review your configuration files"
        echo "   3. Manually update paths using: python3 $WORKSPACE/tools/updaters/update-paths.py"
        echo "   4. Test in isolated environment first"
        ;;
esac

echo ""
echo "🎯 Migration preparation complete!"
echo "   Review the instructions above before proceeding."
EOF

chmod +x "$NEW_WORKSPACE/tools/migrators/agent-migration-assistant.sh"

# Path Update Tool
echo "Creating Path Update Tool..."
cat > "$NEW_WORKSPACE/tools/updaters/update-paths.py" << 'EOF'
#!/usr/bin/env python3
"""
Path Update Tool for Agents
Updates file references from old paths to new workspace paths
"""

import json
import os
import re
import sys
from pathlib import Path

WORKSPACE = Path("/home/leviathan/OPENCODE_WORKSPACE")
MAPPING_FILE = WORKSPACE / "configs" / "path-mapping.json"

def load_mappings():
    """Load path mappings from JSON file"""
    with open(MAPPING_FILE, 'r') as f:
        return json.load(f)

def update_file_paths(file_path, mappings):
    """Update paths in a single file"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        old_base = mappings['old_base']
        new_base = mappings['new_base']
        
        # Replace old base path with new base path
        updated = content.replace(old_base, new_base)
        
        # Apply specific mappings
        for key, mapping in mappings['mappings'].items():
            updated = updated.replace(mapping['old'], mapping['new'])
        
        if updated != content:
            with open(file_path, 'w') as f:
                f.write(updated)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main migration function"""
    print("🔄 Path Update Tool")
    print("===================")
    
    if not MAPPING_FILE.exists():
        print(f"❌ Mapping file not found: {MAPPING_FILE}")
        sys.exit(1)
    
    try:
        mappings = load_mappings()
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing mapping file: {e}")
        sys.exit(1)
    
    # Get list of files to update
    files_to_update = []
    
    if len(sys.argv) > 1:
        files_to_update = [Path(f) for f in sys.argv[1:]]
    else:
        print("⚠️  No files specified. Use: update-paths.py <file1> <file2> ...")
        print("   Or to update all files in workspace, run without arguments.")
        return
    
    updated_count = 0
    for file_path in files_to_update:
        if file_path.exists() and file_path.is_file():
            try:
                if update_file_paths(file_path, mappings):
                    print(f"✅ Updated: {file_path}")
                    updated_count += 1
                else:
                    print(f"ℹ️  No changes needed: {file_path}")
            except Exception as e:
                print(f"❌ Error updating {file_path}: {e}")
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print(f"\n🎯 Updated {updated_count} file(s)")
    print(f"New workspace: {WORKSPACE}")

if __name__ == "__main__":
    main()
EOF

chmod +x "$NEW_WORKSPACE/tools/updaters/update-paths.py"

# Workspace Validator
echo "Creating Workspace Validator..."
cat > "$NEW_WORKSPACE/tools/validators/validate-workspace.sh" << 'EOF'
#!/bin/bash
# Workspace Validation Tool
# Validates the new workspace structure and configuration

set -e

WORKSPACE="/home/leviathan/OPENCODE_WORKSPACE"
echo "🔍 Validating Workspace: $WORKSPACE"
echo "================================"

# Check if workspace exists
if [ ! -d "$WORKSPACE" ]; then
    echo "❌ Workspace not found: $WORKSPACE"
    exit 1
fi

# Check directory structure
required_dirs=(
    "projects" "agents" "documentation" "configs"
    "scripts" "logs" "tests" "models" "tools" "migrations"
)

echo "📁 Checking directory structure..."
for dir in "${required_dirs[@]}"; do
    if [ -d "$WORKSPACE/$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ❌ $dir (MISSING)"
        exit 1
    fi
done

# Check critical files
echo ""
echo "📄 Checking critical files..."
critical_files=(
    "configs/opencode/opencode.json"
    "configs/shark-agent/config.json"
    "configs/path-mapping.json"
    "tools/migrators/agent-migration-assistant.sh"
    "tools/updaters/update-paths.py"
)

for file in "${critical_files[@]}"; do
    if [ -f "$WORKSPACE/$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (MISSING)"
        exit 1
    fi
done

# Validate OpenCode configuration
echo ""
echo "⚙️  Validating OpenCode configuration..."
if command -v jq >/dev/null 2>&1; then
    if jq empty "$WORKSPACE/configs/opencode/opencode.json" 2>/dev/null; then
        echo "  ✅ OpenCode config is valid JSON"
    else
        echo "  ❌ OpenCode config has JSON errors"
        exit 1
    fi
else
    echo "  ⚠️  jq not installed, skipping JSON validation"
fi

# Check model path
echo ""
echo "🤖 Checking model references..."
if grep -q "OPENCODE_WORKSPACE/models" "$WORKSPACE/configs/opencode/opencode.json"; then
    echo "  ✅ Model paths reference new workspace"
else
    echo "  ⚠️  Model paths may reference old location"
    echo "     Run: grep 'models' $WORKSPACE/configs/opencode/opencode.json"
fi

# Check if models symlink exists
echo ""
echo "🔗 Checking models symlink..."
if [ -L "$WORKSPACE/models" ]; then
    echo "  ✅ Models directory is symlinked"
    target=$(readlink -f "$WORKSPACE/models")
    echo "     Target: $target"
else
    echo "  ⚠️  Models directory is not symlinked"
fi

# Count files in workspace
echo ""
echo "📊 Workspace Statistics:"
echo "  Total files: $(find "$WORKSPACE" -type f | wc -l)"
echo "  Projects: $(find "$WORKSPACE/projects" -type f 2>/dev/null | wc -l) files"
echo "  Documentation: $(find "$WORKSPACE/documentation" -type f 2>/dev/null | wc -l) files"
echo "  Configs: $(find "$WORKSPACE/configs" -type f 2>/dev/null | wc -l) files"
echo "  Scripts: $(find "$WORKSPACE/scripts" -type f 2>/dev/null | wc -l) files"
echo "  Tools: $(find "$WORKSPACE/tools" -type f 2>/dev/null | wc -l) files"

# Check migration tools are executable
echo ""
echo "⚡ Checking tool permissions..."
tools=(
    "tools/migrators/agent-migration-assistant.sh"
    "tools/validators/validate-workspace.sh"
    "tools/updaters/update-paths.py"
)

for tool in "${tools[@]}"; do
    if [ -x "$WORKSPACE/$tool" ]; then
        echo "  ✅ $tool (executable)"
    else
        echo "  ❌ $tool (NOT executable)"
        exit 1
    fi
done

echo ""
echo "🎯 Workspace validation PASSED!"
echo "   New workspace is ready for agent migration."
echo ""
echo "📋 Next steps:"
echo "   1. Agents can run: $WORKSPACE/tools/migrators/agent-migration-assistant.sh"
echo "   2. Validate migration: $WORKSPACE/tools/validators/validate-workspace.sh"
echo "   3. Check migration status: cat $WORKSPACE/migrations/migration-status.json"
EOF

chmod +x "$NEW_WORKSPACE/tools/validators/validate-workspace.sh"

echo "✅ Migration tools created"

# ============================================
# PHASE 5: CREATE DOCUMENTATION
# ============================================
echo ""
echo "📚 PHASE 5: Creating documentation..."
echo "-------------------------------------"

# Workspace Manifest
cat > "$NEW_WORKSPACE/WORKSPACE_MANIFEST.md" << EOF
# OpenCode Workspace Manifest
## New Architecture Foundation

### Structure Overview
\`\`\`
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
\`\`\`

### Migration Status
- **Foundation Created**: $(date)
- **Original Files**: Preserved at /home/leviathan/
- **New Architecture**: Ready at $NEW_WORKSPACE
- **Migration Phase**: Foundation ready for agent adoption

### Available Tools
1. \`agent-migration-assistant.sh\` - Interactive agent migration
2. \`update-paths.py\` - Automated path reference updates
3. \`validate-workspace.sh\` - Workspace integrity validation

### Quick Start for Agents
\`\`\`bash
# 1. Validate workspace
$NEW_WORKSPACE/tools/validators/validate-workspace.sh

# 2. Start migration
$NEW_WORKSPACE/tools/migrators/agent-migration-assistant.sh

# 3. Follow instructions provided
\`\`\`

### Path Mappings
See: \`configs/path-mapping.json\`

### Notes
- Original files preserved at original locations
- Models are symlinked to avoid duplication
- Each agent controls its own migration timing
- Rollback always possible using backups
EOF

# Agent Migration Guide
cat > "$NEW_WORKSPACE/documentation/AGENT_MIGRATION_GUIDE.md" << 'EOF'
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
EOF

# Migration Status Tracker
cat > "$NEW_WORKSPACE/migrations/migration-status.json" << EOF
{
  "workspace_created": "$(date -Iseconds)",
  "original_location": "/home/leviathan",
  "new_location": "/home/leviathan/OPENCODE_WORKSPACE",
  "migration_phase": "foundation_ready",
  "agents": {
    "opencode": {
      "status": "not_migrated",
      "original_config": "/home/leviathan/.config/opencode",
      "new_config": "/home/leviathan/OPENCODE_WORKSPACE/configs/opencode",
      "last_check": null,
      "backup_location": null
    },
    "shark": {
      "status": "not_migrated",
      "original_config": "/home/leviathan/.shark-agent",
      "new_config": "/home/leviathan/OPENCODE_WORKSPACE/configs/shark-agent",
      "last_check": null,
      "backup_location": null
    },
    "qwen": {
      "status": "not_migrated",
      "original_config": null,
      "new_config": null,
      "last_check": null,
      "backup_location": null
    },
    "glm": {
      "status": "not_migrated",
      "original_config": null,
      "new_config": null,
      "last_check": null,
      "backup_location": null
    }
  },
  "tools_available": [
    "agent-migration-assistant.sh",
    "update-paths.py",
    "validate-workspace.sh"
  ],
  "validation_status": "pending"
}
EOF

echo "✅ Documentation created"

# ============================================
# PHASE 6: FINAL VALIDATION
# ============================================
echo ""
echo "✅ PHASE 6: Final validation..."
echo "--------------------------------"

# Run validation
if [ -f "$NEW_WORKSPACE/tools/validators/validate-workspace.sh" ]; then
    bash "$NEW_WORKSPACE/tools/validators/validate-workspace.sh"
else
    echo "⚠️  Validation script not found, skipping validation"
fi

# Update migration status
if [ -f "$NEW_WORKSPACE/migrations/migration-status.json" ]; then
    # Update validation status
    temp_file=$(mktemp)
    jq '.validation_status = "completed"' "$NEW_WORKSPACE/migrations/migration-status.json" > "$temp_file"
    mv "$temp_file" "$NEW_WORKSPACE/migrations/migration-status.json"
fi

# ============================================
# COMPLETION
# ============================================
echo ""
echo "🎉 MIGRATION FOUNDATION CREATION COMPLETE!"
echo "=========================================="
echo ""
echo "✅ New workspace created: $NEW_WORKSPACE"
echo "✅ Original files preserved at: /home/leviathan/"
echo "✅ Migration tools ready in: $NEW_WORKSPACE/tools/"
echo "✅ Documentation available in: $NEW_WORKSPACE/documentation/"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Agents can now self-migrate using:"
echo "      $NEW_WORKSPACE/tools/migrators/agent-migration-assistant.sh"
echo "   2. Validate workspace:"
echo "      $NEW_WORKSPACE/tools/validators/validate-workspace.sh"
echo "   3. Check migration status:"
echo "      cat $NEW_WORKSPACE/migrations/migration-status.json"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Original files remain at /home/leviathan/"
echo "   - Each agent controls its own migration timing"
echo "   - Rollback always possible using backups"
echo ""
echo "📞 For support, check documentation in $NEW_WORKSPACE/documentation/"