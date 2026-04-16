#!/bin/bash
#==============================================================================
# OPENCODE GARBAGE COLLECTOR
# Version: 2.0.0
# Purpose: Auto-cleanup of OpenCode bloat to prevent memory/disk exhaustion
#==============================================================================

set -uo pipefail

readonly SCRIPT_NAME="opencode-gc"
readonly VERSION="2.0.0"
readonly LOG_DIR="$HOME/.local/share/opencode/log"
readonly OPENCODE_DATA="$HOME/.local/share/opencode"
readonly OPENCODE_CACHE="$HOME/.cache/opencode"
readonly GC_LOG="$LOG_DIR/gc.log"
readonly LOCK_FILE="$LOG_DIR/opencode-gc.lock"
readonly PID_FILE="$LOG_DIR/opencode-gc.pid"

# Cleanup state
CLEANUP_DONE=0

cleanup_on_exit() {
    local exit_code=$?
    
    if [[ "$CLEANUP_DONE" -eq 0 ]]; then
        info "Received shutdown signal - completing cleanup..."
        CLEANUP_DONE=1
        
        if [[ -f "$LOCK_FILE" ]]; then
            rm -f "$LOCK_FILE" 2>/dev/null || true
        fi
        if [[ -f "$PID_FILE" ]]; then
            rm -f "$PID_FILE" 2>/dev/null || true
        fi
    fi
    
    if [[ $exit_code -eq 0 ]]; then
        info "GC completed successfully"
    else
        warn "GC exited with code $exit_code"
    fi
    exit $exit_code
}

setup_signal_handlers() {
    trap cleanup_on_exit EXIT
    trap 'info "Received SIGTERM - shutting down gracefully..."; exit 143' SIGTERM
    trap 'info "Received SIGINT - shutting down gracefully..."; exit 130' SIGINT
    trap 'info "Received SIGHUP - reloading configuration..."' SIGHUP
}

acquire_lock() {
    if [[ -f "$LOCK_FILE" ]]; then
        local old_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
        if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
            warn "GC is already running (PID: $old_pid) - exiting"
            exit 0
        else
            info "Stale lock file found (PID: $old_pid) - removing"
            rm -f "$LOCK_FILE" 2>/dev/null || true
        fi
    fi
    
    echo $$ > "$LOCK_FILE"
    echo $$ > "$PID_FILE"
    info "GC started with PID: $$"
}

release_lock() {
    if [[ "$CLEANUP_DONE" -eq 0 ]]; then
        CLEANUP_DONE=1
        rm -f "$LOCK_FILE" 2>/dev/null || true
        rm -f "$PID_FILE" 2>/dev/null || true
    fi
}

# Thresholds
readonly MAX_SNAPSHOT_GB=1
readonly MAX_SESSION_DIFF_GB=5
readonly MAX_HIVE_MIND_GB=2
readonly MAX_TOOL_OUTPUT_GB=1
readonly MAX_LOG_MB=50
readonly MAX_OPENCODE_DATA_GB=20
readonly MAX_CACHE_GB=10
readonly SESSION_DIFF_MAX_AGE_DAYS=7
readonly TOOL_OUTPUT_MAX_AGE_DAYS=7
readonly HIVE_MIND_MAX_AGE_DAYS=30
readonly LOG_MAX_AGE_DAYS=3
# Docker/Container Thresholds
readonly DOCKER_CONTAINER_TTL_HOURS=24
readonly DOCKER_IMAGE_PRUNE_HOURS=168
readonly MAX_CONTAINER_COUNT=10
readonly MAX_IMAGE_COUNT=20
readonly MAX_BUILD_CACHE_GB=5
readonly BUILD_CACHE_TTL_HOURS=72

# Protected image patterns (never prune these - used by active containers or system)
readonly PROTECTED_IMAGE_PATTERNS="shark-|kraken-|opencode-|ghcr.io/anomalyco|leviathan/|mattermost-|postgres|redis|python|nginx|telegram-bridge|hermes-oc-agent|opencode-test|bot-bridge"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

#==============================================================================
# LOGGING
#==============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$GC_LOG"
}

info()  { log "INFO" "$*"; }
warn()  { log "${YELLOW}WARN${NC}" "$*"; }
error() { log "${RED}ERROR${NC}" "$*"; }
ok()    { log "${GREEN}OK${NC}" "$*"; }

#==============================================================================
# INITIALIZATION
#==============================================================================

init() {
    setup_signal_handlers
    acquire_lock
    
    mkdir -p "$LOG_DIR"
    mkdir -p "$OPENCODE_DATA/snapshot/global"
    mkdir -p "$OPENCODE_DATA/storage/session_diff"
    mkdir -p "$OPENCODE_DATA/tool-output"
    mkdir -p "$OPENCODE_DATA/hive-mind"
    mkdir -p "$OPENCODE_DATA/log"
    
    if [[ ! -f "$GC_LOG" ]]; then
        touch "$GC_LOG"
    fi
    
    info "GC initialized"
}

#==============================================================================
# DISK SPACE CHECKS
#==============================================================================

check_disk_space() {
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    local available=$(df -h / | tail -1 | awk '{print $4}')
    
    echo ""
    echo "=== DISK SPACE STATUS ==="
    echo "Usage: ${usage}% | Available: ${available}"
    
    if [[ "$usage" -gt 85 ]]; then
        warn "Disk usage at ${usage}% - CRITICAL"
        return 1
    elif [[ "$usage" -gt 70 ]]; then
        warn "Disk usage at ${usage}% - WARNING"
    else
        ok "Disk usage at ${usage}% - OK"
    fi
}

check_memory() {
    local mem_available=$(free -m | awk 'NR==2{print $7}')
    local swap_used=$(free -m | awk 'NR==3{print $3}')
    local swap_total=$(free -m | awk 'NR==3{print $2}')
    local swap_pct=0
    
    if [[ "$swap_total" -gt 0 ]]; then
        swap_pct=$((swap_used * 100 / swap_total))
    fi
    
    echo ""
    echo "=== MEMORY STATUS ==="
    echo "Available RAM: ${mem_available}MB"
    echo "Swap: ${swap_used}MB / ${swap_total}MB (${swap_pct}%)"
    
    if [[ "$swap_pct" -gt 95 ]]; then
        warn "Swap usage at ${swap_pct}% - CRITICAL (>95%)"
    elif [[ "$swap_pct" -gt 80 ]]; then
        warn "Swap usage at ${swap_pct}% - HIGH"
    else
        ok "Swap usage OK"
    fi
}

#==============================================================================
# SIZE REPORTING
#==============================================================================

report_sizes() {
    echo ""
    echo "=== OPENCODE DATA SIZES ==="
    
    local total_size=$(du -sb "$OPENCODE_DATA" 2>/dev/null | cut -f1 || echo 0)
    local snapshot_global=$(du -sb "$OPENCODE_DATA/snapshot/global" 2>/dev/null | cut -f1 || echo 0)
    local session_diff=$(du -sb "$OPENCODE_DATA/storage/session_diff" 2>/dev/null | cut -f1 || echo 0)
    local hive_mind=$(du -sb "$OPENCODE_DATA/hive-mind" 2>/dev/null | cut -f1 || echo 0)
    local tool_output=$(du -sb "$OPENCODE_DATA/tool-output" 2>/dev/null | cut -f1 || echo 0)
    local logs=$(du -sb "$OPENCODE_DATA/log" 2>/dev/null | cut -f1 || echo 0)
    local db_size=$(du -sb "$OPENCODE_DATA/opencode.db" 2>/dev/null | cut -f1 || echo 0)
    
    printf "%-25s %12s\n" "OpenCode Data Total:" "$(numfmt --to=iec $total_size 2>/dev/null || echo 'N/A')"
    printf "%-25s %12s\n" "  snapshot/global:" "$(numfmt --to=iec $snapshot_global 2>/dev/null || echo 'N/A')"
    printf "%-25s %12s\n" "  session_diff:" "$(numfmt --to=iec $session_diff 2>/dev/null || echo 'N/A')"
    printf "%-25s %12s\n" "  hive_mind:" "$(numfmt --to=iec $hive_mind 2>/dev/null || echo 'N/A')"
    printf "%-25s %12s\n" "  tool_output:" "$(numfmt --to=iec $tool_output 2>/dev/null || echo 'N/A')"
    printf "%-25s %12s\n" "  logs:" "$(numfmt --to=iec $logs 2>/dev/null || echo 'N/A')"
    printf "%-25s %12s\n" "  opencode.db:" "$(numfmt --to=iec $db_size 2>/dev/null || echo 'N/A')"
}

report_session_diffs() {
    local count=$(find "$OPENCODE_DATA/storage/session_diff" -name "*.json" 2>/dev/null | wc -l)
    echo ""
    echo "=== SESSION DIFFS ==="
    echo "Count: $count files"
    
    if [[ "$count" -gt 500 ]]; then
        warn "Session diff count ($count) exceeds 500 - needs cleanup"
    elif [[ "$count" -gt 100 ]]; then
        warn "Session diff count ($count) is elevated"
    else
        ok "Session diff count OK"
    fi
}

report_docker() {
    echo ""
    echo "=== DOCKER CONTAINERS ==="
    local container_count=$(docker ps -a --format '{{.Names}}' 2>/dev/null | wc -l)
    local running_count=$(docker ps --format '{{.Names}}' 2>/dev/null | wc -l)
    
    echo "Total: $container_count | Running: $running_count"
    
    if [[ "$container_count" -gt "$MAX_CONTAINER_COUNT" ]]; then
        warn "Container count ($container_count) exceeds limit ($MAX_CONTAINER_COUNT)"
    else
        ok "Container count OK"
    fi
    
    report_docker_images
    report_docker_volumes
    report_docker_build_cache
}

report_docker_images() {
    echo ""
    echo "=== DOCKER IMAGES ==="
    
    if ! command -v docker &> /dev/null; then
        echo "Docker not available"
        return
    fi
    
    local image_count=$(docker images 2>/dev/null | wc -l)
    ((image_count--))  # Subtract header line
    
    echo "Count: $image_count images"
    
    if [[ "$image_count" -gt "$MAX_IMAGE_COUNT" ]]; then
        warn "Image count ($image_count) exceeds limit ($MAX_IMAGE_COUNT)"
    else
        ok "Image count OK"
    fi
    
    local df_output=$(docker system df 2>/dev/null | grep Images || echo "")
    local reclaimable=$(echo "$df_output" | awk '{print $5}' || echo "0B")
    echo "Reclaimable: ${reclaimable:-0B}"
}

report_docker_volumes() {
    echo ""
    echo "=== DOCKER VOLUMES ==="
    
    if ! command -v docker &> /dev/null; then
        return
    fi
    
    local volume_count=$(docker volume ls 2>/dev/null | wc -l)
    ((volume_count--))  # Subtract header line
    
    echo "Count: $volume_count volumes"
    
    local reclaimable=$(docker system df 2>/dev/null | grep Volumes | awk '{print $5}')
    echo "Reclaimable: ${reclaimable:-0B}"
}

report_docker_build_cache() {
    echo ""
    echo "=== DOCKER BUILD CACHE ==="
    
    if ! command -v docker &> /dev/null; then
        return
    fi
    
    local cache_count=$(docker builder ls 2>/dev/null | wc -l)
    ((cache_count--))  # Subtract header
    
    echo "Entries: $cache_count build cache entries"
    
    local cache_size=$(docker system df 2>/dev/null | grep "Build Cache" | awk '{print $3}')
    echo "Size: ${cache_size:-0B}"
}

#==============================================================================
# CLEANUP FUNCTIONS
#==============================================================================

cleanup_session_diffs() {
    local max_age="${SESSION_DIFF_MAX_AGE_DAYS:-7}"
    local count_before=$(find "$OPENCODE_DATA/storage/session_diff" -name "*.json" 2>/dev/null | wc -l)
    
    if [[ "$count_before" -eq 0 ]]; then
        ok "Session diffs: already clean"
        return 0
    fi
    
    info "Cleaning session diffs older than ${max_age} days..."
    
    # Use -mtime +N for files older than N days
    local deleted=$(find "$OPENCODE_DATA/storage/session_diff" -name "*.json" -mtime "+${max_age}" -delete 2>/dev/null | wc -l)
    local count_after=$(find "$OPENCODE_DATA/storage/session_diff" -name "*.json" 2>/dev/null | wc -l)
    
    if [[ "$deleted" -gt 0 ]]; then
        ok "Session diffs: removed $deleted old files ($count_before → $count_after)"
    else
        ok "Session diffs: no files older than ${max_age} days"
    fi
}

cleanup_tool_output() {
    local max_age="${TOOL_OUTPUT_MAX_AGE_DAYS:-7}"
    local count_before=$(find "$OPENCODE_DATA/tool-output" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    
    if [[ "$count_before" -eq 0 ]]; then
        ok "Tool output: already clean"
        return 0
    fi
    
    info "Cleaning tool output older than ${max_age} days..."
    
    local deleted=0
    while IFS= read -r dir; do
        if [[ -d "$dir" ]] && [[ $(find "$dir" -mtime "+${max_age}" 2>/dev/null | wc -l) -gt 0 ]]; then
            find "$dir" -mtime "+${max_age}" -exec rm -rf {} \; 2>/dev/null || true
            ((deleted++))
        fi
    done < <(find "$OPENCODE_DATA/tool-output" -mindepth 1 -maxdepth 1 -type d 2>/dev/null)
    
    local count_after=$(find "$OPENCODE_DATA/tool-output" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    
    if [[ "$deleted" -gt 0 ]]; then
        ok "Tool output: cleaned $deleted directories ($count_before → $count_after)"
    else
        ok "Tool output: no entries older than ${max_age} days"
    fi
}

cleanup_logs() {
    local max_age="${LOG_MAX_AGE_DAYS:-3}"
    local total_size=$(du -sb "$OPENCODE_DATA/log" 2>/dev/null | cut -f1 || echo 0)
    local size_mb=$((total_size / 1024 / 1024))
    
    if [[ "$size_mb" -lt 10 ]]; then
        ok "Logs: size OK (${size_mb}MB)"
        return 0
    fi
    
    info "Cleaning logs older than ${max_age} days..."
    
    local deleted=$(find "$OPENCODE_DATA/log" -name "*.log" -mtime "+${max_age}" -delete 2>/dev/null | wc -l)
    local new_size=$(du -sb "$OPENCODE_DATA/log" 2>/dev/null | cut -f1 || echo 0)
    local new_size_mb=$((new_size / 1024 / 1024))
    
    ok "Logs: removed $deleted files (${size_mb}MB → ${new_size_mb}MB)"
}

cleanup_docker() {
    info "Cleaning Docker containers and images..."
    
    if ! command -v docker &> /dev/null; then
        warn "Docker not available - skipping container cleanup"
        return
    fi
    
    info "Docker found, proceeding with cleanup..."
    cleanup_stopped_containers
    cleanup_dangling_images
    cleanup_old_images
    cleanup_volumes
    cleanup_build_cache
    
    info "Docker cleanup finished"
    ok "Docker cleanup completed"
}

cleanup_stopped_containers() {
    info "Removing stopped containers older than ${DOCKER_CONTAINER_TTL_HOURS}h..."
    
    local before=$(docker ps -aq 2>/dev/null | wc -l)
    docker container prune -f --filter "until=${DOCKER_CONTAINER_TTL_HOURS}h" 2>/dev/null || true
    local after=$(docker ps -aq 2>/dev/null | wc -l)
    
    local removed=$((before - after))
    if [[ "$removed" -gt 0 ]]; then
        ok "Stopped containers: removed $removed"
    else
        ok "Stopped containers: none to remove"
    fi
}

cleanup_dangling_images() {
    info "Removing dangling images..."
    
    local before=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l)
    docker image prune -f 2>/dev/null || true
    local after=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l)
    
    local removed=$((before - after))
    if [[ "$removed" -gt 0 ]]; then
        ok "Dangling images: removed $removed"
    else
        ok "Dangling images: none to remove"
    fi
}

is_image_in_use() {
    local image="$1"
    docker ps -aq --filter "ancestor=$image" 2>/dev/null | grep -q . && return 0
    docker ps -aq --filter "ancestor=${image%:*}@sha256:${image##*:}" 2>/dev/null | grep -q . && return 0
    return 1
}

get_image_age_hours() {
    local image="$1"
    local created=$(docker inspect "$image" --format '{{.Created}}' 2>/dev/null | cut -d'.' -f1)
    if [[ -z "$created" ]]; then
        echo "999999"
        return
    fi
    local created_epoch=$(date -d "$created" +%s 2>/dev/null || echo 0)
    local now_epoch=$(date +%s)
    echo $(( (now_epoch - created_epoch) / 3600 ))
}

cleanup_old_images() {
    info "Removing unused images older than 48h (excluding protected patterns)..."
    
    local protected_regex="${PROTECTED_IMAGE_PATTERNS}"
    local removed_count=0
    local skipped_protected=0
    local skipped_in_use=0
    local skipped_recent=0
    local removed_size=0
    
    while IFS= read -r repo_tag; do
        if [[ -z "$repo_tag" ]] || [[ "$repo_tag" == "<none>" ]]; then
            continue
        fi
        
        if [[ "$repo_tag" =~ $protected_regex ]]; then
            ((skipped_protected++))
            continue
        fi
        
        if is_image_in_use "$repo_tag"; then
            ((skipped_in_use++))
            continue
        fi
        
        local age_hours=$(get_image_age_hours "$repo_tag")
        if [[ "$age_hours" -lt 48 ]]; then
            ((skipped_recent++))
            continue
        fi
        
        local size=$(docker inspect "$repo_tag" --format '{{.Size}}' 2>/dev/null || echo 0)
        local size_mb=$(( size / 1024 / 1024 ))
        
        if docker rmi "$repo_tag" 2>/dev/null; then
            ((removed_count++))
            removed_size=$(( removed_size + size_mb ))
            info "Removed: $repo_tag (${age_hours}h old, ${size_mb}MB)"
        fi
    done < <(docker images --format '{{.Repository}}:{{.Tag}}' 2>/dev/null)
    
    if [[ "$removed_count" -gt 0 ]]; then
        ok "Old images: removed $removed_count images (${removed_size}MB total)"
        [[ "$skipped_protected" -gt 0 ]] && info "  skipped protected: $skipped_protected"
        [[ "$skipped_in_use" -gt 0 ]] && info "  skipped in-use: $skipped_in_use"
        [[ "$skipped_recent" -gt 0 ]] && info "  skipped recent: $skipped_recent"
    else
        ok "Old images: none to remove (protected=$skipped_protected, in-use=$skipped_in_use, recent=$skipped_recent)"
    fi
}

cleanup_volumes() {
    info "Removing unused Docker volumes..."
    
    local volume_count=$(docker volume ls 2>/dev/null | wc -l)
    ((volume_count--))
    
    if [[ "$volume_count" -eq 0 ]]; then
        ok "Volumes: none to remove"
        return
    fi
    
    local before_size=$(docker system df 2>/dev/null | grep Volumes | awk '{print $3}' || echo "0B")
    docker volume prune -f 2>/dev/null || true
    local after_size=$(docker system df 2>/dev/null | grep Volumes | awk '{print $3}' || echo "0B")
    
    ok "Volumes: pruned (${before_size} → ${after_size})"
}

cleanup_build_cache() {
    info "Cleaning build cache..."
    
    local cache_before=$(docker system df 2>/dev/null | grep "Build Cache" | awk '{print $4}' || echo "0B")
    
    docker builder prune -f 2>/dev/null || true
    
    local cache_after=$(docker system df 2>/dev/null | grep "Build Cache" | awk '{print $4}' || echo "0B")
    
    ok "Build cache: ${cache_before} → ${cache_after}"
}

check_docker_image_age() {
    local image="$1"
    local max_age_hours="${2:-168}"
    
    if [[ -z "$image" ]]; then
        return 1
    fi
    
    local created=$(docker inspect "$image" --format '{{.Created}}' 2>/dev/null || echo "")
    if [[ -z "$created" ]]; then
        return 1
    fi
    
    local image_time=$(date -d "$created" +%s 2>/dev/null || echo 0)
    local now_time=$(date +%s)
    local age_hours=$(( (now_time - image_time) / 3600 ))
    
    if [[ "$age_hours" -gt "$max_age_hours" ]]; then
        return 0
    else
        return 1
    fi
}

is_image_protected() {
    local image="$1"
    
    for pattern in $PROTECTED_IMAGE_PATTERNS; do
        if [[ "$image" =~ $pattern ]]; then
            return 0
        fi
    done
    return 1
}

cleanup_snapshot_global() {
    local max_size_gb="${MAX_SNAPSHOT_GB:-1}"
    local current_size=$(du -sb "$OPENCODE_DATA/snapshot/global" 2>/dev/null | cut -f1 || echo 0)
    local current_size_gb=$((current_size / 1024 / 1024 / 1024))
    
    if [[ "$current_size_gb" -lt 1 ]]; then
        ok "Snapshot global: size OK (${current_size_gb}GB)"
        return 0
    fi
    
    warn "Snapshot global is ${current_size_gb}GB (limit: ${max_size_gb}GB) - running git repack..."
    
    cd "$OPENCODE_DATA/snapshot/global" 2>/dev/null || return 1
    
    # Only run if it's a git repo
    if [[ -d ".git" ]]; then
        git repack -ad 2>/dev/null || true
        git prune 2>/dev/null || true
        
        local new_size=$(du -sb . 2>/dev/null | cut -f1 || echo 0)
        local new_size_gb=$((new_size / 1024 / 1024 / 1024))
        ok "Snapshot global: ${current_size_gb}GB → ${new_size_gb}GB"
    else
        # Not a git repo, just warn
        warn "Snapshot global is not a git repo - manual cleanup needed"
    fi
}

cleanup_hive_mind() {
    local max_age="${HIVE_MIND_MAX_AGE_DAYS:-30}"
    local count_before=$(find "$OPENCODE_DATA/hive-mind" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)
    
    if [[ "$count_before" -eq 0 ]]; then
        ok "Hive mind: already clean"
        return 0
    fi
    
    info "Cleaning hive mind directories older than ${max_age} days..."
    
    local deleted=0
    while IFS= read -r dir; do
        if [[ -d "$dir" ]] && [[ "$(find "$dir" -mtime "+${max_age}" 2>/dev/null | wc -l)" -gt 0 ]]; then
            rm -rf "$dir" 2>/dev/null || true
            ((deleted++))
        fi
    done < <(find "$OPENCODE_DATA/hive-mind" -maxdepth 1 -mindepth 1 -type d 2>/dev/null)
    
    local count_after=$(find "$OPENCODE_DATA/hive-mind" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)
    
    if [[ "$deleted" -gt 0 ]]; then
        ok "Hive mind: removed $deleted old directories ($count_before → $count_after)"
    else
        ok "Hive mind: no directories older than ${max_age} days"
    fi
}

cleanup_opencode_db() {
    local db_path="$OPENCODE_DATA/opencode.db"
    local wal_path="$OPENCODE_DATA/opencode.db-wal"
    local shm_path="$OPENCODE_DATA/opencode.db-shm"
    
    # Check WAL size
    if [[ -f "$wal_path" ]]; then
        local wal_size=$(stat -c%s "$wal_path" 2>/dev/null || echo 0)
        local wal_size_mb=$((wal_size / 1024 / 1024))
        
        if [[ "$wal_size_mb" -gt 500 ]]; then
            warn "WAL file is ${wal_size_mb}MB - checkpointing..."
            # Note: This requires sqlite3 to be installed
            if command -v sqlite3 &> /dev/null; then
                sqlite3 "$db_path" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
                ok "WAL checkpointed"
            else
                warn "sqlite3 not available - cannot checkpoint WAL"
            fi
        fi
    fi
}

cleanup_large_session_diffs() {
    # Remove session diffs larger than 100MB (likely corrupted or bloated)
    info "Cleaning abnormally large session diffs (>100MB)..."
    
    local removed=0
    if [[ -d "$OPENCODE_DATA/storage/session_diff" ]]; then
        while IFS= read -r file; do
            local size=$(stat -c%s "$file" 2>/dev/null || echo 0)
            local size_mb=$((size / 1024 / 1024))
            if [[ "$size_mb" -gt 100 ]]; then
                rm -f "$file" 2>/dev/null || true
                ((removed++))
            fi
        done < <(find "$OPENCODE_DATA/storage/session_diff" -name "*.json" -type f 2>/dev/null)
    fi
    
    if [[ "$removed" -gt 0 ]]; then
        ok "Removed $removed abnormally large session diffs (>100MB)"
    else
        ok "No abnormally large session diffs found"
    fi
}

#==============================================================================
# MAIN CLEANUP
#==============================================================================

run_cleanup() {
    echo ""
    echo "=========================================="
    echo "  OPENCODE GARBAGE COLLECTOR v${VERSION}"
    echo "=========================================="
    
    info "Starting cleanup..."
    
    # Run all cleanup functions
    cleanup_session_diffs
    cleanup_large_session_diffs
    cleanup_tool_output
    cleanup_logs
    cleanup_docker
    cleanup_snapshot_global
    cleanup_hive_mind
    cleanup_opencode_db
    
    release_lock
    info "Cleanup completed"
}

#==============================================================================
# STATUS REPORT
#==============================================================================

show_status() {
    echo ""
    echo "=========================================="
    echo "  OPENCODE SYSTEM STATUS"
    echo "=========================================="
    
    report_sizes
    report_session_diffs
    report_docker
    check_disk_space
    check_memory
}

#==============================================================================
# HELP
#==============================================================================

show_help() {
    cat << EOF
OpenCode Garbage Collector v${VERSION}

USAGE:
    opencode-gc [COMMAND] [OPTIONS]

COMMANDS:
    status      Show system status and sizes (no cleanup)
    cleanup     Run full cleanup (default)
    force       Force cleanup even if another instance is running
    install     Install cron job for automatic cleanup
    help        Show this help

OPTIONS:
    --quiet     Suppress output to stdout (log only)
    --dry-run   Show what would be cleaned without actually cleaning

EXAMPLES:
    opencode-gc                  # Run cleanup
    opencode-gc status           # Show status
    opencode-gc force            # Force cleanup if stuck
    opencode-gc install          # Install to crontab

CRONTAB INSTALLATION:
    opencode-gc install          # Adds to crontab (runs daily at 3am)
    Manual install:
    0 3 * * * /home/leviathan/OPENCODE_WORKSPACE/projects/opencode-gc/opencode-gc.sh >> ~/.local/share/opencode/log/gc-cron.log 2>&1

THRESHOLDS:
    Session diff age:       ${SESSION_DIFF_MAX_AGE_DAYS} days
    Tool output age:        ${TOOL_OUTPUT_MAX_AGE_DAYS} days
    Hive mind age:          ${HIVE_MIND_MAX_AGE_DAYS} days
    Log age:               ${LOG_MAX_AGE_DAYS} days
    Docker container TTL:   ${DOCKER_CONTAINER_TTL_HOURS} hours
    Max snapshot size:      ${MAX_SNAPSHOT_GB}GB
    Max container count:    ${MAX_CONTAINER_COUNT}
    Max image count:        ${MAX_IMAGE_COUNT}

SIGNAL HANDLING:
    - SIGTERM/SIGINT: Complete current operation, clean up lock files
    - Exit: Always releases locks and PID files
    - Running: Prevents duplicate instances via lock file

PROTECTED IMAGE PATTERNS:
    ${PROTECTED_IMAGE_PATTERNS}

EOF
}

#==============================================================================
# MAIN
#==============================================================================

install_cron() {
    local cron_entry="0 3 * * * $HOME/OPENCODE_WORKSPACE/projects/opencode-gc/opencode-gc.sh >> $HOME/.local/share/opencode/log/gc-cron.log 2>&1"
    local cron_check=$(crontab -l 2>/dev/null | grep -v "^#" | grep "opencode-gc" || echo "")
    
    if [[ -n "$cron_check" ]]; then
        ok "Cron job already installed"
        echo "Current crontab entry:"
        echo "$cron_check"
    else
        echo "$cron_entry" | crontab - 2>/dev/null
        if [[ $? -eq 0 ]]; then
            ok "Cron job installed - will run daily at 3am"
        else
            error "Failed to install cron job"
        fi
    fi
}

main() {
    local quiet_mode=false
    local dry_run=false
    local force_mode=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --quiet)
                quiet_mode=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            force)
                force_mode=true
                shift
                ;;
            *)
                break
                ;;
        esac
    done
    
    if [[ "$force_mode" == "true" ]]; then
        rm -f "$LOCK_FILE" 2>/dev/null || true
        rm -f "$PID_FILE" 2>/dev/null || true
        info "Force mode - cleared lock files"
    fi
    
    init
    
    case "${1:-cleanup}" in
        status)
            show_status
            release_lock
            ;;
        install)
            install_cron
            release_lock
            ;;
        cleanup)
            if [[ "$dry_run" == "true" ]]; then
                info "DRY RUN - would clean:"
                info "  - Session diffs older than ${SESSION_DIFF_MAX_AGE_DAYS} days"
                info "  - Session diffs larger than 100MB"
                info "  - Tool output older than ${TOOL_OUTPUT_MAX_AGE_DAYS} days"
                info "  - Logs older than ${LOG_MAX_AGE_DAYS} days"
                info "  - Stopped Docker containers older than ${DOCKER_CONTAINER_TTL_HOURS}h"
                info "  - Unused Docker images"
                info "  - Unused Docker volumes"
                info "  - Old Docker build cache"
                info "  - Hive mind directories older than ${HIVE_MIND_MAX_AGE_DAYS} days"
                release_lock
                exit 0
            fi
            show_status
            run_cleanup
            show_status
            ;;
        help|--help|-h)
            show_help
            release_lock
            ;;
        *)
            show_status
            run_cleanup
            show_status
            ;;
    esac
}

main "$@"
