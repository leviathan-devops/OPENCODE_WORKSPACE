# V2 File Renaming Agent - Executable Build Process

## Mission
Rename all V2 files in the Shark Frankenstein project to remove parentheses and replace with `_v2` suffix, updating all import statements and references to maintain functionality.

## Success Criteria
- All `(V2)` files renamed to `_v2` suffix (e.g., `executor(V2).ts` → `executor_v2.ts`)
- All import statements updated to reference new filenames
- All TypeScript/Node.js build commands succeed
- No broken references in the codebase

## Pre-flight Checks
1. **Verify workspace location**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein`
2. **Check git status**: Ensure clean working directory or commit changes first
3. **Backup existing files**: Create backup of original files before renaming
4. **Test build**: Run `npm run build` to ensure current state builds successfully

## Step-by-Step Execution

### Step 1: Discover All V2 Files
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
find src -name "*(V2)*" -type f > /tmp/v2-files.txt
cat /tmp/v2-files.txt
```

**Expected Output**: List of 10-15 V2 files. Verify count matches expectations.

### Step 2: Create Renaming Plan
```bash
# Generate rename mapping
while read -r old_file; do
  new_file=$(echo "$old_file" | sed 's/(V2)/_v2/g')
  echo "$old_file -> $new_file"
done < /tmp/v2-files.txt > /tmp/rename-plan.txt
cat /tmp/rename-plan.txt
```

**Verification**: Check that each mapping looks correct (e.g., `src/tools/executor(V2).ts → src/tools/executor_v2.ts`).

### Step 3: Backup Original Files
```bash
# Create backup directory with timestamp
BACKUP_DIR="/home/leviathan/OPENCODE_WORKSPACE/backups/v2-files-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src "$BACKUP_DIR/"
echo "Backup created at: $BACKUP_DIR"
```

### Step 4: Execute Renaming
```bash
# Rename files using git mv to preserve history
while read -r old_file; do
  new_file=$(echo "$old_file" | sed 's/(V2)/_v2/g')
  git mv "$old_file" "$new_file" 2>/dev/null || mv "$old_file" "$new_file"
  echo "Renamed: $old_file → $new_file"
done < /tmp/v2-files.txt
```

**Verification**: Run `find src -name "*_v2.ts"` to confirm new files exist and old files are gone.

### Step 5: Update Import Statements
This is the most critical step. Update all TypeScript/JavaScript import statements that reference V2 files.

```bash
# Create a script to update imports
cat > /tmp/update-imports.sh << 'EOF'
#!/bin/bash
# Update imports in all .ts and .js files
for file in $(find src -name "*.ts" -o -name "*.js"); do
  # Skip newly renamed _v2 files
  if [[ "$file" == *"_v2.ts" ]]; then
    continue
  fi
  
  # Update import statements
  sed -i "s/from '\.\(.*\)(V2)/from '\.\1_v2/g" "$file"
  sed -i "s/from \"\.\(.*\)(V2)/from \"\.\1_v2/g" "$file"
  sed -i "s/import '\.\(.*\)(V2)/import '\.\1_v2/g" "$file"
  sed -i "s/require('\.\(.*\)(V2)/require('\.\1_v2/g" "$file"
  sed -i "s/require(\"\.\(.*\)(V2)/require(\"\.\1_v2/g" "$file"
  
  # Update relative imports without extension
  sed -i "s/from '\(.*\)(V2)'/from '\1_v2'/g" "$file"
  sed -i "s/from \"\(.*\)(V2)\"/from \"\1_v2\"/g" "$file"
done
EOF

chmod +x /tmp/update-imports.sh
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
/tmp/update-imports.sh
```

**Verification**: Check sample files for correct imports:
```bash
grep -r "from.*(V2)" src/ && echo "❌ Found remaining (V2) imports" || echo "✅ All (V2) imports updated"
grep -r "_v2" src/ | head -5
```

### Step 6: Update Configuration Files
Check for any configuration files that reference V2 filenames:

```bash
# Check package.json, tsconfig.json, etc.
grep -r "(V2)" package.json tsconfig.json *.json 2>/dev/null || true
```

If found, update similarly.

### Step 7: Verify TypeScript Compilation
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
npm run typecheck 2>&1 | head -20
```

If there are type errors, fix them by examining the error messages. Common issues:
- Missing imports due to incorrect path
- Module resolution errors

### Step 8: Run Build Test
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
npm run build 2>&1 | tail -10
```

**Success**: Build completes without errors.

### Step 9: Run Existing Tests
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
npm test 2>&1 | tail -20
```

**Acceptable**: Tests may fail due to other issues, but should not fail due to import errors.

### Step 10: Create Git Commit
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
git add -A
git commit -m "refactor: rename V2 files with parentheses to _v2 suffix

- Renamed all (V2) files to _v2 suffix (e.g., executor(V2).ts → executor_v2.ts)
- Updated all import statements and references
- Maintains full functionality and backward compatibility
- Enables proper shell tab-completion and script compatibility"
```

## Verification Checklist
- [ ] All `(V2)` files renamed to `_v2` suffix
- [ ] No remaining `(V2)` references in import statements
- [ ] TypeScript compilation succeeds (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Git commit created with descriptive message
- [ ] Backup of original files preserved

## Error Recovery
If any step fails:
1. **Restore from backup**: `cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein && rm -rf src && cp -r "$BACKUP_DIR/src" .`
2. **Debug the issue**: Examine error messages, adjust commands
3. **Incremental approach**: Rename files one by one, verifying after each

## Completion Signal
When complete, output the following message:
```
✅ V2 FILE RENAMING COMPLETE
- Files renamed: [count]
- Build status: SUCCESS
- Commit hash: [git rev-parse HEAD]
```

## Next Agent
Proceed to **Placeholder Code Audit Agent** (02-placeholder-code-audit-agent.md)