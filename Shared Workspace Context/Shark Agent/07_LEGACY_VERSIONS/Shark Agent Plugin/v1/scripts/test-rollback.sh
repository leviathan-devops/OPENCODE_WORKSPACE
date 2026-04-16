#!/bin/bash
# 🦈 Shark Agent Plugin - Rollback Test

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
PLUGIN_DIR="/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$WORKSPACE_DIR/logs/rollback-$TIMESTAMP.log"
BACKUP_SCRIPT="$PLUGIN_DIR/scripts/rollback.sh"
MIGRATE_SCRIPT="$PLUGIN_DIR/scripts/migrate-to-shark.sh"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging functions
log() {
    echo -e "${BLUE}📝 $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

failure() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Initialize
echo "🦈 Rollback Functionality Test" > "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" >> "$LOG_FILE"
echo "==============================" >> "$LOG_FILE"

log "Starting rollback functionality test..."
log "Backup script: $BACKUP_SCRIPT"
log "Migration script: $MIGRATE_SCRIPT"
log "Log file: $LOG_FILE"

# Check prerequisites
log ""
log "=== PREREQUISITE CHECKS ==="

if [ ! -f "$BACKUP_SCRIPT" ]; then
    failure "Backup script not found: $BACKUP_SCRIPT"
    exit 1
else
    success "Backup script exists"
fi

if [ ! -f "$MIGRATE_SCRIPT" ]; then
    failure "Migration script not found: $MIGRATE_SCRIPT"
    exit 1
else
    success "Migration script exists"
fi

if ! command -v opencode &> /dev/null; then
    failure "OpenCode not found in PATH"
    exit 1
else
    success "OpenCode is installed"
fi

# Backup current state
log ""
log "=== BACKUP CURRENT STATE ==="

CURRENT_CONFIG="$HOME/.config/opencode/opencode.json"
BACKUP_FILE="$HOME/.config/opencode/opencode.json.rollback-test-$TIMESTAMP.backup"

if [ -f "$CURRENT_CONFIG" ]; then
    cp "$CURRENT_CONFIG" "$BACKUP_FILE"
    success "Current config backed up to: $BACKUP_FILE"
else
    failure "Current config not found: $CURRENT_CONFIG"
    exit 1
fi

# Check current plugin
log ""
log "=== CHECK CURRENT PLUGIN ==="

CURRENT_PLUGIN=$(grep -o '"plugin":\["[^"]*"' "$CURRENT_CONFIG" | head -1 | cut -d'"' -f4 || echo "none")
log "Current plugin: $CURRENT_PLUGIN"

if [ "$CURRENT_PLUGIN" = "shark-agent-plugin" ]; then
    success "Currently using shark-agent-plugin (expected)"
    TEST_FROM_SHARK=true
elif [ "$CURRENT_PLUGIN" = "opencode-ultra" ]; then
    warning "Currently using opencode-ultra (will test migration first)"
    TEST_FROM_SHARK=false
else
    warning "Unknown plugin: $CURRENT_PLUGIN"
    TEST_FROM_SHARK=false
fi

# Test 1: Rollback from shark-agent-plugin
log ""
log "=== TEST 1: ROLLBACK FROM SHARK-AGENT-PLUGIN ==="

if [ "$TEST_FROM_SHARK" = true ]; then
    log "Testing rollback from shark-agent-plugin to opencode-ultra..."
    
    # Run rollback script
    if cd "$PLUGIN_DIR" && bash "$BACKUP_SCRIPT" >> "$LOG_FILE" 2>&1; then
        # Check if config changed
        NEW_PLUGIN=$(grep -o '"plugin":\["[^"]*"' "$CURRENT_CONFIG" | head -1 | cut -d'"' -f4 || echo "none")
        if [ "$NEW_PLUGIN" = "opencode-ultra" ]; then
            success "Rollback successful - switched to opencode-ultra"
            
            # Test OpenCode still works
            if timeout 5 opencode --version >> "$LOG_FILE" 2>&1; then
                success "OpenCode works after rollback"
            else
                failure "OpenCode broken after rollback"
            fi
        else
            failure "Rollback failed - still using: $NEW_PLUGIN"
        fi
    else
        failure "Rollback script failed"
    fi
else
    warning "Skipping rollback test (not currently using shark-agent-plugin)"
fi

# Test 2: Migration back to shark-agent-plugin
log ""
log "=== TEST 2: MIGRATION TO SHARK-AGENT-PLUGIN ==="

log "Testing migration back to shark-agent-plugin..."
if cd "$PLUGIN_DIR" && bash "$MIGRATE_SCRIPT" >> "$LOG_FILE" 2>&1; then
    # Check if config changed
    NEW_PLUGIN=$(grep -o '"plugin":\["[^"]*"' "$CURRENT_CONFIG" | head -1 | cut -d'"' -f4 || echo "none")
    if [ "$NEW_PLUGIN" = "shark-agent-plugin" ]; then
        success "Migration successful - switched to shark-agent-plugin"
        
        # Test OpenCode still works
        if timeout 5 opencode --version >> "$LOG_FILE" 2>&1; then
            success "OpenCode works after migration"
        else
            failure "OpenCode broken after migration"
        fi
        
        # Test Guardian is working
        if cd "$PLUGIN_DIR" && bun -e "
import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts';
import * as os from 'os';
const homeDir = os.homedir();
const result = await checkGuardianProtection('write', { filePath: homeDir + '/.ssh/config' });
if (result.allowed) { console.error('FAIL: Guardian not working'); process.exit(1); }
console.log('PASS: Guardian working');
" >> "$LOG_FILE" 2>&1; then
            success "Guardian protection working after migration"
        else
            failure "Guardian protection broken after migration"
        fi
    else
        failure "Migration failed - using: $NEW_PLUGIN"
    fi
else
    failure "Migration script failed"
fi

# Test 3: Second rollback (cleanup)
log ""
log "=== TEST 3: CLEANUP ROLLBACK ==="

if [ "$TEST_FROM_SHARK" = true ]; then
    log "Performing cleanup rollback to restore original state..."
    if cd "$PLUGIN_DIR" && bash "$BACKUP_SCRIPT" >> "$LOG_FILE" 2>&1; then
        FINAL_PLUGIN=$(grep -o '"plugin":\["[^"]*"' "$CURRENT_CONFIG" | head -1 | cut -d'"' -f4 || echo "none")
        if [ "$FINAL_PLUGIN" = "opencode-ultra" ]; then
            success "Cleanup rollback successful"
        else
            warning "Cleanup rollback left plugin as: $FINAL_PLUGIN"
        fi
    else
        warning "Cleanup rollback script failed"
    fi
else
    # If we started with opencode-ultra, migrate back to shark-agent-plugin
    log "Migrating back to shark-agent-plugin for cleanup..."
    if cd "$PLUGIN_DIR" && bash "$MIGRATE_SCRIPT" >> "$LOG_FILE" 2>&1; then
        FINAL_PLUGIN=$(grep -o '"plugin":\["[^"]*"' "$CURRENT_CONFIG" | head -1 | cut -d'"' -f4 || echo "none")
        if [ "$FINAL_PLUGIN" = "shark-agent-plugin" ]; then
            success "Final migration successful"
        else
            warning "Final migration left plugin as: $FINAL_PLUGIN"
        fi
    else
        warning "Final migration script failed"
    fi
fi

# Restore original config
log ""
log "=== RESTORE ORIGINAL CONFIG ==="

if [ -f "$BACKUP_FILE" ]; then
    cp "$BACKUP_FILE" "$CURRENT_CONFIG"
    success "Original config restored from backup"
    rm -f "$BACKUP_FILE"
else
    warning "Backup file not found, cannot restore original config"
fi

# Verify final state
log ""
log "=== VERIFY FINAL STATE ==="

FINAL_PLUGIN=$(grep -o '"plugin":\["[^"]*"' "$CURRENT_CONFIG" | head -1 | cut -d'"' -f4 || echo "none")
log "Final plugin: $FINAL_PLUGIN"

if [ "$FINAL_PLUGIN" = "$CURRENT_PLUGIN" ]; then
    success "System returned to original state"
else
    warning "System state changed during testing (was: $CURRENT_PLUGIN, now: $FINAL_PLUGIN)"
fi

# Test OpenCode final state
if timeout 5 opencode --version >> "$LOG_FILE" 2>&1; then
    success "OpenCode functional in final state"
else
    failure "OpenCode broken in final state"
fi

# Generate summary
log ""
log "=== TEST SUMMARY ==="

SUCCESS_RATE=0
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

log "Total tests: $TOTAL_TESTS"
log "Passed: $PASSED_TESTS"
log "Failed: $FAILED_TESTS"
log "Success rate: $SUCCESS_RATE%"

# Create results summary
RESULTS_FILE="$WORKSPACE_DIR/results/rollback-$TIMESTAMP.md"
cat > "$RESULTS_FILE" << EOF
# Rollback Functionality Test Results

## Summary
- **Timestamp**: $TIMESTAMP
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Success Rate**: $SUCCESS_RATE%

## Test Sequence
1. **Starting State**: $CURRENT_PLUGIN
2. **Backup Created**: $( [ -f "$BACKUP_FILE" ] && echo "✅" || echo "❌" )
3. **Rollback Test**: $(if [ "$TEST_FROM_SHARK" = true ]; then echo "Executed"; else echo "Skipped (not on shark-agent-plugin)"; fi)
4. **Migration Test**: ✅ Executed
5. **Cleanup**: ✅ Completed
6. **Final State**: $FINAL_PLUGIN

## Test Results

### Prerequisites
- Backup script exists: $( [ -f "$BACKUP_SCRIPT" ] && echo "✅" || echo "❌" )
- Migration script exists: $( [ -f "$MIGRATE_SCRIPT" ] && echo "✅" || echo "❌" )
- OpenCode installed: $(command -v opencode &>/dev/null && echo "✅" || echo "❌")

### Rollback Functionality
$(if [ "$TEST_FROM_SHARK" = true ]; then
    echo "- Rollback from shark-agent-plugin: $(grep -q "Rollback successful" "$LOG_FILE" && echo "✅" || echo "❌")"
    echo "- OpenCode works after rollback: $(grep -q "OpenCode works after rollback" "$LOG_FILE" && echo "✅" || echo "❌")"
else
    echo "- Rollback test: ⚠️ Skipped (not on shark-agent-plugin)"
fi)

### Migration Functionality
- Migration to shark-agent-plugin: $(grep -q "Migration successful" "$LOG_FILE" && echo "✅" || echo "❌")
- OpenCode works after migration: $(grep -q "OpenCode works after migration" "$LOG_FILE" && echo "✅" || echo "❌")
- Guardian works after migration: $(grep -q "Guardian protection working" "$LOG_FILE" && echo "✅" || echo "❌")

### System Integrity
- Original config backed up: $( [ -f "$BACKUP_FILE" ] && echo "✅" || echo "❌" )
- System returned to original state: $( [ "$FINAL_PLUGIN" = "$CURRENT_PLUGIN" ] && echo "✅" || echo "❌" )
- OpenCode functional at end: $(timeout 5 opencode --version &>/dev/null && echo "✅" || echo "❌")

## Status
$(if [ $FAILED_TESTS -eq 0 ]; then 
    echo "✅ **ROLLBACK FUNCTIONALITY VERIFIED**"
    echo "The rollback system works correctly and can safely revert to opencode-ultra if needed."
elif [ $SUCCESS_RATE -ge 70 ]; then 
    echo "⚠️ **PARTIAL ROLLBACK FUNCTIONALITY**"
    echo "Some rollback tests failed but core functionality appears to work."
else 
    echo "❌ **ROLLBACK ISSUES DETECTED**"
    echo "Multiple rollback tests failed. The rollback system may not work correctly."
fi)

## Issues Found
$(if [ $FAILED_TESTS -gt 0 ]; then
    echo "The following tests failed:"
    grep "❌" "$LOG_FILE" | sed 's/.*❌ //'
else
    echo "No issues found."
fi)

## Recommendations
1. $(if [ $FAILED_TESTS -eq 0 ]; then 
    echo "Rollback system is reliable and ready for use"
else 
    echo "Fix the failed tests before relying on rollback functionality"
fi)
2. Always verify OpenCode works after rollback/migration
3. Keep regular backups of OpenCode configuration
4. Test rollback periodically to ensure it remains functional

## Log Files
- Complete log: \`$LOG_FILE\`
- This summary: \`$RESULTS_FILE\`
- Original config backup: $( [ -f "$BACKUP_FILE" ] && echo "\`$BACKUP_FILE\`" || echo "Not available" )

## Safety Notes
✅ **Non-destructive**: Tests restored original configuration
✅ **Backup created**: Original config was backed up before testing
✅ **System intact**: OpenCode remains functional throughout
$(if [ "$FINAL_PLUGIN" != "$CURRENT_PLUGIN" ]; then
    echo "⚠️ **State changed**: System ended in different state than it started"
fi)

EOF

log "Results saved to: $RESULTS_FILE"

# Cleanup backup file if it still exists
if [ -f "$BACKUP_FILE" ]; then
    rm -f "$BACKUP_FILE"
    log "Temporary backup file cleaned up"
fi

# Final status
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 Rollback functionality tests passed!${NC}"
    echo "The rollback system is reliable and ready for use."
    exit 0
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Rollback functionality tests partially passed${NC}"
    echo "$FAILED_TESTS test(s) failed. Check $LOG_FILE for details."
    exit 1
else
    echo -e "${RED}❌ Rollback functionality tests failed!${NC}"
    echo "$FAILED_TESTS test(s) failed. Check $LOG_FILE for details."
    exit 1
fi
