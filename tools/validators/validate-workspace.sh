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
    "configs/opencode/opencode/opencode.json"
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
        # Try to find the file
        found_file=$(find "$WORKSPACE" -name "$(basename "$file")" -type f | head -1)
        if [ -n "$found_file" ]; then
            echo "     Found at: $found_file"
            # Update the file variable for later use
            if [ "$(basename "$file")" = "opencode.json" ]; then
                OPENCODE_CONFIG="$found_file"
            fi
        else
            exit 1
        fi
    fi
done

# Set OPENCODE_CONFIG if not already set
if [ -z "$OPENCODE_CONFIG" ] && [ -f "$WORKSPACE/configs/opencode/opencode/opencode.json" ]; then
    OPENCODE_CONFIG="$WORKSPACE/configs/opencode/opencode/opencode.json"
fi

# Validate OpenCode configuration
echo ""
echo "⚙️  Validating OpenCode configuration..."
if [ -z "$OPENCODE_CONFIG" ]; then
    echo "  ❌ OpenCode config not found"
    exit 1
fi

if command -v jq >/dev/null 2>&1; then
    if jq empty "$OPENCODE_CONFIG" 2>/dev/null; then
        echo "  ✅ OpenCode config is valid JSON"
        echo "     Location: $OPENCODE_CONFIG"
    else
        echo "  ❌ OpenCode config has JSON errors"
        exit 1
    fi
else
    echo "  ⚠️  jq not installed, skipping JSON validation"
    echo "     Config location: $OPENCODE_CONFIG"
fi

# Check model path
echo ""
echo "🤖 Checking model references..."
if grep -q "OPENCODE_WORKSPACE/models" "$OPENCODE_CONFIG"; then
    echo "  ✅ Model paths reference new workspace"
else
    echo "  ⚠️  Model paths may reference old location"
    echo "     Run: grep 'models' $OPENCODE_CONFIG"
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
