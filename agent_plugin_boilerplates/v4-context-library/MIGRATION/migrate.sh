#!/bin/bash

# V4 Agent Factory Migration Script
# Renames the default "plugin" keyword to any custom keyword (e.g., shark, kraken, dragon)

set -e

# Default values
DEFAULT_KEYWORD="plugin"
TARGET_KEYWORD=""
DRY_RUN=false
VERBOSE=false
BACKUP=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print usage
usage() {
    echo "Usage: $0 [OPTIONS] <target-keyword>"
    echo ""
    echo "Migrate the V4 Agent Factory from default keyword '$DEFAULT_KEYWORD' to custom keyword."
    echo ""
    echo "Options:"
    echo "  -d, --dry-run      Show what would be changed without making changes"
    echo "  -v, --verbose      Show detailed output"
    echo "  -n, --no-backup    Don't create backup files"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 shark           # Migrate to 'shark' keyword"
    echo "  $0 kraken          # Migrate to 'kraken' keyword"
    echo "  $0 dragon -d       # Dry run for 'dragon' keyword"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -n|--no-backup)
            BACKUP=false
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            echo -e "${RED}Error: Unknown option $1${NC}"
            usage
            exit 1
            ;;
        *)
            if [[ -z "$TARGET_KEYWORD" ]]; then
                TARGET_KEYWORD="$1"
            else
                echo -e "${RED}Error: Multiple target keywords specified${NC}"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate target keyword
if [[ -z "$TARGET_KEYWORD" ]]; then
    echo -e "${RED}Error: Target keyword is required${NC}"
    usage
    exit 1
fi

if [[ ! "$TARGET_KEYWORD" =~ ^[a-z][a-z0-9_-]*$ ]]; then
    echo -e "${RED}Error: Target keyword must be lowercase alphanumeric with hyphens/underscores${NC}"
    exit 1
fi

if [[ "$TARGET_KEYWORD" == "$DEFAULT_KEYWORD" ]]; then
    echo -e "${YELLOW}Warning: Target keyword is same as default keyword '$DEFAULT_KEYWORD'${NC}"
    echo -e "${YELLOW}No changes needed.${NC}"
    exit 0
fi

# Print header
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}V4 Agent Factory Migration Tool${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Default keyword: ${GREEN}$DEFAULT_KEYWORD${NC}"
echo -e "Target keyword:  ${GREEN}$TARGET_KEYWORD${NC}"
echo -e "Dry run:         ${GREEN}$DRY_RUN${NC}"
echo -e "Backup:          ${GREEN}$BACKUP${NC}"
echo -e "Verbose:         ${GREEN}$VERBOSE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print verbose output
log_verbose() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${YELLOW}[VERBOSE] $*${NC}"
    fi
}

# Function to create backup
create_backup() {
    local file="$1"
    if [[ "$BACKUP" == true ]]; then
        local backup_file="${file}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$file" "$backup_file"
        log_verbose "Created backup: $backup_file"
    fi
}

# Function to replace in file
replace_in_file() {
    local file="$1"
    local pattern="$2"
    local replacement="$3"
    
    if [[ ! -f "$file" ]]; then
        log_verbose "File not found: $file"
        return
    fi
    
    if grep -q "$pattern" "$file"; then
        log_verbose "Found pattern in: $file"
        
        if [[ "$DRY_RUN" == false ]]; then
            create_backup "$file"
            sed -i "s/$pattern/$replacement/g" "$file"
            echo -e "${GREEN}Updated: $file${NC}"
        else
            echo -e "${YELLOW}[DRY RUN] Would update: $file${NC}"
        fi
    fi
}

# Function to rename file
rename_file() {
    local old_file="$1"
    local new_file="$2"
    
    if [[ ! -f "$old_file" ]]; then
        log_verbose "File not found: $old_file"
        return
    fi
    
    if [[ "$DRY_RUN" == false ]]; then
        create_backup "$old_file"
        mv "$old_file" "$new_file"
        echo -e "${GREEN}Renamed: $old_file -> $new_file${NC}"
    else
        echo -e "${YELLOW}[DRY RUN] Would rename: $old_file -> $new_file${NC}"
    fi
}

# Start migration
echo -e "${BLUE}Starting migration...${NC}"
echo ""

# 1. Update file contents
echo -e "${BLUE}Step 1: Updating file contents...${NC}"

# Pattern replacements
patterns=(
    "\\b$DEFAULT_KEYWORD\\b"
    "\\b${DEFAULT_KEYWORD^}\\b"
    "\\b${DEFAULT_KEYWORD^^}\\b"
    "\\b$DEFAULT_KEYWORD-"
    "\\b$DEFAULT_KEYWORD_"
)

replacements=(
    "$TARGET_KEYWORD"
    "${TARGET_KEYWORD^}"
    "${TARGET_KEYWORD^^}"
    "$TARGET_KEYWORD-"
    "$TARGET_KEYWORD_"
)

# Find all relevant files
files_to_update=$(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.txt" -o -name "*.sh" \) ! -path "./node_modules/*" ! -path "./.git/*")

for file in $files_to_update; do
    for i in "${!patterns[@]}"; do
        replace_in_file "$file" "${patterns[$i]}" "${replacements[$i]}"
    done
done

echo ""

# 2. Rename files and directories
echo -e "${BLUE}Step 2: Renaming files and directories...${NC}"

# Find files and directories with default keyword
items_to_rename=$(find . -name "*$DEFAULT_KEYWORD*" ! -path "./node_modules/*" ! -path "./.git/*" | sort -r)  # Sort reverse for depth-first

for item in $items_to_rename; do
    if [[ -e "$item" ]]; then
        new_item=$(echo "$item" | sed "s/$DEFAULT_KEYWORD/$TARGET_KEYWORD/g")
        
        if [[ "$item" != "$new_item" ]]; then
            rename_file "$item" "$new_item"
        fi
    fi
done

echo ""

# 3. Update package.json if it exists
if [[ -f "package.json" ]]; then
    echo -e "${BLUE}Step 3: Updating package.json...${NC}"
    
    # Update name field
    if grep -q "\"name\":.*$DEFAULT_KEYWORD" package.json; then
        replace_in_file "package.json" "\"name\":.*$DEFAULT_KEYWORD" "\"name\": \"$TARGET_KEYWORD-agent-factory\""
    fi
    
    # Update description
    if grep -q "$DEFAULT_KEYWORD" package.json; then
        replace_in_file "package.json" "$DEFAULT_KEYWORD" "$TARGET_KEYWORD"
    fi
fi

echo ""

# 4. Create migration summary
echo -e "${BLUE}Step 4: Creating migration summary...${NC}"

MIGRATION_SUMMARY="MIGRATION_SUMMARY_$(date +%Y%m%d_%H%M%S).md"

cat > "$MIGRATION_SUMMARY" << EOF
# V4 Agent Factory Migration Summary

## Migration Details
- **Date**: $(date)
- **From keyword**: $DEFAULT_KEYWORD
- **To keyword**: $TARGET_KEYWORD
- **Dry run**: $DRY_RUN
- **Backup created**: $BACKUP

## Changes Made

### 1. File Content Updates
The following patterns were replaced in all source files:

| Pattern | Replacement |
|---------|-------------|
| \`$DEFAULT_KEYWORD\` | \`$TARGET_KEYWORD\` |
| \`${DEFAULT_KEYWORD^}\` | \`${TARGET_KEYWORD^}\` |
| \`${DEFAULT_KEYWORD^^}\` | \`${TARGET_KEYWORD^^}\` |
| \`$DEFAULT_KEYWORD-\` | \`$TARGET_KEYWORD-\` |
| \`$DEFAULT_KEYWORD_\` | \`$TARGET_KEYWORD_\` |

### 2. File Renames
All files and directories containing "$DEFAULT_KEYWORD" in their names were renamed to use "$TARGET_KEYWORD".

### 3. Configuration Updates
- package.json name and description updated
- Configuration files updated with new keyword

## Next Steps

1. **Review changes**: Check that all replacements are correct
2. **Test the system**: Run tests to ensure everything works
3. **Update documentation**: Review and update any remaining references
4. **Commit changes**: Commit the migrated codebase

## Verification Checklist

- [ ] All source files compile without errors
- [ ] Tests pass with new keyword
- [ ] Configuration files reference correct keyword
- [ ] Documentation is updated
- [ ] Examples work with new keyword

## Notes
$(if [[ "$DRY_RUN" == true ]]; then echo "- This was a dry run. No actual changes were made."; fi)
$(if [[ "$BACKUP" == true ]]; then echo "- Backup files were created with .backup timestamp extension."; fi)

EOF

echo -e "${GREEN}Created migration summary: $MIGRATION_SUMMARY${NC}"
echo ""

# 5. Final instructions
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Migration completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the migration summary: $MIGRATION_SUMMARY"
echo "2. Run tests to verify everything works:"
echo "   npm test  # or your test command"
echo "3. Check for any remaining references to '$DEFAULT_KEYWORD':"
echo "   grep -r '$DEFAULT_KEYWORD' . --exclude-dir=node_modules --exclude-dir=.git"
echo "4. Update any documentation or configuration files as needed"
echo ""

if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}Note: This was a dry run. No actual changes were made.${NC}"
    echo "To apply changes, run without the -d flag:"
    echo "  $0 $TARGET_KEYWORD"
fi

echo -e "${BLUE}========================================${NC}"